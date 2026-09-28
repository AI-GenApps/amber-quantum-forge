import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/ui/mr_button.dart';

/// Task 07 acceptance criteria: a widget test covers the pressed and
/// resting geometry of [MrButton] — the whole button sinks a few pixels
/// while held (an `AnimatedContainer` top margin) and springs back on
/// release, rather than relying on Material's flat ripple alone.
void main() {
  Future<void> pumpButton(WidgetTester tester, {bool enabled = true}) {
    return tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          // `Align` (not `Center`) so growing the button's margin on press
          // only pushes its content down — `Center` would also re-center
          // the now-taller box and partly cancel that shift out.
          body: Align(
            alignment: Alignment.topLeft,
            child: MrButton(
              label: 'Go',
              onPressed: enabled ? () {} : null,
              expand: false,
            ),
          ),
        ),
      ),
    );
  }

  testWidgets('sinks down while pressed and springs back on release', (
    tester,
  ) async {
    await pumpButton(tester);
    await tester.pumpAndSettle();

    final restingTop = tester.getTopLeft(find.text('Go')).dy;

    final gesture = await tester.startGesture(
      tester.getCenter(find.byType(MrButton)),
    );
    await tester.pumpAndSettle();
    final pressedTop = tester.getTopLeft(find.text('Go')).dy;

    expect(
      pressedTop,
      greaterThan(restingTop),
      reason: 'the label should sink down while the button is held',
    );
    expect(pressedTop - restingTop, closeTo(4, 0.5));

    await gesture.up();
    await tester.pumpAndSettle();
    final releasedTop = tester.getTopLeft(find.text('Go')).dy;

    expect(
      releasedTop,
      closeTo(restingTop, 0.5),
      reason: 'the label should spring back to its resting position',
    );
  });

  testWidgets('a disabled button (onPressed: null) does not sink on tap down', (
    tester,
  ) async {
    await pumpButton(tester, enabled: false);
    await tester.pumpAndSettle();

    final restingTop = tester.getTopLeft(find.text('Go')).dy;

    final gesture = await tester.startGesture(
      tester.getCenter(find.byType(MrButton)),
    );
    await tester.pumpAndSettle();
    final unchangedTop = tester.getTopLeft(find.text('Go')).dy;

    expect(unchangedTop, closeTo(restingTop, 0.5));

    await gesture.up();
    await tester.pumpAndSettle();
  });

  testWidgets(
    'resting and pressed states report a rounded, non-Material shape',
    (tester) async {
      await pumpButton(tester);
      await tester.pumpAndSettle();

      final container = tester.widget<AnimatedContainer>(
        find.descendant(
          of: find.byType(MrButton),
          matching: find.byType(AnimatedContainer),
        ),
      );
      final decoration = container.decoration! as BoxDecoration;
      expect(decoration.borderRadius, isNotNull);
      expect(decoration.color, isNot(Colors.transparent));
    },
  );
}
