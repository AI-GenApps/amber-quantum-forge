import type { ChapterContent, DeskTheme } from "../content";
import { CASES, CHAPTERS, THEMES } from "../content";
import type { Profile } from "./profile";

export type UnlockTarget =
  | { kind: "chapter"; id: number; needed: number }
  | { kind: "theme"; id: string; needed: number };

export function isClosed(profile: Profile, caseId: string): boolean {
  return (profile.cases[caseId]?.stamps ?? 0) >= 1;
}

export function stampsOf(profile: Profile, caseId: string): number {
  return profile.cases[caseId]?.stamps ?? 0;
}

export function totalStamps(profile: Profile): number {
  return CASES.reduce((sum, item) => sum + stampsOf(profile, item.id), 0);
}

function chapterIndex(chapterId: number): number {
  return CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
}

export function chapterUnlocked(profile: Profile, chapterId: number): boolean {
  const index = chapterIndex(chapterId);
  const chapter = CHAPTERS[index];
  if (chapter === undefined) return false;
  if (index === 0) return true;
  const previous = CHAPTERS[index - 1] as ChapterContent;
  const gate = previous.caseIds.at(-1);
  if (gate === undefined || !isClosed(profile, gate)) return false;
  return totalStamps(profile) >= chapter.unlockStamps;
}

export function caseUnlocked(profile: Profile, caseId: string): boolean {
  const chapter = CHAPTERS.find((item) => item.caseIds.includes(caseId));
  if (chapter === undefined) return false;
  if (!chapterUnlocked(profile, chapter.id)) return false;
  const at = chapter.caseIds.indexOf(caseId);
  if (at === 0) return true;
  const previous = chapter.caseIds[at - 1];
  return previous !== undefined && isClosed(profile, previous);
}

export function themesUnlocked(profile: Profile): DeskTheme[] {
  const total = totalStamps(profile);
  return THEMES.filter((theme) => theme.stampsNeeded <= total);
}

export function chaptersUnlocked(profile: Profile): number[] {
  return CHAPTERS.filter((chapter) => chapterUnlocked(profile, chapter.id)).map(
    (chapter) => chapter.id,
  );
}

export function stampsToNextUnlock(profile: Profile): UnlockTarget | null {
  const total = totalStamps(profile);
  const targets: UnlockTarget[] = [];
  for (const chapter of CHAPTERS) {
    if (chapter.unlockStamps > total) {
      targets.push({ kind: "chapter", id: chapter.id, needed: chapter.unlockStamps - total });
    }
  }
  for (const theme of THEMES) {
    if (theme.stampsNeeded > total) {
      targets.push({ kind: "theme", id: theme.id, needed: theme.stampsNeeded - total });
    }
  }
  targets.sort((a, b) => a.needed - b.needed);
  return targets[0] ?? null;
}
