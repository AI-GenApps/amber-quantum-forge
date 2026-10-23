import type { MapDef, Placement } from "@web-games/floodplain-dispatch-core";
import type { SceneryRegion } from "../board/model";

export interface SessionSource {
  kind: "campaign" | "daily";
  /** Stable key; a new key remounts the session. */
  key: string;
  def: MapDef;
  reference: readonly Placement[];
  title: string;
  region: SceneryRegion;
  mapId?: string;
  dateKey?: string;
}

export type SheetState =
  | { kind: "result" }
  | { kind: "inspector" }
  | { kind: "pause" }
  | { kind: "hint" }
  | { kind: "exit" };
