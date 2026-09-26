/// TypeScript port of the `ludo_rules` Dart engine
/// (`apps-native/games/packages/ludo_rules/lib/src/ludo_board.dart`,
/// `ludo_config.dart`, `ludo_models.dart`, `ludo_engine.dart`,
/// `ludo_replay.dart`).
///
/// This is the server authority engine: pure functions only, no I/O, no
/// `Math.random()` — dice are always drawn through an injectable
/// `LudoDiceSource` (see `dice.ts`), because the server is RNG-authoritative
/// online and both tests and cross-runtime parity fixtures need to drive the
/// dice deterministically.
///
/// The frozen numeric constants (track length, home length, safe indices,
/// yard-exit roll, Quick-mode deltas) are copied verbatim from the Dart
/// source rather than re-derived, per task 17's Context/Decisions — this is
/// the single point where they could drift, so any change here must be
/// mirrored in `ludo_config.dart`/`ludo_board.dart` and re-verified against
/// `parity.test.ts` and `bun run games:ludo:parity`.
///
/// Board geometry, ruleset config, match-state models, and replay-event
/// (de)serialization live in `engine-model.ts` (split out purely to stay
/// under the repo's max-lines-per-file limit); this file re-exports all of
/// it so callers only need `from "./engine"`.
import type { LudoDiceSource } from "./dice";
import {
  absoluteCellOf,
  allFinished,
  currentPlayer,
  finishedCount,
  hasCaptured,
  hasHomeToken,
  isOnSharedTrack,
  isSafeCell,
  LUDO_YARD_PATH_POSITION,
  type LudoMatchState,
  type LudoPlayerState,
  type LudoReplayEvent,
  type LudoRuleset,
  type LudoToken,
  pathLength as pathLengthOf,
  tokenState,
  totalProgress,
} from "./engine-model";

export * from "./engine-model";

// ---------------------------------------------------------------------------
// Pure engine functions (`ludo_engine.dart`).
// ---------------------------------------------------------------------------

export interface LudoRollResult {
  readonly state: LudoMatchState;
  readonly roll: number;
  readonly events: readonly LudoReplayEvent[];
}

export interface LudoMoveResult {
  readonly state: LudoMatchState;
  readonly events: readonly LudoReplayEvent[];
}

/**
 * Rolls the dice for the current player and resolves everything that depends
 * purely on the rolled value (third-six forfeit, no-legal-move auto-pass, or
 * transition into `awaitingMove`). See `ludo_engine.dart`'s `rollDice`.
 */
export function rollDice(state: LudoMatchState, diceSource: LudoDiceSource): LudoRollResult {
  if (state.phase !== "awaitingRoll") {
    throw new Error("rollDice called outside of awaitingRoll phase");
  }
  const actingSeat = currentPlayer(state).seat;
  const roll = diceSource.rollDie();
  const events: LudoReplayEvent[] = [{ type: "diceRolled", seat: actingSeat, roll }];

  if (roll === 6 && state.consecutiveSixes === 2) {
    const next = advanceTurn({ ...state, consecutiveSixes: 0 });
    events.push({ type: "turnForfeited", seat: actingSeat, reason: "three-consecutive-sixes" });
    if (next.phase === "finished") {
      events.push({ type: "matchFinished", winnerOrder: next.winnerOrder });
    }
    return { state: next, roll, events };
  }

  const consecutiveSixes = roll === 6 ? state.consecutiveSixes + 1 : 0;
  const rolledState: LudoMatchState = { ...state, currentRoll: roll, consecutiveSixes };

  if (legalMoves(rolledState).length === 0) {
    const next = advanceTurn({ ...rolledState, currentRoll: null });
    events.push({ type: "turnForfeited", seat: actingSeat, reason: "no-legal-move" });
    if (next.phase === "finished") {
      events.push({ type: "matchFinished", winnerOrder: next.winnerOrder });
    }
    return { state: next, roll, events };
  }

  return { state: { ...rolledState, phase: "awaitingMove" }, roll, events };
}

/** The token ids the current player may legally move, given `state.currentRoll`. */
export function legalMoves(state: LudoMatchState): readonly number[] {
  const roll = state.currentRoll;
  if (roll == null) return [];
  const player = currentPlayer(state);
  const moves: number[] = [];
  for (const token of player.tokens) {
    const st = tokenState(token, state.ruleset);
    if (st === "finished") continue;
    if (st === "yard") {
      if (state.ruleset.requiresYardExitRoll && roll === 6) moves.push(token.id);
      continue;
    }
    const newPosition = token.pathPosition + roll;
    if (newPosition <= pathLengthOf(state.ruleset)) moves.push(token.id);
  }
  return moves;
}

/**
 * Applies moving token `tokenId` for `state.currentRoll`, handling yard-exit,
 * capture (with bonus roll), home-arrival (with bonus roll), the
 * extra-roll-on-6, and turn advancement. Throws if `tokenId` is not
 * currently legal (see `legalMoves`). See `ludo_engine.dart`'s `applyMove`.
 */
export function applyMove(state: LudoMatchState, tokenId: number): LudoMoveResult {
  if (state.phase !== "awaitingMove") {
    throw new Error("applyMove called outside of awaitingMove phase");
  }
  const roll = state.currentRoll;
  if (roll == null) throw new Error("No pending roll to apply");
  if (!legalMoves(state).includes(tokenId)) {
    throw new Error(`Not a legal move for roll ${roll}: tokenId ${tokenId}`);
  }

  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];
  const tokenIndex = player.tokens.findIndex((t) => t.id === tokenId);
  const token = player.tokens[tokenIndex];
  const wasYard = tokenState(token, state.ruleset) === "yard";
  const fromPosition = wasYard ? LUDO_YARD_PATH_POSITION : token.pathPosition;
  const newPosition = wasYard ? 0 : token.pathPosition + roll;

  const events: LudoReplayEvent[] = [];
  const players = state.players.map((p) => ({ ...p, tokens: [...p.tokens] }));
  let bonusRoll = roll === 6;
  const finished = newPosition === pathLengthOf(state.ruleset);
  let capturedCount = 0;

  if (!finished && isOnSharedTrack(state.ruleset, newPosition)) {
    const landingCell = absoluteCellOf(player.color, newPosition);
    if (!isSafeCell(landingCell)) {
      for (let otherIndex = 0; otherIndex < players.length; otherIndex++) {
        if (otherIndex === playerIndex) continue;
        const other = players[otherIndex];
        const kept: LudoToken[] = [];
        const captured: LudoToken[] = [];
        for (const otherToken of other.tokens) {
          const onSameCell =
            tokenState(otherToken, state.ruleset) === "active" &&
            isOnSharedTrack(state.ruleset, otherToken.pathPosition) &&
            absoluteCellOf(other.color, otherToken.pathPosition) === landingCell;
          (onSameCell ? captured : kept).push(otherToken);
        }
        if (captured.length === 0) continue;
        const resetPosition = state.ruleset.requiresYardExitRoll ? LUDO_YARD_PATH_POSITION : 0;
        const sentHome = captured.map((t) => ({ id: t.id, pathPosition: resetPosition }));
        const rebuilt = [...kept, ...sentHome].sort((a, b) => a.id - b.id);
        players[otherIndex] = { ...other, tokens: rebuilt };
        bonusRoll = true;
        capturedCount += captured.length;
        for (const t of captured) {
          events.push({
            type: "tokenCaptured",
            seat: other.seat,
            tokenId: t.id,
            byseat: player.seat,
          });
        }
      }
    }
  }

  const updatedTokens = [...player.tokens];
  updatedTokens[tokenIndex] = { id: tokenId, pathPosition: newPosition };
  players[playerIndex] = {
    ...player,
    tokens: updatedTokens,
    captureCount: player.captureCount + capturedCount,
  };

  events.push({
    type: "tokenMoved",
    seat: player.seat,
    tokenId,
    from: fromPosition,
    to: newPosition,
  });

  if (finished) {
    events.push({ type: "tokenFinished", seat: player.seat, tokenId });
    bonusRoll = true;
  }

  let winnerOrder = state.winnerOrder;
  let matchOver = false;
  if (state.ruleset.winCondition === "allTokensHome") {
    if (
      finished &&
      allFinished(players[playerIndex], state.ruleset) &&
      !winnerOrder.includes(player.seat)
    ) {
      winnerOrder = [...winnerOrder, player.seat];
    }
    matchOver = winnerOrder.length >= state.players.length - 1;
  } else {
    // oneHomeAndOneCapture (Quick). See the extensive comment in
    // `ludo_engine.dart`'s `applyMove` for the reasoning mirrored here.
    const acting = players[playerIndex];
    if (hasHomeToken(acting, state.ruleset) && hasCaptured(acting)) {
      const ranked = rankRemainingPlayers(withPlayers(state, players)).filter(
        (seat) => seat !== acting.seat,
      );
      winnerOrder = [acting.seat, ...ranked];
      matchOver = true;
    } else if (finished) {
      const stillMovable = players.filter((p) => !allFinished(p, state.ruleset));
      const deadlocked =
        stillMovable.length === 0 || (stillMovable.length === 1 && !hasCaptured(stillMovable[0]));
      if (deadlocked) {
        winnerOrder = rankRemainingPlayers(withPlayers(state, players));
        matchOver = true;
      }
    }
  }

  let next: LudoMatchState = { ...state, players, winnerOrder, currentRoll: null };

  if (matchOver) {
    next = { ...next, phase: "finished" };
    events.push({ type: "matchFinished", winnerOrder });
    return { state: next, events };
  }

  if (bonusRoll) {
    next = {
      ...next,
      phase: "awaitingRoll",
      consecutiveSixes: roll === 6 ? state.consecutiveSixes : 0,
    };
  } else {
    next = advanceTurn(next);
  }

  return { state: next, events };
}

/** Whether the match has concluded. */
export function isTerminal(state: LudoMatchState): boolean {
  return state.phase === "finished";
}

/**
 * Deterministically ranks every player not already in `state.winnerOrder`,
 * best first: more tokens finished, then more captures, then more total
 * progress, then lower seat. See `ludo_engine.dart`'s `rankRemainingPlayers`.
 */
export function rankRemainingPlayers(state: LudoMatchState): readonly number[] {
  const excluded = new Set(state.winnerOrder);
  const candidates = state.players.filter((p) => !excluded.has(p.seat));
  const sorted = [...candidates].sort((a, b) => {
    const finishedCompare = finishedCount(b, state.ruleset) - finishedCount(a, state.ruleset);
    if (finishedCompare !== 0) return finishedCompare;
    const captureCompare = b.captureCount - a.captureCount;
    if (captureCompare !== 0) return captureCompare;
    const progressCompare = totalProgress(b) - totalProgress(a);
    if (progressCompare !== 0) return progressCompare;
    return a.seat - b.seat;
  });
  return sorted.map((p) => p.seat);
}

/**
 * Advances to the next player who has not yet finished all their tokens,
 * resetting per-turn state. If only one (or zero) unfinished players remain,
 * the match ends instead. See `ludo_engine.dart`'s `_advanceTurn`.
 */
function advanceTurn(state: LudoMatchState): LudoMatchState {
  if (state.winnerOrder.length >= state.players.length - 1) {
    return { ...state, phase: "finished", currentRoll: null };
  }
  let index = state.currentPlayerIndex;
  for (let i = 0; i < state.players.length; i++) {
    index = (index + 1) % state.players.length;
    const seat = state.players[index].seat;
    if (!state.winnerOrder.includes(seat)) {
      return {
        ...state,
        currentPlayerIndex: index,
        phase: "awaitingRoll",
        currentRoll: null,
        consecutiveSixes: 0,
      };
    }
  }
  return { ...state, phase: "finished", currentRoll: null };
}

function withPlayers(state: LudoMatchState, players: readonly LudoPlayerState[]): LudoMatchState {
  return { ...state, players };
}

// ---------------------------------------------------------------------------
// Match creation/joining — pure functions only. This task's engine surface
// stops here: the transactional, store-backed createMatch/joinMatch/
// processCommand service is task 18's responsibility (see task 17's
// Context/Decisions). `applyJoin` operates on the plain roster of subjects
// that have joined so far (however task 18 chooses to persist that between
// requests); `createMatchState` (in `engine-model.ts`) turns a *full* roster
// into the actual playable starting `LudoMatchState`, mirroring
// `LudoMatchState.initial` in `ludo_models.dart`.
// ---------------------------------------------------------------------------

export const LUDO_MIN_SEATS = 2;
export const LUDO_MAX_SEATS = 4;

/**
 * Pure validation+append for a match's joining roster: throws if the match
 * is already full for `seats`, or if `subject` has already joined.
 */
export function applyJoin(
  subjects: readonly string[],
  subject: string,
  seats: number,
): readonly string[] {
  if (seats < LUDO_MIN_SEATS || seats > LUDO_MAX_SEATS) {
    throw new RangeError(`seats must be ${LUDO_MIN_SEATS}..${LUDO_MAX_SEATS}, got ${seats}`);
  }
  if (subjects.length >= seats) {
    throw new Error("Match is already full");
  }
  if (subjects.includes(subject)) {
    throw new Error(`Subject already joined: ${subject}`);
  }
  return [...subjects, subject];
}

// ---------------------------------------------------------------------------
// Event-log replay (`ludo_replay.dart`) — reproduces `applyMove`'s result
// exactly by re-driving the real engine functions with the recorded dice
// rolls and move choices, rather than re-deriving state from the events
// directly. Used by `parity.test.ts` (checked-in Dart fixtures) and the
// `games:ludo:parity` script (Dart-VM-generated event logs).
// ---------------------------------------------------------------------------

export function replay(
  events: readonly LudoReplayEvent[],
  params: { ruleset: LudoRuleset; initialPlayers: readonly LudoPlayerState[] },
): LudoMatchState {
  let state: LudoMatchState = {
    ruleset: params.ruleset,
    players: params.initialPlayers,
    currentPlayerIndex: 0,
    phase: "awaitingRoll",
    currentRoll: null,
    consecutiveSixes: 0,
    winnerOrder: [],
  };
  let index = 0;
  while (index < events.length) {
    const event = events[index];
    if (event.type !== "diceRolled") {
      index++;
      continue;
    }
    const rollResult = rollDice(state, { rollDie: () => event.roll });
    state = rollResult.state;
    index++;

    // A capturing move emits its `tokenCaptured` event(s) before the
    // `tokenMoved` event that triggered them; skip past those first.
    while (index < events.length && events[index].type === "tokenCaptured") {
      index++;
    }

    const next = index < events.length ? events[index] : undefined;
    if (next?.type === "tokenMoved") {
      const moveResult = applyMove(state, next.tokenId);
      state = moveResult.state;
      index++;
      // Skip the capture/finished/matchFinished events this move itself
      // regenerated; they are not separately replayed.
      while (index < events.length && events[index].type !== "diceRolled") {
        index++;
      }
    } else {
      while (
        index < events.length &&
        (events[index].type === "turnForfeited" || events[index].type === "matchFinished")
      ) {
        index++;
      }
    }
  }
  return state;
}
