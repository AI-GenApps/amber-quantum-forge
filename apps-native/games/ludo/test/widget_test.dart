import 'package:flutter_test/flutter_test.dart';

import 'package:ludo/src/app.dart';

void main() {
  testWidgets('boots offline and renders the placeholder home screen', (
    tester,
  ) async {
    await tester.pumpWidget(const LudoApp());
    await tester.pump();

    // The app boots straight to the placeholder home screen with zero
    // Firebase/network dependency anywhere in the widget tree.
    expect(find.byType(LudoPlaceholderHomeScreen), findsOneWidget);
    expect(find.text('Ludo'), findsOneWidget);
    expect(find.text('Roll, race, and capture'), findsOneWidget);
  });
}
