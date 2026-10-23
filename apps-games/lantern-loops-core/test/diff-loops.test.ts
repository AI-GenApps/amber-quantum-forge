import { describe, expect, it } from "vitest";
import { diffLoops } from "../src/loops";
import { grid, tilesFrom } from "./helpers/fixtures";

const BLANK = [". . . . .", ". . . . .", ". . . . .", ". . . . .", ". . . . ."];
const withTop = (top: string) => grid([top, ...BLANK.slice(1)]);

const EMPTY = tilesFrom(Array(5).fill("....."));
const RING_A = tilesFrom(["┌┐...", "└┘...", ".....", ".....", "....."]);
const RING_B = tilesFrom(["┌┐┌┐.", "└┘└┘.", ".....", ".....", "....."]);
const OPEN = tilesFrom(["┌┐...", "└─...", ".....", ".....", "....."]);
const BIG = tilesFrom(["┌──┐.", "│..│.", "│..│.", "└──┘.", "....."]);

describe("diffLoops", () => {
  const puzzle = withTop("La . . . .");

  it("reports a newly closed loop and the lantern it lights", () => {
    const diff = diffLoops(puzzle, OPEN, RING_A);
    expect(diff.closed).toHaveLength(1);
    expect([...(diff.closed[0]?.cells ?? [])].sort((a, b) => a - b)).toEqual([0, 1, 5, 6]);
    expect(diff.broken).toEqual([]);
    expect(diff.lit).toEqual([0]);
    expect(diff.unlit).toEqual([]);
  });

  it("reports a broken loop and the lantern that goes dark", () => {
    const diff = diffLoops(puzzle, RING_A, OPEN);
    expect(diff.closed).toEqual([]);
    expect(diff.broken).toHaveLength(1);
    expect(diff.lit).toEqual([]);
    expect(diff.unlit).toEqual([0]);
  });

  it("reports nothing for a no-op edit", () => {
    for (const tiles of [EMPTY, OPEN, RING_A, RING_B]) {
      const diff = diffLoops(puzzle, tiles, tiles.slice());
      expect(diff).toEqual({ closed: [], broken: [], lit: [], unlit: [] });
    }
  });

  it("reports nothing while an open chain grows", () => {
    const longer = tilesFrom(["┌┐...", "└┘...", ".....", ".....", "....."]);
    const diff = diffLoops(puzzle, EMPTY, tilesFrom(["─┐...", ".│...", ".....", ".....", "....."]));
    expect(diff.closed).toEqual([]);
    expect(diff.broken).toEqual([]);
    expect(diffLoops(puzzle, longer, longer).closed).toEqual([]);
  });

  it("counts a second loop as new without touching the first", () => {
    const two = grid(["La . La . .", ...BLANK.slice(1)]);
    const diff = diffLoops(two, RING_A, RING_B);
    expect(diff.closed).toHaveLength(1);
    expect([...(diff.closed[0]?.cells ?? [])].sort((a, b) => a - b)).toEqual([2, 3, 7, 8]);
    expect(diff.broken).toEqual([]);
    expect(diff.lit).toEqual([2]);
  });

  it("treats a merge as one loop broken and another closed", () => {
    const two = grid(["La . . . .", ".  . . . .", ". . . . .", ". . . . .", ". . . . ."]);
    const diff = diffLoops(two, RING_A, BIG);
    expect(diff.broken).toHaveLength(1);
    expect(diff.closed).toHaveLength(1);
    expect(diff.closed[0]?.cells).toHaveLength(12);
    expect(diff.lit).toEqual([]);
    expect(diff.unlit).toEqual([]);
  });

  it("treats a split as one loop broken and two closed", () => {
    const two = grid(["La . . . .", ". . . . .", ". . . . .", ". . . . .", ". . . . ."]);
    const split = tilesFrom(["┌┐...", "└┘...", ".....", ".....", "....."]);
    const diff = diffLoops(two, BIG, split);
    expect(diff.broken).toHaveLength(1);
    expect(diff.closed).toHaveLength(1);
    const reverse = diffLoops(two, split, BIG);
    expect(reverse.closed).toHaveLength(1);
    expect(reverse.broken).toHaveLength(1);
  });

  it("ignores loops without a lantern when listing lit lanterns", () => {
    const dark = withTop(". . . . .");
    const diff = diffLoops(dark, EMPTY, RING_A);
    expect(diff.closed).toHaveLength(1);
    expect(diff.lit).toEqual([]);
  });
});
