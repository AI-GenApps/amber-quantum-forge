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
import 'home_lobby_screen.dart' show HomeLobbyScreen;
import '../state/ludo_profile_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../telemetry/ludo_telemetry.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
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
                const _SplashMark(),
                const SizedBox(height: LudoThemeTokens.spaceLg),
                LudoOutlinedTitle(
                  ludoIdentity.publicTitle,
                  style: LudoTextStyles.displayLarge,
                ),
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

/// A simple, entirely code-drawn original mark: a chunky rounded die face
/// showing five pips, gold on a deep-blue tile with a gloss highlight —
/// distinct from any Ludo King logo (this task's Context/Decisions
/// explicitly forbids copying one), reusing the same glossy-token look the
/// rest of the design system already establishes.
class _SplashMark extends StatelessWidget {
  const _SplashMark();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 88,
      height: 88,
      child: CustomPaint(painter: _SplashMarkPainter()),
    );
  }
}

class _SplashMarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(
      rect.deflate(2),
      const Radius.circular(20),
    );

    canvas.drawRRect(
      rrect.shift(const Offset(0, 4)),
      Paint()..color = LudoThemeTokens.goldDeep,
    );
    canvas.drawRRect(
      rrect,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [LudoThemeTokens.gold, LudoThemeTokens.goldDeep],
        ).createShader(rect),
    );
    canvas.drawRRect(
      rrect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..color = LudoThemeTokens.textOutline,
    );

    final pipPaint = Paint()..color = LudoThemeTokens.textOutline;
    final center = rect.center;
    final offset = size.shortestSide * 0.24;
    final pipRadius = size.shortestSide * 0.08;
    final pips = <Offset>[
      center,
      center.translate(-offset, -offset),
      center.translate(offset, -offset),
      center.translate(-offset, offset),
      center.translate(offset, offset),
    ];
    for (final pip in pips) {
      canvas.drawCircle(pip, pipRadius, pipPaint);
    }

    // A faint diagonal gloss highlight, matching the token/button glossy
    // treatment used throughout the design system.
    final glossPath = Path()
      ..moveTo(rect.left + 6, rect.top + 6)
      ..lineTo(rect.right * 0.55, rect.top + 6)
      ..lineTo(rect.left + 6, rect.bottom * 0.55)
      ..close();
    canvas.drawPath(
      glossPath,
      Paint()..color = Colors.white.withValues(alpha: 0.28),
    );
  }

  @override
  bool shouldRepaint(covariant _SplashMarkPainter oldDelegate) => false;
}
