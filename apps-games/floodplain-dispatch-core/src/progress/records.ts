import { findMap, GAME_TITLE, REGIONS } from "../content";
import { HISTORY_LIMIT, type HistoryEntry, type Profile, type StarCount } from "./profile";
import { totalStars } from "./unlocks";

export interface Totals {
  stars: number;
  cleared: number;
  perfect: number;
  dailyDays: number;
  bestStreak: number;
  seasons: number;
}

export function appendHistory(
  history: readonly HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  return [...history, entry].slice(-HISTORY_LIMIT);
}

export function bestScore(profile: Profile, mapId: string): number {
  return profile.best[mapId]?.score ?? 0;
}

export function recentHistory(profile: Profile, limit = 50): HistoryEntry[] {
  return profile.history.slice(-limit).reverse();
}

export function totals(profile: Profile): Totals {
  const counts = Object.values(profile.stars);
  return {
    stars: totalStars(profile),
    cleared: counts.filter((stars) => stars >= 1).length,
    perfect: counts.filter((stars) => stars >= 3).length,
    dailyDays: Object.keys(profile.daily.results).length,
    bestStreak: profile.daily.bestStreak,
    seasons: profile.stats.seasons,
  };
}

export interface CampaignShare {
  mapId: string;
  stars: StarCount;
  flooded: number;
  spend: number;
  budget: number;
}

export interface DailyShare {
  dateKey: string;
  stars: StarCount;
  flooded: number;
  streak: number;
}

export function campaignLabel(mapId: string): string {
  const map = findMap(mapId);
  if (!map) return mapId;
  const region = REGIONS.find((entry) => entry.id === map.region);
  const ordinal = region ? region.mapIds.indexOf(mapId) + 1 : 0;
  return `${region?.name ?? map.region} ${ordinal}`;
}

export function shareText(kind: "campaign", data: CampaignShare): string;
export function shareText(kind: "daily", data: DailyShare): string;
export function shareText(kind: "campaign" | "daily", data: CampaignShare | DailyShare): string {
  if (kind === "campaign") {
    const share = data as CampaignShare;
    const name = findMap(share.mapId)?.name ?? share.mapId;
    return `${GAME_TITLE} - ${campaignLabel(share.mapId)} "${name}": ${share.stars}/3 stars, ${share.flooded} flooded, spent ${share.spend} of ${share.budget}.`;
  }
  const share = data as DailyShare;
  return `${GAME_TITLE} Daily ${share.dateKey}: ${share.stars}/3 stars, ${share.flooded} flooded. Streak ${share.streak}.`;
}
