import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_controls.dart';
import 'package:merge_relay/src/merge_relay_models.dart';
import 'package:merge_relay/src/merge_relay_theme.dart';
import 'package:merge_relay/src/merge_relay_ui.dart';
import 'package:merge_relay/src/ui/mr_switch_palette.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

/// Regression coverage for the defects found on the real phone
/// (`.agents/resources/2026-10-16/merge-relay-device-qa/REVIEW.md`, task 26):
/// D2 version line, D3 board jump, D4 duplicate "best", D5 switch colours,
/// D1 Daily result copy/layout, and the old-name leftovers.
void main() {
  Future<MergeRelayGame> readyGame() async {
    final game = MergeRelayGame(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      saveStore: MemorySaveStore(),
    );
    await game.restore();
    game.completeTutorial(skipped: true);
    return game;
  }

  Future<void> host(
    WidgetTester tester,
    MergeRelayGame game, {
    // 400x800 logical: wide enough that the Play screen is not `compact`
    // (compact layouts, < 380 px wide, never show the status row).
    Size logical = const Size(400, 800),
  }) async {
    tester.view.physicalSize = logical * 3;
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      MaterialApp(
        theme: materialThemeFor(signalRelayTheme),
        home: MergeRelayScreen(game: game),
      ),
    );
    await tester.pump();
  }

  // Lets the game's own feedback timer (1.6 s) fire before the test ends.
  Future<void> drain(WidgetTester tester) =>
      tester.pump(const Duration(seconds: 3));

  group('D3: the status row never moves the board', () {
    testWidgets('board position is constant as the row appears and clears', (
      tester,
    ) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      await host(tester, game);
      await drain(tester);
      expect(game.feedback.value, isNull);

      final boardFinder = find.byType(MergeRelayBoard);
      final before = tester.getRect(boardFinder);
      final restartBefore = tester.getTopLeft(find.text('Restart'));

      for (final message in ['Chain +4', 'Board shifted.']) {
        game.feedback.value = message;
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 200));
        expect(find.text(message), findsOneWidget, reason: 'row is visible');
        expect(tester.getRect(boardFinder), before, reason: '$message: board');
        expect(
          tester.getTopLeft(find.text('Restart')),
          restartBefore,
          reason: '$message: lower tray',
        );
      }

      game.feedback.value = null;
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.text('Board shifted.'), findsNothing);
      expect(tester.getRect(boardFinder), before, reason: 'row cleared');
    });

    testWidgets('the message fits inside the reserved row height', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: materialThemeFor(signalRelayTheme),
          home: const Scaffold(
            body: Center(
              child: MergeFeedback(text: 'Chain +4', theme: signalRelayTheme),
            ),
          ),
        ),
      );
      expect(
        tester.getSize(find.byType(MergeFeedback)).height,
        mergeFeedbackRowHeight,
      );
      final text = tester.getSize(find.text('Chain +4')).height;
      expect(text, lessThanOrEqualTo(mergeFeedbackRowHeight));
    });
  });

  group('D4: one coherent "best"', () {
    testWidgets('Endless shows a single live best score and no second label', (
      tester,
    ) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      game.bestEndlessScore.value = 0;
      game.startEndless();
      await host(tester, game);
      await drain(tester);

      expect(find.text('BEST SCORE'), findsNothing);
      expect(find.text('Best'), findsOneWidget);
      // With no record yet the pill follows the current score, never "-".
      expect(find.text('—'), findsNothing);

      // A stored record above the current score is shown in the one pill.
      game.bestEndlessScore.value = 536;
      await tester.pump();
      expect(find.text('Best'), findsOneWidget);
      expect(find.text('536'), findsOneWidget);
      expect(find.text('BEST SCORE'), findsNothing);
    });

    testWidgets('Rescue labels the highest tile as "Top tile", not "Best"', (
      tester,
    ) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      await host(tester, game);
      await drain(tester);

      expect(find.text('Top tile'), findsOneWidget);
      expect(find.text('Best'), findsNothing);
    });
  });

  group('D2: Settings shows the app name and version', () {
    testWidgets(
      'version line is "<title> <version>", content tag is secondary',
      (tester) async {
        final game = await readyGame();
        addTearDown(game.dispose);
        await host(tester, game);
        await tester.tap(find.byTooltip('Settings').first);
        await tester.pumpAndSettle();

        final appLine = tester.widget<Text>(
          find.byKey(const ValueKey('settings-app-version')),
        );
        expect(appLine.data, 'Glow Rescue $appVersionDefine');
        expect(appLine.data, matches(RegExp(r'^Glow Rescue \d+\.\d+\.\d+')));

        final contentLine = tester.widget<Text>(
          find.byKey(const ValueKey('settings-content-version')),
        );
        expect(contentLine.data, startsWith('Content '));
        expect(
          contentLine.style!.fontSize!,
          lessThan(appLine.style!.fontSize!),
          reason: 'content tag is the smaller secondary line',
        );
        // The bare content tag is no longer the only footer text.
        expect(find.textContaining('Glow Rescue'), findsWidgets);
        Navigator.of(tester.element(find.text('Settings').first)).pop();
        await tester.pumpAndSettle();
        await drain(tester);
      },
    );
  });

  group('D5: switches read as clearly on or off', () {
    double luminance(Color c) => c.computeLuminance();
    double contrast(Color a, Color b) {
      final hi = math.max(luminance(a), luminance(b));
      final lo = math.min(luminance(a), luminance(b));
      return (hi + 0.05) / (lo + 0.05);
    }

    for (final theme in [signalRelayTheme, emberRelayTheme]) {
      for (final highContrast in [false, true]) {
        test('palette meets 3:1 for non-text UI '
            '(${theme == signalRelayTheme ? 'signal' : 'ember'}, '
            'highContrast=$highContrast)', () {
          final p = MrSwitchPalette.of(theme, highContrast: highContrast);
          // ON: the track stands out from the page, the thumb from the track.
          expect(contrast(p.onTrack, theme.paper), greaterThanOrEqualTo(3));
          expect(contrast(p.onThumb, p.onTrack), greaterThanOrEqualTo(3));
          // OFF: the outline stands out from the page, the thumb from the
          // track, so the control reads as an inactive switch.
          expect(contrast(p.offOutline, theme.paper), greaterThanOrEqualTo(3));
          expect(contrast(p.offThumb, p.offTrack), greaterThanOrEqualTo(3));
          // ON and OFF tracks are clearly different from each other.
          expect(contrast(p.onTrack, p.offTrack), greaterThanOrEqualTo(3));
          // ON is an accent colour, never a grey disabled-looking track.
          final on = HSLColor.fromColor(p.onTrack);
          if (!highContrast) {
            expect(on.saturation, greaterThan(0.2));
          }
        });
      }
    }

    testWidgets('Settings switches use the palette, and high contrast '
        'switches to the ink palette', (tester) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      await host(tester, game);
      await tester.tap(find.byTooltip('Settings').first);
      await tester.pumpAndSettle();

      final normal = MrSwitchPalette.of(signalRelayTheme);
      var sw = tester.widget<Switch>(find.byType(Switch).first);
      expect(sw.activeTrackColor, normal.onTrack);
      expect(sw.activeThumbColor, normal.onThumb);
      expect(sw.inactiveTrackColor, normal.offTrack);
      expect(sw.inactiveThumbColor, normal.offThumb);
      expect(
        sw.trackOutlineColor!.resolve({WidgetState.selected}),
        normal.onOutline,
      );
      expect(sw.trackOutlineColor!.resolve({}), normal.offOutline);

      // Turn High contrast on (third row).
      await tester.tap(find.byType(Switch).at(2));
      await tester.pumpAndSettle();
      final hc = MrSwitchPalette.of(signalRelayTheme, highContrast: true);
      sw = tester.widget<Switch>(find.byType(Switch).first);
      expect(sw.activeTrackColor, hc.onTrack);
      expect(sw.activeTrackColor, signalRelayTheme.ink);
      expect(sw.inactiveTrackColor, hc.offTrack);
      expect(
        sw.trackOutlineWidth!.resolve({}),
        greaterThan(normal.outlineWidth),
      );
      Navigator.of(tester.element(find.text('Settings').first)).pop();
      await tester.pumpAndSettle();
      await drain(tester);
    });
  });

  group('D1: Daily has its own result copy and layout', () {
    MergeRelayResult dailyResult({int score = 0, int maxTile = 4}) =>
        MergeRelayResult(
          mode: MergeRelayMode.daily,
          outcome: MergeRelayOutcome.completed,
          score: score,
          maxTile: maxTile,
          movesUsed: 3,
          objective: MergeRelayMode.daily.goal,
        );

    test('Daily copy is distinct from Rescue copy', () {
      final daily = dailyResult();
      const rescue = MergeRelayResult(
        mode: MergeRelayMode.rescue,
        outcome: MergeRelayOutcome.completed,
        score: 8,
        maxTile: 8,
        movesUsed: 3,
        objective: 'Reach 8 points.',
      );
      expect(daily.title, 'Daily complete');
      expect(daily.isDailyComplete, isTrue);
      expect(rescue.title, 'Path cleared');
      expect(rescue.isDailyComplete, isFalse);
      expect(daily.message, isNot(rescue.message));
      expect(daily.hint, isNot(rescue.hint));
      expect(daily.title, isNot(daily.message));
      for (final text in [daily.title, daily.message, daily.hint]) {
        expect(text, isNot(contains('Path cleared')));
        expect(text, isNot(contains('next path')));
      }
      // Non-completed Daily outcomes keep the shared copy.
      const stuck = MergeRelayResult(
        mode: MergeRelayMode.daily,
        outcome: MergeRelayOutcome.terminal,
        score: 0,
        maxTile: 2,
        movesUsed: 1,
        objective: 'x',
      );
      expect(stuck.title, 'No more moves');
    });

    testWidgets('a 0-score Daily shows moves, not a campaign panel or Score', (
      tester,
    ) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      game.completedRescueIds.value = {'rescue_1', 'rescue_2', 'rescue_3'};
      game.result.value = dailyResult();
      game.route.value = MergeRelayRoute.result;
      await host(tester, game, logical: const Size(400, 1200));
      await drain(tester);

      expect(find.text('Daily complete'), findsOneWidget);
      expect(find.text('Path cleared'), findsNothing);
      expect(find.text('Campaign progress'), findsNothing);
      expect(find.text('Moves'), findsOneWidget);
      expect(find.text('3 of 3'), findsOneWidget);
      expect(find.text('Best tile'), findsOneWidget);
      expect(find.text('Score'), findsNothing);
      expect(find.text("Today's chain"), findsOneWidget);
      expect(find.text('3 / 3 moves'), findsOneWidget);
      expect(find.text('Play again'), findsOneWidget);
      expect(find.text('Next path'), findsNothing);
      expect(find.text('Replay'), findsNothing);
    });

    testWidgets('a Daily that scored shows the Score stat', (tester) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      game.result.value = dailyResult(score: 12, maxTile: 8);
      game.route.value = MergeRelayRoute.result;
      await host(tester, game, logical: const Size(400, 1200));
      await drain(tester);

      expect(find.text('Score'), findsOneWidget);
      expect(find.text('12'), findsOneWidget);
      expect(find.text('Daily complete'), findsOneWidget);
    });

    testWidgets('Rescue results keep the campaign panel and Path cleared', (
      tester,
    ) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      game.result.value = const MergeRelayResult(
        mode: MergeRelayMode.rescue,
        outcome: MergeRelayOutcome.completed,
        score: 8,
        maxTile: 8,
        movesUsed: 3,
        objective: 'Reach 8 points.',
        rescueId: 'rescue_1',
      );
      game.route.value = MergeRelayRoute.result;
      await host(tester, game, logical: const Size(400, 1200));
      await drain(tester);

      expect(find.text('Path cleared'), findsOneWidget);
      expect(find.text('Campaign progress'), findsOneWidget);
      expect(find.text('Score'), findsOneWidget);
    });

    testWidgets('three real Daily moves end on "Daily complete"', (
      tester,
    ) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      game.startDaily();
      const rules = MergeRules();
      for (var i = 0; i < 3; i++) {
        final direction = MergeDirection.values.firstWhere(
          (d) => rules.apply(game.state.value, d).changed,
        );
        game.move(direction);
        await tester.pump(const Duration(milliseconds: 400));
      }
      expect(game.result.value?.outcome, MergeRelayOutcome.completed);
      await host(tester, game, logical: const Size(400, 1200));
      await drain(tester);

      expect(find.text('Daily complete'), findsOneWidget);
      expect(find.text('Path cleared'), findsNothing);
      expect(find.text('Campaign progress'), findsNothing);
    });

    testWidgets('Home says "Completed today" after a Daily', (tester) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      game.startDaily();
      const rules = MergeRules();
      for (var i = 0; i < 3; i++) {
        final direction = MergeDirection.values.firstWhere(
          (d) => rules.apply(game.state.value, d).changed,
        );
        game.move(direction);
        await tester.pump(const Duration(milliseconds: 400));
      }
      // Switching modes files today's Daily session (and its result) away,
      // which is what the Home card reads.
      game.startEndless();
      game.openHome();
      await host(tester, game, logical: const Size(400, 1200));
      await drain(tester);
      expect(find.text('Cleared today'), findsNothing);
      expect(find.text('Completed today'), findsOneWidget);
    });
  });
}
