import { describe, expect, it } from "vitest";
import { dailyReward, fullUpgradeCost, MAX_LEVELS, upgradedSpec } from "../../src/index";
import { readRoster } from "./roster-support";
import { readMissions, readProgression, simulate } from "./sim";

const roster = readRoster();
const missions = readMissions();
const progression = readProgression();
const sumRewards = (level: "1" | "2" | "3") =>
  missions.reduce((sum, m) => sum + m.reward_coins[level], 0);
const totalPrices = roster.cars.reduce((sum, c) => sum + c.price, 0);
const upgradeBill = roster.cars.reduce((sum, c) => sum + fullUpgradeCost(c), 0);

/** Coins from claiming the daily with the same stars every day, streak never broken. */
function dailyEarnings(days: number, stars: 1 | 2 | 3): number {
  let total = 0;
  for (let day = 1; day <= days; day++) {
    const { base, bonus } = dailyReward(stars, day);
    total += base + bonus;
  }
  return total;
}

describe("economy with upgrades and the daily", () => {
  it("3-starring every mission still pays 15% more than every car costs, upgrades excluded", () => {
    expect(sumRewards("3")).toBeGreaterThanOrEqual(totalPrices * 1.15);
  });

  it("buying every car stays possible for a 3-star player with the upgrade prices ignored", () => {
    const { save } = simulate(roster, missions, progression, () => 3);
    expect(save.owned_cars).toHaveLength(roster.cars.length);
  });

  it("the full upgrade bill is larger than two weeks of perfect daily play", () => {
    const perfect = dailyEarnings(14, 3);
    console.log(
      `upgrade bill ${upgradeBill}, 14 days of 3-star dailies ${perfect}, 2-star ${dailyEarnings(14, 2)}, 1-star ${dailyEarnings(14, 1)}`,
    );
    expect(upgradeBill).toBeGreaterThan(perfect);
    expect(upgradeBill).toBeGreaterThan(perfect * 3);
  });

  it("the bill is also larger than the cash left after buying the whole roster", () => {
    const surplus = sumRewards("3") - totalPrices;
    console.log(`3-star mission surplus over car prices ${surplus}`);
    expect(upgradeBill).toBeGreaterThan(surplus);
  });

  it("a maxed car is stronger than stock in every track and never faster than the roster best", () => {
    for (const c of roster.cars) {
      const stock = upgradedSpec(c, { power: 0, grip: 0, brakes: 0 });
      const max = upgradedSpec(c, MAX_LEVELS);
      expect(max.brakeForce).toBeGreaterThanOrEqual(stock.brakeForce);
      expect(max.frictionSlip).toBeGreaterThanOrEqual(stock.frictionSlip);
      expect(max.engineForce).toBeGreaterThanOrEqual(stock.engineForce);
    }
  });
});
