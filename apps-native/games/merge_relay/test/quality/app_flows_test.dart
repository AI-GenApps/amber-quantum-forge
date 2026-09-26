import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

/// Task 13's end-to-end flow requirements.
///
/// 1. Fresh install -> tutorial -> board 1 cleared -> chapter map (through
///    the real `MergeRelayApp` widget).
/// 2. A mid-run kill and restore, simulating process death through the
///    REAL file-backed save adapter (`JsonFileSaveStore`, the type
///    `lib/src/save_adapter.dart` wraps around a real app-documents
///    directory) rather than the in-memory fake most other tests use. This
///    one drives the real `MergeRelayGame` controller directly rather than
///    through `MergeRelayApp`: genuine `dart:io` file reads/writes don't
///    reliably complete inside `testWidgets`' fake-async pump loop (this
///    file's first draft hung indefinitely doing exactly that), the same
///    reason `MergeRelayContentCatalog.load()` elsewhere is only ever
///    awaited via `tester.runAsync`.
/// 3. Settings toggles persist across restart, flipped through the real
///    Settings sheet UI (not by calling the game controller directly).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'fresh install walks tutorial-skip, clears board 1, and lands on the '
    'chapter map with board 2 next up',
    (tester) async {
      final catalog = await tester.runAsync(MergeRelayContentCatalog.load);
      await tester.pumpWidget(MergeRelayApp(content: catalog));
      await tester.pump();

      await tester.tap(find.text('Play rescue'));
      await tester.pumpAndSettle();
      expect(find.text('Slide to merge matching tiles.'), findsOneWidget);

      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();

      final resolved = catalog ?? MergeRelayContentCatalog.fallback;
      final board = resolved.rescues.firstWhere(
        (r) => r.chapter == 1 && r.indexInChapter == 1,
        orElse: () => resolved.rescues.first,
      );
      const solver = MergeRescueSolver();
      final winningLine = solver
          .solve(
            state: board.state,
            targetScore: board.targetScore,
            moveBudget: board.moveBudget,
          )
          .winningLine!;
      for (final direction in winningLine) {
        await tester.fling(
          find.byType(MergeRelayBoard),
          _delta(direction),
          1000,
        );
        await tester.pumpAndSettle();
      }
      expect(find.text('Path cleared'), findsOneWidget);

      await tester.tap(find.text('Home'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Rescue paths'));
      await tester.tap(find.text('Rescue paths'));
      await tester.pumpAndSettle();
      expect(
        find.bySemanticsLabel(RegExp('Board 2,.*next up')),
        findsOneWidget,
      );
    },
  );

  test('a mid-run kill and restore through the real file save adapter keeps '
      'the board and tutorial state', () async {
    final root = await Directory.systemTemp.createTemp('mr-quality-flow-');
    addTearDown(() => root.delete(recursive: true));
    final store = JsonFileSaveStore(root: root);
    final context = runtimeAppContext(identity: mergeRelayIdentity);

    final game = MergeRelayGame(context: context, saveStore: store);
    await game.restore();
    game.completeTutorial(skipped: true);
    const rules = MergeRules();
    final firstLegal = MergeDirection.values.firstWhere(
      (direction) => rules.apply(game.state.value, direction).changed,
    );
    game.move(firstLegal);
    final boardBeforeKill = game.state.value.toJson();
    final movesBeforeKill = game.movesRemaining;
    await game.flushWrites();
    game.dispose();

    // "Restore": a brand-new `MergeRelayGame`, reading from the same
    // on-disk file — simulating the app process being killed and
    // relaunched.
    final restored = MergeRelayGame(context: context, saveStore: store);
    await restored.restore();

    expect(restored.tutorialComplete.value, isTrue);
    expect(restored.state.value.toJson(), boardBeforeKill);
    expect(restored.movesRemaining, movesBeforeKill);
    expect(restored.result.value, isNull);
    restored.dispose();
  });

  testWidgets(
    'a Settings toggle flipped through the real sheet persists across a '
    'restart',
    (tester) async {
      final store = MemorySaveStore();

      await tester.pumpWidget(MergeRelayApp(saveStore: store));
      await tester.pump();
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();

      expect(find.byType(Switch).at(2), findsOneWidget);
      var highContrast = tester.widget<Switch>(find.byType(Switch).at(2));
      expect(highContrast.value, isFalse);
      await tester.tap(find.byType(Switch).at(2));
      await tester.pumpAndSettle();
      highContrast = tester.widget<Switch>(find.byType(Switch).at(2));
      expect(highContrast.value, isTrue);
      // Dismiss the sheet by popping its route directly, the same way
      // `merge_relay_screens_responsive_test.dart` does at a viewport size
      // where the sheet can fill the screen and leave no barrier to tap.
      Navigator.of(tester.element(find.text('Settings'))).pop();
      await tester.pumpAndSettle();

      // "Restart": a brand-new app instance sharing the same in-memory
      // store — the proven idiom `widget_test.dart`'s "restore keeps a
      // completed result available from Continue" uses (a fresh
      // `UniqueKey` forces Flutter to tear down the old State, not reuse
      // it).
      await tester.pumpWidget(
        MergeRelayApp(key: UniqueKey(), saveStore: store),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      final restoredSwitch = tester.widget<Switch>(find.byType(Switch).at(2));
      expect(restoredSwitch.value, isTrue);
    },
  );
}

Offset _delta(MergeDirection direction) => switch (direction) {
  MergeDirection.up => const Offset(0, -180),
  MergeDirection.down => const Offset(0, 180),
  MergeDirection.left => const Offset(-180, 0),
  MergeDirection.right => const Offset(180, 0),
};
