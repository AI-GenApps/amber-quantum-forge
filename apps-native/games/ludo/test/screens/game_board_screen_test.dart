import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';

import 'package:ludo/src/game/ludo_game.dart';
import 'package:ludo/src/screens/game_board_screen.dart';
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo/src/widgets/dice_zone.dart';
import 'package:ludo/src/widgets/player_panel.dart';

/// A dice seed whose first roll (via `DeterministicRng(1).nextInt(6) + 1`)
/// is deterministically 4 (verified out-of-band), i.e. never a 6 — so a
/// roll never grants a bonus turn and the turn always advances after one
/// move, which every test below relies on.
const _seedRollingFour = 1;

LudoLocalMatchConfig _twoPlayerComputerConfig() => const LudoLocalMatchConfig(
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

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

/// Pumps past the game widget's own render loop without ever waiting for
/// it to go idle (a live `FlameGame` reschedules every frame, so
/// `pumpAndSettle` would hang) — mirrors
/// `onboarding_flow_test.dart`'s `_pumpTutorial` helper.
Future<void> _pumpGame(WidgetTester tester) async {
  const step = Duration(milliseconds: 50);
  const total = Duration(milliseconds: 300);
  var elapsed = Duration.zero;
  while (elapsed < total) {
    await tester.pump(step);
    elapsed += step;
  }
}

LudoGame _gameOf(WidgetTester tester) => tester
    .widget<GameWidget<LudoGame>>(find.byType(GameWidget<LudoGame>))
    .game!;

void main() {
  testWidgets('dice zone is disabled outside the local player\'s roll phase', (
    tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        GameBoardScreen(
          config: _twoPlayerComputerConfig(),
          seatIdentities: _identities,
          soundSettings: LudoSoundSettings(),
          diceSeed: _seedRollingFour,
          reducedMotion: ReducedMotionSetting(enabled: true),
        ),
      ),
    );
    await _pumpGame(tester);

    // Seat 0 (You)'s turn to roll: enabled.
    var diceZone = tester.widget<DiceZone>(find.byType(DiceZone));
    expect(diceZone.enabled, isTrue);

    await tester.tap(find.byType(DiceZone));
    await _pumpGame(tester);
    // The roll (4) had a legal move for every pre-placed Quick token;
    // tap the first one to complete the move and hand the turn to the
    // bot seat.
    final game = _gameOf(tester);
    final legal = legalMoves(game.matchState!);
    expect(legal, isNotEmpty);
    final localColor = game.matchState!.players[0].color;
    final token = game.tokens.firstWhere(
      (t) => t.color == localColor && t.tokenId == legal.first,
    );
    token.onTap?.call(localColor, legal.first);
    await _pumpGame(tester);

    // Now it's the bot seat's turn: dice zone must be disabled.
    diceZone = tester.widget<DiceZone>(find.byType(DiceZone));
    expect(diceZone.enabled, isFalse);

    // An out-of-turn tap attempt must not roll (no state change): the
    // disabled zone has no tap handler at all, so tapping it is a
    // silent no-op rather than a crash or a new roll.
    final stateBeforeTap = _gameOf(tester).matchState;
    await tester.tap(find.byType(DiceZone), warnIfMissed: false);
    await _pumpGame(tester);
    expect(_gameOf(tester).matchState, same(stateBeforeTap));
  });

  testWidgets(
    'tappable-token highlight matches legalMoves(state) for a constructed '
    'state',
    (tester) async {
      await tester.pumpWidget(
        _wrap(
          GameBoardScreen(
            config: _twoPlayerComputerConfig(),
            seatIdentities: _identities,
            soundSettings: LudoSoundSettings(),
            diceSeed: _seedRollingFour,
            reducedMotion: ReducedMotionSetting(enabled: true),
          ),
        ),
      );
      await _pumpGame(tester);

      await tester.tap(find.byType(DiceZone));
      await _pumpGame(tester);

      final game = _gameOf(tester);
      final state = game.matchState!;
      expect(state.phase, LudoMatchPhase.awaitingMove);
      expect(
        game.legalMoveHighlight.highlightedCellCount,
        legalMoves(state).length,
      );
    },
  );

  testWidgets(
    'the timer ring renders the correct remaining-time fraction for a '
    'given deadline',
    (tester) async {
      final now = DateTime(2026, 1, 1, 12, 0, 0);
      const turnDuration = Duration(seconds: 30);

      // Half of the turn has elapsed: 15s remaining out of 30s.
      await tester.pumpWidget(
        _wrap(
          Scaffold(
            body: Center(
              child: PlayerPanel(
                name: 'You',
                avatarId: 'red-face',
                color: LudoColor.red,
                isActive: true,
                deadline: now.add(const Duration(seconds: 15)),
                turnDuration: turnDuration,
                now: now,
              ),
            ),
          ),
        ),
      );

      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      expect(indicator.value, closeTo(0.5, 0.001));
    },
  );
}
