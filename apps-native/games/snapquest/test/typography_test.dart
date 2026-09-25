import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:snapquest/snapquest_app.dart';
import 'package:snapquest/snapquest_glyphs.dart';
import 'package:snapquest/snapquest_typography.dart';

/// Task 04: every rendered `Text`/`RichText` in Peeklings (internal id
/// `snapquest`) must resolve to one of the two bundled font families —
/// never a platform default.
///
/// `Text` widgets compile down to an internal `RichText` whose root
/// `TextSpan.style` already carries the fully merged, effective
/// [TextStyle] (ambient [DefaultTextStyle] merged with any explicit
/// override) — see `Text.build()` in the Flutter SDK. Walking every
/// `RichText` in the live tree and inspecting that resolved style is
/// therefore a direct check of what Skia actually paints, rather than a
/// re-implementation of Flutter's own style-merging logic.
const _bundledFamilies = {
  SnapQuestTypography.displayFamily,
  SnapQuestTypography.bodyFamily,
};

/// The three target/desk symbols. Neither bundled font contains these
/// codepoints (verified with `fontTools` against each font's `cmap`
/// table), so they must never appear as literal `Text` — see
/// `snapquest_glyphs.dart`.
const _unsupportedSymbols = {'●', '◇', '✦'};

void main() {
  testWidgets('home screen text resolves to bundled font families', (
    tester,
  ) async {
    _setLargeViewport(tester);
    await tester.pumpWidget(const SnapQuestApp());
    await tester.pumpAndSettle();

    _expectBundledFonts(tester);
    _expectNoRawGlyphText(tester);
  });

  testWidgets('in-play state text resolves to bundled font families', (
    tester,
  ) async {
    _setLargeViewport(tester);
    await tester.pumpWidget(const SnapQuestApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Red pebble'));
    await tester.pump();

    _expectBundledFonts(tester);
    _expectNoRawGlyphText(tester);
  });

  testWidgets(
    'target and desk symbols fall back to drawn SnapGlyph shapes, never '
    'text glyphs',
    (tester) async {
      _setLargeViewport(tester);
      await tester.pumpWidget(const SnapQuestApp());
      await tester.pumpAndSettle();

      // Target card symbol + 3 desk-tile symbols.
      expect(find.byType(SnapGlyph), findsNWidgets(4));
      expect(
        find.byWidgetPredicate(
          (widget) =>
              widget is SnapGlyph &&
              snapGlyphShapeFor(widget.symbol) == SnapGlyphShape.filledCircle,
        ),
        findsWidgets,
      );
      expect(
        find.byWidgetPredicate(
          (widget) =>
              widget is SnapGlyph &&
              snapGlyphShapeFor(widget.symbol) == SnapGlyphShape.hollowDiamond,
        ),
        findsWidgets,
      );
      expect(
        find.byWidgetPredicate(
          (widget) =>
              widget is SnapGlyph &&
              snapGlyphShapeFor(widget.symbol) == SnapGlyphShape.sparkle,
        ),
        findsWidgets,
      );
    },
  );
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

/// Asserts none of the unsupported target/desk symbols are ever painted
/// as literal text — they must go through [SnapGlyph] instead.
void _expectNoRawGlyphText(WidgetTester tester) {
  for (final element in find.byType(RichText).evaluate()) {
    final richText = element.widget as RichText;
    _expectSpanHasNoRawGlyph(richText.text);
  }
}

void _expectSpanHasNoRawGlyph(InlineSpan span) {
  if (span is TextSpan) {
    if (span.text != null) {
      for (final symbol in _unsupportedSymbols) {
        expect(
          span.text!.contains(symbol),
          isFalse,
          reason:
              'Found the unsupported glyph "$symbol" rendered as literal '
              'text; it must be drawn with SnapGlyph instead.',
        );
      }
    }
    for (final child in span.children ?? const <InlineSpan>[]) {
      _expectSpanHasNoRawGlyph(child);
    }
  }
}

void _setLargeViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 1200);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}
