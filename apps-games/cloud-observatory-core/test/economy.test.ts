import { describe, expect, it } from "vitest";
import {
  atlasFactor,
  bulkCost,
  chartCost,
  costMultiplier,
  gatherMultiplier,
  gatherValue,
  globalMultiplier,
  instrumentMultiplier,
  instrumentRate,
  instrumentUnitCost,
  maxAffordable,
  offlineEfficiency,
  starlightPerSecond,
  upgradeCost,
  upgradeCostMultiplier,
  upgradeThreshold,
} from "../src/economy";
import {
  CATALOG,
  CROWN,
  FULL_CATALOG,
  LENS,
  LYRE,
  lcg,
  stateWith,
  TELESCOPE,
} from "./fixtures/catalog";

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.abs(expected);
}

describe("instrumentUnitCost", () => {
  it("is baseCost times growth to the owned count", () => {
    expect(instrumentUnitCost(TELESCOPE, 0)).toBe(15);
    expect(instrumentUnitCost(TELESCOPE, 10)).toBeCloseTo(15 * 1.12 ** 10, 9);
    expect(instrumentUnitCost(LENS, 3, 0.95)).toBeCloseTo(100 * 1.15 ** 3 * 0.95, 9);
  });

  it("clamps absurd costs to the value ceiling", () => {
    expect(instrumentUnitCost(LENS, 100000)).toBe(1e300);
  });
});

describe("bulkCost", () => {
  for (const def of [TELESCOPE, LENS]) {
    for (const owned of [0, 7, 40]) {
      for (const costMult of [1, 0.95]) {
        it(`${def.id} from ${owned} owned (cost x${costMult}) equals the sum of unit costs for k in 1..250`, () => {
          let sum = 0;
          for (let k = 1; k <= 250; k++) {
            sum += instrumentUnitCost(def, owned + k - 1, costMult);
            expect(relativeError(bulkCost(def, owned, k, costMult), sum)).toBeLessThan(1e-9);
          }
        });
      }
    }
  }

  it("is zero for zero, negative and NaN counts", () => {
    expect(bulkCost(TELESCOPE, 0, 0)).toBe(0);
    expect(bulkCost(TELESCOPE, 0, -3)).toBe(0);
    expect(bulkCost(TELESCOPE, 0, Number.NaN)).toBe(0);
  });

  it("buying one equals the unit cost", () => {
    expect(bulkCost(TELESCOPE, 5, 1)).toBeCloseTo(instrumentUnitCost(TELESCOPE, 5), 9);
  });
});

describe("maxAffordable", () => {
  for (const def of [TELESCOPE, LENS]) {
    for (const owned of [0, 13]) {
      it(`${def.id} from ${owned}: exact boundary at, just below and just above k units`, () => {
        for (let k = 1; k <= 60; k++) {
          const cost = bulkCost(def, owned, k);
          expect(maxAffordable(def, owned, cost)).toBe(k);
          expect(maxAffordable(def, owned, cost * (1 - 1e-9))).toBe(k - 1);
          expect(maxAffordable(def, owned, cost * (1 + 1e-9))).toBe(k);
        }
      });

      it(`${def.id} from ${owned}: matches a buying loop on random budgets`, () => {
        const next = lcg(owned + 99);
        for (let trial = 0; trial < 300; trial++) {
          const budget = 10 ** (next() * 12);
          let remaining = budget;
          let count = 0;
          while (remaining >= instrumentUnitCost(def, owned + count)) {
            remaining -= instrumentUnitCost(def, owned + count);
            count += 1;
          }
          expect(maxAffordable(def, owned, budget)).toBe(count);
        }
      });
    }
  }

  it("honours the cost multiplier", () => {
    const budget = bulkCost(TELESCOPE, 0, 10, 0.95);
    expect(maxAffordable(TELESCOPE, 0, budget, 0.95)).toBe(10);
    expect(maxAffordable(TELESCOPE, 0, budget, 1)).toBeLessThan(10);
  });

  it("returns 0 for poor, zero, negative and NaN budgets", () => {
    expect(maxAffordable(TELESCOPE, 0, 14.99)).toBe(0);
    expect(maxAffordable(TELESCOPE, 0, 0)).toBe(0);
    expect(maxAffordable(TELESCOPE, 0, -10)).toBe(0);
    expect(maxAffordable(TELESCOPE, 0, Number.NaN)).toBe(0);
  });

  it("stays finite with a budget at the value ceiling", () => {
    const count = maxAffordable(TELESCOPE, 0, 1e300);
    expect(Number.isInteger(count)).toBe(true);
    expect(count).toBeGreaterThan(1000);
  });
});

describe("upgrades", () => {
  it("costs 10, 100 and 1000 times the base cost", () => {
    expect(upgradeCost(TELESCOPE, 1)).toBe(150);
    expect(upgradeCost(TELESCOPE, 2)).toBe(1500);
    expect(upgradeCost(TELESCOPE, 3)).toBe(15000);
    expect(upgradeCost(TELESCOPE, 1, 0.75)).toBe(112.5);
  });

  it("returns the ceiling for an unknown tier", () => {
    expect(upgradeCost(TELESCOPE, 4)).toBe(1e300);
  });

  it("has thresholds 10, 25 and 50", () => {
    expect([1, 2, 3].map(upgradeThreshold)).toEqual([10, 25, 50]);
    expect(upgradeThreshold(4)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("multipliers", () => {
  it("multiplies upgrade tiers 2, 2 and 3 for the instrument only", () => {
    const state = stateWith({ upgrades: ["tel-1", "tel-2", "tel-3", "lens-1"] });
    expect(instrumentMultiplier(state, "telescope", FULL_CATALOG)).toBe(12);
    expect(instrumentMultiplier(state, "lens", FULL_CATALOG)).toBe(2);
    expect(instrumentMultiplier(stateWith(), "lens", FULL_CATALOG)).toBe(1);
  });

  it("applies the Brass Polish instrument boon", () => {
    const state = stateWith({ boons: ["brass-polish"], upgrades: ["tel-1"] });
    expect(instrumentMultiplier(state, "telescope", CATALOG)).toBe(4);
    expect(instrumentMultiplier(state, "lens", CATALOG)).toBe(1);
  });

  it("gather multiplier comes from Telescope upgrades only", () => {
    expect(gatherMultiplier(stateWith(), CATALOG)).toBe(1);
    expect(gatherMultiplier(stateWith({ upgrades: ["tel-1"] }), CATALOG)).toBe(2);
    expect(gatherMultiplier(stateWith({ upgrades: ["tel-1", "tel-2"] }), CATALOG)).toBe(4);
    expect(gatherMultiplier(stateWith({ upgrades: ["lens-1"] }), CATALOG)).toBe(1);
    expect(gatherMultiplier(stateWith({ boons: ["brass-polish"] }), CATALOG)).toBe(1);
    expect(
      gatherMultiplier(stateWith({ upgrades: ["tel-1", "tel-2", "tel-3"] }), FULL_CATALOG),
    ).toBe(12);
  });

  it("gather multiplier is 1 for an empty catalog", () => {
    const empty = { instruments: [], upgrades: [], constellations: [], boons: [] };
    expect(gatherMultiplier(stateWith(), empty)).toBe(1);
  });

  it("atlas factor is 1 or 1.5", () => {
    expect(atlasFactor(stateWith(), FULL_CATALOG)).toBe(1);
    expect(atlasFactor(stateWith({ boons: ["atlas-ink"] }), FULL_CATALOG)).toBe(1.5);
  });

  it("global multiplier combines atlas, achievements, corona and totality", () => {
    const charted = ["lyre", "crown", "a", "b"];
    const base = stateWith({ charted });
    expect(globalMultiplier(stateWith(), FULL_CATALOG)).toBe(1);
    expect(globalMultiplier(base, FULL_CATALOG)).toBeCloseTo(1.2, 12);
    expect(globalMultiplier({ ...base, boons: ["atlas-ink"] }, FULL_CATALOG)).toBeCloseTo(1.3, 12);
    const twenty = Array.from({ length: 20 }, (_, i) => `ach-${i}`);
    expect(globalMultiplier(stateWith({ achievements: twenty }), FULL_CATALOG)).toBeCloseTo(
      1.2,
      12,
    );
    expect(globalMultiplier(stateWith({ boons: ["corona"] }), FULL_CATALOG)).toBe(1.5);
    expect(globalMultiplier(stateWith({ boons: ["totality"] }), FULL_CATALOG)).toBe(2);
    expect(globalMultiplier(stateWith({ boons: ["corona", "totality"] }), FULL_CATALOG)).toBe(3);
    const everything = stateWith({
      charted,
      achievements: twenty,
      boons: ["atlas-ink", "corona", "totality"],
    });
    expect(globalMultiplier(everything, FULL_CATALOG)).toBeCloseTo(1.5 * 3, 12);
  });
});

describe("starlightPerSecond", () => {
  it("is zero with nothing owned", () => {
    expect(starlightPerSecond(stateWith(), CATALOG)).toBe(0);
  });

  it("hand computed: 10 telescopes make 2 per second", () => {
    expect(starlightPerSecond(stateWith({ owned: { telescope: 10 } }), CATALOG)).toBeCloseTo(2, 12);
  });

  it("hand computed: tel-1 doubles it to 4", () => {
    const state = stateWith({ owned: { telescope: 10 }, upgrades: ["tel-1"] });
    expect(starlightPerSecond(state, CATALOG)).toBeCloseTo(4, 12);
  });

  it("hand computed: three charted constellations add 15%", () => {
    const state = stateWith({ owned: { telescope: 10 }, charted: ["lyre", "crown", "x"] });
    expect(starlightPerSecond(state, CATALOG)).toBeCloseTo(2.3, 12);
  });

  it("hand computed: everything together makes 39.6", () => {
    const state = stateWith({
      owned: { telescope: 10, lens: 5 },
      upgrades: ["tel-1", "tel-2"],
      boons: ["brass-polish", "atlas-ink", "corona"],
      charted: ["lyre", "crown"],
      achievements: ["a", "b", "c", "d", "e"],
    });
    expect(starlightPerSecond(state, FULL_CATALOG)).toBeCloseTo(39.6, 9);
  });

  it("ignores owned counts of unknown instruments", () => {
    expect(starlightPerSecond(stateWith({ owned: { ghost: 50 } }), CATALOG)).toBe(0);
  });
});

describe("instrumentRate", () => {
  it("reports one instrument before the global multiplier", () => {
    const state = stateWith({ owned: { telescope: 10, lens: 5 }, upgrades: ["tel-1"] });
    expect(instrumentRate(state, "telescope", CATALOG)).toBeCloseTo(4, 12);
    expect(instrumentRate(state, "lens", CATALOG)).toBeCloseTo(6, 12);
    expect(instrumentRate(state, "ghost", CATALOG)).toBe(0);
  });
});

describe("gatherValue", () => {
  it("is 1 at the start", () => {
    expect(gatherValue(stateWith(), CATALOG)).toBe(1);
  });

  it("multiplies Telescope upgrades by the global multiplier", () => {
    const state = stateWith({ upgrades: ["tel-1", "tel-2"], charted: ["a", "b", "c", "d"] });
    expect(gatherValue(state, CATALOG)).toBeCloseTo(4.8, 12);
  });
});

describe("costs and efficiency", () => {
  it("cost multiplier defaults to 1 and stacks clear glass", () => {
    expect(costMultiplier(stateWith(), FULL_CATALOG)).toBe(1);
    expect(costMultiplier(stateWith({ boons: ["clear-glass"] }), FULL_CATALOG)).toBe(0.95);
  });

  it("upgrade cost multiplier follows Second Sight", () => {
    expect(upgradeCostMultiplier(stateWith(), FULL_CATALOG)).toBe(1);
    expect(upgradeCostMultiplier(stateWith({ boons: ["second-sight"] }), FULL_CATALOG)).toBe(0.75);
  });

  it("chart cost uses the cost multiplier", () => {
    expect(chartCost(LYRE, stateWith(), CATALOG)).toBe(60);
    expect(chartCost(CROWN, stateWith({ boons: ["clear-glass"] }), FULL_CATALOG)).toBeCloseTo(
      380,
      9,
    );
  });

  it("offline efficiency is 50, 75 or 100 percent", () => {
    expect(offlineEfficiency(stateWith(), FULL_CATALOG)).toBe(0.5);
    expect(offlineEfficiency(stateWith({ boons: ["night-watch"] }), FULL_CATALOG)).toBe(0.75);
    expect(
      offlineEfficiency(stateWith({ boons: ["night-watch", "long-vigil"] }), FULL_CATALOG),
    ).toBe(1);
    expect(offlineEfficiency(stateWith({ boons: ["long-vigil"] }), FULL_CATALOG)).toBe(1);
  });

  it("offline efficiency never exceeds 100 percent", () => {
    const catalog = {
      ...CATALOG,
      boons: [{ id: "x", name: "X", cost: 1, effect: { kind: "offline-efficiency", value: 3 } }],
    } as const;
    expect(offlineEfficiency(stateWith({ boons: ["x"] }), catalog)).toBe(1);
  });
});
