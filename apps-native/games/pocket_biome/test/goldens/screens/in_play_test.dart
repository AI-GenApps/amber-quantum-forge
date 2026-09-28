import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart';

import 'package:pocket_biome/src/pocket_biome_app.dart';
import 'package:pocket_biome/src/pocket_biome_typography.dart';
import 'package:pocket_biome/src/pocket_biome_ui.dart';

import 'physical_golden.dart';

/// In-play screen golden for task 03: after planting a Mossling, the
/// terrarium's canvas-drawn pot label ("Moss") must render in the bundled
/// Quicksand font (Flame/canvas text does not inherit the Material theme,
/// so it needs its own explicit font — see `PocketBiomeArt`).
///
/// The game is built directly (rather than through `PocketBiomeApp`) with
/// a [FixedClock], so the pot's growth-progress arc — which depends on
/// elapsed wall-clock time since planting — renders identically on every
/// run instead of drifting by a pixel or two with `SystemClock`. Run
/// `flutter test --update-goldens test/goldens/screens/in_play_test.dart`
/// after any intentional visual change.
void main() {
  testWidgets(
    'in-play screen renders the planted pot label with the bundled font',
    (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 3;
      addTearDown(tester.view.reset);

      final clock = FixedClock(DateTime.utc(2026));
      final game = PocketBiomeGame(
        context: runtimeAppContext(identity: pocketBiomeIdentity),
        saveStore: MemorySaveStore(),
        clock: clock,
      );
      await game.restore();

      await tester.pumpWidget(
        MaterialApp(
          theme: PocketBiomeTypography.theme(seedColor: Colors.teal),
          home: PocketBiomeScreen(game: game),
        ),
      );
      await tester.pump();

      // Plant inside the fake-async test zone (not before `pumpWidget`) so
      // the feedback message's `Timer` is tracked by the test binding, then
      // flush it — matching the pattern in `test/widget_test.dart` — so no
      // pending timer trips the "disposed with pending timer" invariant.
      game.plantMossling();
      await tester.pump();
      // Also settles Material's implicit disabled->enabled button color
      // transition (see `home_screen_test.dart`), on top of draining the
      // feedback message's timer.
      await tester.pump(const Duration(milliseconds: 2300));

      await expectLater(
        capturePhysicalGolden(tester, find.byType(PocketBiomeScreen)),
        matchesGoldenFile('in_play.png'),
      );
    },
  );
}
