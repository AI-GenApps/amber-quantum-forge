/// The app's first screen: loads the persisted [LudoProfileSettings] (if
/// any) and then routes to onboarding (first run / incomplete) or straight
/// past it (`onboardingComplete == true`).
///
/// Renders no network/Firebase call — [LudoProfileStore] is purely local
/// (see `lib/src/state/ludo_profile_settings.dart`), matching `main.dart`'s
/// "boots offline" guarantee.
library;

import 'package:flutter/material.dart';
import 'package:platform_core/platform_core.dart';

import '../app.dart' show ludoIdentity;
import '../assets/ludo_art_manifest.dart' show LudoArtManifest, LudoArtSlot;
import 'home_lobby_screen.dart' show HomeLobbyScreen;
import '../state/ludo_profile_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../telemetry/ludo_telemetry.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_theme_tokens.dart';
import 'onboarding_welcome_screen.dart';

/// Minimum time the splash screen stays visible, so it reads as a
/// deliberate splash rather than a flicker — even when the profile load
/// resolves instantly (e.g. a fresh [MemorySaveStore] in tests). Tests
/// that don't care about the splash beat pass [SplashScreen.minDisplay]
/// as [Duration.zero].
const ludoSplashMinDisplay = Duration(milliseconds: 500);

class SplashScreen extends StatefulWidget {
  const SplashScreen({
    super.key,
    required this.settings,
    this.profileStore,
    this.minDisplay = ludoSplashMinDisplay,
    this.reducedMotion,
    this.telemetry,
    this.diceSeed,
  });

  /// The (already-constructed, not-yet-loaded) profile settings this
  /// screen loads saved data onto before routing onward. Callers own this
  /// instance so onboarding screens further down the navigation stack can
  /// keep mutating the same object.
  final LudoProfileSettings settings;

  /// The store to load/save through. `null` builds the production store
  /// ([LudoProfileStore.production]) lazily — tests always pass one
  /// explicitly (typically backed by [MemorySaveStore]) so they never
  /// touch a real platform channel.
  final LudoProfileStore? profileStore;

  final Duration minDisplay;

  /// Test seam threaded down to the tutorial screen's `LudoGame`; see
  /// `onboarding_tutorial_screen.dart`'s `reducedMotion` doc.
  final ReducedMotionSetting? reducedMotion;

  /// Test seam: forwarded to [HomeLobbyScreen]/[OnboardingWelcomeScreen].
  /// `null` (the default) resolves a fresh production [LudoTelemetry] at
  /// each of those screens.
  final LudoTelemetry? telemetry;

  /// Test seam: forwarded to [HomeLobbyScreen]/[OnboardingWelcomeScreen],
  /// all the way to `HomeLobbyScreen`'s started match. `null` (the
  /// default) in production, where the dice source seeds itself from the
  /// current time.
  final int? diceSeed;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final started = DateTime.now();
    final store =
        widget.profileStore ?? await LudoProfileStore.production(ludoIdentity);
    await store.load(widget.settings);
    final elapsed = DateTime.now().difference(started);
    final remaining = widget.minDisplay - elapsed;
    if (remaining > Duration.zero) {
      await Future<void>.delayed(remaining);
    }
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => widget.settings.onboardingComplete
            ? HomeLobbyScreen(
                telemetry: widget.telemetry,
                diceSeed: widget.diceSeed,
              )
            : OnboardingWelcomeScreen(
                settings: widget.settings,
                profileStore: store,
                reducedMotion: widget.reducedMotion,
                telemetry: widget.telemetry,
                diceSeed: widget.diceSeed,
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LudoBackground(
        child: Center(
          child: Semantics(
            label: '${ludoIdentity.publicTitle} is loading',
            excludeSemantics: true,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _SplashLogo(reducedMotion: widget.reducedMotion),
                const SizedBox(height: LudoThemeTokens.spaceXl),
                const SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      LudoThemeTokens.gold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The Ludo Vortex brand mark on the splash screen: the stacked
/// emblem-over-wordmark art (`assets/art/logo_stacked.png`, via
/// [LudoArtManifest.logoStackedSlot]), falling back to a simple code-drawn
/// ring when no bitmap is bundled. Plays a gentle scale-in unless
/// [reducedMotion] is enabled, in which case it appears at full scale
/// immediately.
class _SplashLogo extends StatelessWidget {
  const _SplashLogo({this.reducedMotion});

  final ReducedMotionSetting? reducedMotion;

  @override
  Widget build(BuildContext context) {
    final skipAnimation = reducedMotion?.value ?? false;
    final logo = LudoArtSlot(
      slot: LudoArtManifest.logoStackedSlot,
      fallbackPainter: LudoArtManifest.logoStacked,
      size: const Size(220, 165),
    );
    if (skipAnimation) return logo;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.85, end: 1),
      duration: const Duration(milliseconds: 450),
      curve: Curves.easeOutBack,
      builder: (context, scale, child) =>
          Transform.scale(scale: scale, child: child),
      child: logo,
    );
  }
}
