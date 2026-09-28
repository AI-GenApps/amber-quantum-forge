// Task 26e verification fix: `_submitMatchXp` (the code that decides "if
// levelsGained > 0, show the level-up celebration") was previously only
// covered by (a) `LudoLevelUpCelebration`'s isolated reduced-motion golden
// (never touches `_submitMatchXp`) and (b) `LudoWalletState.
// applyXpClaimResult`'s unit test (tests state mutation, not celebration
// triggering). This file drives `GameBoardScreen` itself — with a real
// `walletState`/`gateway`/`authController` wired to a fixture HTTP
// transport, never the network — to a finished, level-crossing match and
// asserts the celebration actually shows exactly once.
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart'
    show MemorySaveStore, runtimeAppContext;

import 'package:ludo/src/net/ludo_auth_controller.dart';
import 'package:ludo/src/net/ludo_firebase_gateway.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/net/ludo_match_state_source.dart';
import 'package:ludo/src/net/ludo_session_models.dart' show LudoMatchView;
import 'package:ludo/src/screens/game_board_screen.dart';
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/state/ludo_offline_xp_queue.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';
import 'package:ludo/src/state/ludo_wallet_state.dart';
import 'package:ludo/src/telemetry/ludo_telemetry.dart' show LudoMatchVariant;

import '../net/ludo_test_support.dart';

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
  _FakeUser? user;

  @override
  LudoFirebaseUser? get currentUser => user;

  @override
  Future<LudoFirebaseUser> signInAnonymously() async =>
      user ??= _FakeUser('uid-1');
}

final class _FakeGoogleSignIn implements LudoGoogleSignInGateway {
  @override
  Future<LudoGoogleSignInResult?> signIn() async => null;
}

/// Minimal [LudoMatchStateSource] test double (mirrors
/// `game_board_screen_test.dart`'s private `_FakeMatchStateSource`, which
/// isn't importable from here): [emit] pushes a view directly onto
/// [states], driving `_applyOnlineView` -> `_maybeNavigateToResults` ->
/// `_submitMatchXp` the same way a real server push would.
final class _FakeMatchStateSource implements LudoMatchStateSource {
  final _controller = StreamController<LudoMatchView>.broadcast();
  final _connectedController = StreamController<bool>.broadcast();

  @override
  Stream<LudoMatchView> get states => _controller.stream;

  @override
  Stream<bool> get connected => _connectedController.stream;

  void emit(LudoMatchView view) => _controller.add(view);

  @override
  Future<LudoMatchView> refresh() async =>
      throw StateError('refresh() unused in this test');

  @override
  void dispose() {
    unawaited(_controller.close());
    unawaited(_connectedController.close());
  }
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

/// A finished, seat-0-wins `match_view` wire map: seat 0 has all four
/// tokens home (path position 57, the Quick ruleset's home slot), seat 1
/// has none — a legitimately-finished state, not a hand-waved phase flag.
Map<String, Object?> _finishedMatchViewWire() => {
  'match_id': 'match-1',
  'environment': 'debug',
  'match_state': {
    'match_id': 'match-1',
    'environment': 'debug',
    'mode': 'quick',
    'status': 'finished',
    'players': [
      {
        'seat': 0,
        'subject': 'local-0',
        'color': 'red',
        'tokens': [
          {'id': 0, 'path_position': 57},
          {'id': 1, 'path_position': 57},
          {'id': 2, 'path_position': 57},
          {'id': 3, 'path_position': 57},
        ],
        'capture_count': 1,
      },
      {
        'seat': 1,
        'subject': 'local-1',
        'color': 'yellow',
        'tokens': [
          {'id': 0, 'path_position': -1},
          {'id': 1, 'path_position': -1},
          {'id': 2, 'path_position': -1},
          {'id': 3, 'path_position': -1},
        ],
        'capture_count': 0,
      },
    ],
    'current_player_index': 0,
    'phase': 'finished',
    'current_roll': null,
    'consecutive_sixes': 0,
    'winner_order': [0],
    'deadline_at': null,
    'updated_at': '2026-01-01T00:00:02.000Z',
  },
  'recent_events': const <Object?>[],
  'published_at': '2026-01-01T00:00:02.000Z',
};

LudoLocalMatchConfig _twoPlayerConfig() => const LudoLocalMatchConfig(
  ruleset: LudoRuleset.quick,
  isComputerMatch: false,
  seats: [
    LudoSeatConfig(color: LudoColor.red, isBot: false),
    LudoSeatConfig(color: LudoColor.yellow, isBot: false),
  ],
);

const _identities = [
  LudoSeatIdentity(name: 'You', avatarId: 'red-face'),
  LudoSeatIdentity(name: 'Friend', avatarId: 'yellow-face'),
];

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

/// Pumps enough frames for the `unawaited(_submitMatchXp())` chain (a
/// handful of awaited fixture-transport round trips, never a real delay)
/// and the results-screen push/celebration dialog push to fully settle,
/// without ever calling `pumpAndSettle` — a live `FlameGame` anywhere in
/// the tree reschedules a frame every tick, which would hang it forever.
Future<void> _pumpUntilSettled(WidgetTester tester) async {
  for (var i = 0; i < 30; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

void main() {
  testWidgets(
    'an XP claim crossing a level boundary shows the level-up celebration '
    'exactly once',
    (tester) async {
      final transport = QueueLudoTransport({
        'POST api/auth/exchange': [jsonResponse(_exchangeResponse())],
        'POST session': [jsonResponse(_sessionResponse())],
        'POST xp/claim': [
          jsonResponse({
            'idempotent': false,
            'xp': 100,
            'level': 2,
            'xpRequiredForNextLevel': 300,
            'levelsGained': 1,
          }),
        ],
        // The post-claim `LudoWalletState.refresh()` `_submitMatchXp`
        // performs to learn the reward it should show — coins rise from
        // this wallet's starting 0 to 250, a real server-credited delta,
        // never a fabricated or hand-rolled amount.
        'GET wallet': [
          jsonResponse({'coins': 250, 'diamonds': 0}),
        ],
        'GET profile': [
          jsonResponse({'level': 2, 'xp': 100, 'xpRequiredForNextLevel': 300}),
        ],
      });
      final gateway = LudoGateway(config: _config(), transport: transport);
      final authController = LudoAuthController(
        gateway: gateway,
        firebaseAuth: _FakeFirebaseAuth(),
        googleSignIn: _FakeGoogleSignIn(),
      );
      final walletState = LudoWalletState(
        gateway: gateway,
        authController: authController,
      );
      final offlineXpQueue = LudoOfflineXpQueue(
        saveStore: MemorySaveStore(),
        appContext: runtimeAppContext(identity: ludoOfflineXpQueueIdentity),
      );

      final fakeSource = _FakeMatchStateSource();
      final onlineMatch = LudoOnlineMatchSession(
        gateway: gateway,
        matchId: 'match-1',
        gameToken: 'game-token-1',
        localSeat: 0,
        stateSource: fakeSource,
      );

      await tester.pumpWidget(
        _wrap(
          GameBoardScreen(
            config: _twoPlayerConfig(),
            seatIdentities: _identities,
            soundSettings: LudoSoundSettings(),
            initialState: LudoMatchState.initial(
              ruleset: _twoPlayerConfig().ruleset,
              subjects: const ['local-0', 'local-1'],
            ),
            onlineMatch: onlineMatch,
            onlineVariant: LudoMatchVariant.online,
            walletState: walletState,
            gateway: gateway,
            authController: authController,
            offlineXpQueue: offlineXpQueue,
          ),
        ),
      );
      await tester.pump();

      fakeSource.emit(LudoMatchView.fromWire(_finishedMatchViewWire()));
      await _pumpUntilSettled(tester);

      // Exactly one celebration for this one level crossing: each of
      // these texts is rendered by exactly one `LudoLevelUpCelebration`
      // instance, never duplicated by a double-fire of
      // `_maybeNavigateToResults`/`_submitMatchXp` (guarded by
      // `_matchFinishedRecorded`).
      expect(find.text('LEVEL UP!'), findsOneWidget);
      expect(find.text('Level 2'), findsOneWidget);
      expect(find.text('+250 coins'), findsOneWidget);
      expect(walletState.level, 2);
      expect(walletState.coins, 250);
    },
  );
}
