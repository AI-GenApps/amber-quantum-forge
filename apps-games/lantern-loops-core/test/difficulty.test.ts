import { describe, expect, it } from "vitest";
import { puzzleFromRecord } from "../src/content/analyse";
import { getPuzzle } from "../src/content/chapters";
import type { PuzzleRecord } from "../src/content/types";
import {
  type DifficultyStats,
  effortOf,
  measure,
  RATING_STEPS,
  rate,
  ratingOf,
} from "../src/gen/difficulty";
import { generatePuzzle } from "../src/gen/generate";
import { solve } from "../src/solver";

const stats = (nodes: number, unresolved: number, size = 7): DifficultyStats => ({
  size,
  freeCells: 40,
  unresolved,
  nodes,
});

describe("difficulty rating", () => {
  it("steps from 1 to 5 as the effort rises", () => {
    expect(ratingOf(stats(0, 0, 5))).toBe(1);
    expect(ratingOf(stats(6, 12, 6))).toBe(2);
    expect(ratingOf(stats(40, 20, 7))).toBe(3);
    expect(ratingOf(stats(100, 20, 8))).toBe(4);
    expect(ratingOf(stats(5000, 30, 9))).toBe(5);
    expect(RATING_STEPS).toHaveLength(4);
  });

  it("is monotone in nodes, unresolved cells and size", () => {
    expect(effortOf(stats(10, 10))).toBeLessThan(effortOf(stats(100, 10)));
    expect(effortOf(stats(10, 10))).toBeLessThan(effortOf(stats(10, 30)));
    expect(effortOf(stats(10, 10, 6))).toBeLessThan(effortOf(stats(10, 10, 9)));
  });

  it("handles a board without free cells", () => {
    expect(ratingOf({ size: 5, freeCells: 0, unresolved: 0, nodes: 0 })).toBe(1);
  });

  it("measures real solver statistics deterministically", () => {
    const made = generatePuzzle(
      { size: 6, mechanics: { stones: true, mirrors: false, gates: false } },
      8,
    );
    const a = measure(made.puzzle);
    const b = measure(made.puzzle);
    expect(a).toEqual(b);
    expect(a.nodes).toBe(solve(made.puzzle, { limit: 2 }).nodes);
    expect(a.unresolved).toBeLessThanOrEqual(a.freeCells);
    const rated = rate(made.puzzle);
    expect(rated.rating).toBe(ratingOf(a));
    expect(rated.stats).toEqual(a);
  });

  it("rates a board that propagation alone solves as easy", () => {
    const record = getPuzzle("harbor-03");
    expect(record).toBeDefined();
    const puzzle = puzzleFromRecord(record as PuzzleRecord);
    expect(measure(puzzle).nodes).toBe(0);
    expect(rate(puzzle).rating).toBe(1);
  });
});
