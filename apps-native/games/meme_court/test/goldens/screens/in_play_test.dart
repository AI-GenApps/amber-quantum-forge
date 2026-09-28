import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:meme_court/meme_court_app.dart';
import 'package:meme_court/meme_court_ui.dart';

import 'physical_golden.dart';

/// In-play screen golden for task 04: the verdict screen after both
/// players submit, the docket freezes, voting opens, and a vote is
/// revealed — exercising the "Verdict" heading (Bangers) and the round
/// pills/body copy (Lexend) together, with the bundled fonts loaded via
/// `test/flutter_test_config.dart`, at a 1080x2400 physical phone size.
/// Run
/// `flutter test --update-goldens test/goldens/screens/in_play_test.dart`
/// after any intentional visual change.
void main() {
  testWidgets('verdict screen renders with the bundled fonts', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const MemeCourtApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    await tester.tap(find.byType(CourtCaptionTile).at(0));
    await tester.pump();
    await tester.ensureVisible(find.byType(CourtCaptionTile).at(4));
    await tester.tap(find.byType(CourtCaptionTile).at(4));
    await tester.pump();
    await tester.ensureVisible(find.text('Freeze the captions'));
    await tester.tap(find.text('Freeze the captions'));
    await tester.pump();
    await tester.tap(find.text('Open the vote'));
    await tester.pump();
    await tester.tap(find.text('Alice’s caption'));
    await tester.pump();
    await tester.tap(find.text('Reveal the verdict'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Verdict'), findsOneWidget);
    // The docket-picking steps above scroll the list to reach "Freeze the
    // captions"; the verdict screen's content is much shorter, but the
    // scroll offset only clamps back into range on the next layout, not
    // necessarily fully to 0. Drag well past the top so the capture below
    // starts from a known, unscrolled position instead of a partially
    // clipped header.
    await tester.drag(find.byType(ListView), const Offset(0, 2000));
    await tester.pump();

    await expectLater(
      capturePhysicalGolden(tester, find.byType(MemeCourtHome)),
      matchesGoldenFile('in_play.png'),
    );
  });
}
