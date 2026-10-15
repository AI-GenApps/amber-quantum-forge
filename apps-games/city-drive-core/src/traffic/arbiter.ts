import type { ReservationTable } from "./reservations";

/** Seconds of waiting that offset one step of turn rank. */
export const RANK_WEIGHT_S = 3;

export interface ReservationRequest {
  agentId: number;
  edgeId: string;
  /** turnRank of the turn: lower is more important. */
  rank: number;
  /** Seconds this agent has been waiting at the line. */
  waited: number;
}

function score(r: ReservationRequest): number {
  return r.waited - RANK_WEIGHT_S * r.rank;
}

/**
 * Grant reservations for one step, best request first (right turns before left turns, with older
 * waits catching up). A request is denied when a conflicting edge is held, or when an earlier
 * request for a conflicting edge was denied: that keeps a stream of followers from starving a
 * waiting turn. Returns the agents that were granted.
 */
export function arbitrate(table: ReservationTable, requests: ReservationRequest[]): Set<number> {
  const ordered = [...requests].sort((a, b) => score(b) - score(a) || a.agentId - b.agentId);
  const granted = new Set<number>();
  const denied: ReservationRequest[] = [];
  for (const request of ordered) {
    if (table.holds(request.agentId, request.edgeId)) continue;
    const blockedByWaiter = denied.some((d) => table.conflicts(d.edgeId, request.edgeId));
    if (!blockedByWaiter && table.reserve(request.agentId, request.edgeId)) {
      granted.add(request.agentId);
    } else {
      denied.push(request);
    }
  }
  return granted;
}
