/// Task 24's acceptance case: with no Firebase config present (the normal
/// state of a `flutter test` host process — no platform channel mock for
/// `firebase_core` is installed anywhere in this repo, so a real
/// `Firebase.initializeApp()` call fails exactly as it would on a device
/// with no `google-services.json`/`GoogleService-Info.plist`), the app
/// boots and the still-disabled (task 08) Online/Play-with-Friends lobby
/// tiles show their "unavailable" state with no crash, no hang, and no
/// tappable action.
///
/// Real device verification with and without a fake Firebase config file
/// present is out of scope for a host-run `flutter test` (there is no
/// native Android/iOS Firebase config to vary here) and belongs to this
/// task's on-device verification pass instead; this test proves the
/// *Dart-level* guard (`ensureLudoFirebaseInitialized` never throwing, the
/// app never depending on its result to boot) that guard relies on.
library;

import 'dart:async' show unawaited;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/net/ludo_auth_controller.dart';
import 'package:ludo/src/net/ludo_firebase_gateway.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/net/ludo_online_client.dart';
import 'package:ludo/src/net/ludo_online_controller.dart';
import 'package:ludo/src/screens/game_board_screen.dart';
import 'package:ludo/src/screens/home_lobby_screen.dart';
import 'package:ludo/src/state/ludo_profile_settings.dart';
import 'package:ludo/src/telemetry/ludo_telemetry.dart';

import '../net/ludo_test_support.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

/// Pumps past a continuously-animating widget (a live `FlameGame`, an
/// indeterminate `CircularProgressIndicator`) without ever calling
/// `pumpAndSettle`, which would hang on either — mirrors
/// `game_board_screen_test.dart`'s own `_pumpGame` helper. Each `step`
/// advances the fake-async clock enough to fire any pending
/// `Future.delayed`-based poll tick this test is waiting on.
Future<void> _pumpTicks(
  WidgetTester tester, {
  Duration step = const Duration(milliseconds: 20),
  int times = 10,
}) async {
  for (var i = 0; i < times; i++) {
    await tester.pump(step);
  }
}

LudoProfileSettings _testProfile() =>
    LudoProfileSettings(name: 'Rae', avatarId: 'red-face');

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

/// Builds a test [LudoOnlineClient] on a fast poll interval, wired to
/// [transport] — never a real Firebase channel or the network.
LudoOnlineClient _onlineClient(QueueLudoTransport transport) {
  final gateway = LudoGateway(config: _config(), transport: transport);
  final authController = LudoAuthController(
    gateway: gateway,
    firebaseAuth: _FakeFirebaseAuth(),
    googleSignIn: _FakeGoogleSignIn(),
  );
  return LudoOnlineClient(
    gateway: gateway,
    authController: authController,
    onlineController: LudoOnlineController(
      gateway: gateway,
      authController: authController,
      telemetry: LudoTelemetry(),
      pollInterval: const Duration(milliseconds: 5),
    ),
  );
}

void main() {
  test('ensureLudoFirebaseInitialized degrades to false with no Firebase config, never throwing', () async {
    // No `TestDefaultBinaryMessengerBinding` mock is installed for
    // `plugins.flutter.io/firebase_core` anywhere in this suite, so this
    // call takes the exact "no config present" path a real device build
    // with a missing `google-services.json` would.
    final available = await ensureLudoFirebaseInitialized();
    expect(available, isFalse);
  });

  testWidgets(
    'home lobby boots and shows Online/Play with Friends as unavailable, never crashing',
    (tester) async {
      // Mirrors `main.dart`'s guarded, fire-and-forget bootstrap: nothing
      // in this pump awaits or depends on its result.
      unawaited(ensureLudoFirebaseInitialized());

      await tester.pumpWidget(_wrap(HomeLobbyScreen(profile: _testProfile())));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Computer'), findsOneWidget);
      expect(find.text('Pass N Play'), findsOneWidget);
      expect(find.text('Play with Friends'), findsOneWidget);
      expect(find.text('Online'), findsOneWidget);
      expect(find.text('Not available yet'), findsNWidgets(2));
      expect(find.text('Coming soon'), findsNWidgets(2));

      // Tapping either disabled tile does nothing: no navigation, no
      // exception, no pending timers/animations left running.
      await tester.tap(find.text('Online'));
      await tester.pump();
      expect(tester.takeException(), isNull);
      expect(find.byType(HomeLobbyScreen), findsOneWidget);

      await tester.tap(find.text('Play with Friends'));
      await tester.pump();
      expect(tester.takeException(), isNull);
      expect(find.byType(HomeLobbyScreen), findsOneWidget);
    },
  );

  testWidgets('the lobby tiles are enabled once an online client resolves', (
    tester,
  ) async {
    final transport = QueueLudoTransport({});
    await tester.pumpWidget(
      _wrap(
        HomeLobbyScreen(
          profile: _testProfile(),
          onlineClient: _onlineClient(transport),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Coming soon'), findsNothing);
    expect(find.text('Create or join a room'), findsOneWidget);
    expect(find.text('Random matchmaking'), findsOneWidget);
  });

  testWidgets('joining a room by code reaches the board', (tester) async {
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
    await tester.pumpWidget(
      _wrap(
        HomeLobbyScreen(
          profile: _testProfile(),
          onlineClient: _onlineClient(transport),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Play with Friends'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Join Room'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const Key('friends-setup-code-field')),
      'abc123',
    );
    await tester.tap(find.byKey(const Key('friends-setup-join-button')));
    // Not `pumpAndSettle`: the pushed `GameBoardScreen` hosts a live
    // `FlameGame` that reschedules every frame, so `pumpAndSettle` would
    // hang (mirrors `game_board_screen_test.dart`'s own `_pumpGame`).
    await _pumpTicks(tester);

    expect(find.byType(GameBoardScreen), findsOneWidget);
    expect(
      transport.requests.any((r) => r.$1 == 'POST rooms/ABC123/join'),
      isTrue,
    );
  });

  testWidgets('creating a room and waiting reaches the board once it fills', (
    tester,
  ) async {
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
    await tester.pumpWidget(
      _wrap(
        HomeLobbyScreen(
          profile: _testProfile(),
          onlineClient: _onlineClient(transport),
          shareInviteLink: (_) async {},
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Play with Friends'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('friends-setup-create-button')));
    // Not `pumpAndSettle` from here on: the room-fill wait shows a
    // continuously-animating `CircularProgressIndicator`
    // (`MatchmakingSearchScreen`), and the eventual `GameBoardScreen`
    // hosts a live `FlameGame` — both reschedule every frame, so
    // `pumpAndSettle` would hang on either. Bounded pumps advance the
    // fake clock enough to fire the room-fill poll's `Future.delayed`
    // ticks (5ms interval) instead.
    await _pumpTicks(tester);

    expect(find.byType(GameBoardScreen), findsOneWidget);
  });

  testWidgets(
    'cancelling a matchmaking search sends the cancel call and returns to the lobby',
    (tester) async {
      final transport = QueueLudoTransport({
        'POST api/auth/exchange': [jsonResponse(_exchangeResponse())],
        'POST session': [jsonResponse(_sessionResponse())],
        'POST matchmaking/tickets': [
          jsonResponse({
            'ticket': _ticketWire(status: 'searching'),
            'idempotent': false,
          }),
        ],
        // Generously over-provisioned: exactly how many poll ticks land
        // before `cancel()` actually takes effect depends on fake-async
        // timing, not this test's business — see `_pumpTicks`'s doc
        // comment above.
        'GET matchmaking/tickets/ticket-1': [
          for (var i = 0; i < 50; i++)
            jsonResponse({'ticket': _ticketWire(status: 'searching')}),
        ],
        'DELETE matchmaking/tickets/ticket-1': [
          jsonResponse({'ticket': _ticketWire(status: 'cancelled')}),
        ],
      });
      await tester.pumpWidget(
        _wrap(
          HomeLobbyScreen(
            profile: _testProfile(),
            onlineClient: _onlineClient(transport),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Online'));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('online-setup-find-match-button')));
      // Not `pumpAndSettle`: the search screen's `CircularProgressIndicator`
      // animates continuously. A couple of bounded ticks are enough to let
      // the ticket-create call and its first poll land before cancelling.
      await _pumpTicks(tester, times: 4);
      expect(find.text('Finding players...'), findsOneWidget);

      await tester.tap(find.byKey(const Key('matchmaking-cancel-button')));
      await _pumpTicks(tester);

      expect(find.byType(GameBoardScreen), findsNothing);
      expect(find.text('Finding players...'), findsNothing);
      expect(
        transport.requests.any(
          (r) => r.$1 == 'DELETE matchmaking/tickets/ticket-1',
        ),
        isTrue,
      );
    },
  );
}
