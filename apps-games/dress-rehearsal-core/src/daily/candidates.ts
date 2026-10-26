import { ALL_COLOURS, ERA_ORDER, FEATURES } from "../constants";
import type { Prng } from "../prng";
import { chromaticColours } from "../rules";
import { normalizeLook, SLOT_SETS } from "../slots";
import type { Category, Look, MaxHues, Piece, Rule, SlotSetId } from "../types";

export type Pools = ReadonlyMap<Category, readonly Piece[]>;

export function poolsOf(closet: readonly Piece[]): Pools {
  const pools = new Map<Category, Piece[]>();
  for (const piece of closet) {
    const list = pools.get(piece.category) ?? [];
    list.push(piece);
    pools.set(piece.category, list);
  }
  return pools;
}

const BASE: readonly Category[] = ["top", "bottom", "dress"];

export function randomLook(set: SlotSetId, pools: Pools, rnd: Prng): Piece[] | null {
  const open = SLOT_SETS[set];
  const pair = open.includes("top") && open.includes("bottom");
  const dressOpen = open.includes("dress");
  const dressDrawn = dressOpen ? rnd.next() < 0.3 : false;
  const useDress = dressOpen && (!pair || dressDrawn);
  const wanted: Category[] = open.filter((slot) => !BASE.includes(slot));
  wanted.push(...(useDress ? (["dress"] as const) : (["top", "bottom"] as const)));
  const out: Piece[] = [];
  for (const category of wanted) {
    const pool = pools.get(category);
    if (pool === undefined || pool.length === 0) return null;
    out.push(rnd.pick(pool));
  }
  return out;
}

export function lookOf(pieces: readonly Piece[]): Look {
  const look: Look = {};
  for (const piece of pieces) look[piece.category] = piece.id;
  return normalizeLook(look);
}

function roundUp10(value: number): number {
  return Math.ceil(value / 10) * 10;
}

export function candidateRules(
  pieces: readonly Piece[],
  closet: readonly Piece[],
  rnd: Prng,
): Rule[] {
  const out: Rule[] = [];
  const hues = chromaticColours(pieces);
  const warm = ["pink", "red", "orange", "yellow"];
  const cool = ["mint", "teal", "sky", "blue", "violet"];
  if (hues.length > 0 && hues.every((hue) => warm.includes(hue)))
    out.push({ kind: "palette-warm" });
  if (hues.length > 0 && hues.every((hue) => cool.includes(hue)))
    out.push({ kind: "palette-cool" });
  if (hues.length <= 2) out.push({ kind: "max-hues", max: hues.length as MaxHues });
  for (const colour of hues) out.push({ kind: "include-colour", colour });
  const present = new Set(pieces.map((piece) => piece.colour));
  for (const colour of ALL_COLOURS) {
    if (!present.has(colour) && closet.some((piece) => piece.colour === colour)) {
      out.push({ kind: "avoid-colour", colour });
    }
  }
  const eras = pieces.map((piece) => ERA_ORDER.indexOf(piece.era));
  const oldest = Math.min(...eras);
  const newest = Math.max(...eras);
  const oldestEra = ERA_ORDER[oldest];
  const newestEra = ERA_ORDER[newest];
  if (oldest > 0 && oldestEra !== undefined) out.push({ kind: "era-min", era: oldestEra });
  if (newest < ERA_ORDER.length - 1 && newestEra !== undefined) {
    out.push({ kind: "era-max", era: newestEra });
  }
  const formality = pieces.map((piece) => piece.formality);
  if (Math.min(...formality) > 1)
    out.push({ kind: "formality-min", value: Math.min(...formality) });
  if (Math.max(...formality) < 5)
    out.push({ kind: "formality-max", value: Math.max(...formality) });
  const warmth = pieces.reduce((sum, piece) => sum + piece.warmth, 0);
  out.push({ kind: "warmth-min", value: Math.max(1, warmth - (rnd.next() < 0.5 ? 0 : 1)) });
  out.push({ kind: "warmth-max", value: warmth + (rnd.next() < 0.5 ? 0 : 1) });
  for (const feature of FEATURES) {
    if (pieces.some((piece) => piece.features.includes(feature))) {
      out.push({ kind: "needs-feature", feature });
    }
  }
  const price = pieces.reduce((sum, piece) => sum + piece.price, 0);
  out.push({ kind: "max-spend", amount: roundUp10(price + 5) });
  out.push({ kind: "min-spend", amount: Math.max(0, Math.floor((price - 5) / 10) * 10) });
  const ids = new Set(pieces.map((piece) => piece.id));
  for (const piece of pieces) out.push({ kind: "include-piece", pieceId: piece.id });
  for (const piece of closet) {
    if (!ids.has(piece.id) && pieces.some((other) => other.category === piece.category)) {
      out.push({ kind: "avoid-piece", pieceId: piece.id });
    }
  }
  return out;
}
