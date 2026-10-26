import { CAMPAIGN_DAYS } from "../constants";
import { SCENE_BY_ID } from "../content";
import { DECOR } from "../rules/decor";
import { BOOKS, PASTRIES } from "../rules/items";
import type { BookId, DecorId, PastryId, StockPlan } from "../types";
import { type DayRecord, MAX_COUNTER, type StarCount } from "./profileTypes";
import { count, isRecord } from "./sanitize";

const PASTRY_IDS: readonly PastryId[] = PASTRIES.map((entry) => entry.id);
const BOOK_IDS: readonly BookId[] = BOOKS.map((entry) => entry.id);
const DECOR_IDS: readonly DecorId[] = DECOR.map((entry) => entry.id);
const MAX_PENDING = 8;

function wholeDay(key: string): number | null {
  if (!/^\d+$/.test(key)) return null;
  const day = Number(key);
  return day >= 1 && day <= CAMPAIGN_DAYS ? day : null;
}

export function readDaysDone(value: unknown): Record<number, DayRecord> | null {
  if (!isRecord(value)) return null;
  const out: Record<number, DayRecord> = {};
  for (const [key, raw] of Object.entries(value)) {
    const day = wholeDay(key);
    if (day === null || !isRecord(raw)) continue;
    const stars = count(raw.stars, 3);
    const earned = count(raw.earned, MAX_COUNTER);
    const served = count(raw.served, MAX_COUNTER);
    const delighted = count(raw.delighted, MAX_COUNTER);
    if (stars === null || stars < 1 || earned === null || served === null || delighted === null) {
      continue;
    }
    out[day] = { stars: stars as StarCount, earned, served, delighted };
  }
  return out;
}

function pickKnown<T extends string>(value: unknown, known: readonly T[], max: number): T[] | null {
  if (!Array.isArray(value)) return null;
  const out: T[] = [];
  for (const raw of value) {
    const match = known.find((id) => id === raw);
    if (match !== undefined && !out.includes(match) && out.length < max) out.push(match);
  }
  return out;
}

export function readOwned(value: unknown): DecorId[] | null {
  const picked = pickKnown(value, DECOR_IDS, DECOR_IDS.length);
  return picked === null ? null : DECOR_IDS.filter((id) => picked.includes(id));
}

export function readStock(value: unknown): StockPlan | null {
  if (!isRecord(value)) return null;
  const pastries = pickKnown(value.pastries ?? [], PASTRY_IDS, PASTRY_IDS.length);
  const books = pickKnown(value.books ?? [], BOOK_IDS, BOOK_IDS.length);
  if (pastries === null || books === null) return null;
  return { pastries, books };
}

export function readPending(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string" || !SCENE_BY_ID.has(raw) || out.includes(raw)) continue;
    if (out.length < MAX_PENDING) out.push(raw);
  }
  return out;
}

export function readDiary(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const days = new Set<number>();
  for (const raw of value) {
    if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= CAMPAIGN_DAYS) {
      days.add(raw);
    }
  }
  return [...days].sort((a, b) => a - b).slice(0, CAMPAIGN_DAYS);
}
