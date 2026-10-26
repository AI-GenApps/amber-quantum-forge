import { dailySeed, dayNumber } from "@web-games/kit";
import { type DailyCase, generateDaily } from "@web-games/lost-parcel-desk-core";
import { GAME_ID } from "./ids";

const THURSDAY = 3;

/** Weekday of a date key, 0 = Monday to 6 = Sunday, from the kit epoch (2026-01-01, a Thursday). */
export function weekdayOfKey(dateKey: string): number {
  return (((dayNumber(dateKey) + THURSDAY) % 7) + 7) % 7;
}

export function dailyCaseFor(dateKey: string): DailyCase {
  return generateDaily(dailySeed(GAME_ID, dateKey), weekdayOfKey(dateKey));
}
