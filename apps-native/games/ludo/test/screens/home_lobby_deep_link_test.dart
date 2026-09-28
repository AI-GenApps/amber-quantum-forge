/// Task 26x: `HomeLobbyScreen` registers with `LudoDeepLinkRouter` and, once
/// a room code is routed to it (simulating `wireLudoDeepLinks()` having
/// resolved a cold-launch or warm-start `w3dev-ludo://room/<code>` link),
/// opens the "Play with Friends" sheet on the Join tab with that code
/// pre-filled — never touching a real `app_links` platform channel, per
/// `ludo_deep_link.dart`'s own doc comment.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/net/ludo_auth_controller.dart';
import 'package:ludo/src/net/ludo_deep_link_router.dart';
import 'package:ludo/src/net/ludo_firebase_gateway.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/net/ludo_online_client.dart';
import 'package:ludo/src/net/ludo_online_controller.dart';
import 'package:ludo/src/screens/home_lobby_screen.dart';
import 'package:ludo/src/state/ludo_profile_settings.dart';
import 'package:ludo/src/telemetry/ludo_telemetry.dart';

import '../net/ludo_test_support.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

LudoProfileSettings _testProfile() =>
    LudoProfileSettings(name: 'Rae', avatarId: 'red-face');

final class _FakeUser implements LudoFirebaseUser {
  _FakeUser(this.uid);
  @override
  final String uid;
  @override
  final bool isAnonymous = true;
  @override
  Future<String> getIdToken({bool forceRefresh = false}) async => 'id-token';
  @override
  Future<LudoFirebaseUser> linkWithGoogleCredential({
    required String googleIdToken,
    required String googleAccessToken,
  }) async => this;
}

final class _FakeFirebaseAuth implements LudoFirebaseAuthGateway {
  @override
  LudoFirebaseUser? get currentUser => _FakeUser('uid-1');
  @override
  Future<LudoFirebaseUser> signInAnonymously() async => _FakeUser('uid-1');
}

final class _FakeGoogleSignIn implements LudoGoogleSignInGateway {
  @override
  Future<LudoGoogleSignInResult?> signIn() async => null;
}

LudoNetworkConfig _config() => LudoNetworkConfig(
  apiBaseUri: Uri.parse('https://example.test'),
  environment: 'debug',
);

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
  setUp(LudoDeepLinkRouter.instance.resetForTesting);
  tearDown(LudoDeepLinkRouter.instance.resetForTesting);

  testWidgets(
    'a routed room code opens the Join tab pre-filled once the online '
    'client is available',
    (tester) async {
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

      LudoDeepLinkRouter.instance.routeRoomCode('SHARE01');
      await tester.pumpAndSettle();

      expect(find.text('Play with Friends'), findsWidgets);
      expect(find.widgetWithText(TextField, 'ENTER CODE'), findsOneWidget);
      final field = tester.widget<TextField>(
        find.byKey(const Key('friends-setup-code-field')),
      );
      expect(field.controller?.text, 'SHARE01');
    },
  );

  testWidgets(
    'a routed room code is silently dropped when no online client has '
    'resolved yet',
    (tester) async {
      await tester.pumpWidget(_wrap(HomeLobbyScreen(profile: _testProfile())));
      await tester.pumpAndSettle();

      LudoDeepLinkRouter.instance.routeRoomCode('SHARE02');
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Play with Friends'), findsOneWidget);
      expect(find.byType(HomeLobbyScreen), findsOneWidget);
    },
  );
}
