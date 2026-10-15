import type { Vec3 } from "../physics/math";
import type { StaticBox } from "./colliders";

export interface RayHit {
  /** Distance along the ray (in units of the direction's length). */
  distance: number;
  box: StaticBox;
}

/** Slab test of a ray against one axis-aligned box. Returns the entry distance, or undefined. */
function intersectBox(origin: Vec3, dir: Vec3, box: StaticBox, maxDistance: number) {
  let tMin = 0;
  let tMax = maxDistance;
  const axes = ["x", "y", "z"] as const;
  for (const a of axes) {
    const lo = box.center[a] - box.half[a];
    const hi = box.center[a] + box.half[a];
    const d = dir[a];
    if (Math.abs(d) < 1e-12) {
      if (origin[a] < lo || origin[a] > hi) return undefined;
      continue;
    }
    let t0 = (lo - origin[a]) / d;
    let t1 = (hi - origin[a]) / d;
    if (t0 > t1) [t0, t1] = [t1, t0];
    tMin = Math.max(tMin, t0);
    tMax = Math.min(tMax, t1);
    if (tMin > tMax) return undefined;
  }
  return tMin;
}

/**
 * Nearest hit of a ray against the static boxes of a ColliderPlan (buildings and boundary walls),
 * or undefined when nothing lies within `maxDistance`. `dir` must be a unit vector. The chase
 * camera uses it to pull in when a building stands between the car and the camera.
 */
export function raycastBoxes(
  boxes: readonly StaticBox[],
  origin: Vec3,
  dir: Vec3,
  maxDistance: number,
): RayHit | undefined {
  let best: RayHit | undefined;
  for (const box of boxes) {
    const distance = intersectBox(origin, dir, box, best ? best.distance : maxDistance);
    if (distance !== undefined && (!best || distance < best.distance)) best = { distance, box };
  }
  return best;
}
