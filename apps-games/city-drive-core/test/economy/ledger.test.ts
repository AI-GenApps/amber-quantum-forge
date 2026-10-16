import { describe, expect, it } from "vitest";
import {
  defaultSave,
  purchaseCar,
  reconcileWithRoster,
  recordMission,
  selectCar,
  totalStars,
} from "../../src/index";
import { readRoster } from "./roster-support";

const MISSION = { id: "d1-m01", reward_coins: { "1": 40, "2": 64, "3": 96 } } as const;
const roster = readRoster();
const fresh = () => defaultSave(roster.starter);

describe("recordMission", () => {
  it("credits coins and records stars and time on a first clear", () => {
    const { save, payout } = recordMission(fresh(), MISSION, {
      success: true,
      stars: 2,
      time: 31.5,
    });
    expect(save.coins).toBe(64);
    expect(save.missions["d1-m01"]).toEqual({ stars: 2, best_time_s: 31.5 });
    expect(payout).toMatchObject({ coins: 64, firstClear: true, missionId: "d1-m01" });
  });

  it("pays the upgrade difference and keeps the faster time", () => {
    const a = recordMission(fresh(), MISSION, { success: true, stars: 1, time: 40 });
    const b = recordMission(a.save, MISSION, { success: true, stars: 3, time: 35 });
    expect(b.payout.coins).toBe(96 - 40 + 4);
    expect(b.save.coins).toBe(40 + 60);
    expect(b.save.missions["d1-m01"]).toEqual({ stars: 3, best_time_s: 35 });
    const c = recordMission(b.save, MISSION, { success: true, stars: 1, time: 50 });
    expect(c.save.missions["d1-m01"]).toEqual({ stars: 3, best_time_s: 35 });
    expect(c.payout.coins).toBe(4);
  });

  it("changes nothing on a failed run", () => {
    const start = fresh();
    const { save, payout } = recordMission(start, MISSION, { success: false, stars: 0, time: 12 });
    expect(save).toBe(start);
    expect(payout.coins).toBe(0);
  });

  it("ignores a stars value on a failed result", () => {
    const { save } = recordMission(fresh(), MISSION, { success: false, stars: 3, time: 1 });
    expect(save.coins).toBe(0);
    expect(save.missions).toEqual({});
  });

  it("does not mutate the previous save", () => {
    const start = fresh();
    recordMission(start, MISSION, { success: true, stars: 3, time: 20 });
    expect(start.coins).toBe(0);
    expect(start.missions).toEqual({});
  });

  it("counts total stars across missions", () => {
    let save = fresh();
    save = recordMission(save, MISSION, { success: true, stars: 3, time: 20 }).save;
    save = recordMission(
      save,
      { ...MISSION, id: "d1-m02" },
      { success: true, stars: 1, time: 20 },
    ).save;
    expect(totalStars(save)).toBe(4);
  });
});

describe("purchaseCar and selectCar", () => {
  const rich = { ...fresh(), coins: 500 };

  it("spends coins and unlocks the car", () => {
    const result = purchaseCar(rich, roster, "hatch");
    if (!result.ok) throw new Error("purchase should succeed");
    expect(result.save.coins).toBe(100);
    expect(result.save.owned_cars).toEqual(["sedan", "hatch"]);
  });

  it("allows spending the exact balance", () => {
    const result = purchaseCar({ ...fresh(), coins: 400 }, roster, "hatch");
    expect(result.ok && result.save.coins).toBe(0);
  });

  it("refuses when short of coins and reports how many are missing", () => {
    expect(purchaseCar({ ...fresh(), coins: 399 }, roster, "hatch")).toEqual({
      ok: false,
      reason: "not-enough-coins",
      missing: 1,
    });
  });

  it("refuses a car the player already owns and an unknown car", () => {
    expect(purchaseCar(rich, roster, "sedan")).toEqual({ ok: false, reason: "already-owned" });
    expect(purchaseCar(rich, roster, "nope")).toEqual({ ok: false, reason: "unknown-car" });
  });

  it("never lets the balance go negative", () => {
    for (const car of roster.cars) {
      const result = purchaseCar({ ...fresh(), coins: 0 }, roster, car.id);
      if (result.ok) expect(result.save.coins).toBeGreaterThanOrEqual(0);
    }
  });

  it("selects only owned cars", () => {
    expect(selectCar(fresh(), "hatch")).toEqual({ ok: false, reason: "not-owned" });
    const bought = purchaseCar(rich, roster, "hatch");
    if (!bought.ok) throw new Error("purchase should succeed");
    const selected = selectCar(bought.save, "hatch");
    expect(selected.ok && selected.save.selected_car).toBe("hatch");
  });
});

describe("reconcileWithRoster", () => {
  it("returns the same save when everything is known", () => {
    const save = fresh();
    expect(reconcileWithRoster(save, roster)).toBe(save);
  });

  it("drops cars the roster no longer has and falls back to the starter", () => {
    const save = { ...fresh(), owned_cars: ["sedan", "gone"], selected_car: "gone" };
    const fixed = reconcileWithRoster(save, roster);
    expect(fixed.owned_cars).toEqual(["sedan"]);
    expect(fixed.selected_car).toBe("sedan");
  });

  it("always owns the starter", () => {
    const save = { ...fresh(), owned_cars: ["hatch"], selected_car: "hatch" };
    expect(reconcileWithRoster(save, roster).owned_cars).toEqual(["sedan", "hatch"]);
  });
});
