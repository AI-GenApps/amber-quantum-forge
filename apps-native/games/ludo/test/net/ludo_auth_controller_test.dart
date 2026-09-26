// Tests `LudoAuthController` against a fake `firebase_auth`
// (`FakeLudoFirebaseAuthGateway`/`FakeLudoGoogleSignInGateway`) and a fake
// HTTP transport — never real Firebase plugin channels, which don't exist
// in a `flutter test` host process, and never the network.
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/net/ludo_auth_controller.dart';
import 'package:ludo/src/net/ludo_firebase_gateway.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:platform_core/platform_core.dart' show Clock, FixedClock;

import 'ludo_test_support.dart';

final class _FakeUser implements LudoFirebaseUser {
  _FakeUser(this.uid) : idToken = 'id-token-for-$uid';

  @override
  final String uid;

  @override
  bool isAnonymous = true;

  String idToken;
  int getIdTokenCalls = 0;

  @override
  Future<String> getIdToken({bool forceRefresh = false}) async {
    getIdTokenCalls++;
    return idToken;
  }

  @override
  Future<LudoFirebaseUser> linkWithGoogleCredential({
    required String googleIdToken,
    required String googleAccessToken,
  }) async {
    isAnonymous = false;
    idToken = 'linked-id-token-for-$uid';
    return this;
  }
}

final class _FakeFirebaseAuth implements LudoFirebaseAuthGateway {
  _FakeFirebaseAuth({this.available = true});

  bool available;
  _FakeUser? user;
  int signInCalls = 0;

  @override
  LudoFirebaseUser? get currentUser => user;

  @override
  Future<LudoFirebaseUser> signInAnonymously() async {
    signInCalls++;
    if (!available) throw const LudoFirebaseUnavailableException();
    return user ??= _FakeUser('uid-1');
  }
}

final class _FakeGoogleSignIn implements LudoGoogleSignInGateway {
  _FakeGoogleSignIn({this.result});

  LudoGoogleSignInResult? result;
  bool cancelled = false;

  @override
  Future<LudoGoogleSignInResult?> signIn() async => cancelled ? null : result;
}

LudoNetworkConfig _config() => LudoNetworkConfig(
  apiBaseUri: Uri.parse('https://api.example.test/'),
  environment: 'debug',
);

Map<String, Object?> _exchangeResponse({
  String uid = 'uid-1',
  String access = 'access-1',
}) => {
  'accessToken': access,
  'refreshToken': 'refresh-1',
  'expiresIn': 21600,
  'tokenType': 'Bearer',
  'user': {'uid': uid, 'email': null, 'displayName': null, 'photoURL': null},
};

Map<String, Object?> _sessionResponse({
  String token = 'game-token-1',
  int expiresIn = 300,
}) => {
  'contract_version': 'ludo.v1',
  'game_token': token,
  'app_id': 'ludo',
  'environment': 'debug',
  'subject': 'uid-1',
  'expires_in': expiresIn,
};

void main() {
  group('LudoAuthController guest sign-in', () {
    test('signs in anonymously, exchanges, and mints a game token', () async {
      final firebaseAuth = _FakeFirebaseAuth();
      final transport = FixtureLudoTransport({
        'POST api/auth/exchange': jsonResponse(_exchangeResponse()),
        'POST session': jsonResponse(_sessionResponse()),
      });
      final controller = LudoAuthController(
        gateway: LudoGateway(config: _config(), transport: transport),
        firebaseAuth: firebaseAuth,
        googleSignIn: _FakeGoogleSignIn(),
      );

      final token = await controller.ensureGameToken();

      expect(token, 'game-token-1');
      expect(firebaseAuth.signInCalls, 1);
      expect(controller.state?.uid, 'uid-1');
      expect(controller.state?.isLinked, isFalse);
    });

    test(
      'reuses an already-signed-in Firebase user without re-signing-in',
      () async {
        final firebaseAuth = _FakeFirebaseAuth()..user = _FakeUser('uid-2');
        final transport = FixtureLudoTransport({
          'POST api/auth/exchange': jsonResponse(
            _exchangeResponse(uid: 'uid-2'),
          ),
          'POST session': jsonResponse(_sessionResponse()),
        });
        final controller = LudoAuthController(
          gateway: LudoGateway(config: _config(), transport: transport),
          firebaseAuth: firebaseAuth,
          googleSignIn: _FakeGoogleSignIn(),
        );

        await controller.ensureGameToken();

        expect(firebaseAuth.signInCalls, 0);
      },
    );

    test('reports firebaseUnavailable when Firebase has no config', () async {
      final controller = LudoAuthController(
        gateway: LudoGateway(
          config: _config(),
          transport: FixtureLudoTransport({}),
        ),
        firebaseAuth: _FakeFirebaseAuth(available: false),
        googleSignIn: _FakeGoogleSignIn(),
      );

      await expectLater(
        controller.ensureGameToken(),
        throwsA(
          isA<LudoAuthFailure>().having(
            (e) => e.reason,
            'reason',
            LudoAuthFailureReason.firebaseUnavailable,
          ),
        ),
      );
    });
  });

  group('LudoAuthController token caching/refresh', () {
    test('a second call within the TTL reuses the cached game token', () async {
      final firebaseAuth = _FakeFirebaseAuth();
      final transport = FixtureLudoTransport({
        'POST api/auth/exchange': jsonResponse(_exchangeResponse()),
        'POST session': jsonResponse(_sessionResponse()),
      });
      final controller = LudoAuthController(
        gateway: LudoGateway(config: _config(), transport: transport),
        firebaseAuth: firebaseAuth,
        googleSignIn: _FakeGoogleSignIn(),
        clock: FixedClock(DateTime.utc(2026, 1, 1)),
      );

      final first = await controller.ensureGameToken();
      final second = await controller.ensureGameToken();

      expect(first, second);
      // Only one session call: the second `ensureGameToken()` served the
      // still-fresh cached token with no network call at all.
      expect(
        transport.requests.where((r) => r.$1 == 'POST session'),
        hasLength(1),
      );
    });

    test('refreshes the game token once it is past its TTL margin', () async {
      final firebaseAuth = _FakeFirebaseAuth();
      final responses = QueueLudoTransport({
        'POST api/auth/exchange': [jsonResponse(_exchangeResponse())],
        'POST session': [
          jsonResponse(_sessionResponse(token: 'game-token-1')),
          jsonResponse(_sessionResponse(token: 'game-token-2')),
        ],
      });
      var now = DateTime.utc(2026, 1, 1);
      final clock = _MutableClock(() => now);
      final controller = LudoAuthController(
        gateway: LudoGateway(config: _config(), transport: responses),
        firebaseAuth: firebaseAuth,
        googleSignIn: _FakeGoogleSignIn(),
        clock: clock,
      );

      final first = await controller.ensureGameToken();
      now = now.add(const Duration(seconds: 400)); // past the 300s TTL
      final second = await controller.ensureGameToken();

      expect(first, 'game-token-1');
      expect(second, 'game-token-2');
      // Re-exchanging the API access token was not needed — only the
      // cheaper session-only refresh ran a second time.
      expect(
        responses.requests.where((r) => r.$1 == 'POST api/auth/exchange'),
        hasLength(1),
      );
      expect(
        responses.requests.where((r) => r.$1 == 'POST session'),
        hasLength(2),
      );
    });

    test('falls back to a full re-exchange when the API access token expired (401)', () async {
      final firebaseAuth = _FakeFirebaseAuth();
      final responses = QueueLudoTransport({
        'POST api/auth/exchange': [
          jsonResponse(_exchangeResponse(access: 'access-1')),
          jsonResponse(_exchangeResponse(access: 'access-2')),
        ],
        'POST session': [
          jsonResponse(_sessionResponse(token: 'game-token-1')),
          jsonResponse(
            ludoFixtureError('ludo_authentication_required'),
            statusCode: 401,
          ),
          jsonResponse(_sessionResponse(token: 'game-token-2')),
        ],
        'POST api/auth/refresh': [
          jsonResponse({
            'accessToken': 'wont-be-used',
            'refreshToken': 'wont-be-used',
            'expiresIn': 21600,
            'tokenType': 'Bearer',
          }, statusCode: 401),
        ],
      });
      var now = DateTime.utc(2026, 1, 1);
      final clock = _MutableClock(() => now);
      final controller = LudoAuthController(
        gateway: LudoGateway(config: _config(), transport: responses),
        firebaseAuth: firebaseAuth,
        googleSignIn: _FakeGoogleSignIn(),
        clock: clock,
      );

      final first = await controller.ensureGameToken();
      now = now.add(const Duration(seconds: 400));
      final second = await controller.ensureGameToken();

      expect(first, 'game-token-1');
      expect(second, 'game-token-2');
      expect(firebaseAuth.user!.getIdTokenCalls, 2); // once per full exchange
    });
  });

  group('LudoAuthController Google linking', () {
    test('links Google onto the anonymous user, preserving uid', () async {
      final firebaseAuth = _FakeFirebaseAuth();
      final transport = FixtureLudoTransport({
        'POST api/auth/exchange': jsonResponse(_exchangeResponse()),
        'POST session': jsonResponse(_sessionResponse()),
      });
      final googleSignIn = _FakeGoogleSignIn(
        result: const LudoGoogleSignInResult(
          idToken: 'google-id-token',
          accessToken: 'google-access-token',
          email: 'player@example.com',
        ),
      );
      final controller = LudoAuthController(
        gateway: LudoGateway(config: _config(), transport: transport),
        firebaseAuth: firebaseAuth,
        googleSignIn: googleSignIn,
      );

      await controller.ensureGameToken();
      await controller.linkGoogleAccount();

      expect(controller.state?.uid, 'uid-1');
      expect(controller.state?.isLinked, isTrue);
    });

    test(
      'a cancelled Google picker leaves state unchanged, not a failure',
      () async {
        final firebaseAuth = _FakeFirebaseAuth();
        final transport = FixtureLudoTransport({
          'POST api/auth/exchange': jsonResponse(_exchangeResponse()),
          'POST session': jsonResponse(_sessionResponse()),
        });
        final controller = LudoAuthController(
          gateway: LudoGateway(config: _config(), transport: transport),
          firebaseAuth: firebaseAuth,
          googleSignIn: _FakeGoogleSignIn()..cancelled = true,
        );

        await controller.ensureGameToken();
        await controller.linkGoogleAccount(); // must not throw

        expect(controller.state?.isLinked, isFalse);
      },
    );
  });
}

final class _MutableClock implements Clock {
  _MutableClock(this._read);

  final DateTime Function() _read;

  @override
  DateTime now() => _read();
}
