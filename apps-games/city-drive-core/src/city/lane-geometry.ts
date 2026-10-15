import { detCos, detSin } from "../physics/math";
import type { Vec2 } from "./coords";
import { DIR_VEC, type Dir, leftOf, oppositeDir, rightOf } from "./direction";

/** Points sampled along a quarter-circle corner, endpoints included. */
export const CORNER_POINTS = 8;
/** Points sampled along the half-circle of a road-end U-turn, endpoints included. */
export const UTURN_POINTS = 9;

export type LaneKind = "straight" | "left" | "right" | "uturn";

export interface LaneShape {
  kind: LaneKind;
  points: Vec2[];
}

interface Frame {
  centre: Vec2;
  tileSize: number;
  lane: number;
}

function offset(origin: Vec2, dir: Dir, metres: number): Vec2 {
  const v = DIR_VEC[dir];
  return { x: origin.x + v.dx * metres, z: origin.z + v.dz * metres };
}

/** Lane point where traffic travelling toward `heading` crosses the edge on side `edge`. */
export function laneEdgePoint(frame: Frame, edge: Dir, heading: Dir): Vec2 {
  return offset(offset(frame.centre, edge, frame.tileSize / 2), rightOf(heading), frame.lane);
}

/** Classify a pass through a tile: enter through edge `inEdge`, leave through edge `outEdge`. */
function classifyLane(inEdge: Dir, outEdge: Dir): LaneKind {
  const heading = oppositeDir(inEdge);
  if (outEdge === heading) return "straight";
  if (outEdge === rightOf(heading)) return "right";
  if (outEdge === leftOf(heading)) return "left";
  return "uturn";
}

function rotate(v: Vec2, angle: number): Vec2 {
  const c = detCos(angle);
  const s = detSin(angle);
  return { x: v.x * c - v.z * s, z: v.x * s + v.z * c };
}

/** Arc around `centre` starting at `start`; positive sweep turns clockwise on the map. */
function arc(centre: Vec2, start: Vec2, sweep: number, count: number): Vec2[] {
  const from = { x: start.x - centre.x, z: start.z - centre.z };
  const points: Vec2[] = [];
  for (let k = 0; k < count; k++) {
    const r = rotate(from, (sweep * k) / (count - 1));
    points.push({ x: centre.x + r.x, z: centre.z + r.z });
  }
  return points;
}

/** Polyline for one lane pass through a tile (world X/Z metres). */
export function laneShape(frame: Frame, inEdge: Dir, outEdge: Dir): LaneShape {
  const kind = classifyLane(inEdge, outEdge);
  const heading = oppositeDir(inEdge);
  const start = laneEdgePoint(frame, inEdge, heading);
  const end = laneEdgePoint(frame, outEdge, outEdge);
  if (kind === "straight") return { kind, points: [start, end] };
  const half = frame.tileSize / 2;
  if (kind === "uturn") {
    const depth = frame.tileSize * 0.3;
    const lead = offset(start, heading, depth);
    const centre = offset(lead, leftOf(heading), frame.lane);
    const bend = arc(centre, lead, -Math.PI, UTURN_POINTS);
    return { kind, points: [start, ...bend, end] };
  }
  const clockwise = kind === "right";
  const radius = clockwise ? half - frame.lane : half + frame.lane;
  const centre = offset(start, clockwise ? rightOf(heading) : leftOf(heading), radius);
  const points = arc(centre, start, clockwise ? Math.PI / 2 : -Math.PI / 2, CORNER_POINTS);
  points[0] = start;
  points[points.length - 1] = end;
  return { kind, points };
}

export function polylineLength(points: readonly Vec2[]): { cum: number[]; length: number } {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Vec2;
    const b = points[i] as Vec2;
    cum.push((cum[i - 1] as number) + Math.sqrt((b.x - a.x) ** 2 + (b.z - a.z) ** 2));
  }
  return { cum, length: cum[cum.length - 1] as number };
}
