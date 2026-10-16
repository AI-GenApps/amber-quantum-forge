import type { RoadGraph } from "../city/graph";
import type { LaneIndex } from "../city/lane-index";

import { RoutePlanner } from "./route";
import { missionStops } from "./stops";
import type { BayDef, CarFootprint, LanePointRef, MissionDef } from "./types";

/** Weights and normalisation maxima of the difficulty scalar. They live in `content/progression.json`. */
export interface DifficultyConfig {
  weights: {
    route_ratio: number;
    intersections: number;
    traffic: number;
    parking: number;
  };
  /** Speed (m/s) that turns a time limit into the route length it allows: ratio 1.0 needs this speed all the way. */
  reference_speed_mps: number;
  max_intersections: number;
  max_traffic_agents: number;
  /** Bay margin (m) that gives a parking term of 1. */
  parking_margin_tight_m: number;
  /** Bay margin (m) that gives a parking term of 0. */
  parking_margin_loose_m: number;
}

export interface DifficultyInputs {
  routeLengthM: number;
  timeLimitS: number;
  intersections: number;
  trafficAgents: number;
  /** Bay margin in metres, or undefined for a mission without parking. */
  parkingMarginM?: number | undefined;
}

export interface RouteMetrics {
  routeLengthM: number;
  intersections: number;
}

const clamp01 = (v: number): number => Math.min(Math.max(v, 0), 1);

/** Free space around the car in the bay, per side, on the tighter of the two axes (metres). */
export function bayMarginM(bay: BayDef, car: CarFootprint): number {
  return Math.min(bay.width_m / 2 - car.halfWidth, bay.length_m / 2 - car.halfLength);
}

/** 1 at the tight margin, 0 at the loose one, linear between. */
export function parkingTightness(marginM: number, config: DifficultyConfig): number {
  const span = config.parking_margin_loose_m - config.parking_margin_tight_m;
  return clamp01((config.parking_margin_loose_m - marginM) / span);
}

/**
 * difficulty = w1 * route/time ratio + w2 * intersections + w3 * traffic + w4 * parking tightness,
 * each term normalised to 0..1 against fixed maxima. Missions without parking score 0 on the last
 * term.
 */
export function missionDifficulty(inputs: DifficultyInputs, config: DifficultyConfig): number {
  const w = config.weights;
  const ratio = inputs.routeLengthM / (inputs.timeLimitS * config.reference_speed_mps);
  const parking =
    inputs.parkingMarginM === undefined ? 0 : parkingTightness(inputs.parkingMarginM, config);
  return (
    w.route_ratio * clamp01(ratio) +
    w.intersections * clamp01(inputs.intersections / config.max_intersections) +
    w.traffic * clamp01(inputs.trafficAgents / config.max_traffic_agents) +
    w.parking * parking
  );
}

export function timeLimitOf(mission: MissionDef): number {
  return mission.params.time_limit_s;
}

function legLength(
  graph: RoadGraph,
  edgeIds: readonly string[],
  from: LanePointRef,
  to: LanePointRef,
): number {
  if (edgeIds.length === 1) return Math.max(0, to.s - from.s);
  let total = 0;
  edgeIds.forEach((id, i) => {
    const edge = graph.edges.get(id);
    if (!edge) throw new Error(`difficulty: unknown edge "${id}"`);
    if (i === 0) total += edge.length - from.s;
    else if (i === edgeIds.length - 1) total += to.s;
    else total += edge.length;
  });
  return total;
}

function isJunction(graph: RoadGraph, tileX: number, tileY: number): boolean {
  let edges = 0;
  for (const e of graph.edgeList) if (e.tileX === tileX && e.tileY === tileY) edges++;
  return edges > 2;
}

/**
 * Length and intersection count of the shortest drive that visits every stop in order, from the
 * start marker. An intersection is a pass through a tile with three or more open sides.
 */
export function missionRouteMetrics(
  graph: RoadGraph,
  laneIndex: LaneIndex,
  mission: MissionDef,
): RouteMetrics {
  const planner = new RoutePlanner(graph, laneIndex);
  const junctions = new Map<string, boolean>();
  let routeLengthM = 0;
  let intersections = 0;
  let from = mission.start.lane_point;
  for (const { label, ref } of missionStops(mission)) {
    const edgeIds = planner.planEdges(from.edgeId, from.s, ref);
    if (!edgeIds) throw new Error(`difficulty: ${mission.id} ${label} is unreachable`);
    routeLengthM += legLength(graph, edgeIds, from, ref);
    for (const id of edgeIds.slice(1, -1)) {
      const edge = graph.edges.get(id);
      if (!edge) continue;
      const key = `${edge.tileX},${edge.tileY}`;
      let junction = junctions.get(key);
      if (junction === undefined) {
        junction = isJunction(graph, edge.tileX, edge.tileY);
        junctions.set(key, junction);
      }
      if (junction) intersections++;
    }
    from = ref;
  }
  return { routeLengthM, intersections };
}
