import { ACHIEVEMENTS, CASES, CHAPTERS } from "../content";
import { isDateKey } from "../dates";
import {
  type CaseRecord,
  DAILY_RESULT_LIMIT,
  type DailyState,
  DEFAULT_THEME,
  defaultProfile,
  emptyStats,
  FLAG_LIMIT,
  FLAG_NAME_MAX,
  HISTORY_LIMIT,
  type HistoryEntry,
  MAX_FREEZES,
  type Profile,
  type StampCount,
  type Stats,
} from "./profile";
import { readSession } from "./session";
import { themesUnlocked } from "./unlocks";

const MAX_COUNTER = 1_000_000_000;
const MAX_STREAK = 100_000;
const MAX_HINTS_RECORDED = 2;
const CASE_IDS: ReadonlySet<string> = new Set(CASES.map((item) => item.id));
const CHAPTER_IDS: ReadonlySet<string> = new Set(CHAPTERS.map((item) => String(item.id)));
const ACHIEVEMENT_IDS: ReadonlySet<string> = new Set(ACHIEVEMENTS.map((item) => item.id));

type Source = Record<string, unknown>;

function isRecord(value: unknown): value is Source {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function count(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

function stamps(value: unknown): StampCount | null {
  const n = count(value, 3);
  return n === null ? null : (n as StampCount);
}

function has(source: Source, key: string): boolean {
  return key in source && source[key] !== undefined;
}

function flagMap(value: unknown, allowed: ReadonlySet<string> | null): Record<string, true> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, true> = {};
  for (const [name, raw] of Object.entries(value)) {
    if (raw !== true || name.length === 0 || name.length > FLAG_NAME_MAX) continue;
    if (allowed !== null && !allowed.has(name)) continue;
    if (Object.keys(out).length < FLAG_LIMIT) out[name] = true;
  }
  return out;
}

function readCases(value: unknown): Record<string, CaseRecord> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, CaseRecord> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!CASE_IDS.has(id) || !isRecord(raw)) continue;
    const best = stamps(raw.stamps);
    if (best === null || best < 1) continue;
    const time = raw.bestTimeMs == null ? null : count(raw.bestTimeMs, MAX_COUNTER);
    const hints = count(raw.hintsOnBest ?? 0, MAX_HINTS_RECORDED);
    const closed = count(raw.closedCount ?? 1, MAX_COUNTER);
    if (hints === null || closed === null) continue;
    out[id] = {
      stamps: best,
      bestTimeMs: time,
      hintsOnBest: hints,
      closedCount: Math.max(1, closed),
    };
  }
  return out;
}

function readDaily(value: unknown): DailyState | null {
  if (!isRecord(value)) return null;
  const last = value.lastKey ?? null;
  if (last !== null && (typeof last !== "string" || !isDateKey(last))) return null;
  const streak = count(value.streak ?? 0, MAX_STREAK);
  const best = count(value.bestStreak ?? 0, MAX_STREAK);
  const source = value.results ?? {};
  if (streak === null || best === null || !isRecord(source)) return null;
  const results: DailyState["results"] = {};
  const keys = Object.keys(source).filter(isDateKey).sort().reverse().slice(0, DAILY_RESULT_LIMIT);
  for (const key of keys) {
    const raw = source[key];
    const earned = isRecord(raw) ? stamps(raw.stamps) : null;
    if (earned !== null && earned >= 1) results[key] = { stamps: earned };
  }
  return { lastKey: last, streak, bestStreak: Math.max(best, streak), results };
}

function readHistory(value: unknown): HistoryEntry[] | null {
  if (!Array.isArray(value)) return null;
  const out: HistoryEntry[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const { kind, id } = raw;
    const earned = stamps(raw.stamps);
    const hints = count(raw.hints ?? 0, MAX_HINTS_RECORDED);
    const known = kind === "campaign" ? typeof id === "string" && CASE_IDS.has(id) : false;
    const dated = kind === "daily" ? typeof id === "string" && isDateKey(id) : false;
    if (!(known || dated) || earned === null || hints === null) continue;
    out.push({ kind: kind as HistoryEntry["kind"], id: id as string, stamps: earned, hints });
  }
  return out.slice(-HISTORY_LIMIT);
}

function readStats(value: unknown): Stats | null {
  if (!isRecord(value)) return null;
  const out = emptyStats();
  for (const key of Object.keys(out) as Array<keyof Stats>) {
    if (!has(value, key)) continue;
    const n = count(value[key], MAX_COUNTER);
    if (n === null) return null;
    out[key] = n;
  }
  return out;
}

/** Repairs a stored profile in place of trusting it: unknown keys vanish, numbers are clamped. */
export function sanitizeProfile(data: unknown): Profile | null {
  if (!isRecord(data)) return null;
  const base = defaultProfile();
  const postage = has(data, "postage") ? count(data.postage, MAX_COUNTER) : base.postage;
  const freezes = has(data, "streakFreezes") ? count(data.streakFreezes, MAX_FREEZES) : 0;
  const cases = has(data, "cases") ? readCases(data.cases) : {};
  const bonus = has(data, "chapterBonusClaimed")
    ? flagMap(data.chapterBonusClaimed, CHAPTER_IDS)
    : {};
  const ledger = has(data, "ledgerSeen") ? flagMap(data.ledgerSeen, CASE_IDS) : {};
  const achievements = has(data, "achievements") ? flagMap(data.achievements, ACHIEVEMENT_IDS) : {};
  const flags = has(data, "flags") ? flagMap(data.flags, null) : {};
  const daily = has(data, "daily") ? readDaily(data.daily) : base.daily;
  const history = has(data, "history") ? readHistory(data.history) : [];
  const stats = has(data, "stats") ? readStats(data.stats) : base.stats;
  const theme = has(data, "themeSelected") ? data.themeSelected : DEFAULT_THEME;
  if (postage === null || freezes === null || cases === null || bonus === null) return null;
  if (ledger === null || achievements === null || flags === null || daily === null) return null;
  if (history === null || stats === null || typeof theme !== "string") return null;
  if (has(data, "session") && data.session !== null && !isRecord(data.session)) return null;

  const profile: Profile = {
    postage,
    cases,
    chapterBonusClaimed: bonus,
    themeSelected: DEFAULT_THEME,
    streakFreezes: freezes,
    ledgerSeen: Object.fromEntries(Object.entries(ledger).filter(([id]) => id in cases)) as Record<
      string,
      true
    >,
    achievements,
    session: null,
    daily,
    history,
    flags,
    stats,
  };
  const allowed = themesUnlocked(profile).some((item) => item.id === theme);
  return {
    ...profile,
    themeSelected: allowed ? theme : DEFAULT_THEME,
    session: readSession(data.session ?? null, profile),
  };
}
