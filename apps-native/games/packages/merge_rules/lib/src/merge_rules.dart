import 'package:platform_core/platform_core.dart';

import 'merge_board.dart';
import 'merge_game.dart';

final class MergeMoveResult {
  const MergeMoveResult({
    required this.state,
    required this.changed,
    required this.scoreDelta,
    required this.spawnedCell,
    required this.spawnedValue,
    required this.rngDraws,
    required this.reason,
  });

  final MergeGameState state;
  final bool changed;
  final int scoreDelta;
  final int? spawnedCell;
  final int? spawnedValue;
  final int rngDraws;
  final String reason;
}

final class MergeRules {
  const MergeRules();

  MergeMoveResult apply(MergeGameState state, MergeDirection direction) {
    final before = state.board.cells;
    final moved = _move(before, direction);
    if (_same(before, moved.board.cells)) {
      return MergeMoveResult(
        state: state,
        changed: false,
        scoreDelta: 0,
        spawnedCell: null,
        spawnedValue: null,
        rngDraws: 0,
        reason: state.isTerminal ? 'terminal' : 'no_op',
      );
    }
    final rng = DeterministicRng.fromState(state.rngState);
    final empty = <int>[];
    for (var index = 0; index < moved.board.cells.length; index += 1) {
      if (moved.board.cells[index] == 0) empty.add(index);
    }
    int? spawnedCell;
    int? spawnedValue;
    var draws = 0;
    var board = moved.board;
    if (empty.isNotEmpty) {
      spawnedCell = empty[rng.nextInt(empty.length)];
      spawnedValue = rng.oneIn(10) ? 4 : 2;
      draws = 2;
      final cells = [...board.cells]..[spawnedCell] = spawnedValue;
      board = board.withCells(cells);
    }
    final next = state.copyWith(
      board: board,
      score: state.score + moved.scoreDelta,
      moveCount: state.moveCount + 1,
      rngState: rng.state32,
    );
    return MergeMoveResult(
      state: next,
      changed: true,
      scoreDelta: moved.scoreDelta,
      spawnedCell: spawnedCell,
      spawnedValue: spawnedValue,
      rngDraws: draws,
      reason: next.isTerminal ? 'terminal' : 'moved',
    );
  }

  MergeGameState replay(int seed, Iterable<MergeDirection> moves) {
    var state = MergeGameState.newGame(seed: seed);
    for (final move in moves) {
      if (state.isTerminal) {
        throw StateError('Replay contains a move after terminal state');
      }
      state = apply(state, move).state;
    }
    return state;
  }

  _MovedBoard _move(List<int> cells, MergeDirection direction) {
    final result = [...cells];
    var scoreDelta = 0;
    for (var line = 0; line < 4; line += 1) {
      final indexes = _lineIndexes(direction, line);
      final values = indexes.map((index) => cells[index]).toList();
      final oriented =
          direction == MergeDirection.right || direction == MergeDirection.down
          ? values.reversed.toList()
          : values;
      final compact = oriented.where((value) => value != 0).toList();
      final merged = <int>[];
      for (var index = 0; index < compact.length; index += 1) {
        if (index + 1 < compact.length &&
            compact[index] == compact[index + 1]) {
          final value = compact[index] * 2;
          merged.add(value);
          scoreDelta += value;
          index += 1;
        } else {
          merged.add(compact[index]);
        }
      }
      while (merged.length < 4) merged.add(0);
      final output =
          direction == MergeDirection.right || direction == MergeDirection.down
          ? merged.reversed.toList()
          : merged;
      for (var index = 0; index < indexes.length; index += 1) {
        result[indexes[index]] = output[index];
      }
    }
    return _MovedBoard(MergeBoard(result), scoreDelta);
  }

  List<int> _lineIndexes(MergeDirection direction, int line) {
    return switch (direction) {
      MergeDirection.left => [
        line * 4,
        line * 4 + 1,
        line * 4 + 2,
        line * 4 + 3,
      ],
      MergeDirection.right => [
        line * 4 + 3,
        line * 4 + 2,
        line * 4 + 1,
        line * 4,
      ],
      MergeDirection.up => [line, line + 4, line + 8, line + 12],
      MergeDirection.down => [line + 12, line + 8, line + 4, line],
    };
  }

  bool _same(List<int> first, List<int> second) {
    for (var index = 0; index < first.length; index += 1) {
      if (first[index] != second[index]) return false;
    }
    return true;
  }
}

final class _MovedBoard {
  const _MovedBoard(this.board, this.scoreDelta);

  final MergeBoard board;
  final int scoreDelta;
}
