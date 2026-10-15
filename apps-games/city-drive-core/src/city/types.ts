import type { TileRotation } from "./direction";

export type TileKind = "road" | "building" | "park" | "plaza" | "empty";

export const TILE_KINDS: readonly TileKind[] = ["road", "building", "park", "plaza", "empty"];

export const CITY_MAP_SCHEMA_VERSION = 1;

export interface CityTile {
  x: number;
  y: number;
  kind: TileKind;
  /** Manifest id. Required for road and building tiles, optional otherwise. */
  model?: string;
  rot: TileRotation;
}

/** Where the player starts: a straight road tile, facing a compass heading (0/90/180/270). */
export interface CitySpawn {
  x: number;
  y: number;
  heading: number;
}

/** Versioned city description. Tiles that are not listed are `empty`. */
export interface CityMap {
  schema_version: number;
  id: string;
  tile_size_m: number;
  width: number;
  height: number;
  tiles: CityTile[];
  spawn: CitySpawn;
}

export type CityMapIssueCode =
  | "schema"
  | "out-of-bounds"
  | "duplicate-tile"
  | "missing-model"
  | "unknown-model"
  | "wrong-model-kind"
  | "unknown-road-model"
  | "socket-outside-map"
  | "socket-mismatch"
  | "invalid-spawn";

export interface CityMapIssue {
  code: CityMapIssueCode;
  message: string;
  x?: number;
  y?: number;
}

export class CityMapError extends Error {
  readonly issues: readonly CityMapIssue[];

  constructor(mapId: string, issues: readonly CityMapIssue[]) {
    const lines = issues.map((i) => {
      const where = i.x !== undefined && i.y !== undefined ? ` tile (${i.x},${i.y}):` : "";
      return `  - [${i.code}]${where} ${i.message}`;
    });
    super(`city map "${mapId}" has ${issues.length} problem(s)\n${lines.join("\n")}`);
    this.name = "CityMapError";
    this.issues = issues;
  }
}
