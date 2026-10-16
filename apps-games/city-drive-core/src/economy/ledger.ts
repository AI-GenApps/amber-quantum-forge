import type { MissionResult, Stars, Tiers } from "../missions/types";
import type { SaveData } from "../save/types";
import { missionPayout, type Payout } from "./payout";
import type { CarRoster } from "./roster";

export function totalStars(save: SaveData): number {
  return Object.values(save.missions).reduce((sum, m) => sum + m.stars, 0);
}

export function bestStars(save: SaveData, missionId: string): Stars {
  return save.missions[missionId]?.stars ?? 0;
}

export interface MissionPayoutInfo extends Payout {
  missionId: string;
}

export interface RecordedMission {
  save: SaveData;
  payout: MissionPayoutInfo;
}

/** Add a finished mission to the save: pay coins and keep the best stars and fastest time. */
export function recordMission(
  save: SaveData,
  mission: { id: string; reward_coins: Tiers<number> },
  result: Pick<MissionResult, "success" | "stars" | "time">,
): RecordedMission {
  const stars: Stars = result.success ? result.stars : 0;
  const payout = missionPayout(mission.reward_coins, bestStars(save, mission.id), stars);
  const info = { ...payout, missionId: mission.id };
  if (stars === 0) return { save, payout: info };
  const old = save.missions[mission.id];
  const time = result.time > 0 ? result.time : null;
  const best = old?.best_time_s ?? null;
  const fastest = time !== null && (best === null || time < best) ? time : best;
  const record = { stars: Math.max(stars, old?.stars ?? 0) as 1 | 2 | 3, best_time_s: fastest };
  return {
    save: {
      ...save,
      coins: save.coins + payout.coins,
      missions: { ...save.missions, [mission.id]: record },
    },
    payout: info,
  };
}

export type PurchaseFailure = "unknown-car" | "already-owned" | "not-enough-coins";

export type PurchaseResult =
  | { ok: true; save: SaveData }
  | { ok: false; reason: PurchaseFailure; missing?: number };

/** Unlock a car. The balance never goes below zero and a car is never bought twice. */
export function purchaseCar(save: SaveData, roster: CarRoster, carId: string): PurchaseResult {
  const car = roster.cars.find((c) => c.id === carId);
  if (!car) return { ok: false, reason: "unknown-car" };
  if (save.owned_cars.includes(carId)) return { ok: false, reason: "already-owned" };
  if (save.coins < car.price) {
    return { ok: false, reason: "not-enough-coins", missing: car.price - save.coins };
  }
  return {
    ok: true,
    save: { ...save, coins: save.coins - car.price, owned_cars: [...save.owned_cars, carId] },
  };
}

export type SelectResult = { ok: true; save: SaveData } | { ok: false; reason: "not-owned" };

export function selectCar(save: SaveData, carId: string): SelectResult {
  if (!save.owned_cars.includes(carId)) return { ok: false, reason: "not-owned" };
  return { ok: true, save: { ...save, selected_car: carId } };
}

/** Drop cars the roster no longer knows and fall back to the starter. Run once after loading. */
export function reconcileWithRoster(save: SaveData, roster: CarRoster): SaveData {
  const known = new Set(roster.cars.map((c) => c.id));
  const owned = save.owned_cars.filter((id) => known.has(id));
  if (!owned.includes(roster.starter)) owned.unshift(roster.starter);
  const selected = owned.includes(save.selected_car) ? save.selected_car : roster.starter;
  if (owned.length === save.owned_cars.length && selected === save.selected_car) return save;
  return { ...save, owned_cars: owned, selected_car: selected };
}
