export interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

/** Days since 1970-01-01 for a proleptic Gregorian date (integer arithmetic only). */
export function daysFromCivil(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = (month + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function civilFromDays(days: number): CivilDate {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  const year = yoe + era * 400 + (month <= 2 ? 1 : 0);
  return { year, month, day };
}

/** Splits `YYYY-MM-DD` into numbers, or null when it is not a real calendar date. */
export function parseDateKey(key: string): CivilDate | null {
  const match = DATE_KEY.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  const back = civilFromDays(daysFromCivil(year, month, day));
  if (back.year !== year || back.month !== month || back.day !== day) return null;
  return { year, month, day };
}

export function isDateKey(key: unknown): key is string {
  return typeof key === "string" && parseDateKey(key) !== null;
}

export function toDateKey(date: CivilDate): string {
  return `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`;
}

function dayCount(dateKey: string): number {
  const parts = parseDateKey(dateKey);
  if (!parts) throw new RangeError(`Invalid date key: ${dateKey}`);
  return daysFromCivil(parts.year, parts.month, parts.day);
}

export function shiftDate(dateKey: string, days: number): string {
  return toDateKey(civilFromDays(dayCount(dateKey) + days));
}

/** ISO weekday of a date key, Monday = 1 and Sunday = 7. */
export function weekdayOf(dateKey: string): Weekday {
  const days = dayCount(dateKey);
  return (((((days + 3) % 7) + 7) % 7) + 1) as Weekday;
}

/** ISO 8601 week key `YYYY-Www` (weeks start on Monday, week 1 holds the first Thursday). */
export function isoWeekKey(dateKey: string): string {
  const days = dayCount(dateKey);
  const weekday = weekdayOf(dateKey);
  const thursday = days - weekday + 4;
  const year = civilFromDays(thursday).year;
  const week = Math.floor((thursday - daysFromCivil(year, 1, 1)) / 7) + 1;
  return `${pad(year, 4)}-W${pad(week, 2)}`;
}

export const ARCHIVE_DAYS = 30;

/** The `count` dates before `today`, yesterday first and the oldest last. Never includes today. */
export function archiveKeys(today: string, count: number = ARCHIVE_DAYS): string[] {
  return Array.from({ length: count }, (_, k) => shiftDate(today, -(k + 1)));
}
