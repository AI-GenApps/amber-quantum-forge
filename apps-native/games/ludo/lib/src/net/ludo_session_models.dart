/// Session, matchmaking, room and match-view DTOs mirroring
/// `contracts.ts`/`wire.ts` field-for-field.
library;

import 'ludo_event_models.dart';
import 'ludo_match_models.dart' show LudoMatchState, LudoMode;
import 'ludo_wire_json.dart';

final class LudoSessionResponse {
  const LudoSessionResponse({
    required this.contractVersion,
    required this.gameToken,
    required this.appId,
    required this.environment,
    required this.subject,
    required this.expiresIn,
  });

  final String contractVersion;
  final String gameToken;
  final String appId;
  final String environment;
  final String subject;
  final int expiresIn;

  static LudoSessionResponse fromWire(LudoJson value) {
    requireFields(value, {
      'contract_version',
      'game_token',
      'app_id',
      'environment',
      'subject',
      'expires_in',
    }, 'session response');
    final contractVersion = readText(value, 'contract_version', 32);
    if (contractVersion != ludoContractVersion) {
      throw LudoProtocolException(
        'Unsupported Ludo contract: $contractVersion',
      );
    }
    return LudoSessionResponse(
      contractVersion: contractVersion,
      gameToken: readText(value, 'game_token', 4096),
      appId: readText(value, 'app_id', 32),
      environment: readText(value, 'environment', 32),
      subject: readText(value, 'subject', 256),
      expiresIn: readInteger(value, 'expires_in'),
    );
  }
}

enum LudoMatchmakingTicketStatus {
  searching,
  matched,
  cancelled,
  expired;

  static LudoMatchmakingTicketStatus fromWire(String value) => switch (value) {
    'searching' => LudoMatchmakingTicketStatus.searching,
    'matched' => LudoMatchmakingTicketStatus.matched,
    'cancelled' => LudoMatchmakingTicketStatus.cancelled,
    'expired' => LudoMatchmakingTicketStatus.expired,
    _ => throw LudoProtocolException('Invalid ticket status: $value'),
  };
}

final class LudoMatchmakingTicket {
  const LudoMatchmakingTicket({
    required this.ticketId,
    required this.environment,
    required this.subject,
    required this.mode,
    required this.seatTarget,
    required this.status,
    required this.matchedMatchId,
    required this.createdAt,
    required this.expiresAt,
  });

  final String ticketId;
  final String environment;
  final String subject;
  final LudoMode mode;
  final int seatTarget;
  final LudoMatchmakingTicketStatus status;
  final String? matchedMatchId;
  final String createdAt;
  final String expiresAt;

  static LudoMatchmakingTicket fromWire(LudoJson value) {
    requireFields(value, {
      'ticket_id',
      'environment',
      'subject',
      'mode',
      'seat_target',
      'status',
      'matched_match_id',
      'created_at',
      'expires_at',
    }, 'matchmaking ticket');
    return LudoMatchmakingTicket(
      ticketId: readText(value, 'ticket_id', 128),
      environment: readText(value, 'environment', 32),
      subject: readText(value, 'subject', 256),
      mode: LudoMode.fromWire(readText(value, 'mode', 16)),
      seatTarget: readInteger(value, 'seat_target'),
      status: LudoMatchmakingTicketStatus.fromWire(
        readText(value, 'status', 16),
      ),
      matchedMatchId: readOptionalText(value, 'matched_match_id', 128),
      createdAt: readText(value, 'created_at', 64),
      expiresAt: readText(value, 'expires_at', 64),
    );
  }
}

enum LudoRoomStatus {
  waiting,
  matched,
  expired;

  static LudoRoomStatus fromWire(String value) => switch (value) {
    'waiting' => LudoRoomStatus.waiting,
    'matched' => LudoRoomStatus.matched,
    'expired' => LudoRoomStatus.expired,
    _ => throw LudoProtocolException('Invalid room status: $value'),
  };
}

final class LudoRoom {
  const LudoRoom({
    required this.roomCode,
    required this.environment,
    required this.ownerSubject,
    required this.mode,
    required this.seatTarget,
    required this.status,
    required this.matchId,
    required this.createdAt,
    required this.expiresAt,
  });

  final String roomCode;
  final String environment;
  final String ownerSubject;
  final LudoMode mode;
  final int seatTarget;
  final LudoRoomStatus status;
  final String? matchId;
  final String createdAt;
  final String expiresAt;

  static LudoRoom fromWire(LudoJson value) {
    requireFields(value, {
      'room_code',
      'environment',
      'owner_subject',
      'mode',
      'seat_target',
      'status',
      'match_id',
      'created_at',
      'expires_at',
    }, 'room');
    return LudoRoom(
      roomCode: readText(value, 'room_code', 32),
      environment: readText(value, 'environment', 32),
      ownerSubject: readText(value, 'owner_subject', 256),
      mode: LudoMode.fromWire(readText(value, 'mode', 16)),
      seatTarget: readInteger(value, 'seat_target'),
      status: LudoRoomStatus.fromWire(readText(value, 'status', 16)),
      matchId: readOptionalText(value, 'match_id', 128),
      createdAt: readText(value, 'created_at', 64),
      expiresAt: readText(value, 'expires_at', 64),
    );
  }
}

/// Client-shaped read model published to Firestore (task 22/25) and
/// returned synchronously by the polling fallback route.
final class LudoMatchView {
  const LudoMatchView({
    required this.matchId,
    required this.environment,
    required this.matchState,
    required this.recentEvents,
    required this.publishedAt,
  });

  final String matchId;
  final String environment;
  final LudoMatchState matchState;
  final List<LudoEvent> recentEvents;
  final String publishedAt;

  static LudoMatchView fromWire(LudoJson value) {
    requireFields(value, {
      'match_id',
      'environment',
      'match_state',
      'recent_events',
      'published_at',
    }, 'match view');
    final events = asJsonList(value['recent_events'], 'recent_events')
        .map((event) => LudoEvent.fromWire(asJsonObject(event, 'event')))
        .toList(growable: false);
    return LudoMatchView(
      matchId: readText(value, 'match_id', 128),
      environment: readText(value, 'environment', 32),
      matchState: LudoMatchState.fromWire(
        asJsonObject(value['match_state'], 'match_state'),
      ),
      recentEvents: events,
      publishedAt: readText(value, 'published_at', 64),
    );
  }
}
