import 'package:platform_core/platform_core.dart';

import 'merge_board.dart';

const mergeRuleVersion = 'MR-2D-1';
const maxMergeScore = 1000000000000;
const maxMergeMoves = 100000;
const maxMergeSeed = 0xffffffff;

final class MergeGameState {
  MergeGameState({
    required this.board,
    required this.score,
    required this.moveCount,
    required this.seed,
    required this.rngState,
    this.ruleVersion = mergeRuleVersion,
  }) {
    if (score < 0 || score > maxMergeScore) {
      throw ArgumentError.value(score, 'score');
    }
    if (moveCount < 0 || moveCount > maxMergeMoves) {
      throw ArgumentError.value(moveCount, 'moveCount');
    }
    if (seed < 0 || seed > maxMergeSeed) {
      throw ArgumentError.value(seed, 'seed');
    }
    if (rngState < 0 || rngState > maxMergeSeed) {
      throw ArgumentError.value(rngState, 'rngState');
    }
    if (ruleVersion != mergeRuleVersion) {
      throw ArgumentError.value(ruleVersion, 'ruleVersion');
    }
  }

  factory MergeGameState.newGame({int seed = 1}) {
    final rng = DeterministicRng(seed);
    var board = MergeBoard.empty();
    board = _spawn(board, rng).$1;
    board = _spawn(board, rng).$1;
    return MergeGameState(
      board: board,
      score: 0,
      moveCount: 0,
      seed: seed,
      rngState: rng.state32,
    );
  }

  factory MergeGameState.fromJson(Map<String, Object?> json) {
    final board = json['board'];
    final ruleVersion = json['rule_version'];
    if (board is! List || board.any((value) => value is! int)) {
      throw const FormatException('Invalid merge board');
    }
    if (ruleVersion != null && ruleVersion != mergeRuleVersion) {
      throw const FormatException('Unsupported merge rule version');
    }
    return MergeGameState(
      board: MergeBoard(board.cast<int>()),
      score: _integer(json['score'], 'score'),
      moveCount: _integer(json['move_count'], 'move_count'),
      seed: _integer(json['seed'], 'seed'),
      rngState: _integer(json['rng_state'], 'rng_state'),
      ruleVersion: mergeRuleVersion,
    );
  }

  final MergeBoard board;
  final int score;
  final int moveCount;
  final int seed;
  final int rngState;
  final String ruleVersion;

  bool get isTerminal => !board.hasLegalMove;

  Map<String, Object?> toJson() {
    return {
      'board': board.cells,
      'score': score,
      'move_count': moveCount,
      'seed': seed,
      'rng_state': rngState,
      'rule_version': ruleVersion,
    };
  }

  MergeGameState copyWith({
    MergeBoard? board,
    int? score,
    int? moveCount,
    int? rngState,
  }) {
    return MergeGameState(
      board: board ?? this.board,
      score: score ?? this.score,
      moveCount: moveCount ?? this.moveCount,
      seed: seed,
      rngState: rngState ?? this.rngState,
      ruleVersion: ruleVersion,
    );
  }

  static (MergeBoard, int) _spawn(MergeBoard board, DeterministicRng rng) {
    final empty = <int>[];
    for (var index = 0; index < board.cells.length; index += 1) {
      if (board.cells[index] == 0) empty.add(index);
    }
    if (empty.isEmpty) return (board, 0);
    final index = empty[rng.nextInt(empty.length)];
    final value = rng.oneIn(10) ? 4 : 2;
    final cells = [...board.cells]..[index] = value;
    return (board.withCells(cells), index);
  }

  static int _integer(Object? value, String name) {
    if (value is! int) throw FormatException('Missing integer $name');
    return value;
  }
}
