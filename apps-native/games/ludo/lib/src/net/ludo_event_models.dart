/// `LudoEvent` DTOs, mirroring `contracts.ts`'s tagged union and
/// `wire.ts`'s `eventToWire`/`eventFromWire` field-for-field.
library;

import 'ludo_wire_json.dart';

sealed class LudoEvent {
  const LudoEvent({
    required this.eventId,
    required this.matchId,
    required this.sequence,
    required this.createdAt,
  });

  final String eventId;
  final String matchId;
  final int sequence;
  final String createdAt;

  String get type;

  static LudoEvent fromWire(LudoJson value) {
    requireFields(value, {
      'type',
      'event_id',
      'match_id',
      'sequence',
      'created_at',
    }, 'event');
    final type = readText(value, 'type', 32);
    final eventId = readText(value, 'event_id', 128);
    final matchId = readText(value, 'match_id', 128);
    final sequence = readInteger(value, 'sequence');
    final createdAt = readText(value, 'created_at', 64);
    switch (type) {
      case 'dice_rolled':
        return LudoDiceRolledEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          seat: readInteger(value, 'seat'),
          roll: readInteger(value, 'roll'),
        );
      case 'token_moved':
        return LudoTokenMovedEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          seat: readInteger(value, 'seat'),
          tokenId: readInteger(value, 'token_id'),
          fromPathPosition: readInteger(value, 'from_path_position'),
          toPathPosition: readInteger(value, 'to_path_position'),
        );
      case 'token_captured':
        return LudoTokenCapturedEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          seat: readInteger(value, 'seat'),
          tokenId: readInteger(value, 'token_id'),
          capturedSeat: readInteger(value, 'captured_seat'),
          capturedTokenId: readInteger(value, 'captured_token_id'),
        );
      case 'token_finished':
        return LudoTokenFinishedEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          seat: readInteger(value, 'seat'),
          tokenId: readInteger(value, 'token_id'),
        );
      case 'turn_forfeited':
        return LudoTurnForfeitedEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          seat: readInteger(value, 'seat'),
          reason: readText(value, 'reason', 64),
        );
      case 'match_finished':
        return LudoMatchFinishedEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          winnerOrder: asJsonList(
            value['winner_order'],
            'winner_order',
          ).map((seat) => seat as int).toList(growable: false),
        );
      case 'player_joined':
        return LudoPlayerJoinedEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          seat: readInteger(value, 'seat'),
          subject: readText(value, 'subject', 256),
        );
      case 'player_left':
        return LudoPlayerLeftEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          seat: readInteger(value, 'seat'),
        );
      case 'bot_filled':
        return LudoBotFilledEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          seat: readInteger(value, 'seat'),
        );
      case 'turn_timed_out':
        return LudoTurnTimedOutEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          seat: readInteger(value, 'seat'),
        );
      case 'seat_forfeited':
        return LudoSeatForfeitedEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
          seat: readInteger(value, 'seat'),
        );
      case 'match_abandoned':
        return LudoMatchAbandonedEvent(
          eventId: eventId,
          matchId: matchId,
          sequence: sequence,
          createdAt: createdAt,
        );
      default:
        throw LudoProtocolException('Unknown event type: $type');
    }
  }

  LudoJson toWire();

  LudoJson _base() => {
    'type': type,
    'event_id': eventId,
    'match_id': matchId,
    'sequence': sequence,
    'created_at': createdAt,
  };
}

final class LudoDiceRolledEvent extends LudoEvent {
  const LudoDiceRolledEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.seat,
    required this.roll,
  });

  final int seat;
  final int roll;

  @override
  String get type => 'dice_rolled';

  @override
  LudoJson toWire() => {..._base(), 'seat': seat, 'roll': roll};
}

final class LudoTokenMovedEvent extends LudoEvent {
  const LudoTokenMovedEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.seat,
    required this.tokenId,
    required this.fromPathPosition,
    required this.toPathPosition,
  });

  final int seat;
  final int tokenId;
  final int fromPathPosition;
  final int toPathPosition;

  @override
  String get type => 'token_moved';

  @override
  LudoJson toWire() => {
    ..._base(),
    'seat': seat,
    'token_id': tokenId,
    'from_path_position': fromPathPosition,
    'to_path_position': toPathPosition,
  };
}

final class LudoTokenCapturedEvent extends LudoEvent {
  const LudoTokenCapturedEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.seat,
    required this.tokenId,
    required this.capturedSeat,
    required this.capturedTokenId,
  });

  final int seat;
  final int tokenId;
  final int capturedSeat;
  final int capturedTokenId;

  @override
  String get type => 'token_captured';

  @override
  LudoJson toWire() => {
    ..._base(),
    'seat': seat,
    'token_id': tokenId,
    'captured_seat': capturedSeat,
    'captured_token_id': capturedTokenId,
  };
}

final class LudoTokenFinishedEvent extends LudoEvent {
  const LudoTokenFinishedEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.seat,
    required this.tokenId,
  });

  final int seat;
  final int tokenId;

  @override
  String get type => 'token_finished';

  @override
  LudoJson toWire() => {..._base(), 'seat': seat, 'token_id': tokenId};
}

final class LudoTurnForfeitedEvent extends LudoEvent {
  const LudoTurnForfeitedEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.seat,
    required this.reason,
  });

  final int seat;
  final String reason;

  @override
  String get type => 'turn_forfeited';

  @override
  LudoJson toWire() => {..._base(), 'seat': seat, 'reason': reason};
}

final class LudoMatchFinishedEvent extends LudoEvent {
  const LudoMatchFinishedEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.winnerOrder,
  });

  final List<int> winnerOrder;

  @override
  String get type => 'match_finished';

  @override
  LudoJson toWire() => {..._base(), 'winner_order': winnerOrder};
}

final class LudoPlayerJoinedEvent extends LudoEvent {
  const LudoPlayerJoinedEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.seat,
    required this.subject,
  });

  final int seat;
  final String subject;

  @override
  String get type => 'player_joined';

  @override
  LudoJson toWire() => {..._base(), 'seat': seat, 'subject': subject};
}

final class LudoPlayerLeftEvent extends LudoEvent {
  const LudoPlayerLeftEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.seat,
  });

  final int seat;

  @override
  String get type => 'player_left';

  @override
  LudoJson toWire() => {..._base(), 'seat': seat};
}

final class LudoBotFilledEvent extends LudoEvent {
  const LudoBotFilledEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.seat,
  });

  final int seat;

  @override
  String get type => 'bot_filled';

  @override
  LudoJson toWire() => {..._base(), 'seat': seat};
}

final class LudoTurnTimedOutEvent extends LudoEvent {
  const LudoTurnTimedOutEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.seat,
  });

  final int seat;

  @override
  String get type => 'turn_timed_out';

  @override
  LudoJson toWire() => {..._base(), 'seat': seat};
}

final class LudoSeatForfeitedEvent extends LudoEvent {
  const LudoSeatForfeitedEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
    required this.seat,
  });

  final int seat;

  @override
  String get type => 'seat_forfeited';

  @override
  LudoJson toWire() => {..._base(), 'seat': seat};
}

final class LudoMatchAbandonedEvent extends LudoEvent {
  const LudoMatchAbandonedEvent({
    required super.eventId,
    required super.matchId,
    required super.sequence,
    required super.createdAt,
  });

  @override
  String get type => 'match_abandoned';

  @override
  LudoJson toWire() => _base();
}
