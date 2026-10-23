import type { ClientId, RuleCardId, ThemeId } from "../content/types";
import type { Look, Stars } from "../types";

export type FrameId = "plain" | "paper" | "polaroid" | "magazine";

export const FRAME_IDS: readonly FrameId[] = ["plain", "paper", "polaroid", "magazine"];

export type AffinityLevel = 0 | 1 | 2 | 3;

export type ResultKind = "campaign" | "daily";

export interface BestResult {
  readonly stars: Stars;
  readonly harmony: number;
  readonly spend: number;
}

export interface DailyResult {
  readonly stars: Stars;
  readonly harmony: number;
}

export interface DailyRecord {
  readonly lastKey: string | null;
  readonly streak: number;
  readonly bestStreak: number;
  readonly results: Readonly<Record<string, DailyResult>>;
}

export interface GalleryEntry {
  readonly id: string;
  readonly kind: ResultKind;
  readonly ref: string;
  readonly look: Look;
  readonly stars: Stars;
  readonly harmony: number;
  readonly savedKey: string;
}

export interface HistoryEntry {
  readonly kind: ResultKind;
  readonly ref: string;
  readonly stars: Stars;
  readonly harmony: number;
  readonly key: string;
}

export interface Flags {
  readonly tutorial: boolean;
  readonly howTo: boolean;
  readonly ruleCards: Readonly<Partial<Record<RuleCardId, true>>>;
}

export interface Stats {
  readonly looksFinished: number;
  readonly starsEarned: number;
  readonly hintsUsed: number;
  readonly boardsExported: number;
}

export type StatKey = keyof Stats;

export type FlagKey = "tutorial" | "howTo" | `card-${RuleCardId}`;

export interface Profile {
  readonly coins: number;
  readonly stars: Readonly<Record<string, Stars>>;
  readonly best: Readonly<Record<string, BestResult>>;
  readonly chapterBonusClaimed: Readonly<Partial<Record<ThemeId, true>>>;
  readonly affinityPaid: Readonly<Partial<Record<ClientId, AffinityLevel>>>;
  readonly streakFreezes: number;
  readonly framesOwned: readonly FrameId[];
  readonly frameSelected: FrameId;
  readonly daily: DailyRecord;
  readonly gallery: readonly GalleryEntry[];
  readonly history: readonly HistoryEntry[];
  readonly flags: Flags;
  readonly stats: Stats;
}

export type ProgressEvent =
  | { readonly type: "coins-gained"; readonly amount: number; readonly reason: CoinReason }
  | { readonly type: "coins-spent"; readonly amount: number; readonly reason: SpendReason }
  | {
      readonly type: "star-gained";
      readonly challengeId: string;
      readonly from: Stars;
      readonly to: Stars;
    }
  | { readonly type: "chapter-bonus"; readonly chapterIndex: number; readonly amount: number }
  | { readonly type: "chapter-unlocked"; readonly chapterIndex: number }
  | {
      readonly type: "pieces-unlocked";
      readonly chapterIndex: number;
      readonly count: number;
      readonly closetSize: number;
    }
  | {
      readonly type: "affinity-level";
      readonly clientId: ClientId;
      readonly level: AffinityLevel;
      readonly amount: number;
    }
  | { readonly type: "freeze-used"; readonly count: number }
  | { readonly type: "streak-reset" };

export type CoinReason =
  | "first-clear"
  | "star"
  | "chapter-bonus"
  | "affinity"
  | "daily"
  | "daily-streak";

export type SpendReason = "hint" | "freeze" | "frame";

export interface ProgressUpdate {
  readonly profile: Profile;
  readonly events: readonly ProgressEvent[];
}
