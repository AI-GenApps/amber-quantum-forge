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

/// `GET /games/ludo/:environment/wallet` (task 26b): `{coins, diamonds}`.
final class LudoWallet {
  const LudoWallet({required this.coins, required this.diamonds});

  final int coins;
  final int diamonds;

  static LudoWallet fromWire(LudoJson value) {
    requireFields(value, {'coins', 'diamonds'}, 'wallet response');
    return LudoWallet(
      coins: readInteger(value, 'coins'),
      diamonds: readInteger(value, 'diamonds'),
    );
  }
}

/// `GET /games/ludo/:environment/profile` (task 26b): `{level, xp,
/// xpRequiredForNextLevel}`.
final class LudoProfileProgression {
  const LudoProfileProgression({
    required this.level,
    required this.xp,
    required this.xpRequiredForNextLevel,
  });

  final int level;
  final int xp;
  final int xpRequiredForNextLevel;

  static LudoProfileProgression fromWire(LudoJson value) {
    requireFields(value, {
      'level',
      'xp',
      'xpRequiredForNextLevel',
    }, 'profile response');
    return LudoProfileProgression(
      level: readInteger(value, 'level'),
      xp: readInteger(value, 'xp'),
      xpRequiredForNextLevel: readInteger(value, 'xpRequiredForNextLevel'),
    );
  }
}

/// One owned row from `GET .../inventory`'s `inventory` array.
final class LudoOwnedInventoryItem {
  const LudoOwnedInventoryItem({
    required this.itemId,
    required this.itemType,
    required this.acquiredVia,
    required this.acquiredAt,
  });

  final String itemId;
  final String itemType;
  final String acquiredVia;
  final String acquiredAt;

  static LudoOwnedInventoryItem fromWire(LudoJson value) {
    requireFields(value, {
      'item_id',
      'item_type',
      'acquired_via',
      'acquired_at',
    }, 'owned inventory item');
    return LudoOwnedInventoryItem(
      itemId: readText(value, 'item_id', 128),
      itemType: readText(value, 'item_type', 32),
      acquiredVia: readText(value, 'acquired_via', 32),
      acquiredAt: readText(value, 'acquired_at', 64),
    );
  }
}

/// One row from `GET .../inventory`'s `catalog` array (the versioned
/// economy config's theme list, served regardless of ownership).
final class LudoCatalogItem {
  const LudoCatalogItem({
    required this.itemId,
    required this.displayName,
    required this.itemType,
    required this.priceCoins,
    required this.priceDiamonds,
  });

  final String itemId;
  final String displayName;
  final String itemType;

  /// `null` for a free/starter item never sold for coins.
  final int? priceCoins;

  /// `null` for a free/starter item never sold for diamonds.
  final int? priceDiamonds;

  static LudoCatalogItem fromWire(LudoJson value) {
    requireFields(
      value,
      {'item_id', 'display_name', 'item_type'},
      'catalog item',
      optional: {'price_coins', 'price_diamonds'},
    );
    return LudoCatalogItem(
      itemId: readText(value, 'item_id', 128),
      displayName: readText(value, 'display_name', 128),
      itemType: readText(value, 'item_type', 32),
      priceCoins: readOptionalInteger(value, 'price_coins'),
      priceDiamonds: readOptionalInteger(value, 'price_diamonds'),
    );
  }
}

/// `GET /games/ludo/:environment/inventory` (task 26b).
final class LudoInventoryResult {
  const LudoInventoryResult({required this.inventory, required this.catalog});

  final List<LudoOwnedInventoryItem> inventory;
  final List<LudoCatalogItem> catalog;

  static LudoInventoryResult fromWire(LudoJson value) {
    requireFields(value, {'inventory', 'catalog'}, 'inventory response');
    return LudoInventoryResult(
      inventory: [
        for (final entry in asJsonList(value['inventory'], 'inventory'))
          LudoOwnedInventoryItem.fromWire(
            asJsonObject(entry, 'inventory item'),
          ),
      ],
      catalog: [
        for (final entry in asJsonList(value['catalog'], 'catalog'))
          LudoCatalogItem.fromWire(asJsonObject(entry, 'catalog item')),
      ],
    );
  }
}

/// `POST /games/ludo/:environment/xp/claim` (task 26b)'s response.
///
/// The route itself only ever reports `levelsGained` — never the actual
/// coin/diamond/theme amounts a level-up granted (that would need a
/// backend route change, out of scope for task 26e; see
/// `game_board_screen.dart`'s `_submitMatchXp`, which derives the
/// celebration's reward honestly from a `GET wallet` diff instead of
/// trusting a field this response doesn't carry).
final class LudoXpClaimResult {
  const LudoXpClaimResult({
    required this.idempotent,
    required this.xp,
    required this.level,
    required this.xpRequiredForNextLevel,
    required this.levelsGained,
  });

  final bool idempotent;
  final int xp;
  final int level;
  final int xpRequiredForNextLevel;

  /// How many level boundaries this claim crossed. `0` for an idempotent
  /// replay or a claim that didn't reach the next level's threshold.
  final int levelsGained;

  static LudoXpClaimResult fromWire(LudoJson value) {
    requireFields(value, {
      'idempotent',
      'xp',
      'level',
      'xpRequiredForNextLevel',
      'levelsGained',
    }, 'xp claim response');
    return LudoXpClaimResult(
      idempotent: readBoolean(value, 'idempotent'),
      xp: readInteger(value, 'xp'),
      level: readInteger(value, 'level'),
      xpRequiredForNextLevel: readInteger(value, 'xpRequiredForNextLevel'),
      levelsGained: readInteger(value, 'levelsGained'),
    );
  }
}

/// `POST /games/ludo/:environment/starter-grant` (task 26b)'s response.
final class LudoStarterGrantResult {
  const LudoStarterGrantResult({
    required this.granted,
    required this.coins,
    required this.diamonds,
  });

  final bool granted;
  final int coins;
  final int diamonds;

  static LudoStarterGrantResult fromWire(LudoJson value) {
    requireFields(value, {
      'granted',
      'coins',
      'diamonds',
    }, 'starter grant response');
    return LudoStarterGrantResult(
      granted: readBoolean(value, 'granted'),
      coins: readInteger(value, 'coins'),
      diamonds: readInteger(value, 'diamonds'),
    );
  }
}

/// `POST /games/ludo/:environment/daily-reward/claim` (task 26b)'s
/// response.
final class LudoDailyRewardClaimResult {
  const LudoDailyRewardClaimResult({
    required this.streakDay,
    required this.coinsGranted,
    required this.diamondsGranted,
    required this.coins,
    required this.diamonds,
  });

  final int streakDay;
  final int coinsGranted;
  final int diamondsGranted;
  final int coins;
  final int diamonds;

  static LudoDailyRewardClaimResult fromWire(LudoJson value) {
    requireFields(value, {
      'streakDay',
      'coinsGranted',
      'diamondsGranted',
      'coins',
      'diamonds',
    }, 'daily reward claim response');
    return LudoDailyRewardClaimResult(
      streakDay: readInteger(value, 'streakDay'),
      coinsGranted: readInteger(value, 'coinsGranted'),
      diamondsGranted: readInteger(value, 'diamondsGranted'),
      coins: readInteger(value, 'coins'),
      diamonds: readInteger(value, 'diamonds'),
    );
  }
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

  // Task 26e: wallet/profile/inventory/progression, mirroring task 26b's
  // routes (`packages/api/src/games/ludo/wallet-routes.ts`) field-for-field.

  /// `GET /games/ludo/:environment/wallet`.
  Future<LudoWallet> getWallet({required String gameToken}) async {
    final data = await _request(
      method: 'GET',
      uri: config.gameEndpoint('wallet'),
      bearerToken: gameToken,
    );
    return LudoWallet.fromWire(data);
  }

  /// `GET /games/ludo/:environment/profile`.
  Future<LudoProfileProgression> getProfile({required String gameToken}) async {
    final data = await _request(
      method: 'GET',
      uri: config.gameEndpoint('profile'),
      bearerToken: gameToken,
    );
    return LudoProfileProgression.fromWire(data);
  }

  /// `GET /games/ludo/:environment/inventory`.
  Future<LudoInventoryResult> getInventory({required String gameToken}) async {
    final data = await _request(
      method: 'GET',
      uri: config.gameEndpoint('inventory'),
      bearerToken: gameToken,
    );
    return LudoInventoryResult.fromWire(data);
  }

  /// `POST /games/ludo/:environment/xp/claim`: submits a pending local XP
  /// delta plus the plausibility payload
  /// (`elapsed_ms`/`matches_completed`) task 26b's replay-sanity check
  /// expects.
  Future<LudoXpClaimResult> claimXp({
    required int xpDelta,
    required String claimId,
    required int elapsedMs,
    required int matchesCompleted,
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'POST',
      uri: config.gameEndpoint('xp/claim'),
      body: {
        'xp_delta': xpDelta,
        'claim_id': claimId,
        'elapsed_ms': elapsedMs,
        'matches_completed': matchesCompleted,
      },
      bearerToken: gameToken,
    );
    return LudoXpClaimResult.fromWire(data);
  }

  /// `POST /games/ludo/:environment/starter-grant`: idempotent, safe to
  /// call every time a fresh player reaches the lobby.
  Future<LudoStarterGrantResult> starterGrant({
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'POST',
      uri: config.gameEndpoint('starter-grant'),
      body: const <String, Object?>{},
      bearerToken: gameToken,
    );
    return LudoStarterGrantResult.fromWire(data);
  }

  /// `POST /games/ludo/:environment/daily-reward/claim`. This task only
  /// wires the claim method itself — the calendar UI is task 26h's scope.
  Future<LudoDailyRewardClaimResult> claimDailyReward({
    required String gameToken,
  }) async {
    final data = await _request(
      method: 'POST',
      uri: config.gameEndpoint('daily-reward/claim'),
      body: const <String, Object?>{},
      bearerToken: gameToken,
    );
    return LudoDailyRewardClaimResult.fromWire(data);
  }
}
