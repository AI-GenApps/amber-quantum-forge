import 'package:platform_core/platform_core.dart';

import 'merge_board.dart';
import 'merge_config.dart';
import 'merge_game.dart';
import 'merge_replay.dart';
import 'merge_rescue_content.dart';
import 'merge_rules.dart';

final class MergeRescueGenerationSpec {
  const MergeRescueGenerationSpec({
    required this.id,
    required this.originSeed,
    this.originMoveCount = 3,
  });

  final String id;
  final int originSeed;
  final int originMoveCount;
}

final class MergeRescueCatalogReport {
  const MergeRescueCatalogReport({
    required this.recordCount,
    required this.uniqueBoardCount,
    required this.uniqueOriginSeedCount,
    required this.originMoveCounts,
  });

  final int recordCount;
  final int uniqueBoardCount;
  final int uniqueOriginSeedCount;
  final Set<int> originMoveCounts;

  bool get hasBoardVariation => uniqueBoardCount > 1;
}

final class MergeRescueValidationError extends FormatException {
  const MergeRescueValidationError(super.message);
}

final class MergeRescueGenerator {
  const MergeRescueGenerator({this.config = const MergeRuleConfig.legacy()});

  final MergeRuleConfig config;

  MergeRescueTraceRecord generate(MergeRescueGenerationSpec spec) {
    _validateSpec(spec);
    final rules = MergeRules(config: config);
    final initial = MergeGameState.newGame(
      seed: spec.originSeed,
      spawnWeights: config.spawnWeights,
    );
    final chooser = _DirectionChooser(spec.originSeed);
    final moves = <MergeDirection>[];
    var state = initial;
    for (var index = 0; index < spec.originMoveCount; index += 1) {
      final legal = _legalDirections(rules, state);
      if (legal.isEmpty) {
        throw const MergeRescueValidationError(
          'Origin trace reached a terminal state',
        );
      }
      final direction = chooser.choose(legal);
      final result = rules.apply(state, direction);
      if (!result.changed) {
        throw const MergeRescueValidationError('Generator selected a no-op');
      }
      moves.add(direction);
      state = result.state;
    }
    if (state.isTerminal) {
      throw const MergeRescueValidationError(
        'Generated rescue checkpoint is terminal',
      );
    }
    return _record(spec.id, spec.originSeed, moves, state, rules);
  }

  List<MergeRescueTraceRecord> generateCatalog(
    Iterable<MergeRescueGenerationSpec> specs,
  ) {
    final records = specs.map(generate).toList(growable: false);
    validateCatalog(records, rules: MergeRules(config: config));
    return List.unmodifiable(records);
  }
}

MergeRescueCatalogReport validateCatalog(
  Iterable<MergeRescueTraceRecord> records, {
  MergeRules rules = const MergeRules(),
}) {
  final list = records.toList(growable: false);
  if (list.isEmpty) {
    throw const MergeRescueValidationError('Rescue catalog is empty');
  }
  final ids = <String>{};
  final boards = <String>{};
  final seeds = <int>{};
  final lengths = <int>{};
  for (final record in list) {
    if (!ids.add(record.id)) {
      throw const MergeRescueValidationError('Duplicate rescue id');
    }
    _validateRecord(record, rules);
    boards.add(record.boardSignature);
    seeds.add(record.originSeed);
    lengths.add(record.originMoves.length);
  }
  return MergeRescueCatalogReport(
    recordCount: list.length,
    uniqueBoardCount: boards.length,
    uniqueOriginSeedCount: seeds.length,
    originMoveCounts: Set.unmodifiable(lengths),
  );
}

void _validateRecord(MergeRescueTraceRecord record, MergeRules rules) {
  if (record.state.ruleVersion != rules.config.ruleVersion) {
    throw const MergeRescueValidationError('Rescue rule version mismatch');
  }
  late final MergeReplayResult replay;
  try {
    replay = rules.replayFrom(
      MergeGameState.newGame(
        seed: record.originSeed,
        spawnWeights: rules.config.spawnWeights,
      ),
      record.originMoves,
      rejectNoOp: true,
      spawnWeights: rules.config.spawnWeights,
    );
  } on Object catch (error) {
    throw MergeRescueValidationError('Rescue replay is invalid: $error');
  }
  if (!_sameState(replay.finalState, record.state)) {
    throw const MergeRescueValidationError(
      'Rescue checkpoint is not trace-derived',
    );
  }
  final expectedHash = mergeRescueTraceHash(
    originSeed: record.originSeed,
    originMoves: record.originMoves,
    state: record.state,
    config: rules.config,
  );
  if (record.provenance.source != 'deterministic_play_trace' ||
      record.provenance.algorithm != mergeRescueTraceAlgorithm ||
      record.provenance.configRevision != rules.config.revision ||
      !record.provenance.spawnWeights.matches(rules.config.spawnWeights) ||
      record.provenance.traceHash != expectedHash) {
    throw const MergeRescueValidationError('Invalid rescue provenance');
  }
  final expectedDifficulty = _difficulty(
    record.state,
    record.originMoves.length,
    rules,
  );
  if (!_sameDifficulty(record.difficulty, expectedDifficulty)) {
    throw const MergeRescueValidationError('Invalid rescue difficulty');
  }
}

MergeRescueTraceRecord _record(
  String id,
  int originSeed,
  List<MergeDirection> moves,
  MergeGameState state,
  MergeRules rules,
) {
  final provenance = MergeRescueProvenance(
    source: 'deterministic_play_trace',
    algorithm: mergeRescueTraceAlgorithm,
    configRevision: rules.config.revision,
    spawnWeights: rules.config.spawnWeights,
    traceHash: mergeRescueTraceHash(
      originSeed: originSeed,
      originMoves: moves,
      state: state,
      config: rules.config,
    ),
  );
  return MergeRescueTraceRecord(
    id: id,
    state: state,
    originSeed: originSeed,
    originMoves: moves,
    provenance: provenance,
    difficulty: _difficulty(state, moves.length, rules),
  );
}

MergeRescueDifficulty _difficulty(
  MergeGameState state,
  int originMoveCount,
  MergeRules rules,
) {
  final results = MergeDirection.values
      .map((direction) => rules.apply(state, direction))
      .where((result) => result.changed)
      .toList(growable: false);
  final bestScoreDelta = results.isEmpty
      ? 0
      : results
            .map((result) => result.scoreDelta)
            .reduce((first, second) => first > second ? first : second);
  final mergeOptions = results.where((result) => result.scoreDelta > 0).length;
  return MergeRescueDifficulty(
    originMoveCount: originMoveCount,
    checkpointLegalMoves: results.length,
    checkpointMergeOptions: mergeOptions,
    bestScoreDelta: bestScoreDelta,
    filledCells: state.board.cells.where((value) => value != 0).length,
    maxTile: state.board.cells.reduce(
      (maximum, value) => value > maximum ? value : maximum,
    ),
  );
}

bool _sameDifficulty(
  MergeRescueDifficulty first,
  MergeRescueDifficulty second,
) =>
    first.originMoveCount == second.originMoveCount &&
    first.checkpointLegalMoves == second.checkpointLegalMoves &&
    first.checkpointMergeOptions == second.checkpointMergeOptions &&
    first.bestScoreDelta == second.bestScoreDelta &&
    first.filledCells == second.filledCells &&
    first.maxTile == second.maxTile;

bool _sameState(MergeGameState first, MergeGameState second) {
  return first.board.cells.length == second.board.cells.length &&
      first.board.cells.asMap().entries.every(
        (entry) => entry.value == second.board.cells[entry.key],
      ) &&
      first.score == second.score &&
      first.moveCount == second.moveCount &&
      first.seed == second.seed &&
      first.rngState == second.rngState &&
      first.ruleVersion == second.ruleVersion;
}

List<MergeDirection> _legalDirections(MergeRules rules, MergeGameState state) =>
    MergeDirection.values
        .where((direction) => rules.apply(state, direction).changed)
        .toList(growable: false);

void _validateSpec(MergeRescueGenerationSpec spec) {
  if (spec.id.isEmpty ||
      spec.id.length > 128 ||
      !RegExp(r'^[A-Za-z0-9_.:-]+$').hasMatch(spec.id)) {
    throw ArgumentError.value(spec.id, 'id');
  }
  if (spec.originSeed < 0 || spec.originSeed > maxMergeSeed) {
    throw ArgumentError.value(spec.originSeed, 'originSeed');
  }
  if (spec.originMoveCount < 1 || spec.originMoveCount > maxMergeMoves) {
    throw ArgumentError.value(spec.originMoveCount, 'originMoveCount');
  }
}

final class _DirectionChooser {
  _DirectionChooser(int seed) : _rng = DeterministicRng(seed ^ 0xa5a5a5a5);

  final DeterministicRng _rng;

  MergeDirection choose(List<MergeDirection> directions) =>
      directions[_rng.nextInt(directions.length)];
}
