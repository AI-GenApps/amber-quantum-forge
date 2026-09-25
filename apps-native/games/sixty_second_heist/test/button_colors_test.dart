import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:sixty_second_heist/src/heist_ui.dart';

/// Regression guard (task 03 round 2): a golden briefly showed the
/// primary "Run plan" button label as dark text on the red button
/// instead of white, and the directional/"Clear plan" buttons as faint
/// grey instead of dark navy. The root cause was a test timing gap, not
/// the font wrappers themselves — `SixtySecondHeistApp` creates its game
/// and fires `restore()` without awaiting it, so every control mounts
/// disabled for one frame before hydration flips it enabled; Material's
/// implicit disabled->enabled foreground color transition
/// (`ButtonStyleButton`'s `AnimatedDefaultTextStyle`) then needs real
/// elapsed time to animate away from the disabled grey, and a golden
/// captured at t=0 froze on that grey even though `onPressed` was already
/// non-null. This asserts the *resolved* label colors directly — full
/// opacity, white on the red primary, dark navy on the outlined
/// directional buttons — so the same regression can't silently reappear
/// in a screen golden nobody diffs pixel-by-pixel by eye.
void main() {
  testWidgets(
    'the primary "Run plan" button label renders white and directional '
    'buttons render dark navy',
    (tester) async {
      await tester.pumpWidget(const SixtySecondHeistApp());
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      final runPlanColor = _resolvedLabelColor('Run plan');
      expect(
        runPlanColor,
        isNotNull,
        reason: 'no resolved TextStyle.color found for "Run plan"',
      );
      expect(
        runPlanColor!.a,
        greaterThan(0.95),
        reason:
            '"Run plan" label is still mid disabled->enabled color '
            'transition: $runPlanColor',
      );
      expect(
        runPlanColor.computeLuminance(),
        greaterThan(0.85),
        reason:
            'expected a near-white "Run plan" label on the red primary '
            'button, got $runPlanColor '
            '(luminance ${runPlanColor.computeLuminance()})',
      );

      final upColor = _resolvedLabelColor('Up');
      expect(
        upColor,
        isNotNull,
        reason: 'no resolved TextStyle.color found for "Up"',
      );
      expect(
        upColor!.a,
        greaterThan(0.95),
        reason:
            '"Up" label is still mid disabled->enabled color '
            'transition: $upColor',
      );
      expect(
        upColor.computeLuminance(),
        lessThan(0.3),
        reason:
            'expected a dark navy "Up" label on the outlined button, got '
            '$upColor (luminance ${upColor.computeLuminance()})',
      );
    },
  );
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
