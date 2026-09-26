import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_relay/src/merge_relay_models.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'screens/physical_golden.dart';

/// Task 07's device-less screen-golden harness, extended task 11 for the
/// full home/chapter-map/result/pause/settings restyle and the Play screen
/// recomposition: every visual task's evidence and every verifier's
/// judgment come from these PNGs, rendered at 1080x2400 (DPR 3, unless
/// noted) with the real bundled fonts loaded via
/// `test/flutter_test_config.dart`.
///
/// Task 11 replaces the old "Rescue paths" bottom sheet with a full-screen
/// chapter map (`chapter_map.png`, was `chapter_list.png`) and splits the
/// single "result" golden into a win and a loss variant
/// (`result_win.png`/`result_loss.png`, was `result.png`), plus adds
/// `home_small.png` at 360x640 per the task's Implementation Checklist.
///
/// Round 2 (orchestrator review): every test loads the real shipped content
/// the same way `main.dart` does — `await MergeRelayContentCatalog.load()`
/// reading `content/rescue_boards.json` via `rootBundle` — and passes it as
/// `MergeRelayApp(content: ...)`, so goldens show the real 60-board,
/// 6-chapter Rescue campaign rather than the small fallback catalog
/// `test/widget_test.dart` uses for fast, content-decoupled unit tests.
///
/// Each test wraps `MergeRelayApp` in its own `RepaintBoundary` (rather
/// than finding one further down the tree) so the capture also includes
/// any modal bottom sheet/dialog content, which `Navigator` renders as a
/// sibling overlay entry above the base route — not a descendant of it.
void main() {
  testWidgets('home renders with the brand chrome', (tester) async {
    final key = await _bootApp(tester);
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'home.png');
  });

  testWidgets('home (small screen) renders with no empty band', (tester) async {
    final key = await _bootApp(
      tester,
      physicalSize: const Size(360, 640),
      dpr: 1,
    );
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'home_small.png');
  });

  testWidgets('chapter map (Rescue paths) renders with the design system', (
    tester,
  ) async {
    // Seeded save (task 11's acceptance criteria): clears exactly 7 of
    // chapter 1's boards — the unlock threshold — so the golden shows all
    // three node states at once: cleared (chapter 1's first 7), the newly
    // unlocked chapter 2's first board as "current" (the suggested next
    // board), and chapters 3-6 still locked.
    final catalog = await _loadContent(tester);
    final clearedIds = catalog.rescues
        .where((rescue) => rescue.chapter == 1)
        .take(7)
        .map((rescue) => rescue.id)
        .toList();
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = MemorySaveStore();
    await tester.runAsync(
      () => store.write(
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
              'tutorial_version': mergeRelayTutorialVersion,
              'theme_id': 'signal',
              'reduced_motion': false,
              'audio_enabled': true,
              'haptics_enabled': true,
              'accessible_controls': false,
              'completed_rescue_ids': clearedIds,
            },
          },
        ),
      ),
    );
    final key = await _bootApp(tester, content: catalog, saveStore: store);
    await tester.tap(find.text('Rescue paths'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'chapter_map.png');
  });

  testWidgets('welcome renders with the design system', (tester) async {
    final key = await _bootApp(tester);
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'welcome.png');
  });

  testWidgets('tutorial renders with the design system', (tester) async {
    final key = await _bootApp(tester);
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text("Let's play"));
    // Never `pumpAndSettle` from here: the hand-hint's repeating animation
    // controller never settles (see `_SwipeHandHint` in
    // `merge_relay_tutorial.dart`).
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'tutorial.png');
  });

  testWidgets('tutorial hand-hint mid-swing renders with the design system', (
    tester,
  ) async {
    final key = await _bootApp(tester);
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text("Let's play"));
    // A `Ticker`'s elapsed time is relative to the timestamp of its own
    // *first* frame callback, not to when `repeat()` was called — so the
    // very first pump after this widget mounts only establishes that
    // baseline (the hint reads as freshly at rest, still a valid capture
    // for `tutorial.png`'s general screenshot). A second, later pump is
    // needed to actually see progress, which is what this golden is for.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 450));
    await _capture(tester, key, 'tutorial_hint.png');
  });

  testWidgets('play (rescue) renders with the design system', (tester) async {
    final key = await _bootApp(tester);
    await _skipToRescuePlay(tester);
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'play_rescue.png');
  });

  testWidgets('play (endless) renders with the design system', (tester) async {
    final key = await _bootApp(tester);
    await _skipToRescuePlay(tester);
    await tester.tap(find.byTooltip('Home'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Endless'));
    await tester.tap(find.text('Endless'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'play_endless.png');
  });

  testWidgets('result (win) renders with the design system', (tester) async {
    final catalog = await _loadContent(tester);
    final key = await _bootApp(tester, content: catalog);
    await _skipToRescuePlay(tester);
    for (final direction in _solveFirstRescue(catalog)) {
      await tester.fling(
        find.byType(MergeRelayBoard),
        _swipeDelta(direction),
        1000,
      );
      await tester.pumpAndSettle();
    }
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'result_win.png');
  });

  testWidgets('result (loss) renders with the design system', (tester) async {
    // Reaches a non-completed result deterministically via the pause
    // panel's "Finish here" action (outcome: earlyFinish) instead of
    // relying on a board-specific losing sequence, which would be fragile
    // against future content changes.
    final key = await _bootApp(tester);
    await _skipToRescuePlay(tester);
    await tester.fling(
      find.byType(MergeRelayBoard),
      const Offset(0, -180),
      1000,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Pause'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Finish here'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'result_loss.png');
  });

  testWidgets('settings sheet renders with the design system', (tester) async {
    final key = await _bootApp(tester);
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'settings.png');
  });

  testWidgets('how to play renders with the design system', (tester) async {
    final key = await _bootApp(tester);
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('How to play'));
    await tester.tap(find.text('How to play'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'how_to_play.png');
  });

  testWidgets('pause overlay renders with the design system', (tester) async {
    final key = await _bootApp(tester);
    await _skipToRescuePlay(tester);
    await tester.tap(find.byTooltip('Pause'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'pause.png');
  });
}

/// Sets the golden's physical phone view (1080x2400 @ DPR 3 by default,
/// overridable for the 360x640 small-screen golden), pumps a fresh
/// [MergeRelayApp] loaded with the real shipped content (loading it first
/// if [content] isn't already on hand) inside a keyed [RepaintBoundary],
/// and returns that key.
Future<Key> _bootApp(
  WidgetTester tester, {
  MergeRelayContentCatalog? content,
  Size physicalSize = const Size(1080, 2400),
  double dpr = 3,
  SaveStore? saveStore,
}) async {
  tester.view.physicalSize = physicalSize;
  tester.view.devicePixelRatio = dpr;
  addTearDown(tester.view.reset);
  final resolvedContent = content ?? await _loadContent(tester);
  final key = UniqueKey();
  await tester.pumpWidget(
    RepaintBoundary(
      key: key,
      child: MergeRelayApp(content: resolvedContent, saveStore: saveStore),
    ),
  );
  await tester.pump();
  return key;
}

/// Loads the real shipped content the same way `main.dart` does. Must run
/// inside [WidgetTester.runAsync]: `testWidgets` bodies execute in a fake
/// async zone for deterministic `pump()`-driven scheduling, and
/// `rootBundle.loadString`'s real file read never completes there without
/// `runAsync` briefly stepping outside it — every `_loadContent` call site
/// hung for the full 10-minute test timeout before this fix.
Future<MergeRelayContentCatalog> _loadContent(WidgetTester tester) async {
  return (await tester.runAsync(MergeRelayContentCatalog.load))!;
}

/// The winning move line for the campaign's very first rescue (chapter 1,
/// board 1) — the same `MergeRescueSolver` task 06's own tests use to
/// prove every board is solvable — so the "result (win)" golden shows a
/// real cleared run instead of a guessed swipe sequence.
List<MergeDirection> _solveFirstRescue(MergeRelayContentCatalog catalog) {
  final board = catalog.rescues.firstWhere(
    (rescue) => rescue.chapter == 1 && rescue.indexInChapter == 1,
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

/// From a freshly booted home screen: starts a rescue run, then skips the
/// one-time tutorial — landing on the rescue play screen with
/// `tutorialComplete == true`, matching `test/widget_test.dart`'s flow.
Future<void> _skipToRescuePlay(WidgetTester tester) async {
  await tester.tap(find.text('Play rescue'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Skip'));
  await tester.pumpAndSettle();
}

/// `matchesGoldenFile` resolves its path relative to this test file's own
/// directory (`test/goldens/`), so `goldenName` is prefixed with
/// `screens/` to land at `test/goldens/screens/<goldenName>` as the task
/// requires.
Future<void> _capture(WidgetTester tester, Key key, String goldenName) async {
  await expectLater(
    capturePhysicalGolden(tester, find.byKey(key)),
    matchesGoldenFile('screens/$goldenName'),
  );
}
