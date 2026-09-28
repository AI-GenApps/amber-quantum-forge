import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_painter.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_relay/src/merge_relay_motion.dart';
import 'package:merge_relay/src/merge_relay_theme.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

/// Widget-level coverage for task 09's animation layer: a swipe made
/// while the previous move is still animating is queued rather than
/// dropped or applied out of order, pausing mid-animation still leaves
/// the authoritative save consistent with the visible board (the audit's
/// UX-01 rule), and reduced motion settles a move with no animation
/// frame ever mid-flight.
///
/// Every case wraps `MergeRelayBoard` in a `ListenableBuilder` over the
/// same notifiers `MergeRelayScreen` merges in production — the board
/// widget itself never listens to the game directly, so without this a
/// gesture-triggered `game.move()` would update the game but never repaint.
void main() {
  Future<MergeRelayGame> readyGame({SaveStore? saveStore}) async {
    final game = MergeRelayGame(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      saveStore: saveStore ?? MemorySaveStore(),
    );
    await game.restore();
    return game;
  }

  Widget hostFor(MergeRelayGame game, {MediaQueryData? mediaQuery}) {
    final app = MaterialApp(
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
    if (mediaQuery == null) return app;
    return MediaQuery(data: mediaQuery, child: app);
  }

  MergeDirection legalDirectionFor(MergeGameState state) {
    const rules = MergeRules();
    return MergeDirection.values.firstWhere(
      (direction) => rules.apply(state, direction).changed,
    );
  }

  Offset deltaFor(MergeDirection direction) => switch (direction) {
    MergeDirection.up => const Offset(0, -180),
    MergeDirection.down => const Offset(0, 180),
    MergeDirection.left => const Offset(-180, 0),
    MergeDirection.right => const Offset(180, 0),
  };

  MergeRelayBoardPainter painterOf(WidgetTester tester) {
    final widget = tester.widget<CustomPaint>(
      find.byWidgetPredicate(
        (widget) =>
            widget is CustomPaint && widget.painter is MergeRelayBoardPainter,
      ),
    );
    return widget.painter! as MergeRelayBoardPainter;
  }

  testWidgets(
    'a swipe made mid-animation is queued and applied once the current '
    'move settles',
    (tester) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      game.startRescue();
      await tester.pumpWidget(hostFor(game));
      await tester.pump();

      final initial = game.state.value;
      final first = legalDirectionFor(initial);
      await tester.fling(find.byType(MergeRelayBoard), deltaFor(first), 1000);
      await tester.pump();
      final afterFirstMove = game.state.value;
      expect(afterFirstMove, isNot(same(initial)));

      final second = legalDirectionFor(afterFirstMove);
      await tester.fling(find.byType(MergeRelayBoard), deltaFor(second), 1000);
      await tester.pump(const Duration(milliseconds: 20));
      expect(game.state.value, same(afterFirstMove));

      await tester.pump(mergeRelayMoveAnimationDuration);
      expect(game.state.value, isNot(same(afterFirstMove)));
      // Disposed explicitly (in addition to `addTearDown`) rather than
      // left to fire on its own: `flutter_test` checks for pending
      // timers at the end of the test body itself, before teardown
      // callbacks run, and `_announce`'s 1600ms feedback timer would
      // otherwise still be pending then.
      game.dispose();
    },
  );

  testWidgets(
    'pausing mid-animation and restoring preserves the authoritative board',
    (tester) async {
      final store = MemorySaveStore();
      final game = await readyGame(saveStore: store);
      // Establishes the active session key `_queueWrite` needs to
      // persist the board at all — matching how the real app always
      // starts a mode (via `openPlay`/`startRescue`) before a move can
      // be made, rather than moving against a never-started session.
      game.startRescue();
      await tester.pumpWidget(hostFor(game));
      await tester.pump();

      final direction = legalDirectionFor(game.state.value);
      await tester.fling(
        find.byType(MergeRelayBoard),
        deltaFor(direction),
        1000,
      );
      await tester.pump(const Duration(milliseconds: 30));

      game.setPaused(true);
      await game.flushWrites();
      final expectedBoard = game.state.value.toJson();
      game.dispose();

      final reopened = await readyGame(saveStore: store);
      expect(reopened.state.value.toJson(), expectedBoard);
      expect(reopened.isPaused.value, isTrue);
      reopened.dispose();
    },
  );

  testWidgets(
    'reduced motion settles a move instantly with no mid-flight frame',
    (tester) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      game.startRescue();
      game.setReducedMotion(true);
      await tester.pumpWidget(hostFor(game));
      await tester.pump();

      final direction = legalDirectionFor(game.state.value);
      await tester.fling(
        find.byType(MergeRelayBoard),
        deltaFor(direction),
        1000,
      );
      await tester.pump();

      final frame = painterOf(tester).frame;
      expect(frame.slideEase, 1);
      expect(frame.mergeSquash, closeTo(0, 1e-6));
      expect(frame.spawnGrow, 1);
      game.dispose();
    },
  );

  testWidgets(
    'the platform disableAnimations signal alone (Settings toggle OFF) '
    'still settles a move instantly',
    (tester) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      game.startRescue();
      // The in-app toggle is explicitly left off — only the platform
      // accessibility signal says to reduce motion.
      expect(game.preferences.value.reducedMotion, isFalse);
      await tester.pumpWidget(
        hostFor(
          game,
          mediaQuery: const MediaQueryData(disableAnimations: true),
        ),
      );
      await tester.pump();

      final direction = legalDirectionFor(game.state.value);
      await tester.fling(
        find.byType(MergeRelayBoard),
        deltaFor(direction),
        1000,
      );
      await tester.pump();

      final frame = painterOf(tester).frame;
      expect(frame.slideEase, 1);
      expect(frame.mergeSquash, closeTo(0, 1e-6));
      expect(frame.spawnGrow, 1);
      expect(frame.scaleX, 1);
      expect(frame.scaleY, 1);
      game.dispose();
    },
  );

  testWidgets(
    'a full-speed move (motion on) is mid-flight right after the swipe',
    (tester) async {
      final game = await readyGame();
      addTearDown(game.dispose);
      game.startRescue();
      await tester.pumpWidget(hostFor(game));
      await tester.pump();

      final direction = legalDirectionFor(game.state.value);
      await tester.fling(
        find.byType(MergeRelayBoard),
        deltaFor(direction),
        1000,
      );
      await tester.pump(const Duration(milliseconds: 10));

      final frame = painterOf(tester).frame;
      expect(frame.slideEase, lessThan(1));

      await tester.pump(mergeRelayMoveAnimationDuration);
      game.dispose();
    },
  );

  testWidgets('the changed/merged-cell ring is mid-fade partway through a move '
      '(fix round 2: it must not stay fully opaque for the whole session)', (
    tester,
  ) async {
    final game = await readyGame();
    addTearDown(game.dispose);
    game.startRescue();
    await tester.pumpWidget(hostFor(game));
    await tester.pump();

    final direction = legalDirectionFor(game.state.value);
    await tester.fling(find.byType(MergeRelayBoard), deltaFor(direction), 1000);
    // The first pump after the fling both processes the presentation
    // change and starts the `AnimationController` — its ticker's start
    // reference is that same pump's (already-advanced) timestamp, so
    // that single pump always evaluates at elapsed-since-start == 0
    // regardless of the duration passed to it. A second pump is what
    // actually advances the now-running ticker partway through its
    // 250ms duration.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 120));

    final highlightAlpha = painterOf(tester).highlightAlpha;
    expect(highlightAlpha, greaterThan(0));
    expect(highlightAlpha, lessThan(1));

    await tester.pump(mergeRelayMoveAnimationDuration);
    game.dispose();
  });

  testWidgets(
    'a few frames after a move settles, the ring has fully faded and the '
    'board paints with no lingering highlight (fix round 2)',
    (tester) async {
      // A merge that does NOT set a new best tile (an 8 is already on the
      // board, so merging 2+2 into 4 doesn't celebrate) — the best-tile
      // confetti is a deliberate, separately-timed effect (520ms), not
      // the bug this fix targets, so it's kept out of this scenario
      // entirely rather than racing its own fade against the assertions
      // below.
      final game = MergeRelayGame(
        context: runtimeAppContext(identity: mergeRelayIdentity),
        saveStore: MemorySaveStore(),
        content: MergeRelayContentCatalog([
          MergeRescueBoard(
            id: 'no-celebration-fixture',
            title: 'Fixture',
            subtitle: 'Fixture',
            state: MergeGameState(
              board: MergeBoard([
                2, 2, 0, 0, //
                0, 0, 0, 8, //
                0, 0, 0, 0, //
                0, 0, 0, 0, //
              ]),
              score: 0,
              moveCount: 0,
              seed: 1,
              rngState: 11,
            ),
            originSeed: 1,
            originMoves: const [],
          ),
        ]),
      );
      addTearDown(game.dispose);
      await game.restore();
      await tester.pumpWidget(hostFor(game));
      await tester.pump();

      await tester.fling(
        find.byType(MergeRelayBoard),
        deltaFor(MergeDirection.left),
        1000,
      );
      // The first pump after the fling only starts the animation (see the
      // "mid-fade" test above for why); fully settle it, then advance a
      // few more frames — the scenario the fix targets:
      // `presentation.changedCells` is still non-empty (it's only
      // replaced by the *next* move), so only the ring's own
      // faded-to-zero opacity keeps it from reappearing.
      await tester.pump();
      await tester.pump(mergeRelayMoveAnimationDuration);
      await tester.pump(const Duration(milliseconds: 16));
      await tester.pump(const Duration(milliseconds: 16));

      final settledPainter = painterOf(tester);
      expect(settledPainter.changedCells, isNotEmpty);
      expect(settledPainter.highlightAlpha, 0);

      final withLingeringRing = await tester.runAsync(() async {
        final recorder = ui.PictureRecorder();
        final canvas = Canvas(recorder);
        settledPainter.paint(canvas, const Size(400, 400));
        final image = await recorder.endRecording().toImage(400, 400);
        final bytes = await image.toByteData(
          format: ui.ImageByteFormat.rawRgba,
        );
        return bytes!.buffer.asUint8List();
      });
      final withNoPresentationAtAll = await tester.runAsync(() async {
        final recorder = ui.PictureRecorder();
        final canvas = Canvas(recorder);
        MergeRelayBoardPainter(
          board: settledPainter.board,
          theme: settledPainter.theme,
          highContrast: settledPainter.highContrast,
        ).paint(canvas, const Size(400, 400));
        final image = await recorder.endRecording().toImage(400, 400);
        final bytes = await image.toByteData(
          format: ui.ImageByteFormat.rawRgba,
        );
        return bytes!.buffer.asUint8List();
      });
      expect(withLingeringRing!, orderedEquals(withNoPresentationAtAll!));

      game.dispose();
    },
  );

  testWidgets('a blocked swipe plays the shake animation', (tester) async {
    final blockedState = MergeGameState(
      board: MergeBoard([
        2, 4, 2, 4, //
        4, 2, 4, 2, //
        2, 4, 2, 4, //
        4, 2, 4, 2, //
      ]),
      score: 0,
      moveCount: 0,
      seed: 1,
      rngState: 11,
    );
    // A fully-packed, already-terminal board, loaded via a one-off
    // catalog (a fresh game always starts from `content.firstRescue`) so
    // the very first swipe is guaranteed blocked.
    final blockedGame = MergeRelayGame(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      saveStore: MemorySaveStore(),
      content: MergeRelayContentCatalog([
        MergeRescueBoard(
          id: 'blocked-fixture',
          title: 'Fixture',
          subtitle: 'Fixture',
          state: blockedState,
          originSeed: blockedState.seed,
          originMoves: const [],
        ),
      ]),
    );
    addTearDown(blockedGame.dispose);
    await blockedGame.restore();
    await tester.pumpWidget(hostFor(blockedGame));
    await tester.pump();

    final before = blockedGame.blockedMoveSignal.value;
    await tester.fling(
      find.byType(MergeRelayBoard),
      deltaFor(MergeDirection.up),
      1000,
    );
    await tester.pump();
    expect(blockedGame.blockedMoveSignal.value, before + 1);
    await tester.pump(const Duration(milliseconds: 30));

    final shakeOffset = painterOf(tester).shakeOffsetPx;
    expect(shakeOffset.abs(), greaterThan(0));

    await tester.pump(mergeRelayBlockedShakeDuration);
    blockedGame.dispose();
  });
}
