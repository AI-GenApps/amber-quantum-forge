import {
  type DailyPuzzle,
  type DailyTier,
  generateDaily,
  tierFor,
} from "@web-games/floodplain-dispatch-core";
import { dailySeed, dayNumber } from "@web-games/kit";
import { GAME_ID } from "./saveStores";

export interface DailyInfo {
  dateKey: string;
  weekday: number;
  seed: number;
  tier: DailyTier;
}

const MONDAY_OFFSET = 3;

export function weekdayOf(dateKey: string): number {
  return (((dayNumber(dateKey) + MONDAY_OFFSET) % 7) + 7) % 7;
}

export function dailyInfo(dateKey: string): DailyInfo {
  const weekday = weekdayOf(dateKey);
  return { dateKey, weekday, seed: dailySeed(GAME_ID, dateKey), tier: tierFor(weekday) };
}

const cache = new Map<string, DailyPuzzle>();

export function dailyPuzzle(dateKey: string): DailyPuzzle {
  const cached = cache.get(dateKey);
  if (cached) return cached;
  const info = dailyInfo(dateKey);
  const puzzle = generateDaily(info.seed, info.tier);
  cache.set(dateKey, puzzle);
  return puzzle;
}
