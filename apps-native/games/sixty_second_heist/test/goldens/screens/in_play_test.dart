import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:sixty_second_heist/src/heist_ui.dart';

import 'physical_golden.dart';

/// In-play screen golden for task 03: with a planned route, the vault
/// board's canvas-drawn LOOT/EXIT signage (Bungee) and route step numbers
/// (Chakra Petch) must render in the bundled fonts (Flame/canvas text does
/// not inherit the Material theme, so it needs its own explicit font — see
/// `HeistBoardSymbols`). Run
/// `flutter test --update-goldens test/goldens/screens/in_play_test.dart`
/// after any intentional visual change.
void main() {
  testWidgets(
    'in-play screen renders the board signage and route numbers with the bundled fonts',
    (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 3;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(const SixtySecondHeistApp());
      await tester.pump();
      // Settles Material's implicit disabled->enabled button color
      // transition before interacting — see `home_screen_test.dart`.
      await tester.pump(const Duration(milliseconds: 300));

      final planRight = find.byTooltip('Plan right');
      await tester.ensureVisible(planRight);
      await tester.tap(planRight);
      await tester.tap(planRight);
      await tester.pump();

      await expectLater(
        capturePhysicalGolden(tester, find.byType(HeistScreen)),
        matchesGoldenFile('in_play.png'),
      );
    },
  );
}
