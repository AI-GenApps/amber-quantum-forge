import { MILESTONE_DAYS, type Weekday } from "@web-games/lantern-loops-core";
import { t } from "../strings";

export function dayName(weekday: Weekday): string {
  return t(`weekday.${weekday}`);
}

export function dayShort(weekday: Weekday): string {
  return t(`weekdayShort.${weekday}`);
}

export interface Medallion {
  days: number;
  name: string;
}

/** The highest streak medallion reached (3, 7, 14, 30, 60 or 100 days), or null below 3 days. */
export function medallionFor(streak: number): Medallion | null {
  const days = [...MILESTONE_DAYS].reverse().find((day) => streak >= day);
  if (days === undefined) return null;
  return { days, name: medallionName(days) };
}

export function medallionName(days: number): string {
  switch (days) {
    case 3:
      return t("medallion.3");
    case 7:
      return t("medallion.7");
    case 14:
      return t("medallion.14");
    case 30:
      return t("medallion.30");
    case 60:
      return t("medallion.60");
    default:
      return t("medallion.100");
  }
}

export function nextMedallionDays(streak: number): number | null {
  return MILESTONE_DAYS.find((day) => day > streak) ?? null;
}

/** Readable play time such as "1 h 05 min" or "42 min". */
export function formatPlayTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, "0")} min`;
  return `${minutes} min`;
}
