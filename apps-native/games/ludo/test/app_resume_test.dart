/// Full "restart the app" integration test for task 11's local match resume.
///
/// This drives `GameBoardScreen` and `HomeLobbyScreen` directly (rather than
/// through `LudoApp`'s onboarding-gated routing, which task 11's Files
/// Touched list does not include) but with the *same* [LudoLocalSave]
/// instance passed to both across a simulated restart — standing in for the
/// real device's durable file-backed [SaveStore], which by construction
/// survives a process restart. Rebuilding a disjoint widget tree in between
/// (`SizedBox.shrink()` before the fresh screen, as `game_board_screen_test`
/// does to fully tear down the live `FlameGame`) is the "restart".
library;

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'package:ludo/src/game/ludo_game.dart';
import 'package:ludo/src/screens/game_board_screen.dart';
import 'package:ludo/src/screens/home_lobby_screen.dart';
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/state/ludo_local_save.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo/src/widgets/dice_zone.dart';

/// Same deterministic seed `game_board_screen_test.dart` relies on: the
/// first roll is always 4 (never a bonus-turn 6), so one move always hands
/// the turn to the other seat.
const _seedRollingFour = 1;

const _config = LudoLocalMatchConfig(
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

/// Task 12's bot-turn runner automatically continues a bot seat's turn the
/// instant it becomes active — including immediately resuming a pending
/// roll/move on a *resumed* mid-bot-turn state (see
/// `ludo_bot_turn_runner_test.dart` and `game_board_screen.dart`'s own
/// `initState` doc) — so a save/resume test that wants to assert the
/// resumed state matches the saved state byte-for-byte, with nothing else
/// having happened in between, uses a Pass N Play config instead: handing
/// the turn to another *human* seat never triggers any automatic
/// continuation (only the dismissible pass-and-play interstitial, which
/// this test never needs to interact with).
const _passAndPlayConfig = LudoLocalMatchConfig(
  ruleset: LudoRuleset.quick,
  isComputerMatch: false,
  seats: [
    LudoSeatConfig(color: LudoColor.red, isBot: false),
    LudoSeatConfig(color: LudoColor.green, isBot: false),
  ],
);

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

LudoLocalSave _newSave() => LudoLocalSave(
  saveStore: MemorySaveStore(),
  appContext: runtimeAppContext(identity: ludoLocalMatchIdentity),
);

/// Pumps past the game widget's own render loop without ever waiting for it
/// to go idle (mirrors `game_board_screen_test.dart`'s helper of the same
/// name — a live `FlameGame` reschedules every frame, so `pumpAndSettle`
/// would hang).
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

/// Fully tears down the current tree (so a live `FlameGame`, if any, stops
/// rescheduling frames) then builds [next] — standing in for an app
/// restart.
Future<void> _restartTo(WidgetTester tester, Widget next) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump();
  await tester.pumpWidget(_wrap(next));
  // Flush the async save-load this screen kicks off from initState.
  await tester.pump();
  await tester.pump();
}

void main() {
  testWidgets(
    'restart mid-match: home lobby offers Resume and resuming lands back '
    'on the board at the saved state',
    (tester) async {
      final save = _newSave();

      await tester.pumpWidget(
        _wrap(
          GameBoardScreen(
            config: _passAndPlayConfig,
            seatIdentities: _identities,
            soundSettings: LudoSoundSettings(),
            diceSeed: _seedRollingFour,
            reducedMotion: ReducedMotionSetting(enabled: true),
            localSave: save,
          ),
        ),
      );
      await _pumpGame(tester);

      // Apply one move: roll, then tap the first legal token.
      await tester.tap(find.byType(DiceZone));
      await _pumpGame(tester);
      final gameBeforeRestart = _gameOf(tester);
      final stateBeforeRestart = gameBeforeRestart.matchState!;
      final legal = legalMoves(stateBeforeRestart);
      expect(legal, isNotEmpty);
      final localColor = stateBeforeRestart.players[0].color;
      final token = gameBeforeRestart.tokens.firstWhere(
        (t) => t.color == localColor && t.tokenId == legal.first,
      );
      token.onTap?.call(localColor, legal.first);
      await _pumpGame(tester);

      final savedState = _gameOf(tester).matchState!;
      expect(savedState.phase, isNot(LudoMatchPhase.finished));

      // "Restart": tear down this tree and build a fresh home lobby, using
      // the very same (durable, in this test's stand-in) `save`.
      await _restartTo(tester, HomeLobbyScreen(localSave: save));

      expect(find.textContaining('Resume'), findsOneWidget);
      expect(
        find.textContaining(_config.ruleset.id),
        findsOneWidget,
        reason: 'the resume summary should describe the saved ruleset',
      );

      await tester.tap(find.textContaining('Resume'));
      await _pumpGame(tester);

      expect(find.byType(GameBoardScreen), findsOneWidget);
      final resumedState = _gameOf(tester).matchState!;
      expect(resumedState.toJson(), savedState.toJson());
    },
  );

  testWidgets('loading with no saved state shows no resume affordance', (
    tester,
  ) async {
    final save = _newSave();

    await tester.pumpWidget(_wrap(HomeLobbyScreen(localSave: save)));
    await tester.pump();
    await tester.pump();

    expect(find.textContaining('Resume'), findsNothing);
  });

  testWidgets('a finished match leaves no stale resumable save behind', (
    tester,
  ) async {
    final save = _newSave();
    // Seat 0 is one roll-of-4 away from finishing its last token, and is
    // the only unfinished seat once it does — so the very next move ends
    // the match, exercising `GameBoardScreen._persistLocalSave`'s
    // finished branch rather than asserting on `LudoLocalSave` in
    // isolation (already covered in `ludo_local_save_test.dart`).
    //
    // Classic (not `_config`'s Quick), since task 12g: Quick's
    // `oneHomeAndOneCapture` win condition wouldn't end the match on a
    // 4th-token finish alone without also having captured — Classic's
    // `allTokensHome` condition is what this scenario (3 tokens already
    // home, 1 one roll away) actually exercises.
    const ruleset = LudoRuleset.classic;
    const finishConfig = LudoLocalMatchConfig(
      ruleset: ruleset,
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
    final almostDone = LudoMatchState(
      ruleset: ruleset,
      players: [
        LudoPlayerState(
          seat: 0,
          subject: 'local-0',
          color: LudoColor.red,
          tokens: [
            LudoToken(id: 0, pathPosition: ruleset.pathLength - 4),
            LudoToken(id: 1, pathPosition: ruleset.pathLength),
            LudoToken(id: 2, pathPosition: ruleset.pathLength),
            LudoToken(id: 3, pathPosition: ruleset.pathLength),
          ],
        ),
        LudoPlayerState(
          seat: 1,
          subject: 'bot-1',
          color: LudoColor.green,
          tokens: List.generate(
            ruleset.tokensPerPlayer,
            (id) => LudoToken.inYard(id),
          ),
        ),
      ],
      currentPlayerIndex: 0,
      phase: LudoMatchPhase.awaitingRoll,
    );

    await tester.pumpWidget(
      _wrap(
        GameBoardScreen(
          config: finishConfig,
          seatIdentities: _identities,
          soundSettings: LudoSoundSettings(),
          diceSeed: _seedRollingFour,
          reducedMotion: ReducedMotionSetting(enabled: true),
          localSave: save,
          initialState: almostDone,
        ),
      ),
    );
    await _pumpGame(tester);

    await tester.tap(find.byType(DiceZone));
    await _pumpGame(tester);
    final game = _gameOf(tester);
    final state = game.matchState!;
    expect(state.phase, LudoMatchPhase.awaitingMove);
    final legal = legalMoves(state);
    expect(legal, contains(0));
    final token = game.tokens.firstWhere(
      (t) => t.color == LudoColor.red && t.tokenId == 0,
    );
    token.onTap?.call(LudoColor.red, 0);
    await _pumpGame(tester);
    // Let the pushReplacement to ResultsScreen (finished match) settle.
    await tester.pump(const Duration(milliseconds: 100));

    expect(await save.load(), isNull);
  });
}
