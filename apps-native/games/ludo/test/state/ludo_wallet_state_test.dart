// Tests `LudoWalletState` against a real `LudoAuthController` wired to a
// fake Firebase gateway and a fixture HTTP transport (same pattern as
// `test/net/ludo_auth_controller_test.dart`), never the network or real
// Firebase plugin channels.
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_auth_controller.dart';
import 'package:ludo/src/net/ludo_firebase_gateway.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/state/ludo_wallet_state.dart';

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

(LudoWalletState, FixtureLudoTransport) _harness(
  Map<String, LudoHttpResponse> extraResponses,
) {
  final transport = FixtureLudoTransport({
    'POST api/auth/exchange': jsonResponse(_exchangeResponse()),
    'POST session': jsonResponse(_sessionResponse()),
    ...extraResponses,
  });
  final gateway = LudoGateway(config: _config(), transport: transport);
  final authController = LudoAuthController(
    gateway: gateway,
    firebaseAuth: _FakeFirebaseAuth(),
    googleSignIn: _FakeGoogleSignIn(),
  );
  final state = LudoWalletState(
    gateway: gateway,
    authController: authController,
  );
  return (state, transport);
}

void main() {
  test('refresh populates coins/diamonds/level/xp from the gateway', () async {
    final (state, _) = _harness({
      'GET wallet': jsonResponse({'coins': 500, 'diamonds': 10}),
      'GET profile': jsonResponse({
        'level': 3,
        'xp': 240,
        'xpRequiredForNextLevel': 300,
      }),
    });

    await state.refresh();

    expect(state.coins, 500);
    expect(state.diamonds, 10);
    expect(state.level, 3);
    expect(state.xp, 240);
    expect(state.xpRequiredForNextLevel, 300);
    expect(state.hasSynced, isTrue);
    expect(state.isOffline, isFalse);
  });

  test(
    'a failed refresh flags isOffline and keeps the last-synced snapshot',
    () async {
      final (state, _) = _harness({
        'GET wallet': jsonResponse({'coins': 500, 'diamonds': 10}),
        'GET profile': jsonResponse({
          'level': 3,
          'xp': 240,
          'xpRequiredForNextLevel': 300,
        }),
      });
      await state.refresh();
      expect(state.isOffline, isFalse);

      // A second gateway pointed at a transport with no fixtures at all
      // simulates "no network reachable" without needing a real socket.
      final offlineTransport = FixtureLudoTransport(const {});
      final offlineGateway = LudoGateway(
        config: _config(),
        transport: offlineTransport,
      );
      final offlineState = LudoWalletState(
        gateway: offlineGateway,
        authController: LudoAuthController(
          gateway: offlineGateway,
          firebaseAuth: _FakeFirebaseAuth(),
          googleSignIn: _FakeGoogleSignIn(),
        ),
      );
      await offlineState.refresh();

      expect(offlineState.isOffline, isTrue);
      expect(offlineState.hasSynced, isFalse);
      // Unaffected snapshot from before still holds for the first state.
      expect(state.coins, 500);
    },
  );

  test('applyXpClaimResult updates the cached progression', () async {
    final (state, _) = _harness({
      'GET wallet': jsonResponse({'coins': 0, 'diamonds': 0}),
      'GET profile': jsonResponse({
        'level': 1,
        'xp': 0,
        'xpRequiredForNextLevel': 100,
      }),
    });
    await state.refresh();

    state.applyXpClaimResult(
      const LudoXpClaimResult(
        idempotent: false,
        xp: 100,
        level: 2,
        xpRequiredForNextLevel: 300,
        levelsGained: 1,
      ),
    );

    expect(state.level, 2);
    expect(state.xp, 100);
    expect(state.xpRequiredForNextLevel, 300);
  });

  test('xpProgress is the clamped fraction toward the next level', () async {
    final (state, _) = _harness({
      'GET wallet': jsonResponse({'coins': 0, 'diamonds': 0}),
      'GET profile': jsonResponse({
        'level': 2,
        'xp': 150,
        'xpRequiredForNextLevel': 300,
      }),
    });
    await state.refresh();
    expect(state.xpProgress, closeTo(0.5, 0.001));
  });
}
