import { ACHIEVEMENTS } from "./content/achievements";
import type { AchievementCondition, AchievementDef } from "./content/types";
import { loreIdsFor } from "./lore-unlock";
import type { Profile } from "./profile";
import type { AchievementId, Catalog } from "./types";

export function isSatisfied(
  condition: AchievementCondition,
  profile: Profile,
  loreCount: number,
): boolean {
  const { game, stats } = profile;
  switch (condition.kind) {
    case "owned":
      return (game.owned[condition.instrumentId] ?? 0) >= condition.count;
    case "charted":
      return game.charted.length >= condition.count;
    case "flawless":
      return stats.flawlessCharts >= 1;
    case "lifetime":
      return game.lifetimeStarlight >= condition.amount;
    case "eclipses":
      return game.eclipses >= condition.count;
    case "comet-days":
      return profile.cometDays >= condition.count;
    case "comet-streak":
      return stats.longestStreak >= condition.count;
    case "lore":
      return loreCount >= condition.count;
    case "offline-full":
      return stats.fullOfflineCollects >= 1;
  }
}

export function evaluateAchievements(
  profile: Profile,
  catalog?: Catalog,
  defs: readonly AchievementDef[] = ACHIEVEMENTS,
): AchievementId[] {
  const loreCount = loreIdsFor(profile, catalog).length;
  return defs
    .filter(
      (def) =>
        !profile.game.achievements.includes(def.id) &&
        isSatisfied(def.condition, profile, loreCount),
    )
    .map((def) => def.id);
}

export function withAchievements(
  profile: Profile,
  catalog?: Catalog,
): { readonly profile: Profile; readonly unlocked: AchievementId[] } {
  const unlocked = evaluateAchievements(profile, catalog);
  if (unlocked.length === 0) return { profile, unlocked };
  return {
    profile: {
      ...profile,
      game: { ...profile.game, achievements: [...profile.game.achievements, ...unlocked] },
    },
    unlocked,
  };
}
