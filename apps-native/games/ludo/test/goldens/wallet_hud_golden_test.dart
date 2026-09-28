import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/net/ludo_auth_controller.dart';
import 'package:ludo/src/net/ludo_firebase_gateway.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/state/ludo_wallet_state.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo/src/theme/ludo_theme.dart';
import 'package:ludo/src/theme/ludo_theme_tokens.dart';
import 'package:ludo/src/widgets/ludo_wallet_hud.dart';

final class _UnusedFirebaseAuth implements LudoFirebaseAuthGateway {
  @override
  LudoFirebaseUser? get currentUser => null;

  @override
  Future<LudoFirebaseUser> signInAnonymously() =>
      throw UnimplementedError('golden fixture never authenticates');
}

final class _UnusedGoogleSignIn implements LudoGoogleSignInGateway {
  @override
  Future<LudoGoogleSignInResult?> signIn() =>
      throw UnimplementedError('golden fixture never authenticates');
}

/// A fixture wallet state, pre-populated without ever calling `refresh()`
/// (this golden never touches the network).
LudoWalletState _fixtureWallet() {
  final gateway = LudoGateway(
    config: LudoNetworkConfig(
      apiBaseUri: Uri.parse('https://api.example.test/'),
      environment: 'debug',
    ),
    transport: _NeverCalledTransport(),
  );
  final wallet = LudoWalletState(
    gateway: gateway,
    authController: LudoAuthController(
      gateway: gateway,
      firebaseAuth: _UnusedFirebaseAuth(),
      googleSignIn: _UnusedGoogleSignIn(),
    ),
  );
  wallet.applyWalletSnapshot(coins: 1280, diamonds: 34);
  wallet.applyXpClaimResult(
    const LudoXpClaimResult(
      idempotent: false,
      xp: 150,
      level: 5,
      xpRequiredForNextLevel: 300,
      levelsGained: 0,
    ),
  );
  return wallet;
}

final class _NeverCalledTransport implements LudoHttpTransport {
  @override
  Future<LudoHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    required Object? body,
    required Duration timeout,
    required int maxRequestBytes,
    required int maxResponseBytes,
  }) => throw UnimplementedError('golden fixture never calls the network');
}

Widget _harness(Widget child) => MaterialApp(
  theme: buildLudoTheme(),
  home: Scaffold(
    backgroundColor: LudoThemeTokens.backgroundDeepBlue,
    body: Center(child: child),
  ),
);

/// Golden tests for the wallet/level HUD chips (task 26e): coin/diamond
/// chips plus the level badge with its XP-progress sliver, in both the
/// normal (animated XP-fill) and reduced-motion (instant fill, no
/// [AnimatedContainer] transition) states. Run `flutter test
/// --update-goldens test/goldens/wallet_hud_golden_test.dart` after any
/// intentional visual change.
void main() {
  testWidgets('wallet HUD chips render coins/diamonds/level from state', (
    tester,
  ) async {
    final wallet = _fixtureWallet();
    await tester.pumpWidget(_harness(LudoWalletHud(wallet: wallet)));
    await tester.pump(const Duration(milliseconds: 500));

    await expectLater(
      find.byType(LudoWalletHud),
      matchesGoldenFile('wallet_hud_normal.png'),
    );
  });

  testWidgets('wallet HUD chips under reduced motion show the same frame', (
    tester,
  ) async {
    final wallet = _fixtureWallet();
    final reducedMotion = ReducedMotionSetting(enabled: true);
    await tester.pumpWidget(
      _harness(LudoWalletHud(wallet: wallet, reducedMotion: reducedMotion)),
    );
    // No `pump(duration)` needed: reduced motion's `Duration.zero`
    // `AnimatedContainer` settles on the very next frame.
    await tester.pump();

    await expectLater(
      find.byType(LudoWalletHud),
      matchesGoldenFile('wallet_hud_reduced_motion.png'),
    );
  });
}
