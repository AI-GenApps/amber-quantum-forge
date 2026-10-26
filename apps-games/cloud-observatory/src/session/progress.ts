import {
  achievementById,
  type Catalog,
  chapterProgress,
  LORE_CHAPTERS,
  newLoreSince,
  type Profile,
  starlightPerSecond,
  updateStats,
  withAchievements,
  withLoreUnlocked,
} from "@web-games/cloud-observatory-core";
import type { Toast } from "./types";

export interface Progressed {
  readonly profile: Profile;
  readonly toasts: readonly Toast[];
}

function chapterTitle(number: number): string {
  return LORE_CHAPTERS.find((chapter) => chapter.number === number)?.title ?? "";
}

function loreToasts(before: Profile, after: Profile, catalog: Catalog): Toast[] {
  const startedBefore = new Set(
    chapterProgress(before, catalog)
      .filter((item) => item.unlocked > 0)
      .map((item) => item.chapter.number),
  );
  const toasts: Toast[] = [];
  for (const entry of newLoreSince(before, after, catalog)) {
    if (!startedBefore.has(entry.chapter)) {
      startedBefore.add(entry.chapter);
      toasts.push({ kind: "chapter", chapter: entry.chapter, title: chapterTitle(entry.chapter) });
    }
    toasts.push({ kind: "lore", id: entry.id, title: entry.title, chapter: entry.chapter });
  }
  return toasts;
}

export function applyProgress(before: Profile, after: Profile, catalog: Catalog): Progressed {
  const known = withLoreUnlocked(before, catalog).loreUnlocked;
  const withLore = withLoreUnlocked({ ...after, loreUnlocked: known }, catalog);
  const toasts = loreToasts(before, withLore, catalog);
  const granted = withAchievements(withLore, catalog);
  for (const id of granted.unlocked) {
    const def = achievementById.get(id);
    if (def) {
      toasts.push({ kind: "achievement", id, name: def.name, description: def.description });
    }
  }
  const stats = updateStats(granted.profile.stats, {
    type: "production",
    perSecond: starlightPerSecond(granted.profile.game, catalog),
  });
  const profile = stats === granted.profile.stats ? granted.profile : { ...granted.profile, stats };
  return { profile, toasts };
}
