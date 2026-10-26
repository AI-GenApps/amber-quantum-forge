import { HINT_NODE_CAP } from "./constants";
import { quickStars, sanitizeLook } from "./score";
import { hasOnePieceRule, normalizeLook, SLOT_ORDER, SLOT_SETS } from "./slots";
import type { Category, ChallengeShape, Look, Piece, Slot, SlotSetId } from "./types";

export const UNKNOWN = "UNKNOWN" as const;

export type SolveResult = Look | null | typeof UNKNOWN;

export interface SolveOptions {
  readonly maxVisited?: number;
}

export interface Hint {
  readonly slot: Slot;
  readonly pieceId: string;
  readonly source: "solver" | "reference";
}

const BASE_SLOTS: readonly Slot[] = ["top", "bottom", "dress"];

function pool(closet: readonly Piece[], category: Category, locked: Look): readonly Piece[] {
  const lockedId = locked[category];
  const ofCategory = closet.filter((piece) => piece.category === category);
  if (lockedId === undefined) return ofCategory;
  return ofCategory.filter((piece) => piece.id === lockedId);
}

function lockedIsValid(set: SlotSetId, closet: readonly Piece[], locked: Look): boolean {
  const open = SLOT_SETS[set];
  for (const slot of SLOT_ORDER) {
    const id = locked[slot];
    if (id === undefined) continue;
    if (!open.includes(slot)) return false;
    if (!closet.some((piece) => piece.id === id && piece.category === slot)) return false;
  }
  if (hasOnePieceRule(set) && locked.dress !== undefined) {
    if (locked.top !== undefined || locked.bottom !== undefined) return false;
  }
  return true;
}

function* baseOptions(
  set: SlotSetId,
  closet: readonly Piece[],
  locked: Look,
): Generator<readonly Piece[]> {
  const open = SLOT_SETS[set];
  const dresses = pool(closet, "dress", locked);
  const tops = pool(closet, "top", locked);
  const bottoms = pool(closet, "bottom", locked);
  const dressOpen = open.includes("dress");
  const pairOpen = open.includes("top") && open.includes("bottom");
  const lockedPair = locked.top !== undefined || locked.bottom !== undefined;
  if (dressOpen && !(pairOpen && lockedPair)) {
    for (const dress of dresses) yield [dress];
  }
  if (pairOpen && locked.dress === undefined) {
    for (const top of tops) for (const bottom of bottoms) yield [top, bottom];
  }
}

function* walk(
  set: SlotSetId,
  closet: readonly Piece[],
  locked: Look,
  stack: Piece[],
): Generator<readonly Piece[]> {
  const others = SLOT_ORDER.filter(
    (slot) => SLOT_SETS[set].includes(slot) && !BASE_SLOTS.includes(slot),
  );
  const pools = others.map((slot) => pool(closet, slot, locked));
  function* rec(depth: number): Generator<readonly Piece[]> {
    if (depth === pools.length) {
      yield stack;
      return;
    }
    for (const piece of pools[depth] as readonly Piece[]) {
      stack.push(piece);
      yield* rec(depth + 1);
      stack.pop();
    }
  }
  for (const base of baseOptions(set, closet, locked)) {
    stack.length = 0;
    for (const piece of base) stack.push(piece);
    yield* rec(0);
  }
  stack.length = 0;
}

function* candidates(
  set: SlotSetId,
  closet: readonly Piece[],
  locked: Look,
): Generator<readonly Piece[]> {
  if (!lockedIsValid(set, closet, locked)) return;
  yield* walk(set, closet, locked, []);
}

function lookOf(pieces: readonly Piece[]): Look {
  const look: Look = {};
  for (const piece of pieces) look[piece.category] = piece.id;
  return normalizeLook(look);
}

export function* enumerateLooks(set: SlotSetId, closet: readonly Piece[]): Generator<Look> {
  for (const pieces of candidates(set, closet, {})) yield lookOf(pieces);
}

export function countLooks(set: SlotSetId, closet: readonly Piece[]): number {
  const count = (category: Category): number =>
    closet.filter((piece) => piece.category === category).length;
  const open = SLOT_SETS[set];
  let total = 1;
  for (const slot of open) {
    if (!BASE_SLOTS.includes(slot)) total *= count(slot);
  }
  const dressMode = open.includes("dress") ? count("dress") : 0;
  const pairMode =
    open.includes("top") && open.includes("bottom") ? count("top") * count("bottom") : 0;
  return total * (dressMode + pairMode);
}

export function solveLook(
  challenge: ChallengeShape,
  closet: readonly Piece[],
  locked: Look,
  options: SolveOptions = {},
): SolveResult {
  const maxVisited = options.maxVisited ?? HINT_NODE_CAP;
  let visited = 0;
  for (const pieces of candidates(challenge.slotSet, closet, locked)) {
    if (visited >= maxVisited) return UNKNOWN;
    visited += 1;
    if (quickStars(challenge.rules, pieces) === 3) return lookOf(pieces);
  }
  return null;
}

export function pickHint(
  challenge: ChallengeShape,
  closet: readonly Piece[],
  look: Look,
  reference: Look,
  options: SolveOptions = {},
): Hint | null {
  const board = sanitizeLook(challenge.slotSet, closet, look);
  const solved = solveLook(challenge, closet, board, options);
  const fromSolver = solved !== null && solved !== UNKNOWN;
  const target = fromSolver ? solved : reference;
  const source = fromSolver ? "solver" : "reference";
  for (const slot of SLOT_ORDER) {
    const wanted = target[slot];
    if (wanted !== undefined && board[slot] !== wanted) {
      return { slot, pieceId: wanted, source };
    }
  }
  return null;
}
