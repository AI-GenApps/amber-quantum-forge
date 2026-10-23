import { hashString } from "../prng";

export const DAILY_GAME_ID = "floodplain-dispatch" as const;

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEKDAY_OFFSETS = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4] as const;

export function dailySeedOf(dateKey: string): number {
  return hashString(`${DAILY_GAME_ID}|daily|${dateKey}`);
}

export function weekdayOfDateKey(dateKey: string): number | null {
  const match = DATE_KEY.exec(dateKey);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const y = month < 3 ? year - 1 : year;
  const sundayFirst =
    (y +
      Math.floor(y / 4) -
      Math.floor(y / 100) +
      Math.floor(y / 400) +
      (WEEKDAY_OFFSETS[month - 1] ?? 0) +
      day) %
    7;
  return (sundayFirst + 6) % 7;
}
