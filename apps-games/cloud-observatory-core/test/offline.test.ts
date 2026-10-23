import { describe, expect, it } from "vitest";
import { applyOffline } from "../src/actions";
import { starlightPerSecond } from "../src/economy";
import { CATALOG, deepFreeze, FULL_CATALOG, stateWith } from "./fixtures/catalog";

const PRODUCING = stateWith({
  owned: { telescope: 100 },
  starlight: 50,
  taps: 12,
  cycleSeconds: 40,
});

describe("applyOffline", () => {
  it("pays production times elapsed times 50 percent by default", () => {
    expect(starlightPerSecond(PRODUCING, CATALOG)).toBeCloseTo(20, 12);
    const result = applyOffline(PRODUCING, 3600, CATALOG);
    expect(result.gained).toBeCloseTo(36000, 6);
    expect(result.secondsCounted).toBe(3600);
    expect(result.capped).toBe(false);
    expect(result.state.starlight).toBeCloseTo(36050, 6);
  });

  it("caps at 28,800 seconds and says so", () => {
    const result = applyOffline(PRODUCING, 100000, CATALOG);
    expect(result.secondsCounted).toBe(28800);
    expect(result.capped).toBe(true);
    expect(result.gained).toBeCloseTo(28800 * 20 * 0.5, 6);
  });

  it("is not capped at exactly 28,800 seconds", () => {
    const result = applyOffline(PRODUCING, 28800, CATALOG);
    expect(result.capped).toBe(false);
    expect(result.secondsCounted).toBe(28800);
  });

  it("efficiency is 50, 75 and 100 percent by boon", () => {
    const base = applyOffline(PRODUCING, 1000, FULL_CATALOG).gained;
    const night = applyOffline({ ...PRODUCING, boons: ["night-watch"] }, 1000, FULL_CATALOG).gained;
    const vigil = applyOffline(
      { ...PRODUCING, boons: ["night-watch", "long-vigil"] },
      1000,
      FULL_CATALOG,
    ).gained;
    expect(base).toBeCloseTo(10000, 6);
    expect(night).toBeCloseTo(15000, 6);
    expect(vigil).toBeCloseTo(20000, 6);
  });

  it("gives nothing for negative, NaN or non finite elapsed time", () => {
    for (const elapsed of [
      -1,
      -86400,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      0,
    ]) {
      const result = applyOffline(PRODUCING, elapsed, CATALOG);
      expect(result.gained).toBe(0);
      expect(result.secondsCounted).toBe(0);
      expect(result.capped).toBe(false);
      expect(result.state).toEqual(PRODUCING);
    }
  });

  it("gives nothing with zero production", () => {
    const result = applyOffline(stateWith(), 7200, CATALOG);
    expect(result.gained).toBe(0);
    expect(result.state).toEqual(stateWith());
  });

  it("gives identical outputs for identical inputs", () => {
    expect(applyOffline(PRODUCING, 1234.5, CATALOG)).toEqual(
      applyOffline(PRODUCING, 1234.5, CATALOG),
    );
  });

  it("feeds cycle and lifetime starlight but not taps or the cycle clock", () => {
    const result = applyOffline(PRODUCING, 600, CATALOG);
    expect(result.state.cycleStarlight).toBeCloseTo(6000, 6);
    expect(result.state.lifetimeStarlight).toBeCloseTo(6000, 6);
    expect(result.state.taps).toBe(12);
    expect(result.state.cycleSeconds).toBe(40);
  });

  it("does not mutate frozen input", () => {
    const state = deepFreeze({ ...PRODUCING });
    expect(applyOffline(state, 60, deepFreeze({ ...CATALOG })).gained).toBeGreaterThan(0);
    expect(state.starlight).toBe(50);
  });
});
