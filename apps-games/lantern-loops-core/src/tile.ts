export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export type Dir = 1 | 2 | 4 | 8;

export const DIRS: readonly Dir[] = [N, E, S, W];

export const STRAIGHT_MASKS: readonly number[] = [10, 5];
export const CORNER_MASKS: readonly number[] = [3, 6, 12, 9];
export const TILE_MASKS: readonly number[] = [10, 5, 3, 6, 12, 9];

export const STRAIGHT_CYCLE: readonly number[] = [0, 10, 5];
export const CORNER_CYCLE: readonly number[] = [0, 3, 6, 12, 9];

export const MIRROR_CORNERS = {
  "/": [9, 6],
  "\\": [12, 3],
} as const;

export type MirrorShape = keyof typeof MIRROR_CORNERS;

export function isStraight(mask: number): boolean {
  return mask === 10 || mask === 5;
}

export function isCorner(mask: number): boolean {
  return mask === 3 || mask === 6 || mask === 12 || mask === 9;
}

/** True for the six path tiles (never for the empty value 0). */
export function isTileMask(mask: number): boolean {
  return isStraight(mask) || isCorner(mask);
}

/** True for a value a cell may hold: 0 (empty) or one of the six tiles. */
export function isLegalTile(mask: number): boolean {
  return mask === 0 || isTileMask(mask);
}

export function openings(mask: number): Dir[] {
  const out: Dir[] = [];
  for (const dir of DIRS) {
    if ((mask & dir) !== 0) out.push(dir);
  }
  return out;
}

export function hasOpening(mask: number, dir: Dir): boolean {
  return (mask & dir) !== 0;
}

export function opposite(dir: Dir): Dir {
  switch (dir) {
    case N:
      return S;
    case S:
      return N;
    case E:
      return W;
    default:
      return E;
  }
}

/** Row delta of a step in direction dir. */
export function dirRow(dir: Dir): number {
  if (dir === N) return -1;
  if (dir === S) return 1;
  return 0;
}

/** Column delta of a step in direction dir. */
export function dirCol(dir: Dir): number {
  if (dir === E) return 1;
  if (dir === W) return -1;
  return 0;
}

/** Quarter turns clockwise: N to E to S to W. Works for any 4-bit mask. */
export function rotateMask(mask: number, quarterTurns = 1): number {
  const turns = ((quarterTurns % 4) + 4) % 4;
  let out = mask & 15;
  for (let k = 0; k < turns; k++) out = ((out << 1) | (out >> 3)) & 15;
  return out;
}

/** Next corner clockwise (NE to ES to SW to WN); a non-corner is returned unchanged. */
export function rotateCorner(mask: number): number {
  return isCorner(mask) ? rotateMask(mask, 1) : mask;
}

/** The mask after `mask` in a tap cycle; a mask outside the cycle yields undefined. */
export function nextInCycle(cycle: readonly number[], mask: number): number | undefined {
  const at = cycle.indexOf(mask);
  if (at < 0) return undefined;
  return cycle[(at + 1) % cycle.length];
}

export function bitCount(mask: number): number {
  let count = 0;
  for (let v = mask; v !== 0; v &= v - 1) count++;
  return count;
}
