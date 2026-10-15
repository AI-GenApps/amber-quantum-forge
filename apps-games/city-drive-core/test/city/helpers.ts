import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type CityManifest,
  type CityMap,
  type CityTile,
  loadCityMap,
  parseCityManifest,
} from "../../src/index";

const CORE_DIR = join(import.meta.dirname, "..", "..");

export const MANIFEST_PATH = join(
  CORE_DIR,
  "..",
  "city-drive",
  "public",
  "assets",
  "manifest.json",
);
export const DISTRICT_1_PATH = join(CORE_DIR, "content", "maps", "district-1.json");

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function loadManifest(): CityManifest {
  return parseCityManifest(readJson(MANIFEST_PATH));
}

export function loadDistrict1(): CityMap {
  return loadCityMap(readJson(DISTRICT_1_PATH), loadManifest());
}

/** Road tiles of district-1 where the road ends in a cap (traffic U-turns here). */
export const DISTRICT_1_ROAD_ENDS = [
  { x: 3, y: 0 },
  { x: 3, y: 11 },
];

export function road(x: number, y: number, model: string, rot: CityTile["rot"] = 0): CityTile {
  return { x, y, kind: "road", model, rot };
}

export function building(x: number, y: number, model = "bld-commercial-a"): CityTile {
  return { x, y, kind: "building", model, rot: 0 };
}

/** A small valid 3x3 map: a straight road with a cap at each end, buildings elsewhere. */
export function miniMap(overrides: Partial<CityMap> = {}): CityMap {
  const tiles: CityTile[] = [
    road(1, 0, "road-end", 0),
    road(1, 1, "road-straight"),
    road(1, 2, "road-end", 180),
    building(0, 0),
    building(2, 0),
    building(0, 1),
    building(2, 1),
    building(0, 2),
    building(2, 2),
  ];
  return {
    schema_version: 1,
    id: "mini",
    tile_size_m: 20,
    width: 3,
    height: 3,
    tiles,
    spawn: { x: 1, y: 1, heading: 0 },
    ...overrides,
  };
}
