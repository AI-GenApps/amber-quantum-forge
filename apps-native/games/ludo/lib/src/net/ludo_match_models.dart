/// Match-state DTOs mirroring `packages/api/src/games/ludo/contracts.ts`
/// and `wire.ts` field-for-field (snake_case on the wire, camelCase in
/// Dart) — never hand-rolled parallel JSON parsing, per task 24's brief.
library;

import 'ludo_wire_json.dart';

enum LudoColor {
  red,
  green,
  yellow,
  blue;

  static LudoColor fromWire(String value) => switch (value) {
    'red' => LudoColor.red,
    'green' => LudoColor.green,
    'yellow' => LudoColor.yellow,
    'blue' => LudoColor.blue,
    _ => throw LudoProtocolException('Invalid color: $value'),
  };

  String toWire() => name;
}

enum LudoMode {
  classic,
  quick;

  static LudoMode fromWire(String value) => switch (value) {
    'classic' => LudoMode.classic,
    'quick' => LudoMode.quick,
    _ => throw LudoProtocolException('Invalid mode: $value'),
  };

  String toWire() => name;
}

enum LudoMatchStatus {
  waiting,
  active,
  finished,
  abandoned;

  static LudoMatchStatus fromWire(String value) => switch (value) {
    'waiting' => LudoMatchStatus.waiting,
    'active' => LudoMatchStatus.active,
    'finished' => LudoMatchStatus.finished,
    'abandoned' => LudoMatchStatus.abandoned,
    _ => throw LudoProtocolException('Invalid match status: $value'),
  };

  String toWire() => name;
}

enum LudoMatchPhase {
  awaitingRoll,
  awaitingMove,
  finished;

  static LudoMatchPhase fromWire(String value) => switch (value) {
    'awaiting_roll' => LudoMatchPhase.awaitingRoll,
    'awaiting_move' => LudoMatchPhase.awaitingMove,
    'finished' => LudoMatchPhase.finished,
    _ => throw LudoProtocolException('Invalid match phase: $value'),
  };

  String toWire() => switch (this) {
    LudoMatchPhase.awaitingRoll => 'awaiting_roll',
    LudoMatchPhase.awaitingMove => 'awaiting_move',
    LudoMatchPhase.finished => 'finished',
  };
}

final class LudoToken {
  const LudoToken({required this.id, required this.pathPosition});

  final int id;
  final int pathPosition;

  static LudoToken fromWire(LudoJson value) {
    requireFields(value, {'id', 'path_position'}, 'token');
    return LudoToken(
      id: readInteger(value, 'id'),
      pathPosition: readInteger(value, 'path_position'),
    );
  }

  LudoJson toWire() => {'id': id, 'path_position': pathPosition};

  @override
  bool operator ==(Object other) =>
      other is LudoToken &&
      other.id == id &&
      other.pathPosition == pathPosition;

  @override
  int get hashCode => Object.hash(id, pathPosition);
}

final class LudoPlayerState {
  const LudoPlayerState({
    required this.seat,
    required this.subject,
    required this.color,
    required this.tokens,
    required this.captureCount,
  });

  final int seat;
  final String subject;
  final LudoColor color;
  final List<LudoToken> tokens;
  final int captureCount;

  static LudoPlayerState fromWire(LudoJson value) {
    requireFields(value, {
      'seat',
      'subject',
      'color',
      'tokens',
      'capture_count',
    }, 'player');
    final tokens = asJsonList(value['tokens'], 'tokens')
        .map((token) => LudoToken.fromWire(asJsonObject(token, 'token')))
        .toList(growable: false);
    return LudoPlayerState(
      seat: readInteger(value, 'seat'),
      subject: readText(value, 'subject', 256),
      color: LudoColor.fromWire(readText(value, 'color', 16)),
      tokens: tokens,
      captureCount: readInteger(value, 'capture_count'),
    );
  }

  LudoJson toWire() => {
    'seat': seat,
    'subject': subject,
    'color': color.toWire(),
    'tokens': tokens.map((token) => token.toWire()).toList(growable: false),
    'capture_count': captureCount,
  };
}

final class LudoMatchState {
  const LudoMatchState({
    required this.matchId,
    required this.environment,
    required this.mode,
    required this.status,
    required this.players,
    required this.currentPlayerIndex,
    required this.phase,
    required this.currentRoll,
    required this.consecutiveSixes,
    required this.winnerOrder,
    required this.deadlineAt,
    required this.updatedAt,
  });

  final String matchId;
  final String environment;
  final LudoMode mode;
  final LudoMatchStatus status;
  final List<LudoPlayerState> players;
  final int currentPlayerIndex;
  final LudoMatchPhase phase;
  final int? currentRoll;
  final int consecutiveSixes;
  final List<int> winnerOrder;
  final String? deadlineAt;
  final String updatedAt;

  static LudoMatchState fromWire(LudoJson value) {
    requireFields(value, {
      'match_id',
      'environment',
      'mode',
      'status',
      'players',
      'current_player_index',
      'phase',
      'current_roll',
      'consecutive_sixes',
      'winner_order',
      'deadline_at',
      'updated_at',
    }, 'match state');
    final players = asJsonList(value['players'], 'players')
        .map(
          (player) => LudoPlayerState.fromWire(asJsonObject(player, 'player')),
        )
        .toList(growable: false);
    final winnerOrder = asJsonList(
      value['winner_order'],
      'winner_order',
    ).map((seat) => seat as int).toList(growable: false);
    return LudoMatchState(
      matchId: readText(value, 'match_id', 128),
      environment: readText(value, 'environment', 32),
      mode: LudoMode.fromWire(readText(value, 'mode', 16)),
      status: LudoMatchStatus.fromWire(readText(value, 'status', 16)),
      players: players,
      currentPlayerIndex: readInteger(value, 'current_player_index'),
      phase: LudoMatchPhase.fromWire(readText(value, 'phase', 24)),
      currentRoll: readOptionalInteger(value, 'current_roll'),
      consecutiveSixes: readInteger(value, 'consecutive_sixes'),
      winnerOrder: winnerOrder,
      deadlineAt: readOptionalText(value, 'deadline_at', 64),
      updatedAt: readText(value, 'updated_at', 64),
    );
  }

  LudoJson toWire() => {
    'match_id': matchId,
    'environment': environment,
    'mode': mode.toWire(),
    'status': status.toWire(),
    'players': players.map((player) => player.toWire()).toList(growable: false),
    'current_player_index': currentPlayerIndex,
    'phase': phase.toWire(),
    'current_roll': currentRoll,
    'consecutive_sixes': consecutiveSixes,
    'winner_order': winnerOrder,
    'deadline_at': deadlineAt,
    'updated_at': updatedAt,
  };
}
