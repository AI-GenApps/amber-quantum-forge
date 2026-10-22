import { describe, expect, it } from "vitest";
import {
  type CarEntry,
  carSpecOf,
  defaultSave,
  fullUpgradeCost,
  levelsOf,
  MAX_LEVELS,
  OVERRIDABLE_FIELDS,
  purchaseUpgrade,
  reconcileWithRoster,
  STOCK_LEVELS,
  trackHasEffect,
  UPGRADE_GAINS,
  UPGRADE_LIMITS,
  upgradeCost,
  upgradedSpec,
} from "../../src/index";
import { readRoster } from "./roster-support";

const roster = readRoster();
const car = (id: string): CarEntry => roster.cars.find((c) => c.id === id) as CarEntry;
const rich = (coins: number) => ({
  ...defaultSave("sedan"),
  coins,
  owned_cars: ["sedan", "hatch"],
});

describe("upgrade costs", () => {
  it("scales 15%, 25% and 40% of the price, rounded to 5 coins", () => {
    expect([0, 1, 2].map((l) => upgradeCost(car("suv"), l))).toEqual([105, 175, 280]);
    expect([0, 1, 2].map((l) => upgradeCost(car("racer"), l))).toEqual([180, 300, 480]);
  });

  it("prices the free starter as if it cost 400", () => {
    expect([0, 1, 2].map((l) => upgradeCost(car("sedan"), l))).toEqual([60, 100, 160]);
  });

  it("has no next level at the top or below zero", () => {
    expect(upgradeCost(car("hatch"), 3)).toBeUndefined();
    expect(upgradeCost(car("hatch"), -1)).toBeUndefined();
  });

  it("totals three tracks of three levels", () => {
    expect(fullUpgradeCost(car("suv"))).toBe((105 + 175 + 280) * 3);
  });

  it("does not charge for a track that cannot improve the car", () => {
    expect(trackHasEffect(car("racer"), "power")).toBe(false);
    expect(trackHasEffect(car("racer"), "brakes")).toBe(false);
    expect(trackHasEffect(car("racer"), "grip")).toBe(true);
    expect(fullUpgradeCost(car("racer"))).toBe(180 + 300 + 480);
    for (const c of roster.cars.filter((x) => x.id !== "racer")) {
      for (const t of ["power", "grip", "brakes"] as const) expect(trackHasEffect(c, t)).toBe(true);
    }
  });
});

describe("purchaseUpgrade", () => {
  it("buys the next level and takes the coins", () => {
    const r = purchaseUpgrade(rich(500), roster, "hatch", "power");
    if (!r.ok) throw new Error("expected success");
    expect(r.cost).toBe(60);
    expect(r.save.coins).toBe(440);
    expect(levelsOf(r.save, "hatch")).toEqual({ power: 1, grip: 0, brakes: 0 });
    expect(levelsOf(r.save, "sedan")).toEqual(STOCK_LEVELS);
  });

  it("walks a track up to level 3 and then refuses", () => {
    let s = rich(10_000);
    for (let i = 0; i < 3; i++) {
      const r = purchaseUpgrade(s, roster, "hatch", "grip");
      if (!r.ok) throw new Error("expected success");
      s = r.save;
    }
    expect(levelsOf(s, "hatch").grip).toBe(3);
    expect(purchaseUpgrade(s, roster, "hatch", "grip")).toEqual({ ok: false, reason: "max-level" });
  });

  it("never lets the balance go negative and says how much is missing", () => {
    const r = purchaseUpgrade(rich(59), roster, "hatch", "brakes");
    expect(r).toEqual({ ok: false, reason: "not-enough-coins", missing: 1 });
    const exact = purchaseUpgrade(rich(60), roster, "hatch", "brakes");
    expect(exact.ok && exact.save.coins).toBe(0);
  });

  it("refuses a track that is already at the car's limit", () => {
    const owned = { ...rich(9999), owned_cars: ["sedan", "racer"] };
    expect(purchaseUpgrade(owned, roster, "racer", "power")).toEqual({
      ok: false,
      reason: "no-effect",
    });
    expect(purchaseUpgrade(owned, roster, "racer", "grip").ok).toBe(true);
  });

  it("refuses unknown and unowned cars", () => {
    expect(purchaseUpgrade(rich(999), roster, "ghost", "power")).toEqual({
      ok: false,
      reason: "unknown-car",
    });
    expect(purchaseUpgrade(rich(999), roster, "racer", "power")).toEqual({
      ok: false,
      reason: "not-owned",
    });
  });

  it("does not change the input save", () => {
    const s = rich(500);
    const before = JSON.stringify(s);
    purchaseUpgrade(s, roster, "hatch", "power");
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("upgradedSpec", () => {
  it("returns the stock spec at level 0", () => {
    for (const c of roster.cars) expect(upgradedSpec(c, STOCK_LEVELS)).toEqual(carSpecOf(c));
  });

  it("only changes fields the roster is allowed to override", () => {
    for (const c of roster.cars) {
      const stock = carSpecOf(c);
      const max = upgradedSpec(c, MAX_LEVELS);
      for (const key of Object.keys(stock) as (keyof typeof stock)[]) {
        if (stock[key] !== max[key]) {
          expect(OVERRIDABLE_FIELDS as readonly string[]).toContain(key);
        }
      }
    }
  });

  it("only touches the fields of the track that was bought", () => {
    const c = car("cab");
    const stock = carSpecOf(c);
    const grip = upgradedSpec(c, { power: 0, grip: 3, brakes: 0 });
    expect(grip.engineForce).toBe(stock.engineForce);
    expect(grip.brakeForce).toBe(stock.brakeForce);
    expect(grip.frictionSlip).toBeGreaterThan(stock.frictionSlip);
    const brakes = upgradedSpec(c, { power: 0, grip: 0, brakes: 1 });
    expect(brakes.brakeForce).toBeCloseTo(
      stock.brakeForce * (1 + (UPGRADE_GAINS.brakes[0]?.gain ?? 0)),
    );
  });

  it("never lowers a field and grows with each level until a ceiling", () => {
    for (const c of roster.cars) {
      const stock = carSpecOf(c);
      let last = stock;
      for (let level = 1; level <= 3; level++) {
        const spec = upgradedSpec(c, { power: level, grip: level, brakes: level });
        for (const key of ["engineForce", "topSpeedKmh", "frictionSlip", "brakeForce"] as const) {
          expect(spec[key]).toBeGreaterThanOrEqual(last[key]);
          expect(spec[key]).toBeGreaterThanOrEqual(stock[key]);
        }
        last = spec;
      }
    }
  });

  it("keeps every car inside the stock envelope the handling suite accepts", () => {
    for (const c of roster.cars) {
      const stock = carSpecOf(c);
      const max = upgradedSpec(c, MAX_LEVELS);
      expect(max.topSpeedKmh).toBeLessThanOrEqual(
        Math.max(stock.topSpeedKmh, UPGRADE_LIMITS.topSpeedKmh),
      );
      expect(max.engineForce / max.mass).toBeLessThanOrEqual(
        Math.max(stock.engineForce / stock.mass, UPGRADE_LIMITS.engineForcePerKg) + 1e-9,
      );
      expect(max.brakeForce / max.mass).toBeLessThanOrEqual(
        Math.max(stock.brakeForce / stock.mass, UPGRADE_LIMITS.brakeForcePerKg) + 1e-9,
      );
      expect(max.frictionSlip).toBeLessThanOrEqual(
        Math.max(stock.frictionSlip, UPGRADE_LIMITS.frictionSlip),
      );
      expect(max.sideFrictionStiffness).toBeLessThanOrEqual(
        Math.max(stock.sideFrictionStiffness, UPGRADE_LIMITS.sideFrictionStiffness),
      );
    }
  });

  it("the ceilings are no higher than the best stock roster values", () => {
    const stocks = roster.cars.map(carSpecOf);
    expect(UPGRADE_LIMITS.topSpeedKmh).toBeLessThanOrEqual(
      Math.max(...stocks.map((s) => s.topSpeedKmh)),
    );
    expect(UPGRADE_LIMITS.engineForcePerKg).toBeLessThanOrEqual(
      Math.max(...stocks.map((s) => s.engineForce / s.mass)) + 1e-9,
    );
    expect(UPGRADE_LIMITS.brakeForcePerKg).toBeLessThanOrEqual(
      Math.max(...stocks.map((s) => s.brakeForce / s.mass)) + 1e-9,
    );
  });

  it("gives a sedan a real gain at level 1 of every track", () => {
    const stock = carSpecOf(car("sedan"));
    const up = upgradedSpec(car("sedan"), { power: 1, grip: 1, brakes: 1 });
    expect(up.engineForce).toBeCloseTo(stock.engineForce * 1.06);
    expect(up.frictionSlip).toBeCloseTo(stock.frictionSlip * 1.06);
    expect(up.brakeForce).toBeCloseTo(stock.brakeForce * 1.06);
  });
});

describe("reconcileWithRoster keeps upgrades tidy", () => {
  it("drops upgrades of cars the roster no longer has", () => {
    const s = {
      ...rich(0),
      owned_cars: ["sedan", "hatch", "gone"],
      upgrades: {
        hatch: { power: 1, grip: 0, brakes: 0 },
        gone: { power: 2, grip: 2, brakes: 2 },
      },
    };
    const fixed = reconcileWithRoster(s, roster);
    expect(Object.keys(fixed.upgrades)).toEqual(["hatch"]);
    expect(reconcileWithRoster(fixed, roster)).toBe(fixed);
  });
});
