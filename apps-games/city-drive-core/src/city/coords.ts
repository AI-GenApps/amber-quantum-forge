import type { Pose, Vec3 } from "../physics/math";
import { quatFromYaw } from "../physics/math";
import { DIR_VEC, type Dir, headingToDir, rightOf } from "./direction";
import type { CityMap, CityTile } from "./types";

/** Lane centre distance from the road centreline, as a fraction of the tile size. */
export const LANE_OFFSET_FRACTION = 0.15;

export interface Vec2 {
  x: number;
  z: number;
}

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function indexTiles(map: CityMap): Map<string, CityTile> {
  const index = new Map<string, CityTile>();
  for (const tile of map.tiles) index.set(tileKey(tile.x, tile.y), tile);
  return index;
}

export function laneOffset(map: Pick<CityMap, "tile_size_m">): number {
  return map.tile_size_m * LANE_OFFSET_FRACTION;
}

/** World position (metres, map centred on the origin) of a tile centre. Works outside the map. */
export function tileCenter(map: CityMap, x: number, y: number): Vec2 {
  const size = map.tile_size_m;
  return { x: (x + 0.5 - map.width / 2) * size, z: (y + 0.5 - map.height / 2) * size };
}

export function mapHalfExtents(map: CityMap): Vec2 {
  return { x: (map.width * map.tile_size_m) / 2, z: (map.height * map.tile_size_m) / 2 };
}

/** Which tile a world position is over (may lie outside the map). */
export function tileAt(map: CityMap, position: Vec2): { x: number; y: number } {
  const size = map.tile_size_m;
  return {
    x: Math.floor(position.x / size + map.width / 2),
    y: Math.floor(position.z / size + map.height / 2),
  };
}

export interface SpawnPose extends Pose {
  position: Vec3;
  /** Rotation about +Y that turns the car's local +Z onto the heading. */
  yaw: number;
  heading: Dir;
}

/** Spawn pose: the right-hand lane of the spawn tile, facing the spawn heading. */
export function spawnPose(map: CityMap, height = 1): SpawnPose {
  const heading = headingToDir(map.spawn.heading);
  if (heading === undefined) {
    throw new Error(`spawn heading ${map.spawn.heading} is not a multiple of 90`);
  }
  const centre = tileCenter(map, map.spawn.x, map.spawn.y);
  const side = DIR_VEC[rightOf(heading)];
  const offset = laneOffset(map);
  const yaw = Math.PI - (map.spawn.heading * Math.PI) / 180;
  return {
    position: { x: centre.x + side.dx * offset, y: height, z: centre.z + side.dz * offset },
    rotation: quatFromYaw(yaw),
    yaw,
    heading,
  };
}
