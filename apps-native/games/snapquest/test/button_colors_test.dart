import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:snapquest/snapquest_app.dart';

/// Regression guard (task 03/04 pattern): confirms the "Try the camera"
/// outlined button label renders in the dark "night" ink rather than mid
/// disabled->enabled color transition or a washed-out fallback.
/// `SnapQuestApp` fires `_restore()` without awaiting it in `initState`,
/// so a hydration-dependent control could momentarily mount disabled;
/// settling one Material transition frame (200ms default) before
/// asserting keeps this guard stable rather than racy.
void main() {
  testWidgets('the "Try the camera" button label renders dark ink', (
    tester,
  ) async {
    _setLargeViewport(tester);
    await tester.pumpWidget(const SnapQuestApp());
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 300));

    final color = _resolvedLabelColor('Try the camera');
    expect(color, isNotNull, reason: 'no resolved TextStyle.color found');
    expect(
      color!.a,
      greaterThan(0.95),
      reason: 'label is still mid disabled->enabled color transition: $color',
    );
    expect(
      color.computeLuminance(),
      lessThan(0.3),
      reason:
          'expected a dark "night" label on the outlined button, got '
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
