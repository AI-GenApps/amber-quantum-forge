import { LORE, LORE_CHAPTERS } from "./content/lore";
import type { LoreChapter, LoreEntry } from "./content/types";
import type { Profile } from "./profile";
import type { Catalog } from "./types";

export interface ChapterProgress {
  readonly chapter: LoreChapter;
  readonly unlocked: number;
  readonly total: number;
}

function triggered(entry: LoreEntry, profile: Profile): boolean {
  const { game } = profile;
  switch (entry.trigger.kind) {
    case "instrument":
      return (game.owned[entry.trigger.id] ?? 0) >= 1;
    case "constellation":
      return game.charted.includes(entry.trigger.id);
    case "boon":
      return game.boons.includes(entry.trigger.id);
  }
}

export function loreIdsFor(
  profile: Profile,
  _catalog?: Catalog,
  lore: readonly LoreEntry[] = LORE,
): string[] {
  return lore
    .filter((entry) => profile.loreUnlocked.includes(entry.id) || triggered(entry, profile))
    .map((entry) => entry.id);
}

export function unlockedLore(
  profile: Profile,
  catalog?: Catalog,
  lore: readonly LoreEntry[] = LORE,
): LoreEntry[] {
  const ids = new Set(loreIdsFor(profile, catalog, lore));
  return lore.filter((entry) => ids.has(entry.id));
}

export function newLoreSince(before: Profile, after: Profile, catalog?: Catalog): LoreEntry[] {
  const known = new Set(loreIdsFor(before, catalog));
  return unlockedLore(after, catalog).filter((entry) => !known.has(entry.id));
}

export function withLoreUnlocked(profile: Profile, catalog?: Catalog): Profile {
  const ids = loreIdsFor(profile, catalog);
  if (ids.length === profile.loreUnlocked.length) return profile;
  return { ...profile, loreUnlocked: ids };
}

export function chapterProgress(
  profile: Profile,
  catalog?: Catalog,
  lore: readonly LoreEntry[] = LORE,
  chapters: readonly LoreChapter[] = LORE_CHAPTERS,
): ChapterProgress[] {
  const ids = new Set(loreIdsFor(profile, catalog, lore));
  return chapters.map((chapter) => {
    const entries = lore.filter((entry) => entry.chapter === chapter.number);
    return {
      chapter,
      unlocked: entries.filter((entry) => ids.has(entry.id)).length,
      total: entries.length,
    };
  });
}

export function isChapterStarted(profile: Profile, chapter: number, catalog?: Catalog): boolean {
  return chapterProgress(profile, catalog).some(
    (progress) => progress.chapter.number === chapter && progress.unlocked > 0,
  );
}
