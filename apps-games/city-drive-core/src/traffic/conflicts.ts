import type { Vec2 } from "../city/coords";
import type { LaneEdge, RoadGraph } from "../city/graph";
import type { LaneKind } from "../city/lane-geometry";

/** Two turns whose lane centrelines come closer than this (m) cannot share an intersection. */
export const CONFLICT_DISTANCE_M = 3.2;
const SAMPLE_STEP_M = 0.5;
/** A tile with at least this many entry sides is an intersection that needs reservations. */
const MIN_SIDES = 3;

/** Lower wins: right turns beat straights, which beat left turns, which beat U-turns. */
export function turnRank(kind: LaneKind): number {
  switch (kind) {
    case "right":
      return 0;
    case "straight":
      return 1;
    case "left":
      return 2;
    default:
      return 3;
  }
}

export interface IntersectionPlan {
  /** Edge id to the tile key (`x,y`) of the intersection it crosses. Only intersection edges. */
  tileOf: Map<string, string>;
  /** Edge id to the ids of the edges in the same tile that it cannot share the tile with. */
  conflicts: Map<string, ReadonlySet<string>>;
}

function resample(points: readonly Vec2[]): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Vec2;
    const b = points[i] as Vec2;
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / SAMPLE_STEP_M));
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
    }
  }
  out.push(points[points.length - 1] as Vec2);
  return out;
}

function minDistance(a: readonly Vec2[], b: readonly Vec2[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (const p of a) {
    for (const q of b) {
      const d = (p.x - q.x) ** 2 + (p.z - q.z) ** 2;
      if (d < best) best = d;
    }
  }
  return Math.sqrt(best);
}

/** Whether two passes through the same intersection tile would put cars in each other's way. */
export function edgesConflict(a: LaneEdge, b: LaneEdge, sa?: Vec2[], sb?: Vec2[]): boolean {
  if (a.id === b.id) return false;
  if (a.from === b.from) return false;
  if (a.to === b.to) return true;
  return minDistance(sa ?? resample(a.points), sb ?? resample(b.points)) < CONFLICT_DISTANCE_M;
}

export function buildIntersectionPlan(graph: RoadGraph): IntersectionPlan {
  const byTile = new Map<string, LaneEdge[]>();
  for (const edge of graph.edgeList) {
    const key = `${edge.tileX},${edge.tileY}`;
    const list = byTile.get(key);
    if (list) list.push(edge);
    else byTile.set(key, [edge]);
  }
  const tileOf = new Map<string, string>();
  const conflicts = new Map<string, ReadonlySet<string>>();
  for (const [key, edges] of byTile) {
    if (new Set(edges.map((e) => e.inDir)).size < MIN_SIDES) continue;
    const samples = edges.map((e) => resample(e.points));
    edges.forEach((edge, i) => {
      tileOf.set(edge.id, key);
      const set = new Set<string>();
      edges.forEach((other, j) => {
        if (edgesConflict(edge, other, samples[i], samples[j])) set.add(other.id);
      });
      conflicts.set(edge.id, set);
    });
  }
  return { tileOf, conflicts };
}
