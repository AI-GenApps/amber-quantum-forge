import type { Vec3 } from "../physics/math";
import type { PhysicsWorld } from "../physics/world";
import { tileCenter } from "./coords";
import type { CityManifest, CityManifestModel } from "./manifest";
import { modelById } from "./manifest";
import type { CityMap } from "./types";

export type StaticBoxKind = "building" | "wall";

export interface StaticBox {
  kind: StaticBoxKind;
  center: Vec3;
  half: Vec3;
  /** Tile the box belongs to (buildings only). */
  tile?: { x: number; y: number };
}

/** Plain-data description of the static world. Cuboids only: no trimeshes. */
export interface ColliderPlan {
  /** Half side of the square ground plane. */
  groundHalfSize: number;
  boxes: StaticBox[];
}

/** Largest share of a tile a building footprint may cover; bigger models are scaled down uniformly. */
export const BUILDING_FOOTPRINT_FILL = 0.9;
export const WALL_HALF_THICKNESS = 1;
export const WALL_HALF_HEIGHT = 8;

/** Uniform scale (<= 1) that makes a model's footprint fit inside its tile. The renderer must use the same. */
export function buildingFitScale(bbox: CityManifestModel["bbox"]): number {
  const widest = Math.max(bbox.max.x - bbox.min.x, bbox.max.z - bbox.min.z);
  return widest > BUILDING_FOOTPRINT_FILL ? BUILDING_FOOTPRINT_FILL / widest : 1;
}

function buildingBox(map: CityMap, manifest: CityManifest, index: number): StaticBox | undefined {
  const tile = map.tiles[index];
  if (tile?.kind !== "building" || tile.model === undefined) return undefined;
  const model = modelById(manifest, tile.model);
  if (!model) throw new Error(`building tile (${tile.x},${tile.y}): unknown model "${tile.model}"`);
  const size = map.tile_size_m * buildingFitScale(model.bbox);
  const { min, max } = model.bbox;
  const local = { x: ((min.x + max.x) / 2) * size, z: ((min.z + max.z) / 2) * size };
  const half = {
    x: ((max.x - min.x) / 2) * size,
    y: ((max.y - min.y) / 2) * size,
    z: ((max.z - min.z) / 2) * size,
  };
  const turns = (tile.rot / 90) % 4;
  const swap = turns % 2 === 1;
  const rotated = [
    { x: local.x, z: local.z },
    { x: -local.z, z: local.x },
    { x: -local.x, z: -local.z },
    { x: local.z, z: -local.x },
  ][turns] as { x: number; z: number };
  const centre = tileCenter(map, tile.x, tile.y);
  return {
    kind: "building",
    center: { x: centre.x + rotated.x, y: ((min.y + max.y) / 2) * size, z: centre.z + rotated.z },
    half: swap ? { x: half.z, y: half.y, z: half.x } : half,
    tile: { x: tile.x, y: tile.y },
  };
}

function boundaryWalls(map: CityMap): StaticBox[] {
  const hx = (map.width * map.tile_size_m) / 2;
  const hz = (map.height * map.tile_size_m) / 2;
  const t = WALL_HALF_THICKNESS;
  const h = WALL_HALF_HEIGHT;
  return [
    { kind: "wall", center: { x: 0, y: h, z: -hz - t }, half: { x: hx + 2 * t, y: h, z: t } },
    { kind: "wall", center: { x: 0, y: h, z: hz + t }, half: { x: hx + 2 * t, y: h, z: t } },
    { kind: "wall", center: { x: hx + t, y: h, z: 0 }, half: { x: t, y: h, z: hz } },
    { kind: "wall", center: { x: -hx - t, y: h, z: 0 }, half: { x: t, y: h, z: hz } },
  ];
}

/**
 * One cuboid per building tile (its manifest bounding box scaled to the tile and turned by the
 * tile rotation), plus four invisible boundary walls. The manifest is passed in because core must
 * not depend on the app package.
 */
export function buildColliders(map: CityMap, manifest: CityManifest): ColliderPlan {
  const boxes: StaticBox[] = [];
  const ordered = map.tiles
    .map((_, i) => i)
    .sort(
      (a, b) =>
        (map.tiles[a]?.y ?? 0) - (map.tiles[b]?.y ?? 0) ||
        (map.tiles[a]?.x ?? 0) - (map.tiles[b]?.x ?? 0),
    );
  for (const i of ordered) {
    const box = buildingBox(map, manifest, i);
    if (box) boxes.push(box);
  }
  boxes.push(...boundaryWalls(map));
  const groundHalfSize =
    (Math.max(map.width, map.height) * map.tile_size_m) / 2 + 4 * WALL_HALF_THICKNESS;
  return { groundHalfSize, boxes };
}

/** Feed a plan into the task 03 physics world. Returns the Rapier collider handles by box. */
export function installColliders(world: PhysicsWorld, plan: ColliderPlan): number[] {
  world.addGround(plan.groundHalfSize);
  return plan.boxes.map((box) => world.addStaticBox(box.center, box.half).handle);
}
