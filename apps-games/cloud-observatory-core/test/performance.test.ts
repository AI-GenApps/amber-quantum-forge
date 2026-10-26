import { describe, expect, it } from "vitest";
import { applyOffline } from "../src/actions";
import { CATALOG } from "../src/content/catalog";
import { offlineEfficiency, starlightPerSecond } from "../src/economy";
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
  it("resumes after the 8 hour offline cap with a closed-form, near-instant computation", () => {
    let result = applyOffline(LATE, 8 * 3600, CATALOG);
    const elapsed = fastest(() => {
      for (let i = 0; i < 100; i++) result = applyOffline(LATE, 8 * 3600, CATALOG);
    }, 250);
    console.info(`performance: 100 offline resumes of 8 h in ${elapsed.toFixed(1)} ms`);
    const expected =
      starlightPerSecond(LATE, CATALOG) * 8 * 3600 * offlineEfficiency(LATE, CATALOG);
    expect(result.gained).toBeCloseTo(expected, -Math.ceil(Math.log10(expected)) + 9);
    expect(Number.isFinite(result.state.starlight)).toBe(true);
    // 100 resumes must still fit a quarter second: a per tick loop (288,000 steps) would not.
    expect(elapsed).toBeLessThan(250);
  });

  it("keeps the online tick loop cheap: one hour at 10 ticks per second", () => {
    const ticks = 3600 * 10;
    let state = LATE;
    const elapsed = fastest(() => {
      state = LATE;
      for (let i = 0; i < ticks; i++) {
        const result = reduce(state, { type: "tick", seconds: 0.1 }, CATALOG);
        if (!result.ok) throw new Error("tick rejected");
        state = result.state;
      }
    }, 5000);
    console.info(`performance: ${ticks} ticks in ${elapsed.toFixed(0)} ms (fastest of up to 3)`);
    expect(state.starlight).toBeGreaterThan(LATE.starlight);
    expect(Number.isFinite(state.starlight)).toBe(true);
    expect(state.cycleSeconds).toBeCloseTo(3600, 3);
    // CI measured about 15 microseconds per tick; this allows roughly 140 microseconds.
    expect(elapsed).toBeLessThan(5000);
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
