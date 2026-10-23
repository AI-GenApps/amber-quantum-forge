import type { Locked, Tiles } from "./board";
import { stepCell } from "./loops";
import { cellAt, type Puzzle } from "./puzzle";
import {
  bitCount,
  CORNER_CYCLE,
  DIRS,
  type Dir,
  isCorner,
  isStraight,
  nextInCycle,
  opposite,
  STRAIGHT_CYCLE,
} from "./tile";

export type Brush = "straight" | "corner" | "erase";

export interface EditResult {
  readonly tiles: Tiles;
  /** Cells whose value changed; empty means the edit was a no-op (record no undo step). */
  readonly changed: number[];
}

export function isEditable(puzzle: Puzzle, locked: Locked, i: number): boolean {
  if (i < 0 || i >= puzzle.size * puzzle.size) return false;
  const cell = cellAt(puzzle, i);
  return cell.kind === "open" && cell.fixed === undefined && (locked[i] ?? 0) === 0;
}

function apply(tiles: Tiles, writes: Map<number, number>): EditResult {
  const next = tiles.slice();
  const changed: number[] = [];
  for (const [i, mask] of [...writes.entries()].sort((a, b) => a[0] - b[0])) {
    if (next[i] === mask) continue;
    next[i] = mask;
    changed.push(i);
  }
  return changed.length === 0 ? { tiles, changed } : { tiles: next, changed };
}

/** The value a tap on a cell holding `current` produces with the given brush. */
export function tapValue(current: number, brush: Brush): number {
  if (brush === "erase") return 0;
  const cycle = brush === "straight" ? STRAIGHT_CYCLE : CORNER_CYCLE;
  const family = brush === "straight" ? isStraight(current) : isCorner(current);
  if (current !== 0 && !family) return cycle[1] as number;
  return nextInCycle(cycle, current) ?? (cycle[1] as number);
}

export function tapCell(
  puzzle: Puzzle,
  tiles: Tiles,
  locked: Locked,
  i: number,
  brush: Brush,
): EditResult {
  if (!isEditable(puzzle, locked, i)) return { tiles, changed: [] };
  return apply(tiles, new Map([[i, tapValue(tiles[i] ?? 0, brush)]]));
}

export function eraseCells(
  puzzle: Puzzle,
  tiles: Tiles,
  locked: Locked,
  cells: readonly number[],
): EditResult {
  const writes = new Map<number, number>();
  for (const i of cells) {
    if (isEditable(puzzle, locked, i)) writes.set(i, 0);
  }
  return apply(tiles, writes);
}

export function longPressErase(
  puzzle: Puzzle,
  tiles: Tiles,
  locked: Locked,
  i: number,
): EditResult {
  return eraseCells(puzzle, tiles, locked, [i]);
}

function dirBetween(size: number, from: number, to: number): Dir | null {
  for (const dir of DIRS) {
    if (stepCell(size, from, dir) === to) return dir;
  }
  return null;
}

/** Splits a visited-cell list into runs of adjacent cells; stones, repeats and U-turns are folded. */
function segmentsOf(puzzle: Puzzle, cells: readonly number[]): number[][] {
  const segments: number[][] = [];
  let run: number[] = [];
  const flush = (): void => {
    if (run.length > 1) segments.push(run);
    run = [];
  };
  for (const i of cells) {
    if (i < 0 || i >= puzzle.size * puzzle.size || cellAt(puzzle, i).kind === "stone") {
      flush();
      continue;
    }
    const last = run[run.length - 1];
    if (last === i) continue;
    if (last !== undefined && dirBetween(puzzle.size, last, i) === null) flush();
    if (run.length >= 2 && run[run.length - 2] === i) run.pop();
    else run.push(i);
  }
  flush();
  return segments;
}

function pathMasks(size: number, segment: readonly number[]): Map<number, number> {
  const bits = new Map<number, number>();
  const lastVisit = new Map<number, number>();
  segment.forEach((cell, k) => {
    let visit = 0;
    const prev = segment[k - 1];
    const next = segment[k + 1];
    if (prev !== undefined) visit |= dirBetween(size, cell, prev) ?? 0;
    if (next !== undefined) visit |= dirBetween(size, cell, next) ?? 0;
    bits.set(cell, (bits.get(cell) ?? 0) | visit);
    lastVisit.set(cell, visit);
  });
  const masks = new Map<number, number>();
  const complete = (value: number): number =>
    bitCount(value) === 1 ? value | opposite(value as Dir) : value;
  for (const [cell, accumulated] of bits) {
    const count = bitCount(accumulated);
    masks.set(cell, complete(count <= 2 ? accumulated : (lastVisit.get(cell) ?? 0)));
  }
  return masks;
}

/**
 * Draws a path: each visited cell gets the tile joining its previous and next cell, the first and
 * last cell get a straight tile along the drag. Stones break the path; fixed and locked cells
 * keep their tile. Non-adjacent jumps split the drag into separate paths.
 */
export function dragPath(
  puzzle: Puzzle,
  tiles: Tiles,
  locked: Locked,
  cells: readonly number[],
): EditResult {
  const writes = new Map<number, number>();
  for (const segment of segmentsOf(puzzle, cells)) {
    for (const [cell, mask] of pathMasks(puzzle.size, segment)) {
      if (isEditable(puzzle, locked, cell)) writes.set(cell, mask);
    }
  }
  return apply(tiles, writes);
}
