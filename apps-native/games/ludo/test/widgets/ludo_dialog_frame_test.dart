import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/theme/ludo_theme.dart';
import 'package:ludo/src/widgets/ludo_dialog_frame.dart';

Widget _harness(Widget child) => MaterialApp(
  theme: buildLudoTheme(),
  home: Scaffold(backgroundColor: Colors.black, body: child),
);

void main() {
  testWidgets('LudoDialogFrame renders a title and its content', (
    tester,
  ) async {
    await tester.pumpWidget(
      _harness(
        const LudoDialogFrame(
          title: 'Quit Match?',
          child: Text('Your progress will be lost.'),
        ),
      ),
    );

    // The outlined title renders two stacked Text layers (stroke + fill —
    // see LudoTextStyles' doc comment), so it matches the finder twice.
    expect(find.text('Quit Match?'), findsNWidgets(2));
    expect(find.text('Your progress will be lost.'), findsOneWidget);
  });

  testWidgets('golden: LudoDialogFrame', (tester) async {
    await tester.pumpWidget(
      _harness(
        const LudoDialogFrame(
          title: 'Pause',
          child: Text('Resume, restart, or quit.'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(LudoDialogFrame),
      matchesGoldenFile('../goldens/design_system/ludo_dialog_frame.png'),
    );
  });
}
