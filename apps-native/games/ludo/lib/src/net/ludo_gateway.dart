/// Typed HTTP gateway for every Ludo backend route added by tasks 15-22
/// (`packages/api/src/games/ludo/routes.ts`), plus the pre-existing generic
/// Firebase-token exchange route (`packages/api/src/routes/auth-tokens.ts`)
/// the auth controller (task 24) needs to obtain the API access token a
/// Ludo game-token session is minted from.
///
/// Every method decodes the server's actual wire shape via the DTOs in
/// `ludo_match_models.dart`/`ludo_event_models.dart`/
/// `ludo_session_models.dart` — never ad hoc `Map` indexing at the call
/// site — so a server-side field rename fails a gateway test rather than
/// surfacing as a silent runtime bug in a screen.
library;

import 'ludo_command_models.dart';
import 'ludo_http.dart';
import 'ludo_match_models.dart';
import 'ludo_session_models.dart';
import 'ludo_wire_json.dart';

/// The API access token pair minted by `POST /api/auth/exchange`.
final class LudoApiAuthTokens {
  const LudoApiAuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
    required this.uid,
  });

  final String accessToken;
  final String refreshToken;
  final int expiresIn;

  /// The Firebase UID this token pair authenticates, read from the
  /// `/exchange` response's nested `user.uid`. `null` for a `/refresh`
  /// response, which carries no `user` object — the caller already knows
  /// the UID from the original exchange and keeps it unchanged across a
  /// refresh (refreshing never re-identifies the caller).
  final String? uid;

  static LudoApiAuthTokens fromExchangeWire(LudoJson value) {
    requireFields(value, {
      'accessToken',
      'refreshToken',
      'expiresIn',
      'tokenType',
      'user',
    }, 'auth exchange response');
    final user = asJsonObject(value['user'], 'user');
    requireFields(
      user,
      {'uid'},
      'auth exchange user',
      optional: {'email', 'displayName', 'photoURL'},
    );
    return LudoApiAuthTokens(
      accessToken: readText(value, 'accessToken', 4096),
      refreshToken: readText(value, 'refreshToken', 4096),
      expiresIn: readInteger(value, 'expiresIn'),
      uid: readText(user, 'uid', 256),
    );
  }

  /// `/refresh`'s response carries no `user` object (see
  /// `packages/api/src/routes/auth-tokens.ts`'s `/refresh` handler).
  static LudoApiAuthTokens fromRefreshWire(LudoJson value) {
    requireFields(value, {
      'accessToken',
      'refreshToken',
      'expiresIn',
      'tokenType',
    }, 'auth refresh response');
    return LudoApiAuthTokens(
      accessToken: readText(value, 'accessToken', 4096),
      refreshToken: readText(value, 'refreshToken', 4096),
      expiresIn: readInteger(value, 'expiresIn'),
      uid: null,
    );
  }
}

/// The result of a create/join/command call: the resulting match state,
/// and whether this call replayed an already-committed idempotency key.
final class LudoMatchStateResult {
  const LudoMatchStateResult({
    required this.matchState,
    required this.idempotent,
  });

  final LudoMatchState matchState;
  final bool idempotent;
}

final class LudoTicketResult {
  const LudoTicketResult({required this.ticket, this.idempotent = false});

  final LudoMatchmakingTicket ticket;
  final bool idempotent;
}

final class LudoCreateRoomResult {
  const LudoCreateRoomResult({
    required this.room,
    required this.inviteLink,
    required this.idempotent,
  });

  final LudoRoom room;
  final String inviteLink;
  final bool idempotent;
}

final class LudoJoinRoomResult {
  const LudoJoinRoomResult({
    required this.room,
    required this.matchState,
    required this.idempotent,
  });

  final LudoRoom room;
  final LudoMatchState matchState;
  final bool idempotent;
}

final class LudoGateway {
  LudoGateway({required this.config, LudoHttpTransport? transport})
    : transport = transport ?? DartIoLudoHttpTransport();

  final LudoNetworkConfig config;
  final LudoHttpTransport transport;

  Future<LudoJson> _request({
    required String method,
    required Uri uri,
    Object? body,
    String? bearerToken,
  }) async {
    final headers = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      if (bearerToken != null) 'Authorization': 'Bearer $bearerToken',
    };
    final response = await transport.send(
      method: method,
      uri: uri,
      headers: headers,
      body: body,
      timeout: config.timeout,
      maxRequestBytes: config.maxRequestBytes,
      maxResponseBytes: config.maxResponseBytes,
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        return decodeJsonObject(
          response.body,
          maxBytes: config.maxResponseBytes,
        );
      } on LudoProtocolException {
        rethrow;
      } on Object {
        throw const LudoProtocolException('Invalid Ludo response');
      }
    }
    throw decodeApiError(response.statusCode, response.body);
  }

  /// `POST /api/auth/exchange`: verifies a Firebase ID token and returns an
  /// API access/refresh token pair (`packages/api/src/routes/
  /// auth-tokens.ts`). Not a `games/ludo/*` route, but the prerequisite
  /// step every session/game-token call below depends on.
  Future<LudoApiAuthTokens> exchangeFirebaseIdToken(
    String firebaseIdToken,
  ) async {
    final data = await _request(
      method: 'POST',
      uri: config.endpoint('api/auth/exchange'),
      body: {'idToken': firebaseIdToken},
    );
    return LudoApiAuthTokens.fromExchangeWire(data);
  }

  /// `POST /api/auth/refresh`: exchanges a refresh token for a new API
  /// access token once the previous one has expired.
  Future<LudoApiAuthTokens> refreshApiAccessToken(String refreshToken) async {
    final data = await _request(
      method: 'POST',
      uri: config.endpoint('api/auth/refresh'),
      body: {'refreshToken': refreshToken},
    );
    return LudoApiAuthTokens.fromRefreshWire(data);
  }

  /// `POST /games/ludo/:environment/session` (task 15): mints a
  /// short-lived Ludo game token from a valid API access token.
  Future<LudoSessionResponse> exchangeSession({
    required String apiAccessToken,
  }) async {
    final data = await _request(
      method: 'POST',
      uri: config.gameEndpoint('session'),
      body: const <String, Object?>{},
      bearerToken: apiAccessToken,
    );
    return LudoSessionResponse.fromWire(data);
  }

  /// `POST /games/ludo/:environment/matches` (task 15/18).
  Future<LudoMatchStateResult> createMatch({
    required LudoCreateMatchCommand command,
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'POST',
      uri: config.gameEndpoint('matches'),
      body: command.toWire(),
      bearerToken: gameToken,
    );
    requireFields(data, {'match_state', 'idempotent'}, 'create match response');
    return LudoMatchStateResult(
      matchState: LudoMatchState.fromWire(
        asJsonObject(data['match_state'], 'match_state'),
      ),
      idempotent: readBoolean(data, 'idempotent'),
    );
  }

  /// `GET /games/ludo/:environment/matches/:matchId` (task 18).
  Future<LudoMatchState> getMatchState({
    required String matchId,
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'GET',
      uri: config.gameEndpoint('matches/$matchId'),
      bearerToken: gameToken,
    );
    requireFields(data, {'match_state'}, 'match state response');
    return LudoMatchState.fromWire(
      asJsonObject(data['match_state'], 'match_state'),
    );
  }

  /// `GET /games/ludo/:environment/matches/:matchId/state` (task 22): the
  /// HTTP polling fallback for clients without Firestore connectivity
  /// (task 25 consumes this directly).
  Future<LudoMatchView> getMatchView({
    required String matchId,
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'GET',
      uri: config.gameEndpoint('matches/$matchId/state'),
      bearerToken: gameToken,
    );
    requireFields(data, {'match_view'}, 'match view response');
    return LudoMatchView.fromWire(
      asJsonObject(data['match_view'], 'match_view'),
    );
  }

  /// `POST /games/ludo/:environment/matches/:matchId/commands` (task 18):
  /// `roll_dice`, `move_token`, `join_match`, `claim_timeout`, `surrender`
  /// and `rematch` all post here.
  Future<LudoMatchStateResult> sendCommand({
    required LudoCommand command,
    required String gameToken,
  }) async {
    final matchId = switch (command) {
      LudoJoinMatchCommand(:final matchId) => matchId,
      LudoRollDiceCommand(:final matchId) => matchId,
      LudoMoveTokenCommand(:final matchId) => matchId,
      LudoClaimTimeoutCommand(:final matchId) => matchId,
      LudoSurrenderCommand(:final matchId) => matchId,
      LudoRematchCommand(:final matchId) => matchId,
      LudoCreateMatchCommand() => throw ArgumentError(
        'create_match is sent via createMatch(), not sendCommand()',
      ),
    };
    final data = await _request(
      method: 'POST',
      uri: config.gameEndpoint('matches/$matchId/commands'),
      body: command.toWire(),
      bearerToken: gameToken,
    );
    requireFields(data, {'match_state', 'idempotent'}, 'command response');
    return LudoMatchStateResult(
      matchState: LudoMatchState.fromWire(
        asJsonObject(data['match_state'], 'match_state'),
      ),
      idempotent: readBoolean(data, 'idempotent'),
    );
  }

  /// `POST /games/ludo/:environment/matchmaking/tickets` (task 20).
  Future<LudoTicketResult> createMatchmakingTicket({
    required LudoMode mode,
    required int seatTarget,
    required String idempotencyKey,
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'POST',
      uri: config.gameEndpoint('matchmaking/tickets'),
      body: {
        'mode': mode.toWire(),
        'seat_target': seatTarget,
        'idempotency_key': idempotencyKey,
      },
      bearerToken: gameToken,
    );
    requireFields(data, {'ticket', 'idempotent'}, 'ticket response');
    return LudoTicketResult(
      ticket: LudoMatchmakingTicket.fromWire(
        asJsonObject(data['ticket'], 'ticket'),
      ),
      idempotent: readBoolean(data, 'idempotent'),
    );
  }

  /// `GET /games/ludo/:environment/matchmaking/tickets/:ticketId` (task 26):
  /// the only way the client learns a ticket transitioned to `matched`
  /// (and which match it landed in) — the matchmaking-search screen polls
  /// this rather than replaying `createMatchmakingTicket`, whose own
  /// idempotent lookup only ever finds a still-`searching` ticket.
  Future<LudoMatchmakingTicket> getMatchmakingTicket({
    required String ticketId,
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'GET',
      uri: config.gameEndpoint('matchmaking/tickets/$ticketId'),
      bearerToken: gameToken,
    );
    requireFields(data, {'ticket'}, 'ticket response');
    return LudoMatchmakingTicket.fromWire(
      asJsonObject(data['ticket'], 'ticket'),
    );
  }

  /// `DELETE /games/ludo/:environment/matchmaking/tickets/:ticketId` (task 20).
  Future<LudoMatchmakingTicket> cancelMatchmakingTicket({
    required String ticketId,
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'DELETE',
      uri: config.gameEndpoint('matchmaking/tickets/$ticketId'),
      bearerToken: gameToken,
    );
    requireFields(data, {'ticket'}, 'ticket response');
    return LudoMatchmakingTicket.fromWire(
      asJsonObject(data['ticket'], 'ticket'),
    );
  }

  /// `POST /games/ludo/:environment/rooms` (task 21).
  Future<LudoCreateRoomResult> createRoom({
    required LudoMode mode,
    required int seatTarget,
    required String idempotencyKey,
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'POST',
      uri: config.gameEndpoint('rooms'),
      body: {
        'mode': mode.toWire(),
        'seat_target': seatTarget,
        'idempotency_key': idempotencyKey,
      },
      bearerToken: gameToken,
    );
    requireFields(data, {
      'room',
      'invite_link',
      'idempotent',
    }, 'create room response');
    return LudoCreateRoomResult(
      room: LudoRoom.fromWire(asJsonObject(data['room'], 'room')),
      inviteLink: readText(data, 'invite_link', 512),
      idempotent: readBoolean(data, 'idempotent'),
    );
  }

  /// `GET /games/ludo/:environment/rooms/:roomCode` (task 26): the room
  /// creator's only way to learn another player joined and filled it — a
  /// joining caller already gets `match_state` back synchronously from
  /// [joinRoom] and never needs this.
  Future<LudoRoom> getRoom({
    required String roomCode,
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'GET',
      uri: config.gameEndpoint('rooms/$roomCode'),
      bearerToken: gameToken,
    );
    requireFields(data, {'room'}, 'room response');
    return LudoRoom.fromWire(asJsonObject(data['room'], 'room'));
  }

  /// `POST /games/ludo/:environment/rooms/:roomCode/join` (task 21).
  Future<LudoJoinRoomResult> joinRoom({
    required String roomCode,
    required String idempotencyKey,
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'POST',
      uri: config.gameEndpoint('rooms/$roomCode/join'),
      body: {'idempotency_key': idempotencyKey},
      bearerToken: gameToken,
    );
    requireFields(data, {
      'room',
      'match_state',
      'idempotent',
    }, 'join room response');
    return LudoJoinRoomResult(
      room: LudoRoom.fromWire(asJsonObject(data['room'], 'room')),
      matchState: LudoMatchState.fromWire(
        asJsonObject(data['match_state'], 'match_state'),
      ),
      idempotent: readBoolean(data, 'idempotent'),
    );
  }
}
