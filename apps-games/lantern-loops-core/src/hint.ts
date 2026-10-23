import type { Locked, Tiles } from "./board";
import { cellAt, type Puzzle } from "./puzzle";
import { propagate } from "./solver";

export interface Hint {
  readonly cell: number;
  readonly mask: number;
}

/**
 * Among unlocked open cells whose tile differs from the solution, prefer one forced by
 * propagation from the currently correct tiles, otherwise the first one in row-major order.
 */
export function pickHint(
  puzzle: Puzzle,
  tiles: Tiles,
  solution: Tiles,
  locked: Locked,
): Hint | null {
  const total = puzzle.size * puzzle.size;
  const mismatched: number[] = [];
  const known = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    if (cellAt(puzzle, i).kind === "stone") continue;
    const want = solution[i] ?? 0;
    const have = tiles[i] ?? 0;
    if (have === want) {
      known[i] = want;
    } else if ((locked[i] ?? 0) === 0) {
      mismatched.push(i);
    }
  }
  const first = mismatched[0];
  if (first === undefined) return null;
  const result = propagate(puzzle, known);
  if (!result.contradiction) {
    const forced = new Set(result.forced.map((f) => f.cell));
    const pick = mismatched.find((i) => forced.has(i));
    if (pick !== undefined) return { cell: pick, mask: solution[pick] ?? 0 };
  }
  return { cell: first, mask: solution[first] ?? 0 };
}

/** Places the hinted tile and adds the cell to the locked set; inputs are not modified. */
export function applyHint(
  tiles: Tiles,
  locked: Locked,
  hint: Hint,
): { tiles: Tiles; locked: Locked } {
  const nextTiles = tiles.slice();
  const nextLocked = locked.slice();
  nextTiles[hint.cell] = hint.mask;
  nextLocked[hint.cell] = 1;
  return { tiles: nextTiles, locked: nextLocked };
}
