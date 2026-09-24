/// An append-only event log for a Ludo match, plus a pure [replay] function
/// that reproduces `applyMove`'s result exactly from a recorded log.
library;

import 'ludo_config.dart';
import 'ludo_engine.dart';
import 'ludo_models.dart';

/// Base type for every event `ludo_engine.dart` can emit. Sealed so a
/// `switch` over event types is exhaustiveness-checked by the analyzer.
sealed class LudoReplayEvent {
  const LudoReplayEvent();

  Map<String, Object?> toJson();

  static LudoReplayEvent fromJson(Map<String, Object?> json) {
    final type = json['type'];
    return switch (type) {
      'diceRolled' => LudoDiceRolledEvent.fromJson(json),
      'tokenMoved' => LudoTokenMovedEvent.fromJson(json),
      'tokenCaptured' => LudoTokenCapturedEvent.fromJson(json),
      'tokenFinished' => LudoTokenFinishedEvent.fromJson(json),
      'turnForfeited' => LudoTurnForfeitedEvent.fromJson(json),
      'matchFinished' => LudoMatchFinishedEvent.fromJson(json),
      _ => throw FormatException('Unknown ludo replay event type: $type'),
    };
  }
}

final class LudoDiceRolledEvent extends LudoReplayEvent {
  const LudoDiceRolledEvent({required this.seat, required this.roll});
  final int seat;
  final int roll;

  @override
  Map<String, Object?> toJson() => {
    'type': 'diceRolled',
    'seat': seat,
    'roll': roll,
  };

  static LudoDiceRolledEvent fromJson(Map<String, Object?> json) =>
      LudoDiceRolledEvent(seat: json['seat'] as int, roll: json['roll'] as int);
}

final class LudoTokenMovedEvent extends LudoReplayEvent {
  const LudoTokenMovedEvent({
    required this.seat,
    required this.tokenId,
    required this.from,
    required this.to,
  });
  final int seat;
  final int tokenId;
  final int from;
  final int to;

  @override
  Map<String, Object?> toJson() => {
    'type': 'tokenMoved',
    'seat': seat,
    'token_id': tokenId,
    'from': from,
    'to': to,
  };

  static LudoTokenMovedEvent fromJson(Map<String, Object?> json) =>
      LudoTokenMovedEvent(
        seat: json['seat'] as int,
        tokenId: json['token_id'] as int,
        from: json['from'] as int,
        to: json['to'] as int,
      );
}

final class LudoTokenCapturedEvent extends LudoReplayEvent {
  const LudoTokenCapturedEvent({
    required this.seat,
    required this.tokenId,
    required this.byseat,
  });

  /// Seat whose token was sent back to the yard.
  final int seat;
  final int tokenId;

  /// Seat that performed the capture.
  final int byseat;

  @override
  Map<String, Object?> toJson() => {
    'type': 'tokenCaptured',
    'seat': seat,
    'token_id': tokenId,
    'by_seat': byseat,
  };

  static LudoTokenCapturedEvent fromJson(Map<String, Object?> json) =>
      LudoTokenCapturedEvent(
        seat: json['seat'] as int,
        tokenId: json['token_id'] as int,
        byseat: json['by_seat'] as int,
      );
}

final class LudoTokenFinishedEvent extends LudoReplayEvent {
  const LudoTokenFinishedEvent({required this.seat, required this.tokenId});
  final int seat;
  final int tokenId;

  @override
  Map<String, Object?> toJson() => {
    'type': 'tokenFinished',
    'seat': seat,
    'token_id': tokenId,
  };

  static LudoTokenFinishedEvent fromJson(Map<String, Object?> json) =>
      LudoTokenFinishedEvent(
        seat: json['seat'] as int,
        tokenId: json['token_id'] as int,
      );
}

final class LudoTurnForfeitedEvent extends LudoReplayEvent {
  const LudoTurnForfeitedEvent({required this.seat, required this.reason});
  final int seat;

  /// `'three-consecutive-sixes'` or `'no-legal-move'`.
  final String reason;

  @override
  Map<String, Object?> toJson() => {
    'type': 'turnForfeited',
    'seat': seat,
    'reason': reason,
  };

  static LudoTurnForfeitedEvent fromJson(Map<String, Object?> json) =>
      LudoTurnForfeitedEvent(
        seat: json['seat'] as int,
        reason: json['reason'] as String,
      );
}

final class LudoMatchFinishedEvent extends LudoReplayEvent {
  const LudoMatchFinishedEvent({required Iterable<int> winnerOrder})
    : winnerOrder = winnerOrder;
  final Iterable<int> winnerOrder;

  @override
  Map<String, Object?> toJson() => {
    'type': 'matchFinished',
    'winner_order': winnerOrder.toList(),
  };

  static LudoMatchFinishedEvent fromJson(Map<String, Object?> json) =>
      LudoMatchFinishedEvent(
        winnerOrder: (json['winner_order'] as List).cast<int>(),
      );
}

/// Replays a recorded event log against a fresh match started from
/// [ruleset] and [initialPlayers], reproducing [applyMove]'s result exactly
/// (byte-for-byte identical final state) by re-driving the real engine
/// functions with the recorded dice rolls and move choices, rather than by
/// re-deriving state from the events directly.
///
/// [initialPlayers] must be the same players (seats, colors, subjects) the
/// log was originally produced from — the event log itself only records
/// what happened during play (rolls, moves, captures), not the starting
/// roster, since that is match setup rather than a rules-engine concern.
/// For Quick, [initialPlayers] must already reflect the pre-released
/// starting placement (see `LudoMatchState.initial`); this function does
/// not apply it itself.
///
/// Task 12g decision: no new event type was needed to replay
/// [LudoWinCondition.oneHomeAndOneCapture] (Quick's win condition)
/// faithfully. Re-driving the real [rollDice]/[applyMove] functions (as
/// this function already does, rather than re-deriving state from the
/// event log directly) naturally reconstructs each player's
/// `captureCount`/`finishedCount` move-by-move, so the win check inside
/// `applyMove` fires at the exact same moment on replay as it did live —
/// the existing `tokenFinished`/`tokenCaptured`/`matchFinished` events
/// already carry everything needed.
LudoMatchState replay(
  Iterable<LudoReplayEvent> events, {
  required LudoRuleset ruleset,
  required List<LudoPlayerState> initialPlayers,
}) {
  var state = LudoMatchState(
    ruleset: ruleset,
    players: initialPlayers,
    currentPlayerIndex: 0,
    phase: LudoMatchPhase.awaitingRoll,
  );
  final log = events.toList();
  var index = 0;
  while (index < log.length) {
    final event = log[index];
    if (event is! LudoDiceRolledEvent) {
      // Defensive: every turn starts with a diceRolled event; skip anything
      // unexpected rather than throwing, so a partial/foreign log can still
      // be replayed as far as possible.
      index++;
      continue;
    }
    final rollResult = rollDice(state, ScriptedDiceSource([event.roll]));
    state = rollResult.state;
    index++;

    // A move that captures emits its `tokenCaptured` event(s) *before* the
    // `tokenMoved` event that triggered them (see `applyMove` in
    // `ludo_engine.dart`), so skip past any of those before checking
    // whether a move follows this roll.
    while (index < log.length && log[index] is LudoTokenCapturedEvent) {
      index++;
    }

    final next = index < log.length ? log[index] : null;
    if (next is LudoTokenMovedEvent) {
      final moveResult = applyMove(state, next.tokenId);
      state = moveResult.state;
      index++;
      // Skip the capture/finished/matchFinished events this move itself
      // regenerated; they are not separately replayed.
      while (index < log.length && log[index] is! LudoDiceRolledEvent) {
        index++;
      }
    } else {
      // rollDice already resolved a turnForfeited or matchFinished event on
      // its own; skip past it.
      while (index < log.length &&
          (log[index] is LudoTurnForfeitedEvent ||
              log[index] is LudoMatchFinishedEvent)) {
        index++;
      }
    }
  }
  return state;
}
