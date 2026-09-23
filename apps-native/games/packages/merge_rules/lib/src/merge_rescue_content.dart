import 'merge_board.dart';
import 'merge_codec.dart';
import 'merge_config.dart';
import 'merge_game.dart';

const mergeRescueTraceAlgorithm = 'merge-rescue-trace-v1';

final class MergeRescueProvenance {
  const MergeRescueProvenance({
    required this.source,
    required this.algorithm,
    required this.configRevision,
    required this.spawnWeights,
    required this.traceHash,
  });

  factory MergeRescueProvenance.fromJson(Map<String, Object?> json) {
    const fields = {
      'source',
      'algorithm',
      'config_revision',
      'spawn_two_weight',
      'spawn_four_weight',
      'trace_hash',
    };
    if (json.keys.any((key) => !fields.contains(key)) ||
        fields.any((key) => !json.containsKey(key))) {
      throw const FormatException('Unexpected rescue provenance fields');
    }
    final source = json['source'];
    final algorithm = json['algorithm'];
    final revision = json['config_revision'];
    final traceHash = json['trace_hash'];
    if (source is! String ||
        algorithm is! String ||
        revision is! int ||
        traceHash is! String) {
      throw const FormatException('Invalid rescue provenance');
    }
    final two = json['spawn_two_weight'];
    final four = json['spawn_four_weight'];
    if (two is! int || four is! int) {
      throw const FormatException('Invalid rescue provenance weights');
    }
    return MergeRescueProvenance(
      source: source,
      algorithm: algorithm,
      configRevision: revision,
      spawnWeights: MergeSpawnWeights(
        spawnTwoWeight: two,
        spawnFourWeight: four,
      ),
      traceHash: traceHash,
    );
  }

  final String source;
  final String algorithm;
  final int configRevision;
  final MergeSpawnWeights spawnWeights;
  final String traceHash;

  Map<String, Object> toJson() => {
    'source': source,
    'algorithm': algorithm,
    'config_revision': configRevision,
    ...spawnWeights.toJson(),
    'trace_hash': traceHash,
  };
}

final class MergeRescueDifficulty {
  const MergeRescueDifficulty({
    required this.originMoveCount,
    required this.checkpointLegalMoves,
    required this.checkpointMergeOptions,
    required this.bestScoreDelta,
    required this.filledCells,
    required this.maxTile,
  });

  factory MergeRescueDifficulty.fromJson(Map<String, Object?> json) {
    const fields = {
      'origin_move_count',
      'checkpoint_legal_moves',
      'checkpoint_merge_options',
      'best_score_delta',
      'filled_cells',
      'max_tile',
    };
    if (json.keys.any((key) => !fields.contains(key)) ||
        fields.any((key) => !json.containsKey(key))) {
      throw const FormatException('Unexpected rescue difficulty fields');
    }
    final originMoveCount = json['origin_move_count'];
    final checkpointLegalMoves = json['checkpoint_legal_moves'];
    final checkpointMergeOptions = json['checkpoint_merge_options'];
    final bestScoreDelta = json['best_score_delta'];
    final filledCells = json['filled_cells'];
    final maxTile = json['max_tile'];
    if (originMoveCount is! int ||
        checkpointLegalMoves is! int ||
        checkpointMergeOptions is! int ||
        bestScoreDelta is! int ||
        filledCells is! int ||
        maxTile is! int) {
      throw const FormatException('Invalid rescue difficulty');
    }
    return MergeRescueDifficulty(
      originMoveCount: originMoveCount,
      checkpointLegalMoves: checkpointLegalMoves,
      checkpointMergeOptions: checkpointMergeOptions,
      bestScoreDelta: bestScoreDelta,
      filledCells: filledCells,
      maxTile: maxTile,
    );
  }

  final int originMoveCount;
  final int checkpointLegalMoves;
  final int checkpointMergeOptions;
  final int bestScoreDelta;
  final int filledCells;
  final int maxTile;

  Map<String, int> toJson() => {
    'origin_move_count': originMoveCount,
    'checkpoint_legal_moves': checkpointLegalMoves,
    'checkpoint_merge_options': checkpointMergeOptions,
    'best_score_delta': bestScoreDelta,
    'filled_cells': filledCells,
    'max_tile': maxTile,
  };
}

final class MergeRescueTraceRecord {
  MergeRescueTraceRecord({
    required this.id,
    required this.state,
    required this.originSeed,
    required Iterable<MergeDirection> originMoves,
    required this.provenance,
    required this.difficulty,
  }) : originMoves = List.unmodifiable(originMoves) {
    _validateId(id);
    if (this.originMoves.isEmpty || this.originMoves.length > maxMergeMoves) {
      throw ArgumentError.value(this.originMoves.length, 'originMoves');
    }
    if (originSeed < 0 || originSeed > maxMergeSeed) {
      throw ArgumentError.value(originSeed, 'originSeed');
    }
    if (state.isTerminal) {
      throw const FormatException('Rescue checkpoint must be playable');
    }
  }

  factory MergeRescueTraceRecord.fromJson(Map<String, Object?> json) {
    const fields = {
      'id',
      'board',
      'score',
      'move_count',
      'seed',
      'rng_state',
      'rule_version',
      'origin_seed',
      'origin_moves',
      'provenance',
      'difficulty',
    };
    if (json.keys.any((key) => !fields.contains(key)) ||
        fields.any((key) => !json.containsKey(key))) {
      throw const FormatException('Unexpected rescue trace fields');
    }
    final id = json['id'];
    final board = json['board'];
    final originSeed = json['origin_seed'];
    final originMoves = json['origin_moves'];
    final provenance = json['provenance'];
    final difficulty = json['difficulty'];
    if (id is! String ||
        board is! List ||
        board.any((value) => value is! int) ||
        originSeed is! int ||
        originMoves is! List ||
        originMoves.any((move) => move is! String) ||
        provenance is! Map ||
        difficulty is! Map) {
      throw const FormatException('Invalid rescue trace record');
    }
    final ruleVersion = json['rule_version'];
    if (ruleVersion is! String) {
      throw const FormatException('Invalid rescue trace rule version');
    }
    final state = MergeGameState(
      board: MergeBoard(board.cast<int>()),
      score: _integer(json['score'], 'score'),
      moveCount: _integer(json['move_count'], 'move_count'),
      seed: _integer(json['seed'], 'seed'),
      rngState: _integer(json['rng_state'], 'rng_state'),
      ruleVersion: ruleVersion,
    );
    return MergeRescueTraceRecord(
      id: id,
      state: state,
      originSeed: originSeed,
      originMoves: originMoves.map(_direction),
      provenance: MergeRescueProvenance.fromJson(
        provenance.cast<String, Object?>(),
      ),
      difficulty: MergeRescueDifficulty.fromJson(
        difficulty.cast<String, Object?>(),
      ),
    );
  }

  final String id;
  final MergeGameState state;
  final int originSeed;
  final List<MergeDirection> originMoves;
  final MergeRescueProvenance provenance;
  final MergeRescueDifficulty difficulty;

  Map<String, Object?> toJson() => {
    'id': id,
    ...state.toWireJson(),
    'origin_seed': originSeed,
    'origin_moves': originMoves.map((move) => move.name).toList(),
    'provenance': provenance.toJson(),
    'difficulty': difficulty.toJson(),
  };

  String get boardSignature => state.board.cells.join(',');

  static int _integer(Object? value, String name) {
    if (value is! int) throw FormatException('Missing rescue integer $name');
    return value;
  }

  static MergeDirection _direction(Object? value) {
    if (value is! String) {
      throw const FormatException('Invalid rescue origin move');
    }
    return MergeDirection.values.firstWhere(
      (direction) => direction.name == value,
      orElse: () => throw const FormatException('Invalid rescue origin move'),
    );
  }

  static void _validateId(String value) {
    if (value.isEmpty ||
        value.length > 128 ||
        !RegExp(r'^[A-Za-z0-9_.:-]+$').hasMatch(value)) {
      throw ArgumentError.value(value, 'id');
    }
  }
}

String mergeRescueTraceHash({
  required int originSeed,
  required Iterable<MergeDirection> originMoves,
  required MergeGameState state,
  required MergeRuleConfig config,
}) => sha256Hex({
  'algorithm': mergeRescueTraceAlgorithm,
  'origin_seed': originSeed,
  'origin_moves': originMoves.map((move) => move.name).toList(),
  'state': state.toWireJson(),
  'rule_config': config.toJson(),
});
