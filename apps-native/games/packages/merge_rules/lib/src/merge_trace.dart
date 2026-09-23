import 'merge_board.dart';
import 'merge_game.dart';

final class MergePairTrace {
  MergePairTrace({
    required Iterable<int> sourceCells,
    required this.destinationCell,
    required this.value,
  }) : sourceCells = List.unmodifiable(sourceCells) {
    if (this.sourceCells.length != 2) {
      throw ArgumentError.value(this.sourceCells, 'sourceCells');
    }
    if (destinationCell < 0 || destinationCell >= 16) {
      throw ArgumentError.value(destinationCell, 'destinationCell');
    }
    if (value <= 0 || value > maxMergeTile) {
      throw ArgumentError.value(value, 'value');
    }
  }

  final List<int> sourceCells;
  final int destinationCell;
  final int value;

  Map<String, Object?> toJson() => {
    'source_cells': sourceCells,
    'destination_cell': destinationCell,
    'value': value,
  };
}

final class MergeMoveTrace {
  MergeMoveTrace({
    required this.before,
    required this.after,
    required this.direction,
    required this.changed,
    required this.scoreDelta,
    required this.spawnedCell,
    required this.spawnedValue,
    required this.rngDraws,
    required Iterable<MergePairTrace> mergedPairs,
  }) : mergedPairs = List.unmodifiable(mergedPairs);

  final MergeGameState before;
  final MergeGameState after;
  final MergeDirection direction;
  final bool changed;
  final int scoreDelta;
  final int? spawnedCell;
  final int? spawnedValue;
  final int rngDraws;
  final List<MergePairTrace> mergedPairs;

  Map<String, Object?> toJson() => {
    'before': before.toWireJson(),
    'after': after.toWireJson(),
    'direction': direction.name,
    'changed': changed,
    'score_delta': scoreDelta,
    'spawned_cell': spawnedCell,
    'spawned_value': spawnedValue,
    'rng_draws': rngDraws,
    'merged_pairs': mergedPairs.map((pair) => pair.toJson()).toList(),
  };
}
