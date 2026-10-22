import { dailyChallenge, defaultSave } from "@city-drive/core";
import { describe, expect, it } from "vitest";
import { allMissionDefs } from "../../src/game/daily";
import { ROSTER } from "../../src/save";
import { dailyCard } from "../../src/ui/model/daily";
import { upgradeRows } from "../../src/ui/model/upgrades";

const pool = allMissionDefs().filter((m) => m.district === "district-1");
const save = () => defaultSave("sedan");

describe("dailyCard", () => {
  it("describes the mission, the twist and the day-1 rewards", () => {
    const card = dailyCard(dailyChallenge("2026-10-15", pool, save().daily));
    expect(card.title.length).toBeGreaterThan(0);
    expect(card.typeLabel).toMatch(/Delivery|Taxi|Time trial|Parking/);
    expect(card.rewards).toEqual({ "1": 40, "2": 80, "3": 150 });
    expect(card.bonusPercent).toBe(0);
    expect(card.status).toBe("available");
  });

  it("words the twist for every variant step", () => {
    const twists = new Set<string>();
    for (let day = 1; day <= 28; day++) {
      const date = `2027-02-${String(day).padStart(2, "0")}`;
      twists.add(dailyCard(dailyChallenge(date, pool, save().daily)).twist);
    }
    expect(twists.size).toBeGreaterThan(3);
    const word = "(tighter par times|much tighter par times|busier roads|heavy traffic)";
    const allowed = new RegExp(`^(Standard rules|${word}(, ${word})?)$`);
    for (const t of twists) expect(t).toMatch(allowed);
  });

  it("shows the streak bonus in the rewards", () => {
    const s = { ...save(), daily: { last_claim_date: "2026-10-14", streak: 5 } };
    const card = dailyCard(dailyChallenge("2026-10-15", pool, s.daily));
    expect(card.streak).toBe(6);
    expect(card.bonusPercent).toBe(50);
    expect(card.rewards).toEqual({ "1": 60, "2": 120, "3": 225 });
  });
});

describe("upgradeRows", () => {
  const sedan = ROSTER.cars[0] as (typeof ROSTER.cars)[number];
  const racer = ROSTER.cars.at(-1) as (typeof ROSTER.cars)[number];

  it("has no panel for a car the player does not own", () => {
    expect(upgradeRows(racer, save())).toEqual([]);
  });

  it("lists power, grip and brakes with the next cost and whether it is affordable", () => {
    const rows = upgradeRows(sedan, { ...save(), coins: 80 });
    expect(rows.map((r) => r.track)).toEqual(["power", "grip", "brakes"]);
    expect(rows.every((r) => r.level === 0 && r.cost === 60 && r.canBuy)).toBe(true);
    const poor = upgradeRows(sedan, { ...save(), coins: 20 });
    expect(poor[0]).toMatchObject({ canBuy: false, missing: 40 });
  });

  it("sells no upgrade for a track the car is already maxed on", () => {
    const owned = { ...save(), coins: 9999, owned_cars: ["sedan", "racer"] };
    const rows = upgradeRows(racer, owned);
    expect(rows.map((r) => r.useful)).toEqual([false, true, false]);
    expect(rows[0]).toMatchObject({ cost: undefined, canBuy: false });
    expect(rows[1]).toMatchObject({ cost: 180, canBuy: true });
  });

  it("shows no cost at the top level", () => {
    const maxed = { ...save(), coins: 9999, upgrades: { sedan: { power: 3, grip: 1, brakes: 0 } } };
    const rows = upgradeRows(sedan, maxed);
    expect(rows[0]).toMatchObject({ level: 3, cost: undefined, canBuy: false, missing: 0 });
    expect(rows[1]).toMatchObject({ level: 1, cost: 100, canBuy: true });
  });
});
