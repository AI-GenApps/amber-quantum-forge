import type { Vec2 } from "./coords";
import type { LaneEdge, RoadGraph } from "./graph";

export interface LanePoint {
  edgeId: string;
  /** Distance along the edge from its start, in metres. */
  s: number;
  x: number;
  z: number;
  /** Distance from the query position to this point. */
  distance: number;
}

/** Position at distance `s` (clamped) along a lane edge, plus the unit travel direction. */
export function pointOnEdge(edge: LaneEdge, s: number): Vec2 & { dirX: number; dirZ: number } {
  const clamped = Math.min(Math.max(s, 0), edge.length);
  let i = 1;
  while (i < edge.cum.length - 1 && (edge.cum[i] as number) < clamped) i++;
  const a = edge.points[i - 1] as Vec2;
  const b = edge.points[i] as Vec2;
  const span = (edge.cum[i] as number) - (edge.cum[i - 1] as number);
  const t = span > 0 ? (clamped - (edge.cum[i - 1] as number)) / span : 0;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  return { x: a.x + dx * t, z: a.z + dz * t, dirX: dx / len, dirZ: dz / len };
}

const KEY_BIAS = 1 << 15;

/** Uniform-grid index over every lane segment. */
export class LaneIndex {
  private readonly cells = new Map<number, number[]>();
  private readonly seg: { edgeId: string; s0: number; a: Vec2; b: Vec2 }[] = [];
  private readonly minCell = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
  private readonly maxCell = { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY };

  constructor(
    graph: RoadGraph,
    readonly cellSize = 10,
  ) {
    for (const edge of graph.edgeList) {
      for (let i = 1; i < edge.points.length; i++) {
        this.insert(edge, i);
      }
    }
  }

  private key(cx: number, cy: number): number {
    return (cx + KEY_BIAS) * 65536 + (cy + KEY_BIAS);
  }

  private insert(edge: LaneEdge, i: number): void {
    const a = edge.points[i - 1] as Vec2;
    const b = edge.points[i] as Vec2;
    const id = this.seg.length;
    this.seg.push({ edgeId: edge.id, s0: edge.cum[i - 1] as number, a, b });
    const x0 = Math.floor(Math.min(a.x, b.x) / this.cellSize);
    const x1 = Math.floor(Math.max(a.x, b.x) / this.cellSize);
    const y0 = Math.floor(Math.min(a.z, b.z) / this.cellSize);
    const y1 = Math.floor(Math.max(a.z, b.z) / this.cellSize);
    this.minCell.x = Math.min(this.minCell.x, x0);
    this.minCell.y = Math.min(this.minCell.y, y0);
    this.maxCell.x = Math.max(this.maxCell.x, x1);
    this.maxCell.y = Math.max(this.maxCell.y, y1);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const k = this.key(cx, cy);
        const list = this.cells.get(k);
        if (list) list.push(id);
        else this.cells.set(k, [id]);
      }
    }
  }

  private project(id: number, p: Vec2): LanePoint {
    const { edgeId, s0, a, b } = this.seg[id] as (typeof this.seg)[number];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len2 = dx * dx + dz * dz;
    const t = len2 > 0 ? Math.min(Math.max(((p.x - a.x) * dx + (p.z - a.z) * dz) / len2, 0), 1) : 0;
    const x = a.x + dx * t;
    const z = a.z + dz * t;
    return {
      edgeId,
      s: s0 + Math.sqrt(len2) * t,
      x,
      z,
      distance: Math.sqrt((p.x - x) ** 2 + (p.z - z) ** 2),
    };
  }

  /** Closest point on any lane, or undefined when none lies within `maxDistance`. */
  nearest(pos: Vec2, maxDistance = Number.POSITIVE_INFINITY): LanePoint | undefined {
    if (this.seg.length === 0) return undefined;
    const cx = Math.floor(pos.x / this.cellSize);
    const cy = Math.floor(pos.z / this.cellSize);
    const reachRings = Math.max(
      Math.abs(cx - this.minCell.x),
      Math.abs(cx - this.maxCell.x),
      Math.abs(cy - this.minCell.y),
      Math.abs(cy - this.maxCell.y),
    );
    let best: LanePoint | undefined;
    for (let ring = 0; ring <= reachRings; ring++) {
      if (best && (ring - 1) * this.cellSize > best.distance) break;
      if (!best && (ring - 1) * this.cellSize > maxDistance) break;
      for (let gx = cx - ring; gx <= cx + ring; gx++) {
        for (let gy = cy - ring; gy <= cy + ring; gy++) {
          if (Math.max(Math.abs(gx - cx), Math.abs(gy - cy)) !== ring) continue;
          for (const id of this.cells.get(this.key(gx, gy)) ?? []) {
            const hit = this.project(id, pos);
            const better =
              !best ||
              hit.distance < best.distance ||
              (hit.distance === best.distance && hit.edgeId < best.edgeId);
            if (better) best = hit;
          }
        }
      }
    }
    return best && best.distance <= maxDistance ? best : undefined;
  }
}

export function nearestLanePoint(
  index: LaneIndex,
  pos: Vec2,
  maxDistance?: number,
): LanePoint | undefined {
  return index.nearest(pos, maxDistance);
}
