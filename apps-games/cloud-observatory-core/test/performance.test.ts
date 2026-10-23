import { describe, expect, it } from "vitest";
import { CATALOG } from "../src/content/catalog";
import { formatNumber } from "../src/numbers";
import { reduce } from "../src/reducer";
import { createInitialState } from "../src/state";
import type { GameState } from "../src/types";

const LATE: GameState = {
  ...createInitialState(CATALOG),
  starlight: 2e9,
  cycleStarlight: 4e10,
  lifetimeStarlight: 9e10,
  owned: {
    telescope: 60,
    lens: 40,
    prism: 30,
    orrery: 25,
    "star-map": 20,
    beacon: 12,
    archive: 9,
    "aurora-coil": 5,
  },
  upgrades: ["u-telescope-1", "u-telescope-2", "u-lens-1"],
  charted: ["lyre", "crown", "key", "lantern", "whale", "harp", "fox", "archer"],
  boons: ["dark-adapted", "brass-polish", "clear-glass"],
  achievements: ["telescope-row", "lens-bench", "first-ink", "cartographer", "first-shadow"],
};

/** Fastest of up to three runs (stops once one fits), so a busy machine cannot fail a guard. */
function fastest(run: () => void, budgetMs: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (let attempt = 0; attempt < 3 && best >= budgetMs; attempt++) {
    const started = performance.now();
    run();
    best = Math.min(best, performance.now() - started);
  }
  return best;
}

describe("performance guards (headless)", () => {
  it("simulates 8 hours at 10 ticks per second in under 2 seconds", () => {
    const ticks = 8 * 3600 * 10;
    let state = LATE;
    const elapsed = fastest(() => {
      state = LATE;
      for (let i = 0; i < ticks; i++) {
        const result = reduce(state, { type: "tick", seconds: 0.1 }, CATALOG);
        if (!result.ok) throw new Error("tick rejected");
        state = result.state;
      }
    }, 2000);
    console.info(`performance: ${ticks} ticks in ${elapsed.toFixed(0)} ms (fastest of up to 3)`);
    expect(state.starlight).toBeGreaterThan(LATE.starlight);
    expect(Number.isFinite(state.starlight)).toBe(true);
    expect(state.cycleSeconds).toBeCloseTo(8 * 3600, 3);
    expect(elapsed).toBeLessThan(2000);
  });

  it("formats 100,000 values in under 200 ms", () => {
    const values: number[] = [];
    for (let i = 0; i < 100_000; i++) values.push(10 ** ((i % 3000) / 10) * (1 + (i % 7) / 10));
    let length = 0;
    const elapsed = fastest(() => {
      length = 0;
      for (const value of values) length += formatNumber(value).length;
    }, 200);
    console.info(
      `performance: 100000 formatNumber calls in ${elapsed.toFixed(0)} ms (fastest of up to 3)`,
    );
    expect(length).toBeGreaterThan(100_000);
    expect(elapsed).toBeLessThan(200);
  });
});
