import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';

import 'package:ludo/src/screens/game_board_screen.dart';
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/screens/results_screen.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';

LudoLocalMatchConfig _twoPlayerConfig() => const LudoLocalMatchConfig(
  ruleset: LudoRuleset.quick,
  isComputerMatch: true,
  seats: [
    LudoSeatConfig(color: LudoColor.red, isBot: false),
    LudoSeatConfig(color: LudoColor.green, isBot: true, botDifficulty: 'easy'),
  ],
);

const _identities = [
  LudoSeatIdentity(name: 'You', avatarId: 'red-face'),
  LudoSeatIdentity(name: 'Bot', avatarId: 'green-face'),
];

/// A terminal state where seat 1 finished first (seat 0 is last), built
/// directly via `copyWith` rather than playing a full match out.
LudoMatchState _finishedState() {
  final initial = LudoMatchState.initial(
    ruleset: LudoRuleset.quick,
    subjects: const ['local-0', 'bot-1'],
  );
  return initial.copyWith(
    phase: LudoMatchPhase.finished,
    winnerOrder: const [1],
  );
}

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

void main() {
  testWidgets('renders the final finish order, winner first', (tester) async {
    await tester.pumpWidget(
      _wrap(
        ResultsScreen(
          state: _finishedState(),
          config: _twoPlayerConfig(),
          seatIdentities: _identities,
          soundSettings: LudoSoundSettings(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('1st'), findsOneWidget);
    expect(find.text('2nd'), findsOneWidget);

    final names = tester
        .widgetList<Text>(
          find.descendant(
            of: find.byKey(const Key('results-rank-list')),
            matching: find.byType(Text),
          ),
        )
        .map((t) => t.data)
        .toList();
    // "Bot" (seat 1, winner) must appear before "You" (seat 0, last).
    expect(names.indexOf('Bot'), lessThan(names.indexOf('You')));
  });

  testWidgets('Rematch pushes a fresh GameBoardScreen with the same config', (
    tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        ResultsScreen(
          state: _finishedState(),
          config: _twoPlayerConfig(),
          seatIdentities: _identities,
          soundSettings: LudoSoundSettings(),
          rematchDiceSeed: 1,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(GameBoardScreen), findsNothing);
    await tester.tap(find.byKey(const Key('results-rematch-button')));
    for (var i = 0; i < 10; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }

    expect(find.byType(ResultsScreen), findsNothing);
    expect(find.byType(GameBoardScreen), findsOneWidget);
    final board = tester.widget<GameBoardScreen>(find.byType(GameBoardScreen));
    expect(board.config, equals(_twoPlayerConfig()));
    expect(board.config.seats.length, 2);
  });

  testWidgets('Home pops back to the route below', (tester) async {
    var homeCalled = false;
    await tester.pumpWidget(
      _wrap(
        Builder(
          builder: (context) => ElevatedButton(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => ResultsScreen(
                  state: _finishedState(),
                  config: _twoPlayerConfig(),
                  seatIdentities: _identities,
                  soundSettings: LudoSoundSettings(),
                  onHome: () => homeCalled = true,
                ),
              ),
            ),
            child: const Text('open'),
          ),
        ),
      ),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    expect(find.byType(ResultsScreen), findsOneWidget);

    await tester.tap(find.byKey(const Key('results-home-button')));
    await tester.pumpAndSettle();

    expect(homeCalled, isTrue);
  });

  testWidgets(
    'every interactive control has a Semantics label and 48dp+ tap target',
    (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(
          ResultsScreen(
            state: _finishedState(),
            config: _twoPlayerConfig(),
            seatIdentities: _identities,
            soundSettings: LudoSoundSettings(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      for (final label in ['Home', 'Rematch']) {
        final finder = find.bySemanticsLabel(label);
        expect(finder, findsOneWidget, reason: label);
        final semantics = tester.getSemantics(finder);
        expect(semantics.flagsCollection.isButton, isTrue);
        final size = tester.getSize(finder);
        expect(size.width, greaterThanOrEqualTo(48.0));
        expect(size.height, greaterThanOrEqualTo(48.0));
      }

      handle.dispose();
    },
  );
}
