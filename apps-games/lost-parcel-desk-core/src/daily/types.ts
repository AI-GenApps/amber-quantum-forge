import type { GlyphKind } from "../content";
import type { CaseDef, EvidenceObject, FacetId } from "../types";
import type { DailyKind } from "./tiers";

export interface DailyObject extends EvidenceObject {
  glyph: GlyphKind;
}

export interface DailyCase extends CaseDef {
  objects: DailyObject[];
  weekday: number;
  attempt: number;
  fallback: boolean;
}

export interface DailyPlan {
  ownerId: string;
  xId: string;
  yId: string;
  candidateIds: [string, string, string];
  facets: [FacetId, FacetId];
  kinds: [DailyKind, DailyKind];
  sides: [0 | 1, 0 | 1];
  flavour: number[];
  order: number[];
  faces: ("front" | "back")[];
}
