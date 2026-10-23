import { describe, expect, it } from "vitest";
import { emptyTiles, lockedMask } from "../src/board";
import {
  type Brush,
  dragPath,
  eraseCells,
  isEditable,
  longPressErase,
  tapCell,
  tapValue,
} from "../src/edit";
import { DIRS, type Dir, E, isLegalTile, N, opposite, S, W } from "../src/tile";
import { grid, puzzleFromSolution, randomSolution } from "./helpers/fixtures";
import { createRng } from "./helpers/rng";

const B = ". . . . .";
const BLANK = grid([B, B, B, B, B]);
const NO_LOCK = new Uint8Array(25);
const STARTS = [0, 10, 5, 3, 6, 12, 9];

describe("tapCell", () => {
  const straightNext: Record<number, number> = { 0: 10, 10: 5, 5: 0, 3: 10, 6: 10, 12: 10, 9: 10 };
  const cornerNext: Record<number, number> = { 0: 3, 3: 6, 6: 12, 12: 9, 9: 0, 10: 3, 5: 3 };

  it.each(STARTS)("straight brush from %i", (start) => {
    expect(tapValue(start, "straight")).toBe(straightNext[start]);
  });

  it.each(STARTS)("corner brush from %i", (start) => {
    expect(tapValue(start, "corner")).toBe(cornerNext[start]);
  });

  it.each(STARTS)("erase brush from %i", (start) => {
    expect(tapValue(start, "erase")).toBe(0);
  });

  it("applies the cycle to the board and reports changed cells", () => {
    let tiles = emptyTiles(BLANK);
    const seen: number[] = [];
    for (let k = 0; k < 4; k++) {
      const result = tapCell(BLANK, tiles, NO_LOCK, 12, "straight");
      tiles = result.tiles;
      seen.push(tiles[12] ?? -1);
      expect(result.changed).toEqual([12]);
    }
    expect(seen).toEqual([10, 5, 0, 10]);
    const corners: number[] = [];
    tiles = emptyTiles(BLANK);
    for (let k = 0; k < 6; k++) {
      tiles = tapCell(BLANK, tiles, NO_LOCK, 12, "corner").tiles;
      corners.push(tiles[12] ?? -1);
    }
    expect(corners).toEqual([3, 6, 12, 9, 0, 3]);
  });

  it("converts between families", () => {
    const corner = tapCell(
      BLANK,
      Uint8Array.from({ length: 25 }, (_, i) => (i === 3 ? 12 : 0)),
      NO_LOCK,
      3,
      "straight",
    );
    expect(corner.tiles[3]).toBe(10);
    const straight = tapCell(
      BLANK,
      Uint8Array.from({ length: 25 }, (_, i) => (i === 3 ? 5 : 0)),
      NO_LOCK,
      3,
      "corner",
    );
    expect(straight.tiles[3]).toBe(3);
  });

  it("erases with the erase brush and ignores empty cells", () => {
    const tiles = Uint8Array.from({ length: 25 }, (_, i) => (i === 7 ? 10 : 0));
    expect(tapCell(BLANK, tiles, NO_LOCK, 7, "erase").tiles[7]).toBe(0);
    const noop = tapCell(BLANK, tiles, NO_LOCK, 8, "erase");
    expect(noop.changed).toEqual([]);
    expect(noop.tiles).toBe(tiles);
  });

  it("never edits stones, fixed or locked cells and never mutates its input", () => {
    const puzzle = grid(["S1 . . . .", ". La=6 . . .", B, B, B]);
    const tiles = emptyTiles(puzzle);
    const locked = lockedMask(puzzle, [12]);
    for (const i of [0, 6, 12]) {
      for (const brush of ["straight", "corner", "erase"] as Brush[]) {
        const result = tapCell(puzzle, tiles, locked, i, brush);
        expect(result.changed).toEqual([]);
        expect(result.tiles[i]).toBe(tiles[i]);
      }
    }
    const before = tiles.slice();
    tapCell(puzzle, tiles, locked, 2, "corner");
    expect(Array.from(tiles)).toEqual(Array.from(before));
    expect(isEditable(puzzle, locked, 2)).toBe(true);
    expect(isEditable(puzzle, locked, -1)).toBe(false);
    expect(isEditable(puzzle, locked, 25)).toBe(false);
  });
});

const DELTA: Record<number, number> = { [N]: -5, [E]: 1, [S]: 5, [W]: -1 };

function step(dir: Dir): number {
  return DELTA[dir] ?? 0;
}

describe("dragPath", () => {
  const start = 12;

  it.each(DIRS)("draws a straight line towards direction %i", (dir) => {
    const cells = [start, start + step(dir), start + 2 * step(dir)];
    const result = dragPath(BLANK, emptyTiles(BLANK), NO_LOCK, cells);
    const straight = dir | opposite(dir);
    expect(cells.map((c) => result.tiles[c])).toEqual([straight, straight, straight]);
    expect(result.changed).toEqual([...cells].sort((a, b) => a - b));
  });

  const turns: Array<[Dir, Dir]> = [];
  for (const first of DIRS) {
    for (const second of DIRS) {
      if (second !== first && second !== opposite(first)) turns.push([first, second]);
    }
  }

  it("has all 8 first/second direction combinations", () => {
    expect(turns).toHaveLength(8);
  });

  it.each(turns)("draws an L going %i then %i", (first, second) => {
    const mid = start + step(first);
    const end = mid + step(second);
    const result = dragPath(BLANK, emptyTiles(BLANK), NO_LOCK, [start, mid, end]);
    expect(result.tiles[start]).toBe(first | opposite(first));
    expect(result.tiles[mid]).toBe(opposite(first) | second);
    expect(result.tiles[end]).toBe(second | opposite(second));
  });

  it("draws a closed ring when the drag returns to its start", () => {
    const ring = [6, 7, 12, 11, 6];
    const result = dragPath(BLANK, emptyTiles(BLANK), NO_LOCK, ring);
    expect([6, 7, 11, 12].map((c) => result.tiles[c])).toEqual([6, 12, 3, 9]);
  });

  it("overwrites its own tiles but skips stones, fixed and locked cells", () => {
    const puzzle = grid([B, ". S2 . . .", ". . La=5 . .", B, B]);
    const base = emptyTiles(puzzle);
    base[10] = 3;
    base[11] = 5;
    const locked = lockedMask(puzzle, [13]);
    base[13] = 6;
    const result = dragPath(puzzle, base, locked, [10, 11, 12, 13, 14]);
    expect(result.tiles[10]).toBe(10);
    expect(result.tiles[11]).toBe(10);
    expect(result.tiles[12]).toBe(5);
    expect(result.tiles[13]).toBe(6);
    expect(result.tiles[14]).toBe(10);
    expect(result.changed).toEqual([10, 11, 14]);
    const overStone = dragPath(puzzle, emptyTiles(puzzle), locked, [5, 6, 7]);
    expect(overStone.tiles[6]).toBe(0);
    expect(overStone.changed).toEqual([]);
  });

  it("splits the path at non-adjacent jumps and ignores single cells", () => {
    const result = dragPath(BLANK, emptyTiles(BLANK), NO_LOCK, [0, 1, 3, 4, 20]);
    expect([0, 1, 3, 4, 20].map((c) => result.tiles[c])).toEqual([10, 10, 10, 10, 0]);
    expect(dragPath(BLANK, emptyTiles(BLANK), NO_LOCK, [7]).changed).toEqual([]);
    expect(dragPath(BLANK, emptyTiles(BLANK), NO_LOCK, []).changed).toEqual([]);
    expect(dragPath(BLANK, emptyTiles(BLANK), NO_LOCK, [7, 7, 7]).changed).toEqual([]);
  });

  it("shortens the path when the drag backs up", () => {
    const result = dragPath(BLANK, emptyTiles(BLANK), NO_LOCK, [10, 11, 12, 11]);
    expect([10, 11, 12].map((c) => result.tiles[c])).toEqual([10, 10, 0]);
  });

  it("ignores out-of-range cells", () => {
    const result = dragPath(BLANK, emptyTiles(BLANK), NO_LOCK, [-3, 0, 1, 99]);
    expect(result.changed).toEqual([0, 1]);
  });

  it("reports no change when the drawn tiles are already there", () => {
    const first = dragPath(BLANK, emptyTiles(BLANK), NO_LOCK, [0, 1, 2]);
    const again = dragPath(BLANK, first.tiles, NO_LOCK, [0, 1, 2]);
    expect(again.changed).toEqual([]);
  });
});

describe("erase", () => {
  it("clears cells and skips locked ones", () => {
    const puzzle = grid([B, B, B, B, B]);
    const tiles = Uint8Array.from({ length: 25 }, (_, i) => (i < 5 ? 10 : 0));
    const locked = new Uint8Array(25);
    locked[2] = 1;
    const result = eraseCells(puzzle, tiles, locked, [0, 1, 2, 9]);
    expect(Array.from(result.tiles.slice(0, 5))).toEqual([0, 0, 10, 10, 10]);
    expect(result.changed).toEqual([0, 1]);
    expect(longPressErase(puzzle, tiles, locked, 3).tiles[3]).toBe(0);
    expect(longPressErase(puzzle, tiles, locked, 2).changed).toEqual([]);
  });
});

describe("edit fuzz", () => {
  it("keeps stones empty, locked cells untouched and every mask legal over 2,000 operations", () => {
    const rng = createRng(2026);
    const solution = randomSolution(7, rng, 3);
    const puzzle = puzzleFromSolution(
      solution,
      rng,
      { stone: 0.5, lantern: 0.3, mirror: 0.3, gate: 0.3, fixed: 0.2, colours: 3 },
      "fuzz",
    );
    const total = 49;
    const hints = puzzle.cells
      .map((cell, i) => (cell.kind === "open" && cell.fixed === undefined ? i : -1))
      .filter((i) => i >= 0)
      .slice(3, 6);
    expect(hints).toHaveLength(3);
    const locked = lockedMask(puzzle, hints);
    let tiles = emptyTiles(puzzle);
    for (const h of hints) tiles[h] = rng.pick([10, 5, 3, 6, 12, 9]);
    const frozen = tiles.slice();
    const brushes: Brush[] = ["straight", "corner", "erase"];
    for (let step = 0; step < 2000; step++) {
      const roll = rng.next();
      let result: { tiles: Uint8Array; changed: number[] };
      if (roll < 0.45) {
        result = tapCell(puzzle, tiles, locked, rng.int(total), rng.pick(brushes));
      } else if (roll < 0.85) {
        const length = 1 + rng.int(9);
        let at = rng.int(total);
        const path = [at];
        for (let k = 0; k < length; k++) {
          at = rng.chance(0.15)
            ? rng.int(total)
            : Math.max(0, Math.min(total - 1, at + rng.pick([-7, -1, 1, 7])));
          path.push(at);
        }
        result = dragPath(puzzle, tiles, locked, path);
      } else if (roll < 0.95) {
        result = eraseCells(puzzle, tiles, locked, [
          rng.int(total),
          rng.int(total),
          rng.int(total),
        ]);
      } else {
        result = longPressErase(puzzle, tiles, locked, rng.int(total));
      }
      const diff: number[] = [];
      for (let i = 0; i < total; i++) if (result.tiles[i] !== tiles[i]) diff.push(i);
      expect(result.changed).toEqual(diff);
      if (result.changed.length === 0) expect(result.tiles).toBe(tiles);
      tiles = result.tiles;
      for (let i = 0; i < total; i++) {
        const cell = puzzle.cells[i];
        expect(isLegalTile(tiles[i] ?? 99)).toBe(true);
        if (cell?.kind === "stone") expect(tiles[i]).toBe(0);
        if ((locked[i] ?? 0) === 1) expect(tiles[i]).toBe(frozen[i]);
      }
    }
  });
});
