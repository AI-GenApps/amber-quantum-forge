import type { ContentIssue, ContentIssueCode } from "./types";

export function issue(code: ContentIssueCode, where: string, message: string): ContentIssue {
  return { code, where, message };
}

export const LIMITS = {
  days: 14,
  customers: 130,
  regularVisitsCampaign: 40,
  regularVisitsTotal: 48,
  walkins: 82,
  regulars: 8,
  scenesPerRegular: 5,
  scenes: 40,
  choices: 12,
  endings: 16,
  finaleLines: 24,
  diaryEntries: 14,
  dayCards: 14,
  artSlots: 54,
  minBeats: 6,
  maxBeats: 9,
  maxBeatWords: 25,
  minEndingBeats: 3,
  maxEndingBeats: 4,
  reactionBeats: 2,
  maxLabelWords: 8,
  maxSceneGrade: 7,
  maxBeatGrade: 10,
  maxFinaleWords: 20,
  maxCaptionWords: 30,
  maxDiaryWords: 40,
  maxDayCardWords: 30,
  maxItemWords: 12,
} as const;
