/// Regression coverage for the "can't move a stacked token" bug fixed by
/// task 26 (device repro): tapping a stack of 2+ of the current player's
/// own tokens sharing one board cell (task 12h's fan-out) did not register
/// a move, because the stacked tap hit-test region
/// (`_stackedTapHitRadiusFraction` in `ludo_token_component.dart`) was far
/// smaller than any real fingertip's contact area — under 10 logical
/// pixels across on a typical board, well inside the visually-rendered pin
/// itself.
///
/// Every prior stacked-token test (`ludo_game_test.dart`,
/// `ludo_board_golden_test.dart`) either drives `LudoTokenComponent.onTap`
/// directly or queries a token's own *exact* pixel center via
/// `componentsAtPoint` — both of which stay green even with a pinprick
/// hit-test radius, since neither exercises the imprecision of a real
/// touch. This file closes that gap: it drives the *real*
/// `GameBoardScreen` -> `GameWidget<LudoGame>` -> Flame tap-dispatch ->
/// `LudoTokenComponent.containsLocalPoint` pipeline via
/// `WidgetTester.tapAt`, at a point deliberately offset a few logical
/// pixels from a stacked token's exact center (simulating ordinary
/// real-touch imprecision), for both a fresh Quick-mode stack (the two
/// pre-released start-square tokens) and a stack formed mid-match further
/// along the track.
library;

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';

import 'package:ludo/src/game/ludo_game.dart';
import 'package:ludo/src/game/ludo_token_component.dart';
import 'package:ludo/src/screens/game_board_screen.dart';
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo/src/widgets/dice_zone.dart';

/// A dice seed whose first roll (via `DeterministicRng(1).nextInt(6) + 1`)
/// is deterministically 4 (verified out-of-band, same seed
/// `game_board_screen_test.dart` relies on) — never a 6, so a roll never
/// grants a bonus turn.
const _seedRollingFour = 1;

LudoLocalMatchConfig _twoPlayerComputerConfig() => const LudoLocalMatchConfig(
  ruleset: LudoRuleset.quick,
  isComputerMatch: true,
  seats: [
    LudoSeatConfig(color: LudoColor.red, isBot: false),
    LudoSeatConfig(color: LudoColor.green, isBot: true, botDifficulty: 'easy'),
  ],
);

LudoLocalMatchConfig _twoPlayerClassicComputerConfig() =>
    const LudoLocalMatchConfig(
      ruleset: LudoRuleset.classic,
      isComputerMatch: true,
      seats: [
        LudoSeatConfig(color: LudoColor.red, isBot: false),
        LudoSeatConfig(
          color: LudoColor.green,
          isBot: true,
          botDifficulty: 'easy',
        ),
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
/// `pumpAndSettle` would hang) — mirrors `game_board_screen_test.dart`'s
/// `_pumpGame` helper.
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

/// A mid-match state (Classic ruleset) where the local (red, seat 0)
/// player has two of its own tokens (ids 0 and 1) already stacked on the
/// same mid-track cell, a roll is pending that gives both an identical
/// legal move, and it's the local player's move phase — a stack formed
/// well past the start square, unlike the Quick-mode pre-release case.
LudoMatchState _midGameStackedState() {
  final base = LudoMatchState.initial(
    ruleset: LudoRuleset.classic,
    subjects: const ['red-seat', 'green-seat'],
  );
  final redPlayer = base.players[0];
  final stackedTokens = [
    for (var t = 0; t < redPlayer.tokens.length; t++)
      if (t == 0 || t == 1)
        LudoToken(id: t, pathPosition: 10)
      else
        redPlayer.tokens[t],
  ];
  final players = [
    redPlayer.copyWith(tokens: stackedTokens),
    for (var i = 1; i < base.players.length; i++) base.players[i],
  ];
  return base.copyWith(
    players: players,
    phase: LudoMatchPhase.awaitingMove,
    currentRoll: 3,
  );
}

/// Taps a few logical pixels off [token]'s exact rendered center —
/// close enough to be an obviously-intended tap on that token, but far
/// enough that the pre-fix pinprick hit-test circle (~5px radius) missed
/// it entirely. Mirrors ordinary real-touch imprecision, not a
/// pixel-perfect programmatic tap.
Offset _imprecisePointOn(WidgetTester tester, LudoTokenComponent token) {
  final widgetRect = tester.getRect(find.byType(GameWidget<LudoGame>));
  return widgetRect.topLeft +
      Offset(token.position.x + 7, token.position.y + 7);
}

void main() {
  testWidgets(
    'tapping a few pixels off-center on a Quick-mode pre-released stacked '
    'token (real tap-dispatch path) still selects and moves it',
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
      final legal = legalMoves(state);
      expect(
        legal.length,
        greaterThanOrEqualTo(2),
        reason:
            'Quick mode pre-releases 2 tokens onto the shared start '
            'square; both must have a legal move for this repro to be '
            'meaningful.',
      );
      final localColor = state.players[state.currentPlayerIndex].color;
      final stackedToken = game.tokens.firstWhere(
        (t) => t.color == localColor && t.tokenId == legal.first,
      );
      // Confirm this really is a stacked token (non-zero fan-out offset)
      // before relying on the imprecise-tap behavior under test.
      expect(stackedToken.stackOffset, isNot(equals(Vector2.zero())));

      final stateBeforeTap = _gameOf(tester).matchState;
      await tester.tapAt(_imprecisePointOn(tester, stackedToken));
      await _pumpGame(tester);

      final stateAfterTap = _gameOf(tester).matchState;
      expect(
        stateAfterTap,
        isNot(same(stateBeforeTap)),
        reason:
            'An imprecise (few-pixel-offset) tap on a stacked token '
            'must still register a move — this is the task 26 device '
            'repro: the pre-fix hit-test circle was too small for any '
            'real touch to land in.',
      );
    },
  );

  testWidgets(
    'tapping a few pixels off-center on a mid-match stacked token (real '
    'tap-dispatch path) still selects and moves it',
    (tester) async {
      final initialState = _midGameStackedState();
      await tester.pumpWidget(
        _wrap(
          GameBoardScreen(
            config: _twoPlayerClassicComputerConfig(),
            seatIdentities: _identities,
            soundSettings: LudoSoundSettings(),
            diceSeed: _seedRollingFour,
            reducedMotion: ReducedMotionSetting(enabled: true),
            initialState: initialState,
          ),
        ),
      );
      await _pumpGame(tester);

      final game = _gameOf(tester);
      final state = game.matchState!;
      expect(state.phase, LudoMatchPhase.awaitingMove);
      final legal = legalMoves(state);
      expect(legal, containsAll([0, 1]));

      final localColor = state.players[state.currentPlayerIndex].color;
      final tokenA = game.tokens.firstWhere(
        (t) => t.color == localColor && t.tokenId == 0,
      );
      final tokenB = game.tokens.firstWhere(
        (t) => t.color == localColor && t.tokenId == 1,
      );
      expect(tokenA.currentCell, tokenB.currentCell);
      expect(tokenA.stackOffset, isNot(equals(Vector2.zero())));

      final stateBeforeTap = _gameOf(tester).matchState;
      await tester.tapAt(_imprecisePointOn(tester, tokenA));
      await _pumpGame(tester);

      final stateAfterTap = _gameOf(tester).matchState;
      expect(
        stateAfterTap,
        isNot(same(stateBeforeTap)),
        reason:
            'An imprecise tap on a mid-match stacked token must still '
            'register a move (task 26 device repro), not only a stack '
            'formed on the Quick-mode start square.',
      );
    },
  );
}
