import type { Vec2 } from "../city/coords";
import type { LaneEdge } from "../city/graph";

/** Anything on the road that an agent may have to stop for: another agent or the player. */
export interface Obstacle {
  /** Agent id, or -1 for the player. */
  id: number;
  x: number;
  z: number;
  /** Velocity in m/s. */
  vx: number;
  vz: number;
  halfLength: number;
  /** Centre-to-centreline distance (m) within which it is in our way. */
  reach: number;
}

export interface LeaderHit {
  id: number;
  /** Bumper-to-bumper gap, m. */
  gap: number;
  /** Obstacle speed along our direction of travel, m/s. */
  speed: number;
}

/**
 * Nearest obstacle ahead of a car, found geometrically: the car's planned path (`path[0]` at
 * distance `s`, then the following edges) is a polyline, and an obstacle is "in the way" when its
 * centre lies within `reach` of that polyline and in front of us. Works across tile borders,
 * through bends, and for obstacles that cross or merge into the path.
 */
export function findLeader(
  path: readonly LaneEdge[],
  s: number,
  halfLength: number,
  range: number,
  obstacles: readonly Obstacle[],
  selfId: number,
): LeaderHit | undefined {
  let best: LeaderHit | undefined;
  for (const o of obstacles) {
    if (o.id === selfId) continue;
    const hit = alongPath(path, s, o, halfLength + o.halfLength + range);
    if (!hit) continue;
    const gap = hit.along - halfLength - o.halfLength;
    if (gap > range || (best && gap >= best.gap)) continue;
    best = { id: o.id, gap, speed: o.vx * hit.dirX + o.vz * hit.dirZ };
  }
  return best;
}

interface AlongHit {
  along: number;
  dirX: number;
  dirZ: number;
}

function alongPath(
  path: readonly LaneEdge[],
  s: number,
  o: Obstacle,
  maxAlong: number,
): AlongHit | undefined {
  let base = -s;
  let best: AlongHit | undefined;
  for (const edge of path) {
    if (base > maxAlong) break;
    for (let i = 1; i < edge.points.length; i++) {
      const a = edge.points[i - 1] as Vec2;
      const b = edge.points[i] as Vec2;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len2 = dx * dx + dz * dz;
      if (len2 === 0) continue;
      const t = Math.min(Math.max(((o.x - a.x) * dx + (o.z - a.z) * dz) / len2, 0), 1);
      const lateral = Math.hypot(o.x - (a.x + dx * t), o.z - (a.z + dz * t));
      if (lateral > o.reach) continue;
      const len = Math.sqrt(len2);
      const along = base + (edge.cum[i - 1] as number) + t * len;
      if (along <= 0 || along > maxAlong) continue;
      if (!best || along < best.along) best = { along, dirX: dx / len, dirZ: dz / len };
    }
    base += edge.length;
  }
  return best;
}
