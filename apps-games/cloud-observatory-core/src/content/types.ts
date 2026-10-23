import type { AchievementId, BoonId, ConstellationId, InstrumentId } from "../types";

export type AchievementCondition =
  | { readonly kind: "owned"; readonly instrumentId: InstrumentId; readonly count: number }
  | { readonly kind: "charted"; readonly count: number }
  | { readonly kind: "flawless" }
  | { readonly kind: "lifetime"; readonly amount: number }
  | { readonly kind: "eclipses"; readonly count: number }
  | { readonly kind: "comet-days"; readonly count: number }
  | { readonly kind: "comet-streak"; readonly count: number }
  | { readonly kind: "lore"; readonly count: number }
  | { readonly kind: "offline-full" };

export interface AchievementDef {
  readonly id: AchievementId;
  readonly name: string;
  readonly description: string;
  readonly condition: AchievementCondition;
}

export type LoreTrigger =
  | { readonly kind: "instrument"; readonly id: InstrumentId }
  | { readonly kind: "constellation"; readonly id: ConstellationId }
  | { readonly kind: "boon"; readonly id: BoonId };

export interface LoreChapter {
  readonly number: number;
  readonly title: string;
  readonly slot: string;
}

export interface LoreEntry {
  readonly id: string;
  readonly chapter: number;
  readonly title: string;
  readonly trigger: LoreTrigger;
  readonly body: string;
}
