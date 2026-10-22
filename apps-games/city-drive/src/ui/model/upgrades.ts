import {
  type CarEntry,
  levelsOf,
  MAX_UPGRADE_LEVEL,
  type SaveData,
  trackHasEffect,
  UPGRADE_TRACKS,
  type UpgradeTrack,
  upgradeCost,
} from "@city-drive/core";

export const TRACK_LABELS: Readonly<Record<UpgradeTrack, string>> = {
  power: "Power",
  grip: "Grip",
  brakes: "Brakes",
};

export interface UpgradeRow {
  track: UpgradeTrack;
  label: string;
  level: number;
  maxLevel: number;
  /** False when the car is already at this track's ceilings, so nothing is sold. */
  useful: boolean;
  /** Coins for the next level, or undefined at the top. */
  cost: number | undefined;
  canBuy: boolean;
  /** Coins still missing for the next level, otherwise 0. */
  missing: number;
}

/** The three tracks of an owned car. A car the player does not own has no panel. */
export function upgradeRows(entry: CarEntry, save: SaveData): UpgradeRow[] {
  if (!save.owned_cars.includes(entry.id)) return [];
  const levels = levelsOf(save, entry.id);
  return UPGRADE_TRACKS.map((track) => {
    const level = levels[track];
    const useful = trackHasEffect(entry, track);
    const cost = useful ? upgradeCost(entry, level) : undefined;
    const missing = cost === undefined ? 0 : Math.max(0, cost - save.coins);
    return {
      track,
      label: TRACK_LABELS[track],
      level,
      maxLevel: MAX_UPGRADE_LEVEL,
      useful,
      cost,
      canBuy: cost !== undefined && missing === 0,
      missing,
    };
  });
}
