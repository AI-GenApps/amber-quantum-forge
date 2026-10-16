import { findRoute } from "../city/astar";
import type { Vec2 } from "../city/coords";
import type { LaneEdge, RoadGraph } from "../city/graph";
import { type LaneIndex, pointOnEdge } from "../city/lane-index";
import type { LanePointRef } from "./types";

/** The path to the current objective: lane edges from the car to the target lane point. */
export interface MissionRoute {
  target: LanePointRef;
  /** Edges from the one the car is on to the target edge, inclusive. */
  edgeIds: string[];
  /** Index in `edgeIds` of the edge the car is on. */
  cursor: number;
  /** Ground polyline from the car's lane position to the target, in metres. */
  points: Vec2[];
  /** Length of `points` in metres. */
  length: number;
}

/** How far the car may be from the planned lane, beyond its nearest lane, before we replan. */
const KEEP_SLACK_M = 1.5;
/** Edges ahead of the cursor that count as "still on the route". */
const LOOKAHEAD_EDGES = 2;
const MIN_POINT_GAP_M = 0.05;

/** Closest point on an edge's polyline to (x, z): distance along the edge and distance away. */
export function projectOnEdge(
  edge: LaneEdge,
  x: number,
  z: number,
): { s: number; distance: number } {
  let best = { s: 0, distance: Number.POSITIVE_INFINITY };
  for (let i = 1; i < edge.points.length; i++) {
    const a = edge.points[i - 1] as Vec2;
    const b = edge.points[i] as Vec2;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz;
    const t = len2 > 0 ? Math.min(Math.max(((x - a.x) * dx + (z - a.z) * dz) / len2, 0), 1) : 0;
    const distance = Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
    if (distance < best.distance) {
      best = { s: (edge.cum[i - 1] as number) + Math.sqrt(len2) * t, distance };
    }
  }
  return best;
}

/** The edge's polyline between distances `from` and `to` along it (to >= from). */
function sliceEdge(edge: LaneEdge, from: number, to: number): Vec2[] {
  const a = pointOnEdge(edge, from);
  const b = pointOnEdge(edge, to);
  const out: Vec2[] = [{ x: a.x, z: a.z }];
  for (let i = 1; i < edge.points.length - 1; i++) {
    const c = edge.cum[i] as number;
    if (c > from && c < to) out.push(edge.points[i] as Vec2);
  }
  out.push({ x: b.x, z: b.z });
  return out;
}

function polyline(
  graph: RoadGraph,
  edgeIds: string[],
  cursor: number,
  s0: number,
  target: LanePointRef,
) {
  const points: Vec2[] = [];
  const push = (p: Vec2): void => {
    const last = points[points.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.z - last.z) > MIN_POINT_GAP_M) points.push(p);
  };
  for (let i = cursor; i < edgeIds.length; i++) {
    const edge = graph.edges.get(edgeIds[i] as string) as LaneEdge;
    const from = i === cursor ? s0 : 0;
    const to = i === edgeIds.length - 1 ? Math.max(from, target.s) : edge.length;
    for (const p of sliceEdge(edge, from, to)) push(p);
  }
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(
      (points[i] as Vec2).x - (points[i - 1] as Vec2).x,
      (points[i] as Vec2).z - (points[i - 1] as Vec2).z,
    );
  }
  return { points, length };
}

/** Plans A* routes over the lane graph and keeps them up to date as the car drives. */
export class RoutePlanner {
  constructor(
    private readonly graph: RoadGraph,
    private readonly index: LaneIndex,
  ) {}

  /** Edge ids from `startEdgeId` to the target lane point's edge, or undefined when unreachable. */
  planEdges(startEdgeId: string, startS: number, target: LanePointRef): string[] | undefined {
    const start = this.graph.edges.get(startEdgeId);
    const goal = this.graph.edges.get(target.edgeId);
    if (!start || !goal)
      throw new Error(`route: unknown edge "${start ? target.edgeId : startEdgeId}"`);
    if (start.id === goal.id && target.s >= startS) return [start.id];
    const path = findRoute(this.graph, start.to, goal.from);
    if (!path) return undefined;
    return [start.id, ...path.edgeIds, goal.id];
  }

  /**
   * Route from a car at `from` to `target`. Pass the previous route to keep following it while the
   * car stays on it, so a car crossing a junction does not flip between look-alike lanes.
   */
  plan(from: Vec2, target: LanePointRef, previous?: MissionRoute): MissionRoute | undefined {
    const nearest = this.index.nearest(from);
    if (!nearest) return undefined;
    const kept = previous ? this.follow(previous, target, from, nearest.distance) : undefined;
    if (kept) return kept;
    const edgeIds = this.planEdges(nearest.edgeId, nearest.s, target);
    if (!edgeIds) return undefined;
    return { target, edgeIds, cursor: 0, ...polyline(this.graph, edgeIds, 0, nearest.s, target) };
  }

  private follow(
    previous: MissionRoute,
    target: LanePointRef,
    from: Vec2,
    nearestDistance: number,
  ): MissionRoute | undefined {
    if (previous.target.edgeId !== target.edgeId || previous.target.s !== target.s)
      return undefined;
    let best: { index: number; s: number; distance: number } | undefined;
    const last = Math.min(previous.edgeIds.length - 1, previous.cursor + LOOKAHEAD_EDGES);
    for (let i = previous.cursor; i <= last; i++) {
      const edge = this.graph.edges.get(previous.edgeIds[i] as string) as LaneEdge;
      const hit = projectOnEdge(edge, from.x, from.z);
      if (!best || hit.distance <= best.distance) best = { index: i, ...hit };
    }
    if (!best || best.distance > nearestDistance + KEEP_SLACK_M) return undefined;
    return {
      target,
      edgeIds: previous.edgeIds,
      cursor: best.index,
      ...polyline(this.graph, previous.edgeIds, best.index, best.s, target),
    };
  }
}
