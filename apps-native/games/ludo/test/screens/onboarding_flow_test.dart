import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart';

import 'package:ludo/src/app.dart';
import 'package:ludo/src/screens/onboarding_profile_screen.dart';
import 'package:ludo/src/screens/onboarding_tutorial_screen.dart';
import 'package:ludo/src/screens/onboarding_welcome_screen.dart';
import 'package:ludo/src/state/ludo_profile_settings.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo/src/widgets/ludo_avatar.dart';

AppContext _context() => AppContext(
  identity: ludoIdentity,
  environment: AppEnvironment.debug,
  appVersion: '0.1.0',
  sessionId: 'test-session',
);

LudoProfileStore _freshStore() =>
    LudoProfileStore(saveStore: MemorySaveStore(), appContext: _context());

/// Pumps past the splash screen's (zero-duration in these tests, since the
/// splash's own minimum display timer still fires) load.
Future<void> _passSplash(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 600));
  await tester.pumpAndSettle();
}

/// Pumps past a navigation into (or an action on) the tutorial screen.
///
/// The tutorial screen hosts a live `GameWidget`/`FlameGame`, whose render
/// loop reschedules a frame every tick and so never lets `pumpAndSettle`
/// observe "no more frames pending" — it would hang forever, so every
/// tutorial-screen test below builds [LudoApp] with `reducedMotion:
/// ReducedMotionSetting(enabled: true)`, which makes the dice tumble and
/// token hop/flight animations this screen drives resolve on the very
/// next microtask instead of over several real-duration animation frames
/// (see `onboarding_tutorial_screen.dart`'s `reducedMotion` doc). A short
/// fixed pump is then enough to flush that resolution plus the page
/// transition, without ever waiting on the game loop to go idle.
Future<void> _pumpTutorial(WidgetTester tester) async {
  const step = Duration(milliseconds: 50);
  const total = Duration(milliseconds: 500);
  var elapsed = Duration.zero;
  while (elapsed < total) {
    await tester.pump(step);
    elapsed += step;
  }
  await tester.pump();
}

void main() {
  testWidgets('skip on the welcome screen reaches the home screen', (
    tester,
  ) async {
    final store = _freshStore();
    await tester.pumpWidget(
      LudoApp(profileSettings: LudoProfileSettings(), profileStore: store),
    );
    await _passSplash(tester);
    expect(find.byType(OnboardingWelcomeScreen), findsOneWidget);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect(find.byType(HomeLobbyScreen), findsOneWidget);
  });

  testWidgets('skip on the profile screen reaches the home screen', (
    tester,
  ) async {
    final store = _freshStore();
    await tester.pumpWidget(
      LudoApp(profileSettings: LudoProfileSettings(), profileStore: store),
    );
    await _passSplash(tester);
    await tester.tap(find.text('Get Started'));
    await tester.pumpAndSettle();
    expect(find.byType(OnboardingProfileScreen), findsOneWidget);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect(find.byType(HomeLobbyScreen), findsOneWidget);
  });

  testWidgets('skip on the tutorial screen reaches the home screen', (
    tester,
  ) async {
    final store = _freshStore();
    await tester.pumpWidget(
      LudoApp(
        profileSettings: LudoProfileSettings(),
        profileStore: store,
        reducedMotion: ReducedMotionSetting(enabled: true),
      ),
    );
    await _passSplash(tester);
    await tester.tap(find.text('Get Started'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await _pumpTutorial(tester);
    expect(find.byType(OnboardingTutorialScreen), findsOneWidget);

    // Scoped to the tutorial screen: the previous (profile) route's own
    // Skip action can still be present-but-offscreen in the tree mid page
    // transition, and an unscoped `find.text('Skip')` would then match
    // both.
    await tester.tap(
      find.descendant(
        of: find.byType(OnboardingTutorialScreen),
        matching: find.text('Skip'),
      ),
    );
    await _pumpTutorial(tester);

    expect(find.byType(HomeLobbyScreen), findsOneWidget);
  });

  testWidgets('completing every step persists the chosen name and avatar', (
    tester,
  ) async {
    final store = _freshStore();
    await tester.pumpWidget(
      LudoApp(
        profileSettings: LudoProfileSettings(),
        profileStore: store,
        reducedMotion: ReducedMotionSetting(enabled: true),
      ),
    );
    await _passSplash(tester);
    await tester.tap(find.text('Get Started'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'Rae');
    final chosenAvatar = ludoAvatarById('green-spark');
    await tester.tap(
      find.bySemanticsLabel(
        'Avatar: ${chosenAvatar.color.name} ${chosenAvatar.motif.name}',
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await _pumpTutorial(tester);
    expect(find.byType(OnboardingTutorialScreen), findsOneWidget);

    await tester.tap(find.text('Roll Dice'));
    await _pumpTutorial(tester);
    await tester.tap(find.text('Move Token'));
    await _pumpTutorial(tester);
    await tester.tap(find.text('Roll Dice'));
    await _pumpTutorial(tester);
    await tester.tap(find.text('Move Token'));
    await _pumpTutorial(tester);
    await tester.tap(find.text('Finish'));
    await _pumpTutorial(tester);

    expect(find.byType(HomeLobbyScreen), findsOneWidget);

    final reloaded = LudoProfileSettings();
    await store.load(reloaded);
    expect(reloaded.name, 'Rae');
    expect(reloaded.avatarId, 'green-spark');
    expect(reloaded.onboardingComplete, isTrue);
  });

  testWidgets('re-launching after completion skips onboarding entirely', (
    tester,
  ) async {
    final store = _freshStore();
    final completed = LudoProfileSettings(
      name: 'Rae',
      avatarId: 'blue-face',
      onboardingComplete: true,
    );
    await store.save(completed);

    await tester.pumpWidget(
      LudoApp(profileSettings: LudoProfileSettings(), profileStore: store),
    );
    await _passSplash(tester);

    expect(find.byType(HomeLobbyScreen), findsOneWidget);
    expect(find.byType(OnboardingWelcomeScreen), findsNothing);
  });

  void expectSemanticTapTarget(WidgetTester tester, Finder finder) {
    expect(finder, findsOneWidget);
    final semantics = tester.getSemantics(finder);
    expect(semantics.label, isNotEmpty);
    final size = tester.getSize(finder);
    expect(size.width, greaterThanOrEqualTo(48));
    expect(size.height, greaterThanOrEqualTo(48));
  }

  testWidgets(
    'every interactive control across onboarding has a Semantics label '
    'and a 48dp+ tap target',
    (tester) async {
      final store = _freshStore();
      await tester.pumpWidget(
        LudoApp(
          profileSettings: LudoProfileSettings(),
          profileStore: store,
          reducedMotion: ReducedMotionSetting(enabled: true),
        ),
      );
      await _passSplash(tester);

      // Welcome screen.
      expectSemanticTapTarget(tester, find.bySemanticsLabel('Skip').first);
      expectSemanticTapTarget(tester, find.bySemanticsLabel('Get Started'));

      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      // Profile screen: skip, name field, every avatar tile.
      expectSemanticTapTarget(tester, find.bySemanticsLabel('Skip').first);
      final nameField = find.bySemanticsLabel('Player name').first;
      expect(nameField, findsOneWidget);
      expect(tester.getSemantics(nameField).label, isNotEmpty);
      for (final id in ludoAvatarIds) {
        final spec = ludoAvatarById(id);
        expectSemanticTapTarget(
          tester,
          find.bySemanticsLabel(
            'Avatar: ${spec.color.name} ${spec.motif.name}',
          ),
        );
      }
      expectSemanticTapTarget(tester, find.bySemanticsLabel('Continue'));

      await tester.tap(find.text('Continue'));
      await _pumpTutorial(tester);

      // Tutorial screen: skip and the roll/move action button.
      expectSemanticTapTarget(tester, find.bySemanticsLabel('Skip').first);
      expectSemanticTapTarget(tester, find.bySemanticsLabel('Roll dice'));

      await tester.tap(find.text('Roll Dice'));
      await _pumpTutorial(tester);
      expectSemanticTapTarget(tester, find.bySemanticsLabel('Move token'));
    },
  );
}
