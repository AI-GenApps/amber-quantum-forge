import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_rules/merge_rules.dart';

import 'screens/physical_golden.dart';

/// Task 07's device-less screen-golden harness: every later Merge Relay
/// visual task's evidence and every verifier's judgment come from these
/// eight PNGs (Home, Chapter list, Tutorial, Play/rescue, Play/endless,
/// Result, Settings, Pause), rendered at 1080x2400 (DPR 3) with the real
/// bundled fonts loaded via `test/flutter_test_config.dart`. This task
/// applies the new brand theme globally (fonts, colors, background), so
/// these goldens already show a real visual change; per-screen layout is
/// task 11's job.
///
/// Round 2 (orchestrator review): every test now loads the real shipped
/// content the same way `main.dart` does —
/// `await MergeRelayContentCatalog.load()` reading
/// `content/rescue_boards.json` via `rootBundle` — and passes it as
/// `MergeRelayApp(content: ...)`. The first pass instead used
/// `const MergeRelayApp()`, which leaves `content` null; `MergeRelayGame`
/// then falls back to `MergeRelayContentCatalog.fallback`, a small
/// generated 5-board dev catalog meant for fast, content-decoupled unit
/// tests (`test/widget_test.dart` uses the same fallback deliberately, for
/// the same reason) — not the real 60-board, 6-chapter Rescue campaign
/// task 06 shipped. That fallback is unreachable in the actual app:
/// `main.dart` always either has real `content` or a non-null
/// `contentError` (which shows a dedicated failure screen, never the
/// game), so `content` and `contentError` are never both null there. This
/// harness now matches that real loading path so its goldens show the real
/// content.
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

  testWidgets(
    'chapter list (Rescue paths sheet) renders with the design system',
    (tester) async {
      final key = await _bootApp(tester);
      await tester.tap(find.text('Rescue paths'));
      await tester.pumpAndSettle();
      await tester.pump(const Duration(milliseconds: 300));
      await _capture(tester, key, 'chapter_list.png');
    },
  );

  testWidgets('tutorial renders with the design system', (tester) async {
    final key = await _bootApp(tester);
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'tutorial.png');
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

  testWidgets('result renders with the design system', (tester) async {
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
    await _capture(tester, key, 'result.png');
  });

  testWidgets('settings sheet renders with the design system', (tester) async {
    final key = await _bootApp(tester);
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'settings.png');
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

/// Sets the golden's 1080x2400 physical phone view, pumps a fresh
/// [MergeRelayApp] loaded with the real shipped content (loading it first
/// if [content] isn't already on hand) inside a keyed [RepaintBoundary],
/// and returns that key.
Future<Key> _bootApp(
  WidgetTester tester, {
  MergeRelayContentCatalog? content,
}) async {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  final resolvedContent = content ?? await _loadContent(tester);
  final key = UniqueKey();
  await tester.pumpWidget(
    RepaintBoundary(
      key: key,
      child: MergeRelayApp(content: resolvedContent),
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
/// prove every board is solvable — so the "result" golden shows a real
/// cleared run instead of a guessed swipe sequence.
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
