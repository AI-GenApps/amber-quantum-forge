/**
 * Map conventions shared by every city module.
 *
 * Tile (x, y): x grows east, y grows south. World metres: +X is east, +Z is south, and the map is
 * centred on the origin. Compass headings are degrees clockwise from north (0 N, 90 E, 180 S,
 * 270 W). A tile `rot` turns the tile clockwise by that many degrees.
 */

export type Dir = "N" | "E" | "S" | "W";
export type TileRotation = 0 | 90 | 180 | 270;

export const DIRS: readonly Dir[] = ["N", "E", "S", "W"];

export const DIR_VEC: Readonly<Record<Dir, { readonly dx: number; readonly dz: number }>> = {
  N: { dx: 0, dz: -1 },
  E: { dx: 1, dz: 0 },
  S: { dx: 0, dz: 1 },
  W: { dx: -1, dz: 0 },
};

function dirAt(index: number): Dir {
  return DIRS[((index % 4) + 4) % 4] as Dir;
}

/** Turn a direction clockwise by `rot` degrees (a multiple of 90). */
export function rotateDir(dir: Dir, rot: number): Dir {
  return dirAt(DIRS.indexOf(dir) + rot / 90);
}

export function oppositeDir(dir: Dir): Dir {
  return rotateDir(dir, 180);
}

/** The side on the right of a traveller heading `dir`. */
export function rightOf(dir: Dir): Dir {
  return rotateDir(dir, 90);
}

export function leftOf(dir: Dir): Dir {
  return rotateDir(dir, 270);
}

export function isRotation(value: unknown): value is TileRotation {
  return value === 0 || value === 90 || value === 180 || value === 270;
}

/** Compass heading in degrees to a direction, or undefined when not a multiple of 90. */
export function headingToDir(heading: number): Dir | undefined {
  if (!Number.isInteger(heading) || heading % 90 !== 0) return undefined;
  return dirAt(heading / 90);
}
