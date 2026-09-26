import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_relay/src/merge_relay_models.dart';
import 'package:merge_relay/src/merge_relay_motion.dart';
import 'package:merge_relay/src/merge_relay_theme.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

/// Task 13: `merge_relay_rescue_campaign_test.dart` (task 06) already
/// replays the solver's winning line for all 60 rescue boards through the
/// real `MergeRelayGame` controller (`game.startRescue` + `game.move`) —
/// this file doesn't repeat that. What it doesn't cover is the UI
/// controller path: real drag gestures on the actual `MergeRelayBoard`
/// widget, which is how a player's swipe actually reaches `game.move` (via
/// `MergeSwipeAccumulator` in `lib/src/merge_relay_gesture.dart`).
///
/// One board per chapter (6 of the 60) is replayed this way — a full
/// 60-board gesture sweep would be redundant with the controller-path test
/// above and slower for no extra coverage, since both paths converge on the
/// same `game.move` call.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'one rescue board per chapter clears via real swipe gestures on the '
    'board widget',
    (tester) async {
      final catalog = await tester.runAsync(MergeRelayContentCatalog.load);
      final resolved = catalog ?? MergeRelayContentCatalog.fallback;
      const solver = MergeRescueSolver();

      for (var chapter = 1; chapter <= 6; chapter += 1) {
        final board = resolved.rescues.firstWhere(
          (rescue) => rescue.chapter == chapter && rescue.indexInChapter == 1,
        );
        final index = resolved.rescues.indexOf(board);
        final winningLine = solver
            .solve(
              state: board.state,
              targetScore: board.targetScore,
              moveBudget: board.moveBudget,
            )
            .winningLine!;

        final game = MergeRelayGame(
          context: runtimeAppContext(identity: mergeRelayIdentity),
          saveStore: MemorySaveStore(),
          content: resolved,
        );
        await game.restore();
        game.completeTutorial(skipped: true);
        game.startRescue(index: index);

        await tester.pumpWidget(_host(game));
        await tester.pump();

        for (final direction in winningLine) {
          await tester.fling(
            find.byType(MergeRelayBoard),
            _delta(direction),
            1000,
          );
          await tester.pump();
          await tester.pump(mergeRelayMoveAnimationDuration);
        }

        expect(
          game.result.value?.outcome,
          MergeRelayOutcome.completed,
          reason: '${board.id} (chapter $chapter) did not clear via gestures',
        );
        expect(game.result.value?.rescueId, board.id);
        await tester.pumpWidget(const SizedBox());
        // Disposed explicitly, not just via `addTearDown`: `flutter_test`
        // checks for pending timers (the 1600ms `_announce` feedback timer)
        // at the end of the test body itself, before any teardown callback
        // runs — see `merge_relay_board_widget_test.dart` for the same
        // idiom. This loop creates 6 games, so each must be disposed as it
        // goes rather than all at once at the very end.
        game.dispose();
      }
    },
  );
}

/// Mirrors `merge_relay_board_widget_test.dart`'s `hostFor`: `MergeRelayBoard`
/// only listens to the notifiers a real `ListenableBuilder` merges for it,
/// so it must be wrapped the same way here for a gesture-driven `game.move()`
/// to repaint.
Widget _host(MergeRelayGame game) {
  return MaterialApp(
    home: Scaffold(
      body: ListenableBuilder(
        listenable: Listenable.merge([
          game.presentation,
          game.blockedMoveSignal,
          game.state,
          game.roundComplete,
          game.preferences,
        ]),
        builder: (context, _) =>
            MergeRelayBoard(game: game, theme: signalRelayTheme),
      ),
    ),
  );
}

Offset _delta(MergeDirection direction) => switch (direction) {
  MergeDirection.up => const Offset(0, -180),
  MergeDirection.down => const Offset(0, 180),
  MergeDirection.left => const Offset(-180, 0),
  MergeDirection.right => const Offset(180, 0),
};
