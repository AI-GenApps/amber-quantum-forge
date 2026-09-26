/// Turn-timeout enforcement (task 19): pure functions layered on top of the
/// task 17 engine, independent of `LudoStore` so they are unit-testable in
/// isolation (see `timeout.test.ts`).
///
/// This is deliberately *not* folded into `engine.ts`'s pure gameplay
/// functions: forfeiture/abandonment are server-only maintenance concerns
/// that have no Dart-engine counterpart (the Dart `ludo_rules` package is
/// replayed for parity against roll/move fixtures only — see `engine.ts`'s
/// file header), so introducing them there would risk the parity mechanism
/// treating them as engine drift. Instead this module consumes the engine's
/// `LudoMatchState` and produces a new one using its own turn-advance logic,
/// which additionally skips forfeited seats (something `engine.ts`'s
/// internal `advanceTurn` has no concept of).
import { advanceToNextUnskippedSeat, currentPlayer } from "./engine";
import type { LudoMatchState, LudoReplayEvent } from "./engine-model";

/** How long a seated player has to roll or move before their turn times out. */
export const LUDO_TURN_TIMEOUT_MS = 30_000;

/** Consecutive missed deadlines before a seat is forfeited. */
export const LUDO_FORFEIT_MISS_THRESHOLD = 3;

/** Computes the ISO turn deadline `LUDO_TURN_TIMEOUT_MS` after `nowIso`. */
export function computeTurnDeadline(nowIso: string): string {
  return new Date(Date.parse(nowIso) + LUDO_TURN_TIMEOUT_MS).toISOString();
}

export interface LudoTimeoutContext {
  /** The reconstructed engine state, as of right now (before any timeout is applied). */
  readonly matchState: LudoMatchState;
  /** Current `ludo_players.miss_count` for every seat, indexed by seat number. */
  readonly missCounts: readonly number[];
  /** `ludo_matches.turn_deadline_at`, or `null` if no deadline is currently tracked. */
  readonly deadlineAt: string | null;
  readonly now: Date;
  /**
   * Seats that must never be forfeited on crossing
   * `LUDO_FORFEIT_MISS_THRESHOLD` (task 20): the caller (`service.ts`)
   * passes every seat of a matchmaking-origin match here so a
   * disconnecting/stalled player is bot-filled instead of forfeited. A
   * seat in this set that crosses the threshold has its miss count reset
   * to 0 (so it is not immediately re-flagged) and is reported in
   * `botFilledSeats` instead of `forfeitedSeats`; the match continues
   * with that seat still an active participant in turn rotation. Omitted
   * (or empty) for a direct/room-origin match, which keeps task 19's
   * existing forfeit-on-three-misses behavior unchanged.
   */
  readonly botFillEligibleSeats?: ReadonlySet<number>;
}

export interface LudoTimeoutOutcome {
  /** Whether `deadlineAt` had actually elapsed as of `now` (a no-op result otherwise). */
  readonly timedOut: boolean;
  readonly matchState: LudoMatchState;
  readonly events: readonly LudoReplayEvent[];
  /** Updated per-seat miss counts (only ever changed for the seat whose turn just timed out). */
  readonly missCounts: readonly number[];
  /** Seats forfeited as a *result* of this call (usually empty or a single seat). */
  readonly forfeitedSeats: readonly number[];
  /** Seats bot-filled (task 20) as a *result* of this call, in place of forfeiture. */
  readonly botFilledSeats: readonly number[];
  readonly abandoned: boolean;
}

function noop(ctx: LudoTimeoutContext): LudoTimeoutOutcome {
  return {
    timedOut: false,
    matchState: ctx.matchState,
    events: [],
    missCounts: ctx.missCounts,
    forfeitedSeats: [],
    botFilledSeats: [],
    abandoned: false,
  };
}

/**
 * Applies the `turn_timed_out` transition described in this task's
 * Context/Decisions if — and only if — `ctx.deadlineAt` has actually
 * elapsed as of `ctx.now`. Both the lazy per-request check (`service.ts`'s
 * `applyLazyTimeout`) and the explicit `claim_timeout` command drive this
 * same function, so their results are byte-for-byte identical and the
 * function is idempotent: calling it again immediately afterwards (deadline
 * freshly reset, or the match no longer active) is a no-op.
 */
export function applyTimeoutIfExpired(ctx: LudoTimeoutContext): LudoTimeoutOutcome {
  if (ctx.matchState.phase === "finished") return noop(ctx);
  if (ctx.deadlineAt === null) return noop(ctx);
  if (ctx.now.getTime() < Date.parse(ctx.deadlineAt)) return noop(ctx);

  const timedOutSeat = currentPlayer(ctx.matchState).seat;
  const events: LudoReplayEvent[] = [{ type: "turnTimedOut", seat: timedOutSeat }];
  const missCounts = [...ctx.missCounts];
  missCounts[timedOutSeat] = (missCounts[timedOutSeat] ?? 0) + 1;

  const forfeitedSeats: number[] = [];
  const botFilledSeats: number[] = [];
  for (const player of ctx.matchState.players) {
    if ((missCounts[player.seat] ?? 0) >= LUDO_FORFEIT_MISS_THRESHOLD) {
      if (ctx.botFillEligibleSeats?.has(player.seat)) {
        botFilledSeats.push(player.seat);
        // Reset so the seat is not immediately re-flagged next turn; it
        // must miss another full streak before this branch fires again.
        missCounts[player.seat] = 0;
      } else {
        forfeitedSeats.push(player.seat);
      }
    }
  }
  const newlyForfeited = forfeitedSeats.includes(timedOutSeat) ? [timedOutSeat] : [];
  for (const seat of newlyForfeited) {
    events.push({ type: "seatForfeited", seat });
  }
  const newlyBotFilled = botFilledSeats.includes(timedOutSeat) ? [timedOutSeat] : [];

  const inactive = new Set<number>([...ctx.matchState.winnerOrder, ...forfeitedSeats]);
  const remainingActive = ctx.matchState.players.filter((p) => !inactive.has(p.seat));

  let matchState = ctx.matchState;
  let abandoned = false;

  if (remainingActive.length === 0) {
    abandoned = true;
    matchState = { ...matchState, phase: "finished", currentRoll: null };
    events.push({ type: "matchAbandoned" });
  } else if (remainingActive.length === 1) {
    const winnerSeat = remainingActive[0].seat;
    const losingSeatsInOrder = forfeitedSeats.filter((s) => s !== winnerSeat).sort((a, b) => a - b);
    const winnerOrder = [...ctx.matchState.winnerOrder, winnerSeat, ...losingSeatsInOrder];
    matchState = { ...matchState, phase: "finished", currentRoll: null, winnerOrder };
    events.push({ type: "matchFinished", winnerOrder });
  } else {
    matchState = advanceToNextUnskippedSeat(matchState, inactive);
  }

  return {
    timedOut: true,
    matchState,
    events,
    missCounts,
    forfeitedSeats: newlyForfeited,
    botFilledSeats: newlyBotFilled,
    abandoned,
  };
}
