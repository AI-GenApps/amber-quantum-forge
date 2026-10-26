import { describe, expect, it } from "vitest";
import { createStats, STAT_KEYS, updateStats } from "../src/progression";

describe("updateStats", () => {
  it("starts at zero with every key present", () => {
    const stats = createStats();
    expect(Object.keys(stats)).toEqual([...STAT_KEYS]);
    expect(Object.values(stats).every((value) => value === 0)).toBe(true);
  });

  it("counts taps, charts, eclipses and shards spent", () => {
    let stats = createStats();
    stats = updateStats(stats, { type: "tap" });
    stats = updateStats(stats, { type: "tap" });
    stats = updateStats(stats, { type: "charted", flawless: true });
    stats = updateStats(stats, { type: "charted", flawless: false });
    stats = updateStats(stats, { type: "eclipse" });
    stats = updateStats(stats, { type: "shards-spent", amount: 4 });
    expect(stats).toMatchObject({
      taps: 2,
      charts: 2,
      flawlessCharts: 1,
      eclipses: 1,
      shardsSpent: 4,
    });
  });

  it("keeps the longest streak and counts claims", () => {
    let stats = createStats();
    for (const streak of [1, 2, 3, 1, 2]) stats = updateStats(stats, { type: "comet", streak });
    expect(stats.cometsClaimed).toBe(5);
    expect(stats.longestStreak).toBe(3);
  });

  it("keeps the best production and returns the same object when not beaten", () => {
    const base = updateStats(createStats(), { type: "production", perSecond: 12.5 });
    expect(base.bestStarlightPerSecond).toBe(12.5);
    expect(updateStats(base, { type: "production", perSecond: 3 })).toBe(base);
    expect(updateStats(base, { type: "production", perSecond: Number.NaN })).toBe(base);
    expect(updateStats(base, { type: "production", perSecond: 20 }).bestStarlightPerSecond).toBe(
      20,
    );
  });

  it("adds offline seconds and full collects", () => {
    let stats = updateStats(createStats(), { type: "offline", seconds: 600, full: false });
    stats = updateStats(stats, { type: "offline", seconds: 28800, full: true });
    expect(stats.offlineSecondsCollected).toBe(29400);
    expect(stats.fullOfflineCollects).toBe(1);
  });

  it("ignores NaN, negative and infinite increments", () => {
    const stats = createStats();
    for (const seconds of [Number.NaN, -5, Number.POSITIVE_INFINITY]) {
      expect(updateStats(stats, { type: "active", seconds }).activeSeconds).toBe(0);
      expect(
        updateStats(stats, { type: "offline", seconds, full: false }).offlineSecondsCollected,
      ).toBe(0);
    }
    expect(updateStats(stats, { type: "shards-spent", amount: -3 }).shardsSpent).toBe(0);
  });

  it("does not mutate its input", () => {
    const stats = Object.freeze(createStats());
    expect(updateStats(stats, { type: "tap" }).taps).toBe(1);
    expect(stats.taps).toBe(0);
  });
});
