import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/widgets/ribbon_banner.dart';

Widget _harness(Widget child) => MaterialApp(
  home: Scaffold(
    backgroundColor: Colors.black,
    body: Center(child: child),
  ),
);

void main() {
  testWidgets('RibbonBanner renders its label text', (tester) async {
    await tester.pumpWidget(_harness(const RibbonBanner(label: '1st Place')));

    expect(find.text('1st Place'), findsOneWidget);
  });

  testWidgets('golden: RibbonBanner', (tester) async {
    await tester.pumpWidget(_harness(const RibbonBanner(label: 'NEW!')));
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(RibbonBanner),
      matchesGoldenFile('../goldens/design_system/ribbon_banner.png'),
    );
  });
}
