import { describe, expect, it } from "vitest";
import { equalTiles } from "../src/board";
import {
  anchorCells,
  clueKind,
  pinUntilUnique,
  removeAnchors,
  removeClues,
} from "../src/gen/minimise";
import { placeClues } from "../src/gen/place";
import { rangesFor } from "../src/gen/ranges";
import { createRng } from "../src/gen/rng";
import { generateSolution } from "../src/gen/solution";
import { analyseLoops } from "../src/loops";
import { type Colour, openCell, type Puzzle, validatePuzzleShape } from "../src/puzzle";
import { evaluate } from "../src/rules";
import { isUnique, solve } from "../src/solver";

function bare(size: number): Puzzle {
  return { id: "bare", size, cells: Array.from({ length: size * size }, () => openCell()) };
}

describe("generateSolution", () => {
  for (const size of [5, 6, 7, 8, 9]) {
    it(`builds disjoint closed loops on ${size}x${size}`, () => {
      for (let seed = 1; seed <= 25; seed++) {
        const board = generateSolution(createRng(seed * 31 + size), {
          size,
          loops: [1, 4],
          coverage: [40, 70],
        });
        const analysis = analyseLoops(bare(size), board.tiles);
        expect(analysis.looseEnds).toEqual([]);
        expect(analysis.chains).toEqual([]);
        expect(analysis.loops).toHaveLength(board.loops.length);
        const fromAnalysis = analysis.loops.map((loop) => [...loop.cells].sort((a, b) => a - b));
        const fromBoard = board.loops.map((cells) => [...cells].sort((a, b) => a - b));
        expect(fromAnalysis.sort()).toEqual(fromBoard.sort());
        for (const cells of board.loops) expect(cells.length).toBeGreaterThanOrEqual(4);
      }
    });
  }

  it("is deterministic and honours loop and coverage targets", () => {
    const params = { size: 7, loops: [2, 3], coverage: [45, 65] } as const;
    const a = generateSolution(createRng(5), params);
    const b = generateSolution(createRng(5), params);
    expect(equalTiles(a.tiles, b.tiles)).toBe(true);
    let hits = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const board = generateSolution(createRng(seed), params);
      const covered = board.tiles.reduce((n, mask) => n + (mask === 0 ? 0 : 1), 0);
      if (board.loops.length >= 2 && board.loops.length <= 3 && covered >= 22 && covered <= 31) {
        hits += 1;
      }
    }
    expect(hits).toBeGreaterThanOrEqual(25);
  });

  it("always returns at least one loop even for impossible targets", () => {
    const board = generateSolution(createRng(1), { size: 5, loops: [9, 9], coverage: [99, 100] });
    expect(board.loops.length).toBeGreaterThanOrEqual(1);
  });
});

describe("placeClues", () => {
  const all = { stones: true, mirrors: true, gates: true };

  it("places clues inside the ranges that the solution satisfies", () => {
    const colours: Colour[] = ["amber", "rose", "jade"];
    let placedCount = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const rng = createRng(seed);
      const board = generateSolution(rng, { size: 8, loops: [3, 6], coverage: [45, 70] });
      const ranges = rangesFor(8, all);
      const placed = placeClues(rng, board, { id: "p", size: 8, colours, ranges });
      if (placed === null) continue;
      placedCount += 1;
      expect(validatePuzzleShape(placed.puzzle).ok).toBe(true);
      expect(evaluate(placed.puzzle, placed.solution).solved).toBe(true);
      const kinds = placed.puzzle.cells.map(clueKind);
      const count = (kind: string) => kinds.filter((k) => k === kind).length;
      expect(count("lantern")).toBeGreaterThanOrEqual(ranges.lanterns[0]);
      expect(count("lantern")).toBeLessThanOrEqual(ranges.lanterns[1]);
      expect(count("stone")).toBeGreaterThanOrEqual(ranges.stones[0]);
      expect(count("stone")).toBeLessThanOrEqual(ranges.stones[1]);
      expect(count("mirror")).toBeGreaterThanOrEqual(ranges.mirrors[0]);
      expect(count("gate")).toBeGreaterThanOrEqual(ranges.gates[0]);
      const used = new Set(
        placed.puzzle.cells.flatMap((cell) =>
          cell.clue?.kind === "lantern" ? [cell.clue.colour] : [],
        ),
      );
      expect([...used].sort()).toEqual([...colours].sort());
    }
    expect(placedCount).toBeGreaterThan(15);
  });

  it("returns null when there are fewer loops than colours", () => {
    const rng = createRng(1);
    const board = generateSolution(rng, { size: 5, loops: [1, 1], coverage: [20, 40] });
    const placed = placeClues(rng, board, {
      id: "p",
      size: 5,
      colours: ["amber", "rose", "jade", "azure", "violet"],
      ranges: rangesFor(5, all),
    });
    expect(placed).toBeNull();
  });

  it("puts stones only on cells that are empty in the solution, with true counts", () => {
    const rng = createRng(11);
    const board = generateSolution(rng, { size: 6, loops: [1, 3], coverage: [45, 70] });
    const placed = placeClues(rng, board, {
      id: "p",
      size: 6,
      colours: ["amber"],
      ranges: rangesFor(6, { stones: true, mirrors: false, gates: false }),
    });
    expect(placed).not.toBeNull();
    placed?.puzzle.cells.forEach((cell, i) => {
      if (cell.kind === "stone") expect(placed.solution[i]).toBe(0);
    });
  });
});

describe("minimise", () => {
  function prepared(seed: number) {
    const rng = createRng(seed);
    const board = generateSolution(rng, { size: 6, loops: [1, 3], coverage: [45, 70] });
    const ranges = rangesFor(6, { stones: true, mirrors: false, gates: false });
    const placed = placeClues(rng, board, { id: "m", size: 6, colours: ["amber"], ranges });
    if (placed === null) throw new Error("fixture board did not place");
    return { rng, placed, ranges };
  }

  it("pins until unique, then removes anchors and clues while staying unique", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { rng, placed, ranges } = prepared(seed);
      const pinned = pinUntilUnique(rng, placed.puzzle, placed.solution, 40_000);
      expect(isUnique(pinned)).toBe(true);
      const slim = removeAnchors(rng, pinned, 40_000);
      expect(isUnique(slim)).toBe(true);
      expect(anchorCells(slim).length).toBeLessThanOrEqual(anchorCells(pinned).length);
      const lean = removeClues(rng, slim, placed.solution, ranges, 40_000);
      expect(isUnique(lean)).toBe(true);
      expect(evaluate(lean, placed.solution).solved).toBe(true);
      const found = solve(lean, { limit: 2 }).solutions[0];
      expect(found && equalTiles(found, placed.solution)).toBe(true);
    }
  });

  it("terminates with a unique board even when the node budget is tiny", () => {
    const { rng, placed } = prepared(7);
    const pinned = pinUntilUnique(rng, placed.puzzle, placed.solution, 1);
    expect(isUnique(pinned)).toBe(true);
  });
});
