/// Transactional command service (task 18): applies `LudoCommand`s against
/// `LudoStore` (task 16) using task 17's pure TS engine.
///
/// Every state-changing call runs inside a single `LudoStore.transact()`:
/// load the match/player/event rows for the scope, short-circuit on a
/// repeated idempotency key before any engine logic runs, otherwise
/// validate seat ownership/phase/turn, reconstruct the current engine
/// `LudoMatchState` by replaying `ludo_events` (the match/player rows only
/// cache a few scalar fields for fast reads — see `reconstructEngineState`),
/// apply the engine transition, append its events at the next `sequence`,
/// update the cached scalar fields, and record the command's idempotency
/// result — all before the transaction's `operation` returns, so a thrown
/// error (illegal move, wrong turn, ...) leaves the working state
/// unmodified and the store commits nothing (see `LudoStore.transact`'s
/// contract in `store.ts` and its in-memory/Drizzle implementations).
import { randomUUID } from "node:crypto";
import type {
  LudoCommand,
  LudoEnvironment,
  LudoMatchView,
  LudoMode,
  LudoMatchState as WireMatchState,
} from "./contracts";
import { LUDO_APP_ID } from "./contracts";
import { CsprngDiceSource, type LudoDiceSource } from "./dice";
import {
  applyMove,
  type LudoMatchState as EngineMatchState,
  eventToJson,
  LUDO_MAX_SEATS,
  LUDO_MIN_SEATS,
  LUDO_RULESETS_BY_ID,
  type LudoReplayEvent,
  rollDice,
} from "./engine";
import {
  LudoError,
  LudoForbiddenSeatError,
  LudoIdempotencyConflictError,
  LudoIllegalMoveError,
  LudoMatchNotFoundError,
  LudoMatchNotJoinableError,
  LudoTimeoutNotElapsedError,
  LudoWrongPhaseError,
  LudoWrongTurnError,
} from "./errors";
import {
  ENGINE_PHASE_TO_WIRE,
  loadRecentEvents,
  publicStateFor,
  reconstructEngineState,
  WIRE_EVENT_TYPE,
} from "./match-view";
import type { MatchViewPublisher } from "./match-view-publisher";
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

export interface CreateMatchInput {
  subject: string;
  mode: LudoMode;
  seats: number;
  idempotencyKey: string;
}

export interface JoinMatchInput {
  subject: string;
  matchId: string;
  idempotencyKey: string;
  /**
   * Set only by matchmaking bot-fill (task 20): seats a stalled ticket's
   * remaining slots with a bot player instead of a human subject. `subject`
   * is still required (a synthetic id such as `bot:<uuid>`) so the roster's
   * seat-uniqueness/full-seat bookkeeping stays unchanged for a bot seat.
   */
  bot?: { difficulty: string };
}

export interface LudoCommandResult {
  matchState: WireMatchState;
  idempotent: boolean;
}

/**
 * Optional overrides for every state-changing service function.
 * `diceSource` is production-omitted (real `CsprngDiceSource`) and
 * test-injected (`ScriptedDiceSource`/`FunctionDiceSource`, see `dice.ts`)
 * to drive a match deterministically end-to-end. `matchViewPublisher` is
 * task 22's realtime fanout: when supplied, every committed transaction
 * below calls `publish()` with a fresh `LudoMatchView` after the commit;
 * when omitted, nothing is published (matching `NullMatchViewPublisher`'s
 * behavior without needing to construct one).
 */
export interface LudoServiceDependencies {
  diceSource?: LudoDiceSource;
  matchViewPublisher?: MatchViewPublisher;
}

/**
 * Creates a match in the `"waiting"` status with the caller seated at seat
 * 0, recording `matchOrigin` exactly as given (`"direct"` for this task's
 * plain create path; tasks 20/21 pass `"matchmaking"`/`"room"` through this
 * same function rather than writing `ludo_matches.match_origin` themselves).
 */
export async function createMatch(
  store: LudoStore,
  environment: LudoEnvironment,
  input: CreateMatchInput,
  matchOrigin: LudoMatchRow["matchOrigin"],
  dependencies: LudoServiceDependencies = {},
): Promise<LudoCommandResult> {
  const ruleset = LUDO_RULESETS_BY_ID[input.mode];
  if (!ruleset) throw new LudoMatchNotJoinableError(`Unknown ludo mode: ${input.mode}`);
  if (
    !Number.isInteger(input.seats) ||
    input.seats < LUDO_MIN_SEATS ||
    input.seats > LUDO_MAX_SEATS
  ) {
    throw new LudoMatchNotJoinableError(`seats must be ${LUDO_MIN_SEATS}..${LUDO_MAX_SEATS}`);
  }

  const result = await store.transact(environment, async (state) => {
    const existingCommand = state.commands.find(
      (c) => c.commandType === "create_match" && c.idempotencyKey === input.idempotencyKey,
    );
    if (existingCommand) {
      const row = state.matches.find((m) => m.matchId === existingCommand.matchId);
      if (!row) throw new LudoMatchNotFoundError(existingCommand.matchId);
      return { matchState: publicStateFor(state, row), idempotent: true };
    }

    const now = new Date().toISOString();
    const matchId = randomUUID();
    const row: LudoMatchRow = {
      matchId,
      environment,
      mode: input.mode,
      status: "waiting",
      seatCount: input.seats,
      rulesVersion: ruleset.rulesVersion,
      currentTurnSeat: 0,
      phase: "awaiting_roll",
      sixStreak: 0,
      turnDeadlineAt: null,
      revision: 0,
      matchOrigin,
      createdAt: now,
      updatedAt: now,
    };
    state.matches.push(row);
    state.players.push({
      matchId,
      environment,
      seat: 0,
      subject: input.subject,
      isBot: false,
      botDifficulty: null,
      displayNameCache: null,
      connectedAt: now,
      missCount: 0,
    });
    state.commands.push({
      matchId,
      environment,
      idempotencyKey: input.idempotencyKey,
      commandType: "create_match",
      resultSummary: { matchId },
      createdAt: now,
    });

    return { matchState: publicStateFor(state, row), idempotent: false };
  });
  await publishMatchView(store, environment, result.matchState, dependencies);
  return result;
}

/**
 * Joins `input.subject` into the next open seat of an existing `"waiting"`
 * match created via `createMatch`/matchmaking/rooms. Once the last seat is
 * filled the match transitions to `"active"`, seat 0 to move first — this
 * is a pure roster/status change; no engine events are appended (the
 * engine's own initial state is exactly what replaying zero events over
 * the full roster produces, so nothing needs to be recorded up front).
 */
export async function joinMatch(
  store: LudoStore,
  environment: LudoEnvironment,
  input: JoinMatchInput,
  dependencies: LudoServiceDependencies = {},
): Promise<LudoCommandResult> {
  const result = await store.transact(environment, async (state) => {
    const row = state.matches.find((m) => m.matchId === input.matchId);
    if (!row) throw new LudoMatchNotFoundError(input.matchId);

    const existingCommand = state.commands.find(
      (c) => c.matchId === input.matchId && c.idempotencyKey === input.idempotencyKey,
    );
    if (existingCommand) {
      if (existingCommand.commandType !== "join_match") throw new LudoIdempotencyConflictError();
      return { matchState: publicStateFor(state, row), idempotent: true };
    }

    if (row.status !== "waiting") {
      throw new LudoMatchNotJoinableError("Match is not accepting new players");
    }
    const playersBefore = state.players.filter((p) => p.matchId === row.matchId);
    if (playersBefore.some((p) => p.subject === input.subject)) {
      throw new LudoMatchNotJoinableError(`Subject already joined: ${input.subject}`);
    }
    if (playersBefore.length >= row.seatCount) {
      throw new LudoMatchNotJoinableError("Match is already full");
    }

    const now = new Date().toISOString();
    const seat = playersBefore.length;
    state.players.push({
      matchId: row.matchId,
      environment,
      seat,
      subject: input.subject,
      isBot: input.bot !== undefined,
      botDifficulty: input.bot?.difficulty ?? null,
      displayNameCache: null,
      connectedAt: now,
      missCount: 0,
    });

    if (seat + 1 === row.seatCount) {
      row.status = "active";
      row.phase = "awaiting_roll";
      row.currentTurnSeat = 0;
      row.turnDeadlineAt = computeTurnDeadline(now);
      row.revision += 1;
      row.updatedAt = now;
    }

    state.commands.push({
      matchId: row.matchId,
      environment,
      idempotencyKey: input.idempotencyKey,
      commandType: "join_match",
      resultSummary: { seat },
      createdAt: now,
    });

    return { matchState: publicStateFor(state, row), idempotent: false };
  });
  await publishMatchView(store, environment, result.matchState, dependencies);
  return result;
}

/**
 * Applies a gameplay/roster command to an existing match: `roll_dice` and
 * `move_token` run the engine transition; `join_match` delegates to
 * `joinMatch`; `claim_timeout` delegates to `claimTimeout` (task 19).
 * `create_match`/`surrender`/`rematch` are out of this task's scope
 * (created matches go through `createMatch` directly; surrender/rematch are
 * not yet specified) and are rejected with `ludo_invalid_command`.
 */
export async function processCommand(
  store: LudoStore,
  environment: LudoEnvironment,
  subject: string,
  command: LudoCommand,
  dependencies: LudoServiceDependencies = {},
): Promise<LudoCommandResult> {
  switch (command.type) {
    case "join_match":
      return joinMatch(
        store,
        environment,
        {
          subject,
          matchId: command.matchId,
          idempotencyKey: command.idempotencyKey,
        },
        dependencies,
      );
    case "roll_dice": {
      const diceSource = dependencies.diceSource ?? new CsprngDiceSource();
      return applyGameplayCommand(
        store,
        environment,
        subject,
        command.matchId,
        command.idempotencyKey,
        "roll_dice",
        (matchState) => {
          if (matchState.phase !== "awaitingRoll") {
            throw new LudoWrongPhaseError("The match is not awaiting a roll");
          }
          const result = rollDice(matchState, diceSource);
          return {
            next: result.state,
            events: result.events,
            resultSummary: { roll: result.roll },
          };
        },
        dependencies,
      );
    }
    case "move_token":
      return applyGameplayCommand(
        store,
        environment,
        subject,
        command.matchId,
        command.idempotencyKey,
        "move_token",
        (matchState) => {
          if (matchState.phase !== "awaitingMove") {
            throw new LudoWrongPhaseError("The match is not awaiting a move");
          }
          try {
            const result = applyMove(matchState, command.tokenId);
            return {
              next: result.state,
              events: result.events,
              resultSummary: { tokenId: command.tokenId },
            };
          } catch (cause) {
            throw new LudoIllegalMoveError(cause instanceof Error ? cause.message : undefined);
          }
        },
        dependencies,
      );
    case "claim_timeout":
      return claimTimeout(
        store,
        environment,
        subject,
        command.matchId,
        command.idempotencyKey,
        dependencies,
      );
    default:
      throw new LudoError(
        422,
        "ludo_invalid_command",
        `Command type is not supported by processCommand: ${command.type}`,
      );
  }
}

interface EngineTransition {
  next: EngineMatchState;
  events: readonly LudoReplayEvent[];
  resultSummary: Record<string, unknown>;
}

/**
 * Shared transaction body for `roll_dice`/`move_token`: idempotency
 * short-circuit, seat-ownership/turn/status validation, reconstructing the
 * current engine state, running `apply` (which itself validates phase and
 * throws before touching `state` on any rejection), then persisting the
 * resulting events and cached scalar fields.
 */
async function applyGameplayCommand(
  store: LudoStore,
  environment: LudoEnvironment,
  subject: string,
  matchId: string,
  idempotencyKey: string,
  commandType: "roll_dice" | "move_token",
  apply: (matchState: EngineMatchState) => EngineTransition,
  dependencies: LudoServiceDependencies = {},
): Promise<LudoCommandResult> {
  const result = await store.transact(environment, async (state) => {
    const row = state.matches.find((m) => m.matchId === matchId);
    if (!row) throw new LudoMatchNotFoundError(matchId);

    // Lazy enforcement (task 19): before anything else, resolve any turn
    // that has already timed out — including, potentially, the very turn
    // this command is trying to act on.
    const now = new Date().toISOString();
    const allPlayerRows = state.players.filter((p) => p.matchId === matchId);
    applyLazyTimeout(state, row, allPlayerRows, now);

    const existingCommand = state.commands.find(
      (c) => c.matchId === matchId && c.idempotencyKey === idempotencyKey,
    );
    if (existingCommand) {
      if (existingCommand.commandType !== commandType) throw new LudoIdempotencyConflictError();
      return { matchState: publicStateFor(state, row), idempotent: true };
    }

    const seatRow = allPlayerRows.find((p) => p.subject === subject);
    const seat = seatRow?.seat;
    if (seat === undefined) throw new LudoForbiddenSeatError();
    if (row.status !== "active") throw new LudoWrongPhaseError("The match is not active");
    if (row.currentTurnSeat !== seat) throw new LudoWrongTurnError();

    const matchState = reconstructEngineState(row, allPlayerRows, state.events);
    const { next, events, resultSummary } = apply(matchState);

    appendEvents(state, row, events, now);
    row.phase = ENGINE_PHASE_TO_WIRE[next.phase];
    row.currentTurnSeat = next.players[next.currentPlayerIndex].seat;
    row.sixStreak = next.consecutiveSixes;
    if (next.phase === "finished") {
      row.status = "finished";
      row.turnDeadlineAt = null;
    } else {
      row.turnDeadlineAt = computeTurnDeadline(now);
    }
    row.revision += 1;
    row.updatedAt = now;
    // The acting seat just took a legal action within its deadline, so its
    // consecutive-miss streak resets (see timeout.ts's forfeit threshold).
    if (seatRow) seatRow.missCount = 0;

    state.commands.push({
      matchId,
      environment,
      idempotencyKey,
      commandType,
      resultSummary,
      createdAt: now,
    });

    return { matchState: publicStateFor(state, row), idempotent: false };
  });
  await publishMatchView(store, environment, result.matchState, dependencies);
  return result;
}

/**
 * The explicit `claim_timeout` command (task 19): any seated player may
 * call this once they observe `now > turn_deadline_at` on their own clock.
 * It drives the exact same `applyTimeoutIfExpired` transition as the lazy
 * check above and is rejected with `ludo_timeout_not_elapsed` if the
 * deadline has not actually passed, so a second call with a *new*
 * idempotency key right after a successful one correctly fails rather than
 * silently re-applying a timeout that already happened; a second call with
 * the *same* idempotency key returns the identical cached result.
 */
async function claimTimeout(
  store: LudoStore,
  environment: LudoEnvironment,
  subject: string,
  matchId: string,
  idempotencyKey: string,
  dependencies: LudoServiceDependencies = {},
): Promise<LudoCommandResult> {
  const result = await store.transact(environment, async (state) => {
    const row = state.matches.find((m) => m.matchId === matchId);
    if (!row) throw new LudoMatchNotFoundError(matchId);

    const existingCommand = state.commands.find(
      (c) => c.matchId === matchId && c.idempotencyKey === idempotencyKey,
    );
    if (existingCommand) {
      if (existingCommand.commandType !== "claim_timeout") throw new LudoIdempotencyConflictError();
      return { matchState: publicStateFor(state, row), idempotent: true };
    }

    const playerRows = state.players.filter((p) => p.matchId === matchId);
    const seat = playerRows.find((p) => p.subject === subject)?.seat;
    if (seat === undefined) throw new LudoForbiddenSeatError();
    if (row.status !== "active") throw new LudoWrongPhaseError("The match is not active");

    const now = new Date().toISOString();
    const applied = applyLazyTimeout(state, row, playerRows, now);
    if (!applied) throw new LudoTimeoutNotElapsedError();

    state.commands.push({
      matchId,
      environment,
      idempotencyKey,
      commandType: "claim_timeout",
      resultSummary: { timedOutSeat: row.currentTurnSeat },
      createdAt: now,
    });

    return { matchState: publicStateFor(state, row), idempotent: false };
  });
  await publishMatchView(store, environment, result.matchState, dependencies);
  return result;
}

/**
 * Reads the current match state for a seated player (`GET
 * /:environment/matches/:matchId`), applying the lazy timeout check first
 * so a client polling a stalled opponent's match always observes the
 * post-timeout state, without needing to send `claim_timeout` itself.
 */
export async function getMatchState(
  store: LudoStore,
  environment: LudoEnvironment,
  subject: string,
  matchId: string,
): Promise<{ matchState: WireMatchState }> {
  return store.transact(environment, async (state) => {
    const row = state.matches.find((m) => m.matchId === matchId);
    if (!row) throw new LudoMatchNotFoundError(matchId);
    const playerRows = state.players.filter((p) => p.matchId === matchId);
    const seat = playerRows.find((p) => p.subject === subject)?.seat;
    if (seat === undefined) throw new LudoForbiddenSeatError();

    const now = new Date().toISOString();
    applyLazyTimeout(state, row, playerRows, now);

    return { matchState: publicStateFor(state, row) };
  });
}

/**
 * `GET /:environment/matches/:matchId/state` (task 22): the HTTP polling
 * fallback for clients without Firestore connectivity. Builds the exact
 * same `LudoMatchView` shape a `MatchViewPublisher.publish()` call would
 * have carried, synchronously from `LudoStore` — this route (not the
 * Firestore mirror) is the ground truth. Enforces seat ownership by
 * delegating to `getMatchState`, which throws `LudoForbiddenSeatError` for
 * a caller not seated in the match.
 */
export async function getMatchView(
  store: LudoStore,
  environment: LudoEnvironment,
  subject: string,
  matchId: string,
): Promise<{ matchView: LudoMatchView }> {
  const { matchState } = await getMatchState(store, environment, subject, matchId);
  const recentEvents = await loadRecentEvents(store, environment, matchId);
  return {
    matchView: {
      matchId,
      environment,
      matchState,
      recentEvents,
      publishedAt: new Date().toISOString(),
    },
  };
}

/**
 * Fetches a fresh `LudoMatchView` and calls `dependencies.matchViewPublisher`
 * (task 22) — a strict no-op when no publisher was supplied, matching
 * `NullMatchViewPublisher` without needing to construct one. Always called
 * *after* the triggering `store.transact()` has already resolved (returned
 * or thrown past this point means the state change already committed), and
 * always swallows its own errors: a fanout failure (Firestore outage,
 * network error, ...) must never surface as a command error — the polling
 * route (`getMatchView`) remains the ground truth regardless of whether
 * this publish ever lands.
 */
async function publishMatchView(
  store: LudoStore,
  environment: LudoEnvironment,
  matchState: WireMatchState,
  dependencies: LudoServiceDependencies,
): Promise<void> {
  const publisher = dependencies.matchViewPublisher;
  if (!publisher) return;
  try {
    const recentEvents = await loadRecentEvents(store, environment, matchState.matchId);
    const view: LudoMatchView = {
      matchId: matchState.matchId,
      environment,
      matchState,
      recentEvents,
      publishedAt: new Date().toISOString(),
    };
    await publisher.publish(LUDO_APP_ID, environment, matchState.matchId, view);
  } catch {
    // Best-effort fan-out only — see this function's doc comment.
  }
}

/**
 * Shared lazy-check body for the GET route, every gameplay command, and
 * `claim_timeout`: no-ops for a match that is not `"active"` or whose
 * deadline has not elapsed, otherwise applies `applyTimeoutIfExpired` and
 * persists its result (events, cached scalar row fields, per-seat miss
 * counts, a fresh deadline for whichever seat now has the turn). Returns
 * whether a timeout was actually applied, which `claimTimeout` uses to
 * reject a premature claim and `sweepTimeouts` uses to count real work.
 */
function applyLazyTimeout(
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
        await publishMatchView(store, environment, outcome.matchState, dependencies);
      }
    }
  }
  return swept;
}

/** Appends `events` to `ludo_events` starting at the next unused `sequence` for this match. */
function appendEvents(
  state: LudoState,
  row: LudoMatchRow,
  events: readonly LudoReplayEvent[],
  nowIso: string,
): void {
  const existingSequences = state.events
    .filter((e) => e.matchId === row.matchId)
    .map((e) => e.sequence);
  let sequence = existingSequences.length ? Math.max(...existingSequences) + 1 : 0;
  for (const event of events) {
    state.events.push({
      matchId: row.matchId,
      environment: row.environment,
      sequence,
      eventType: WIRE_EVENT_TYPE[event.type],
      payload: eventToJson(event),
      createdAt: nowIso,
    });
    sequence += 1;
  }
}
