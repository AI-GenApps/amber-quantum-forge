import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/screens/home_lobby_screen.dart';
import 'package:ludo/src/state/ludo_profile_settings.dart';
import 'package:ludo/src/theme/ludo_theme.dart';

/// Golden test for the home lobby (task 08): all four entry cards must be
/// visible, with Play with Friends and Online showing the dimmed,
/// "Coming soon"-badged disabled styling. Run
/// `flutter test --update-goldens test/goldens/home_lobby_screen_test.dart`
/// after any intentional visual change.
void main() {
  testWidgets('home lobby shows all four cards with disabled online tiles', (
    tester,
  ) async {
    // A tall aspect ratio close to the reference physical device
    // (1080x2400) rather than a squarer test viewport, so a golden review
    // of this file actually shows whether the lobby's content fills the
    // viewport or leaves a large empty region below the tiles.
    tester.view.physicalSize = const Size(420, 933);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    // Wrapped in `runAsync` (with a short real delay) so the real
    // `assets/art/logo_wide.png` bitmap the header now renders (task 12g)
    // actually finishes decoding before the golden is captured — the
    // fake-async zone `pumpAndSettle` normally runs in never resolves a
    // real `instantiateImageCodec` future on its own.
    await tester.runAsync(() async {
      await tester.pumpWidget(
        MaterialApp(
          theme: buildLudoTheme(),
          home: HomeLobbyScreen(
            resumableMatch: const LudoResumableMatchSummary(
              mode: LudoResumableMatchMode.computer,
              description: 'Classic - 2 players - Turn 5',
            ),
            profile: LudoProfileSettings(name: 'Rae', avatarId: 'red-face'),
          ),
        ),
      );
      await tester.pumpAndSettle();
      // The header's `LudoArtSlot` resolves its bitmap check
      // (`LudoArtManifest.hasBitmap`, a real `rootBundle.load` future) and
      // only then starts decoding `assets/art/logo_wide.png` on the next
      // rebuild — two sequential real-async hops, so settle again after a
      // short real delay to let both finish before capture.
      await Future<void>.delayed(const Duration(milliseconds: 150));
      await tester.pumpAndSettle();
    });

    await expectLater(
      find.byType(HomeLobbyScreen),
      matchesGoldenFile('home_lobby_screen.png'),
    );
  });
}
