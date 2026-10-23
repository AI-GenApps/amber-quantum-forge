import type { Category, Look, Piece, Rule, RuleKind, SlotSetId, Stars } from "../types";

export type ThemeId = "riviera" | "rainy-city" | "gala" | "mountain" | "studio" | "vintage";

export const THEME_IDS: readonly ThemeId[] = [
  "riviera",
  "rainy-city",
  "gala",
  "mountain",
  "studio",
  "vintage",
];

export type ClientId = "mireille" | "tobias" | "ottoline" | "priya" | "jun" | "edie";

export const CLIENT_IDS: readonly ClientId[] = [
  "mireille",
  "tobias",
  "ottoline",
  "priya",
  "jun",
  "edie",
];

export interface ChapterDef {
  readonly index: number;
  readonly themeId: ThemeId;
  readonly title: string;
  readonly chapterTitle: string;
  readonly accent: string;
  readonly unlockStars: number;
  readonly intro: string;
  readonly outro: string;
}

export interface ClientLines {
  readonly intro: string;
  readonly stars3: string;
  readonly stars2: string;
  readonly stars1: string;
  readonly stars0: string;
  readonly level1: string;
  readonly level2: string;
  readonly level3: string;
}

export interface ClientDef {
  readonly id: ClientId;
  readonly name: string;
  readonly role: string;
  readonly bio: string;
  readonly lines: ClientLines;
}

export interface ChallengeDef {
  readonly id: string;
  readonly name: string;
  readonly chapterIndex: number;
  readonly clientId: ClientId;
  readonly slotSet: SlotSetId;
  readonly rules: readonly Rule[];
  readonly brief: string;
  readonly reference: Look;
}

export type RuleCardId =
  | "brief"
  | "warmth"
  | "features"
  | "colour-wheel"
  | "budget"
  | "one-piece"
  | "dress-codes"
  | "must-not"
  | "eras";

export interface RuleCard {
  readonly id: RuleCardId;
  readonly title: string;
  readonly shownOn: string;
  readonly kinds: readonly RuleKind[];
  readonly text: string;
}

export type TutorialTarget =
  | "client-card"
  | "rule-chip"
  | "tray-tab"
  | "slot"
  | "finish-button";

export type TutorialAdvance =
  | "tap"
  | "tab-opened"
  | "first-placement"
  | "look-complete"
  | "finish";

export interface TutorialStep {
  readonly index: number;
  readonly title: string;
  readonly description: string;
  readonly targets: readonly TutorialTarget[];
  readonly advance: TutorialAdvance;
}

export interface ResultHeadline {
  readonly stars: Stars;
  readonly text: string;
}

export type TrayTabLabels = Readonly<Record<Category, string>>;

export interface FrameDef {
  readonly id: "plain" | "paper" | "polaroid" | "magazine";
  readonly name: string;
}

export interface HowToPage {
  readonly id: string;
  readonly title: string;
}

export interface ContentSet {
  readonly pieces: readonly Piece[];
  readonly chapters: readonly ChapterDef[];
  readonly clients: readonly ClientDef[];
  readonly challenges: readonly ChallengeDef[];
  readonly cards: readonly RuleCard[];
}
