import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_board_widget.dart';
import 'package:merge_relay/src/ui/mr_text_styles.dart';

/// Task 07: every rendered `Text`/`RichText` in Merge Relay must resolve to
/// one of the two bundled font families — never a platform default.
///
/// `Text` widgets compile down to an internal `RichText` whose root
/// `TextSpan.style` already carries the fully merged, effective
/// [TextStyle] (ambient [DefaultTextStyle] merged with any explicit
/// override) — see `Text.build()` in the Flutter SDK. Walking every
/// `RichText` in the live tree and inspecting that resolved style is
/// therefore a direct check of what Skia actually paints, rather than a
/// re-implementation of Flutter's own style-merging logic. Reuses the
/// pattern established in `pocket_biome/test/typography_test.dart`
/// (task 03).
const _bundledFamilies = {MrTextStyles.displayFamily, MrTextStyles.bodyFamily};

void main() {
  testWidgets('home screen text resolves to bundled font families', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    _expectBundledFonts(tester);
  });

  testWidgets('tutorial screen text resolves to bundled font families', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();

    _expectBundledFonts(tester);
  });

  testWidgets('play (rescue) screen text resolves to bundled font families', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    _expectBundledFonts(tester);
  });

  testWidgets('result screen text resolves to bundled font families', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();
    await tester.tap(find.text('Play rescue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();
    for (final delta in const [
      Offset(0, -180),
      Offset(-180, 0),
      Offset(-180, 0),
    ]) {
      await tester.fling(find.byType(MergeRelayBoard), delta, 1000);
      await tester.pumpAndSettle();
    }

    _expectBundledFonts(tester);
  });

  testWidgets('settings sheet text resolves to bundled font families', (
    tester,
  ) async {
    await tester.pumpWidget(const MergeRelayApp());
    await tester.pump();
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();

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
