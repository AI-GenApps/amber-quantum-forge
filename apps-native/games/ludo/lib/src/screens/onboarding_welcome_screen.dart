/// First onboarding step: a welcome screen with "Get Started" (continues
/// to the profile picker) and "Skip" (jumps straight to the home lobby
/// placeholder with a generated default name/avatar).
///
/// No King Pass/subscription offer, coin/diamond purchase prompt, or ad of
/// any kind appears here or anywhere else in this flow — see task 07's
/// Context/Decisions.
library;

import 'package:flutter/material.dart';

import '../app.dart' show ludoIdentity;
import '../assets/ludo_art_manifest.dart' show LudoArtManifest, LudoArtSlot;
import 'home_lobby_screen.dart' show HomeLobbyScreen;
import '../state/ludo_profile_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../telemetry/ludo_telemetry.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_onboarding_controls.dart';
import 'onboarding_profile_screen.dart';

class OnboardingWelcomeScreen extends StatelessWidget {
  const OnboardingWelcomeScreen({
    super.key,
    required this.settings,
    required this.profileStore,
    this.reducedMotion,
    this.telemetry,
    this.diceSeed,
  });

  final LudoProfileSettings settings;
  final LudoProfileStore profileStore;

  /// Test seam threaded down to the tutorial screen's `LudoGame`; see
  /// `onboarding_tutorial_screen.dart`'s `reducedMotion` doc.
  final ReducedMotionSetting? reducedMotion;

  /// Test seam: the telemetry sink `ludo_onboarding_skipped` records
  /// through. `null` (the default) resolves a fresh production
  /// [LudoTelemetry].
  final LudoTelemetry? telemetry;

  /// Test seam: forwarded all the way to `HomeLobbyScreen`'s started
  /// match. `null` (the default) in production.
  final int? diceSeed;

  Future<void> _skip(BuildContext context) async {
    settings.onboardingComplete = true;
    await profileStore.save(settings);
    (telemetry ?? LudoTelemetry()).onboardingSkipped();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(
        builder: (_) =>
            HomeLobbyScreen(telemetry: telemetry, diceSeed: diceSeed),
      ),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LudoBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Align(
                  alignment: Alignment.topRight,
                  child: LudoSkipButton(onPressed: () => _skip(context)),
                ),
                const Spacer(),
                const LudoArtSlot(
                  slot: LudoArtManifest.logoStackedSlot,
                  fallbackPainter: LudoArtManifest.logoStacked,
                  size: Size(240, 180),
                ),
                const SizedBox(height: LudoThemeTokens.spaceMd),
                LudoOutlinedTitle(
                  'Welcome to ${ludoIdentity.publicTitle}',
                  style: LudoTextStyles.displayMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: LudoThemeTokens.spaceMd),
                Text(
                  'Roll the dice, race your tokens home, and capture your '
                  'opponents along the way.',
                  textAlign: TextAlign.center,
                  style: LudoTextStyles.body,
                ),
                const Spacer(),
                LudoPrimaryButton(
                  label: 'Get Started',
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => OnboardingProfileScreen(
                          settings: settings,
                          profileStore: profileStore,
                          reducedMotion: reducedMotion,
                          telemetry: telemetry,
                          diceSeed: diceSeed,
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
