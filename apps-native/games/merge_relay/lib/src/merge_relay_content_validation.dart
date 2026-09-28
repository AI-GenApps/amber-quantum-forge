import 'dart:convert';

import 'package:merge_rules/merge_rules.dart';

/// The widest rescue move budget the campaign ramp can assign (chapter 6:
/// 3 + floor((6-1)/2) = 5), plus headroom matching the solver's own cap.
const mergeRelayMaxRescueMoveBudget = maxMergeRescueSolverMoveBudget;

final class MergeRelayGoalValidation {
  const MergeRelayGoalValidation({
    required this.reachable,
    required this.shortestPath,
  });

  final bool reachable;
  final int? shortestPath;
}

MergeRelayGoalValidation validateMergeRelayGoal({
  required MergeGameState state,
  required int targetScore,
  MergeRules rules = const MergeRules(),
  int maxMoves = 3,
}) {
  if (targetScore <= state.score ||
      maxMoves < 1 ||
      maxMoves > mergeRelayMaxRescueMoveBudget) {
    return const MergeRelayGoalValidation(reachable: false, shortestPath: null);
  }
  final queue = <(MergeGameState, int)>[(state, 0)];
  final seen = <String>{jsonEncode(state.toWireJson())};
  while (queue.isNotEmpty) {
    final (current, depth) = queue.removeAt(0);
    if (depth == maxMoves) continue;
    for (final direction in MergeDirection.values) {
      final result = rules.apply(current, direction);
      if (!result.changed) continue;
      final nextDepth = depth + 1;
      if (result.state.score >= targetScore) {
        return MergeRelayGoalValidation(
          reachable: true,
          shortestPath: nextDepth,
        );
      }
      final key = jsonEncode(result.state.toWireJson());
      if (seen.add(key)) queue.add((result.state, nextDepth));
    }
  }
  return const MergeRelayGoalValidation(reachable: false, shortestPath: null);
}
