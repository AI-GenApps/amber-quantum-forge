import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/assets/merge_relay_art_manifest.dart';
import 'package:merge_relay/src/assets/mr_bitmap_art_cache.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_rules/merge_rules.dart';

import '../screens/physical_golden.dart';

/// Task 24 fix round 1 (orchestrator review): the store screenshots must
/// show the game at its best — mid-game boards with many tiles across
/// several tiers — not the sparse states the *functional* goldens under
/// `test/goldens/screens/` happen to be in (those exist to prove specific
/// UI states, e.g. a fresh tutorial hint, not to look good in a listing).
///
/// This harness is the same one `test/goldens/screens_test.dart` uses
/// (physical 1080x2400 capture via `capturePhysicalGolden`, the same asset
/// precaching so bundled art/fonts are already decoded on the first
/// frame), but every board here is a **real, rules-legal board fed through
/// the real game object**, not a hand-painted image:
///
/// - The board content is a [MergeBoard] — the exact class the shipped
///   rules engine uses to reject illegal cells (anything but 0 or a power
///   of two) — so "legal under the rules" is enforced by the same code the
///   app ships, not asserted by hand.
/// - It's injected through [MergeRelayGame.state], the same
///   `ValueNotifier` every real swipe and every real save-restore writes
///   to, after first calling the real `startRescue`/`startDaily`/
///   `startEndless` entry points so the mode, goal/target, and move budget
///   the HUD reads are the real ones for that mode (Rescue's target score
///   comes from a real chapter-6 board; Daily's fixed 3-move chain and
///   Endless's move-budget-free HUD are the real mode rules) —
///   `MergeGameState.copyWith` only replaces the board/score/moveCount.
/// - The merge-moment capture calls the real `MergeRelayGame.move(...)`
///   (the exact method a swipe gesture calls) and samples mid-flight,
///   the same way `screens_test.dart`'s `tutorial_hint.png` samples a
///   repeating animation mid-swing — task 09's real squash-and-pop curve
///   (`mergeRelayMoveFrameAt`, peak at ~180ms into the 250ms move
///   animation) drives what's on screen, not a drawn approximation.
void main() {
  testWidgets('rescue hero board: mid-game, many tiles, 7 tiers', (
    tester,
  ) async {
    final catalog = await _loadContent(tester);
    final key = await _bootApp(tester, content: catalog);
    await _skipToRescuePlay(tester);
    final game = _gameOf(tester);
    game.startRescue(index: _indexOf(catalog, 'rescue-observatory-10'));
    game.state.value = game.state.value.copyWith(
      board: MergeBoard(const [
        128, 64, 8, 0, //
        32, 16, 4, 2, //
        2, 8, 0, 4, //
        0, 2, 0, 0, //
      ]),
      score: 96,
      moveCount: 12,
    );
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'store_hero_rescue.png');
  });

  testWidgets('rescue merge moment: real move, mid-pop', (tester) async {
    final catalog = await _loadContent(tester);
    final key = await _bootApp(tester, content: catalog);
    await _skipToRescuePlay(tester);
    final game = _gameOf(tester);
    game.startRescue(index: _indexOf(catalog, 'rescue-observatory-10'));
    game.state.value = game.state.value.copyWith(
      // Same kind of board as the hero shot, with one adjacent pair (the
      // two 8s) that a left swipe merges cleanly without disturbing the
      // other rows (each already packed left with no equal neighbours).
      board: MergeBoard(const [
        128, 64, 8, 0, //
        32, 16, 4, 2, //
        8, 8, 0, 4, //
        0, 2, 0, 0, //
      ]),
      score: 88,
      moveCount: 11,
    );
    game.move(MergeDirection.left);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 180));
    await _capture(tester, key, 'store_merge_moment.png');
  });

  testWidgets('daily play: populated board, chain goal visible', (
    tester,
  ) async {
    final key = await _bootApp(tester);
    await _skipToRescuePlay(tester);
    await tester.tap(find.byTooltip('Home'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Daily'));
    await tester.pumpAndSettle();
    final game = _gameOf(tester);
    game.state.value = game.state.value.copyWith(
      board: MergeBoard(const [
        64, 32, 8, 2, //
        16, 4, 2, 0, //
        4, 8, 0, 2, //
        0, 0, 2, 0, //
      ]),
      score: 132,
      moveCount: 2,
    );
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'store_daily_play.png');
  });

  testWidgets('endless best: high tile, big score', (tester) async {
    final key = await _bootApp(tester);
    await _skipToRescuePlay(tester);
    await tester.tap(find.byTooltip('Home'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Endless'));
    await tester.tap(find.text('Endless'));
    await tester.pumpAndSettle();
    final game = _gameOf(tester);
    game.state.value = game.state.value.copyWith(
      board: MergeBoard(const [
        512, 256, 32, 8, //
        128, 64, 16, 4, //
        4, 8, 2, 0, //
        2, 0, 0, 0, //
      ]),
      score: 8420,
      moveCount: 340,
    );
    game.bestEndlessScore.value = 8420;
    await tester.pump(const Duration(milliseconds: 300));
    await _capture(tester, key, 'store_endless_best.png');
  });
}

/// Boots a fresh [MergeRelayApp] at the physical phone size (1080x2400,
/// DPR 3) inside a keyed [RepaintBoundary], with the same asset
/// precaching `screens_test.dart` uses so the first captured frame already
/// has every bundled bitmap decoded. See that file's `_bootApp` doc
/// comment for why `runAsync` is required here.
Future<Key> _bootApp(
  WidgetTester tester, {
  MergeRelayContentCatalog? content,
}) async {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  final resolvedContent = content ?? await _loadContent(tester);
  final key = UniqueKey();
  await tester.runAsync(() async {
    await _precacheAssetImage('assets/art/logoWide.png');
    await _precacheAssetImage('assets/art/logoStacked.png');
    await _precacheAssetImage('assets/art/homeScene.png');
    for (final chapter in MergeRelayArtManifest.chapterNumbers) {
      await _precacheAssetImage('assets/art/chapterCard_$chapter.png');
    }
    await MrBitmapArtCache.instance.ensureLoaded();
    await tester.pumpWidget(
      RepaintBoundary(
        key: key,
        child: MergeRelayApp(content: resolvedContent),
      ),
    );
    await tester.pump();
  });
  return key;
}

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

Future<MergeRelayContentCatalog> _loadContent(WidgetTester tester) async {
  return (await tester.runAsync(MergeRelayContentCatalog.load))!;
}

/// From a freshly booted home screen: starts a rescue run, then skips the
/// one-time tutorial — landing on the rescue play screen with
/// `tutorialComplete == true` (same flow `screens_test.dart` uses).
Future<void> _skipToRescuePlay(WidgetTester tester) async {
  await tester.tap(find.text('Play rescue'));
  await tester.pumpAndSettle();
  await tester.tap(find.text('Skip'));
  await tester.pumpAndSettle();
}

/// The live [MergeRelayGame] instance backing the currently mounted Play
/// screen: [MergeRelayBoard] is a public widget with a public `game`
/// field, so this reaches the exact same object every real swipe and the
/// real save-restore path mutate — never a copy.
MergeRelayGame _gameOf(WidgetTester tester) =>
    tester.widget<MergeRelayBoard>(find.byType(MergeRelayBoard)).game;

int _indexOf(MergeRelayContentCatalog catalog, String rescueId) {
  final index = catalog.rescues.indexWhere((rescue) => rescue.id == rescueId);
  assert(index >= 0, 'Unknown rescue id: $rescueId');
  return index;
}

/// `matchesGoldenFile` resolves relative to this test file's own
/// directory (`test/goldens/store/`), so a bare `goldenName` lands
/// directly there — unlike `screens_test.dart`, which lives one directory
/// up and prefixes `screens/`.
Future<void> _capture(WidgetTester tester, Key key, String goldenName) async {
  await expectLater(
    capturePhysicalGolden(tester, find.byKey(key)),
    matchesGoldenFile(goldenName),
  );
}
