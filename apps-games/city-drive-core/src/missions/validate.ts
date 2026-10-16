import type { RoadGraph } from "../city/graph";
import type { LaneIndex } from "../city/lane-index";
import { bayReach, PARKED_CAR_HALF, resolveLanePoint } from "./bay";
import { MissionError, type MissionIssue } from "./errors";
import { RoutePlanner } from "./route";
import { missionStops } from "./stops";
import { type LanePointRef, type MissionDef, STAR_KEYS, type Tiers } from "./types";

export interface ValidationContext {
  graph: RoadGraph;
  laneIndex: LaneIndex;
}

const ID_PATTERN = /^d(\d+)-m(\d{2})$/;
/** Space kept between a bay's outer parked car and the tile edge. */
const TILE_MARGIN_M = 0.2;
/** Spacing of the checks that the lane stays straight along a bay. */
const BAY_SAMPLE_STEP_M = 2;

type Add = (issue: MissionIssue) => void;

function checkLane(graph: RoadGraph, label: string, ref: LanePointRef, add: Add): boolean {
  const edge = graph.edges.get(ref.edgeId);
  if (!edge) {
    add({
      code: "unknown-edge",
      message: `${label}: edge "${ref.edgeId}" is not in the road graph`,
    });
    return false;
  }
  if (ref.s < 0 || ref.s > edge.length) {
    add({
      code: "bad-distance",
      message: `${label}: s=${ref.s} is outside edge "${ref.edgeId}" (0..${edge.length})`,
    });
    return false;
  }
  return true;
}

function monotonic(values: readonly number[], direction: "up" | "down"): boolean {
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1] as number;
    const cur = values[i] as number;
    if (direction === "up" ? cur < prev : cur > prev) return false;
  }
  return true;
}

function tierValues<T>(tiers: Tiers<T>, pick: (t: T) => number): number[] {
  return STAR_KEYS.map((k) => pick(tiers[k]));
}

function checkTiers(mission: MissionDef, add: Add): void {
  const rewards = tierValues(mission.reward_coins, (c) => c);
  if (!monotonic(rewards, "up")) {
    add({
      code: "rewards-not-monotonic",
      message: `reward_coins must not decrease: ${rewards.join(", ")}`,
    });
  }
  const need = (name: string, values: number[], direction: "up" | "down"): void => {
    if (!monotonic(values, direction)) {
      add({
        code: "stars-not-monotonic",
        message: `stars.${name} must ${direction === "up" ? "not decrease" : "not increase"} from 1 to 3 stars: ${values.join(", ")}`,
      });
    }
  };
  const within = (name: string, values: number[], limit: number): void => {
    if (values.some((v) => v > limit)) {
      add({
        code: "stars-out-of-range",
        message: `stars.${name} must stay within the ${limit}s time limit: ${values.join(", ")}`,
      });
    }
  };
  switch (mission.type) {
    case "delivery": {
      const left = tierValues(mission.stars, (s) => s.min_time_left_s);
      need("min_time_left_s", left, "up");
      need(
        "max_damage",
        tierValues(mission.stars, (s) => s.max_damage),
        "down",
      );
      within("min_time_left_s", left, mission.params.time_limit_s);
      break;
    }
    case "taxi": {
      const left = tierValues(mission.stars, (s) => s.min_time_left_s);
      need("min_time_left_s", left, "up");
      need(
        "min_comfort",
        tierValues(mission.stars, (s) => s.min_comfort),
        "up",
      );
      within("min_time_left_s", left, mission.params.time_limit_s);
      break;
    }
    case "time_trial": {
      const times = tierValues(mission.stars, (s) => s.max_time_s);
      need("max_time_s", times, "down");
      within("max_time_s", times, mission.params.time_limit_s);
      break;
    }
    case "parking": {
      const times = tierValues(mission.stars, (s) => s.max_time_s);
      need("max_time_s", times, "down");
      need(
        "max_touches",
        tierValues(mission.stars, (s) => s.max_touches),
        "down",
      );
      within("max_time_s", times, mission.params.time_limit_s);
      break;
    }
  }
}

function checkBay(ctx: ValidationContext, mission: MissionDef, add: Add): void {
  if (mission.type !== "parking") return;
  const bay = mission.params.bay;
  const at = resolveLanePoint(ctx.graph, bay.lane_point);
  const reach = bayReach(bay);
  const tileEdges = new Map<string, number>();
  for (const e of ctx.graph.edgeList) {
    const key = `${e.tileX},${e.tileY}`;
    tileEdges.set(key, (tileEdges.get(key) ?? 0) + 1);
  }
  for (let u = -reach; u <= reach; u += BAY_SAMPLE_STEP_M) {
    const hit = ctx.laneIndex.nearest({ x: at.x + at.dirX * u, z: at.z + at.dirZ * u }, 0.5);
    const edge = hit ? ctx.graph.edges.get(hit.edgeId) : undefined;
    const plain = edge ? tileEdges.get(`${edge.tileX},${edge.tileY}`) === 2 : false;
    if (edge?.kind !== "straight" || !plain) {
      add({
        code: "bay-geometry",
        message: `bay: the lane is not a plain straight road ${u.toFixed(1)}m along the bay (the bay and its parked cars reach ${reach.toFixed(1)}m each way)`,
      });
      return;
    }
  }
  const side = bay.lateral_offset_m + Math.max(bay.width_m / 2, PARKED_CAR_HALF.x);
  if (side > ctx.graph.tileSize / 2 - TILE_MARGIN_M) {
    add({
      code: "bay-geometry",
      message: `bay: its parked cars reach ${side.toFixed(1)}m from the lane, past the road edge`,
    });
  }
}

function checkRoutes(ctx: ValidationContext, mission: MissionDef, add: Add): void {
  const planner = new RoutePlanner(ctx.graph, ctx.laneIndex);
  let from: LanePointRef = mission.start.lane_point;
  for (const { label, ref } of missionStops(mission)) {
    const start = ctx.graph.edges.get(from.edgeId);
    const goal = ctx.graph.edges.get(ref.edgeId);
    if (!start || !goal) return;
    if (!planner.planEdges(from.edgeId, from.s, ref)) {
      add({
        code: "unreachable",
        message: `${label} cannot be reached by road from the previous stop`,
      });
      return;
    }
    from = ref;
  }
}

/** Every rule a mission must satisfy against its city. Empty means valid. */
export function validateMission(mission: MissionDef, ctx: ValidationContext): MissionIssue[] {
  const issues: MissionIssue[] = [];
  const add: Add = (issue) => issues.push(issue);
  const match = ID_PATTERN.exec(mission.id);
  if (!match) {
    add({ code: "bad-id", message: `id "${mission.id}" must look like d1-m01` });
  } else if (mission.district !== `district-${Number(match[1])}`) {
    add({
      code: "bad-id",
      message: `id "${mission.id}" does not belong to district "${mission.district}"`,
    });
  }
  let lanesOk = checkLane(ctx.graph, "start.lane_point", mission.start.lane_point, add);
  for (const { label, ref } of missionStops(mission)) {
    lanesOk = checkLane(ctx.graph, label, ref, add) && lanesOk;
  }
  checkTiers(mission, add);
  if (lanesOk) {
    checkBay(ctx, mission, add);
    checkRoutes(ctx, mission, add);
  }
  return issues;
}

export function assertValidMission(mission: MissionDef, ctx: ValidationContext): void {
  const issues = validateMission(mission, ctx);
  if (issues.length > 0) throw new MissionError(mission.id, issues);
}
