import { CAMPAIGN, CHAPTERS, PUZZLES_PER_CHAPTER } from "../content/chapters";
import { CHAPTER_IDS, type ChapterId } from "../content/types";

/** Stars per puzzle: 0 hints = 3, 1 hint = 2, 2 or more hints = 1. */
export const STARS_BY_HINTS: readonly [number, number, number] = [3, 2, 1];

/** Total campaign stars that open each chapter (`economy.md`, Chapter unlocks). */
export const STAR_UNLOCKS: Readonly<Record<ChapterId, number>> = {
  harbor: 0,
  garden: 45,
  bridge: 120,
  sky: 210,
};

/** A map of puzzle id to its best stars (0 = unsolved). */
export type StarMap = Readonly<Record<string, number>>;

export function starsForHints(hints: number): number {
  if (!Number.isFinite(hints) || hints < 0) return STARS_BY_HINTS[0];
  const index = Math.min(Math.floor(hints), STARS_BY_HINTS.length - 1);
  return STARS_BY_HINTS[index] as number;
}

export function bestStars(previous: number | undefined, next: number): number {
  return Math.max(previous ?? 0, next);
}

function clampStars(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(3, Math.floor(value)));
}

/** Sum of the best stars over the 120 campaign puzzles; other ids never count. */
export function totalStars(stars: StarMap): number {
  let total = 0;
  for (const record of CAMPAIGN) total += clampStars(stars[record.id]);
  return total;
}

export function chapterStars(stars: StarMap, chapter: ChapterId): number {
  let total = 0;
  for (const record of CAMPAIGN) {
    if (record.chapter === chapter) total += clampStars(stars[record.id]);
  }
  return total;
}

export function chapterSolved(stars: StarMap, chapter: ChapterId): number {
  let solved = 0;
  for (const record of CAMPAIGN) {
    if (record.chapter === chapter && clampStars(stars[record.id]) >= 1) solved += 1;
  }
  return solved;
}

export function isChapterUnlocked(chapter: ChapterId, total: number): boolean {
  return total >= STAR_UNLOCKS[chapter];
}

/** Stars still missing to open a chapter; 0 once it is open. */
export function starsToUnlock(chapter: ChapterId, total: number): number {
  return Math.max(0, STAR_UNLOCKS[chapter] - total);
}

/** Chapters whose 30 puzzles are all solved (any stars), in chapter order. */
export function chaptersCleared(stars: StarMap): ChapterId[] {
  return CHAPTER_IDS.filter((id) => chapterSolved(stars, id) === PUZZLES_PER_CHAPTER);
}

/** Chapters that the star total moved from locked to open. */
export function newlyUnlocked(before: number, after: number): ChapterId[] {
  return CHAPTERS.filter((c) => before < c.unlockStars && after >= c.unlockStars).map((c) => c.id);
}
