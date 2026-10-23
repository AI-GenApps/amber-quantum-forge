import { describe, expect, it } from "vitest";
import { analyseLoops, stepCell, tileAt } from "../src/loops";
import { E, N, S, W } from "../src/tile";
import { grid, tilesFrom } from "./helpers/fixtures";

const BLANK = [". . . . .", ". . . . .", ". . . . .", ". . . . .", ". . . . ."];
const RING = tilesFrom(["┌┐...", "└┘...", ".....", ".....", "....."]);

describe("analyseLoops", () => {
  it("finds a closed loop with its cells in path order", () => {
    const puzzle = grid(["La . . . .", ...BLANK.slice(1)]);
    const result = analyseLoops(puzzle, RING);
    expect(result.looseEnds).toEqual([]);
    expect(result.chains).toEqual([]);
    expect(result.loops).toHaveLength(1);
    const loop = result.loops[0];
    expect([...(loop?.cells ?? [])].sort((a, b) => a - b)).toEqual([0, 1, 5, 6]);
    for (let k = 0; k < 4; k++) {
      const a = loop?.cells[k] ?? 0;
      const b = loop?.cells[(k + 1) % 4] ?? 0;
      expect(Math.abs(a - b) === 1 || Math.abs(a - b) === 5).toBe(true);
    }
    expect(loop?.lanterns).toEqual([0]);
    expect(loop?.colour).toBe("amber");
  });

  it("reports an open chain with loose ends facing the edge and empty cells", () => {
    const tiles = tilesFrom(["─┐...", ".│...", ".│...", ".....", "....."]);
    const result = analyseLoops(grid(BLANK), tiles);
    expect(result.loops).toEqual([]);
    expect(result.chains).toHaveLength(1);
    expect(result.chains[0]?.cells).toHaveLength(4);
    expect(result.looseEnds.map((e) => [e.cell, e.dir, e.facing])).toEqual([
      [0, W, "edge"],
      [11, S, "empty"],
    ]);
    expect([...(result.chains[0]?.cells ?? [])]).toEqual([0, 1, 6, 11]);
  });

  it("marks tiles facing a stone and tiles without the matching opening", () => {
    const stone = grid([". S0 . . .", ...BLANK.slice(1)]);
    const result = analyseLoops(stone, tilesFrom(["─....", ".....", ".....", ".....", "....."]));
    expect(result.looseEnds.map((e) => [e.dir, e.facing])).toEqual([
      [E, "stone"],
      [W, "edge"],
    ]);
    const mismatch = analyseLoops(
      grid(BLANK),
      tilesFrom(["─│...", ".....", ".....", ".....", "....."]),
    );
    expect(mismatch.looseEnds.find((e) => e.cell === 0 && e.dir === E)?.facing).toBe("mismatch");
  });

  it("derives loop colours: single, mixed and none", () => {
    const rose = grid(["Lr . . . .", ...BLANK.slice(1)]);
    expect(analyseLoops(rose, RING).loops[0]?.colour).toBe("rose");
    const mixed = grid(["Lr Lj . . .", ...BLANK.slice(1)]);
    expect(analyseLoops(mixed, RING).loops[0]?.colour).toBe("mixed");
    const same = grid(["Lr Lr . . .", ...BLANK.slice(1)]);
    expect(analyseLoops(same, RING).loops[0]?.colour).toBe("rose");
    expect(analyseLoops(grid(BLANK), RING).loops[0]?.colour).toBeNull();
  });

  it("splits several loops and lists their gates", () => {
    const puzzle = grid(["Lr . Lj . .", ". . . . .", ". . . . .", ". . . . .", ". . . . ."]);
    const tiles = tilesFrom(["┌┐┌┐.", "└┘└┘.", ".....", ".....", "....."]);
    const result = analyseLoops(puzzle, tiles);
    expect(result.loops).toHaveLength(2);
    expect(result.loops.map((l) => l.colour).sort()).toEqual(["jade", "rose"]);
    const gated = grid(["Lr Gr . . .", ...BLANK.slice(1)]);
    expect(analyseLoops(gated, RING).loops[0]?.gates).toEqual([1]);
  });

  it("treats stones and illegal values as empty", () => {
    const puzzle = grid(["S1 . . . .", ...BLANK.slice(1)]);
    const tiles = new Uint8Array(25);
    tiles[0] = 10;
    tiles[1] = 7;
    expect(tileAt(puzzle, tiles, 0)).toBe(0);
    expect(tileAt(puzzle, tiles, 1)).toBe(0);
    expect(analyseLoops(puzzle, tiles).looseEnds).toEqual([]);
  });

  it("steps across the board and off the edge", () => {
    expect(stepCell(5, 0, N)).toBe(-1);
    expect(stepCell(5, 0, W)).toBe(-1);
    expect(stepCell(5, 0, E)).toBe(1);
    expect(stepCell(5, 0, S)).toBe(5);
    expect(stepCell(5, 24, E)).toBe(-1);
    expect(stepCell(5, 24, S)).toBe(-1);
  });
});
