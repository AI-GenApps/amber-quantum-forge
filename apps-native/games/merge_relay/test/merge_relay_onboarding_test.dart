import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_relay/src/merge_relay_models.dart';
import 'package:merge_relay/src/merge_relay_theme.dart';
import 'package:merge_relay/src/merge_relay_tutorial.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

/// Task 12: the first-run welcome step ahead of the interactive tutorial,
/// and its "skip anywhere"/"replay from Settings" rules.
///
/// `pumpAndSettle` is never used once the interactive step's hand-hint is
/// mounted — its `AnimationController` repeats forever (see
/// `_SwipeHandHint` in `lib/src/merge_relay_tutorial.dart`) — every such
/// spot below uses a bare `pump()`/`pump(duration)` instead.
void main() {
  testWidgets(
    'a fresh install walks welcome, the interactive tutorial, and a real '
    'merge to a rescue win, and the chapter map then highlights the next '
    'board',
    (tester) async {
      final catalog = await tester.runAsync(MergeRelayContentCatalog.load);
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 3;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(MergeRelayApp(content: catalog));
      await tester.pump();

      await tester.tap(find.text('Play rescue'));
      await tester.pumpAndSettle();
      expect(find.text('Slide to merge matching tiles.'), findsOneWidget);

      await tester.tap(find.text("Let's play"));
      await tester.pump();
      expect(find.text('Slide the pair left.'), findsOneWidget);

      await tester.fling(
        find.byWidgetPredicate(
          (widget) => widget is GestureDetector && widget.onPanUpdate != null,
        ),
        const Offset(-180, 0),
        1000,
      );
      await tester.pump();
      expect(find.text('That merge made room.'), findsOneWidget);

      await tester.tap(find.text('Start rescue'));
      await tester.pumpAndSettle();

      final resolvedCatalog = catalog ?? MergeRelayContentCatalog.fallback;
      for (final direction in _solveFirstRescue(resolvedCatalog)) {
        await tester.fling(
          find.byType(MergeRelayBoard),
          _swipeDelta(direction),
          1000,
        );
        await tester.pumpAndSettle();
      }
      expect(find.text('Path cleared'), findsOneWidget);

      await tester.tap(find.text('Home'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Rescue paths'));
      await tester.pumpAndSettle();

      expect(
        find.bySemanticsLabel(RegExp('Board 2,.*next up')),
        findsOneWidget,
      );
    },
  );

  testWidgets('skip on the welcome step starts rescue play directly', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();

    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    expect(find.text('Slide to merge matching tiles.'), findsOneWidget);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    expect(find.byType(MergeRelayBoard), findsOneWidget);
    expect(find.text('Slide to merge matching tiles.'), findsNothing);
  });

  testWidgets('skip on the interactive step also starts rescue play directly', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();

    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text("Let's play"));
    await tester.pump();
    expect(find.text('Slide the pair left.'), findsOneWidget);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    expect(find.byType(MergeRelayBoard), findsOneWidget);
  });

  testWidgets(
    'replaying the tutorial after onboarding is done skips the welcome step',
    (tester) async {
      await tester.pumpWidget(const MergeRelayApp());
      await tester.pump();
      await tester.tap(find.text('Play rescue'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();

      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Replay tutorial'));
      await tester.tap(find.text('Replay tutorial'));
      // Onboarding is already done, so this lands directly on the
      // interactive step (no welcome interstitial) — its hand-hint's
      // repeating animation is already mounted, so a fixed-duration
      // `pump()`, not `pumpAndSettle`, settles the sheet's own dismiss
      // transition from here.
      await tester.pump(const Duration(milliseconds: 400));

      expect(find.text('Slide to merge matching tiles.'), findsNothing);
      expect(find.text('Slide the pair left.'), findsOneWidget);
    },
  );

  testWidgets(
    'an existing save with the tutorial not yet complete still shows the '
    'welcome step',
    (tester) async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final store = MemorySaveStore();
      await store.write(
        context,
        SaveEnvelope.create(
          context: context,
          schemaVersion: 1,
          savedAt: DateTime.utc(2026),
          payload: {
            'session_map_version': 1,
            'active_session_key': null,
            'sessions': <String, Object?>{},
            'profile': {
              'tutorial_version': 0,
              'theme_id': 'signal',
              'reduced_motion': false,
              'audio_enabled': true,
              'haptics_enabled': true,
              'accessible_controls': false,
              'completed_rescue_ids': <String>['rescue-signal'],
            },
          },
        ),
      );
      final game = MergeRelayGame(context: context, saveStore: store);
      await game.restore();
      // The versioning rule this task keeps: an existing save's own
      // progress never implies the (now-versioned) tutorial is complete.
      expect(game.tutorialComplete.value, isFalse);
      expect(game.completedRescueIds.value, contains('rescue-signal'));

      game.openRescue(index: 1);
      expect(game.route.value, MergeRelayRoute.tutorial);

      await tester.pumpWidget(
        MaterialApp(
          theme: materialThemeFor(signalRelayTheme),
          home: MergeRelayTutorial(game: game, theme: signalRelayTheme),
        ),
      );
      await tester.pump();
      expect(find.text('Slide to merge matching tiles.'), findsOneWidget);
      game.dispose();
    },
  );

  testWidgets(
    'reduced motion hides the hand hint but keeps the instructional text',
    (tester) async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final game = MergeRelayGame(
        context: context,
        saveStore: MemorySaveStore(),
      );
      await game.restore();
      game.setReducedMotion(true);

      await tester.pumpWidget(
        MaterialApp(
          theme: materialThemeFor(signalRelayTheme),
          home: MergeRelayTutorial(game: game, theme: signalRelayTheme),
        ),
      );
      await tester.pump();
      await tester.tap(find.text("Let's play"));
      await tester.pump();

      expect(find.text('Slide the pair left.'), findsOneWidget);
      expect(find.byIcon(Icons.touch_app_rounded), findsNothing);
      game.dispose();
    },
  );
}

/// The winning move line for chapter 1's first board — the same
/// `MergeRescueSolver` task 06's own tests use, and the pattern
/// `test/goldens/screens_test.dart` follows for its "result (win)" golden.
List<MergeDirection> _solveFirstRescue(MergeRelayContentCatalog catalog) {
  final board = catalog.rescues.firstWhere(
    (rescue) => rescue.chapter == 1 && rescue.indexInChapter == 1,
    orElse: () => catalog.rescues.first,
  );
  const solver = MergeRescueSolver();
  final result = solver.solve(
    state: board.state,
    targetScore: board.targetScore,
    moveBudget: board.moveBudget,
  );
  return result.winningLine!;
}

Offset _swipeDelta(MergeDirection direction) => switch (direction) {
  MergeDirection.up => const Offset(0, -180),
  MergeDirection.down => const Offset(0, 180),
  MergeDirection.left => const Offset(-180, 0),
  MergeDirection.right => const Offset(180, 0),
};
