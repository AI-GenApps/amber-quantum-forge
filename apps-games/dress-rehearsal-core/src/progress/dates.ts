const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_KEY.exec(value);
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

function toDate(key: string): Date {
  if (!isDateKey(key)) throw new RangeError(`Invalid date key: ${key}`);
  const [year, month, day] = key.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDaysToKey(key: string, days: number): string {
  const moved = new Date(toDate(key).getTime() + days * MS_PER_DAY);
  return `${pad(moved.getUTCFullYear(), 4)}-${pad(moved.getUTCMonth() + 1, 2)}-${pad(moved.getUTCDate(), 2)}`;
}

/** Weekday of a date key with Monday as 0 and Sunday as 6. */
export function weekdayOfKey(key: string): number {
  return (toDate(key).getUTCDay() + 6) % 7;
}
