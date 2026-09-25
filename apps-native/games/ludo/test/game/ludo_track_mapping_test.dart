/// Regression coverage for the `ludo_rules` <-> board-grid mapping that
/// underlies checkpoint 13's user report ("Player 2 with green is on step
/// 1, but it seems like they are on step 2" — the released token looked
/// one cell further along than its actual `pathPosition`).
///
/// These drive the *real* pipeline (`LudoMatchState` -> `LudoGame.tokens`)
/// rather than re-deriving grid cells by hand, so a regression anywhere
/// between `ludo_rules`' `LudoBoard.absoluteCellOf` and
/// `ludo_board_geometry.dart`'s `ludoTrackCellGrid` would fail here exactly
/// like it would on a device.
library;

import 'package:flame/components.dart';
import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_board_component.dart';
import 'package:ludo/src/game/ludo_board_geometry.dart';
import 'package:ludo/src/game/ludo_game.dart';
import 'package:ludo_rules/ludo_rules.dart';

/// Builds a match with a single token (seat 0) at [pathPosition], all
/// other tokens left in the yard, so the rendered cell of token id 0
/// unambiguously reflects the mapping under test.
LudoMatchState _stateWithToken(LudoColor color, int pathPosition) {
  final base = LudoMatchState.initial(
    ruleset: LudoRuleset.classic,
    subjects: const ['red-seat', 'green-seat', 'yellow-seat', 'blue-seat'],
  );
  final index = LudoColor.values.indexOf(color);
  final players = [
    for (var i = 0; i < base.players.length; i++)
      if (i == index)
        base.players[i].copyWith(
          tokens: [
            LudoToken(id: 0, pathPosition: pathPosition),
            for (var t = 1; t < base.players[i].tokens.length; t++)
              base.players[i].tokens[t],
          ],
        )
      else
        base.players[i],
  ];
  return base.copyWith(players: players);
}

(int, int) _renderedCellOf(LudoGame game, LudoColor color) => game.tokens
    .firstWhere((t) => t.color == color && t.tokenId == 0)
    .currentCell;

const _board = LudoBoard();

void main() {
  group(
    'released-token cell matches the color\'s start cell (checkpoint 13)',
    () {
      for (final color in LudoColor.values) {
        testWithGame<LudoGame>(
          '$color: pathPosition 0 (just released) renders on $color\'s start '
          'cell, not one cell further along',
          () => LudoGame(initialState: _stateWithToken(color, 0)),
          (game) async {
            await game.ready();
            final cell = _renderedCellOf(game, color);
            expect(cell, ludoStartCellGrid(color));
            // Must NOT be one step ahead — the exact bug reported in
            // checkpoint 13 (a released token rendered on the *next* cell).
            final oneStepAhead =
                ludoTrackCellGrid[(_board.startIndexOf(color) + 1) %
                    ludoTrackLength];
            expect(cell, isNot(oneStepAhead));
          },
        );

        testWithGame<LudoGame>(
          '$color: pathPosition 1 renders one cell clockwise past the start '
          'cell along the shared track',
          () => LudoGame(initialState: _stateWithToken(color, 1)),
          (game) async {
            await game.ready();
            final cell = _renderedCellOf(game, color);
            final expected =
                ludoTrackCellGrid[(_board.startIndexOf(color) + 1) %
                    ludoTrackLength];
            expect(cell, expected);
            expect(cell, isNot(ludoStartCellGrid(color)));
          },
        );

        testWithGame<LudoGame>(
          '$color: the last shared-track cell before turning into the home '
          'stretch is correct',
          () => LudoGame(
            initialState: _stateWithToken(
              color,
              LudoRuleset.classic.stepsToHomeEntry - 1,
            ),
          ),
          (game) async {
            await game.ready();
            final cell = _renderedCellOf(game, color);
            final expectedAbsolute =
                (_board.startIndexOf(color) +
                    LudoRuleset.classic.stepsToHomeEntry -
                    1) %
                ludoTrackLength;
            expect(cell, ludoTrackCellGrid[expectedAbsolute]);
          },
        );

        testWithGame<LudoGame>(
          '$color: the first home-stretch cell (right after turning off the '
          'shared track) is correct',
          () => LudoGame(
            initialState: _stateWithToken(
              color,
              LudoRuleset.classic.stepsToHomeEntry,
            ),
          ),
          (game) async {
            await game.ready();
            final cell = _renderedCellOf(game, color);
            expect(cell, ludoHomeStretchCellGrid(color, 0));
          },
        );
      }
    },
  );

  group('safe cells coincide with star cells', () {
    test('every ludo_rules safe cell has a colored/star track cell at the '
        'exact same grid coordinates a token would land on', () {
      for (final cell in LudoBoard.safeCells) {
        expect(
          ludoIsSafeCell(cell),
          isTrue,
          reason: 'cell $cell should be flagged safe',
        );
      }
    });

    testWithFlameGame(
      'each color\'s start cell is both a star cell and colored with that '
      'color (task 12d2)',
      (game) async {
        final board = LudoBoardComponent(boardSize: Vector2.all(300));
        await game.ensureAdd(board);
        await game.ready();

        for (final color in LudoColor.values) {
          final startIndex = _board.startIndexOf(color);
          final cellComponent = board.trackCells.firstWhere(
            (c) => c.cellIndex == startIndex,
          );
          expect(cellComponent.isSafe, isTrue, reason: '$color start cell');
          expect(cellComponent.star, isNotNull, reason: '$color start cell');
          expect(
            cellComponent.startColor,
            color,
            reason: '$color start cell should be tinted $color',
          );
        }
      },
    );
  });
}
