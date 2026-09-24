import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/widgets/ludo_avatar.dart';

/// Golden test for the avatar picker grid (task 07): every one of the
/// >= 8 code-drawn avatars must show up distinctly — a grid of identical
/// circles (e.g. a placeholder that ignores color/motif) fails this
/// golden. Run
/// `flutter test --update-goldens test/goldens/ludo_avatar_golden_test.dart`
/// after any intentional visual change.
void main() {
  testWidgets('avatar picker grid shows all 8+ avatars distinctly', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(420, 240);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData(useMaterial3: true),
        home: Scaffold(
          backgroundColor: Colors.white,
          body: Center(
            child: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final id in ludoAvatarIds) LudoAvatarView(avatarId: id),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(Wrap),
      matchesGoldenFile('avatar_picker_grid.png'),
    );
  });
}
