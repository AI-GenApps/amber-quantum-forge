import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import 'package:ludo/src/widgets/dice_zone.dart';
import 'package:ludo/src/widgets/player_corner_card.dart';

Widget _wrap(Widget child) => MaterialApp(
  theme: ThemeData(useMaterial3: true, brightness: Brightness.dark),
  home: Scaffold(body: Center(child: child)),
);

void main() {
  testWidgets(
    'the dice slot only renders when showDice and isActive are both true',
    (tester) async {
      // Active seat, showDice true: the dice slot renders.
      await tester.pumpWidget(
        _wrap(
          PlayerCornerCard(
            name: 'You',
            avatarId: 'red-face',
            color: LudoColor.red,
            isActive: true,
            showDice: true,
            diceEnabled: true,
            onRoll: () {},
          ),
        ),
      );
      expect(find.byType(DiceZone), findsOneWidget);

      // Not this seat's turn: no dice slot, even if a caller mistakenly
      // passes showDice true (this widget gates on isActive too).
      await tester.pumpWidget(
        _wrap(
          PlayerCornerCard(
            name: 'Bot',
            avatarId: 'green-face',
            color: LudoColor.green,
            isActive: false,
            showDice: true,
            diceEnabled: false,
            onRoll: () {},
          ),
        ),
      );
      expect(find.byType(DiceZone), findsNothing);

      // Active seat but caller didn't ask for a dice slot (e.g. a card
      // that isn't the local human's own turn indicator): none rendered.
      await tester.pumpWidget(
        _wrap(
          const PlayerCornerCard(
            name: 'You',
            avatarId: 'red-face',
            color: LudoColor.red,
            isActive: true,
          ),
        ),
      );
      expect(find.byType(DiceZone), findsNothing);
    },
  );

  testWidgets(
    'the dice slot reflects enabled/lastRoll and forwards taps to onRoll',
    (tester) async {
      var rollCount = 0;
      await tester.pumpWidget(
        _wrap(
          PlayerCornerCard(
            name: 'You',
            avatarId: 'red-face',
            color: LudoColor.red,
            isActive: true,
            showDice: true,
            diceEnabled: true,
            lastRoll: 5,
            onRoll: () => rollCount++,
          ),
        ),
      );

      final diceZone = tester.widget<DiceZone>(find.byType(DiceZone));
      expect(diceZone.enabled, isTrue);
      expect(diceZone.lastRoll, 5);
      expect(find.text('5'), findsOneWidget);

      await tester.tap(find.byType(DiceZone));
      expect(rollCount, 1);
    },
  );

  testWidgets(
    'the timer ring renders the correct remaining-time fraction for a '
    'given deadline, only while active',
    (tester) async {
      final now = DateTime(2026, 1, 1, 12, 0, 0);
      const turnDuration = Duration(seconds: 30);

      // 20s of 30s remaining -> ~0.667.
      await tester.pumpWidget(
        _wrap(
          PlayerCornerCard(
            name: 'You',
            avatarId: 'red-face',
            color: LudoColor.red,
            isActive: true,
            deadline: now.add(const Duration(seconds: 20)),
            turnDuration: turnDuration,
            now: now,
          ),
        ),
      );
      var indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      expect(indicator.value, closeTo(20 / 30, 0.001));

      // Not this seat's turn: no timer ring painted at all, even with a
      // deadline supplied.
      await tester.pumpWidget(
        _wrap(
          PlayerCornerCard(
            name: 'You',
            avatarId: 'red-face',
            color: LudoColor.red,
            isActive: false,
            deadline: now.add(const Duration(seconds: 20)),
            turnDuration: turnDuration,
            now: now,
          ),
        ),
      );
      expect(find.byType(CircularProgressIndicator), findsNothing);
    },
  );

  testWidgets('avatar and name render correctly, with long names ellipsized', (
    tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        const SizedBox(
          width: 140,
          child: PlayerCornerCard(
            name: 'A Very Long Player Name That Overflows',
            avatarId: 'blue-spark',
            color: LudoColor.blue,
            isActive: false,
          ),
        ),
      ),
    );

    expect(find.byType(CustomPaint), findsWidgets);
    final nameText = tester.widget<Text>(
      find.text('A Very Long Player Name That Overflows'),
    );
    expect(nameText.maxLines, 1);
    expect(nameText.overflow, TextOverflow.ellipsis);
    // No overflow error was thrown during layout at this constrained
    // width — `tester.takeException()` would otherwise surface a
    // RenderFlex overflow.
    expect(tester.takeException(), isNull);
  });
}
