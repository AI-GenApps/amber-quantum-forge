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

    await expectLater(
      find.byType(HomeLobbyScreen),
      matchesGoldenFile('home_lobby_screen.png'),
    );
  });
}
