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
import {
  type CoinStakeTerms,
  debitCoinStakeEntry,
  requireEconomyStore,
  resolveCoinStakeTerms,
  rollbackCoinStakeEntry,
  settleCoinStakeMatch,
} from "./coin-stake";
import type {
  LudoCommand,
  LudoEnvironment,
  LudoMatchView,
  LudoMode,
  LudoMatchState as WireMatchState,
} from "./contracts";
import { CsprngDiceSource } from "./dice";
import { getEconomyConfig, type LudoCoinTableTier } from "./economy-config";
import {
  applyMove,
  type LudoMatchState as EngineMatchState,
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
  appendEvents,
  ENGINE_PHASE_TO_WIRE,
  loadRecentEvents,
  publicStateFor,
  publishMatchView,
  reconstructEngineState,
} from "./match-view";
import type { LudoCommandResult, LudoServiceDependencies } from "./service-types";
import type { LudoMatchRow, LudoStore } from "./store";
import { applyLazyTimeout } from "./sweep";
import { computeTurnDeadline } from "./timeout";

export type { LudoCommandResult, LudoServiceDependencies } from "./service-types";
export { LUDO_SWEEP_BATCH_LIMIT, sweepTimeouts } from "./sweep";

export interface CreateMatchInput {
  subject: string;
  mode: LudoMode;
  seats: number;
  idempotencyKey: string;
  /** Set for a coin-stake table (task 26c): the seat-0 subject's entry fee
   * is debited and a `ludo_coin_table_escrow` row is created for the full
   * `seats * tier.entryFee` pot before the match row itself is written.
   * Omitted (the default) for free-play matches, which never touch the
   * economy store. */
  coinTier?: LudoCoinTableTier;
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

  // Idempotent-replay short-circuit, checked *before* any coin-stake side
  // effect: a retried create_match (same idempotencyKey) must return the
  // original match without ever re-debiting an entry fee it already
  // charged on its first successful call.
  const existingCommand = await store.read(
    environment,
    async (state) =>
      state.commands.find(
        (c) => c.commandType === "create_match" && c.idempotencyKey === input.idempotencyKey,
      ) ?? null,
  );
  if (existingCommand) {
    const replay = await store.transact(environment, async (state) => {
      const row = state.matches.find((m) => m.matchId === existingCommand.matchId);
      if (!row) throw new LudoMatchNotFoundError(existingCommand.matchId);
      return { matchState: publicStateFor(state, row), idempotent: true };
    });
    await publishMatchView(store, environment, replay.matchState, dependencies);
    return replay;
  }

  const matchId = randomUUID();
  let coinStake: CoinStakeTerms | null = null;
  if (input.coinTier) {
    const economyConfig = dependencies.economyConfig ?? getEconomyConfig();
    coinStake = resolveCoinStakeTerms(economyConfig, input.coinTier, input.seats);
    // Rejects on insufficient balance before anything else touches the
    // ludo store, per this task's Context/Decisions ("a player with
    // insufficient balance must be rejected before the match is created,
    // not mid-match").
    await debitCoinStakeEntry(
      dependencies,
      environment,
      matchId,
      input.subject,
      coinStake.entryFee,
    );
    await requireEconomyStore(dependencies).createEscrow(environment, {
      matchId,
      tier: coinStake.tier,
      pot: coinStake.pot,
      rake: coinStake.rake,
      createdAt: new Date().toISOString(),
    });
  }

  try {
    const result = await store.transact(environment, async (state) => {
      // Re-check idempotency inside the transaction, covering the (narrow,
      // pre-existing) race window between the read above and this write —
      // see `debitCoinStakeEntry`'s idempotency key, which is safe to leave
      // already-applied here: a raced duplicate returns the winner's match
      // and never re-debits.
      const raced = state.commands.find(
        (c) => c.commandType === "create_match" && c.idempotencyKey === input.idempotencyKey,
      );
      if (raced) {
        const row = state.matches.find((m) => m.matchId === raced.matchId);
        if (!row) throw new LudoMatchNotFoundError(raced.matchId);
        return { matchState: publicStateFor(state, row), idempotent: true };
      }

      const now = new Date().toISOString();
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
  } catch (cause) {
    if (coinStake) {
      await rollbackCoinStakeEntry(
        dependencies,
        environment,
        matchId,
        input.subject,
        coinStake.entryFee,
      );
    }
    throw cause;
  }
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
  // A coin-stake match is detected server-side from its escrow row — never
  // from a client-supplied flag — so a join can never be tricked into
  // skipping (or double-charging) the entry fee. Skipped for a bot-fill
  // join (`input.bot` set): bots never hold a wallet, so matchmaking never
  // bot-fills a coin-stake table's remaining seats (see
  // `matchmaking-service.ts`'s tier-aware grouping).
  let coinEntryFee: number | null = null;
  if (input.bot === undefined) {
    const alreadyJoined = await store.read(
      environment,
      async (state) =>
        state.commands.find(
          (c) => c.matchId === input.matchId && c.idempotencyKey === input.idempotencyKey,
        ) ?? null,
    );
    if (!alreadyJoined) {
      const economyStore = dependencies.economyStore;
      const escrow = economyStore ? await economyStore.getEscrow(environment, input.matchId) : null;
      if (escrow && escrow.status === "held") {
        const seatCount = await store.read(environment, async (state) => {
          const row = state.matches.find((m) => m.matchId === input.matchId);
          if (!row) throw new LudoMatchNotFoundError(input.matchId);
          return row.seatCount;
        });
        const entryFee = Math.floor(escrow.pot / seatCount);
        await debitCoinStakeEntry(
          dependencies,
          environment,
          input.matchId,
          input.subject,
          entryFee,
        );
        coinEntryFee = entryFee;
      }
    }
  }

  try {
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
  } catch (cause) {
    if (coinEntryFee !== null) {
      await rollbackCoinStakeEntry(
        dependencies,
        environment,
        input.matchId,
        input.subject,
        coinEntryFee,
      );
    }
    throw cause;
  }
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
  await settleCoinStakeMatch(store, environment, result.matchState, dependencies);
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
  await settleCoinStakeMatch(store, environment, result.matchState, dependencies);
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
  dependencies: LudoServiceDependencies = {},
): Promise<{ matchState: WireMatchState }> {
  const result = await store.transact(environment, async (state) => {
    const row = state.matches.find((m) => m.matchId === matchId);
    if (!row) throw new LudoMatchNotFoundError(matchId);
    const playerRows = state.players.filter((p) => p.matchId === matchId);
    const seat = playerRows.find((p) => p.subject === subject)?.seat;
    if (seat === undefined) throw new LudoForbiddenSeatError();

    const now = new Date().toISOString();
    applyLazyTimeout(state, row, playerRows, now);

    return { matchState: publicStateFor(state, row) };
  });
  // A poll can be the first thing to observe a lazily-applied timeout, so
  // it must also be able to trigger a coin-stake match's refund/payout —
  // see `settleCoinStakeMatch`'s escrow-status idempotency guard, which
  // makes this safe to call from every observer of a status change.
  await settleCoinStakeMatch(store, environment, result.matchState, dependencies);
  return result;
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
  dependencies: LudoServiceDependencies = {},
): Promise<{ matchView: LudoMatchView }> {
  const { matchState } = await getMatchState(store, environment, subject, matchId, dependencies);
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
