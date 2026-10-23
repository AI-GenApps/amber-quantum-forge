import { MAX_STAMPS } from "../constants";
import { CASES, TITLE } from "../content";
import { HISTORY_LIMIT, type HistoryEntry, type Profile } from "./profile";
import { totalStamps } from "./unlocks";

export function appendHistory(
  history: readonly HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  return [...history, entry].slice(-HISTORY_LIMIT);
}

export function bestStamps(profile: Profile, caseId: string): number {
  return profile.cases[caseId]?.stamps ?? 0;
}

export function fastestTimeMs(profile: Profile, caseId: string): number | null {
  return profile.cases[caseId]?.bestTimeMs ?? null;
}

export interface RecordTotals {
  stamps: number;
  casesClosed: number;
  perfectCases: number;
  hintsUsed: number;
  dailiesCleared: number;
  bestStreak: number;
  achievements: number;
}

export function recordTotals(profile: Profile): RecordTotals {
  const closed = CASES.filter((item) => bestStamps(profile, item.id) >= 1);
  return {
    stamps: totalStamps(profile),
    casesClosed: closed.length,
    perfectCases: closed.filter((item) => bestStamps(profile, item.id) === MAX_STAMPS).length,
    hintsUsed: profile.stats.hintsUsed,
    dailiesCleared: profile.stats.dailiesCleared,
    bestStreak: profile.daily.bestStreak,
    achievements: Object.keys(profile.achievements).length,
  };
}

export interface CampaignShare {
  caseId: string;
  title: string;
  stamps: number;
  hints: number;
}

export interface DailyShare {
  dateKey: string;
  stamps: number;
  streak: number;
}

export function hintsPhrase(hints: number): string {
  if (hints <= 0) return "no hints";
  return hints === 1 ? "1 hint" : `${hints} hints`;
}

export function shareText(kind: "campaign", data: CampaignShare): string;
export function shareText(kind: "daily", data: DailyShare): string;
export function shareText(kind: "campaign" | "daily", data: CampaignShare | DailyShare): string {
  if (kind === "daily") {
    const daily = data as DailyShare;
    return `${TITLE} Daily ${daily.dateKey}: ${daily.stamps}/${MAX_STAMPS} stamps. Streak ${daily.streak}.`;
  }
  const campaign = data as CampaignShare;
  return `${TITLE} - Case ${campaign.caseId} "${campaign.title}": ${campaign.stamps}/${MAX_STAMPS} stamps, ${hintsPhrase(campaign.hints)}.`;
}
