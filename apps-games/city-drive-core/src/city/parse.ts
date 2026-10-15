import { isRotation } from "./direction";
import {
  CITY_MAP_SCHEMA_VERSION,
  type CityMap,
  CityMapError,
  type CityMapIssue,
  type CitySpawn,
  type CityTile,
  TILE_KINDS,
  type TileKind,
} from "./types";

const MAX_DIMENSION = 256;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTileKind(value: unknown): value is TileKind {
  return typeof value === "string" && (TILE_KINDS as readonly string[]).includes(value);
}

function parseDimension(raw: Record<string, unknown>, key: string, issues: CityMapIssue[]): number {
  const value = raw[key];
  if (typeof value === "number" && Number.isInteger(value) && value > 0 && value <= MAX_DIMENSION) {
    return value;
  }
  issues.push({ code: "schema", message: `${key} must be an integer in 1..${MAX_DIMENSION}` });
  return 1;
}

function parseTile(raw: unknown, index: number, issues: CityMapIssue[]): CityTile | undefined {
  const label = `tiles[${index}]`;
  if (!isRecord(raw)) {
    issues.push({ code: "schema", message: `${label} must be an object` });
    return undefined;
  }
  const { x, y, kind, model, rot } = raw;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    !Number.isInteger(x) ||
    !Number.isInteger(y)
  ) {
    issues.push({ code: "schema", message: `${label} needs integer x and y` });
    return undefined;
  }
  const at = { x, y };
  if (!isTileKind(kind)) {
    issues.push({ code: "schema", message: `kind must be one of ${TILE_KINDS.join("|")}`, ...at });
    return undefined;
  }
  if (model !== undefined && typeof model !== "string") {
    issues.push({ code: "schema", message: "model must be a string", ...at });
    return undefined;
  }
  const rotation = rot ?? 0;
  if (!isRotation(rotation)) {
    issues.push({
      code: "schema",
      message: `rot must be 0, 90, 180 or 270 (got ${String(rot)})`,
      ...at,
    });
    return undefined;
  }
  return model === undefined ? { x, y, kind, rot: rotation } : { x, y, kind, model, rot: rotation };
}

function parseSpawn(raw: unknown, issues: CityMapIssue[]): CitySpawn {
  if (isRecord(raw) && [raw.x, raw.y, raw.heading].every((v) => typeof v === "number")) {
    return { x: raw.x as number, y: raw.y as number, heading: raw.heading as number };
  }
  issues.push({ code: "schema", message: "spawn must be {x, y, heading} with numbers" });
  return { x: 0, y: 0, heading: 0 };
}

/** Parse untrusted JSON into a CityMap. Structure only; use validateCityMap for the rules. */
export function parseCityMap(raw: unknown): CityMap {
  const issues: CityMapIssue[] = [];
  if (!isRecord(raw)) {
    throw new CityMapError("?", [{ code: "schema", message: "map must be a JSON object" }]);
  }
  const id = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : "?";
  if (id === "?") issues.push({ code: "schema", message: "id must be a non-empty string" });
  if (raw.schema_version !== CITY_MAP_SCHEMA_VERSION) {
    issues.push({
      code: "schema",
      message: `schema_version must be ${CITY_MAP_SCHEMA_VERSION} (got ${String(raw.schema_version)})`,
    });
  }
  const tileSize = raw.tile_size_m;
  if (typeof tileSize !== "number" || !Number.isFinite(tileSize) || tileSize <= 0) {
    issues.push({ code: "schema", message: "tile_size_m must be a positive number" });
  }
  const width = parseDimension(raw, "width", issues);
  const height = parseDimension(raw, "height", issues);
  const tiles: CityTile[] = [];
  if (Array.isArray(raw.tiles)) {
    raw.tiles.forEach((entry: unknown, index: number) => {
      const tile = parseTile(entry, index, issues);
      if (tile) tiles.push(tile);
    });
  } else {
    issues.push({ code: "schema", message: "tiles must be an array" });
  }
  const spawn = parseSpawn(raw.spawn, issues);
  if (issues.length > 0) throw new CityMapError(id, issues);
  return {
    schema_version: CITY_MAP_SCHEMA_VERSION,
    id,
    tile_size_m: tileSize as number,
    width,
    height,
    tiles,
    spawn,
  };
}
