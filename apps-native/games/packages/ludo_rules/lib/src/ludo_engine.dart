/// Pure functions implementing Ludo movement, turns, dice and capture.
///
/// Nothing here touches `dart:io`, Flutter, Flame or any device API — see
/// task 01's acceptance criteria. Dice are always drawn through an injected
/// [LudoDiceSource]; game logic never calls `dart:math`'s global `Random()`
/// directly, since the server is RNG-authoritative online (task 17) and
/// both local play and cross-runtime replay fixtures need to drive the
/// dice deterministically.
library;

import 'ludo_board.dart';
import 'ludo_models.dart';
import 'ludo_replay.dart';

/// Injectable source of die rolls (each call returns an integer `1..6`).
abstract interface class LudoDiceSource {
  int rollDie();
}

/// A [LudoDiceSource] backed by a caller-supplied generator function, for
/// callers that already own a PRNG (e.g. wrapping
/// `platform_core`'s `DeterministicRng.nextInt(6) + 1`).
final class FunctionDiceSource implements LudoDiceSource {
  FunctionDiceSource(this._next);
  final int Function() _next;

  @override
  int rollDie() {
    final value = _next();
    if (value < 1 || value > 6) {
      throw StateError('Dice function returned out-of-range value: $value');
    }
    return value;
  }
}

/// A [LudoDiceSource] that replays a fixed, pre-recorded sequence of rolls.
/// Used by [replay] and the replay-fixture CLI so a match can be reproduced
/// deterministically from a recorded event log or fixture file.
final class ScriptedDiceSource implements LudoDiceSource {
  ScriptedDiceSource(Iterable<int> rolls) : _rolls = List.of(rolls);
  final List<int> _rolls;
  var _index = 0;

  @override
  int rollDie() {
    if (_index >= _rolls.length) {
      throw StateError('ScriptedDiceSource exhausted after $_index rolls');
    }
    final value = _rolls[_index];
    _index++;
    if (value < 1 || value > 6) {
      throw StateError('Scripted roll out of range: $value');
    }
    return value;
  }
}

const _board = LudoBoard();

/// Result of [rollDice]: the resulting state, the value actually rolled,
/// and any events produced (always at least a `diceRolled` event; possibly
/// followed by a `turnForfeited`/`matchFinished` event when the roll could
/// not be played).
final class LudoRollResult {
  const LudoRollResult({
    required this.state,
    required this.roll,
    required this.events,
  });
  final LudoMatchState state;
  final int roll;
  final List<LudoReplayEvent> events;
}

/// Result of [applyMove]: the resulting state and the events it produced
/// (`tokenMoved`, plus any `tokenCaptured` / `tokenFinished` /
/// `matchFinished`).
final class LudoMoveResult {
  const LudoMoveResult({required this.state, required this.events});
  final LudoMatchState state;
  final List<LudoReplayEvent> events;
}

/// Rolls the dice for the current player and resolves everything that
/// depends purely on the rolled value:
///
/// - A third consecutive 6 forfeits the turn without applying that roll.
/// - If the roll (1st/2nd six, or 1-5) has no legal move at all, the turn
///   auto-passes without granting a bonus roll — a six that cannot be
///   played is treated like any other unplayable roll, so the player
///   always ends up either with a legal move to make or a passed turn,
///   never stuck.
/// - Otherwise the match moves into [LudoMatchPhase.awaitingMove] and the
///   caller must follow up with [applyMove].
LudoRollResult rollDice(LudoMatchState state, LudoDiceSource diceSource) {
  if (state.phase != LudoMatchPhase.awaitingRoll) {
    throw StateError('rollDice called outside of awaitingRoll phase');
  }
  final actingSeat = state.currentPlayer.seat;
  final roll = diceSource.rollDie();
  final events = <LudoReplayEvent>[
    LudoDiceRolledEvent(seat: actingSeat, roll: roll),
  ];

  if (roll == 6 && state.consecutiveSixes == 2) {
    final next = _advanceTurn(state.copyWith(consecutiveSixes: 0));
    events.add(
      LudoTurnForfeitedEvent(
        seat: actingSeat,
        reason: 'three-consecutive-sixes',
      ),
    );
    if (next.phase == LudoMatchPhase.finished) {
      events.add(LudoMatchFinishedEvent(winnerOrder: next.winnerOrder));
    }
    return LudoRollResult(state: next, roll: roll, events: events);
  }

  final consecutiveSixes = roll == 6 ? state.consecutiveSixes + 1 : 0;
  final rolledState = state.copyWith(
    currentRoll: roll,
    consecutiveSixes: consecutiveSixes,
  );

  if (legalMoves(rolledState).isEmpty) {
    final next = _advanceTurn(rolledState.copyWith(currentRoll: null));
    events.add(
      LudoTurnForfeitedEvent(seat: actingSeat, reason: 'no-legal-move'),
    );
    if (next.phase == LudoMatchPhase.finished) {
      events.add(LudoMatchFinishedEvent(winnerOrder: next.winnerOrder));
    }
    return LudoRollResult(state: next, roll: roll, events: events);
  }

  return LudoRollResult(
    state: rolledState.copyWith(phase: LudoMatchPhase.awaitingMove),
    roll: roll,
    events: events,
  );
}

/// The token ids the current player may legally move, given
/// `state.currentRoll`. Empty (and only ever queried) while a roll is
/// pending; returns an empty list if no roll is pending.
List<int> legalMoves(LudoMatchState state) {
  final roll = state.currentRoll;
  if (roll == null) return const [];
  final player = state.currentPlayer;
  final moves = <int>[];
  for (final token in player.tokens) {
    final tokenState = token.state(state.ruleset);
    switch (tokenState) {
      case LudoTokenState.finished:
        continue;
      case LudoTokenState.yard:
        if (state.ruleset.requiresYardExitRoll && roll == 6) {
          moves.add(token.id);
        }
      case LudoTokenState.active:
        final newPosition = token.pathPosition + roll;
        if (newPosition <= state.ruleset.pathLength) {
          moves.add(token.id);
        }
    }
  }
  return List.unmodifiable(moves);
}

/// Applies moving token [tokenId] for `state.currentRoll`, handling
/// yard-exit, capture (with bonus roll), home-arrival (with bonus roll),
/// the extra-roll-on-6, and turn advancement (skipping players who have
/// already finished all their tokens). Throws if [tokenId] is not currently
/// legal (see [legalMoves]).
LudoMoveResult applyMove(LudoMatchState state, int tokenId) {
  if (state.phase != LudoMatchPhase.awaitingMove) {
    throw StateError('applyMove called outside of awaitingMove phase');
  }
  final roll = state.currentRoll;
  if (roll == null) throw StateError('No pending roll to apply');
  if (!legalMoves(state).contains(tokenId)) {
    throw ArgumentError.value(
      tokenId,
      'tokenId',
      'Not a legal move for roll $roll',
    );
  }

  final playerIndex = state.currentPlayerIndex;
  final player = state.players[playerIndex];
  final tokenIndex = player.tokens.indexWhere((t) => t.id == tokenId);
  final token = player.tokens[tokenIndex];
  final wasYard = token.state(state.ruleset) == LudoTokenState.yard;
  final fromPosition = wasYard ? ludoYardPathPosition : token.pathPosition;
  final newPosition = wasYard ? 0 : token.pathPosition + roll;

  final events = <LudoReplayEvent>[];
  final players = List<LudoPlayerState>.of(state.players);
  var bonusRoll = roll == 6;
  final finished = newPosition == state.ruleset.pathLength;

  if (!finished && _board.isOnSharedTrack(state.ruleset, newPosition)) {
    final landingCell = _board.absoluteCellOf(player.color, newPosition);
    if (!_board.isSafeCell(landingCell)) {
      for (var otherIndex = 0; otherIndex < players.length; otherIndex++) {
        if (otherIndex == playerIndex) continue;
        final other = players[otherIndex];
        final kept = <LudoToken>[];
        final captured = <LudoToken>[];
        for (final otherToken in other.tokens) {
          final onSameCell =
              otherToken.state(state.ruleset) == LudoTokenState.active &&
              _board.isOnSharedTrack(state.ruleset, otherToken.pathPosition) &&
              _board.absoluteCellOf(other.color, otherToken.pathPosition) ==
                  landingCell;
          (onSameCell ? captured : kept).add(otherToken);
        }
        if (captured.isEmpty) continue;
        // Classic sends a captured token back to the yard (it needs a 6 to
        // re-enter). Quick has no yard state at all — a captured token
        // simply resets to its own start square on the shared track,
        // mirroring how every token began the match pre-placed.
        final resetPosition = state.ruleset.requiresYardExitRoll
            ? ludoYardPathPosition
            : 0;
        final sentHome = [
          for (final t in captured)
            LudoToken(id: t.id, pathPosition: resetPosition),
        ];
        final rebuilt = [...kept, ...sentHome]
          ..sort((a, b) => a.id.compareTo(b.id));
        players[otherIndex] = other.copyWith(tokens: rebuilt);
        bonusRoll = true;
        for (final t in captured) {
          events.add(
            LudoTokenCapturedEvent(
              seat: other.seat,
              tokenId: t.id,
              byseat: player.seat,
            ),
          );
        }
      }
    }
  }

  final updatedTokens = List<LudoToken>.of(player.tokens);
  updatedTokens[tokenIndex] = LudoToken(id: tokenId, pathPosition: newPosition);
  players[playerIndex] = player.copyWith(tokens: updatedTokens);

  events.add(
    LudoTokenMovedEvent(
      seat: player.seat,
      tokenId: tokenId,
      from: fromPosition,
      to: newPosition,
    ),
  );

  var winnerOrder = state.winnerOrder;
  if (finished) {
    events.add(LudoTokenFinishedEvent(seat: player.seat, tokenId: tokenId));
    bonusRoll = true;
    if (players[playerIndex].allFinished(state.ruleset) &&
        !winnerOrder.contains(player.seat)) {
      winnerOrder = [...winnerOrder, player.seat];
    }
  }

  var next = state.copyWith(
    players: players,
    winnerOrder: winnerOrder,
    currentRoll: null,
  );

  if (winnerOrder.length >= state.players.length - 1) {
    next = next.copyWith(phase: LudoMatchPhase.finished);
    events.add(LudoMatchFinishedEvent(winnerOrder: winnerOrder));
    return LudoMoveResult(state: next, events: events);
  }

  if (bonusRoll) {
    next = next.copyWith(
      phase: LudoMatchPhase.awaitingRoll,
      // A capture/home-arrival bonus on a non-six roll does not extend the
      // consecutive-sixes streak; only rolling a six does (already tracked
      // by rollDice).
      consecutiveSixes: roll == 6 ? state.consecutiveSixes : 0,
    );
  } else {
    next = _advanceTurn(next);
  }

  return LudoMoveResult(state: next, events: events);
}

/// Whether the match has concluded.
bool isTerminal(LudoMatchState state) => state.phase == LudoMatchPhase.finished;

/// Advances to the next player who has not yet finished all their tokens,
/// resetting per-turn state. If only one (or zero) unfinished players
/// remain, the match ends instead (that sole remaining player is
/// automatically last place).
LudoMatchState _advanceTurn(LudoMatchState state) {
  if (state.winnerOrder.length >= state.players.length - 1) {
    return state.copyWith(phase: LudoMatchPhase.finished, currentRoll: null);
  }
  var index = state.currentPlayerIndex;
  for (var i = 0; i < state.players.length; i++) {
    index = (index + 1) % state.players.length;
    final seat = state.players[index].seat;
    if (!state.winnerOrder.contains(seat)) {
      return state.copyWith(
        currentPlayerIndex: index,
        phase: LudoMatchPhase.awaitingRoll,
        currentRoll: null,
        consecutiveSixes: 0,
      );
    }
  }
  return state.copyWith(phase: LudoMatchPhase.finished, currentRoll: null);
}
