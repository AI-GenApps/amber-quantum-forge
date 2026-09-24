import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/screens/home_lobby_screen.dart';

/// Golden test for the home lobby (task 08): all four entry cards must be
/// visible, with Play with Friends and Online showing the dimmed,
/// "Coming soon"-badged disabled styling. Run
/// `flutter test --update-goldens test/goldens/home_lobby_screen_test.dart`
/// after any intentional visual change.
void main() {
  testWidgets('home lobby shows all four cards with disabled online tiles', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(420, 720);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
        home: const HomeLobbyScreen(
          resumableMatch: LudoResumableMatchSummary(
            mode: LudoResumableMatchMode.computer,
            description: 'Classic - 2 players - Turn 5',
          ),
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
