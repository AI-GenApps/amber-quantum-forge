import { describe, expect, it } from "vitest";
import { emptyTiles, equalTiles } from "../src/board";
import { decodeTiles, encodeTiles } from "../src/code";
import { evaluate } from "../src/rules";
import { countSolutions, isUnique, propagate, solve, solveOne } from "../src/solver";
import { grid, puzzleFromSolution, puzzleOf, randomSolution } from "./helpers/fixtures";
import { createRng } from "./helpers/rng";

const B = ". . . . .";
const BLANK = grid([B, B, B, B, B]);
const UNIQUE_CODE = ".LjLjLjS1|.S4.=6M/.|LjLj..La|LrLrLrLa=5.|LrGrM/..";
const UNIQUE_TILES = "6aac0506903a96c6ac553a939";

function sparseNine() {
  const rng = createRng(4);
  const solution = randomSolution(9, rng, 4);
  const density = { stone: 0.15, lantern: 0.15, mirror: 0.2, gate: 0.2, fixed: 0, colours: 3 };
  return { puzzle: puzzleFromSolution(solution, rng, density, "sparse-9"), solution };
}

describe("solve", () => {
  it("proves a unique puzzle and returns its only solution", () => {
    const puzzle = puzzleOf(UNIQUE_CODE);
    const result = solve(puzzle);
    expect(result.count).toBe(1);
    expect(result.exhausted).toBe(false);
    expect(encodeTiles(result.solutions[0] ?? new Uint8Array())).toBe(UNIQUE_TILES);
    expect(isUnique(puzzle)).toBe(true);
    expect(countSolutions(puzzle)).toBe(1);
    expect(evaluate(puzzle, result.solutions[0] ?? new Uint8Array()).solved).toBe(true);
  });

  it("stops counting at the limit for puzzles with several solutions", () => {
    const puzzle = grid(["La . . . .", B, B, B, B]);
    expect(solve(puzzle).count).toBe(2);
    expect(solve(puzzle, { limit: 1 }).count).toBe(1);
    expect(solve(puzzle, { limit: 7 }).count).toBe(7);
    expect(countSolutions(puzzle, 3)).toBe(3);
    expect(isUnique(puzzle)).toBe(false);
    for (const solution of solve(puzzle, { limit: 20 }).solutions) {
      expect(evaluate(puzzle, solution).solved).toBe(true);
    }
  });

  it("reports an unsolvable puzzle as zero solutions", () => {
    const sealed = grid(["La S0 . . .", "S0 . . . .", B, B, B]);
    expect(solve(sealed).count).toBe(0);
    expect(solve(sealed).exhausted).toBe(false);
    expect(isUnique(sealed)).toBe(false);
    expect(solveOne(sealed)).toBeNull();
    const clash = grid(["Lr Lj . . .", "S0 S0 . . .", B, B, B]);
    expect(solve(clash).count).toBe(0);
    const gateWithoutLantern = grid(["Gr . . . .", B, B, B, B]);
    expect(solve(gateWithoutLantern).count).toBe(0);
  });

  it("solves a board without clues to the single empty board", () => {
    const result = solve(BLANK);
    expect(result.count).toBe(1);
    expect(Array.from(result.solutions[0] ?? [])).toEqual(new Array(25).fill(0));
    expect(isUnique(BLANK)).toBe(true);
  });

  it("returns solutions that always satisfy evaluate", () => {
    const rng = createRng(31);
    let checked = 0;
    for (let k = 0; k < 40; k++) {
      const solution = randomSolution(6, rng, 1 + rng.int(3));
      const puzzle = puzzleFromSolution(
        solution,
        rng,
        { stone: 0.3, lantern: 0.25, mirror: 0.3, gate: 0.3, fixed: 0.05, colours: 2 },
        `v${k}`,
      );
      const result = solve(puzzle, { limit: 5 });
      expect(result.count).toBeGreaterThan(0);
      for (const s of result.solutions) {
        expect(evaluate(puzzle, s).solved).toBe(true);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(40);
  });

  it("includes fixed tiles in every solution", () => {
    const puzzle = puzzleOf(UNIQUE_CODE);
    const fixed = emptyTiles(puzzle);
    const result = solve(puzzle);
    for (let i = 0; i < fixed.length; i++) {
      if (fixed[i] !== 0) expect(result.solutions[0]?.[i]).toBe(fixed[i]);
    }
  });
});

describe("node budget", () => {
  it("reports exhaustion without a wrong count", () => {
    const { puzzle } = sparseNine();
    const truth = solve(puzzle, { limit: 2, nodeBudget: 50_000_000 });
    expect(truth.count).toBe(2);
    expect(truth.exhausted).toBe(false);
    for (const budget of [0, 1, 10, 100, 5000]) {
      const result = solve(puzzle, { limit: 2, nodeBudget: budget });
      expect(result.nodes).toBeLessThanOrEqual(budget);
      expect(result.count).toBeLessThanOrEqual(truth.count);
      expect(result.count).toBe(result.solutions.length);
      for (const s of result.solutions) expect(evaluate(puzzle, s).solved).toBe(true);
      if (result.count < 2) expect(result.exhausted).toBe(true);
    }
    expect(solve(puzzle, { nodeBudget: 10 }).exhausted).toBe(true);
    expect(isUnique(puzzle, 10)).toBe(false);
  });

  it("does not mistake the limit for exhaustion", () => {
    const puzzle = grid(["La . . . .", B, B, B, B]);
    const result = solve(puzzle, { limit: 2, nodeBudget: 1_000_000 });
    expect(result.exhausted).toBe(false);
    expect(result.count).toBe(2);
  });

  it("never calls a budget-limited unique puzzle unique unless it finished", () => {
    const puzzle = puzzleOf(UNIQUE_CODE);
    expect(isUnique(puzzle, 1)).toBe(false);
    expect(isUnique(puzzle, 100_000)).toBe(true);
  });
});

describe("partial boards", () => {
  it("respects existing tiles", () => {
    const puzzle = grid(["La . . . .", B, B, B, B]);
    const partial = new Uint8Array(25);
    partial[0] = 6;
    partial[1] = 12;
    partial[5] = 3;
    partial[6] = 9;
    const result = solve(puzzle, { limit: 10, partial });
    expect(result.count).toBe(1);
    expect(Array.from(result.solutions[0] ?? []).slice(0, 7)).toEqual([6, 12, 0, 0, 0, 3, 9]);
  });

  it("returns only solutions that contain the given tiles", () => {
    const puzzle = grid(["La . . . .", B, B, B, B]);
    const partial = new Uint8Array(25);
    partial[0] = 6;
    const result = solve(puzzle, { limit: 25, partial });
    expect(result.count).toBeGreaterThan(1);
    for (const s of result.solutions) {
      expect(s[0]).toBe(6);
      expect(evaluate(puzzle, s).solved).toBe(true);
    }
  });

  it("finds nothing when the partial board contradicts the rules", () => {
    const puzzle = puzzleOf(UNIQUE_CODE);
    const decoded = decodeTiles(UNIQUE_TILES, 5);
    const good = decoded.ok ? decoded.value : new Uint8Array();
    const wrong = good.slice();
    wrong[0] = 10;
    expect(solve(puzzle, { partial: wrong }).count).toBe(0);
    const onStone = new Uint8Array(25);
    onStone[9] = 5;
    expect(solve(puzzle, { partial: onStone }).count).toBe(0);
    const illegal = new Uint8Array(25);
    illegal[1] = 7;
    expect(solve(puzzle, { partial: illegal }).count).toBe(0);
    expect(equalTiles(solveOne(puzzle, good) ?? new Uint8Array(), good)).toBe(true);
  });
});

describe("propagate", () => {
  it("forces the neighbours of a zero stone to stay empty", () => {
    const puzzle = grid([B, B, ". . S0 . .", B, B]);
    const result = propagate(puzzle);
    expect(result.contradiction).toBe(false);
    for (const cell of [7, 11, 13, 17]) expect(result.forced).toContainEqual({ cell, mask: 0 });
  });

  it("forces tiles the stone count requires", () => {
    const puzzle = grid(["S2 . . . .", B, B, B, B]);
    const forced = propagate(puzzle).forced;
    expect(forced).toContainEqual({ cell: 1, mask: 6 });
    expect(forced).toContainEqual({ cell: 5, mask: 6 });
  });

  it("detects contradictions", () => {
    expect(propagate(grid(["La S0 . . .", "S0 . . . .", B, B, B])).contradiction).toBe(true);
    expect(propagate(grid(["S4 . . . .", B, B, B, B])).contradiction).toBe(true);
  });

  it("treats given tiles as known and does not report them as forced", () => {
    const puzzle = puzzleOf(UNIQUE_CODE);
    const decoded = decodeTiles(UNIQUE_TILES, 5);
    const full = decoded.ok ? decoded.value : new Uint8Array();
    const partial = new Uint8Array(25);
    partial[0] = full[0] ?? 0;
    partial[1] = full[1] ?? 0;
    const result = propagate(puzzle, partial);
    expect(result.contradiction).toBe(false);
    expect(result.forced.some((f) => f.cell === 0 || f.cell === 1)).toBe(false);
    for (const f of result.forced) expect(f.mask).toBe(full[f.cell]);
  });

  it("only forces values that every solution shares", () => {
    const rng = createRng(5);
    for (let k = 0; k < 30; k++) {
      const solution = randomSolution(5, rng, 2);
      const puzzle = puzzleFromSolution(
        solution,
        rng,
        { stone: 0.4, lantern: 0.3, mirror: 0.3, gate: 0.3, fixed: 0, colours: 2 },
        `f${k}`,
      );
      const all = solve(puzzle, { limit: 500 });
      const forced = propagate(puzzle).forced;
      for (const f of forced) {
        for (const s of all.solutions) expect(s[f.cell]).toBe(f.mask);
      }
    }
  });
});
