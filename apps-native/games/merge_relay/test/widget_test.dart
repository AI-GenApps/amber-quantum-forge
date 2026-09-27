import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

void main() {
  testWidgets('fresh launch starts at a compact home', (tester) async {
    // Task 22: the home header now shows the real `logoWide.png` bitmap
    // instead of literal "GLOW RESCUE" text. `AssetImage`'s real decode
    // happens on a background isolate that a plain `pump()` never waits
    // for (see `test/goldens/screens_test.dart`'s `_precacheAssetImage`
    // doc comment for the full explanation), so this precaches it inside
    // `runAsync` first and asserts the bitmap rendered instead of the old
    // fallback text.
    await tester.runAsync(() => _precacheAssetImage('assets/art/logoWide.png'));
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();

    expect(find.text('GLOW RESCUE'), findsNothing);
    expect(find.byType(Image), findsWidgets);
    expect(find.text('Play rescue'), findsOneWidget);
    expect(find.text('Rescue paths'), findsOneWidget);
    expect(find.text('Friend relays'), findsNothing);
    expect(find.text('Swipe the board to move'), findsNothing);
  });

  testWidgets('first play offers a hands-on guide and skip starts swipe play', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();

    // Task 22 fix round 1: the header's wordmark is now sized as the
    // clear brand element (55-65% of its own width, per the orchestrator
    // review), which grows the header's height and pushes the Hero card's
    // "Play rescue" button below the fold of the default 600-tall test
    // surface — the same class of issue `ensureVisible` already fixes
    // below for "Replay tutorial"/"Resume".
    await tester.ensureVisible(find.text('Play rescue'));
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    expect(find.text('Slide to merge matching tiles.'), findsOneWidget);

    // The first-run welcome step (task 12) precedes the interactive board;
    // `pump()` (never `pumpAndSettle`) from here on — the hand-hint's
    // repeating animation controller never settles. The bigger logo above
    // (task 22 fix round 1) also pushes this button below the fold here.
    await tester.ensureVisible(find.text("Let's play"));
    await tester.tap(find.text("Let's play"));
    await tester.pump();
    expect(find.text('First merge'), findsOneWidget);
    expect(find.text('Slide the pair left.'), findsOneWidget);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    expect(find.text('Signal in').first, findsOneWidget);
    expect(find.text('Swipe the board to move'), findsOneWidget);
    expect(find.byTooltip('Move left'), findsNothing);
  });

  testWidgets('a real board swipe follows the domain trace into a result', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();
    await tester.ensureVisible(find.text('Play rescue'));
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    await _clearFirstRescue(tester);

    expect(find.text('Path cleared'), findsOneWidget);
    expect(find.text('Score'), findsOneWidget);
    expect(find.text('Next path'), findsOneWidget);
  });

  testWidgets(
    'settings expose optional controls and replay without changing save',
    (tester) async {
      await tester.pumpWidget(const MergeRelayApp());
      await tester.pump();
      await tester.tap(find.byTooltip('Settings'));
      await tester.pumpAndSettle();
      expect(find.text('Board controls'), findsOneWidget);
      expect(find.text('High contrast'), findsOneWidget);

      await tester.tap(find.text('Board controls'));
      await tester.tap(find.text('High contrast'));
      // The Music toggle (task 10) pushed this action below the fold of
      // the default 600-tall test surface; scroll the sheet's
      // `SingleChildScrollView` until it's actually hit-testable, the way
      // a real finger would need to.
      await tester.ensureVisible(find.text('Replay tutorial'));
      await tester.tap(find.text('Replay tutorial'));
      await tester.pumpAndSettle();
      // Tutorial hasn't been completed even once yet in this run, so the
      // welcome step (task 12) shows again ahead of the interactive board —
      // see `merge_relay_onboarding_test.dart` for the "replay after
      // onboarding is done skips welcome" case.
      expect(find.text('Slide to merge matching tiles.'), findsOneWidget);
      await tester.ensureVisible(find.text("Let's play"));
      await tester.tap(find.text("Let's play"));
      await tester.pump();
      expect(find.text('First merge'), findsOneWidget);
    },
  );

  testWidgets('large text keeps the board route available', (tester) async {
    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(1.5)),
        child: const MergeRelayApp(),
      ),
    );
    await tester.pump();
    await tester.ensureVisible(find.text('Play rescue'));
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect(find.byType(MergeRelayBoard), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('pause actions remain usable on a compact large-text board', (
    tester,
  ) async {
    try {
      await tester.binding.setSurfaceSize(const Size(320, 540));
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(textScaler: TextScaler.linear(2)),
          child: const MergeRelayApp(),
        ),
      );
      await tester.pump();
      await tester.ensureVisible(find.text('Play rescue'));
      await tester.tap(find.text('Play rescue'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Skip'));
      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Pause'));
      await tester.pumpAndSettle();

      expect(find.text('Board paused'), findsOneWidget);
      expect(find.text('Resume'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.ensureVisible(find.text('Resume'));
      await tester.tap(find.text('Resume'));
      await tester.pumpAndSettle();
      expect(find.byTooltip('Pause'), findsOneWidget);
    } finally {
      await tester.binding.setSurfaceSize(null);
    }
  });

  testWidgets('restore keeps a completed result available from Continue', (
    tester,
  ) async {
    final store = MemorySaveStore();
    await tester.pumpWidget(MergeRelayApp(saveStore: store));
    await tester.pump();
    await tester.ensureVisible(find.text('Play rescue'));
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    await _clearFirstRescue(tester);

    await tester.pumpWidget(MergeRelayApp(key: UniqueKey(), saveStore: store));
    await tester.pumpAndSettle();
    expect(find.text('See result'), findsOneWidget);
    await tester.ensureVisible(find.text('See result'));
    await tester.tap(find.text('See result'));
    await tester.pumpAndSettle();
    expect(find.text('Path cleared'), findsOneWidget);
  });
}

/// Solves the fallback catalog's first rescue board (generated at runtime by
/// `MergeRescueGenerator`, so its exact tiles/solution aren't hardcoded here)
/// and plays that winning line as real board swipes — the same pattern
/// `merge_relay_onboarding_test.dart`'s `_solveFirstRescue` uses, so this
/// stays correct however the generator's own move choices land.
Future<void> _clearFirstRescue(WidgetTester tester) async {
  final board = MergeRelayContentCatalog.fallback.firstRescue;
  const solver = MergeRescueSolver();
  final result = solver.solve(
    state: board.state,
    targetScore: board.targetScore,
    moveBudget: board.moveBudget,
  );
  for (final direction in result.winningLine!) {
    await tester.fling(find.byType(MergeRelayBoard), _delta(direction), 1000);
    await tester.pumpAndSettle();
  }
}

Offset _delta(MergeDirection direction) => switch (direction) {
  MergeDirection.up => const Offset(0, -180),
  MergeDirection.down => const Offset(0, 180),
  MergeDirection.left => const Offset(-180, 0),
  MergeDirection.right => const Offset(180, 0),
};

/// See `test/goldens/screens_test.dart`'s identical helper for why this is
/// needed: resolves [assetPath] against the real default asset bundle and
/// waits for its real decode `Future` before returning, which populates
/// the shared [ImageCache] entry a later `Image(image: AssetImage(...))`
/// build reads synchronously. Must run inside [WidgetTester.runAsync].
Future<void> _precacheAssetImage(String assetPath) {
  final completer = Completer<void>();
  final stream = AssetImage(assetPath).resolve(ImageConfiguration.empty);
  late ImageStreamListener listener;
  listener = ImageStreamListener(
    (image, synchronousCall) {
      stream.removeListener(listener);
      if (!completer.isCompleted) completer.complete();
    },
    onError: (error, stackTrace) {
      stream.removeListener(listener);
      if (!completer.isCompleted) completer.complete();
    },
  );
  stream.addListener(listener);
  return completer.future;
}
