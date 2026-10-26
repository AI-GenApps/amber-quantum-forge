import type { SlotSetId } from "../types";

export type DailyNeed = "era-or-formality" | "budget";

export interface DailyTier {
  readonly weekday: number;
  readonly name: string;
  readonly slotSets: readonly SlotSetId[];
  readonly slotCount: number;
  readonly ruleCount: number;
  readonly need: DailyNeed | null;
}

export const DAILY_TIERS: readonly DailyTier[] = [
  { weekday: 0, name: "Monday", slotSets: ["A", "B", "C"], slotCount: 6, ruleCount: 2, need: null },
  {
    weekday: 1,
    name: "Tuesday",
    slotSets: ["A", "B", "C"],
    slotCount: 6,
    ruleCount: 3,
    need: null,
  },
  {
    weekday: 2,
    name: "Wednesday",
    slotSets: ["D", "E", "F"],
    slotCount: 7,
    ruleCount: 3,
    need: null,
  },
  {
    weekday: 3,
    name: "Thursday",
    slotSets: ["D", "E", "F"],
    slotCount: 7,
    ruleCount: 3,
    need: "era-or-formality",
  },
  { weekday: 4, name: "Friday", slotSets: ["G"], slotCount: 8, ruleCount: 3, need: null },
  { weekday: 5, name: "Saturday", slotSets: ["G"], slotCount: 8, ruleCount: 4, need: null },
  { weekday: 6, name: "Sunday", slotSets: ["G"], slotCount: 8, ruleCount: 4, need: "budget" },
];

export const GENERATION_ATTEMPTS = 12;
export const SEED_DRAWS = 200;
export const SAMPLE_SIZE = 300;
export const MIN_FAIL_SHARE = 0.2;
export const MAX_THREE_STAR_SHARE = 0.1;
export const DAILY_BRIEF_MAX = 120;
export const DAILY_CHAPTER_INDEX = -1;
export const DAILY_NAME = "Daily Fitting";

export function tierFor(weekday: number): DailyTier {
  const tier = DAILY_TIERS[weekday];
  if (!Number.isInteger(weekday) || tier === undefined) {
    throw new RangeError(
      `weekday must be an integer from 0 (Monday) to 6 (Sunday), got ${weekday}`,
    );
  }
  return tier;
}
