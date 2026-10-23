import type { MapDef, Placement } from "../types";

export type RegionId = "valley" | "delta" | "highland" | "estuary";

export interface CampaignMap extends MapDef {
  id: string;
  name: string;
  region: RegionId;
  brief: string;
  reference: readonly Placement[];
}

export interface RegionDef {
  id: RegionId;
  name: string;
  chapterTitle: string;
  mechanic: string;
  unlockStars: number;
  mapIds: readonly string[];
}

export interface ChapterText {
  region: RegionId;
  title: string;
  intro: string;
  outro: string;
}

export interface MechanicCard {
  id: string;
  title: string;
  mapId: string;
  text: string;
}

export interface TutorialStep {
  step: number;
  text: string;
  highlight: string;
}

export interface ThemeDef {
  id: string;
  name: string;
  starsNeeded: number;
}

export type ResultStars = 0 | 1 | 2 | 3;

export interface ResultHeadline {
  stars: ResultStars;
  text: string;
}
