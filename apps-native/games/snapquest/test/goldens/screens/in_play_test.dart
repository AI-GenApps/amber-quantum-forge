import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:snapquest/snapquest_app.dart';

import 'physical_golden.dart';

/// In-play screen golden for task 04: after completing the first desk
/// hunt (Emberling joins the album), showing the album panel, the second
/// target card, and the bundled Baloo 2/Andika fonts together, loaded via
/// `test/flutter_test_config.dart`, at a 1080x2400 physical phone size.
/// Run
/// `flutter test --update-goldens test/goldens/screens/in_play_test.dart`
/// after any intentional visual change.
void main() {
  testWidgets('in-play screen renders with the bundled fonts', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const SnapQuestApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.text('Red pebble'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Emberling joined your album!'), findsOneWidget);

    await expectLater(
      capturePhysicalGolden(tester, find.byType(SnapQuestHome)),
      matchesGoldenFile('in_play.png'),
    );
  });
}
