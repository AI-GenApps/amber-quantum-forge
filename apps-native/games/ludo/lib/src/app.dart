import 'package:flutter/material.dart';
import 'package:platform_core/platform_core.dart';

import 'screens/splash_screen.dart';
import 'state/ludo_profile_settings.dart';
import 'state/reduced_motion_setting.dart';

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
/// first run, or past it once `onboardingComplete` is persisted. Real
/// board rendering and game state arrive in later Ludo tasks; task 08
/// replaces [LudoPlaceholderHomeScreen] with the real home lobby.
final class LudoApp extends StatelessWidget {
  const LudoApp({
    super.key,
    this.profileSettings,
    this.profileStore,
    this.reducedMotion,
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
      ),
    );
  }
}

/// Placeholder home screen shown until the real home lobby (later Ludo
/// tasks) replaces it. Renders no network/Firebase calls.
final class LudoPlaceholderHomeScreen extends StatelessWidget {
  const LudoPlaceholderHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              ludoIdentity.publicTitle,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              ludoIdentity.subtitle,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}
