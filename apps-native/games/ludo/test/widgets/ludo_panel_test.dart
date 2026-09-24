import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/theme/ludo_text_styles.dart';
import 'package:ludo/src/widgets/ludo_panel.dart';

Widget _harness(Widget child) => MaterialApp(
  home: Scaffold(
    backgroundColor: Colors.black,
    body: Center(child: child),
  ),
);

void main() {
  testWidgets('LudoPanel renders its child inside a gold-framed box', (
    tester,
  ) async {
    await tester.pumpWidget(
      _harness(
        const LudoPanel(
          child: SizedBox(width: 120, height: 80, child: Text('Panel')),
        ),
      ),
    );

    expect(find.text('Panel'), findsOneWidget);
    final decoratedBox = tester.widget<DecoratedBox>(
      find.byType(DecoratedBox).first,
    );
    final decoration = decoratedBox.decoration as BoxDecoration;
    expect(decoration.border, isNotNull);
    expect(decoration.boxShadow, isNotEmpty);
  });

  testWidgets('golden: LudoPanel with an outlined title', (tester) async {
    await tester.pumpWidget(
      _harness(
        SizedBox(
          width: 220,
          height: 140,
          child: LudoPanel(
            child: Center(
              child: LudoOutlinedTitle(
                'LUDO',
                style: LudoTextStyles.displayMedium,
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(LudoPanel),
      matchesGoldenFile('../goldens/design_system/ludo_panel.png'),
    );
  });
}
