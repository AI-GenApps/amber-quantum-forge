import { describe, expect, it } from "vitest";
import { equalTiles } from "../src/board";
import { encodePuzzle, encodeTiles } from "../src/code";
import { countClues } from "../src/content/analyse";
import { GENERATOR_VERSION, type GenParams, generatePuzzle } from "../src/gen/generate";
import { type Mechanics, rangesFor } from "../src/gen/ranges";
import { COLOURS, type Colour, validatePuzzleShape } from "../src/puzzle";
import { evaluate } from "../src/rules";
import { isUnique, solve } from "../src/solver";

const L: Mechanics = { stones: false, mirrors: false, gates: false };
const S: Mechanics = { stones: true, mirrors: false, gates: false };
const SM: Mechanics = { stones: true, mirrors: true, gates: false };
const SMG: Mechanics = { stones: true, mirrors: true, gates: true };

interface Case {
  readonly name: string;
  readonly params: GenParams;
}

function cases(): Case[] {
  const out: Case[] = [];
  const add = (size: number, mechanics: Mechanics, colours: readonly Colour[], name: string) =>
    out.push({
      name: `${size}x${size} ${name}`,
      params: { size, mechanics, colours, relaxStones: mechanics.mirrors },
    });
  for (const size of [5, 6, 7]) add(size, L, ["amber"], "lanterns");
  for (const size of [5, 6, 7, 8, 9]) add(size, S, ["amber"], "stones");
  for (const size of [5, 6, 7, 8, 9]) add(size, SM, ["amber"], "mirrors");
  for (const size of [6, 7, 8, 9]) add(size, SMG, ["amber", "rose"], "gates, 2 colours");
  for (const size of [7, 8, 9]) add(size, SMG, COLOURS.slice(0, 3), "gates, 3 colours");
  add(9, SMG, COLOURS, "gates, all five colours");
  add(8, SMG, COLOURS, "gates, all five colours");
  return out;
}

describe("generatePuzzle", () => {
  it("returns the same puzzle for the same seed and a different one for another", () => {
    const params: GenParams = { size: 7, mechanics: SM, relaxStones: true };
    const a = generatePuzzle(params, 12345);
    const b = generatePuzzle(params, 12345);
    expect(encodePuzzle(a.puzzle)).toBe(encodePuzzle(b.puzzle));
    expect(encodeTiles(a.solution)).toBe(encodeTiles(b.solution));
    expect(a.rating).toBe(b.rating);
    expect(a.stats).toEqual(b.stats);
    const c = generatePuzzle(params, 54321);
    expect(encodePuzzle(c.puzzle)).not.toBe(encodePuzzle(a.puzzle));
  });

  it("names the generator version used in campaign seeds", () => {
    expect(GENERATOR_VERSION).toBe("ll-gen-1");
  });

  it("proves 200 seeded generations unique and solved, across sizes and mechanic sets", () => {
    const matrix = cases();
    let total = 0;
    for (const { name, params } of matrix) {
      const perCase = Math.ceil(200 / matrix.length);
      for (let k = 1; k <= perCase; k++) {
        const seed = k * 7919 + params.size * 101;
        const made = generatePuzzle(params, seed);
        total += 1;
        const label = `${name} seed ${seed}`;
        expect(validatePuzzleShape(made.puzzle).ok, label).toBe(true);
        const result = solve(made.puzzle, { limit: 2 });
        expect(result.exhausted, label).toBe(false);
        expect(result.count, label).toBe(1);
        expect(equalTiles(result.solutions[0] as Uint8Array, made.solution), label).toBe(true);
        expect(evaluate(made.puzzle, made.solution).solved, label).toBe(true);
        expect(made.anchors * 100, label).toBeLessThanOrEqual(made.solutionTiles * 60);
        const counts = countClues(made.puzzle);
        const ranges = rangesFor(params.size, params.mechanics, params.relaxStones === true);
        expect(counts.lanterns, label).toBeGreaterThanOrEqual(ranges.lanterns[0]);
        expect(counts.lanterns, label).toBeLessThanOrEqual(ranges.lanterns[1]);
        expect(counts.stones, label).toBeGreaterThanOrEqual(ranges.stones[0]);
        expect(counts.stones, label).toBeLessThanOrEqual(ranges.stones[1]);
        expect(counts.mirrors, label).toBeGreaterThanOrEqual(ranges.mirrors[0]);
        expect(counts.mirrors, label).toBeLessThanOrEqual(ranges.mirrors[1]);
        expect(counts.gates, label).toBeGreaterThanOrEqual(ranges.gates[0]);
        expect(counts.gates, label).toBeLessThanOrEqual(ranges.gates[1]);
        expect(counts.colours.sort(), label).toEqual([...(params.colours ?? ["amber"])].sort());
      }
    }
    expect(total).toBeGreaterThanOrEqual(200);
  });

  it("uses all five colours when asked", () => {
    const made = generatePuzzle(
      { size: 9, mechanics: SMG, colours: COLOURS, relaxStones: true },
      99,
    );
    expect(countClues(made.puzzle).colours).toEqual([...COLOURS]);
    expect(isUnique(made.puzzle)).toBe(true);
  });

  it("falls back to a pinned, still unique board when attempts is 0", () => {
    for (const [params, seed] of [
      [{ size: 5, mechanics: L, attempts: 0 }, 1],
      [{ size: 7, mechanics: S, attempts: 0 }, 2],
      [{ size: 8, mechanics: SMG, colours: ["amber", "rose"], attempts: 0 }, 3],
    ] as const) {
      const made = generatePuzzle(params, seed);
      expect(made.fallback).toBe(true);
      expect(isUnique(made.puzzle)).toBe(true);
      expect(evaluate(made.puzzle, made.solution).solved).toBe(true);
    }
  });

  it("reports whether the limits were met and never throws for reachable params", () => {
    const easy = generatePuzzle({ size: 5, mechanics: S, maxAnchorShare: 60, rating: [1, 5] }, 4);
    expect(easy.accepted).toBe(true);
    const impossible = generatePuzzle({ size: 5, mechanics: L, maxAnchorShare: 0, attempts: 3 }, 4);
    expect(impossible.accepted).toBe(false);
    expect(isUnique(impossible.puzzle)).toBe(true);
  });

  it("keeps the node count that proves uniqueness small", () => {
    const made = generatePuzzle(
      { size: 9, mechanics: SMG, colours: COLOURS, relaxStones: true },
      5,
    );
    expect(solve(made.puzzle, { limit: 2 }).nodes).toBeLessThan(40_000);
  });

  it("throws for params that cannot hold their colours", () => {
    expect(() =>
      generatePuzzle({ size: 5, mechanics: L, colours: COLOURS, lanterns: [2, 3], attempts: 1 }, 1),
    ).toThrow();
  });
});
