import type { CaseState } from "../types";

export const PROFILE_VERSION = 1 as const;
export const PROFILE_KEY = "lost-parcel-desk.profile" as const;
export const START_POSTAGE = 30 as const;
export const MAX_FREEZES = 2 as const;
export const HISTORY_LIMIT = 50 as const;
export const DAILY_RESULT_LIMIT = 60 as const;
export const FLAG_LIMIT = 64 as const;
export const FLAG_NAME_MAX = 40 as const;
export const DEFAULT_THEME = "mustard-riso" as const;

export type StampCount = 0 | 1 | 2 | 3;
export type RunKind = "campaign" | "daily";

export interface CaseRecord {
  stamps: StampCount;
  bestTimeMs: number | null;
  hintsOnBest: number;
  closedCount: number;
}

export interface SessionRecord {
  kind: RunKind;
  id: string;
  state: CaseState;
}

export interface DailyRecord {
  stamps: StampCount;
}

export interface DailyState {
  lastKey: string | null;
  streak: number;
  bestStreak: number;
  results: Record<string, DailyRecord>;
}

export interface HistoryEntry {
  kind: RunKind;
  id: string;
  stamps: StampCount;
  hints: number;
}

export interface Stats {
  accusations: number;
  wrongAccusations: number;
  hintsUsed: number;
  cluesFound: number;
  casesClosed: number;
  dailiesCleared: number;
}

export interface Profile {
  postage: number;
  cases: Record<string, CaseRecord>;
  chapterBonusClaimed: Record<string, true>;
  themeSelected: string;
  streakFreezes: number;
  ledgerSeen: Record<string, true>;
  achievements: Record<string, true>;
  session: SessionRecord | null;
  daily: DailyState;
  history: HistoryEntry[];
  flags: Record<string, true>;
  stats: Stats;
}

export function emptyStats(): Stats {
  return {
    accusations: 0,
    wrongAccusations: 0,
    hintsUsed: 0,
    cluesFound: 0,
    casesClosed: 0,
    dailiesCleared: 0,
  };
}

export function defaultProfile(): Profile {
  return {
    postage: START_POSTAGE,
    cases: {},
    chapterBonusClaimed: {},
    themeSelected: DEFAULT_THEME,
    streakFreezes: 0,
    ledgerSeen: {},
    achievements: {},
    session: null,
    daily: { lastKey: null, streak: 0, bestStreak: 0, results: {} },
    history: [],
    flags: {},
    stats: emptyStats(),
  };
}
