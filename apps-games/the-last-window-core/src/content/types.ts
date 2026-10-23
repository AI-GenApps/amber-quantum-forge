import type { SceneScript } from "../story/types";
import type { BookId, DecorId, DrinkId, Likes, MoodId, Order, PastryId, Weather } from "../types";

export interface DayUnlocks {
  drinks: readonly DrinkId[];
  pastries: readonly PastryId[];
  books: readonly BookId[];
  decor: readonly DecorId[];
}

export interface DayDef {
  day: number;
  title: string;
  weather: Weather;
  shiftTicks: number;
  customers: number;
  patienceSeconds: number;
  regularsDue: readonly number[];
  unlocks: DayUnlocks;
}

export interface RegularDef {
  id: number;
  name: string;
  shortName: string;
  speaker: string;
  artPrefix: string;
  likes: Likes;
  visitDays: readonly [number, number, number, number, number];
  storyTitle: string;
  endingTitles: { a: string; b: string };
  choiceCount: 1 | 2;
}

export interface SceneDef extends SceneScript {
  gift: number;
  next: string | null;
}

export type FinaleVariant = "a" | "b" | "unfinished";

export interface FinaleLine {
  regularId: number;
  variant: FinaleVariant;
  text: string;
}

export interface Finale {
  lines: readonly FinaleLine[];
  caption: string;
}

export interface DiaryEntry {
  day: number;
  title: string;
  text: string;
}

export interface DayCard {
  day: number;
  title: string;
  text: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  text: string;
  action: string;
}

export interface ScriptedCustomer {
  kind: "regular" | "walkin";
  regularId: number | null;
  look: number;
}

export interface ScriptedOrder {
  id: string;
  tick: number;
  customer: ScriptedCustomer;
  order: Order;
}

export type ArtKind = "icon" | "key-art" | "interior" | "bust" | "item" | "decor" | "feature";

export interface ArtSize {
  width: number;
  height: number;
}

export interface ArtSlotDef {
  id: string;
  batch: "B1" | "B2" | "B3" | "B4";
  kind: ArtKind;
  master: ArtSize;
  runtime: ArtSize | null;
}

export interface MoodText {
  id: MoodId;
  name: string;
  text: string;
}

export type ContentIssueCode =
  | "DAY_TABLE"
  | "CALENDAR"
  | "VISIT_COUNT"
  | "SCENE_COUNT"
  | "DANGLING_SCENE"
  | "DANGLING_GUARD"
  | "BAD_CHOICE_COUNT"
  | "BAD_ENDING"
  | "UNREACHABLE_ARC"
  | "BEAT_LENGTH"
  | "BEAT_COUNT"
  | "READING_LEVEL"
  | "BAD_SPEAKER"
  | "UNKNOWN_ART_SLOT"
  | "UNKNOWN_ITEM"
  | "BAD_CHARACTER";

export interface ContentIssue {
  code: ContentIssueCode;
  where: string;
  message: string;
}

export interface ContentBundle {
  days: readonly DayDef[];
  regulars: readonly RegularDef[];
  scenes: readonly SceneDef[];
  finale: Finale;
  diary: readonly DiaryEntry[];
  dayCards: readonly DayCard[];
  artSlotIds: ReadonlySet<string>;
}
