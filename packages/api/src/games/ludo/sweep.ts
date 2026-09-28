/// Turn-timeout sweeping, split out of `service.ts` (task 26c) purely to
/// keep that file under the repo's per-file line limit: the shared lazy
/// timeout-application body used by every read/command path, and the Cron
/// backstop sweeper (task 19) that drives it for matches nobody is polling.

import { settleCoinStakeMatch } from "./coin-stake";
import type { LudoEnvironment } from "./contracts";
import {
  appendEvents,
  ENGINE_PHASE_TO_WIRE,
  publicStateFor,
  publishMatchView,
  reconstructEngineState,
} from "./match-view";
import type { LudoServiceDependencies } from "./service-types";
import type { LudoMatchRow, LudoPlayerRow, LudoState, LudoStore } from "./store";
import { applyTimeoutIfExpired, computeTurnDeadline } from "./timeout";

/**
 * Cap on how many expired matches a single cron invocation
 * (`GET/POST /games/ludo/cron/sweep-timeouts`) will process, matching the
 * repo's "bounded cursor" convention for maintenance sweeps (see Merge
 * Relay's equivalent work) — the lazy per-request check is the primary
 * enforcement mechanism, so this only needs to bound worst-case work for
 * matches nobody is actively polling.
 */
export const LUDO_SWEEP_BATCH_LIMIT = 25;

/**
 * Shared lazy-check body for the GET route, every gameplay command, and
 * `claim_timeout`: no-ops for a match that is not `"active"` or whose
 * deadline has not elapsed, otherwise applies `applyTimeoutIfExpired` and
 * persists its result (events, cached scalar row fields, per-seat miss
 * counts, a fresh deadline for whichever seat now has the turn). Returns
 * whether a timeout was actually applied, which `claimTimeout` uses to
 * reject a premature claim and `sweepTimeouts` uses to count real work.
 */
export function applyLazyTimeout(
  state: LudoState,
  row: LudoMatchRow,
  playerRows: readonly LudoPlayerRow[],
  nowIso: string,
): boolean {
  if (row.status !== "active") return false;
  const sortedPlayerRows = [...playerRows].sort((a, b) => a.seat - b.seat);
  const matchState = reconstructEngineState(row, sortedPlayerRows, state.events);
  const missCounts: number[] = [];
  for (const p of sortedPlayerRows) missCounts[p.seat] = p.missCount;

  // Matchmaking-origin matches (task 20) bot-fill a stalled seat instead
  // of forfeiting it, for every seat — explicit branch on `matchOrigin`;
  // room/direct-origin matches pass no eligible seats and keep task 19's
  // existing forfeit-on-three-misses behavior unchanged.
  const botFillEligibleSeats =
    row.matchOrigin === "matchmaking" ? new Set(sortedPlayerRows.map((p) => p.seat)) : undefined;

  const outcome = applyTimeoutIfExpired({
    matchState,
    missCounts,
    deadlineAt: row.turnDeadlineAt,
    now: new Date(nowIso),
    botFillEligibleSeats,
  });
  if (!outcome.timedOut) return false;

  appendEvents(state, row, outcome.events, nowIso);
  row.phase = ENGINE_PHASE_TO_WIRE[outcome.matchState.phase];
  row.currentTurnSeat =
    outcome.matchState.players[outcome.matchState.currentPlayerIndex]?.seat ?? row.currentTurnSeat;
  row.sixStreak = outcome.matchState.consecutiveSixes;
  if (outcome.abandoned) row.status = "abandoned";
  else if (outcome.matchState.phase === "finished") row.status = "finished";
  row.turnDeadlineAt = outcome.matchState.phase === "finished" ? null : computeTurnDeadline(nowIso);
  row.revision += 1;
  row.updatedAt = nowIso;

  for (const p of sortedPlayerRows) {
    const updated = outcome.missCounts[p.seat];
    if (updated !== undefined) p.missCount = updated;
  }
  for (const seat of outcome.botFilledSeats) {
    const p = sortedPlayerRows.find((row_) => row_.seat === seat);
    if (p) {
      p.isBot = true;
      p.botDifficulty = p.botDifficulty ?? "medium";
    }
  }

  return true;
}

/**
 * Cron sweeper backstop (`GET/POST /games/ludo/cron/sweep-timeouts`,
 * task 19): scans one environment's matches for ones whose deadline has
 * already elapsed, bounded to `limit` per invocation (oldest deadline
 * first), and applies the identical `applyLazyTimeout` transition to each.
 * A match another request (or a previous sweep) already resolved is simply
 * a no-op here — see `applyLazyTimeout`'s idempotency note — so repeated
 * sweeps never double-apply a timeout.
 */
export async function sweepTimeouts(
  store: LudoStore,
  environment: LudoEnvironment,
  limit: number = LUDO_SWEEP_BATCH_LIMIT,
  dependencies: LudoServiceDependencies = {},
): Promise<number> {
  const nowIso = new Date().toISOString();
  const candidateMatchIds = await store.read(environment, async (state) =>
    state.matches
      .filter(
        (m) => m.status === "active" && m.turnDeadlineAt !== null && m.turnDeadlineAt < nowIso,
      )
      .sort((a, b) => (a.turnDeadlineAt as string).localeCompare(b.turnDeadlineAt as string))
      .slice(0, limit)
      .map((m) => m.matchId),
  );

  let swept = 0;
  for (const matchId of candidateMatchIds) {
    const outcome = await store.transact(environment, async (state) => {
      const row = state.matches.find((m) => m.matchId === matchId);
      if (!row) return { applied: false, matchState: null };
      const playerRows = state.players.filter((p) => p.matchId === matchId);
      const applied = applyLazyTimeout(state, row, playerRows, new Date().toISOString());
      return { applied, matchState: applied ? publicStateFor(state, row) : null };
    });
    if (outcome.applied) {
      swept += 1;
      if (outcome.matchState) {
        // The Cron backstop (task 19) is exactly the "timeout sweeper"
        // integration point task 26c's refund path must reach: a
        // coin-stake match nobody is polling still gets its escrow
        // refunded/paid-out here, never left stuck.
        await settleCoinStakeMatch(store, environment, outcome.matchState, dependencies);
        await publishMatchView(store, environment, outcome.matchState, dependencies);
      }
    }
  }
  return swept;
}
