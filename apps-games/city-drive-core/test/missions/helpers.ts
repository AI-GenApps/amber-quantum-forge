import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BASELINE_CAR,
  buildRoadGraph,
  type CarFootprint,
  LaneIndex,
  loadMissionCatalog,
  type MissionCatalog,
  type MissionDef,
  parseMission,
  type RoadGraph,
} from "../../src/index";
import { loadDistrict1 } from "../city/helpers";

export const MISSIONS_DIR = join(import.meta.dirname, "..", "..", "content", "missions");

export const CAR_FOOTPRINT: CarFootprint = {
  halfLength: BASELINE_CAR.chassisHalfExtents.z,
  halfWidth: BASELINE_CAR.chassisHalfExtents.x,
};

export function readMissionFiles(): { file: string; raw: unknown }[] {
  return readdirSync(MISSIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((file) => ({ file, raw: JSON.parse(readFileSync(join(MISSIONS_DIR, file), "utf8")) }));
}

export interface MissionWorld {
  graph: RoadGraph;
  laneIndex: LaneIndex;
  catalog: MissionCatalog;
}

export function loadMissionWorld(): MissionWorld {
  const graph = buildRoadGraph(loadDistrict1());
  const laneIndex = new LaneIndex(graph);
  const catalog = loadMissionCatalog(
    readMissionFiles().map((f) => f.raw),
    { graph, laneIndex },
  );
  return { graph, laneIndex, catalog };
}

export function missionByType(catalog: MissionCatalog, type: MissionDef["type"]): MissionDef {
  const found = catalog.find((m) => m.type === type);
  if (!found) throw new Error(`no ${type} mission in the catalog`);
  return found;
}

export function cloneMission(raw: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
}

export { parseMission };
