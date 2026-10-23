import { describe, expect, it } from "vitest";
import { emptyTiles, lockedMask } from "../src/board";
import { decodeTiles } from "../src/code";
import { dragPath, tapCell } from "../src/edit";
import { applyHint, pickHint } from "../src/hint";
import { solveOne } from "../src/solver";
import { grid, puzzleFromSolution, puzzleOf, randomSolution, tilesFrom } from "./helpers/fixtures";
import { createRng } from "./helpers/rng";

const B = ". . . . .";
const NO_LOCK = new Uint8Array(25);
const RING = tilesFrom(["┌┐...", "└┘...", ".....", ".....", "....."]);

describe("pickHint", () => {
  it("falls back to the first mismatched cell in row-major order", () => {
    const puzzle = grid([B, ". La . . .", B, B, B]);
    const hint = pickHint(puzzle, new Uint8Array(25), RING, NO_LOCK);
    expect(hint).toEqual({ cell: 0, mask: 6 });
  });

  it("prefers a cell forced by propagation over an earlier unforced one", () => {
    const puzzle = grid(["La . . . .", B, B, B, B]);
    const tiles = new Uint8Array(25);
    tiles[0] = 6;
    tiles[1] = 12;
    tiles[5] = 3;
    tiles[3] = 10;
    const hint = pickHint(puzzle, tiles, RING, NO_LOCK);
    expect(hint).toEqual({ cell: 6, mask: 9 });
  });

  it("returns null when the board matches the solution", () => {
    const puzzle = grid(["La . . . .", B, B, B, B]);
    expect(pickHint(puzzle, RING.slice(), RING, NO_LOCK)).toBeNull();
  });

  it("returns null when only locked cells differ", () => {
    const puzzle = grid(["La . . . .", B, B, B, B]);
    const tiles = RING.slice();
    tiles[0] = 0;
    const locked = new Uint8Array(25);
    locked[0] = 1;
    expect(pickHint(puzzle, tiles, RING, locked)).toBeNull();
  });

  it("clears a wrong tile where the solution is empty", () => {
    const puzzle = grid(["La . . . .", B, B, B, B]);
    const tiles = RING.slice();
    tiles[24] = 10;
    expect(pickHint(puzzle, tiles, RING, NO_LOCK)).toEqual({ cell: 24, mask: 0 });
  });

  it("never picks a cell that already matches, a stone or a locked cell", () => {
    const rng = createRng(909);
    for (let k = 0; k < 60; k++) {
      const sol = randomSolution(6, rng, 1 + rng.int(3));
      const puzzle = puzzleFromSolution(
        sol,
        rng,
        { stone: 0.3, lantern: 0.3, mirror: 0.3, gate: 0.3, fixed: 0.1, colours: 2 },
        `h${k}`,
      );
      const solution = solveOne(puzzle) ?? sol.tiles;
      const tiles = emptyTiles(puzzle);
      const locked = lockedMask(puzzle, []);
      for (let i = 0; i < 36; i++) {
        if (puzzle.cells[i]?.kind === "open" && !locked[i] && rng.chance(0.5)) {
          tiles[i] = rng.chance(0.6) ? (solution[i] ?? 0) : rng.pick([0, 10, 5, 3, 6, 12, 9]);
        }
      }
      const hint = pickHint(puzzle, tiles, solution, locked);
      if (hint === null) {
        for (let i = 0; i < 36; i++) {
          expect(
            tiles[i] === solution[i] || locked[i] === 1 || puzzle.cells[i]?.kind === "stone",
          ).toBe(true);
        }
        continue;
      }
      expect(tiles[hint.cell]).not.toBe(solution[hint.cell]);
      expect(hint.mask).toBe(solution[hint.cell]);
      expect(locked[hint.cell]).toBe(0);
      expect(puzzle.cells[hint.cell]?.kind).toBe("open");
    }
  });

  it("walks a unique puzzle to its solution one hint at a time", () => {
    const puzzle = puzzleOf(".LjLjLjS1|.S4.=6M/.|LjLj..La|LrLrLrLa=5.|LrGrM/..");
    const decoded = decodeTiles("6aac0506903a96c6ac553a939", 5);
    const solution = decoded.ok ? decoded.value : new Uint8Array();
    let tiles = emptyTiles(puzzle);
    let locked = lockedMask(puzzle, []);
    let hints = 0;
    for (;;) {
      const hint = pickHint(puzzle, tiles, solution, locked);
      if (hint === null) break;
      ({ tiles, locked } = applyHint(tiles, locked, hint));
      hints += 1;
      expect(hints).toBeLessThanOrEqual(25);
    }
    expect(Array.from(tiles)).toEqual(Array.from(solution));
  });
});

describe("applyHint", () => {
  it("places the tile, locks the cell and leaves its inputs alone", () => {
    const puzzle = grid(["La . . . .", B, B, B, B]);
    const tiles = new Uint8Array(25);
    const locked = lockedMask(puzzle, []);
    const result = applyHint(tiles, locked, { cell: 0, mask: 6 });
    expect(result.tiles[0]).toBe(6);
    expect(result.locked[0]).toBe(1);
    expect(tiles[0]).toBe(0);
    expect(locked[0]).toBe(0);
  });

  it("makes a hinted cell reject later edits", () => {
    const puzzle = grid(["La . . . .", B, B, B, B]);
    const { tiles, locked } = applyHint(new Uint8Array(25), lockedMask(puzzle, []), {
      cell: 6,
      mask: 9,
    });
    for (const brush of ["straight", "corner", "erase"] as const) {
      const result = tapCell(puzzle, tiles, locked, 6, brush);
      expect(result.changed).toEqual([]);
      expect(result.tiles[6]).toBe(9);
    }
    const drag = dragPath(puzzle, tiles, locked, [5, 6, 7]);
    expect(drag.tiles[6]).toBe(9);
    expect(drag.changed).toEqual([5, 7]);
  });
});
