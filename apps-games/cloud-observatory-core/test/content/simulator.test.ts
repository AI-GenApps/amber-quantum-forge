import { describe, expect, it } from "vitest";
import { CATALOG } from "../../src/content/catalog";
import { simulate } from "../../src/simulator";

const HOUR = 3600;
const FIRST_ELEVEN = CATALOG.constellations.slice(0, 11).map((c) => c.id);

function seconds(value: number | null): number {
  if (value === null) throw new Error("target never reached");
  return value;
}

describe("balance simulator, real catalog, reference player", () => {
  const report = simulate(CATALOG, { cycles: 3 });
  const [first, second, third] = report.cycles;

  it("simulates three complete cycles", () => {
    expect(report.cycles).toHaveLength(3);
    expect(first?.cycle).toBe(1);
    expect(third?.cycle).toBe(3);
  });

  it("charts the first constellation in under 180 seconds", () => {
    expect(seconds(first?.firstChartSeconds ?? null)).toBeLessThan(180);
  });

  it("reaches 5 pending shards in the first cycle between 2.5 and 4 hours", () => {
    const time = seconds(first?.secondsToShards ?? null);
    expect(time).toBeGreaterThanOrEqual(2.5 * HOUR);
    expect(time).toBeLessThanOrEqual(4 * HOUR);
  });

  it("never leaves more than 360 seconds between purchases, in cycles 1 and 2", () => {
    expect(first?.longestGap ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(360);
    expect(second?.longestGap ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(360);
    expect(third?.longestGap ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(360);
  });

  it("charts at least 11 of 12 constellations before the first Eclipse", () => {
    expect(first?.chartedAtEclipse ?? 0).toBeGreaterThanOrEqual(11);
  });

  it("buys boons by ascending cost between cycles", () => {
    expect(first?.boonsBought).toEqual(["dark-adapted", "brass-polish"]);
    expect(second?.boonsAtStart).toEqual(["dark-adapted", "brass-polish"]);
    expect(second?.boonsBought).toEqual(["clear-glass", "night-watch"]);
    expect(third?.boonsAtStart).toEqual([
      "dark-adapted",
      "brass-polish",
      "clear-glass",
      "night-watch",
    ]);
  });

  it("makes cycle 2 at most 85% of cycle 1", () => {
    const one = seconds(first?.secondsToShards ?? null);
    const two = seconds(second?.secondsToShards ?? null);
    expect(two / one).toBeLessThanOrEqual(0.85);
    expect(seconds(third?.secondsToShards ?? null) / one).toBeLessThanOrEqual(0.85);
  });

  it("makes a cycle with the four early boons at most 85% of cycle 1", () => {
    const one = seconds(first?.secondsToShards ?? null);
    const early = simulate(CATALOG, {
      cycles: 1,
      startBoons: ["dark-adapted", "brass-polish", "clear-glass", "apprentice"],
      startCharted: FIRST_ELEVEN,
    });
    expect(seconds(early.cycles[0]?.secondsToShards ?? null) / one).toBeLessThanOrEqual(0.85);
  });

  it("makes a cycle with six boons at most 55% of cycle 1", () => {
    const one = seconds(first?.secondsToShards ?? null);
    const late = simulate(CATALOG, {
      cycles: 1,
      startBoons: [
        "dark-adapted",
        "brass-polish",
        "clear-glass",
        "apprentice",
        "atlas-ink",
        "corona",
      ],
      startCharted: FIRST_ELEVEN,
    });
    const run = late.cycles[0];
    expect(seconds(run?.secondsToShards ?? null) / one).toBeLessThanOrEqual(0.55);
    expect(run?.longestGap ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(360);
  });

  it("is deterministic and never produces NaN", () => {
    const again = simulate(CATALOG, { cycles: 3 });
    expect(again).toEqual(report);
    expect(JSON.stringify(report)).not.toContain("NaN");
  });

  it("reports an unreached target instead of looping forever", () => {
    const short = simulate(CATALOG, { cycles: 2, maxSecondsPerCycle: 600 });
    expect(short.cycles).toHaveLength(1);
    expect(short.cycles[0]?.secondsToShards).toBeNull();
  });
});
