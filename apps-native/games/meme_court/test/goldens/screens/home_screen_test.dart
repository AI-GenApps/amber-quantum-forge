import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:meme_court/meme_court_app.dart';

import 'physical_golden.dart';

/// Screen golden for task 04: the home screen at rest (submissions open,
/// nothing picked yet), with the bundled Bangers (heading/chip) and
/// Lexend (body) fonts loaded via `test/flutter_test_config.dart`, at a
/// 1080x2400 physical phone size (matching the task's device-evidence
/// convention). Run
/// `flutter test --update-goldens test/goldens/screens/home_screen_test.dart`
/// after any intentional visual change.
void main() {
  testWidgets('home screen renders with the bundled fonts', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const MemeCourtApp());
    await tester.pump();
    // `MemeCourtApp` builds its round synchronously but fires
    // `_restore()` without awaiting it, so any hydration-dependent
    // control could briefly mount in a transitional state. Material's
    // implicit disabled->enabled foreground color transition
    // (`ButtonStyleButton`'s `AnimatedDefaultTextStyle`) then needs real
    // elapsed time to animate away from the disabled grey, and a golden
    // captured at t=0 would risk freezing on it. This settles past that
    // transition (Material's default is 200ms).
    await tester.pump(const Duration(milliseconds: 300));

    await expectLater(
      capturePhysicalGolden(tester, find.byType(MemeCourtHome)),
      matchesGoldenFile('home.png'),
    );
  });
}
