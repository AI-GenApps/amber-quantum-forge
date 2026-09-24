/// Match state models for the ludo_rules engine.
library;

import 'ludo_board.dart';
import 'ludo_config.dart';

/// A token's derived play state.
enum LudoTokenState {
  /// Not yet in play (only possible when `ruleset.requiresYardExitRoll`).
  yard,

  /// On the shared track or in the private home stretch.
  active,

  /// Reached the end of the home stretch; done for the match.
  finished,
}

/// The phase of the current player's turn.
enum LudoMatchPhase {
  /// Waiting for [rollDice] to be called for the current player.
  awaitingRoll,

  /// A roll has been made and at least one legal move exists; waiting for
  /// [applyMove].
  awaitingMove,

  /// The match is over; see [LudoMatchState.winnerOrder].
  finished,
}

/// Sentinel marking a token that has not yet entered play.
const ludoYardPathPosition = -1;

/// A single player's token.
///
/// Player identity fields on [LudoPlayerState] carry only an opaque
/// `subject` and `seat` index — this package is pure rules logic and never
/// stores PII, a display name, or an avatar reference; the client attaches
/// presentation data separately.
final class LudoToken {
  const LudoToken({required this.id, required this.pathPosition});

  /// A token that has not yet left the yard.
  factory LudoToken.inYard(int id) =>
      LudoToken(id: id, pathPosition: ludoYardPathPosition);

  /// A token pre-placed directly on the shared track (used when
  /// `ruleset.requiresYardExitRoll` is false, e.g. Quick mode).
  factory LudoToken.onTrack(int id) => LudoToken(id: id, pathPosition: 0);

  /// Index of this token within its owning player, `0..tokensPerPlayer-1`.
  final int id;

  /// `-1` while in the yard; `0..ruleset.pathLength` while active or
  /// finished (`pathLength` itself means finished).
  final int pathPosition;

  LudoTokenState state(LudoRuleset ruleset) {
    if (pathPosition == ludoYardPathPosition) return LudoTokenState.yard;
    if (pathPosition >= ruleset.pathLength) return LudoTokenState.finished;
    return LudoTokenState.active;
  }

  Map<String, Object?> toJson() => {'id': id, 'path_position': pathPosition};

  static LudoToken fromJson(Map<String, Object?> json) {
    final id = json['id'];
    final pathPosition = json['path_position'];
    if (id is! int || pathPosition is! int) {
      throw const FormatException('Invalid ludo token');
    }
    return LudoToken(id: id, pathPosition: pathPosition);
  }

  @override
  bool operator ==(Object other) =>
      other is LudoToken &&
      other.id == id &&
      other.pathPosition == pathPosition;

  @override
  int get hashCode => Object.hash(id, pathPosition);

  @override
  String toString() => 'LudoToken(id: $id, pathPosition: $pathPosition)';
}

/// One player's seat, color and tokens.
final class LudoPlayerState {
  LudoPlayerState({
    required this.seat,
    required this.subject,
    required this.color,
    required Iterable<LudoToken> tokens,
    this.captureCount = 0,
  }) : tokens = List.unmodifiable(tokens);

  /// Turn-order seat index, `0..playerCount-1`.
  final int seat;

  /// Opaque identity string for this player (e.g. an account/guest id).
  /// Carries no PII and is never interpreted by this package.
  final String subject;

  final LudoColor color;
  final List<LudoToken> tokens;

  /// Number of opponent tokens this player has captured during the match
  /// so far (never decreases). Tracked for every ruleset, but only
  /// consumed by [LudoWinCondition.oneHomeAndOneCapture] (Quick) and by
  /// `rankRemainingPlayers`'s tie-break; Classic ignores it.
  final int captureCount;

  bool allFinished(LudoRuleset ruleset) =>
      tokens.every((token) => token.state(ruleset) == LudoTokenState.finished);

  int finishedCount(LudoRuleset ruleset) => tokens
      .where((token) => token.state(ruleset) == LudoTokenState.finished)
      .length;

  /// Whether at least one of this player's tokens has reached the finished
  /// path position. Half of [LudoWinCondition.oneHomeAndOneCapture]'s
  /// condition (the other half is [hasCaptured]).
  bool hasHomeToken(LudoRuleset ruleset) => finishedCount(ruleset) > 0;

  /// Whether this player has captured at least one opponent token at any
  /// point during the match. Half of
  /// [LudoWinCondition.oneHomeAndOneCapture]'s condition (the other half is
  /// [hasHomeToken]).
  bool get hasCaptured => captureCount > 0;

  /// Total path-distance progress across all 4 tokens (a token in the yard
  /// contributes `0`; a finished token contributes `ruleset.pathLength`,
  /// since its `pathPosition` already equals that). Used by
  /// `rankRemainingPlayers`'s progress tie-break; not a points/score
  /// system.
  int totalProgress() => tokens.fold(
    0,
    (sum, token) =>
        sum +
        (token.pathPosition == ludoYardPathPosition ? 0 : token.pathPosition),
  );

  LudoPlayerState copyWith({Iterable<LudoToken>? tokens, int? captureCount}) =>
      LudoPlayerState(
        seat: seat,
        subject: subject,
        color: color,
        tokens: tokens ?? this.tokens,
        captureCount: captureCount ?? this.captureCount,
      );

  /// `capture_count` is only serialized when [includeCaptureCount] is
  /// true. It defaults to true for callers that don't care, but
  /// [LudoMatchState.toJson] passes false for rulesets shaped like
  /// Classic's defaults (win condition doesn't consume captures) so that
  /// Classic's fixture output stays byte-identical to what was committed
  /// before task 12g added capture tracking for Quick — see
  /// `LudoRuleset.toJson`'s doc comment for the same constraint.
  Map<String, Object?> toJson({bool includeCaptureCount = true}) => {
    'seat': seat,
    'subject': subject,
    'color': color.name,
    'tokens': tokens.map((t) => t.toJson()).toList(),
    if (includeCaptureCount) 'capture_count': captureCount,
  };

  static LudoPlayerState fromJson(Map<String, Object?> json) {
    final seat = json['seat'];
    final subject = json['subject'];
    final color = json['color'];
    final tokens = json['tokens'];
    final captureCount = json['capture_count'];
    if (seat is! int ||
        subject is! String ||
        color is! String ||
        tokens is! List ||
        (captureCount != null && captureCount is! int)) {
      throw const FormatException('Invalid ludo player state');
    }
    return LudoPlayerState(
      seat: seat,
      subject: subject,
      color: LudoColor.values.byName(color),
      tokens: tokens
          .map((t) => LudoToken.fromJson((t as Map).cast<String, Object?>()))
          .toList(),
      captureCount: (captureCount as int?) ?? 0,
    );
  }
}

/// Marker used to distinguish "leave this field unchanged" from "set this
/// nullable field to null" in [LudoMatchState.copyWith].
const _unset = Object();

/// Full state of a Ludo match at a point in time. Immutable; every mutation
/// in `ludo_engine.dart` produces a new instance via [copyWith].
final class LudoMatchState {
  LudoMatchState({
    required this.ruleset,
    required Iterable<LudoPlayerState> players,
    required this.currentPlayerIndex,
    required this.phase,
    this.currentRoll,
    this.consecutiveSixes = 0,
    Iterable<int> winnerOrder = const [],
  }) : players = List.unmodifiable(players),
       winnerOrder = List.unmodifiable(winnerOrder) {
    if (this.players.length < 2 || this.players.length > 4) {
      throw ArgumentError.value(this.players.length, 'players.length', '2..4');
    }
    if (currentPlayerIndex < 0 || currentPlayerIndex >= this.players.length) {
      throw ArgumentError.value(currentPlayerIndex, 'currentPlayerIndex');
    }
  }

  /// Builds the starting state for a fresh match: every player's tokens
  /// begin in the yard, except the first `ruleset.preReleasedTokensPerPlayer`
  /// (token ids `0..preReleasedTokensPerPlayer - 1`), which start already
  /// placed on the player's own start square — `0` for Classic (everyone
  /// starts fully in the yard) and `2` for Quick. When
  /// `ruleset.requiresYardExitRoll` is false there is no yard state at all
  /// and every token starts on the track regardless. Colors are assigned to
  /// seats in [LudoColor] enum order (red, green, yellow, blue), truncated
  /// to the number of players — a fixed, documented seat/color assignment.
  factory LudoMatchState.initial({
    required LudoRuleset ruleset,
    required List<String> subjects,
  }) {
    if (subjects.length < 2 || subjects.length > 4) {
      throw ArgumentError.value(subjects.length, 'subjects.length', '2..4');
    }
    final players = <LudoPlayerState>[];
    for (var seat = 0; seat < subjects.length; seat++) {
      final tokens = List.generate(ruleset.tokensPerPlayer, (id) {
        if (!ruleset.requiresYardExitRoll) return LudoToken.onTrack(id);
        return id < ruleset.preReleasedTokensPerPlayer
            ? LudoToken.onTrack(id)
            : LudoToken.inYard(id);
      });
      players.add(
        LudoPlayerState(
          seat: seat,
          subject: subjects[seat],
          color: LudoColor.values[seat],
          tokens: tokens,
        ),
      );
    }
    return LudoMatchState(
      ruleset: ruleset,
      players: players,
      currentPlayerIndex: 0,
      phase: LudoMatchPhase.awaitingRoll,
    );
  }

  final LudoRuleset ruleset;
  final List<LudoPlayerState> players;
  final int currentPlayerIndex;
  final LudoMatchPhase phase;

  /// The most recent unspent dice roll, or `null` when no roll is pending
  /// (i.e. outside of [LudoMatchPhase.awaitingMove]).
  final int? currentRoll;

  /// Number of consecutive 6s rolled by the current player so far this
  /// turn-streak; a third consecutive 6 forfeits the turn.
  final int consecutiveSixes;

  /// Seats in the order they finished all their tokens. The match ends once
  /// this has `players.length - 1` entries (the single remaining player is
  /// automatically last).
  final List<int> winnerOrder;

  LudoPlayerState get currentPlayer => players[currentPlayerIndex];

  LudoMatchState copyWith({
    List<LudoPlayerState>? players,
    int? currentPlayerIndex,
    LudoMatchPhase? phase,
    Object? currentRoll = _unset,
    int? consecutiveSixes,
    List<int>? winnerOrder,
  }) {
    return LudoMatchState(
      ruleset: ruleset,
      players: players ?? this.players,
      currentPlayerIndex: currentPlayerIndex ?? this.currentPlayerIndex,
      phase: phase ?? this.phase,
      currentRoll: identical(currentRoll, _unset)
          ? this.currentRoll
          : currentRoll as int?,
      consecutiveSixes: consecutiveSixes ?? this.consecutiveSixes,
      winnerOrder: winnerOrder ?? this.winnerOrder,
    );
  }

  Map<String, Object?> toJson() => {
    'ruleset': ruleset.toJson(),
    'players': players
        .map(
          (p) => p.toJson(
            includeCaptureCount:
                ruleset.winCondition != LudoWinCondition.allTokensHome,
          ),
        )
        .toList(),
    'current_player_index': currentPlayerIndex,
    'phase': phase.name,
    'current_roll': currentRoll,
    'consecutive_sixes': consecutiveSixes,
    'winner_order': winnerOrder,
  };

  static LudoMatchState fromJson(Map<String, Object?> json) {
    final rulesetJson = json['ruleset'];
    final playersJson = json['players'];
    final currentPlayerIndex = json['current_player_index'];
    final phase = json['phase'];
    final currentRoll = json['current_roll'];
    final consecutiveSixes = json['consecutive_sixes'];
    final winnerOrder = json['winner_order'];
    if (rulesetJson is! Map ||
        playersJson is! List ||
        currentPlayerIndex is! int ||
        phase is! String ||
        (currentRoll != null && currentRoll is! int) ||
        consecutiveSixes is! int ||
        winnerOrder is! List) {
      throw const FormatException('Invalid ludo match state');
    }
    return LudoMatchState(
      ruleset: LudoRuleset.fromJson(rulesetJson.cast<String, Object?>()),
      players: playersJson
          .map(
            (p) => LudoPlayerState.fromJson((p as Map).cast<String, Object?>()),
          )
          .toList(),
      currentPlayerIndex: currentPlayerIndex,
      phase: LudoMatchPhase.values.byName(phase),
      currentRoll: currentRoll as int?,
      consecutiveSixes: consecutiveSixes,
      winnerOrder: winnerOrder.cast<int>(),
    );
  }
}
