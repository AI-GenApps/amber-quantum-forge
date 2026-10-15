import type { LaneKind } from "../city/lane-geometry";
import type { AgentBlocker, TrafficAgent } from "./agent";
import {
  AGENT_HALF_LENGTH_M,
  LOOKAHEAD_M,
  PLAN_BRAKE_MS2,
  STOP_LINE_BIAS_M,
  TURN_SPEED_MS,
} from "./constants";
import { brakingSpeedLimit, type IdmParams, idmAcceleration } from "./idm";
import { findLeader, type Obstacle } from "./leader";
import type { ReservationTable } from "./reservations";

/** Look this far ahead for a stop line to brake for, m. */
const STOP_LINE_SIGHT_M = 60;
/** Look this far ahead along the plan for bends to slow for, m. */
const BEND_SIGHT_M = 60;

export interface DriveResult {
  accel: number;
  blocker: AgentBlocker;
  leaderGap: number;
  leaderId: number | undefined;
}

function bendLimit(kind: LaneKind): number {
  switch (kind) {
    case "right":
      return TURN_SPEED_MS.right;
    case "left":
      return TURN_SPEED_MS.left;
    case "uturn":
      return TURN_SPEED_MS.uturn;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

/** Cruise speed, lowered on a bend and ahead of one so the car arrives at the bend speed. */
function desiredSpeed(agent: TrafficAgent): number {
  const current = agent.path[0];
  if (!current) return agent.cruise;
  let wanted = Math.min(agent.cruise, bendLimit(current.kind));
  let distance = current.length - agent.s;
  for (let i = 1; i < agent.path.length && distance < BEND_SIGHT_M; i++) {
    const edge = agent.path[i];
    if (!edge) break;
    const limit = bendLimit(edge.kind);
    if (Number.isFinite(limit)) {
      wanted = Math.min(wanted, brakingSpeedLimit(limit, distance, PLAN_BRAKE_MS2));
    }
    distance += edge.length;
  }
  return wanted;
}

/** Distance from the nose to the end of the current edge, m. */
export function noseToLine(agent: TrafficAgent): number {
  const current = agent.path[0];
  return (current ? current.length : 0) - agent.s - AGENT_HALF_LENGTH_M;
}

/** The next edge, when it is an intersection pass this agent has not reserved. */
export function unreservedTurn(agent: TrafficAgent, table: ReservationTable) {
  const next = agent.path[1];
  if (!next || !table.isIntersectionEdge(next.id) || table.holds(agent.id, next.id)) {
    return undefined;
  }
  return next;
}

/** IDM acceleration against the nearest of: the car or player ahead, and an unreserved stop line. */
export function drive(
  agent: TrafficAgent,
  table: ReservationTable,
  obstacles: readonly Obstacle[],
  idm: IdmParams,
): DriveResult {
  const wanted = desiredSpeed(agent);
  const free = idmAcceleration(idm, agent.speed, wanted);
  let accel = free;
  let blocker: AgentBlocker = "none";
  const leader = findLeader(
    agent.path,
    agent.s,
    AGENT_HALF_LENGTH_M,
    LOOKAHEAD_M,
    obstacles,
    agent.id,
  );
  if (leader) {
    const a = idmAcceleration(idm, agent.speed, wanted, leader);
    if (a < accel) {
      accel = a;
      blocker = leader.id < 0 ? "player" : "leader";
    }
  }
  if (unreservedTurn(agent, table)) {
    const toLine = noseToLine(agent);
    if (toLine < STOP_LINE_SIGHT_M) {
      const a = idmAcceleration(idm, agent.speed, wanted, {
        gap: toLine + STOP_LINE_BIAS_M,
        speed: 0,
      });
      if (a < accel) {
        accel = a;
        blocker = "stop-line";
      }
    }
  }
  return {
    accel,
    blocker,
    leaderGap: leader ? leader.gap : Number.POSITIVE_INFINITY,
    leaderId: leader?.id,
  };
}
