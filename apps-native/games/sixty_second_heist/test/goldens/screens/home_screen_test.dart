import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:sixty_second_heist/src/heist_ui.dart';

import 'physical_golden.dart';

/// Screen golden for task 03: the home screen at rest, with the bundled
/// Bungee (heading/board labels) and Chakra Petch (body) fonts loaded via
/// `test/flutter_test_config.dart`, at a 1080x2400 physical phone size
/// (matching the task's device-evidence convention). Run
/// `flutter test --update-goldens test/goldens/screens/home_screen_test.dart`
/// after any intentional visual change.
void main() {
  testWidgets('home screen renders with the bundled fonts', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const SixtySecondHeistApp());
    await tester.pump();
    // `SixtySecondHeistApp` creates its game and fires `restore()` without
    // awaiting it, so every control briefly mounts disabled before
    // hydration flips it enabled a microtask later. Material's implicit
    // disabled->enabled foreground color transition (`ButtonStyleButton`'s
    // `AnimatedDefaultTextStyle`) then needs real elapsed time to animate
    // from the disabled grey to the enabled color — capturing at t=0 froze
    // it at the disabled grey even though `onPressed` was already
    // non-null. This settles past that transition (Material's default is
    // 200ms).
    await tester.pump(const Duration(milliseconds: 300));

    await expectLater(
      capturePhysicalGolden(tester, find.byType(HeistScreen)),
      matchesGoldenFile('home.png'),
    );
  });
}
