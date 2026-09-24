import 'package:flame/components.dart';
import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_board_component.dart';
import 'package:ludo_rules/ludo_rules.dart';

void main() {
  group('LudoBoardComponent', () {
    testWithFlameGame('renders 52 track cells, 24 home-stretch cells, '
        '4 yards', (game) async {
      final board = LudoBoardComponent(boardSize: Vector2.all(300));
      await game.ensureAdd(board);

      expect(board.trackCells.length, 52);
      expect(board.homeStretchCells.length, 24);
      expect(board.yards.length, 4);
      expect(board.children.length, 52 + 24 + 4);
    });

    testWithFlameGame('marks exactly the safe cells ludo_rules defines', (
      game,
    ) async {
      final board = LudoBoardComponent(boardSize: Vector2.all(300));
      await game.ensureAdd(board);

      final safeIndices = board.trackCells
          .where((cell) => cell.isSafe)
          .map((cell) => cell.cellIndex)
          .toSet();

      expect(safeIndices, LudoBoard.safeCells.toSet());
      expect(safeIndices.length, 8);
    });

    testWithFlameGame('every home-stretch color has exactly 6 cells', (
      game,
    ) async {
      final board = LudoBoardComponent(boardSize: Vector2.all(300));
      await game.ensureAdd(board);

      for (final color in LudoColor.values) {
        final cellsForColor = board.homeStretchCells.where(
          (cell) => cell.color == color,
        );
        expect(cellsForColor.length, 6, reason: '$color home stretch');
      }
    });

    testWithFlameGame('relayout keeps the same child counts at a new size', (
      game,
    ) async {
      final board = LudoBoardComponent(boardSize: Vector2.all(300));
      await game.ensureAdd(board);

      board.relayout(Vector2.all(600));
      await game.ready();

      expect(board.size, Vector2.all(600));
      expect(board.trackCells.length, 52);
      expect(board.homeStretchCells.length, 24);
      expect(board.yards.length, 4);
    });
  });
}
