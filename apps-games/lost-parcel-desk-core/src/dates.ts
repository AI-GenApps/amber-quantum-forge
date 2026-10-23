import { hashString } from "./prng";

export const DAILY_GAME_ID = "lost-parcel-desk" as const;

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function isDateKey(key: string): boolean {
  const match = DATE_KEY.exec(key);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  return (
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day
  );
}

function utcDay(key: string): number {
  const match = DATE_KEY.exec(key);
  if (match === null) throw new RangeError(`Invalid date key: ${key}`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / MS_PER_DAY;
}

export function addDays(key: string, days: number): string {
  const moved = new Date((utcDay(key) + days) * MS_PER_DAY);
  const pad = (value: number, width: number) => String(value).padStart(width, "0");
  return `${pad(moved.getUTCFullYear(), 4)}-${pad(moved.getUTCMonth() + 1, 2)}-${pad(moved.getUTCDate(), 2)}`;
}

/** Weekday of a date key, 0 = Monday to 6 = Sunday. */
export function weekdayOf(key: string): number {
  const sunday0 = new Date(utcDay(key) * MS_PER_DAY).getUTCDay();
  return (sunday0 + 6) % 7;
}

/** Same value as the kit `dailySeed("lost-parcel-desk", dateKey)`, kept here so the core stands alone. */
export function dailySeedOf(key: string): number {
  if (!isDateKey(key)) throw new RangeError(`Invalid date key: ${key}`);
  return hashString(`${DAILY_GAME_ID}|daily|${key}`);
}
