import type { CarSpec } from "../cars/specs";
import {
  MAX_UPGRADE_LEVEL,
  type SaveData,
  UPGRADE_TRACKS,
  type UpgradeLevels,
  type UpgradeTrack,
} from "../save/types";
import { type CarEntry, type CarRoster, carSpecOf, type OVERRIDABLE_FIELDS } from "./roster";

/** Share of the car's price that levels 1, 2 and 3 of a track cost. */
export const UPGRADE_COST_FRACTIONS = [0.15, 0.25, 0.4] as const;

/** The free starter car has no price, so its upgrades are priced as if it cost this much. */
export const STARTER_UPGRADE_BASE_PRICE = 400;

/** Upgrade prices are rounded to this many coins. */
const COST_STEP = 5;

type UpgradeField = Extract<
  (typeof OVERRIDABLE_FIELDS)[number],
  "engineForce" | "topSpeedKmh" | "frictionSlip" | "sideFrictionStiffness" | "brakeForce"
>;

/** Gain per level, as a fraction of the stock value, for every field a track changes. */
export const UPGRADE_GAINS: Readonly<
  Record<UpgradeTrack, readonly { field: UpgradeField; gain: number }[]>
> = {
  power: [
    { field: "engineForce", gain: 0.06 },
    { field: "topSpeedKmh", gain: 0.03 },
  ],
  grip: [
    { field: "frictionSlip", gain: 0.06 },
    { field: "sideFrictionStiffness", gain: 0.02 },
  ],
  brakes: [{ field: "brakeForce", gain: 0.06 }],
};

/**
 * Ceilings that keep an upgraded car inside what the handling sanity suite accepts. They are the
 * largest values any stock roster car already passes with, so a track stops paying out in that
 * field once a car reaches them. A stock value above a ceiling is never lowered.
 */
export const UPGRADE_LIMITS = {
  topSpeedKmh: 119,
  engineForcePerKg: 6.2,
  brakeForcePerKg: 12.8,
  frictionSlip: 3.3,
  sideFrictionStiffness: 1.06,
} as const;

function ceilingOf(field: UpgradeField, spec: CarSpec): number {
  switch (field) {
    case "engineForce":
      return UPGRADE_LIMITS.engineForcePerKg * spec.mass;
    case "brakeForce":
      return UPGRADE_LIMITS.brakeForcePerKg * spec.mass;
    default:
      return UPGRADE_LIMITS[field];
  }
}

export const STOCK_LEVELS: Readonly<UpgradeLevels> = { power: 0, grip: 0, brakes: 0 };
export const MAX_LEVELS: Readonly<UpgradeLevels> = {
  power: MAX_UPGRADE_LEVEL,
  grip: MAX_UPGRADE_LEVEL,
  brakes: MAX_UPGRADE_LEVEL,
};

export function levelsOf(save: Pick<SaveData, "upgrades">, carId: string): UpgradeLevels {
  return save.upgrades[carId] ?? STOCK_LEVELS;
}

/** Coins for the next level of a track, or undefined when the track is already at the top. */
export function upgradeCost(entry: CarEntry, currentLevel: number): number | undefined {
  const fraction = UPGRADE_COST_FRACTIONS[currentLevel];
  if (fraction === undefined || currentLevel < 0) return undefined;
  const base = entry.price > 0 ? entry.price : STARTER_UPGRADE_BASE_PRICE;
  return Math.round((base * fraction) / COST_STEP) * COST_STEP;
}

/**
 * Whether a track changes anything for this car. A car already at the ceilings of a track (the
 * Apex Racer's power and brakes) gains nothing from it, so it is not sold.
 */
export function trackHasEffect(entry: CarEntry, track: UpgradeTrack): boolean {
  const stock = carSpecOf(entry);
  const maxed = upgradedSpec(entry, { ...STOCK_LEVELS, [track]: MAX_UPGRADE_LEVEL });
  return UPGRADE_GAINS[track].some(({ field }) => maxed[field] > stock[field]);
}

/** Everything it costs to take every useful track of one car to the top. */
export function fullUpgradeCost(entry: CarEntry): number {
  let total = 0;
  for (const track of UPGRADE_TRACKS) {
    if (!trackHasEffect(entry, track)) continue;
    for (let level = 0; level < MAX_UPGRADE_LEVEL; level++) total += upgradeCost(entry, level) ?? 0;
  }
  return total;
}

export type UpgradeFailure =
  | "unknown-car"
  | "not-owned"
  | "max-level"
  | "no-effect"
  | "not-enough-coins";

export type UpgradeResult =
  | { ok: true; save: SaveData; cost: number }
  | { ok: false; reason: UpgradeFailure; missing?: number };

/** Buy the next level of one track. The balance never goes below zero and levels stop at 3. */
export function purchaseUpgrade(
  save: SaveData,
  roster: CarRoster,
  carId: string,
  track: UpgradeTrack,
): UpgradeResult {
  const entry = roster.cars.find((c) => c.id === carId);
  if (!entry) return { ok: false, reason: "unknown-car" };
  if (!save.owned_cars.includes(carId)) return { ok: false, reason: "not-owned" };
  if (!trackHasEffect(entry, track)) return { ok: false, reason: "no-effect" };
  const levels = levelsOf(save, carId);
  const cost = upgradeCost(entry, levels[track]);
  if (cost === undefined) return { ok: false, reason: "max-level" };
  if (save.coins < cost)
    return { ok: false, reason: "not-enough-coins", missing: cost - save.coins };
  return {
    ok: true,
    cost,
    save: {
      ...save,
      coins: save.coins - cost,
      upgrades: { ...save.upgrades, [carId]: { ...levels, [track]: levels[track] + 1 } },
    },
  };
}

/** The car's physics spec with its upgrade levels applied as bounded multipliers. */
export function upgradedSpec(entry: CarEntry, levels: UpgradeLevels): CarSpec {
  const stock = carSpecOf(entry);
  const out: CarSpec = { ...stock };
  for (const track of UPGRADE_TRACKS) {
    for (const { field, gain } of UPGRADE_GAINS[track]) {
      const level = levels[track];
      if (level <= 0) continue;
      const boosted = stock[field] * (1 + gain * level);
      out[field] = Math.max(stock[field], Math.min(boosted, ceilingOf(field, stock)));
    }
  }
  return out;
}
