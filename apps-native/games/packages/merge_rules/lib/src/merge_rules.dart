import 'package:platform_core/platform_core.dart';

import 'merge_board.dart';
import 'merge_config.dart';
import 'merge_game.dart';
import 'merge_trace.dart';

final class MergeRuleError extends StateError {
  MergeRuleError(this.code, String message) : super(message);

  final String code;
}

final class MergeMoveResult {
  const MergeMoveResult({
    required this.state,
    required this.changed,
    required this.scoreDelta,
    required this.spawnedCell,
    required this.spawnedValue,
    required this.rngDraws,
    required this.reason,
    required this.trace,
  });

  final MergeGameState state;
  final bool changed;
  final int scoreDelta;
  final int? spawnedCell;
  final int? spawnedValue;
  final int rngDraws;
  final String reason;
  final MergeMoveTrace trace;
}

final class MergeRules {
  const MergeRules({this.config = const MergeRuleConfig.legacy()});

  final MergeRuleConfig config;

  MergeMoveResult apply(MergeGameState state, MergeDirection direction) {
    final before = state.board.cells;
    final moved = _move(before, direction);
    if (_same(before, moved.board.cells)) {
      final reason = state.isTerminal ? 'terminal' : 'no_op';
      final trace = MergeMoveTrace(
        before: state,
        after: state,
        direction: direction,
        changed: false,
        scoreDelta: 0,
        spawnedCell: null,
        spawnedValue: null,
        rngDraws: 0,
        mergedPairs: const [],
      );
      return MergeMoveResult(
        state: state,
        changed: false,
        scoreDelta: 0,
        spawnedCell: null,
        spawnedValue: null,
        rngDraws: 0,
        reason: reason,
        trace: trace,
      );
    }
    if (state.moveCount >= maxMergeMoves) {
      throw MergeRuleError('move_limit', 'Merge move limit exceeded');
    }
    final nextScore = state.score + moved.scoreDelta;
    if (nextScore > maxMergeScore) {
      throw MergeRuleError('score_limit', 'Merge score limit exceeded');
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
      spawnedValue = config.spawnWeights.nextValue(rng);
      draws = 2;
      final cells = [...board.cells]..[spawnedCell] = spawnedValue;
      board = board.withCells(cells);
    }
    final next = state.copyWith(
      board: board,
      score: nextScore,
      moveCount: state.moveCount + 1,
      rngState: rng.state32,
    );
    final reason = next.isTerminal ? 'terminal' : 'moved';
    final trace = MergeMoveTrace(
      before: state,
      after: next,
      direction: direction,
      changed: true,
      scoreDelta: moved.scoreDelta,
      spawnedCell: spawnedCell,
      spawnedValue: spawnedValue,
      rngDraws: draws,
      mergedPairs: moved.mergedPairs,
    );
    return MergeMoveResult(
      state: next,
      changed: true,
      scoreDelta: moved.scoreDelta,
      spawnedCell: spawnedCell,
      spawnedValue: spawnedValue,
      rngDraws: draws,
      reason: reason,
      trace: trace,
    );
  }

  _MovedBoard _move(List<int> cells, MergeDirection direction) {
    final result = [...cells];
    var scoreDelta = 0;
    final mergedPairs = <MergePairTrace>[];
    for (var line = 0; line < 4; line += 1) {
      final indexes = _lineIndexes(direction, line);
      final orientedIndexes =
          direction == MergeDirection.right || direction == MergeDirection.down
          ? indexes.reversed.toList()
          : indexes;
      final compact = <_Tile>[];
      for (final index in orientedIndexes) {
        if (cells[index] != 0) compact.add(_Tile(index, cells[index]));
      }
      final merged = <int>[];
      for (var index = 0; index < compact.length; index += 1) {
        final current = compact[index];
        if (index + 1 < compact.length &&
            current.value == compact[index + 1].value &&
            current.value < maxMergeTile) {
          final value = current.value * 2;
          final destinationCell = indexes[merged.length];
          merged.add(value);
          scoreDelta += value;
          mergedPairs.add(
            MergePairTrace(
              sourceCells: [current.cell, compact[index + 1].cell],
              destinationCell: destinationCell,
              value: value,
            ),
          );
          index += 1;
        } else {
          merged.add(current.value);
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
    return _MovedBoard(MergeBoard(result), scoreDelta, mergedPairs);
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
  const _MovedBoard(this.board, this.scoreDelta, this.mergedPairs);

  final MergeBoard board;
  final int scoreDelta;
  final List<MergePairTrace> mergedPairs;
}

final class _Tile {
  const _Tile(this.cell, this.value);

  final int cell;
  final int value;
}
