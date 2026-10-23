import { describe, expect, it } from "vitest";
import { createBoard } from "../src/board";
import { evaluate } from "../src/evaluate";
import { createPrng } from "../src/prng";
import { runSeason } from "../src/simulate";
import { randomScenario } from "./helpers";

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

describe("random scenarios (200 boards)", () => {
  it("never throw, keep depths within 0 to 99 and never mutate their inputs", () => {
    for (const seed of SEEDS) {
      const { def, placements } = randomScenario(seed);
      const defBefore = JSON.stringify(def);
      const placementsBefore = JSON.stringify(placements);
      const heightsBefore = Array.from(createBoard(def).heights);
      const result = runSeason(def, placements, { keepSteps: true });
      expect(result.weekFrames).toHaveLength(def.weeks);
      expect(result.stepFrames).toHaveLength(def.weeks * 4);
      for (const frame of result.stepFrames ?? []) {
        expect(frame).toHaveLength(result.width * result.height);
        expect(Math.max(...frame)).toBeLessThanOrEqual(99);
      }
      const e = evaluate(def, result, placements);
      expect(e.score).toBeGreaterThanOrEqual(0);
      expect(e.stars).toBeGreaterThanOrEqual(0);
      expect(JSON.stringify(def)).toBe(defBefore);
      expect(JSON.stringify(placements)).toBe(placementsBefore);
      expect(Array.from(createBoard(def).heights)).toEqual(heightsBefore);
    }
  });

  it("do not depend on the order of the placements list", () => {
    for (const seed of SEEDS.slice(0, 60)) {
      const { def, placements } = randomScenario(seed);
      const shuffled = createPrng(seed).shuffle(placements);
      const a = JSON.stringify(runSeason(def, placements));
      const b = JSON.stringify(runSeason(def, shuffled));
      expect(b).toBe(a);
    }
  });

  it("actually exercise water, pieces and goals across the sample", () => {
    let wet = 0;
    let withPieces = 0;
    let supplied = 0;
    for (const seed of SEEDS) {
      const { def, placements } = randomScenario(seed);
      const result = runSeason(def, placements);
      if (result.weekFrames.some((f) => f.some((d) => d > 0))) wet++;
      if (placements.length > 0) withPieces++;
      supplied += evaluate(def, result, placements).housesSupplied;
    }
    expect(wet).toBeGreaterThan(100);
    expect(withPieces).toBeGreaterThan(150);
    expect(supplied).toBeGreaterThan(0);
  });
});
