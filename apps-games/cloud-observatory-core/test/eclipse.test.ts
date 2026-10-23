import { describe, expect, it } from "vitest";
import { buyBoon } from "../src/actions";
import { canEclipse, eclipse, pendingShards } from "../src/eclipse";
import { deepFreeze, FULL_CATALOG, stateWith } from "./fixtures/catalog";

describe("pendingShards", () => {
  it("has exact boundaries", () => {
    expect(pendingShards(2.5e10 - 1)).toBe(4);
    expect(pendingShards(2.5e10)).toBe(5);
    expect(pendingShards(1e11)).toBe(10);
    expect(pendingShards(1e9)).toBe(1);
    expect(pendingShards(999999999)).toBe(0);
    expect(pendingShards(1e12)).toBe(31);
  });

  it("is zero for zero, negatives and non finite values", () => {
    expect(pendingShards(0)).toBe(0);
    expect(pendingShards(-1e12)).toBe(0);
    expect(pendingShards(Number.NaN)).toBe(0);
    expect(pendingShards(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("never decreases as cycle starlight grows", () => {
    let previous = 0;
    for (let exponent = 8; exponent <= 30; exponent += 0.25) {
      const shards = pendingShards(10 ** exponent);
      expect(shards).toBeGreaterThanOrEqual(previous);
      previous = shards;
    }
  });
});

describe("canEclipse", () => {
  it("needs five pending shards", () => {
    expect(canEclipse(stateWith({ cycleStarlight: 2.5e10 - 1 }))).toBe(false);
    expect(canEclipse(stateWith({ cycleStarlight: 2.5e10 }))).toBe(true);
    expect(canEclipse(stateWith({ cycleStarlight: 0, starlight: 1e20 }))).toBe(false);
  });
});

const READY = stateWith({
  starlight: 123456,
  cycleStarlight: 4e10,
  lifetimeStarlight: 9e10,
  shards: 3,
  shardsEarned: 3,
  owned: { telescope: 40, lens: 12 },
  upgrades: ["tel-1", "lens-1"],
  charted: ["lyre"],
  boons: ["brass-polish"],
  achievements: ["first-light"],
  eclipses: 1,
  taps: 321,
  cycleSeconds: 9000,
});

describe("eclipse", () => {
  it("is rejected below five pending shards", () => {
    const state = stateWith({ cycleStarlight: 2.4e10 });
    expect(eclipse(state, FULL_CATALOG)).toEqual({ ok: false, reason: "eclipse-unavailable" });
  });

  it("resets the cycle and keeps the permanent progress", () => {
    const result = eclipse(READY, FULL_CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.shardsGained).toBe(6);
    expect(result.state).toEqual({
      starlight: 0,
      cycleStarlight: 0,
      lifetimeStarlight: 9e10,
      shards: 9,
      shardsEarned: 9,
      owned: {},
      upgrades: [],
      charted: ["lyre"],
      boons: ["brass-polish"],
      achievements: ["first-light"],
      eclipses: 2,
      taps: 321,
      cycleSeconds: 0,
    });
    expect(result.events).toEqual([{ type: "eclipsed", shards: 6, eclipses: 2 }]);
  });

  it("applies start-starlight and start-owned boons to the next cycle", () => {
    const state = { ...READY, boons: ["dark-adapted", "apprentice"] };
    const result = eclipse(state, FULL_CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.starlight).toBe(1000);
    expect(result.state.owned).toEqual({ telescope: 5, lens: 3 });
    expect(result.state.cycleStarlight).toBe(0);
  });

  it("does not count starting starlight as earned", () => {
    const result = eclipse({ ...READY, boons: ["dark-adapted"] }, FULL_CATALOG);
    if (!result.ok) throw new Error("expected success");
    expect(result.state.cycleStarlight).toBe(0);
    expect(result.state.lifetimeStarlight).toBe(9e10);
  });

  it("banked shards buy boons afterwards", () => {
    const result = eclipse(READY, FULL_CATALOG);
    if (!result.ok) throw new Error("expected success");
    const bought = buyBoon(result.state, "night-watch", FULL_CATALOG);
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.state.shards).toBe(5);
    expect(bought.state.shardsEarned).toBe(9);
  });

  it("accumulates counters across repeated Eclipses", () => {
    let state = stateWith({ cycleStarlight: 1e11 });
    for (let round = 1; round <= 3; round++) {
      const result = eclipse(state, FULL_CATALOG);
      if (!result.ok) throw new Error("expected success");
      expect(result.state.eclipses).toBe(round);
      expect(result.state.shards).toBe(10 * round);
      expect(result.state.shardsEarned).toBe(10 * round);
      state = { ...result.state, cycleStarlight: 1e11 };
    }
  });

  it("does not mutate frozen input", () => {
    const state = deepFreeze({ ...READY });
    expect(eclipse(state, deepFreeze({ ...FULL_CATALOG })).ok).toBe(true);
    expect(state.eclipses).toBe(1);
    expect(state.owned).toEqual({ telescope: 40, lens: 12 });
  });
});
