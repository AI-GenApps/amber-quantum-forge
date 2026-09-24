import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/widgets/ludo_3d_button.dart';

Widget _harness(Widget child) => MaterialApp(
  home: Scaffold(
    backgroundColor: Colors.black,
    body: Center(child: child),
  ),
);

void main() {
  testWidgets('Ludo3dButton fires onPressed on tap', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      _harness(
        Ludo3dButton(
          onPressed: () => tapped = true,
          semanticLabel: 'Play',
          child: const Text('Play'),
        ),
      ),
    );

    await tester.tap(find.byType(Ludo3dButton));
    await tester.pumpAndSettle();

    expect(tapped, isTrue);
  });

  testWidgets(
    'Ludo3dButton visibly changes scale/offset between resting and pressed',
    (tester) async {
      await tester.pumpWidget(
        _harness(
          Ludo3dButton(
            onPressed: () {},
            semanticLabel: 'Play',
            child: const Text('Play'),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final restingTransform = tester
          .widget<AnimatedScale>(find.byType(AnimatedScale))
          .scale;
      expect(restingTransform, 1.0);

      final gesture = await tester.startGesture(
        tester.getCenter(find.byType(Ludo3dButton)),
      );
      // Let the press-state AnimatedScale/AnimatedContainer begin animating
      // toward their pressed targets.
      await tester.pump(const Duration(milliseconds: 90));

      final pressedScale = tester
          .widget<AnimatedScale>(find.byType(AnimatedScale))
          .scale;
      expect(pressedScale, lessThan(restingTransform));

      final pressedContainer = tester.widget<AnimatedContainer>(
        find.byType(AnimatedContainer),
      );
      final pressedDecoration = pressedContainer.decoration as BoxDecoration;
      expect(pressedDecoration.boxShadow, isEmpty);

      await gesture.up();
      await tester.pumpAndSettle();

      final releasedScale = tester
          .widget<AnimatedScale>(find.byType(AnimatedScale))
          .scale;
      expect(releasedScale, 1.0);
    },
  );

  testWidgets('golden: Ludo3dButton resting state', (tester) async {
    await tester.pumpWidget(
      _harness(
        Ludo3dButton(
          onPressed: () {},
          semanticLabel: 'Play',
          child: const Text('PLAY'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(Ludo3dButton),
      matchesGoldenFile('../goldens/design_system/ludo_3d_button.png'),
    );
  });
}
