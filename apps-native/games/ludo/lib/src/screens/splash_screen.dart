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

import '../app.dart' show LudoPlaceholderHomeScreen, ludoIdentity;
import '../state/ludo_profile_settings.dart';
import '../state/reduced_motion_setting.dart';
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
            ? const LudoPlaceholderHomeScreen()
            : OnboardingWelcomeScreen(
                settings: widget.settings,
                profileStore: store,
                reducedMotion: widget.reducedMotion,
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Semantics(
          label: '${ludoIdentity.publicTitle} is loading',
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                ludoIdentity.publicTitle,
                style: Theme.of(context).textTheme.displaySmall,
              ),
              const SizedBox(height: 16),
              const CircularProgressIndicator(),
            ],
          ),
        ),
      ),
    );
  }
}
