import { hashString } from "../rng";

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** Default epoch for `dayNumber`: day 0 is 2026-01-01. */
export const DAILY_EPOCH = "2026-01-01";

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

/** Calendar date of `date` in the device time zone as `YYYY-MM-DD`. */
export function localDateKey(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

/** Splits a date key into numbers, or returns null when it is not a real calendar date. */
export function parseDateKey(key: string): { year: number; month: number; day: number } | null {
  const match = DATE_KEY.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function isDateKey(key: string): boolean {
  return parseDateKey(key) !== null;
}

function utcDay(key: string): number {
  const parts = parseDateKey(key);
  if (!parts) throw new RangeError(`Invalid date key: ${key}`);
  return Date.UTC(parts.year, parts.month - 1, parts.day) / MS_PER_DAY;
}

/** Whole days from `epoch` to `dateKey`; negative before the epoch. Time zone and DST never matter. */
export function dayNumber(dateKey: string, epoch: string = DAILY_EPOCH): number {
  return utcDay(dateKey) - utcDay(epoch);
}

/** Date key `days` after (or before, when negative) `dateKey`. */
export function addDays(dateKey: string, days: number): string {
  const d = new Date((utcDay(dateKey) + days) * MS_PER_DAY);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1, 2)}-${pad(d.getUTCDate(), 2)}`;
}

/** Signed whole days from `from` to `to`. */
export function daysBetween(from: string, to: string): number {
  return utcDay(to) - utcDay(from);
}

/** Seed for a game's daily puzzle: identical for every player on the same local date. */
export function dailySeed(gameId: string, dateKey: string): number {
  if (!isDateKey(dateKey)) throw new RangeError(`Invalid date key: ${dateKey}`);
  return hashString(`${gameId}|daily|${dateKey}`);
}

export type StreakStep = "same-day" | "next-day" | "gap" | "clock-went-back";

/** How `today` relates to the last day a player completed the daily; drives streak logic. */
export function streakStep(lastKey: string, today: string): StreakStep {
  const delta = daysBetween(lastKey, today);
  if (delta === 0) return "same-day";
  if (delta === 1) return "next-day";
  return delta < 0 ? "clock-went-back" : "gap";
}
