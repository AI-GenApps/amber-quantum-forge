import { CAMPAIGN_COMPLETE_DAY, START_COINS } from "../constants";
import type { Lean, OptionKey } from "../story/types";
import type { DecorId, StockPlan } from "../types";

export const PROFILE_VERSION = 1 as const;
export const FLAG_LIMIT = 64 as const;
export const REGULAR_COUNT = 8 as const;
export const MAX_VISITS = 999 as const;
export const MAX_COUNTER = 1_000_000_000 as const;

export type StarCount = 1 | 2 | 3;
export type TextSize = "normal" | "large";

export interface DayRecord {
  stars: StarCount;
  earned: number;
  served: number;
  delighted: number;
}

export interface RegularRecord {
  fp: number;
  visits: number;
  scenesDone: number;
  choices: Record<string, OptionKey>;
  ending: Lean | null;
}

export interface LateRecords {
  bestEarnings: number;
  bestDelightedRun: number;
}

export interface LateState {
  count: number;
  todayCount: number;
  lastKey: string | null;
  streak: number;
  bestStreak: number;
  firstOfDayClaimed: boolean;
  records: LateRecords;
}

export interface ProfileSettings {
  recipeGuide: boolean;
  relaxed: boolean;
  textSize: TextSize;
}

export interface Stats {
  served: number;
  delighted: number;
  itemsMade: number;
  mistakes: number;
  scenesRead: number;
}

export interface Profile {
  coins: number;
  day: number;
  daysDone: Record<number, DayRecord>;
  owned: DecorId[];
  stock: StockPlan;
  regulars: Record<number, RegularRecord>;
  pendingEvening: string[];
  diary: number[];
  late: LateState;
  flags: Record<string, true>;
  settings: ProfileSettings;
  stats: Stats;
}

export function defaultRegular(): RegularRecord {
  return { fp: 0, visits: 0, scenesDone: 0, choices: {}, ending: null };
}

export function defaultLate(): LateState {
  return {
    count: 0,
    todayCount: 0,
    lastKey: null,
    streak: 0,
    bestStreak: 0,
    firstOfDayClaimed: false,
    records: { bestEarnings: 0, bestDelightedRun: 0 },
  };
}

export function defaultSettings(): ProfileSettings {
  return { recipeGuide: true, relaxed: false, textSize: "normal" };
}

export function defaultStats(): Stats {
  return { served: 0, delighted: 0, itemsMade: 0, mistakes: 0, scenesRead: 0 };
}

export function defaultRegulars(): Record<number, RegularRecord> {
  const out: Record<number, RegularRecord> = {};
  for (let id = 1; id <= REGULAR_COUNT; id++) out[id] = defaultRegular();
  return out;
}

export function defaultProfile(): Profile {
  return {
    coins: START_COINS,
    day: 1,
    daysDone: {},
    owned: [],
    stock: { pastries: [], books: [] },
    regulars: defaultRegulars(),
    pendingEvening: [],
    diary: [],
    late: defaultLate(),
    flags: {},
    settings: defaultSettings(),
    stats: defaultStats(),
  };
}

export function regularOf(profile: Profile, regularId: number): RegularRecord {
  return profile.regulars[regularId] ?? defaultRegular();
}

export function campaignComplete(profile: Profile): boolean {
  return profile.day >= CAMPAIGN_COMPLETE_DAY;
}
