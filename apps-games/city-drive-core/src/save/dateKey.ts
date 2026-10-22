const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

function utcMs(key: string): number {
  const m = DATE_KEY.exec(key);
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : Number.NaN;
}

/** True for a real calendar date written as `YYYY-MM-DD`. */
export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const ms = utcMs(value);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}

/** The UTC date of a timestamp in milliseconds. */
export function dateKeyOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`: positive when `to` is later. */
export function daysBetween(from: string, to: string): number {
  return Math.round((utcMs(to) - utcMs(from)) / DAY_MS);
}
