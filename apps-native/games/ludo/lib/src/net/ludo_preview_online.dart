/// Debug-only online preview mode (task 26x): scripts every online
/// screen/state end-to-end with **no real Firebase project or API
/// deployment** (task 29 is still pending), so a physical device can walk
/// room create/join/share, matchmaking search, an in-progress match with a
/// live turn timer, and a bot-filled seat, all through the exact same
/// production code path a real backend would drive.
///
/// Deliberately reuses every existing interface rather than adding a
/// parallel one (per this task's Context/Decisions): [PreviewLudoTransport]
/// implements the existing [LudoHttpTransport] interface, and
/// [createLudoPreviewOnlineClient] assembles a real [LudoGateway] /
/// [LudoAuthController] / [LudoOnlineController] / [LudoOnlineClient]
/// around it (plus fake [LudoFirebaseAuthGateway]/[LudoGoogleSignInGateway]
/// implementations) — so `home_lobby_screen.dart`'s entire online flow
/// (room create/join, matchmaking, the resulting `GameBoardScreen` via
/// `createLudoMatchStateSource`'s existing polling fallback) runs
/// unmodified against this fake instead of a real server. Every scripted
/// transition below fires on a real [Timer] (never a manual/fake-clock
/// tick), so the delays are genuinely observable when walking this mode
/// live on a device, per this task's Context/Decisions.
///
/// Two entry points arm this mode for the current app session (see
/// `ludo_online_preview_mode.dart`): a debug-only settings toggle, and a
/// long-press on the lobby logo. Both are `kDebugMode`-guarded at their
/// call site, so this file compiles into every build (harmless — it is
/// never *reached* from a release build) while the arm action itself is
/// not.
library;

import 'dart:async';
import 'dart:convert';

import 'ludo_firebase_gateway.dart'
    show
        LudoFirebaseAuthGateway,
        LudoFirebaseUser,
        LudoGoogleSignInGateway,
        LudoGoogleSignInResult;
import 'ludo_gateway.dart';
import 'ludo_http.dart';
import 'ludo_online_client.dart';
import 'ludo_online_controller.dart';
import 'ludo_auth_controller.dart';
import 'ludo_wire_json.dart' show ludoContractVersion;
import 'ludo_deep_link.dart' show ludoDeepLinkScheme;
import '../telemetry/ludo_telemetry.dart';

/// A room code that always fails to join with "not found" — for exercising
/// the invalid-code error state without waiting on a real typo.
const ludoPreviewInvalidRoomCode = 'BADCODE1';

/// A room code that always fails to join with "expired" — for exercising
/// the expired-invite error state.
const ludoPreviewExpiredRoomCode = 'EXPIRED1';

/// How long a created room waits before a simulated friend joins it.
const ludoPreviewRoomFillDelay = Duration(seconds: 6);

/// How long a matchmaking search waits before resolving (either a
/// simulated human opponent or a bot-fill, chosen per [ludoPreviewBotFill]).
const ludoPreviewMatchmakingDelay = Duration(seconds: 5);

/// When `true`, every preview matchmaking search resolves via bot-fill
/// (task 20's real semantics: an unmatched search times out into bot
/// seats) instead of a simulated human opponent. Toggle for the device
/// walkthrough to capture both states; defaults to alternating so a
/// second search in the same session shows the other outcome.
bool ludoPreviewBotFill = false;

/// Builds the full, self-contained preview [LudoOnlineClient]: a fake
/// [LudoHttpTransport] plus fake Firebase/Google gateways wired into the
/// same production [LudoGateway]/[LudoAuthController]/[LudoOnlineController]
/// classes `createLudoOnlineClient` assembles for a real backend.
///
/// [roomFillDelay]/[matchmakingDelay]/[pollInterval] default to this
/// mode's real device-walkthrough pacing ([ludoPreviewRoomFillDelay]/
/// [ludoPreviewMatchmakingDelay]/750ms); tests override them to
/// millisecond-scale values so a scripted transition doesn't cost real
/// wall-clock seconds per test case while still exercising the exact same
/// real-`Timer` code path a device run does (never a manual/fake-clock
/// tick, per this task's Context/Decisions).
LudoOnlineClient createLudoPreviewOnlineClient({
  Duration roomFillDelay = ludoPreviewRoomFillDelay,
  Duration matchmakingDelay = ludoPreviewMatchmakingDelay,
  Duration pollInterval = const Duration(milliseconds: 750),
}) {
  final transport = PreviewLudoTransport(
    roomFillDelay: roomFillDelay,
    matchmakingDelay: matchmakingDelay,
  );
  final config = LudoNetworkConfig(
    apiBaseUri: Uri.parse('https://ludo-preview.invalid'),
    environment: 'debug',
  );
  final gateway = LudoGateway(config: config, transport: transport);
  final authController = LudoAuthController(
    gateway: gateway,
    firebaseAuth: _PreviewFirebaseAuthGateway(),
    googleSignIn: _PreviewGoogleSignInGateway(),
  );
  final onlineController = LudoOnlineController(
    gateway: gateway,
    authController: authController,
    telemetry: LudoTelemetry(),
    // The production default (2s) is fine for real polling, but this
    // preview's own scripted delays (room fill / matchmaking, above) are
    // already the dominant wait; a shorter poll keeps the walkthrough
    // responsive once the fake transport flips a room/ticket to matched.
    pollInterval: pollInterval,
  );
  return LudoOnlineClient(
    gateway: gateway,
    authController: authController,
    onlineController: onlineController,
  );
}

// ---------------------------------------------------------------------
// Fake Firebase/Google gateways: a single stable anonymous "preview" user,
// never touching a real `firebase_auth` plugin.
// ---------------------------------------------------------------------

final class _PreviewFirebaseUser implements LudoFirebaseUser {
  _PreviewFirebaseUser();

  @override
  final String uid = 'preview-guest';

  @override
  bool isAnonymous = true;

  @override
  Future<String> getIdToken({bool forceRefresh = false}) async =>
      'preview-id-token';

  @override
  Future<LudoFirebaseUser> linkWithGoogleCredential({
    required String googleIdToken,
    required String googleAccessToken,
  }) async {
    isAnonymous = false;
    return this;
  }
}

final class _PreviewFirebaseAuthGateway implements LudoFirebaseAuthGateway {
  final _user = _PreviewFirebaseUser();

  @override
  LudoFirebaseUser? get currentUser => _user;

  @override
  Future<LudoFirebaseUser> signInAnonymously() async => _user;
}

final class _PreviewGoogleSignInGateway implements LudoGoogleSignInGateway {
  @override
  Future<LudoGoogleSignInResult?> signIn() async =>
      const LudoGoogleSignInResult(
        idToken: 'preview-google-id-token',
        accessToken: 'preview-google-access-token',
        email: 'preview@example.com',
      );
}

// ---------------------------------------------------------------------
// The fake transport itself.
// ---------------------------------------------------------------------

final class _PreviewRoom {
  _PreviewRoom({required this.roomCode, required this.seatTarget});

  final String roomCode;
  final int seatTarget;
  String status = 'waiting';
  String? matchId;
}

final class _PreviewTicket {
  _PreviewTicket({required this.ticketId, required this.seatTarget});

  final String ticketId;
  final int seatTarget;
  String status = 'searching';
  String? matchedMatchId;
}

final class _PreviewMatch {
  _PreviewMatch({required this.matchId, required this.seatTarget});

  final String matchId;
  final int seatTarget;
  int currentPlayerIndex = 0;
  int pollCount = 0;
  bool botFilled = false;

  /// Whether this match has already run its one scripted
  /// disconnect/reconnect blip (task 26x (a)'s "a simulated disconnect
  /// transitioning to 'reconnecting', then resumed"). Fires once per
  /// match, a few polls in, so a device walkthrough reliably sees
  /// `LudoReconnectingBanner` appear and then clear itself without having
  /// to wait indefinitely or trigger it manually.
  bool disconnectSimulated = false;

  /// Remaining `/state` polls this match will fail with a thrown
  /// exception before resuming normally — see [disconnectSimulated].
  int disconnectFailuresRemaining = 0;
}

/// A scripted, in-memory [LudoHttpTransport]: every route this preview
/// mode needs is handled directly, entirely without a network — see this
/// file's doc comment. Not reused between app sessions (a fresh instance
/// per [createLudoPreviewOnlineClient] call), matching "armed state resets
/// on a fresh process launch" (`ludo_online_preview_mode.dart`).
final class PreviewLudoTransport implements LudoHttpTransport {
  PreviewLudoTransport({
    this.roomFillDelay = ludoPreviewRoomFillDelay,
    this.matchmakingDelay = ludoPreviewMatchmakingDelay,
  });

  final Duration roomFillDelay;
  final Duration matchmakingDelay;

  final _rooms = <String, _PreviewRoom>{};
  final _tickets = <String, _PreviewTicket>{};
  final _matches = <String, _PreviewMatch>{};
  int _roomCounter = 0;
  int _ticketCounter = 0;
  int _matchCounter = 0;

  @override
  Future<LudoHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    required Object? body,
    required Duration timeout,
    required int maxRequestBytes,
    required int maxResponseBytes,
  }) async {
    // A tiny, realistic "network" delay so a device walkthrough sees a
    // brief transition rather than an instant jump-cut.
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final path = _strippedPath(uri);
    final decodedBody = body == null
        ? const <String, Object?>{}
        : body as Map<String, Object?>;

    if (method == 'POST' && path == 'api/auth/exchange') {
      return _json({
        'accessToken': 'preview-access-token',
        'refreshToken': 'preview-refresh-token',
        'expiresIn': 3600,
        'tokenType': 'Bearer',
        'user': {'uid': 'preview-guest'},
      });
    }
    if (method == 'POST' && path == 'session') {
      return _json({
        'contract_version': ludoContractVersion,
        'game_token': 'preview-game-token',
        'app_id': 'ludo',
        'environment': 'debug',
        'subject': 'preview-guest',
        'expires_in': 300,
      });
    }
    if (method == 'POST' && path == 'rooms') {
      return _createRoom(decodedBody);
    }
    final roomMatch = RegExp(r'^rooms/([^/]+)$').firstMatch(path);
    if (method == 'GET' && roomMatch != null) {
      return _getRoom(roomMatch.group(1)!);
    }
    final roomJoinMatch = RegExp(r'^rooms/([^/]+)/join$').firstMatch(path);
    if (method == 'POST' && roomJoinMatch != null) {
      return _joinRoom(roomJoinMatch.group(1)!);
    }
    if (method == 'POST' && path == 'matchmaking/tickets') {
      return _createTicket(decodedBody);
    }
    final ticketMatch = RegExp(r'^matchmaking/tickets/([^/]+)$')
        .firstMatch(path);
    if (method == 'GET' && ticketMatch != null) {
      return _getTicket(ticketMatch.group(1)!);
    }
    if (method == 'DELETE' && ticketMatch != null) {
      return _cancelTicket(ticketMatch.group(1)!);
    }
    final matchStateMatch = RegExp(r'^matches/([^/]+)/state$').firstMatch(path);
    if (method == 'GET' && matchStateMatch != null) {
      return _getMatchView(matchStateMatch.group(1)!);
    }
    final matchMatch = RegExp(r'^matches/([^/]+)$').firstMatch(path);
    if (method == 'GET' && matchMatch != null) {
      return _getMatchState(matchMatch.group(1)!);
    }
    final commandMatch = RegExp(r'^matches/([^/]+)/commands$').firstMatch(path);
    if (method == 'POST' && commandMatch != null) {
      return _sendCommand(commandMatch.group(1)!);
    }
    throw StateError('No preview route for $method $path');
  }

  String _strippedPath(Uri uri) {
    const gamePrefix = '/games/ludo/debug/';
    var p = uri.path;
    if (p.startsWith(gamePrefix)) p = p.substring(gamePrefix.length);
    if (p.startsWith('/')) p = p.substring(1);
    return p;
  }

  LudoHttpResponse _json(Object? body, {int statusCode = 200}) =>
      LudoHttpResponse(statusCode: statusCode, body: jsonEncode(body));

  LudoHttpResponse _error(int statusCode, String code) => _json({
    'contract_version': ludoContractVersion,
    'error': {
      'code': code,
      'message': 'preview error: $code',
      'diagnostic_id': 'preview',
    },
  }, statusCode: statusCode);

  // -- Rooms --------------------------------------------------------

  LudoHttpResponse _createRoom(Map<String, Object?> body) {
    _roomCounter += 1;
    final seatTarget = body['seat_target'] as int? ?? 2;
    final roomCode = 'ROOM${_roomCounter.toString().padLeft(3, '0')}';
    final room = _PreviewRoom(roomCode: roomCode, seatTarget: seatTarget);
    _rooms[roomCode] = room;
    // Simulated friend joins after a fixed real delay (task 26x (a)).
    Timer(roomFillDelay, () {
      if (!_rooms.containsKey(roomCode)) return;
      final matchId = _newMatch(seatTarget: seatTarget, filledFriend: true);
      room
        ..status = 'matched'
        ..matchId = matchId;
    });
    return _json({
      'room': _roomWire(room),
      'invite_link': '$ludoDeepLinkScheme://room/$roomCode',
      'idempotent': false,
    });
  }

  LudoHttpResponse _getRoom(String roomCode) {
    if (roomCode == ludoPreviewExpiredRoomCode) {
      return _error(409, 'ludo_room_expired');
    }
    final room = _rooms[roomCode];
    if (room == null) return _error(404, 'ludo_room_not_found');
    return _json({'room': _roomWire(room)});
  }

  LudoHttpResponse _joinRoom(String roomCode) {
    if (roomCode == ludoPreviewInvalidRoomCode) {
      return _error(404, 'ludo_room_not_found');
    }
    if (roomCode == ludoPreviewExpiredRoomCode) {
      return _error(409, 'ludo_room_expired');
    }
    final room = _rooms.putIfAbsent(
      roomCode,
      () => _PreviewRoom(roomCode: roomCode, seatTarget: 2),
    );
    final matchId =
        room.matchId ??
        _newMatch(seatTarget: room.seatTarget, filledFriend: false);
    room
      ..status = 'matched'
      ..matchId = matchId;
    final match = _matches[matchId]!;
    return _json({
      'room': _roomWire(room),
      'match_state': _matchStateWire(match, joinerSeat: 1),
      'idempotent': false,
    });
  }

  Map<String, Object?> _roomWire(_PreviewRoom room) => {
    'room_code': room.roomCode,
    'environment': 'debug',
    'owner_subject': 'preview-guest',
    'mode': 'classic',
    'seat_target': room.seatTarget,
    'status': room.status,
    'match_id': room.matchId,
    'created_at': '2026-01-01T00:00:00.000Z',
    'expires_at': '2026-01-01T00:10:00.000Z',
  };

  // -- Matchmaking ----------------------------------------------------

  LudoHttpResponse _createTicket(Map<String, Object?> body) {
    _ticketCounter += 1;
    final seatTarget = body['seat_target'] as int? ?? 4;
    final ticketId = 'TICKET$_ticketCounter';
    final ticket = _PreviewTicket(ticketId: ticketId, seatTarget: seatTarget);
    _tickets[ticketId] = ticket;
    final botFill = ludoPreviewBotFill;
    ludoPreviewBotFill = !ludoPreviewBotFill; // alternate next search
    Timer(matchmakingDelay, () {
      if (!_tickets.containsKey(ticketId)) return;
      final matchId = _newMatch(
        seatTarget: seatTarget,
        filledFriend: false,
        botFill: botFill,
      );
      ticket
        ..status = 'matched'
        ..matchedMatchId = matchId;
    });
    return _json({'ticket': _ticketWire(ticket), 'idempotent': false});
  }

  LudoHttpResponse _getTicket(String ticketId) {
    final ticket = _tickets[ticketId];
    if (ticket == null) return _error(404, 'ludo_ticket_not_found');
    return _json({'ticket': _ticketWire(ticket)});
  }

  LudoHttpResponse _cancelTicket(String ticketId) {
    final ticket = _tickets[ticketId];
    if (ticket == null) return _error(404, 'ludo_ticket_not_found');
    ticket.status = 'cancelled';
    return _json({'ticket': _ticketWire(ticket)});
  }

  Map<String, Object?> _ticketWire(_PreviewTicket ticket) => {
    'ticket_id': ticket.ticketId,
    'environment': 'debug',
    'subject': 'preview-guest',
    'mode': 'classic',
    'seat_target': ticket.seatTarget,
    'status': ticket.status,
    'matched_match_id': ticket.matchedMatchId,
    'created_at': '2026-01-01T00:00:00.000Z',
    'expires_at': '2026-01-01T00:05:00.000Z',
  };

  // -- Matches ----------------------------------------------------------

  String _newMatch({
    required int seatTarget,
    required bool filledFriend,
    bool botFill = false,
  }) {
    _matchCounter += 1;
    final matchId = 'preview-match-$_matchCounter';
    _matches[matchId] = _PreviewMatch(matchId: matchId, seatTarget: seatTarget)
      ..botFilled = botFill;
    return matchId;
  }

  /// `GET matches/:id` (bare, not `/state`): [LudoGateway.getMatchState],
  /// used by [LudoOnlineController]'s room/matchmaking polling once a
  /// room/ticket is matched (see its own `_pollRoom`/`_runMatchmaking`).
  /// Distinct from [_getMatchView], the `/state` route
  /// `PollingMatchStateSource` uses once the match is already underway.
  LudoHttpResponse _getMatchState(String matchId) {
    final match = _matches[matchId];
    if (match == null) return _error(404, 'ludo_match_not_found');
    return _json({'match_state': _matchStateWire(match)});
  }

  LudoHttpResponse _getMatchView(String matchId) {
    final match = _matches[matchId];
    if (match == null) return _error(404, 'ludo_match_not_found');
    match.pollCount += 1;
    // Every third poll, hand the turn to the next seat, so the timer ring
    // and per-seat "your turn"/"opponent's turn" chrome are both
    // observable live, per this task's Context/Decisions.
    if (match.pollCount % 3 == 0) {
      match.currentPlayerIndex =
          (match.currentPlayerIndex + 1) % match.seatTarget;
    }
    // A one-time scripted disconnect/reconnect blip (task 26x (a)): a few
    // polls into the match, fail two consecutive `/state` polls so
    // `PollingMatchStateSource.connected` flips to `false` and
    // `LudoReconnectingBanner` becomes observable, then resume normally —
    // exercising the exact same "swallow the failure, keep polling" path
    // production hits on a real transient network drop.
    if (!match.disconnectSimulated && match.pollCount == 5) {
      match.disconnectSimulated = true;
      match.disconnectFailuresRemaining = 2;
    }
    if (match.disconnectFailuresRemaining > 0) {
      match.disconnectFailuresRemaining -= 1;
      throw StateError('ludo_preview_simulated_disconnect');
    }
    // Root-cause fix (found while wiring the disconnect/reconnect blip
    // above): `LudoGateway.getMatchView` requires the decoded body to
    // carry the view under a `match_view` key (mirroring the real
    // `GET .../matches/:id/state` route's envelope) before it ever hands
    // the inner object to `LudoMatchView.fromWire`. This handler
    // previously returned the view's fields at the JSON body's top level
    // with no `match_view` wrapper, so `LudoGateway.getMatchView` threw
    // `LudoProtocolException: Missing field in match view response` on
    // *every* preview `/state` poll — silently, since
    // `PollingMatchStateSource._tick` swallows every fetch failure — so
    // an online preview match's board never actually received a single
    // live state update after its initial `initialState` snapshot: no
    // opponent-turn hand-off, no server-driven timer-ring deadline, ever
    // reached the screen from this route. Wrapping the response fixes
    // that for every preview state, not just the disconnect blip.
    return _json({
      'match_view': {
        'match_id': match.matchId,
        'environment': 'debug',
        'match_state': _matchStateWire(match),
        'recent_events': const <Object?>[],
        'published_at': DateTime.now().toUtc().toIso8601String(),
      },
    });
  }

  LudoHttpResponse _sendCommand(String matchId) {
    final match = _matches[matchId];
    if (match == null) return _error(404, 'ludo_match_not_found');
    return _json({'match_state': _matchStateWire(match), 'idempotent': false});
  }

  Map<String, Object?> _matchStateWire(_PreviewMatch match, {int? joinerSeat}) {
    final seatColors = ['red', 'green', 'yellow', 'blue'];
    final deadline = DateTime.now()
        .toUtc()
        .add(const Duration(seconds: 30))
        .toIso8601String();
    return {
      'match_id': match.matchId,
      'environment': 'debug',
      'mode': match.seatTarget == 2 ? 'quick' : 'classic',
      'status': 'active',
      'players': [
        for (var seat = 0; seat < match.seatTarget; seat++)
          {
            'seat': seat,
            'subject': seat == 0
                ? 'preview-guest'
                : (match.botFilled && seat == match.seatTarget - 1)
                ? 'bot:easy-$seat'
                : 'preview-opponent-$seat',
            'color': seatColors[seat],
            'tokens': [
              for (var t = 0; t < 4; t++) {'id': t, 'path_position': -1},
            ],
            'capture_count': 0,
          },
      ],
      'current_player_index': match.currentPlayerIndex,
      'phase': 'awaiting_roll',
      'current_roll': null,
      'consecutive_sixes': 0,
      'winner_order': const <Object?>[],
      'deadline_at': deadline,
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    };
  }
}
