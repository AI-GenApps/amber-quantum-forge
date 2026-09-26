/// `LudoCommand` DTOs mirroring `contracts.ts`'s tagged union and
/// `wire.ts`'s `toWireCommand`. The client only ever sends commands (never
/// decodes one), so no `fromWire` is needed here.
library;

import 'ludo_match_models.dart' show LudoMode;
import 'ludo_wire_json.dart';

sealed class LudoCommand {
  const LudoCommand({required this.idempotencyKey});

  final String idempotencyKey;

  String get type;

  LudoJson toWire();

  LudoJson _base() => {'type': type, 'idempotency_key': idempotencyKey};
}

final class LudoCreateMatchCommand extends LudoCommand {
  const LudoCreateMatchCommand({
    required super.idempotencyKey,
    required this.mode,
    required this.seats,
  });

  final LudoMode mode;
  final int seats;

  @override
  String get type => 'create_match';

  @override
  LudoJson toWire() => {..._base(), 'mode': mode.toWire(), 'seats': seats};
}

final class LudoJoinMatchCommand extends LudoCommand {
  const LudoJoinMatchCommand({
    required super.idempotencyKey,
    required this.matchId,
  });

  final String matchId;

  @override
  String get type => 'join_match';

  @override
  LudoJson toWire() => {..._base(), 'match_id': matchId};
}

final class LudoRollDiceCommand extends LudoCommand {
  const LudoRollDiceCommand({
    required super.idempotencyKey,
    required this.matchId,
  });

  final String matchId;

  @override
  String get type => 'roll_dice';

  @override
  LudoJson toWire() => {..._base(), 'match_id': matchId};
}

final class LudoMoveTokenCommand extends LudoCommand {
  const LudoMoveTokenCommand({
    required super.idempotencyKey,
    required this.matchId,
    required this.tokenId,
  });

  final String matchId;
  final int tokenId;

  @override
  String get type => 'move_token';

  @override
  LudoJson toWire() => {..._base(), 'match_id': matchId, 'token_id': tokenId};
}

final class LudoClaimTimeoutCommand extends LudoCommand {
  const LudoClaimTimeoutCommand({
    required super.idempotencyKey,
    required this.matchId,
  });

  final String matchId;

  @override
  String get type => 'claim_timeout';

  @override
  LudoJson toWire() => {..._base(), 'match_id': matchId};
}

final class LudoSurrenderCommand extends LudoCommand {
  const LudoSurrenderCommand({
    required super.idempotencyKey,
    required this.matchId,
  });

  final String matchId;

  @override
  String get type => 'surrender';

  @override
  LudoJson toWire() => {..._base(), 'match_id': matchId};
}

final class LudoRematchCommand extends LudoCommand {
  const LudoRematchCommand({
    required super.idempotencyKey,
    required this.matchId,
  });

  final String matchId;

  @override
  String get type => 'rematch';

  @override
  LudoJson toWire() => {..._base(), 'match_id': matchId};
}
