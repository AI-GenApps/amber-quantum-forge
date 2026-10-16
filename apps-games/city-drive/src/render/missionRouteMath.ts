export interface Point2 {
  x: number;
  z: number;
}

export interface ArrowPlacement {
  x: number;
  z: number;
  /** Unit direction of the route at the arrow. */
  dx: number;
  dz: number;
}

/** Arrow spacing along the route in metres. */
export const ARROW_SPACING_M = 4;
/** Most arrows drawn, which caps the ribbon at ARROW_SPACING_M * MAX_ARROWS metres ahead of the car. */
export const MAX_ARROWS = 40;
/** No arrow is drawn closer than this to the car, so none sit under it. */
export const ARROW_MIN_AHEAD_M = 3;

function lengthOf(points: readonly Point2[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point2;
    const b = points[i] as Point2;
    total += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return total;
}

/** Position and direction at arc length `s` along a polyline, clamped to its ends. */
export function sampleRoute(points: readonly Point2[], s: number): ArrowPlacement | undefined {
  if (points.length < 2) return undefined;
  let left = Math.max(0, s);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point2;
    const b = points[i] as Point2;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len === 0) continue;
    if (left <= len || i === points.length - 1) {
      const t = Math.min(left / len, 1);
      return {
        x: a.x + (b.x - a.x) * t,
        z: a.z + (b.z - a.z) * t,
        dx: (b.x - a.x) / len,
        dz: (b.z - a.z) / len,
      };
    }
    left -= len;
  }
  return undefined;
}

/**
 * Arrows along a route, anchored a whole number of spacings back from its end rather than at the
 * car. The route is replanned from the moving car, but its end stays put, so the arrows hold
 * still in the world while the car drives over them.
 */
export function routeArrows(
  points: readonly Point2[],
  spacing = ARROW_SPACING_M,
  maxArrows = MAX_ARROWS,
): ArrowPlacement[] {
  const total = lengthOf(points);
  const out: ArrowPlacement[] = [];
  let s = total % spacing;
  while (s < ARROW_MIN_AHEAD_M) s += spacing;
  for (; s < total && out.length < maxArrows; s += spacing) {
    const at = sampleRoute(points, s);
    if (at) out.push(at);
  }
  return out;
}
