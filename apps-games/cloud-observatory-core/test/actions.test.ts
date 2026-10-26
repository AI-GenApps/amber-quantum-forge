import { describe, expect, it } from "vitest";
import { applyOffline, buyBoon, buyInstrument, buyUpgrade, gather, tick } from "../src/actions";
import { bulkCost, gatherValue, starlightPerSecond } from "../src/economy";
import { CATALOG, deepFreeze, FULL_CATALOG, stateWith, TELESCOPE } from "./fixtures/catalog";

describe("gather", () => {
  it("adds the gather value to all three starlight counters and counts the tap", () => {
    const state = stateWith({
      upgrades: ["tel-1"],
      starlight: 5,
      cycleStarlight: 3,
      lifetimeStarlight: 9,
    });
    const value = gatherValue(state, CATALOG);
    expect(value).toBe(2);
    const next = gather(state, CATALOG);
    expect(next.starlight).toBe(7);
    expect(next.cycleStarlight).toBe(5);
    expect(next.lifetimeStarlight).toBe(11);
    expect(next.taps).toBe(1);
  });

  it("clamps at the value ceiling", () => {
    const next = gather(stateWith({ starlight: 1e300, cycleStarlight: 1e300 }), CATALOG);
    expect(next.starlight).toBe(1e300);
    expect(next.cycleStarlight).toBe(1e300);
  });
});

describe("tick", () => {
  const producing = stateWith({ owned: { telescope: 10, lens: 3 }, upgrades: ["tel-1"] });

  it("adds production for the elapsed seconds and advances the cycle clock", () => {
    const rate = starlightPerSecond(producing, CATALOG);
    const next = tick(producing, 10, CATALOG);
    expect(next.starlight).toBeCloseTo(producing.starlight + rate * 10, 9);
    expect(next.cycleStarlight).toBeCloseTo(rate * 10, 9);
    expect(next.lifetimeStarlight).toBeCloseTo(rate * 10, 9);
    expect(next.cycleSeconds).toBe(10);
  });

  it("splitting a tick does not change the result", () => {
    const whole = tick(producing, 20, CATALOG);
    const split = tick(tick(producing, 10, CATALOG), 10, CATALOG);
    for (const key of [
      "starlight",
      "cycleStarlight",
      "lifetimeStarlight",
      "cycleSeconds",
    ] as const) {
      expect(Math.abs(split[key] - whole[key]) / whole[key]).toBeLessThan(1e-9);
    }
  });

  it("is deterministic", () => {
    expect(tick(producing, 7.5, CATALOG)).toEqual(tick(producing, 7.5, CATALOG));
  });

  it("ignores NaN, Infinity, zero and negative seconds", () => {
    for (const seconds of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0, -4]) {
      expect(tick(producing, seconds, CATALOG)).toEqual(producing);
    }
  });

  it("does not mutate a frozen input", () => {
    const frozen = deepFreeze(stateWith({ owned: { telescope: 4 } }));
    expect(() => tick(frozen, 5, deepFreeze({ ...CATALOG }))).not.toThrow();
    expect(() => gather(frozen, CATALOG)).not.toThrow();
  });
});

describe("buyInstrument", () => {
  it("rejects an unknown id", () => {
    expect(buyInstrument(stateWith(), "ghost", 1, CATALOG)).toEqual({
      ok: false,
      reason: "unknown-id",
    });
  });

  it("rejects an instrument whose predecessor was never bought", () => {
    const state = stateWith({ starlight: 1e6 });
    expect(buyInstrument(state, "lens", 1, CATALOG)).toEqual({ ok: false, reason: "not-unlocked" });
  });

  it("unlocks the next instrument after one of the previous", () => {
    const state = stateWith({ starlight: 1e6, owned: { telescope: 1 } });
    expect(buyInstrument(state, "lens", 1, CATALOG).ok).toBe(true);
  });

  it("rejects when starlight is short", () => {
    expect(buyInstrument(stateWith({ starlight: 14.9 }), "telescope", 1, CATALOG)).toEqual({
      ok: false,
      reason: "insufficient-starlight",
    });
  });

  it("rejects invalid quantities", () => {
    for (const quantity of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(buyInstrument(stateWith({ starlight: 1e6 }), "telescope", quantity, CATALOG)).toEqual({
        ok: false,
        reason: "invalid-quantity",
      });
    }
  });

  it("buys one, spending exactly the unit cost", () => {
    const result = buyInstrument(stateWith({ starlight: 20 }), "telescope", 1, CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.starlight).toBe(5);
    expect(result.state.owned).toEqual({ telescope: 1 });
    expect(result.cost).toBe(15);
    expect(result.quantity).toBe(1);
    expect(result.events).toEqual([
      { type: "purchased", instrumentId: "telescope", quantity: 1, cost: 15 },
    ]);
  });

  it("buys ten for the geometric sum", () => {
    const state = stateWith({ starlight: 1000 });
    const result = buyInstrument(state, "telescope", 10, CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const cost = bulkCost(TELESCOPE, 0, 10);
    expect(result.state.starlight).toBeCloseTo(1000 - cost, 9);
    expect(result.state.owned.telescope).toBe(10);
  });

  it("rejects a bulk purchase it cannot afford", () => {
    const state = stateWith({ starlight: 100 });
    expect(buyInstrument(state, "telescope", 10, CATALOG)).toEqual({
      ok: false,
      reason: "insufficient-starlight",
    });
  });

  it("buys the maximum affordable amount", () => {
    const state = stateWith({ starlight: 1000 });
    const result = buyInstrument(state, "telescope", "max", CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.quantity).toBe(19);
    expect(result.state.starlight).toBeGreaterThanOrEqual(0);
    expect(result.state.starlight).toBeLessThan(15 * 1.12 ** 19);
  });

  it("max with nothing affordable is a rejection", () => {
    expect(buyInstrument(stateWith({ starlight: 3 }), "telescope", "max", CATALOG)).toEqual({
      ok: false,
      reason: "insufficient-starlight",
    });
  });

  it("clear glass makes units 5 percent cheaper", () => {
    const state = stateWith({ starlight: 14.25, boons: ["clear-glass"] });
    const result = buyInstrument(state, "telescope", 1, FULL_CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cost).toBeCloseTo(14.25, 12);
    expect(result.state.starlight).toBeCloseTo(0, 9);
  });

  it("does not mutate frozen input", () => {
    const state = deepFreeze(stateWith({ starlight: 100 }));
    const result = buyInstrument(state, "telescope", 2, deepFreeze({ ...CATALOG }));
    expect(result.ok).toBe(true);
    expect(state.starlight).toBe(100);
    expect(state.owned).toEqual({});
  });
});

describe("buyUpgrade", () => {
  it("rejects an unknown upgrade", () => {
    expect(buyUpgrade(stateWith(), "ghost", CATALOG)).toEqual({ ok: false, reason: "unknown-id" });
  });

  it("rejects an upgrade whose instrument is missing from the catalog", () => {
    const broken = {
      ...CATALOG,
      upgrades: [{ id: "orphan", instrumentId: "ghost", tier: 1, name: "O" }],
    };
    expect(buyUpgrade(stateWith(), "orphan", broken)).toEqual({ ok: false, reason: "unknown-id" });
  });

  it("unlocks exactly at 10, 25 and 50 owned", () => {
    const cases: ReadonlyArray<readonly [string, number]> = [
      ["tel-1", 10],
      ["tel-2", 25],
      ["tel-3", 50],
    ];
    for (const [id, threshold] of cases) {
      const below = stateWith({ starlight: 1e9, owned: { telescope: threshold - 1 } });
      expect(buyUpgrade(below, id, FULL_CATALOG)).toEqual({
        ok: false,
        reason: "threshold-not-met",
      });
      const at = stateWith({ starlight: 1e9, owned: { telescope: threshold } });
      expect(buyUpgrade(at, id, FULL_CATALOG).ok).toBe(true);
    }
  });

  it("rejects when starlight is short", () => {
    const state = stateWith({ starlight: 149, owned: { telescope: 10 } });
    expect(buyUpgrade(state, "tel-1", CATALOG)).toEqual({
      ok: false,
      reason: "insufficient-starlight",
    });
  });

  it("rejects a second purchase", () => {
    const state = stateWith({ starlight: 1e6, owned: { telescope: 10 }, upgrades: ["tel-1"] });
    expect(buyUpgrade(state, "tel-1", CATALOG)).toEqual({ ok: false, reason: "already-owned" });
  });

  it("spends 10 times the base cost and records the upgrade", () => {
    const state = stateWith({ starlight: 200, owned: { telescope: 10 } });
    const result = buyUpgrade(state, "tel-1", CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.starlight).toBe(50);
    expect(result.state.upgrades).toEqual(["tel-1"]);
    expect(result.events).toEqual([{ type: "upgraded", upgradeId: "tel-1", cost: 150 }]);
  });

  it("Second Sight takes a quarter off", () => {
    const state = stateWith({
      starlight: 112.5,
      owned: { telescope: 10 },
      boons: ["second-sight"],
    });
    const result = buyUpgrade(state, "tel-1", FULL_CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.starlight).toBe(0);
  });

  it("does not mutate frozen input", () => {
    const state = deepFreeze(stateWith({ starlight: 200, owned: { telescope: 10 } }));
    expect(buyUpgrade(state, "tel-1", deepFreeze({ ...CATALOG })).ok).toBe(true);
    expect(state.upgrades).toEqual([]);
  });
});

describe("buyBoon", () => {
  it("rejects an unknown boon", () => {
    expect(buyBoon(stateWith({ shards: 99 }), "ghost", CATALOG)).toEqual({
      ok: false,
      reason: "unknown-id",
    });
  });

  it("rejects when shards are short", () => {
    expect(buyBoon(stateWith({ shards: 1 }), "brass-polish", CATALOG)).toEqual({
      ok: false,
      reason: "insufficient-shards",
    });
  });

  it("rejects a boon already owned", () => {
    expect(
      buyBoon(stateWith({ shards: 9, boons: ["brass-polish"] }), "brass-polish", CATALOG),
    ).toEqual({
      ok: false,
      reason: "already-owned",
    });
  });

  it("spends shards and records the boon", () => {
    const result = buyBoon(stateWith({ shards: 5 }), "brass-polish", CATALOG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.shards).toBe(3);
    expect(result.state.boons).toEqual(["brass-polish"]);
    expect(result.events).toEqual([{ type: "boon-bought", boonId: "brass-polish", cost: 2 }]);
  });

  it("does not mutate frozen input", () => {
    const state = deepFreeze(stateWith({ shards: 5 }));
    expect(buyBoon(state, "dark-adapted", deepFreeze({ ...CATALOG })).ok).toBe(true);
    expect(state.boons).toEqual([]);
  });
});

describe("applyOffline wiring", () => {
  it("leaves the state alone when nothing produces", () => {
    const state = stateWith();
    expect(applyOffline(state, 3600, CATALOG)).toEqual({
      state,
      gained: 0,
      secondsCounted: 3600,
      capped: false,
    });
  });
});
