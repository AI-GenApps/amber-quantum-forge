import type { LaneEdge, RoadGraph } from "../city/graph";
import { pointOnEdge } from "../city/lane-index";
import {
  SPAWN_ATTEMPTS,
  SPAWN_CLEARANCE_M,
  SPAWN_MAX_M,
  SPAWN_MIN_M,
  VIEW_HALF_COS,
} from "./constants";
import type { Obstacle } from "./leader";
import { inView, type TrafficPlayer } from "./player";
import type { ReservationTable } from "./reservations";
import type { Rng } from "./rng";

export interface SpawnSpot {
  edge: LaneEdge;
  s: number;
  x: number;
  z: number;
}

/** Straight lane passes outside intersections: the places a car can appear without a reservation. */
export function spawnEdges(graph: RoadGraph, table: ReservationTable): LaneEdge[] {
  return graph.edgeList.filter((e) => e.kind === "straight" && !table.isIntersectionEdge(e.id));
}

/**
 * A lane spot 60 to 150 m from the player and outside the view cone with clear road around it,
 * or undefined after SPAWN_ATTEMPTS tries. Uses only the manager's seeded stream.
 */
export function pickSpawnSpot(
  edges: readonly LaneEdge[],
  player: TrafficPlayer,
  obstacles: readonly Obstacle[],
  rng: Rng,
): SpawnSpot | undefined {
  for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt++) {
    const edge = rng.pick(edges);
    const s = edge.length * rng.range(0.25, 0.5);
    const p = pointOnEdge(edge, s);
    const dist = Math.hypot(p.x - player.x, p.z - player.z);
    if (dist < SPAWN_MIN_M || dist > SPAWN_MAX_M) continue;
    if (inView(player, p.x, p.z, VIEW_HALF_COS)) continue;
    if (obstacles.some((o) => Math.hypot(o.x - p.x, o.z - p.z) < SPAWN_CLEARANCE_M)) continue;
    return { edge, s, x: p.x, z: p.z };
  }
  return undefined;
}
