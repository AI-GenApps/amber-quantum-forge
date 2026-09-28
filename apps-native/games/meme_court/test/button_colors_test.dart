import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:meme_court/meme_court_app.dart';
import 'package:meme_court/meme_court_ui.dart';

/// Regression guard (task 03/04 pattern): confirms the filled "Freeze the
/// captions" button label renders white on the dark ink button rather than
/// mid disabled->enabled color transition or a low-contrast fallback.
/// `MemeCourtApp` builds its round synchronously in `initState`, and
/// `_restore()` runs without being awaited, so a control that depends on
/// hydration could momentarily mount disabled; settling one Material
/// transition frame (200ms default) before asserting keeps this guard
/// stable rather than racy.
void main() {
  testWidgets('the "Freeze the captions" button label renders white', (
    tester,
  ) async {
    _setLargeViewport(tester);
    await tester.pumpWidget(const MemeCourtApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byType(CourtCaptionTile).at(0));
    await tester.pump();
    await tester.ensureVisible(find.byType(CourtCaptionTile).at(4));
    await tester.tap(find.byType(CourtCaptionTile).at(4));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));

    final color = _resolvedLabelColor('Freeze the captions');
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
          'expected a near-white label on the dark ink button, got '
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

void _setLargeViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 1200);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}
