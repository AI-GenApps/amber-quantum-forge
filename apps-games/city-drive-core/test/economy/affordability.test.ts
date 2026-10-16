import { describe, expect, it } from "vitest";
import { readRoster } from "./roster-support";
import { readMissions, readProgression, simulate } from "./sim";

const roster = readRoster();
const missions = readMissions();
const progression = readProgression();
const sumRewards = (level: "1" | "2" | "3") =>
  missions.reduce((sum, m) => sum + m.reward_coins[level], 0);
const totalPrices = roster.cars.reduce((sum, c) => sum + c.price, 0);

describe("economy affordability", () => {
  it("covers the 24 validated missions across three districts", () => {
    expect(missions).toHaveLength(24);
    expect(progression.districts).toHaveLength(3);
  });

  it("3-starring everything pays at least 15% more than every car costs", () => {
    const total = sumRewards("3");
    console.log(
      `3-star total ${total}, car prices ${totalPrices}, ratio ${(total / totalPrices).toFixed(3)}`,
    );
    expect(total).toBeGreaterThanOrEqual(totalPrices * 1.15);
  });

  it("a 2-star player buys about one new car per district", () => {
    const { steps } = simulate(roster, missions, progression, () => 2);
    steps.forEach((step, index) => {
      console.log(
        `${step.district}: earned ${step.earned}, bought [${step.carsBought.join(", ")}], coins ${step.coinsAfter}`,
      );
      const district = index + 1;
      expect(step.ownedAfter).toBeGreaterThanOrEqual(district);
      expect(step.ownedAfter).toBeLessThanOrEqual(district + 1);
    });
  });

  it("a 2-star player cannot afford the whole roster, a 3-star player can", () => {
    const two = simulate(roster, missions, progression, () => 2);
    expect(two.save.owned_cars.length).toBeLessThan(roster.cars.length);
    const three = simulate(roster, missions, progression, () => 3);
    expect(three.save.owned_cars).toHaveLength(roster.cars.length);
  });

  it("a 1-star player still buys the first car before the end of the game", () => {
    const { save } = simulate(roster, missions, progression, () => 1);
    expect(save.owned_cars.length).toBeGreaterThanOrEqual(2);
  });

  it("a 2-star player reaches every district's star requirement", () => {
    const { steps } = simulate(roster, missions, progression, () => 2);
    progression.districts.slice(1).forEach((district, index) => {
      expect((steps[index] as (typeof steps)[number]).starsAfter).toBeGreaterThanOrEqual(
        district.unlock_stars,
      );
    });
  });

  it("the roster price list matches what economy.md publishes", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const doc = readFileSync(
      join(import.meta.dirname, "../../../../.agents/games/city-drive/economy.md"),
      "utf8",
    );
    for (const car of roster.cars) {
      expect(doc).toContain(`\`${car.id}\``);
      expect(doc).toContain(`| ${car.price} |`);
    }
    for (const m of missions) expect(doc).toContain(`\`${m.id}\``);
  });
});
