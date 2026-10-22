import type { Stars } from "../missions/types";

export const SAVE_SCHEMA_VERSION = 2;

export const UPGRADE_TRACKS = ["power", "grip", "brakes"] as const;
export type UpgradeTrack = (typeof UPGRADE_TRACKS)[number];
export const MAX_UPGRADE_LEVEL = 3;

/** Upgrade level (0 to 3) per track for one car. */
export type UpgradeLevels = Record<UpgradeTrack, number>;

/** The daily challenge: the last UTC date a reward was paid and the current streak in days. */
export interface DailyState {
  last_claim_date: string | null;
  streak: number;
}

export const CONTROL_LAYOUTS = ["standard", "mirrored"] as const;
export type ControlLayout = (typeof CONTROL_LAYOUTS)[number];

export const GRAPHICS_QUALITIES = ["auto", "low", "medium", "high"] as const;
export type GraphicsQuality = (typeof GRAPHICS_QUALITIES)[number];

export interface SaveSettings {
  audio: boolean;
  haptics: boolean;
  control_layout: ControlLayout;
  graphics_quality: GraphicsQuality;
}

/** Best result per mission. Missions never played have no record. */
export interface MissionRecord {
  /** Best stars ever earned, 1 to 3. A failed run never creates a record. */
  stars: Exclude<Stars, 0>;
  /** Fastest successful run in seconds, or null when it was never timed. */
  best_time_s: number | null;
}

/** Everything the game remembers about the player. Plain JSON, no class instances. */
export interface SaveData {
  schema_version: number;
  coins: number;
  owned_cars: string[];
  selected_car: string;
  missions: Record<string, MissionRecord>;
  settings: SaveSettings;
  /** Named one-time hints and tutorials the player has seen. Owned by the onboarding task. */
  onboarding: Record<string, boolean>;
  /** Upgrade levels per owned car. A car with no entry is stock. */
  upgrades: Record<string, UpgradeLevels>;
  daily: DailyState;
}

/** Why a stored save could not be used. Lists every problem found. */
export class SaveCorruptError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(
      `save is unusable (${problems.length} problem(s))\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    this.name = "SaveCorruptError";
  }
}
