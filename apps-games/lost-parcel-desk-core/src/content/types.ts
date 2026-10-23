import type { CaseDef, Clue, EvidenceObject, FacetId, Person } from "../types";

export const GLYPH_KINDS = [
  "tin",
  "cloth",
  "paper",
  "card",
  "key",
  "glove",
  "bag",
  "box",
  "metal",
  "wood",
  "lens",
  "lamp",
  "ticket",
  "hat",
] as const;

export type GlyphKind = (typeof GLYPH_KINDS)[number];
export type ChapterNumber = 1 | 2 | 3;

export interface Hotspot {
  x: number;
  y: number;
}

export interface PersonContent extends Person {
  bio: string;
  portraitSlot: string;
  ownsCaseId: string;
}

export interface ObjectContent extends EvidenceObject {
  glyph: GlyphKind;
  artSlot: string;
}

export interface ClueContent extends Clue {
  hotspot?: Hotspot;
}

export interface CaseContent extends CaseDef {
  title: string;
  slug: string;
  chapter: ChapterNumber;
  foundAt: string;
  labelText: string;
  place: string;
  difficulty: number;
  parMinutes: number;
  reveal: string;
  ledgerTitle: string;
  objects: ObjectContent[];
  clues: ClueContent[];
}

export interface AlmanacEntry {
  facet: FacetId;
  value: string;
  keywords: string[];
  avoid: string[];
}

export interface Street {
  id: string;
  name: string;
}

export interface Place {
  caseId: string;
  name: string;
  street: string;
}

export interface ChapterContent {
  id: ChapterNumber;
  title: string;
  caseIds: string[];
  unlockStamps: number;
  intro: string;
  outro: string;
}

export interface LedgerFragment {
  id: number;
  caseId: string;
  title: string;
  text: string;
}

export type AchievementRule =
  | { kind: "close-case"; caseId: string }
  | { kind: "close-with-stamps"; stamps: number; noHint: boolean }
  | { kind: "all-faces-inspected" }
  | { kind: "close-chapter"; chapter: ChapterNumber }
  | { kind: "total-stamps"; stamps: number }
  | { kind: "daily-streak"; days: number }
  | { kind: "replay-improve" };

export interface Achievement {
  id: string;
  title: string;
  condition: string;
  rule: AchievementRule;
}

export interface DeskTheme {
  id: string;
  name: string;
  stampsNeeded: number;
  desk: string;
  ink: string;
}

export interface MechanicCard {
  id: string;
  title: string;
  caseId: string;
  text: string;
}

export type TutorialTrigger =
  | { kind: "parcel-opened" }
  | { kind: "object-opened"; objectId: string }
  | { kind: "clue-found"; clueId: string }
  | { kind: "clue-pinned" }
  | { kind: "clue-linked-fits" }
  | { kind: "accused" };

export interface TutorialStep {
  step: number;
  prompt: string;
  advancesWhen: string;
  trigger: TutorialTrigger;
}

export interface ContentSet {
  people: readonly PersonContent[];
  cases: readonly CaseContent[];
  chapters: readonly ChapterContent[];
  places: readonly Place[];
  streets: readonly Street[];
  almanac: readonly AlmanacEntry[];
  ledger: readonly LedgerFragment[];
  achievements: readonly Achievement[];
  themes: readonly DeskTheme[];
  cards: readonly MechanicCard[];
  tutorial: readonly TutorialStep[];
}
