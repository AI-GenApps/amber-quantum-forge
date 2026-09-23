import 'merge_models.dart';
import 'merge_board.dart';
import 'merge_config.dart';
import 'merge_game.dart';
import 'merge_rules.dart';
import 'merge_trace.dart';

typedef MergeAttemptResult = MergeReplayResult;

String mergeAttemptOutcomeName(MergeAttemptOutcome outcome) =>
    switch (outcome) {
      MergeAttemptOutcome.inProgress => 'in_progress',
      MergeAttemptOutcome.completed => 'completed',
      MergeAttemptOutcome.earlyFinish => 'early_finish',
      MergeAttemptOutcome.terminal => 'terminal',
    };

final class MergeReplayResult {
  MergeReplayResult({
    required this.initialState,
    required this.finalState,
    required Iterable<MergeMoveTrace> traces,
    required this.outcome,
    this.contentId,
    this.contentVersion,
    this.spawnWeights,
  }) : traces = List.unmodifiable(traces);

  final MergeGameState initialState;
  final MergeGameState finalState;
  final List<MergeMoveTrace> traces;
  final MergeAttemptOutcome outcome;
  final String? contentId;
  final String? contentVersion;
  final MergeSpawnWeights? spawnWeights;

  int get legalMoves => traces.where((trace) => trace.changed).length;

  int get scoreGained => finalState.score - initialState.score;

  int get maxTile => finalState.board.cells.reduce(
    (maximum, value) => value > maximum ? value : maximum,
  );

  MergeCheckpoint? playableChild({
    required String parentChallengeId,
    int maxLegalMoves = 3,
  }) {
    if (finalState.isTerminal) return null;
    return MergeCheckpoint.fromState(
      finalState,
      maxLegalMoves: maxLegalMoves,
      contentId: contentId,
      contentVersion: contentVersion,
      parentChallengeId: parentChallengeId,
      spawnWeights: spawnWeights,
    );
  }

  Map<String, Object?> toJson() => {
    'initial_state': initialState.toWireJson(),
    'final_state': finalState.toWireJson(),
    'moves': traces.map((trace) => trace.direction.name).toList(),
    'legal_moves': legalMoves,
    'score_gained': scoreGained,
    'max_tile': maxTile,
    'outcome': mergeAttemptOutcomeName(outcome),
    'traces': traces.map((trace) => trace.toJson()).toList(),
    if (contentId != null) 'content_id': contentId,
    if (contentVersion != null) 'content_version': contentVersion,
    if (spawnWeights != null) ...spawnWeights!.toJson(),
  };
}

extension MergeRulesReplay on MergeRules {
  MergeGameState replay(int seed, Iterable<MergeDirection> moves) => replayFrom(
    MergeGameState.newGame(seed: seed, spawnWeights: config.spawnWeights),
    moves,
    spawnWeights: config.spawnWeights,
  ).finalState;

  MergeReplayResult replayFrom(
    MergeGameState initialState,
    Iterable<MergeDirection> moves, {
    bool rejectNoOp = false,
    int? maxLegalMoves,
    bool finish = false,
    String? contentId,
    String? contentVersion,
    MergeSpawnWeights? spawnWeights,
  }) {
    if (spawnWeights != null && !spawnWeights.matches(config.spawnWeights)) {
      throw MergeRuleError(
        'config_mismatch',
        'Replay spawn weights do not match the configured rules',
      );
    }
    if (maxLegalMoves != null && (maxLegalMoves < 1 || maxLegalMoves > 3)) {
      throw ArgumentError.value(maxLegalMoves, 'maxLegalMoves');
    }
    var state = initialState;
    final traces = <MergeMoveTrace>[];
    for (final move in moves) {
      if (state.isTerminal) {
        throw MergeRuleError(
          'trailing_move',
          'Replay contains a move after terminal state',
        );
      }
      final result = apply(state, move);
      if (!result.changed && rejectNoOp) {
        throw MergeRuleError('no_op', 'Replay contains a no-op move');
      }
      if (result.changed &&
          maxLegalMoves != null &&
          traces.where((trace) => trace.changed).length >= maxLegalMoves) {
        throw MergeRuleError('over_budget', 'Replay exceeds legal move budget');
      }
      traces.add(result.trace);
      state = result.state;
    }
    final legalMoves = traces.where((trace) => trace.changed).length;
    return MergeReplayResult(
      initialState: initialState,
      finalState: state,
      traces: traces,
      outcome: state.isTerminal
          ? MergeAttemptOutcome.terminal
          : maxLegalMoves != null && legalMoves == maxLegalMoves
          ? MergeAttemptOutcome.completed
          : finish
          ? MergeAttemptOutcome.earlyFinish
          : MergeAttemptOutcome.inProgress,
      contentId: contentId,
      contentVersion: contentVersion,
      spawnWeights: spawnWeights,
    );
  }

  MergeReplayResult replayAttempt(
    MergeCheckpoint checkpoint,
    Iterable<MergeDirection> moves, {
    bool finish = false,
    int? maxLegalMoves,
  }) {
    if (checkpoint.spawnWeights == null &&
        !config.spawnWeights.matches(const MergeSpawnWeights.legacy())) {
      throw MergeRuleError(
        'config_mismatch',
        'Custom replay checkpoints must include spawn weights',
      );
    }
    if (checkpoint.spawnWeights != null &&
        !checkpoint.spawnWeights!.matches(config.spawnWeights)) {
      throw MergeRuleError(
        'config_mismatch',
        'Checkpoint spawn weights do not match the configured rules',
      );
    }
    var state = checkpoint.state;
    final traces = <MergeMoveTrace>[];
    final moveBudget = maxLegalMoves ?? checkpoint.maxLegalMoves;
    if (moveBudget < 1 || moveBudget > 3) {
      throw ArgumentError.value(moveBudget, 'maxLegalMoves');
    }
    for (final move in moves) {
      if (state.isTerminal) {
        throw MergeRuleError(
          'trailing_move',
          'Ranked replay contains a move after terminal state',
        );
      }
      final legalMoves = traces.where((trace) => trace.changed).length;
      if (legalMoves >= moveBudget) {
        throw MergeRuleError(
          'over_budget',
          'Ranked replay exceeds move budget',
        );
      }
      final result = apply(state, move);
      if (!result.changed) {
        throw MergeRuleError('no_op', 'Ranked replay contains a no-op move');
      }
      traces.add(result.trace);
      state = result.state;
    }
    final outcome = state.isTerminal
        ? MergeAttemptOutcome.terminal
        : traces.where((trace) => trace.changed).length == moveBudget
        ? MergeAttemptOutcome.completed
        : finish
        ? MergeAttemptOutcome.earlyFinish
        : MergeAttemptOutcome.inProgress;
    return MergeReplayResult(
      initialState: checkpoint.state,
      finalState: state,
      traces: traces,
      outcome: outcome,
      contentId: checkpoint.contentId,
      contentVersion: checkpoint.contentVersion,
      spawnWeights: checkpoint.spawnWeights,
    );
  }
}
