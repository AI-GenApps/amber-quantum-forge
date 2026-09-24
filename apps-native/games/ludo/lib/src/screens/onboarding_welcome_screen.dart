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
import 'home_lobby_screen.dart' show HomeLobbyScreen;
import '../state/ludo_profile_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../widgets/ludo_onboarding_controls.dart';
import 'onboarding_profile_screen.dart';

class OnboardingWelcomeScreen extends StatelessWidget {
  const OnboardingWelcomeScreen({
    super.key,
    required this.settings,
    required this.profileStore,
    this.reducedMotion,
  });

  final LudoProfileSettings settings;
  final LudoProfileStore profileStore;

  /// Test seam threaded down to the tutorial screen's `LudoGame`; see
  /// `onboarding_tutorial_screen.dart`'s `reducedMotion` doc.
  final ReducedMotionSetting? reducedMotion;

  Future<void> _skip(BuildContext context) async {
    settings.onboardingComplete = true;
    await profileStore.save(settings);
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const HomeLobbyScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Align(
                alignment: Alignment.topRight,
                child: LudoSkipButton(onPressed: () => _skip(context)),
              ),
              const Spacer(),
              Text(
                'Welcome to ${ludoIdentity.publicTitle}',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 12),
              Text(
                'Roll the dice, race your tokens home, and capture your '
                'opponents along the way.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
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
    );
  }
}
