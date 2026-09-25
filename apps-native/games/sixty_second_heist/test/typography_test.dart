import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:sixty_second_heist/src/heist_typography.dart';
import 'package:sixty_second_heist/src/heist_ui.dart';

/// Task 03: every rendered `Text`/`RichText` in Sixty-Second Heist must
/// resolve to one of the two bundled font families — never a platform
/// default.
///
/// `Text` widgets compile down to an internal `RichText` whose root
/// `TextSpan.style` already carries the fully merged, effective
/// [TextStyle] (ambient [DefaultTextStyle] merged with any explicit
/// override) — see `Text.build()` in the Flutter SDK. Walking every
/// `RichText` in the live tree and inspecting that resolved style is
/// therefore a direct check of what Skia actually paints, rather than a
/// re-implementation of Flutter's own style-merging logic.
const _bundledFamilies = {
  HeistTypography.displayFamily,
  HeistTypography.bodyFamily,
};

void main() {
  testWidgets('home screen text resolves to bundled font families', (
    tester,
  ) async {
    await tester.pumpWidget(const SixtySecondHeistApp());
    await tester.pump();

    _expectBundledFonts(tester);
  });

  testWidgets('in-play state text resolves to bundled font families', (
    tester,
  ) async {
    await tester.pumpWidget(const SixtySecondHeistApp());
    await tester.pump();

    final planRight = find.byTooltip('Plan right');
    await tester.ensureVisible(planRight);
    await tester.tap(planRight);
    await tester.tap(planRight);
    final runPlan = find.text('Run plan');
    await tester.ensureVisible(runPlan);
    await tester.tap(runPlan);
    await tester.pump();

    _expectBundledFonts(tester);
  });
}

void _expectBundledFonts(WidgetTester tester) {
  final richTextElements = find.byType(RichText).evaluate();
  expect(richTextElements, isNotEmpty);
  for (final element in richTextElements) {
    final richText = element.widget as RichText;
    _expectSpanFonts(richText.text, inheritedFamily: null);
  }
}

void _expectSpanFonts(InlineSpan span, {required String? inheritedFamily}) {
  if (span is TextSpan) {
    // `Icon` paints its glyph through its own `RichText`/`TextSpan` with
    // `inherit: false` and the relevant icon font (e.g. `MaterialIcons`) —
    // that is expected and out of scope for this app-copy check.
    if (span.style?.inherit == false) return;
    final family = span.style?.fontFamily ?? inheritedFamily;
    if (span.text != null && span.text!.isNotEmpty) {
      expect(
        family,
        isNotNull,
        reason: 'Text "${span.text}" has no resolved font family.',
      );
      expect(
        _bundledFamilies.contains(family),
        isTrue,
        reason:
            'Text "${span.text}" resolved to unexpected font family '
            '"$family" (expected one of $_bundledFamilies).',
      );
    }
    for (final child in span.children ?? const <InlineSpan>[]) {
      _expectSpanFonts(child, inheritedFamily: family);
    }
  }
}
