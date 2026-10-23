import { isTileMask, MIRROR_CORNERS, type MirrorShape } from "./tile";

export const COLOURS = ["amber", "rose", "jade", "azure", "violet"] as const;
export type Colour = (typeof COLOURS)[number];

export type Clue =
  | { readonly kind: "lantern"; readonly colour: Colour }
  | { readonly kind: "mirror"; readonly shape: MirrorShape }
  | { readonly kind: "gate"; readonly colour: Colour };

export interface Cell {
  readonly kind: "open" | "stone";
  readonly clue?: Clue;
  readonly fixed?: number;
  readonly stone?: number;
}

export interface Puzzle {
  readonly id: string;
  readonly size: number;
  readonly cells: readonly Cell[];
}

export const MIN_SIZE = 4;
export const MAX_SIZE = 9;
export const TUTORIAL_PREFIX = "tutorial-";

export function colourBit(colour: Colour): number {
  return 1 << COLOURS.indexOf(colour);
}

export function isColour(value: unknown): value is Colour {
  return typeof value === "string" && (COLOURS as readonly string[]).includes(value);
}

export function openCell(clue?: Clue, fixed?: number): Cell {
  return {
    kind: "open",
    ...(clue === undefined ? {} : { clue }),
    ...(fixed === undefined || fixed === 0 ? {} : { fixed }),
  };
}

export function stoneCell(stone: number): Cell {
  return { kind: "stone", stone };
}

export function lantern(colour: Colour = "amber", fixed?: number): Cell {
  return openCell({ kind: "lantern", colour }, fixed);
}

export function mirror(shape: MirrorShape, fixed?: number): Cell {
  return openCell({ kind: "mirror", shape }, fixed);
}

export function gate(colour: Colour, fixed?: number): Cell {
  return openCell({ kind: "gate", colour }, fixed);
}

export function cellIndex(size: number, row: number, col: number): number {
  return row * size + col;
}

export function rowOf(size: number, index: number): number {
  return Math.floor(index / size);
}

export function colOf(size: number, index: number): number {
  return index % size;
}

/** In-bounds orthogonal neighbours of cell i in N, E, S, W order. */
export function neighbours(size: number, i: number): number[] {
  const row = rowOf(size, i);
  const col = colOf(size, i);
  const out: number[] = [];
  if (row > 0) out.push(i - size);
  if (col < size - 1) out.push(i + 1);
  if (row < size - 1) out.push(i + size);
  if (col > 0) out.push(i - 1);
  return out;
}

export function cellAt(puzzle: Puzzle, i: number): Cell {
  return puzzle.cells[i] ?? { kind: "stone", stone: 0 };
}

export function allowedFixed(cell: Cell): readonly number[] {
  const clue = cell.clue;
  if (clue?.kind === "mirror") return MIRROR_CORNERS[clue.shape];
  if (clue?.kind === "gate") return [10, 5];
  return [10, 5, 3, 6, 12, 9];
}

export type ShapeErrorCode =
  | "size"
  | "cell-count"
  | "stone-number"
  | "stone-clue"
  | "stone-fixed"
  | "bad-clue"
  | "illegal-fixed"
  | "anchor-mismatch";

export interface ShapeError {
  readonly code: ShapeErrorCode;
  readonly cell: number | null;
  readonly message: string;
}

export type ShapeResult = { readonly ok: true } | { readonly ok: false; errors: ShapeError[] };

function clueError(cell: Cell): boolean {
  const clue = cell.clue;
  if (clue === undefined) return false;
  if (clue.kind === "mirror") return clue.shape !== "/" && clue.shape !== "\\";
  if (clue.kind === "lantern" || clue.kind === "gate") return !isColour(clue.colour);
  return true;
}

export function isTutorialId(id: string): boolean {
  return id.startsWith(TUTORIAL_PREFIX);
}

/** Size 4 to 9 (4 only for ids starting with "tutorial-"), anchors legal for their clue. */
export function validatePuzzleShape(puzzle: Puzzle): ShapeResult {
  const errors: ShapeError[] = [];
  const { size } = puzzle;
  const minSize = isTutorialId(puzzle.id) ? MIN_SIZE : MIN_SIZE + 1;
  if (!Number.isInteger(size) || size < minSize || size > MAX_SIZE) {
    errors.push({
      code: "size",
      cell: null,
      message: `size ${size} is outside ${minSize}-${MAX_SIZE}`,
    });
  }
  if (puzzle.cells.length !== size * size) {
    errors.push({ code: "cell-count", cell: null, message: "cell count does not match size" });
    return { ok: false, errors };
  }
  puzzle.cells.forEach((cell, i) => {
    const fail = (code: ShapeErrorCode, message: string) => errors.push({ code, cell: i, message });
    if (clueError(cell)) fail("bad-clue", "unknown clue");
    if (cell.kind === "stone") {
      const n = cell.stone;
      if (n === undefined || !Number.isInteger(n) || n < 0 || n > 4)
        fail("stone-number", "stone must be 0 to 4");
      if (cell.clue !== undefined) fail("stone-clue", "stone cannot carry a clue");
      if (cell.fixed !== undefined) fail("stone-fixed", "stone cannot hold a tile");
      return;
    }
    if (cell.stone !== undefined) fail("stone-number", "open cell cannot carry a stone number");
    if (cell.fixed === undefined) return;
    if (!isTileMask(cell.fixed)) {
      fail("illegal-fixed", "fixed value is not one of the six tiles");
    } else if (!allowedFixed(cell).includes(cell.fixed)) {
      fail("anchor-mismatch", "fixed tile does not satisfy the cell clue");
    }
  });
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
