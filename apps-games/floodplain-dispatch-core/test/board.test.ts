import { describe, expect, it } from "vitest";
import {
  cellIndex,
  createBoard,
  effectiveCrest,
  inBounds,
  isBuildable,
  isCanalType,
  neighbors,
} from "../src/board";
import { makeDef } from "./helpers";

const DEF = makeDef([".3 .3 F2 H3", "T4 .2 I6 S0", ".0 .7 .1 H5"]);

describe("createBoard", () => {
  it("indexes cells row-major and collects kinds in row-major order", () => {
    const board = createBoard(DEF);
    expect([board.width, board.height]).toEqual([4, 3]);
    expect(cellIndex(board, 2, 1)).toBe(6);
    expect(board.houseCells).toEqual([3, 11]);
    expect(board.fieldCells).toEqual([2]);
    expect(board.inletCells).toEqual([6]);
    expect(board.seaCells).toEqual([7]);
    expect(Array.from(board.heights)).toEqual([3, 3, 2, 3, 4, 2, 6, 0, 0, 7, 1, 5]);
  });

  it("returns the same board for the same def", () => {
    expect(createBoard(DEF)).toBe(createBoard(DEF));
  });

  it("throws on an invalid layout", () => {
    expect(() => createBoard(makeDef([".1 X1", ".1 .1"]))).toThrow(/BAD_TOKEN/);
  });

  it("accepts 2 x 2 up to 16 x 20 and rejects outside", () => {
    expect(createBoard(makeDef([".0 .0", ".0 .0"])).width).toBe(2);
    const row = (n: number) => Array.from({ length: n }, () => ".0").join(" ");
    const big = makeDef(Array.from({ length: 20 }, () => row(16)));
    expect([createBoard(big).width, createBoard(big).height]).toEqual([16, 20]);
    expect(() => createBoard(makeDef([".0", ".0"]))).toThrow(/Unsupported/);
    expect(() => createBoard(makeDef(Array.from({ length: 21 }, () => row(16))))).toThrow(
      /Unsupported/,
    );
    expect(() => createBoard(makeDef(Array.from({ length: 20 }, () => row(17))))).toThrow(
      /Unsupported/,
    );
  });
});

describe("geometry", () => {
  const board = createBoard(DEF);

  it("lists neighbours in N, E, S, W order with null off the edge", () => {
    expect(neighbors(board, 1, 1)).toEqual([1, 6, 9, 4]);
    expect(neighbors(board, 0, 0)).toEqual([null, 1, 4, null]);
    expect(neighbors(board, 3, 2)).toEqual([7, null, null, 10]);
  });

  it("checks bounds with integers only", () => {
    expect(inBounds(board, 3, 2)).toBe(true);
    expect(inBounds(board, 4, 0)).toBe(false);
    expect(inBounds(board, -1, 0)).toBe(false);
    expect(inBounds(board, 0.5, 0)).toBe(false);
  });

  it("only land is buildable", () => {
    expect(isBuildable(board, 0, 0)).toBe(true);
    expect(isBuildable(board, 2, 0)).toBe(false);
    expect(isBuildable(board, 3, 0)).toBe(false);
    expect(isBuildable(board, 0, 1)).toBe(false);
    expect(isBuildable(board, 2, 1)).toBe(false);
    expect(isBuildable(board, 3, 1)).toBe(false);
    expect(isBuildable(board, 9, 9)).toBe(false);
  });
});

describe("effectiveCrest", () => {
  it("applies the piece modifiers to the base height", () => {
    expect(effectiveCrest(5, null)).toBe(5);
    expect(effectiveCrest(5, "canal")).toBe(3);
    expect(effectiveCrest(5, "gate")).toBe(3);
    expect(effectiveCrest(5, "reservoir")).toBe(2);
    expect(effectiveCrest(5, "barrier")).toBe(8);
    expect(effectiveCrest(5, "pump")).toBe(5);
  });

  it("floors canals and reservoirs at 0", () => {
    expect(effectiveCrest(1, "canal")).toBe(0);
    expect(effectiveCrest(0, "canal")).toBe(0);
    expect(effectiveCrest(2, "reservoir")).toBe(0);
    expect(effectiveCrest(3, "reservoir")).toBe(0);
    expect(effectiveCrest(4, "reservoir")).toBe(1);
  });
});

describe("isCanalType", () => {
  it("is true for canal, open gate, reservoir, sea and inlet", () => {
    expect(isCanalType("land", "canal")).toBe(true);
    expect(isCanalType("land", "gate")).toBe(true);
    expect(isCanalType("land", "reservoir")).toBe(true);
    expect(isCanalType("sea", null)).toBe(true);
    expect(isCanalType("inlet", null)).toBe(true);
  });

  it("is false for a closed gate, barrier, pump and bare terrain", () => {
    expect(isCanalType("land", "gate", false)).toBe(false);
    expect(isCanalType("land", "barrier")).toBe(false);
    expect(isCanalType("land", "pump")).toBe(false);
    expect(isCanalType("land", null)).toBe(false);
    expect(isCanalType("house", null)).toBe(false);
    expect(isCanalType("field", null)).toBe(false);
    expect(isCanalType("scenery", null)).toBe(false);
  });
});
