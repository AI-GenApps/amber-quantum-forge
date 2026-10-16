import type { CarState, CityMap, RoadGraph } from "../../src/index";
import { rotateVec, tileCenter } from "../../src/index";

interface Pt {
  x: number;
  z: number;
}

/** Another vehicle the driver can see: position and speed along its own heading. */
export interface Other {
  x: number;
  z: number;
  speed: number;
}

/** A junction tile's ground rectangle. */
export interface JunctionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Other cars within this lateral distance (m) of the route are in its lane. */
const LANE_HALF_WIDTH_M = 2.2;
/** Cars further behind than this (m) are no concern. */
const BEHIND_M = 2;
/** How far along the route (m) the driver looks. */
const HORIZON_M = 45;
const SAMPLE_M = 1;
/** Bumper-to-bumper gap (m) kept behind a car. */
const FOLLOW_GAP_M = 5;
const BRAKE = 2.5;
const CAR_LENGTH_M = 4.2;
/** The driver stops this far (m) short of a busy junction. */
const STOP_SHORT_M = 4;
/** A moving car within this distance (m) plus a few seconds of its travel is about to use a junction. */
const APPROACH_M = 10;
const APPROACH_S = 3;
const MOVING_MS = 0.5;

/** Junction tiles (three or more open sides) of a district as ground rectangles. */
export function junctionBoxes(map: CityMap, graph: RoadGraph): JunctionBox[] {
  const counts = new Map<string, { x: number; y: number; n: number }>();
  for (const e of graph.edgeList) {
    const key = `${e.tileX},${e.tileY}`;
    const entry = counts.get(key) ?? { x: e.tileX, y: e.tileY, n: 0 };
    entry.n++;
    counts.set(key, entry);
  }
  const half = map.tile_size_m / 2;
  return [...counts.values()]
    .filter((c) => c.n > 2)
    .map((c) => {
      const centre = tileCenter(map, c.x, c.y);
      return {
        minX: centre.x - half,
        maxX: centre.x + half,
        minZ: centre.z - half,
        maxZ: centre.z + half,
      };
    });
}

function distanceToBox(box: JunctionBox, x: number, z: number): number {
  const dx = Math.max(box.minX - x, 0, x - box.maxX);
  const dz = Math.max(box.minZ - z, 0, z - box.maxZ);
  return Math.hypot(dx, dz);
}

function pointAt(points: readonly Pt[], s: number): Pt {
  let left = s;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Pt;
    const b = points[i] as Pt;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (left <= len && len > 0) {
      return { x: a.x + ((b.x - a.x) * left) / len, z: a.z + ((b.z - a.z) * left) / len };
    }
    left -= len;
  }
  return points[points.length - 1] as Pt;
}

/** Distance from `p` to the route polyline and how far along it the nearest point is. */
function onRoute(points: readonly Pt[], p: Pt): { lateral: number; along: number } {
  let best = { lateral: Number.POSITIVE_INFINITY, along: 0 };
  let along = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Pt;
    const b = points[i] as Pt;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len === 0) continue;
    const raw = ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / (len * len);
    const t = Math.min(Math.max(raw, 0), 1);
    const lateral = Math.hypot(p.x - (a.x + (b.x - a.x) * t), p.z - (a.z + (b.z - a.z) * t));
    if (lateral < best.lateral) best = { lateral, along: along + len * t };
    along += len;
  }
  return best;
}

/**
 * Test-only road sense for the autopilot. It keeps a safe gap behind a car in its lane and does not
 * enter a junction while another car is in it or about to use it, the way a careful driver would.
 */
export class TrafficWatch {
  constructor(private readonly boxes: readonly JunctionBox[]) {}

  /** Fastest safe speed (m/s) now, or Infinity when the road is clear. */
  limit(state: CarState, route: readonly Pt[], others: readonly Other[]): number {
    const f = rotateVec(state.rotation, { x: 0, y: 0, z: 1 });
    const len = Math.hypot(f.x, f.z) || 1;
    const seen = others
      .filter(
        (o) => ((o.x - state.position.x) * f.x + (o.z - state.position.z) * f.z) / len >= -BEHIND_M,
      )
      .map((o) => ({ o, ...onRoute(route, o) }));
    let limit = Number.POSITIVE_INFINITY;
    for (const { o, lateral, along } of seen) {
      if (lateral >= LANE_HALF_WIDTH_M || along > HORIZON_M) continue;
      const gap = along - CAR_LENGTH_M - FOLLOW_GAP_M;
      const safe = o.speed + Math.sqrt(2 * BRAKE * Math.max(gap, 0));
      limit = Math.min(limit, gap <= 0 ? o.speed * 0.5 : safe);
    }
    return Math.min(limit, this.junctionLimit(state, route, seen));
  }

  private junctionLimit(
    state: CarState,
    route: readonly Pt[],
    seen: readonly { o: Other; lateral: number }[],
  ): number {
    const here = { x: state.position.x, z: state.position.z };
    if (this.boxes.some((b) => distanceToBox(b, here.x, here.z) === 0))
      return Number.POSITIVE_INFINITY;
    for (let d = SAMPLE_M; d <= HORIZON_M; d += SAMPLE_M) {
      const p = pointAt(route, d);
      const box = this.boxes.find((b) => distanceToBox(b, p.x, p.z) === 0);
      if (!box) continue;
      const busy = seen.some(({ o, lateral }) => {
        if (lateral < LANE_HALF_WIDTH_M) return false;
        const dist = distanceToBox(box, o.x, o.z);
        return dist === 0 || (o.speed > MOVING_MS && dist < APPROACH_M + o.speed * APPROACH_S);
      });
      return busy ? Math.sqrt(2 * BRAKE * Math.max(d - STOP_SHORT_M, 0)) : Number.POSITIVE_INFINITY;
    }
    return Number.POSITIVE_INFINITY;
  }
}
