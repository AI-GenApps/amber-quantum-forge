import { FP_CAP, SCENES_PER_REGULAR } from "../constants";
import { SCENES } from "../content";
import type { Lean, OptionKey } from "../story/types";
import {
  defaultRegular,
  FLAG_LIMIT,
  type LateRecords,
  type LateState,
  MAX_COUNTER,
  MAX_VISITS,
  type ProfileSettings,
  REGULAR_COUNT,
  type RegularRecord,
  type Stats,
  type TextSize,
} from "./profileTypes";
import { isRecord, read, readCount, readFlag } from "./sanitize";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_STREAK = 100_000;

const CHOICE_IDS: ReadonlyMap<number, ReadonlySet<string>> = (() => {
  const out = new Map<number, Set<string>>();
  for (const scene of SCENES) {
    if (scene.choice === undefined) continue;
    const ids = out.get(scene.regular) ?? new Set<string>();
    ids.add(scene.choice.id);
    out.set(scene.regular, ids);
  }
  return out;
})();

export function readFlags(value: unknown): Record<string, true> | null {
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

function readChoices(value: unknown, regularId: number): Record<string, OptionKey> | null {
  if (!isRecord(value)) return null;
  const known = CHOICE_IDS.get(regularId);
  const out: Record<string, OptionKey> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (known?.has(id) === true && (raw === "a" || raw === "b")) out[id] = raw;
  }
  return out;
}

function readLean(value: unknown): Lean | null {
  return value === "a" || value === "b" ? value : null;
}

function readRegular(value: unknown, regularId: number): RegularRecord | null {
  if (!isRecord(value)) return null;
  const base = defaultRegular();
  const fp = readCount(value, "fp", base.fp, FP_CAP);
  const visits = readCount(value, "visits", base.visits, MAX_VISITS);
  const scenesDone = readCount(value, "scenesDone", base.scenesDone, SCENES_PER_REGULAR);
  const choices = read(value, "choices", base.choices, (raw) => readChoices(raw, regularId));
  if (fp === null || visits === null || scenesDone === null || choices === null) return null;
  const ending = scenesDone === SCENES_PER_REGULAR ? readLean(value.ending) : null;
  return { fp, visits, scenesDone, choices, ending };
}

export function readRegulars(value: unknown): Record<number, RegularRecord> | null {
  if (!isRecord(value)) return null;
  const out: Record<number, RegularRecord> = {};
  for (let id = 1; id <= REGULAR_COUNT; id++) {
    const raw = value[String(id)];
    if (raw === undefined) {
      out[id] = defaultRegular();
      continue;
    }
    const row = readRegular(raw, id);
    if (row === null) return null;
    out[id] = row;
  }
  return out;
}

function readTextSize(value: unknown): TextSize | null {
  return value === "normal" || value === "large" ? value : null;
}

export function readSettings(value: unknown, fallback: ProfileSettings): ProfileSettings | null {
  if (!isRecord(value)) return null;
  const recipeGuide = readFlag(value, "recipeGuide", fallback.recipeGuide);
  const relaxed = readFlag(value, "relaxed", fallback.relaxed);
  const textSize = read(value, "textSize", fallback.textSize, readTextSize);
  if (recipeGuide === null || relaxed === null || textSize === null) return null;
  return { recipeGuide, relaxed, textSize };
}

export function readStats(value: unknown, fallback: Stats): Stats | null {
  if (!isRecord(value)) return null;
  const out: Stats = { ...fallback };
  for (const key of Object.keys(fallback) as (keyof Stats)[]) {
    const field = readCount(value, key, fallback[key], MAX_COUNTER);
    if (field === null) return null;
    out[key] = field;
  }
  return out;
}

function readRecords(value: unknown, fallback: LateRecords): LateRecords | null {
  if (!isRecord(value)) return null;
  const bestEarnings = readCount(value, "bestEarnings", fallback.bestEarnings, MAX_COUNTER);
  const bestDelightedRun = readCount(value, "bestDelightedRun", fallback.bestDelightedRun, 99);
  if (bestEarnings === null || bestDelightedRun === null) return null;
  return { bestEarnings, bestDelightedRun };
}

export function readLate(value: unknown, fallback: LateState): LateState | null {
  if (!isRecord(value)) return null;
  const lateCount = readCount(value, "count", fallback.count, MAX_COUNTER);
  const todayCount = readCount(value, "todayCount", fallback.todayCount, 9999);
  const streak = readCount(value, "streak", fallback.streak, MAX_STREAK);
  const bestStreak = readCount(value, "bestStreak", fallback.bestStreak, MAX_STREAK);
  const claimed = readFlag(value, "firstOfDayClaimed", fallback.firstOfDayClaimed);
  const records = read(value, "records", fallback.records, readRecords);
  if (
    lateCount === null ||
    todayCount === null ||
    streak === null ||
    bestStreak === null ||
    claimed === null ||
    records === null
  ) {
    return null;
  }
  const lastKey =
    typeof value.lastKey === "string" && DATE_KEY.test(value.lastKey) ? value.lastKey : null;
  return {
    count: lateCount,
    todayCount: lastKey === null ? 0 : todayCount,
    lastKey,
    streak,
    bestStreak: Math.max(bestStreak, streak),
    firstOfDayClaimed: lastKey === null ? false : claimed,
    records,
  };
}
