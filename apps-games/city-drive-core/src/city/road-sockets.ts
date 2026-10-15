import { DIRS, type Dir, rotateDir } from "./direction";
import type { CityTile } from "./types";

/**
 * Open edges of each road model at rot 0, keyed by manifest id.
 * Straight and crossing run north-south, a corner joins north and east, a T has its stem to the
 * south, and a road-end is open to the south with its cap to the north.
 */
export const ROAD_SOCKETS: Readonly<Record<string, readonly Dir[]>> = {
  "road-straight": ["N", "S"],
  "road-crossing": ["N", "S"],
  "road-corner": ["N", "E"],
  "road-t": ["E", "S", "W"],
  "road-crossroads": ["N", "E", "S", "W"],
  "road-end": ["S"],
};

/**
 * Extra clockwise yaw (degrees) the renderer adds on top of the tile `rot` when it places each GLB,
 * so the model's artwork lines up with the sockets above. Derived headlessly from the asphalt
 * geometry of each GLB as Babylon's glTF loader places it in a right-handed scene (task 08a; task 06
 * derived the first set against the mirrored left-handed scene), and checked by
 * `city-drive/test/render/road-alignment.test.ts`. The simulation never reads it.
 */
export const ROAD_MODEL_YAW_OFFSET: Readonly<Record<string, number>> = {
  "road-straight": 90,
  "road-crossing": 90,
  "road-corner": 180,
  "road-end": 90,
};

export function hasRoadSockets(model: string): boolean {
  return Object.hasOwn(ROAD_SOCKETS, model);
}

/** Open edges of a road tile after applying its rotation, in N/E/S/W order. */
export function tileSockets(tile: Pick<CityTile, "kind" | "model" | "rot">): Dir[] {
  if (tile.kind !== "road" || tile.model === undefined || !hasRoadSockets(tile.model)) return [];
  const base = ROAD_SOCKETS[tile.model] ?? [];
  const open = new Set(base.map((d) => rotateDir(d, tile.rot)));
  return DIRS.filter((d) => open.has(d));
}
