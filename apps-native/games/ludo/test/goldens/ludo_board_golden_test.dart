import 'package:flame/components.dart';
import 'package:flame_test/flame_test.dart';
import 'package:ludo/src/game/ludo_board_component.dart';
import 'package:ludo/src/game/ludo_game.dart';
import 'package:ludo_rules/ludo_rules.dart';

/// Golden tests for the board and glossy tokens (task 04).
///
/// A flat placeholder-colored board or a single-color token circle must
/// fail these — see the concrete gradient/shadow/highlight requirements in
/// `tasks/epics/15-ludo-launch/04-board-and-tokens.md`. Run
/// `flutter test --update-goldens test/goldens/ludo_board_golden_test.dart`
/// after any intentional visual change.
void main() {
  testGolden(
    'empty board shows all safe-cell stars',
    (game, tester) async {
      await game.ensureAdd(LudoBoardComponent(boardSize: Vector2.all(320)));
    },
    goldenFile: 'board_empty.png',
    size: Vector2.all(320),
  );

  testGolden(
    'populated board shows tokens in yard, on track, and in home stretch',
    (game, tester) async {},
    game: LudoGame(initialState: _populatedState()),
    goldenFile: 'board_populated.png',
    size: Vector2.all(320),
  );

  testGolden(
    'legal-move highlight rings every token the current player can move',
    (game, tester) async {},
    game: LudoGame(initialState: _legalMoveHighlightState()),
    goldenFile: 'board_legal_move_highlight.png',
    size: Vector2.all(320),
  );

  testGolden(
    'turn highlight glows the active seat\'s yard',
    (game, tester) async {},
    game: LudoGame(initialState: _turnHighlightState()),
    goldenFile: 'board_turn_highlight.png',
    size: Vector2.all(320),
  );

  testGolden(
    'Quick mode\'s 2 pre-released start-square tokens render fanned out, '
    'not stacked exactly on top of each other (task 12h)',
    (game, tester) async {},
    game: LudoGame(initialState: _quickPreReleasedStackState()),
    goldenFile: 'board_stacked_tokens_quick_start.png',
    size: Vector2.all(320),
  );

  testGolden(
    'a mixed-color mid-game stack (2+ different colors sharing one shared '
    'track cell) renders fanned out (task 12h)',
    (game, tester) async {},
    game: LudoGame(initialState: _mixedColorStackState()),
    goldenFile: 'board_stacked_tokens_mixed.png',
    size: Vector2.all(320),
  );
}

/// Quick mode's own initial state already places both of seat 0's
/// pre-released tokens on the same start-square cell (task 12g) — exactly
/// the "2 same-color tokens stacked on a Quick start square" scenario this
/// task's acceptance criteria calls for, with no extra `copyWith` needed.
LudoMatchState _quickPreReleasedStackState() => LudoMatchState.initial(
  ruleset: LudoRuleset.quick,
  subjects: const ['red-seat', 'green-seat'],
);

/// Three different-colored tokens sharing a single shared-track cell.
/// `absoluteCellOf(color, p) == (startIndexOf(color) + p) % 52`
/// (`ludo_board.dart`), and colors start 13 cells apart, so landing all
/// three on absolute cell 5 needs a *different* `pathPosition` per color:
/// red `p=5` (`0+5`), green `p=44` (`13+44=57≡5`), yellow `p=31`
/// (`26+31=57≡5`) — a same-color stack (e.g. from a capture/blockade
/// scenario) would read no differently on the board than this cross-color
/// one, so this exercises the >2-token, mixed-color branch of the fan-out
/// layout the golden above doesn't.
LudoMatchState _mixedColorStackState() {
  final base = LudoMatchState.initial(
    ruleset: LudoRuleset.classic,
    subjects: const ['red-seat', 'green-seat', 'yellow-seat', 'blue-seat'],
  );
  return base.copyWith(
    players: [
      _withTokens(base.players[0], const [5, -1, 40, 55]),
      _withTokens(base.players[1], const [44, -1, 10, 53]),
      _withTokens(base.players[2], const [31, 20, 51, 57]),
      _withTokens(base.players[3], const [-1, 30, 45, 2]),
    ],
  );
}

LudoPlayerState _withTokens(LudoPlayerState player, List<int> positions) =>
    player.copyWith(
      tokens: [
        for (var i = 0; i < positions.length; i++)
          LudoToken(id: i, pathPosition: positions[i]),
      ],
    );

LudoMatchState _populatedState() {
  final base = LudoMatchState.initial(
    ruleset: LudoRuleset.classic,
    subjects: const ['red-seat', 'green-seat', 'yellow-seat', 'blue-seat'],
  );
  return base.copyWith(
    players: [
      _withTokens(base.players[0], const [-1, 5, 40, 55]),
      _withTokens(base.players[1], const [-1, -1, 10, 53]),
      _withTokens(base.players[2], const [0, 20, 51, 57]),
      _withTokens(base.players[3], const [-1, 30, 45, 2]),
    ],
  );
}

LudoMatchState _legalMoveHighlightState() {
  final base = LudoMatchState.initial(
    ruleset: LudoRuleset.classic,
    subjects: const ['red-seat', 'green-seat', 'yellow-seat', 'blue-seat'],
  );
  final players = [
    _withTokens(base.players[0], const [-1, 5, 40, 12]),
    ...base.players.skip(1),
  ];
  return base.copyWith(
    players: players,
    currentPlayerIndex: 0,
    phase: LudoMatchPhase.awaitingMove,
    currentRoll: 4,
  );
}

LudoMatchState _turnHighlightState() {
  final base = LudoMatchState.initial(
    ruleset: LudoRuleset.classic,
    subjects: const ['red-seat', 'green-seat', 'yellow-seat', 'blue-seat'],
  );
  return base.copyWith(
    currentPlayerIndex: 2,
    phase: LudoMatchPhase.awaitingRoll,
  );
}
