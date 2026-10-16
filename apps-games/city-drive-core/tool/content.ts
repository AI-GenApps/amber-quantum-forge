import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  buildRoadGraph,
  type CityMap,
  type DistrictInfo,
  LaneIndex,
  loadCityMap,
  loadMissionCatalog,
  type MissionDef,
  type Progression,
  parseCityManifest,
  parseProgression,
  type RoadGraph,
} from "../src/index";

const CORE_DIR = resolve(import.meta.dirname, "..");
export const CONTENT_DIR = join(CORE_DIR, "content");
export const MISSIONS_DIR = join(CONTENT_DIR, "missions");
const MANIFEST_PATH = resolve(CORE_DIR, "../city-drive/public/assets/manifest.json");

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Canonical content JSON: two-space indent and a trailing newline. */
export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export interface MissionFile {
  file: string;
  path: string;
  /** The text on disk. */
  text: string;
  raw: Record<string, unknown>;
}

export interface DistrictContent {
  info: DistrictInfo;
  map: CityMap;
  graph: RoadGraph;
  laneIndex: LaneIndex;
  files: MissionFile[];
  missions: MissionDef[];
}

export interface Content {
  progression: Progression;
  districts: DistrictContent[];
}

function missionFiles(districtId: string): MissionFile[] {
  const number = districtId.replace("district-", "");
  return readdirSync(MISSIONS_DIR)
    .filter((f) => f.startsWith(`d${number}-m`) && f.endsWith(".json"))
    .sort()
    .map((file) => {
      const path = join(MISSIONS_DIR, file);
      const text = readFileSync(path, "utf8");
      return { file, path, text, raw: JSON.parse(text) as Record<string, unknown> };
    });
}

/** Read progression.json, every district map and every mission file, and validate them. */
export function loadContent(): Content {
  const progression = parseProgression(readJson(join(CONTENT_DIR, "progression.json")));
  const manifest = parseCityManifest(readJson(MANIFEST_PATH));
  const districts = progression.districts.map((info): DistrictContent => {
    const map = loadCityMap(readJson(join(CONTENT_DIR, "maps", `${info.id}.json`)), manifest);
    const graph = buildRoadGraph(map);
    const laneIndex = new LaneIndex(graph);
    const files = missionFiles(info.id);
    const missions = [
      ...loadMissionCatalog(
        files.map((f) => f.raw),
        { graph, laneIndex },
      ),
    ];
    return { info, map, graph, laneIndex, files, missions };
  });
  return { progression, districts };
}
