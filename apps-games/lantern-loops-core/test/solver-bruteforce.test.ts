import { describe, expect, it } from "vitest";
import { encodeTiles } from "../src/code";
import { evaluate } from "../src/rules";
import { solve } from "../src/solver";
import { bruteSolutions, enumerateConfigs } from "./helpers/bruteforce";
import {
  DENSE,
  puzzleFromSolution,
  randomCluePuzzle,
  randomSolution,
  SPARSE,
} from "./helpers/fixtures";
import { createRng } from "./helpers/rng";

function puzzlesFor(size: number, count: number, seed: number) {
  const rng = createRng(seed);
  return Array.from({ length: count }, (_, k) => {
    if (k % 3 === 2) return randomCluePuzzle(size, rng, `r${k}`);
    const sol = randomSolution(size, rng, 1 + rng.int(3));
    return puzzleFromSolution(sol, rng, k % 3 === 0 ? SPARSE : DENSE, `s${k}`);
  });
}

describe("brute-force enumerator", () => {
  it("enumerates the known number of cycle systems", () => {
    expect(enumerateConfigs(2)).toHaveLength(2);
    expect(enumerateConfigs(3)).toHaveLength(14);
  });
});

describe("solver versus brute force", () => {
  for (const size of [3, 4]) {
    it(`agrees on 200 seeded ${size}x${size} puzzles`, () => {
      const puzzles = puzzlesFor(size, 200, 1000 + size);
      const seen = { zero: 0, one: 0, many: 0 };
      for (const puzzle of puzzles) {
        const brute = bruteSolutions(puzzle);
        const capped = solve(puzzle, { limit: 2 });
        expect(capped.exhausted).toBe(false);
        expect(capped.count).toBe(Math.min(brute.length, 2));
        const full = solve(puzzle, { limit: 100000 });
        expect(full.count).toBe(brute.length);
        expect(full.solutions.map(encodeTiles).sort()).toEqual(brute.map(encodeTiles).sort());
        for (const s of full.solutions) expect(evaluate(puzzle, s).solved).toBe(true);
        if (brute.length === 0) seen.zero++;
        else if (brute.length === 1) seen.one++;
        else seen.many++;
      }
      expect(seen.zero).toBeGreaterThan(5);
      expect(seen.one).toBeGreaterThan(5);
      expect(seen.many).toBeGreaterThan(5);
    });
  }
});
