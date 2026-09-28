import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:meme_court/meme_court_app.dart';
import 'package:meme_court/meme_court_typography.dart';
import 'package:meme_court/meme_court_ui.dart';

/// Task 04: every rendered `Text`/`RichText` in Meme Court must resolve to
/// one of the two bundled font families — never a platform default.
///
/// `Text` widgets compile down to an internal `RichText` whose root
/// `TextSpan.style` already carries the fully merged, effective
/// [TextStyle] (ambient [DefaultTextStyle] merged with any explicit
/// override) — see `Text.build()` in the Flutter SDK. Walking every
/// `RichText` in the live tree and inspecting that resolved style is
/// therefore a direct check of what Skia actually paints, rather than a
/// re-implementation of Flutter's own style-merging logic.
const _bundledFamilies = {
  MemeCourtTypography.displayFamily,
  MemeCourtTypography.bodyFamily,
};

void main() {
  testWidgets('home screen text resolves to bundled font families', (
    tester,
  ) async {
    _setLargeViewport(tester);
    await tester.pumpWidget(const MemeCourtApp());
    await tester.pumpAndSettle();

    _expectBundledFonts(tester);
  });

  testWidgets('in-play (verdict) state text resolves to bundled font '
      'families', (tester) async {
    _setLargeViewport(tester);
    await tester.pumpWidget(const MemeCourtApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byType(CourtCaptionTile).at(0));
    await tester.pump();
    await tester.ensureVisible(find.byType(CourtCaptionTile).at(4));
    await tester.tap(find.byType(CourtCaptionTile).at(4));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Freeze the captions'));
    await tester.tap(find.text('Freeze the captions'));
    await tester.pump();
    await tester.tap(find.text('Open the vote'));
    await tester.pump();
    await tester.tap(find.text('Alice’s caption'));
    await tester.pump();
    await tester.tap(find.text('Reveal the verdict'));
    await tester.pump();

    expect(find.text('Verdict'), findsOneWidget);
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

void _setLargeViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 1200);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}
