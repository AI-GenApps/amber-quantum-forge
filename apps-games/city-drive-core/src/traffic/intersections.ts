import { FIXED_DT } from "../physics/clock";
import type { TrafficAgent } from "./agent";
import { arbitrate, type ReservationRequest } from "./arbiter";
import { turnRank } from "./conflicts";
import {
  AGENT_HALF_LENGTH_M,
  EXIT_POCKET_M,
  RELEASE_MARGIN_M,
  REQUEST_HORIZON_S,
  REQUEST_MIN_M,
} from "./constants";
import { noseToLine, unreservedTurn } from "./driving";
import { DEFAULT_IDM } from "./idm";
import { findLeader, type Obstacle } from "./leader";
import type { ReservationTable } from "./reservations";

/** A stopped car this slow (m/s) in the exit pocket counts as a blocked exit. */
const PARKED_SPEED_MS = 1;
/** How far short of the line a queued car's nose ends up (IDM gap less the stop-line bias). */
const STOP_NOSE_GAP_M = 0.4;

function exitBlocked(agent: TrafficAgent, obstacles: readonly Obstacle[]): boolean {
  const turn = agent.path[1];
  if (!turn) return false;
  const ahead = agent.path.slice(1);
  const reach = turn.length + EXIT_POCKET_M;
  const hit = findLeader(ahead, 0, AGENT_HALF_LENGTH_M, reach, obstacles, agent.id);
  return hit !== undefined && hit.speed < PARKED_SPEED_MS;
}

/**
 * Cars that can stand on an edge in a queue at its end and still leave the last one's tail clear
 * of the intersection behind: the front car's nose is at the stop line, each following car is one
 * pitch (length plus the IDM standstill gap) further back, and the last must be past the release
 * margin.
 */
function edgeCapacity(length: number): number {
  const pitch = 2 * AGENT_HALF_LENGTH_M + DEFAULT_IDM.minGap;
  const front = AGENT_HALF_LENGTH_M + STOP_NOSE_GAP_M;
  const rearClear = AGENT_HALF_LENGTH_M + RELEASE_MARGIN_M;
  return Math.max(1, 1 + Math.floor((length - front - rearClear) / pitch));
}

/** Cars on `exitId` plus cars that have already reserved their way onto it. */
function committedTo(exitId: string, agents: readonly TrafficAgent[], table: ReservationTable) {
  let count = 0;
  for (const other of agents) {
    for (let k = 0; k < 3; k++) {
      if (other.path[k]?.id !== exitId) continue;
      const before = other.path[k - 1];
      if (k === 0 || (before && table.holds(other.id, before.id))) count++;
      break;
    }
  }
  return count;
}

/**
 * The road after the turn is full: entering would park a car inside the intersection with
 * nowhere to go, which is how a ring of full roads gridlocks.
 */
function exitFull(
  agent: TrafficAgent,
  agents: readonly TrafficAgent[],
  table: ReservationTable,
): boolean {
  const exit = agent.path[2];
  return exit !== undefined && committedTo(exit.id, agents, table) >= edgeCapacity(exit.length);
}

/**
 * Ask for the turn edge of every agent that is first in line and close to an intersection.
 * Grants go to the table; the rest keep waiting (and keep ageing, so left turns are not starved).
 */
export function reserveTurns(
  agents: readonly TrafficAgent[],
  table: ReservationTable,
  obstacles: readonly Obstacle[],
): void {
  const requests: ReservationRequest[] = [];
  const asking: TrafficAgent[] = [];
  for (const agent of agents) {
    const turn = unreservedTurn(agent, table);
    if (!turn) {
      agent.waitTicks = 0;
      continue;
    }
    const toLine = noseToLine(agent);
    const horizon = Math.max(REQUEST_MIN_M, agent.speed * REQUEST_HORIZON_S);
    const firstInLine = agent.leaderGap > toLine + 1;
    if (toLine > horizon || !firstInLine) continue;
    agent.waitTicks++;
    asking.push(agent);
    if (exitBlocked(agent, obstacles) || exitFull(agent, agents, table)) continue;
    requests.push({
      agentId: agent.id,
      edgeId: turn.id,
      rank: turnRank(turn.kind),
      waited: agent.waitTicks * FIXED_DT,
    });
  }
  const granted = arbitrate(table, requests);
  for (const agent of asking) if (granted.has(agent.id)) agent.waitTicks = 0;
}
