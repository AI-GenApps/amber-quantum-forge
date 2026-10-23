import { CHALLENGE_BY_ID, CLIENT_BY_ID } from "../content";
import { CHAPTERS } from "../content/chapters";
import { GAME_TITLE } from "../content/strings";
import type { Stars } from "../types";
import { MAX_HISTORY } from "./profile";
import type { BestResult, HistoryEntry, Profile, StatKey } from "./types";
import { totalStars } from "./unlocks";

export function appendHistory(profile: Profile, entry: HistoryEntry): Profile {
  return { ...profile, history: [...profile.history, entry].slice(-MAX_HISTORY) };
}

export function addStat(profile: Profile, key: StatKey, amount = 1): Profile {
  return { ...profile, stats: { ...profile.stats, [key]: profile.stats[key] + amount } };
}

export function bestFor(profile: Profile, challengeId: string): BestResult | null {
  const stars = profile.stars[challengeId] ?? 0;
  if (stars === 0) return null;
  const best = profile.best[challengeId];
  return best ?? { stars, harmony: 0, spend: 0 };
}

export interface ProfileTotals {
  readonly stars: number;
  readonly challengesCleared: number;
  readonly threeStarChallenges: number;
  readonly dailyDays: number;
  readonly coins: number;
  readonly bestStreak: number;
}

export function profileTotals(profile: Profile): ProfileTotals {
  const earned = Object.values(profile.stars);
  return {
    stars: totalStars(profile),
    challengesCleared: earned.filter((stars) => stars >= 1).length,
    threeStarChallenges: earned.filter((stars) => stars === 3).length,
    dailyDays: Object.keys(profile.daily.results).length,
    coins: profile.coins,
    bestStreak: profile.daily.bestStreak,
  };
}

export interface CampaignShare {
  readonly challengeId: string;
  readonly stars: Stars;
  readonly harmony: number;
}

export interface DailyShare {
  readonly dateKey: string;
  readonly stars: Stars;
  readonly harmony: number;
  readonly streak: number;
}

export type ShareDetails = CampaignShare | DailyShare;

export function shareText(kind: "campaign", details: CampaignShare): string;
export function shareText(kind: "daily", details: DailyShare): string;
export function shareText(kind: "campaign" | "daily", details: ShareDetails): string {
  if (kind === "daily" && "dateKey" in details) {
    return `${GAME_TITLE} Daily ${details.dateKey}: ${details.stars}/3 stars, harmony ${details.harmony}. Streak ${details.streak}.`;
  }
  if ("challengeId" in details) {
    const def = CHALLENGE_BY_ID.get(details.challengeId);
    const chapter = def === undefined ? undefined : CHAPTERS[def.chapterIndex];
    const client = def === undefined ? undefined : CLIENT_BY_ID.get(def.clientId);
    if (def !== undefined && chapter !== undefined && client !== undefined) {
      return `${GAME_TITLE} - ${chapter.title} "${def.name}": ${details.stars}/3 stars, harmony ${details.harmony}, styled for ${client.name}.`;
    }
  }
  return `${GAME_TITLE}: ${details.stars}/3 stars, harmony ${details.harmony}.`;
}
