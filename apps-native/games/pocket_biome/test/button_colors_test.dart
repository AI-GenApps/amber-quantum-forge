import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pocket_biome/src/pocket_biome_app.dart';

/// Regression guard (task 03 round 2): a golden briefly showed the
/// primary "Plant Mossling" button label as near-invisible dark text on
/// the dark green button instead of white. The root cause was a test
/// timing gap, not the font wrappers themselves — `PocketBiomeApp`
/// creates its game and fires `restore()` without awaiting it, so the
/// button mounts disabled for one frame before hydration flips it
/// enabled; Material's implicit disabled->enabled foreground color
/// transition (`ButtonStyleButton`'s `AnimatedDefaultTextStyle`) then
/// needs real elapsed time to animate away from the disabled grey, and a
/// golden captured at t=0 froze on that grey even though `onPressed` was
/// already non-null. This asserts the *resolved* label color directly —
/// full opacity and white-ish — so the same regression can't silently
/// reappear in a screen golden nobody diffs pixel-by-pixel by eye.
void main() {
  testWidgets('the primary "Plant Mossling" button label renders white', (
    tester,
  ) async {
    await tester.pumpWidget(const PocketBiomeApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    final color = _resolvedLabelColor('Plant Mossling');
    expect(color, isNotNull, reason: 'no resolved TextStyle.color found');
    expect(
      color!.a,
      greaterThan(0.95),
      reason: 'label is still mid disabled->enabled color transition: $color',
    );
    expect(
      color.computeLuminance(),
      greaterThan(0.85),
      reason:
          'expected a near-white label on the dark primary button, got '
          '$color (luminance ${color.computeLuminance()})',
    );
  });
}

/// Walks down from the `Text` bearing [text] to the `RichText` it builds
/// (`Text.build()`'s fully-merged, effective style — see
/// `test/typography_test.dart`) and returns its resolved color.
Color? _resolvedLabelColor(String text) {
  final element = find.text(text).evaluate().single;
  Color? found;
  void walk(Element e) {
    if (found != null) return;
    if (e.widget is RichText) {
      final span = (e.widget as RichText).text as TextSpan;
      found = span.style?.color;
      return;
    }
    e.visitChildren(walk);
  }

  walk(element);
  return found;
}
