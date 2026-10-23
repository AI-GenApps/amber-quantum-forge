import { CAMPAIGN, CHAPTERS, PUZZLES_PER_CHAPTER } from "../content/chapters";
import type { ChapterId, PuzzleRecord } from "../content/types";
import { type Weekday, weekdayOf } from "./calendar";
import { chapterSolved, chapterStars, totalStars } from "./stars";

export interface DailyRecord {
  readonly stars: number;
  readonly seconds: number;
}

/** The slice of the saved profile the statistics screen reads. */
export interface StatsProfile {
  readonly stars: Readonly<Record<string, number>>;
  /** Fastest solve per puzzle id, in seconds. */
  readonly bestTimes: Readonly<Record<string, number>>;
  readonly dailiesSolved: Readonly<Record<string, DailyRecord>>;
  readonly streak: number;
  readonly bestStreak: number;
  readonly hintsUsed: number;
  readonly playSeconds: number;
}

export interface ChapterStats {
  readonly id: ChapterId;
  readonly title: string;
  readonly stars: number;
  readonly maxStars: number;
  readonly solved: number;
  readonly total: number;
}

export interface BestTime {
  readonly id: string;
  readonly seconds: number;
}

export interface Stats {
  readonly solved: number;
  readonly stars: number;
  readonly maxStars: number;
  readonly threeStar: number;
  readonly chapters: ChapterStats[];
  readonly dailiesSolved: number;
  readonly dailyStars: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly hintsUsed: number;
  readonly playSeconds: number;
  /** Fastest campaign solve per board size (5 to 9), only sizes with a recorded time. */
  readonly bestTimeBySize: Readonly<Record<number, BestTime>>;
  readonly bestDailySeconds: number | null;
  /** Dailies solved per ISO weekday, index 0 = Monday ... 6 = Sunday. */
  readonly solvesByWeekday: readonly number[];
}

function isPositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function bestTimesBySize(
  times: Readonly<Record<string, number>>,
  campaign: readonly PuzzleRecord[],
): Record<number, BestTime> {
  const out: Record<number, BestTime> = {};
  for (const record of campaign) {
    const seconds = times[record.id];
    if (!isPositive(seconds)) continue;
    const current = out[record.size];
    if (current === undefined || seconds < current.seconds) {
      out[record.size] = { id: record.id, seconds };
    }
  }
  return out;
}

export function computeStats(
  profile: StatsProfile,
  campaign: readonly PuzzleRecord[] = CAMPAIGN,
): Stats {
  let solved = 0;
  let threeStar = 0;
  for (const record of campaign) {
    const stars = profile.stars[record.id] ?? 0;
    if (stars >= 1) solved += 1;
    if (stars >= 3) threeStar += 1;
  }
  const weekdays = [0, 0, 0, 0, 0, 0, 0];
  let dailyStars = 0;
  let bestDaily: number | null = null;
  const dates = Object.keys(profile.dailiesSolved);
  for (const dateKey of dates) {
    const record = profile.dailiesSolved[dateKey] as DailyRecord;
    dailyStars += record.stars;
    if (isPositive(record.seconds) && (bestDaily === null || record.seconds < bestDaily)) {
      bestDaily = record.seconds;
    }
    const day: Weekday = weekdayOf(dateKey);
    weekdays[day - 1] = (weekdays[day - 1] ?? 0) + 1;
  }
  return {
    solved,
    stars: totalStars(profile.stars),
    maxStars: campaign.length * 3,
    threeStar,
    chapters: CHAPTERS.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      stars: chapterStars(profile.stars, chapter.id),
      maxStars: PUZZLES_PER_CHAPTER * 3,
      solved: chapterSolved(profile.stars, chapter.id),
      total: PUZZLES_PER_CHAPTER,
    })),
    dailiesSolved: dates.length,
    dailyStars,
    currentStreak: profile.streak,
    bestStreak: Math.max(profile.bestStreak, profile.streak),
    hintsUsed: profile.hintsUsed,
    playSeconds: profile.playSeconds,
    bestTimeBySize: bestTimesBySize(profile.bestTimes, campaign),
    bestDailySeconds: bestDaily,
    solvesByWeekday: weekdays,
  };
}
