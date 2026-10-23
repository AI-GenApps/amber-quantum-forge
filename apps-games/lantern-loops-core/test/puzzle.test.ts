import { describe, expect, it } from "vitest";
import {
  cellIndex,
  colOf,
  gate,
  lantern,
  mirror,
  neighbours,
  openCell,
  type Puzzle,
  rowOf,
  stoneCell,
  validatePuzzleShape,
} from "../src/puzzle";
import { makePuzzle } from "./helpers/fixtures";

function blank(size: number, id = "p"): Puzzle {
  return makePuzzle(
    size,
    Array.from({ length: size * size }, () => openCell()),
    id,
  );
}

function withCell(puzzle: Puzzle, i: number, cell: ReturnType<typeof openCell>): Puzzle {
  const cells = puzzle.cells.slice();
  cells[i] = cell;
  return { ...puzzle, cells };
}

function codes(puzzle: Puzzle): string[] {
  const result = validatePuzzleShape(puzzle);
  return result.ok ? [] : result.errors.map((e) => e.code);
}

describe("indexing", () => {
  it("maps rows and columns", () => {
    expect(cellIndex(5, 2, 3)).toBe(13);
    expect(rowOf(5, 13)).toBe(2);
    expect(colOf(5, 13)).toBe(3);
  });

  it("lists in-bounds neighbours in N, E, S, W order", () => {
    expect(neighbours(5, 0)).toEqual([1, 5]);
    expect(neighbours(5, 12)).toEqual([7, 13, 17, 11]);
    expect(neighbours(5, 24)).toEqual([19, 23]);
    expect(neighbours(5, 4)).toEqual([9, 3]);
  });
});

describe("validatePuzzleShape", () => {
  it("accepts a plain board and every clue kind", () => {
    expect(validatePuzzleShape(blank(5)).ok).toBe(true);
    let p = blank(6);
    p = withCell(p, 0, lantern("rose"));
    p = withCell(p, 1, mirror("/", 9));
    p = withCell(p, 2, gate("jade", 5));
    p = withCell(p, 3, stoneCell(4));
    p = withCell(p, 4, openCell(undefined, 12));
    expect(validatePuzzleShape(p).ok).toBe(true);
  });

  it("allows size 4 only for tutorials and rejects other sizes", () => {
    expect(codes(blank(4))).toEqual(["size"]);
    expect(validatePuzzleShape(blank(4, "tutorial-1")).ok).toBe(true);
    expect(codes(blank(3, "tutorial-1"))).toEqual(["size"]);
    expect(validatePuzzleShape(blank(9)).ok).toBe(true);
    expect(codes(blank(10))).toEqual(["size"]);
  });

  it("rejects a wrong cell count", () => {
    expect(codes({ id: "x", size: 5, cells: [openCell()] })).toContain("cell-count");
  });

  it("rejects anchors that do not satisfy their clue", () => {
    expect(codes(withCell(blank(5), 0, mirror("/", 10)))).toEqual(["anchor-mismatch"]);
    expect(codes(withCell(blank(5), 0, mirror("/", 3)))).toEqual(["anchor-mismatch"]);
    expect(codes(withCell(blank(5), 0, mirror("\\", 6)))).toEqual(["anchor-mismatch"]);
    expect(codes(withCell(blank(5), 0, gate("rose", 6)))).toEqual(["anchor-mismatch"]);
    expect(codes(withCell(blank(5), 0, openCell(undefined, 7)))).toEqual(["illegal-fixed"]);
  });

  it("rejects bad stones and clues on stones", () => {
    expect(codes(withCell(blank(5), 0, stoneCell(5)))).toEqual(["stone-number"]);
    expect(codes(withCell(blank(5), 0, stoneCell(-1)))).toEqual(["stone-number"]);
    expect(codes(withCell(blank(5), 0, { kind: "stone", stone: 1, fixed: 10 }))).toEqual([
      "stone-fixed",
    ]);
    expect(
      codes(
        withCell(blank(5), 0, {
          kind: "stone",
          stone: 1,
          clue: { kind: "lantern", colour: "amber" },
        }),
      ),
    ).toEqual(["stone-clue"]);
    expect(codes(withCell(blank(5), 0, { kind: "stone" }))).toEqual(["stone-number"]);
    expect(codes(withCell(blank(5), 0, { kind: "open", stone: 2 }))).toEqual(["stone-number"]);
  });
});
