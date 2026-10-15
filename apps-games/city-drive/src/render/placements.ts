import {
  buildingFitScale,
  type CityManifest,
  type CityMap,
  type CityTile,
  ROAD_MODEL_YAW_OFFSET,
  tileCenter,
} from "@city-drive/core/city";
import { CHUNK_TILES, PROP_SCALE_FACTOR } from "./constants";

type PlacementGroup = "road" | "building" | "prop";

/** One model instance in world space. `yawDeg` is clockwise degrees seen from above. */
export interface Placement {
  model: string;
  group: PlacementGroup;
  x: number;
  z: number;
  yawDeg: number;
  scale: number;
  chunk: string;
}

export interface PadPlacement {
  x: number;
  z: number;
  size: number;
  kind: "plaza";
  chunk: string;
}

export interface CityPlan {
  placements: Placement[];
  pads: PadPlacement[];
}

export function chunkKey(tileX: number, tileY: number): string {
  return `${Math.floor(tileX / CHUNK_TILES)},${Math.floor(tileY / CHUNK_TILES)}`;
}

function seeded(x: number, y: number, salt: number): () => number {
  let state = (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663) ^ salt) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roadPlacements(map: CityMap, tile: CityTile, out: Placement[]): void {
  if (tile.model === undefined) return;
  const c = tileCenter(map, tile.x, tile.y);
  const chunk = chunkKey(tile.x, tile.y);
  const yawDeg = tile.rot + (ROAD_MODEL_YAW_OFFSET[tile.model] ?? 0);
  out.push({
    model: tile.model,
    group: "road",
    x: c.x,
    z: c.z,
    yawDeg,
    scale: map.tile_size_m,
    chunk,
  });
  if (tile.model === "road-straight" && (tile.x + tile.y) % 3 === 0) {
    const side = tile.rot % 180 === 0 ? { dx: 0.44, dz: 0 } : { dx: 0, dz: 0.44 };
    const flip = (tile.x + tile.y) % 2 === 0 ? 1 : -1;
    out.push({
      model: "prop-light-square",
      group: "prop",
      x: c.x + side.dx * map.tile_size_m * flip,
      z: c.z + side.dz * map.tile_size_m * flip,
      yawDeg: tile.rot + (flip > 0 ? 0 : 180),
      scale: map.tile_size_m * PROP_SCALE_FACTOR,
      chunk,
    });
  }
}

function parkPlacements(map: CityMap, tile: CityTile, out: Placement[]): void {
  const c = tileCenter(map, tile.x, tile.y);
  const rand = seeded(tile.x, tile.y, 0x9e37);
  const count = 3;
  for (let i = 0; i < count; i++) {
    const big = rand() > 0.5;
    out.push({
      model: big ? "prop-tree-large" : "prop-tree-small",
      group: "prop",
      x: c.x + (rand() - 0.5) * map.tile_size_m * 0.7,
      z: c.z + (rand() - 0.5) * map.tile_size_m * 0.7,
      yawDeg: Math.floor(rand() * 4) * 90,
      scale: map.tile_size_m * PROP_SCALE_FACTOR,
      chunk: chunkKey(tile.x, tile.y),
    });
  }
}

/** Pure description of everything the renderer places. Same map and manifest give the same plan. */
export function planCity(map: CityMap, manifest: CityManifest): CityPlan {
  const placements: Placement[] = [];
  const pads: PadPlacement[] = [];
  const tiles = [...map.tiles].sort((a, b) => a.y - b.y || a.x - b.x);
  for (const tile of tiles) {
    if (tile.kind === "road") roadPlacements(map, tile, placements);
    else if (tile.kind === "park") parkPlacements(map, tile, placements);
    else if (tile.kind === "plaza") {
      const c = tileCenter(map, tile.x, tile.y);
      pads.push({
        x: c.x,
        z: c.z,
        size: map.tile_size_m,
        kind: "plaza",
        chunk: chunkKey(tile.x, tile.y),
      });
    } else if (tile.kind === "building" && tile.model !== undefined) {
      const model = manifest.models.find((m) => m.id === tile.model);
      if (!model)
        throw new Error(`building tile (${tile.x},${tile.y}): unknown model "${tile.model}"`);
      const c = tileCenter(map, tile.x, tile.y);
      placements.push({
        model: tile.model,
        group: "building",
        x: c.x,
        z: c.z,
        yawDeg: tile.rot,
        scale: map.tile_size_m * buildingFitScale(model.bbox),
        chunk: chunkKey(tile.x, tile.y),
      });
    }
  }
  return { placements, pads };
}
