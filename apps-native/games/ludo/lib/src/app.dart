import 'package:flutter/material.dart';
import 'package:platform_core/platform_core.dart';

import 'screens/splash_screen.dart';
import 'state/ludo_profile_settings.dart';
import 'state/reduced_motion_setting.dart';
import 'telemetry/ludo_telemetry.dart';

export 'screens/home_lobby_screen.dart' show HomeLobbyScreen;

/// The generated identity for this app (public title, save/telemetry
/// namespaces, environment). Backed by the `games:codegen`-generated Dart
/// registry, never hardcoded.
final ludoIdentity = appIdentityFor(
  'ludo',
  subtitle: 'Roll, race, and capture',
);

/// Root widget for the Ludo client.
///
/// Boots straight to [SplashScreen] (no Firebase or network dependency
/// anywhere in this app), which then routes to onboarding (task 07) on
/// first run, or past it once `onboardingComplete` is persisted, and from
/// there to [HomeLobbyScreen] (task 08). Real board rendering and game
/// state arrive in later Ludo tasks.
final class LudoApp extends StatelessWidget {
  const LudoApp({
    super.key,
    this.profileSettings,
    this.profileStore,
    this.reducedMotion,
    this.telemetry,
    this.diceSeed,
  });

  /// Test seam: the profile settings [SplashScreen] loads onto. Defaults to
  /// a fresh [LudoProfileSettings] in production.
  final LudoProfileSettings? profileSettings;

  /// Test seam: the store [SplashScreen] loads/saves through. Defaults to
  /// the production file-backed store in production (never touched by
  /// widget tests, which always pass one explicitly).
  final LudoProfileStore? profileStore;

  /// Test seam threaded down to the onboarding tutorial screen's
  /// `LudoGame`; see `screens/onboarding_tutorial_screen.dart`'s
  /// `reducedMotion` doc. Defaults to a fresh (motion-enabled) setting in
  /// production.
  final ReducedMotionSetting? reducedMotion;

  /// Test seam: forwarded to [SplashScreen] and every screen beyond it.
  /// `null` (the default) resolves a fresh production [LudoTelemetry] at
  /// each screen that needs one.
  final LudoTelemetry? telemetry;

  /// Test seam: forwarded all the way to `HomeLobbyScreen`'s Computer/Pass
  /// N Play tiles, seeding the dice source of the match they start. `null`
  /// (the default) in production, where the dice source seeds itself from
  /// the current time.
  final int? diceSeed;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: ludoIdentity.publicTitle,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
      home: SplashScreen(
        settings: profileSettings ?? LudoProfileSettings(),
        profileStore: profileStore,
        reducedMotion: reducedMotion,
        telemetry: telemetry,
        diceSeed: diceSeed,
      ),
    );
  }
}
