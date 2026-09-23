import 'package:platform_core/platform_core.dart';

import 'merge_board.dart';
import 'merge_config.dart';

const mergeSchemaVersion = 1;
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
    if (rngState <= 0 || rngState > maxMergeSeed) {
      throw ArgumentError.value(rngState, 'rngState');
    }
    if (ruleVersion != mergeRuleVersion) {
      throw ArgumentError.value(ruleVersion, 'ruleVersion');
    }
  }

  factory MergeGameState.newGame({
    int seed = 1,
    MergeSpawnWeights spawnWeights = const MergeSpawnWeights.legacy(),
  }) {
    final rng = DeterministicRng(seed);
    var board = MergeBoard.empty();
    board = _spawn(board, rng, spawnWeights).$1;
    board = _spawn(board, rng, spawnWeights).$1;
    return MergeGameState(
      board: board,
      score: 0,
      moveCount: 0,
      seed: seed,
      rngState: rng.state32,
    );
  }

  factory MergeGameState.fromJson(Map<String, Object?> json) =>
      MergeGameState.fromLegacyJson(json);

  factory MergeGameState.fromLegacyJson(Map<String, Object?> json) {
    return _decode(json, requireRuleVersion: false, normalizeRng: true);
  }

  static Map<String, Object?> migrateLegacyJson(Map<String, Object?> json) =>
      MergeGameState.fromLegacyJson(json).toWireJson();

  factory MergeGameState.fromWireJson(Map<String, Object?> json) {
    const fields = {
      'board',
      'score',
      'move_count',
      'seed',
      'rng_state',
      'rule_version',
    };
    if (json.keys.any((key) => !fields.contains(key)) ||
        json.length != fields.length) {
      throw const FormatException('Unexpected merge state fields');
    }
    return _decode(json, requireRuleVersion: true, normalizeRng: false);
  }

  static MergeGameState _decode(
    Map<String, Object?> json, {
    required bool requireRuleVersion,
    required bool normalizeRng,
  }) {
    final board = json['board'];
    final ruleVersion = json['rule_version'];
    if (board is! List || board.any((value) => value is! int)) {
      throw const FormatException('Invalid merge board');
    }
    if ((requireRuleVersion && ruleVersion != mergeRuleVersion) ||
        (!requireRuleVersion &&
            ruleVersion != null &&
            ruleVersion != mergeRuleVersion)) {
      throw const FormatException('Unsupported merge rule version');
    }
    final rngState = _integer(json['rng_state'], 'rng_state');
    if (rngState < 0 || rngState > maxMergeSeed) {
      throw const FormatException('Invalid merge RNG state');
    }
    return MergeGameState(
      board: MergeBoard(board.cast<int>()),
      score: _integer(json['score'], 'score'),
      moveCount: _integer(json['move_count'], 'move_count'),
      seed: _integer(json['seed'], 'seed'),
      rngState: normalizeRng ? _normalizeRng(rngState) : rngState,
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

  Map<String, Object?> toWireJson() => toJson();

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

  static (MergeBoard, int) _spawn(
    MergeBoard board,
    DeterministicRng rng,
    MergeSpawnWeights spawnWeights,
  ) {
    final empty = <int>[];
    for (var index = 0; index < board.cells.length; index += 1) {
      if (board.cells[index] == 0) empty.add(index);
    }
    if (empty.isEmpty) return (board, 0);
    final index = empty[rng.nextInt(empty.length)];
    final value = spawnWeights.nextValue(rng);
    final cells = [...board.cells]..[index] = value;
    return (board.withCells(cells), index);
  }

  static int _integer(Object? value, String name) {
    if (value is! int) throw FormatException('Missing integer $name');
    return value;
  }

  static int _normalizeRng(int value) =>
      DeterministicRng.fromState(value).state32;
}
