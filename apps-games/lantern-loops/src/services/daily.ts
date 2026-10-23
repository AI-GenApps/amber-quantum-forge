import { dailySeed, localDateKey } from "@web-games/kit";
import {
  archiveKeys,
  type DailyTier,
  dailyId,
  dailyTier,
  encodePuzzle,
  generateDaily,
  type Puzzle,
  type Tiles,
  type Weekday,
  weekdayOf,
} from "@web-games/lantern-loops-core";
import type { Profile } from "../save/profile";

export const GAME_ID = "lantern-loops";
const CACHE_LIMIT = 40;

export interface DailyPuzzle {
  dateKey: string;
  id: string;
  weekday: Weekday;
  tier: DailyTier;
  puzzle: Puzzle;
  solution: Tiles;
  code: string;
}

export interface ArchiveEntry {
  dateKey: string;
  weekday: Weekday;
  tier: DailyTier;
  status: "to-play" | "completed";
  stars: number;
  seconds: number | null;
}

const cache = new Map<string, DailyPuzzle>();

export function todayKey(now: Date): string {
  return localDateKey(now);
}

export function clearDailyCache(): void {
  cache.clear();
}

/** The generated puzzle of a date, built once per session and then served from memory. */
export function puzzleForDate(dateKey: string): DailyPuzzle {
  const hit = cache.get(dateKey);
  if (hit !== undefined) return hit;
  const weekday = weekdayOf(dateKey);
  const made = generateDaily(dailySeed(GAME_ID, dateKey), weekday, dailyId(dateKey));
  const entry: DailyPuzzle = {
    dateKey,
    id: dailyId(dateKey),
    weekday,
    tier: dailyTier(weekday),
    puzzle: made.puzzle,
    solution: made.solution,
    code: encodePuzzle(made.puzzle),
  };
  cache.set(dateKey, entry);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return entry;
}

/** The 30 previous dates, yesterday first, each marked to play or completed. */
export function archiveList(
  today: string,
  profile: Pick<Profile, "dailiesSolved">,
): ArchiveEntry[] {
  return archiveKeys(today).map((dateKey) => {
    const weekday = weekdayOf(dateKey);
    const solved = profile.dailiesSolved[dateKey];
    return {
      dateKey,
      weekday,
      tier: dailyTier(weekday),
      status: solved === undefined ? "to-play" : "completed",
      stars: solved?.stars ?? 0,
      seconds: solved?.seconds ?? null,
    };
  });
}
