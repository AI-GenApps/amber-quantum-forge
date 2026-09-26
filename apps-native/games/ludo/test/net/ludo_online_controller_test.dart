// Tests for task 26's `LudoOnlineController`: room create/join, room-fill
// polling, and matchmaking search (matched, cancelled, and bot-filled
// outcomes) — all against `QueueLudoTransport`, never the network or a
// real auth controller's Firebase dependency (the underlying
// `LudoAuthController` is driven by the same fake Firebase gateways
// `ludo_auth_controller_test.dart` uses).
import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart'
    show FixedClock, MemoryTelemetrySink;

import 'package:ludo/src/net/ludo_auth_controller.dart';
import 'package:ludo/src/net/ludo_firebase_gateway.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/net/ludo_match_models.dart';
import 'package:ludo/src/net/ludo_online_controller.dart';
import 'package:ludo/src/telemetry/ludo_telemetry.dart';

import 'ludo_test_support.dart';

final class _FakeUser implements LudoFirebaseUser {
  _FakeUser(this.uid);

  @override
  final String uid;

  @override
  bool isAnonymous = true;

  @override
  Future<String> getIdToken({bool forceRefresh = false}) async =>
      'id-token-for-$uid';

  @override
  Future<LudoFirebaseUser> linkWithGoogleCredential({
    required String googleIdToken,
    required String googleAccessToken,
  }) async => this;
}

final class _FakeFirebaseAuth implements LudoFirebaseAuthGateway {
  _FakeUser? _user;

  @override
  LudoFirebaseUser? get currentUser => _user;

  @override
  Future<LudoFirebaseUser> signInAnonymously() async =>
      _user ??= _FakeUser('uid-1');
}

final class _FakeGoogleSignIn implements LudoGoogleSignInGateway {
  @override
  Future<LudoGoogleSignInResult?> signIn() async => null;
}

LudoNetworkConfig _config() => LudoNetworkConfig(
  apiBaseUri: Uri.parse('https://api.example.test/'),
  environment: 'debug',
);

Map<String, Object?> _exchangeResponse() => {
  'accessToken': 'access-1',
  'refreshToken': 'refresh-1',
  'expiresIn': 21600,
  'tokenType': 'Bearer',
  'user': {
    'uid': 'uid-1',
    'email': null,
    'displayName': null,
    'photoURL': null,
  },
};

Map<String, Object?> _sessionResponse() => {
  'contract_version': 'ludo.v1',
  'game_token': 'game-token-1',
  'app_id': 'ludo',
  'environment': 'debug',
  'subject': 'uid-1',
  'expires_in': 300,
};

Map<String, Object?> _player({
  required int seat,
  required String subject,
  String color = 'red',
}) => {
  'seat': seat,
  'subject': subject,
  'color': color,
  'tokens': const <Object?>[],
  'capture_count': 0,
};

Map<String, Object?> _matchStateWire({
  String matchId = 'match-1',
  List<Map<String, Object?>>? players,
}) => {
  'match_id': matchId,
  'environment': 'debug',
  'mode': 'classic',
  'status': 'active',
  'players':
      players ??
      [
        _player(seat: 0, subject: 'uid-1', color: 'red'),
        _player(seat: 1, subject: 'uid-2', color: 'yellow'),
      ],
  'current_player_index': 0,
  'phase': 'awaiting_roll',
  'current_roll': null,
  'consecutive_sixes': 0,
  'winner_order': const <Object?>[],
  'deadline_at': null,
  'updated_at': '2026-01-01T00:00:00.000Z',
};

Map<String, Object?> _roomWire({required String status, String? matchId}) => {
  'room_code': 'ABC123',
  'environment': 'debug',
  'owner_subject': 'uid-1',
  'mode': 'classic',
  'seat_target': 2,
  'status': status,
  'match_id': matchId,
  'created_at': '2026-01-01T00:00:00.000Z',
  'expires_at': '2026-01-02T00:00:00.000Z',
};

Map<String, Object?> _ticketWire({
  required String status,
  String? matchedMatchId,
}) => {
  'ticket_id': 'ticket-1',
  'environment': 'debug',
  'subject': 'uid-1',
  'mode': 'classic',
  'seat_target': 2,
  'status': status,
  'matched_match_id': matchedMatchId,
  'created_at': '2026-01-01T00:00:00.000Z',
  'expires_at': '2026-01-01T00:05:00.000Z',
};

/// Builds a controller wired to [transport], authenticating (guest,
/// `uid-1`) lazily on its first gateway call, exactly as production does.
LudoOnlineController _controller(
  QueueLudoTransport transport, {
  MemoryTelemetrySink? sink,
}) {
  final gateway = LudoGateway(config: _config(), transport: transport);
  final authController = LudoAuthController(
    gateway: gateway,
    firebaseAuth: _FakeFirebaseAuth(),
    googleSignIn: _FakeGoogleSignIn(),
  );
  return LudoOnlineController(
    gateway: gateway,
    authController: authController,
    telemetry: LudoTelemetry(
      clock: FixedClock(DateTime.utc(2026, 1, 1, 12)),
      sink: sink ?? MemoryTelemetrySink(),
    ),
    pollInterval: const Duration(milliseconds: 5),
  );
}

void main() {
  test('createRoom decodes the room and records ludo_room_created', () async {
    final sink = MemoryTelemetrySink();
    final transport = QueueLudoTransport({
      'POST api/auth/exchange': [jsonResponse(_exchangeResponse())],
      'POST session': [jsonResponse(_sessionResponse())],
      'POST rooms': [
        jsonResponse({
          'room': _roomWire(status: 'waiting'),
          'invite_link': 'w3dev-ludo://room/ABC123',
          'idempotent': false,
        }),
      ],
    });
    final controller = _controller(transport, sink: sink);

    final created = await controller.createRoom(
      mode: LudoMode.classic,
      seatTarget: 2,
    );
    expect(created.roomCode, 'ABC123');
    expect(created.inviteLink, 'w3dev-ludo://room/ABC123');
    expect(sink.events.single.name, 'ludo_room_created');
    expect(sink.events.single.fields['rule_version'], 'classic');
    expect(sink.events.single.fields['score'], 2);
  });

  test('joinRoom decodes the match and records ludo_room_joined', () async {
    final sink = MemoryTelemetrySink();
    final transport = QueueLudoTransport({
      'POST api/auth/exchange': [jsonResponse(_exchangeResponse())],
      'POST session': [jsonResponse(_sessionResponse())],
      'POST rooms/ABC123/join': [
        jsonResponse({
          'room': _roomWire(status: 'matched', matchId: 'match-1'),
          'match_state': _matchStateWire(),
          'idempotent': false,
        }),
      ],
    });
    final controller = _controller(transport, sink: sink);

    final ready = await controller.joinRoom(roomCode: 'ABC123');
    expect(ready.matchId, 'match-1');
    expect(ready.localSeat, 0);
    expect(sink.events.single.name, 'ludo_room_joined');
  });

  test(
    'awaitRoomFilled polls until matched, then fetches match state',
    () async {
      final transport = QueueLudoTransport({
        'POST api/auth/exchange': [jsonResponse(_exchangeResponse())],
        'POST session': [jsonResponse(_sessionResponse())],
        'GET rooms/ABC123': [
          jsonResponse({'room': _roomWire(status: 'waiting')}),
          jsonResponse({
            'room': _roomWire(status: 'matched', matchId: 'match-1'),
          }),
        ],
        'GET matches/match-1': [
          jsonResponse({'match_state': _matchStateWire()}),
        ],
      });
      final controller = _controller(transport);

      final wait = controller.awaitRoomFilled(roomCode: 'ABC123');
      final ready = await wait.result;
      expect(ready.matchId, 'match-1');
      expect(ready.localSeat, 0);
    },
  );

  test('startMatchmaking records ludo_matchmaking_started, then matched with no bot fill', () async {
    final sink = MemoryTelemetrySink();
    final transport = QueueLudoTransport({
      'POST api/auth/exchange': [jsonResponse(_exchangeResponse())],
      'POST session': [jsonResponse(_sessionResponse())],
      'POST matchmaking/tickets': [
        jsonResponse({
          'ticket': _ticketWire(status: 'searching'),
          'idempotent': false,
        }),
      ],
      'GET matchmaking/tickets/ticket-1': [
        jsonResponse({'ticket': _ticketWire(status: 'searching')}),
        jsonResponse({
          'ticket': _ticketWire(status: 'matched', matchedMatchId: 'match-1'),
        }),
      ],
      'GET matches/match-1': [
        jsonResponse({'match_state': _matchStateWire()}),
      ],
    });
    final controller = _controller(transport, sink: sink);

    final wait = controller.startMatchmaking(
      mode: LudoMode.classic,
      seatTarget: 2,
    );
    final ready = await wait.result;
    expect(ready.matchId, 'match-1');
    expect(ready.localSeat, 0);

    final names = sink.events.map((e) => e.name).toList();
    expect(names, ['ludo_matchmaking_started', 'ludo_matchmaking_matched']);
    expect(names, isNot(contains('ludo_bot_fill_triggered')));
  });

  test('startMatchmaking records ludo_bot_fill_triggered when a bot seat is present', () async {
    final sink = MemoryTelemetrySink();
    final transport = QueueLudoTransport({
      'POST api/auth/exchange': [jsonResponse(_exchangeResponse())],
      'POST session': [jsonResponse(_sessionResponse())],
      'POST matchmaking/tickets': [
        jsonResponse({
          'ticket': _ticketWire(status: 'searching'),
          'idempotent': false,
        }),
      ],
      'GET matchmaking/tickets/ticket-1': [
        jsonResponse({
          'ticket': _ticketWire(status: 'matched', matchedMatchId: 'match-1'),
        }),
      ],
      'GET matches/match-1': [
        jsonResponse({
          'match_state': _matchStateWire(
            players: [
              _player(seat: 0, subject: 'uid-1', color: 'red'),
              _player(
                seat: 1,
                subject: 'bot:11111111-1111-1111-1111-111111111111',
                color: 'yellow',
              ),
            ],
          ),
        }),
      ],
    });
    final controller = _controller(transport, sink: sink);

    final wait = controller.startMatchmaking(
      mode: LudoMode.classic,
      seatTarget: 2,
    );
    await wait.result;

    final botFillEvent = sink.events.firstWhere(
      (e) => e.name == 'ludo_bot_fill_triggered',
    );
    expect(botFillEvent.fields['score'], 1);
  });

  test('cancelling a matchmaking search sends the cancel gateway call and leaves no orphaned ticket', () async {
    final transport = QueueLudoTransport({
      'POST api/auth/exchange': [jsonResponse(_exchangeResponse())],
      'POST session': [jsonResponse(_sessionResponse())],
      'POST matchmaking/tickets': [
        jsonResponse({
          'ticket': _ticketWire(status: 'searching'),
          'idempotent': false,
        }),
      ],
      // Generously over-provisioned: real timing (this test uses a real
      // 5ms poll interval, not fake-async) means exactly how many poll
      // ticks land before `cancel()` takes effect can vary under load —
      // that variance isn't this test's business, only that the cancel
      // call is made and no exception escapes.
      'GET matchmaking/tickets/ticket-1': [
        for (var i = 0; i < 50; i++)
          jsonResponse({'ticket': _ticketWire(status: 'searching')}),
      ],
      'DELETE matchmaking/tickets/ticket-1': [
        jsonResponse({'ticket': _ticketWire(status: 'cancelled')}),
      ],
    });
    final controller = _controller(transport);

    final wait = controller.startMatchmaking(
      mode: LudoMode.classic,
      seatTarget: 2,
    );
    // Give the ticket-create call (and its first poll tick) a moment to
    // land before cancelling, mirroring a user tapping Cancel mid-search.
    await Future<void>.delayed(const Duration(milliseconds: 20));
    await wait.cancel();

    await expectLater(wait.result, throwsA(isA<StateError>()));
    expect(
      transport.requests.any(
        (r) => r.$1 == 'DELETE matchmaking/tickets/ticket-1',
      ),
      isTrue,
    );
  });
}
