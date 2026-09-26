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
  LudoMode,
  LudoMatchState as WireMatchState,
} from "./contracts";
import { CsprngDiceSource, type LudoDiceSource } from "./dice";
import {
  applyMove,
  createMatchState,
  type LudoMatchState as EngineMatchState,
  eventFromJson,
  eventToJson,
  LUDO_COLOR_ORDER,
  LUDO_MAX_SEATS,
  LUDO_MIN_SEATS,
  LUDO_RULESETS_BY_ID,
  type LudoReplayEvent,
  replay,
  rollDice,
} from "./engine";
import {
  LudoError,
  LudoForbiddenSeatError,
  LudoIdempotencyConflictError,
  LudoIllegalMoveError,
  LudoMatchNotFoundError,
  LudoMatchNotJoinableError,
  LudoWrongPhaseError,
  LudoWrongTurnError,
} from "./errors";
import type { LudoEventRow, LudoMatchRow, LudoPlayerRow, LudoState, LudoStore } from "./store";

/** Maps an engine `LudoReplayEvent`'s type to the snake_case label stored in `ludo_events.event_type`. */
const WIRE_EVENT_TYPE: Record<LudoReplayEvent["type"], string> = {
  diceRolled: "dice_rolled",
  tokenMoved: "token_moved",
  tokenCaptured: "token_captured",
  tokenFinished: "token_finished",
  turnForfeited: "turn_forfeited",
  matchFinished: "match_finished",
};

const ENGINE_PHASE_TO_WIRE: Record<EngineMatchState["phase"], WireMatchState["phase"]> = {
  awaitingRoll: "awaiting_roll",
  awaitingMove: "awaiting_move",
  finished: "finished",
};

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
}

export interface LudoCommandResult {
  matchState: WireMatchState;
  idempotent: boolean;
}

/**
 * Optional overrides for `processCommand`. Production callers (`routes.ts`)
 * omit this and get a real `CsprngDiceSource`; tests inject a
 * `ScriptedDiceSource`/`FunctionDiceSource` (see `dice.ts`) to drive a match
 * deterministically end-to-end.
 */
export interface LudoServiceDependencies {
  diceSource?: LudoDiceSource;
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

  return store.transact(environment, async (state) => {
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
): Promise<LudoCommandResult> {
  return store.transact(environment, async (state) => {
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
      isBot: false,
      botDifficulty: null,
      displayNameCache: null,
      connectedAt: now,
      missCount: 0,
    });

    if (seat + 1 === row.seatCount) {
      row.status = "active";
      row.phase = "awaiting_roll";
      row.currentTurnSeat = 0;
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
}

/**
 * Applies a gameplay/roster command to an existing match: `roll_dice` and
 * `move_token` run the engine transition; `join_match` delegates to
 * `joinMatch`. `create_match`/`claim_timeout`/`surrender`/`rematch` are out
 * of this task's scope (created matches go through `createMatch` directly;
 * timeouts are task 19; surrender/rematch are not yet specified) and are
 * rejected with `ludo_invalid_command`.
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
      return joinMatch(store, environment, {
        subject,
        matchId: command.matchId,
        idempotencyKey: command.idempotencyKey,
      });
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
): Promise<LudoCommandResult> {
  return store.transact(environment, async (state) => {
    const row = state.matches.find((m) => m.matchId === matchId);
    if (!row) throw new LudoMatchNotFoundError(matchId);

    const existingCommand = state.commands.find(
      (c) => c.matchId === matchId && c.idempotencyKey === idempotencyKey,
    );
    if (existingCommand) {
      if (existingCommand.commandType !== commandType) throw new LudoIdempotencyConflictError();
      return { matchState: publicStateFor(state, row), idempotent: true };
    }

    const playerRows = state.players.filter((p) => p.matchId === matchId);
    const seat = playerRows.find((p) => p.subject === subject)?.seat;
    if (seat === undefined) throw new LudoForbiddenSeatError();
    if (row.status !== "active") throw new LudoWrongPhaseError("The match is not active");
    if (row.currentTurnSeat !== seat) throw new LudoWrongTurnError();

    const matchState = reconstructEngineState(row, playerRows, state.events);
    const { next, events, resultSummary } = apply(matchState);

    const now = new Date().toISOString();
    appendEvents(state, row, events, now);
    row.phase = ENGINE_PHASE_TO_WIRE[next.phase];
    row.currentTurnSeat = next.players[next.currentPlayerIndex].seat;
    row.sixStreak = next.consecutiveSixes;
    if (next.phase === "finished") row.status = "finished";
    row.revision += 1;
    row.updatedAt = now;

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

/**
 * Builds the wire-shaped `LudoMatchState` for a match row: while `"waiting"`
 * (roster incomplete), reports the joined seats with empty token lists;
 * once seats are full, reconstructs the full engine state by replay and
 * projects it onto the wire shape (which is a superset of the engine's:
 * `matchId`/`environment`/`mode`/`status`/`deadlineAt`/`updatedAt` come from
 * the row, everything else from the reconstructed state).
 */
function publicStateFor(state: LudoState, row: LudoMatchRow): WireMatchState {
  const playerRows = state.players
    .filter((p) => p.matchId === row.matchId)
    .sort((a, b) => a.seat - b.seat);

  if (row.status === "waiting") {
    return {
      matchId: row.matchId,
      environment: row.environment,
      mode: row.mode,
      status: row.status,
      players: playerRows.map((p) => ({
        seat: p.seat,
        subject: p.subject ?? "",
        color: LUDO_COLOR_ORDER[p.seat],
        tokens: [],
        captureCount: 0,
      })),
      currentPlayerIndex: 0,
      phase: "awaiting_roll",
      currentRoll: null,
      consecutiveSixes: 0,
      winnerOrder: [],
      deadlineAt: row.turnDeadlineAt,
      updatedAt: row.updatedAt,
    };
  }

  const engineState = reconstructEngineState(row, playerRows, state.events);
  return {
    matchId: row.matchId,
    environment: row.environment,
    mode: row.mode,
    status: row.status as WireMatchState["status"],
    players: engineState.players.map((p) => ({
      seat: p.seat,
      subject: p.subject,
      color: p.color,
      tokens: p.tokens.map((t) => ({ id: t.id, pathPosition: t.pathPosition })),
      captureCount: p.captureCount,
    })),
    currentPlayerIndex: engineState.currentPlayerIndex,
    phase: ENGINE_PHASE_TO_WIRE[engineState.phase],
    currentRoll: engineState.currentRoll,
    consecutiveSixes: engineState.consecutiveSixes,
    winnerOrder: [...engineState.winnerOrder],
    deadlineAt: row.turnDeadlineAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Reconstructs the current engine `LudoMatchState` for an active/finished
 * match: the initial roster/ruleset (colors and pre-released tokens are a
 * pure function of the ruleset and seat order) replayed through every
 * `ludo_events` row recorded so far, in `sequence` order. This — not a
 * persisted state blob — is the source of truth for token positions,
 * mirroring `parity.test.ts`'s use of `replay()` against fixture event
 * logs.
 */
function reconstructEngineState(
  row: LudoMatchRow,
  sortedPlayerRows: readonly LudoPlayerRow[],
  eventRows: readonly LudoEventRow[],
): EngineMatchState {
  const ruleset = LUDO_RULESETS_BY_ID[row.mode];
  const subjects = sortedPlayerRows.map((p) => p.subject);
  if (subjects.length < LUDO_MIN_SEATS || subjects.some((s) => s === null)) {
    throw new LudoMatchNotJoinableError("Match roster is incomplete");
  }
  const initial = createMatchState({ ruleset, subjects: subjects as string[] });
  const events = eventRows
    .filter((e) => e.matchId === row.matchId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((e) => eventFromJson(e.payload as Record<string, unknown>));
  return replay(events, { ruleset, initialPlayers: initial.players });
}
