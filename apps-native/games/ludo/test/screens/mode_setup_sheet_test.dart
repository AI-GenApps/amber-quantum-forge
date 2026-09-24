import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';

import 'package:ludo/src/screens/mode_setup_sheet.dart';

Widget _wrap(Widget child) => MaterialApp(
  theme: ThemeData(useMaterial3: true),
  home: Scaffold(body: Builder(builder: (context) => child)),
);

void main() {
  testWidgets('2 vs 4 player toggling changes available color slots', (
    tester,
  ) async {
    await tester.pumpWidget(_wrap(const ModeSetupSheet(isComputerMatch: true)));
    await tester.pumpAndSettle();

    // Defaults to 4 players: 4 seat rows (one per LudoColor).
    expect(find.text('Red · You'), findsOneWidget);
    expect(find.text('Green · Bot'), findsOneWidget);
    expect(find.text('Yellow · Bot'), findsOneWidget);
    expect(find.text('Blue · Bot'), findsOneWidget);

    await tester.tap(find.text('2'));
    await tester.pumpAndSettle();

    expect(find.text('Red · You'), findsOneWidget);
    expect(find.text('Green · Bot'), findsOneWidget);
    expect(find.text('Yellow · Bot'), findsNothing);
    expect(find.text('Blue · Bot'), findsNothing);
  });

  testWidgets(
    'bot-difficulty picker shows one dropdown per non-human seat when '
    'launched from Computer',
    (tester) async {
      await tester.pumpWidget(
        _wrap(const ModeSetupSheet(isComputerMatch: true)),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('2'));
      await tester.pumpAndSettle();

      // Seat 0 (You) has no difficulty dropdown; seat 1 (Bot) has one.
      expect(find.byType(DropdownButton<String>), findsOneWidget);
    },
  );

  testWidgets(
    'no bot-difficulty picker shows at all when launched from Pass N Play',
    (tester) async {
      await tester.pumpWidget(
        _wrap(const ModeSetupSheet(isComputerMatch: false)),
      );
      await tester.pumpAndSettle();

      // Pass N Play: every seat is human, no difficulty picker at all.
      expect(find.byType(DropdownButton<String>), findsNothing);
      expect(find.text('Red · You'), findsOneWidget);
      expect(find.text('Green · You'), findsOneWidget);
    },
  );

  testWidgets('returned config matches the selected options', (tester) async {
    LudoLocalMatchConfig? result;
    await tester.pumpWidget(
      _wrap(
        Builder(
          builder: (context) => ElevatedButton(
            onPressed: () async {
              result = await ModeSetupSheet.show(
                context,
                isComputerMatch: true,
              );
            },
            child: const Text('open'),
          ),
        ),
      ),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Quick'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('2'));
    await tester.pumpAndSettle();

    await tester.tap(find.byType(DropdownButton<String>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('hard').last);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Start'));
    await tester.pumpAndSettle();

    expect(result, isNotNull);
    expect(result!.ruleset, LudoRuleset.quick);
    expect(result!.playerCount, 2);
    expect(result!.isComputerMatch, isTrue);
    expect(result!.seats[0].isBot, isFalse);
    expect(result!.seats[1].isBot, isTrue);
    expect(result!.seats[1].botDifficulty, 'hard');
  });
}
