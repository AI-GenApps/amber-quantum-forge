import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/widgets/ludo_badge.dart';

Widget _harness(Widget child) => MaterialApp(
  home: Scaffold(
    backgroundColor: Colors.black,
    body: Center(child: child),
  ),
);

void main() {
  testWidgets('LudoBadge renders a circular shape for a short label', (
    tester,
  ) async {
    await tester.pumpWidget(_harness(const LudoBadge(label: '3')));

    expect(find.text('3'), findsOneWidget);
    final container = tester.widget<Container>(find.byType(Container));
    final decoration = container.decoration as BoxDecoration;
    expect(decoration.shape, BoxShape.circle);
  });

  testWidgets('LudoBadge renders a pill shape for a longer label', (
    tester,
  ) async {
    await tester.pumpWidget(_harness(const LudoBadge(label: '1st')));

    final container = tester.widget<Container>(find.byType(Container));
    final decoration = container.decoration as BoxDecoration;
    expect(decoration.shape, BoxShape.rectangle);
    expect(decoration.borderRadius, isNotNull);
  });

  testWidgets('golden: LudoBadge circle and pill', (tester) async {
    await tester.pumpWidget(
      _harness(
        const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            LudoBadge(label: '3'),
            SizedBox(width: 12),
            LudoBadge(label: '1st'),
          ],
        ),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(Row),
      matchesGoldenFile('../goldens/design_system/ludo_badge.png'),
    );
  });
}
