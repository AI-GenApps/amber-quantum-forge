import { MAPS, REGIONS, THEMES, TOTAL_STARS } from "../content";

export const PROFILE_VERSION = 1 as const;
export const PROFILE_KEY = "floodplain-dispatch.profile" as const;
export const START_COINS = 50 as const;
export const MAX_FREEZES = 2 as const;
export const HISTORY_LIMIT = 50 as const;
export const DAILY_RESULT_LIMIT = 60 as const;
export const DEFAULT_THEME = "gouache-meadow" as const;
export const FLAG_LIMIT = 64 as const;

export type StarCount = 0 | 1 | 2 | 3;
export type HistoryKind = "campaign" | "daily";

export interface BestRecord {
  score: number;
  stars: StarCount;
  spend: number;
}

export interface DailyRecord {
  stars: StarCount;
  score: number;
}

export interface DailyState {
  lastKey: string | null;
  streak: number;
  bestStreak: number;
  results: Record<string, DailyRecord>;
}

export interface HistoryEntry {
  kind: HistoryKind;
  id: string;
  stars: StarCount;
  score: number;
  spend: number;
}

export interface Stats {
  seasons: number;
  housesSupplied: number;
  fieldsIrrigated: number;
  housesFlooded: number;
  hintsUsed: number;
}

export interface Profile {
  coins: number;
  stars: Record<string, StarCount>;
  best: Record<string, BestRecord>;
  regionBonusClaimed: Record<string, true>;
  themeSelected: string;
  streakFreezes: number;
  daily: DailyState;
  history: HistoryEntry[];
  flags: Record<string, true>;
  stats: Stats;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAP_IDS: ReadonlySet<string> = new Set(MAPS.map((map) => map.id));
const REGION_IDS: ReadonlySet<string> = new Set(REGIONS.map((region) => region.id));
const THEME_IDS: ReadonlySet<string> = new Set(THEMES.map((theme) => theme.id));
const MAX_COUNTER = 1_000_000_000;

export function defaultProfile(): Profile {
  return {
    coins: START_COINS,
    stars: {},
    best: {},
    regionBonusClaimed: {},
    themeSelected: DEFAULT_THEME,
    streakFreezes: 0,
    daily: { lastKey: null, streak: 0, bestStreak: 0, results: {} },
    history: [],
    flags: {},
    stats: { seasons: 0, housesSupplied: 0, fieldsIrrigated: 0, housesFlooded: 0, hintsUsed: 0 },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function count(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

function starCount(value: unknown): StarCount | null {
  const n = count(value, 3);
  return n === null ? null : (n as StarCount);
}

type Reader<T> = (value: unknown, fallback: T) => T | null;

function read<T>(
  source: Record<string, unknown>,
  key: string,
  fallback: T,
  reader: Reader<T>,
): T | null {
  if (!(key in source) || source[key] === undefined) return fallback;
  return reader(source[key], fallback);
}

function readStars(value: unknown): Record<string, StarCount> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, StarCount> = {};
  for (const [id, raw] of Object.entries(value)) {
    const stars = starCount(raw);
    if (MAP_IDS.has(id) && stars !== null && stars > 0) out[id] = stars;
  }
  return out;
}

function readBest(value: unknown): Record<string, BestRecord> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, BestRecord> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!MAP_IDS.has(id) || !isRecord(raw)) continue;
    const score = count(raw.score, MAX_COUNTER);
    const stars = starCount(raw.stars);
    const spend = count(raw.spend, MAX_COUNTER);
    if (score !== null && stars !== null && spend !== null) out[id] = { score, stars, spend };
  }
  return out;
}

function readBonus(value: unknown): Record<string, true> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, true> = {};
  for (const [id, raw] of Object.entries(value))
    if (REGION_IDS.has(id) && raw === true) out[id] = true;
  return out;
}

function readFlags(value: unknown): Record<string, true> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, true> = {};
  for (const [name, raw] of Object.entries(value)) {
    if (
      raw === true &&
      name.length > 0 &&
      name.length <= 40 &&
      Object.keys(out).length < FLAG_LIMIT
    ) {
      out[name] = true;
    }
  }
  return out;
}

function readHistory(value: unknown): HistoryEntry[] | null {
  if (!Array.isArray(value)) return null;
  const out: HistoryEntry[] = [];
  for (const raw of value) {
    if (!isRecord(raw) || (raw.kind !== "campaign" && raw.kind !== "daily")) continue;
    if (typeof raw.id !== "string" || raw.id.length === 0 || raw.id.length > 24) continue;
    const stars = starCount(raw.stars);
    const score = count(raw.score, MAX_COUNTER);
    const spend = count(raw.spend, MAX_COUNTER);
    if (stars !== null && score !== null && spend !== null) {
      out.push({ kind: raw.kind, id: raw.id, stars, score, spend });
    }
  }
  return out.slice(-HISTORY_LIMIT);
}

function readResults(value: unknown): Record<string, DailyRecord> | null {
  if (!isRecord(value)) return null;
  const kept: [string, DailyRecord][] = [];
  for (const [key, raw] of Object.entries(value)) {
    if (!DATE_KEY.test(key) || !isRecord(raw)) continue;
    const stars = starCount(raw.stars);
    const score = count(raw.score, MAX_COUNTER);
    if (stars !== null && score !== null) kept.push([key, { stars, score }]);
  }
  kept.sort((a, b) => (a[0] < b[0] ? 1 : -1));
  return Object.fromEntries(kept.slice(0, DAILY_RESULT_LIMIT));
}

function readDaily(value: unknown, fallback: DailyState): DailyState | null {
  if (!isRecord(value)) return null;
  const lastKey =
    typeof value.lastKey === "string" && DATE_KEY.test(value.lastKey) ? value.lastKey : null;
  const streak = read(value, "streak", fallback.streak, (v) => count(v, 100000));
  const bestStreak = read(value, "bestStreak", fallback.bestStreak, (v) => count(v, 100000));
  const results = read(value, "results", fallback.results, readResults);
  if (streak === null || bestStreak === null || results === null) return null;
  return { lastKey, streak, bestStreak: Math.max(bestStreak, streak), results };
}

function readStats(value: unknown, fallback: Stats): Stats | null {
  if (!isRecord(value)) return null;
  const out: Stats = { ...fallback };
  for (const key of Object.keys(fallback) as (keyof Stats)[]) {
    const field = read(value, key, fallback[key], (v) => count(v, MAX_COUNTER));
    if (field === null) return null;
    out[key] = field;
  }
  return out;
}

export function sumStars(stars: Readonly<Record<string, StarCount>>): number {
  let total = 0;
  for (const map of MAPS) total += stars[map.id] ?? 0;
  return Math.min(total, TOTAL_STARS);
}

function themeAllowed(id: string, stars: Record<string, StarCount>): boolean {
  const theme = THEMES.find((entry) => entry.id === id);
  return theme !== undefined && theme.starsNeeded <= sumStars(stars);
}

export function sanitizeProfile(data: unknown): Profile | null {
  if (!isRecord(data)) return null;
  const base = defaultProfile();
  const coins = read(data, "coins", base.coins, (v) => count(v, MAX_COUNTER));
  const stars = read(data, "stars", base.stars, readStars);
  const best = read(data, "best", base.best, readBest);
  const bonus = read(data, "regionBonusClaimed", base.regionBonusClaimed, readBonus);
  const freezes = read(data, "streakFreezes", base.streakFreezes, (v) => count(v, MAX_FREEZES));
  const daily = read(data, "daily", base.daily, readDaily);
  const history = read(data, "history", base.history, readHistory);
  const flags = read(data, "flags", base.flags, readFlags);
  const stats = read(data, "stats", base.stats, readStats);
  const theme = read(data, "themeSelected", base.themeSelected, (v) =>
    typeof v === "string" ? v : null,
  );
  if (coins === null || stars === null || best === null || bonus === null || freezes === null)
    return null;
  if (daily === null || history === null || flags === null || stats === null || theme === null)
    return null;
  return {
    coins,
    stars,
    best,
    regionBonusClaimed: bonus,
    themeSelected: THEME_IDS.has(theme) && themeAllowed(theme, stars) ? theme : DEFAULT_THEME,
    streakFreezes: freezes,
    daily,
    history,
    flags,
    stats,
  };
}
