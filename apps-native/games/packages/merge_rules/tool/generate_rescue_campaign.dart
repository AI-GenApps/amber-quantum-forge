import 'dart:convert';
import 'dart:io';

import 'package:merge_rules/merge_rules.dart';

import 'rescue_campaign_content.dart';

const _chaptersCount = 6;
const _boardsPerChapter = 10;
const _goalRevision = 'MR-GOALS-2';
const _searchAttempts = 80;
const _achievableScoreNodeCap = 20000;

/// Chapter N allows a move budget of 3 + floor((N-1)/2): 3,3,4,4,5,5.
int moveBudgetForChapter(int chapter) => 3 + (chapter - 1) ~/ 2;

Future<void> main(List<String> args) async {
  if (args.length > 1) {
    stderr.writeln(
      'Usage: dart run tool/generate_rescue_campaign.dart [output.json]',
    );
    exitCode = 64;
    return;
  }
  const generator = MergeRescueGenerator();
  const rules = MergeRules();
  const solver = MergeRescueSolver();
  final boards = <Map<String, Object?>>[];

  for (var chapter = 1; chapter <= _chaptersCount; chapter += 1) {
    final moveBudget = moveBudgetForChapter(chapter);
    final chapterSpec = rescueCampaignChapters[chapter - 1];
    int? previousTarget;
    int? previousCount;
    for (
      var indexInChapter = 1;
      indexInChapter <= _boardsPerChapter;
      indexInChapter += 1
    ) {
      final built = _buildBoard(
        generator: generator,
        rules: rules,
        solver: solver,
        chapter: chapter,
        indexInChapter: indexInChapter,
        moveBudget: moveBudget,
        spec: chapterSpec.boards[indexInChapter - 1],
        minimumTarget: previousTarget,
        maximumWinningLineCount: previousCount,
      );
      boards.add(built.json);
      previousTarget = built.targetScore;
      previousCount = built.winningLineCount;
    }
  }

  final output = {
    'content_version': 'MR-CONTENT-1',
    'rule_version': mergeRuleVersion,
    'schema_version': 1,
    'rule_config': const MergeRuleConfig.legacy().toJson(),
    'generator': {'algorithm': mergeRescueTraceAlgorithm},
    'campaign': {
      'chapters': _chaptersCount,
      'boards_per_chapter': _boardsPerChapter,
      'move_budget_formula': '3 + floor((chapter-1)/2)',
      'solver_algorithm': mergeRescueSolverAlgorithm,
    },
    'rescue_boards': boards,
  };
  final encoded = '${const JsonEncoder.withIndent('  ').convert(output)}\n';
  if (args.length == 1) {
    await File(args.first).writeAsString(encoded);
  } else {
    stdout.write(encoded);
  }
}

final class _BuiltBoard {
  const _BuiltBoard({
    required this.json,
    required this.targetScore,
    required this.winningLineCount,
  });

  final Map<String, Object?> json;
  final int targetScore;
  final int winningLineCount;
}

final class _Candidate {
  const _Candidate({
    required this.record,
    required this.target,
    required this.result,
    required this.tier,
    required this.rankDiff,
  });

  final MergeRescueTraceRecord record;
  final int target;
  final MergeRescueSolverResult result;

  /// 0 = meets both the target floor and the winning-line-count ceiling;
  /// 1 = meets the target floor only; 2 = meets neither (last resort).
  final int tier;
  final int rankDiff;
}

/// Generates several candidate checkpoints for this slot (different origin
/// seeds) and keeps the one whose difficulty best continues the chapter's
/// non-decreasing target-score / non-increasing winning-line-count trend,
/// searching across candidates rather than settling for the first that
/// merely happens to be solvable.
_BuiltBoard _buildBoard({
  required MergeRescueGenerator generator,
  required MergeRules rules,
  required MergeRescueSolver solver,
  required int chapter,
  required int indexInChapter,
  required int moveBudget,
  required MergeRescueBoardSpec spec,
  required int? minimumTarget,
  required int? maximumWinningLineCount,
}) {
  final baseSeed = chapter * 10000 + indexInChapter * 100 + 7;
  final originMoveCount = (2 + indexInChapter + (chapter - 1)).clamp(2, 18);
  final isOpeningBoard = chapter == 1 && indexInChapter == 1;

  _Candidate? best;
  for (var attempt = 0; attempt < _searchAttempts; attempt += 1) {
    final seed = baseSeed + attempt * 97;
    MergeRescueTraceRecord record;
    try {
      record = generator.generate(
        MergeRescueGenerationSpec(
          id: spec.id,
          originSeed: seed,
          originMoveCount: originMoveCount,
        ),
      );
    } on Object {
      continue;
    }

    if (isOpeningBoard) {
      final selection = _openingSelection(
        rules: rules,
        solver: solver,
        state: record.state,
      );
      if (selection == null) continue;
      if (selection.value.firstReachedDepth == 1 &&
          selection.value.winningLineCount >= 2) {
        return _finish(
          record: record,
          target: selection.key,
          result: selection.value,
          spec: spec,
          chapter: chapter,
          indexInChapter: indexInChapter,
          moveBudget: moveBudget,
        );
      }
      continue;
    }

    final candidate = _bestRankedCandidate(
      rules: rules,
      solver: solver,
      record: record,
      moveBudget: moveBudget,
      rank: indexInChapter,
      minimumTarget: minimumTarget,
      maximumWinningLineCount: maximumWinningLineCount,
    );
    if (candidate == null) continue;
    if (best == null ||
        candidate.tier < best.tier ||
        (candidate.tier == best.tier && candidate.rankDiff < best.rankDiff)) {
      best = candidate;
      if (candidate.tier == 0 && candidate.rankDiff == 0) break;
    }
  }
  if (best == null) {
    throw StateError(
      'Could not generate a valid board for ${spec.id} '
      '(chapter $chapter, index $indexInChapter)',
    );
  }
  return _finish(
    record: best.record,
    target: best.target,
    result: best.result,
    spec: spec,
    chapter: chapter,
    indexInChapter: indexInChapter,
    moveBudget: moveBudget,
  );
}

_BuiltBoard _finish({
  required MergeRescueTraceRecord record,
  required int target,
  required MergeRescueSolverResult result,
  required MergeRescueBoardSpec spec,
  required int chapter,
  required int indexInChapter,
  required int moveBudget,
}) {
  return _BuiltBoard(
    json: {
      ...record.toJson(),
      'title': spec.title,
      'subtitle': spec.subtitle,
      'objective': 'Reach $target points.',
      'goal_revision': _goalRevision,
      'target_score': target,
      'chapter': chapter,
      'index_in_chapter': indexInChapter,
      'move_budget': moveBudget,
      'solver': {
        'algorithm': mergeRescueSolverAlgorithm,
        'winning_line': result.winningLine!
            .map((direction) => direction.name)
            .toList(),
        'winning_line_count': result.winningLineCount,
        'first_reached_depth': result.firstReachedDepth,
        'nodes_explored': result.nodesExplored,
      },
    },
    targetScore: target,
    winningLineCount: result.winningLineCount,
  );
}

/// The campaign's very first board must be solvable in one obvious move
/// with multiple winning lines remaining — pick the smallest score reached
/// by a single merging move.
MapEntry<int, MergeRescueSolverResult>? _openingSelection({
  required MergeRules rules,
  required MergeRescueSolver solver,
  required MergeGameState state,
}) {
  int? target;
  for (final direction in MergeDirection.values) {
    final result = rules.apply(state, direction);
    if (!result.changed || result.scoreDelta <= 0) continue;
    if (target == null || result.state.score < target)
      target = result.state.score;
  }
  if (target == null) return null;
  final result = solver.solve(state: state, targetScore: target, moveBudget: 3);
  return result.solvable ? MapEntry(target, result) : null;
}

/// Evaluates every achievable target score for one candidate checkpoint and
/// keeps the best (target, result) pair for that checkpoint alone, tagged
/// with a tier so the caller can compare it against other checkpoints:
/// tier 0 meets both the target floor and the winning-line-count ceiling
/// (continuing the chapter's non-decreasing-difficulty trend), tier 1 meets
/// the floor only, tier 2 meets neither.
_Candidate? _bestRankedCandidate({
  required MergeRules rules,
  required MergeRescueSolver solver,
  required MergeRescueTraceRecord record,
  required int moveBudget,
  required int rank,
  required int? minimumTarget,
  required int? maximumWinningLineCount,
}) {
  final state = record.state;
  final candidateScores = _achievableScores(
    rules,
    state,
    moveBudget,
  ).where((score) => score > state.score).toList()..sort();
  if (candidateScores.isEmpty) return null;
  final rankPosition =
      ((rank - 1) * (candidateScores.length - 1) / (_boardsPerChapter - 1))
          .round()
          .clamp(0, candidateScores.length - 1);
  final rankTarget = candidateScores[rankPosition];

  _Candidate? best;
  for (final score in candidateScores) {
    final result = solver.solve(
      state: state,
      targetScore: score,
      moveBudget: moveBudget,
    );
    if (!result.solvable) continue;
    final meetsFloor = minimumTarget == null || score >= minimumTarget;
    final meetsCeiling =
        maximumWinningLineCount == null ||
        result.winningLineCount <= maximumWinningLineCount;
    final tier = meetsFloor && meetsCeiling ? 0 : (meetsFloor ? 1 : 2);
    final rankDiff = (score - rankTarget).abs();
    if (best == null ||
        tier < best.tier ||
        (tier == best.tier && rankDiff < best.rankDiff)) {
      best = _Candidate(
        record: record,
        target: score,
        result: result,
        tier: tier,
        rankDiff: rankDiff,
      );
    }
  }
  return best;
}

/// All distinct final scores reachable by some full-length (== moveBudget)
/// sequence of legal moves from [state].
Set<int> _achievableScores(
  MergeRules rules,
  MergeGameState state,
  int moveBudget,
) {
  final scores = <int>{};
  var nodes = 0;
  void visit(MergeGameState current, int depth) {
    nodes += 1;
    if (nodes > _achievableScoreNodeCap) {
      throw StateError('Achievable-score scan exceeded its node cap');
    }
    if (depth == moveBudget) {
      scores.add(current.score);
      return;
    }
    if (current.isTerminal) return;
    for (final direction in MergeDirection.values) {
      final result = rules.apply(current, direction);
      if (!result.changed) continue;
      visit(result.state, depth + 1);
    }
  }

  visit(state, 0);
  return scores;
}
