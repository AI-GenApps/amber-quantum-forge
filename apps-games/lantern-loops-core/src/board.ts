import type { Puzzle } from "./puzzle";

export type Tiles = Uint8Array;
/** One byte per cell: 1 when the cell may not be edited (fixed or hint-locked). */
export type Locked = Uint8Array;

/** A board holding only the fixed tiles of the puzzle. */
export function emptyTiles(puzzle: Puzzle): Tiles {
  const tiles = new Uint8Array(puzzle.size * puzzle.size);
  puzzle.cells.forEach((cell, i) => {
    if (cell.kind === "open" && cell.fixed !== undefined) tiles[i] = cell.fixed;
  });
  return tiles;
}

export function withTile(tiles: Tiles, i: number, mask: number): Tiles {
  const copy = tiles.slice();
  copy[i] = mask;
  return copy;
}

export function equalTiles(a: Tiles, b: Tiles): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Cells that edits may not change: every fixed tile plus the given hint cells. */
export function lockedMask(puzzle: Puzzle, hintCells: Iterable<number> = []): Locked {
  const locked = new Uint8Array(puzzle.size * puzzle.size);
  puzzle.cells.forEach((cell, i) => {
    if (cell.kind === "open" && cell.fixed !== undefined) locked[i] = 1;
  });
  for (const i of hintCells) {
    if (i >= 0 && i < locked.length) locked[i] = 1;
  }
  return locked;
}

export function countTiles(tiles: Tiles): number {
  let n = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] !== 0) n++;
  }
  return n;
}
