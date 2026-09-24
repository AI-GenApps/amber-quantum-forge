/// Task 12's full local-mode flow test: drives the whole client end to
/// end — splash -> onboarding (both the skip and the complete variant) ->
/// home lobby -> the real `ModeSetupSheet` -> a real, fully-played
/// vs-Computer match on `GameBoardScreen` -> `ResultsScreen` — asserting
/// no crash and correct navigation at every step. The match is played out
/// through the same real `DiceZone`/token taps every other
/// `game_board_screen_test.dart` test uses (never by constructing a
/// terminal state directly), so the results screen this test's golden
/// captures is reached via an actual played match, not a screen built in
/// isolation.
library;

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';

import 'package:ludo/src/app.dart';
import 'package:ludo/src/game/ludo_game.dart';
import 'package:ludo/src/screens/game_board_screen.dart';
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/screens/onboarding_profile_screen.dart';
import 'package:ludo/src/screens/onboarding_tutorial_screen.dart';
import 'package:ludo/src/screens/onboarding_welcome_screen.dart';
import 'package:ludo/src/screens/results_screen.dart';
import 'package:ludo/src/state/ludo_profile_settings.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo/src/widgets/dice_zone.dart';
import 'package:platform_core/platform_core.dart';

LudoProfileStore _freshStore() => LudoProfileStore(
  saveStore: MemorySaveStore(),
  appContext: AppContext(
    identity: ludoIdentity,
    environment: AppEnvironment.debug,
    appVersion: '0.1.0',
    sessionId: 'test-session',
  ),
);

/// Pumps past the splash screen's minimum-display timer.
Future<void> _passSplash(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 600));
  await tester.pumpAndSettle();
}

/// Pumps past a navigation transition/animation without ever calling
/// `pumpAndSettle` — a live `FlameGame` anywhere in the tree reschedules a
/// frame every tick, which would hang `pumpAndSettle` forever (mirrors
/// `onboarding_flow_test.dart`'s `_pumpTutorial`/`game_board_screen_test
/// .dart`'s `_pumpUntilSettled`).
Future<void> _pumpFor(WidgetTester tester, Duration total) async {
  const step = Duration(milliseconds: 100);
  var elapsed = Duration.zero;
  while (elapsed < total) {
    await tester.pump(step);
    elapsed += step;
  }
}

LudoGame? _gameOf(WidgetTester tester) {
  final finder = find.byType(GameWidget<LudoGame>);
  if (finder.evaluate().isEmpty) return null;
  return tester.widget<GameWidget<LudoGame>>(finder).game;
}

/// Plays a real vs-Computer match on the currently-shown `GameBoardScreen`
/// to completion, by tapping the real `DiceZone` and the real token
/// components exactly as a player would — never by constructing or
/// injecting a terminal `LudoMatchState`. Handles both the local human
/// seat's turns and (by simply waiting out its own automated delay) the
/// bot seat's turns, until `ResultsScreen` appears.
Future<void> _playVsComputerMatchToResults(
  WidgetTester tester, {
  int maxSteps = 200,
}) async {
  for (var step = 0; step < maxSteps; step++) {
    if (find.byType(ResultsScreen).evaluate().isNotEmpty) return;

    final game = _gameOf(tester);
    final state = game?.matchState;
    if (game == null || state == null) {
      await _pumpFor(tester, const Duration(milliseconds: 200));
      continue;
    }

    if (state.phase == LudoMatchPhase.finished) {
      // Let the pending navigation to ResultsScreen resolve.
      await _pumpFor(tester, const Duration(seconds: 1));
      continue;
    }

    if (state.currentPlayerIndex != 0) {
      // The bot seat's turn: the bot-turn runner drives it automatically
      // (task 12) — just wait out its delay-between-steps plus whatever
      // roll/move animation is in flight.
      await _pumpFor(tester, const Duration(seconds: 3));
      continue;
    }

    if (state.phase == LudoMatchPhase.awaitingRoll) {
      final diceFinder = find.byType(DiceZone);
      if (diceFinder.evaluate().isEmpty ||
          !tester.widget<DiceZone>(diceFinder).enabled) {
        await _pumpFor(tester, const Duration(milliseconds: 200));
        continue;
      }
      await tester.tap(diceFinder);
      await _pumpFor(tester, const Duration(milliseconds: 1200));
      continue;
    }

    if (state.phase == LudoMatchPhase.awaitingMove) {
      final legal = legalMoves(state);
      if (legal.isEmpty) {
        await _pumpFor(tester, const Duration(milliseconds: 200));
        continue;
      }
      final localColor = state.players[0].color;
      final tokenId = legal.first;
      final token = game.tokens.firstWhere(
        (t) => t.color == localColor && t.tokenId == tokenId,
      );
      token.onTap?.call(localColor, tokenId);
      await _pumpFor(tester, const Duration(milliseconds: 1200));
      continue;
    }
  }
  fail('vs-Computer match did not reach ResultsScreen within $maxSteps steps');
}

/// Starts a Quick, 2-player vs-Computer match from the (already-shown)
/// home lobby, through the real `ModeSetupSheet`, and plays it to
/// `ResultsScreen`. Quick's `oneHomeAndOneCapture` win condition (task
/// 12g) plus 2 players keeps the match short enough for a widget test
/// while every step still goes through the real engine via real taps.
Future<void> _startAndFinishVsComputerMatch(WidgetTester tester) async {
  expect(find.byType(HomeLobbyScreen), findsOneWidget);

  await tester.tap(find.text('Computer'));
  await tester.pumpAndSettle();
  expect(find.byType(ModeSetupSheet), findsOneWidget);

  await tester.tap(find.text('Quick'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('2'));
  await tester.pumpAndSettle();

  await tester.tap(find.byKey(const Key('mode-setup-start-button')));
  await _pumpFor(tester, const Duration(milliseconds: 500));
  expect(find.byType(GameBoardScreen), findsOneWidget);

  await _playVsComputerMatchToResults(tester);
  expect(find.byType(ResultsScreen), findsOneWidget);
}

/// This full-app flow (unlike every other screen test, which always
/// injects an in-memory `localSave`/`profileStore` test seam) goes through
/// `HomeLobbyScreen`'s real `startLudoLocalMatch`, which has no seam for
/// the match-in-progress save and so resolves the real
/// `LudoLocalSave.production()` — `getApplicationSupportDirectory()`'s
/// `path_provider` platform channel, which is never serviced by a
/// `flutter test` run (no platform bindings) and, absent a mock handler,
/// hangs the awaiting call forever rather than failing fast. Mocking it to
/// throw lets `ludoDefaultSaveStore`'s own existing try/catch fall back to
/// its documented in-memory store immediately, matching what already
/// happens on a real device with no writable support directory.
void _mockMissingPathProvider() {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('plugins.flutter.io/path_provider'),
        (call) async => throw MissingPluginException(),
      );
}

void main() {
  setUp(_mockMissingPathProvider);

  testWidgets(
    'skip-onboarding variant: splash -> welcome -> skip -> home lobby -> '
    'mode/setup sheet -> game board -> results',
    (tester) async {
      final store = _freshStore();
      await tester.pumpWidget(
        LudoApp(
          profileSettings: LudoProfileSettings(),
          profileStore: store,
          diceSeed: 1,
        ),
      );
      await _passSplash(tester);
      expect(find.byType(OnboardingWelcomeScreen), findsOneWidget);

      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();
      expect(find.byType(HomeLobbyScreen), findsOneWidget);

      await _startAndFinishVsComputerMatch(tester);
    },
  );

  testWidgets(
    'complete-onboarding variant: splash -> welcome -> profile -> tutorial '
    '-> home lobby -> mode/setup sheet -> game board -> results',
    (tester) async {
      final store = _freshStore();
      await tester.pumpWidget(
        LudoApp(
          profileSettings: LudoProfileSettings(),
          profileStore: store,
          reducedMotion: ReducedMotionSetting(enabled: true),
          diceSeed: 1,
        ),
      );
      await _passSplash(tester);
      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();
      expect(find.byType(OnboardingProfileScreen), findsOneWidget);

      await tester.enterText(find.byType(TextField), 'Rae');
      await tester.tap(find.text('Continue'));
      await _pumpFor(tester, const Duration(milliseconds: 500));
      expect(find.byType(OnboardingTutorialScreen), findsOneWidget);

      await tester.tap(find.text('Roll Dice'));
      await _pumpFor(tester, const Duration(milliseconds: 500));
      await tester.tap(find.text('Move Token'));
      await _pumpFor(tester, const Duration(milliseconds: 500));
      await tester.tap(find.text('Roll Dice'));
      await _pumpFor(tester, const Duration(milliseconds: 500));
      await tester.tap(find.text('Move Token'));
      await _pumpFor(tester, const Duration(milliseconds: 500));
      await tester.tap(find.text('Finish'));
      await _pumpFor(tester, const Duration(milliseconds: 500));
      expect(find.byType(HomeLobbyScreen), findsOneWidget);

      await _startAndFinishVsComputerMatch(tester);

      await expectLater(
        find.byType(ResultsScreen),
        matchesGoldenFile('goldens/results_screen_full_flow.png'),
      );
    },
  );
}
