import { CHALLENGES } from "../content/challenges";
import { CHAPTERS } from "../content/chapters";
import { PIECES_BY_THEME } from "../content/pieces";
import type { ThemeId } from "../content/types";
import type { Piece, Stars } from "../types";
import type { Profile } from "./types";

export function totalStarsOf(stars: Readonly<Record<string, Stars>>): number {
  let total = 0;
  for (const def of CHALLENGES) total += stars[def.id] ?? 0;
  return total;
}

export function totalStars(profile: Profile): number {
  return totalStarsOf(profile.stars);
}

export function challengeStars(profile: Profile, challengeId: string): Stars {
  return profile.stars[challengeId] ?? 0;
}

export function chapterUnlockedAt(chapterIndex: number, stars: number): boolean {
  const chapter = CHAPTERS[chapterIndex];
  return chapter !== undefined && stars >= chapter.unlockStars;
}

export function chapterUnlocked(profile: Profile, chapterIndex: number): boolean {
  return chapterUnlockedAt(chapterIndex, totalStars(profile));
}

export function chapterCleared(
  stars: Readonly<Record<string, Stars>>,
  chapterIndex: number,
): boolean {
  const members = CHALLENGES.filter((def) => def.chapterIndex === chapterIndex);
  return members.length > 0 && members.every((def) => (stars[def.id] ?? 0) >= 1);
}

export function challengeUnlocked(profile: Profile, challengeId: string): boolean {
  const index = CHALLENGES.findIndex((def) => def.id === challengeId);
  const def = CHALLENGES[index];
  if (def === undefined || !chapterUnlocked(profile, def.chapterIndex)) return false;
  const previous = CHALLENGES[index - 1];
  if (previous === undefined || previous.chapterIndex !== def.chapterIndex) return true;
  return challengeStars(profile, previous.id) >= 1;
}

export function unlockedThemes(profile: Profile): ThemeId[] {
  const total = totalStars(profile);
  return CHAPTERS.filter((chapter) => total >= chapter.unlockStars).map(
    (chapter) => chapter.themeId,
  );
}

export function unlockedPieces(profile: Profile): Piece[] {
  return unlockedThemes(profile).flatMap((theme) => PIECES_BY_THEME[theme]);
}

export interface NextUnlock {
  readonly chapterIndex: number;
  readonly threshold: number;
  readonly needed: number;
}

export function starsToNextUnlock(profile: Profile): NextUnlock | null {
  const total = totalStars(profile);
  const next = CHAPTERS.find((chapter) => chapter.unlockStars > total);
  if (next === undefined) return null;
  return {
    chapterIndex: next.index,
    threshold: next.unlockStars,
    needed: next.unlockStars - total,
  };
}
