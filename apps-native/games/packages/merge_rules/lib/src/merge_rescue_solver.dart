import 'merge_board.dart';
import 'merge_game.dart';
import 'merge_rules.dart';

const mergeRescueSolverAlgorithm = 'merge-rescue-solver-v1';
const maxMergeRescueSolverMoveBudget = 6;
const defaultMergeRescueSolverNodeCap = 20000;

/// Thrown when a solve exceeds its configured node cap. This is a loud
/// failure by design: a board whose search space cannot be exhausted within
/// the cap must not be silently accepted into the rescue campaign.
final class MergeRescueSolverLimitExceeded extends StateError {
  MergeRescueSolverLimitExceeded(this.nodeCap)
    : super('Merge rescue solver exceeded its node cap ($nodeCap nodes)');

  final int nodeCap;
}

/// The outcome of searching every legal-move sequence of exactly
/// [MergeRescueSolver.solve]'s `moveBudget` length from a checkpoint.
///
/// A "winning line" is a sequence of exactly `moveBudget` legal (board
/// changing) moves whose final score is at or above the target — the same
/// bar the real rescue session/controller uses to mark a run "cleared"
/// (`legalMoves == moveBudget` and `finalState.score >= targetScore`).
/// Because spawns are deterministic from `rng_state`, every move from a
/// given state leads to exactly one successor, so the search tree is fully
/// determined by the checkpoint and the chosen directions.
final class MergeRescueSolverResult {
  const MergeRescueSolverResult({
    required this.solvable,
    required this.winningLine,
    required this.winningLineCount,
    required this.firstReachedDepth,
    required this.nodesExplored,
  });

  /// Whether at least one full-length (`moveBudget`) winning line exists.
  final bool solvable;

  /// A full-length winning line, chosen deterministically among all winning
  /// lines by the smallest depth at which it first reaches the target score
  /// (ties broken by direction order). `null` when [solvable] is false.
  final List<MergeDirection>? winningLine;

  /// The number of distinct full-length winning lines found.
  final int winningLineCount;

  /// The depth (1-based move count) at which [winningLine] first reaches the
  /// target score. `null` when [solvable] is false.
  final int? firstReachedDepth;

  /// The total number of search-tree nodes visited, including the root.
  final int nodesExplored;
}

/// A depth-bounded, deterministic solver for Merge Relay rescue boards.
///
/// Explores every combination of the four directions up to `moveBudget`
/// moves deep (at most 4^moveBudget leaves), pruning branches that are no
/// longer legal (a "no-op" direction, or a terminal board). Because the
/// board's spawns are a pure function of `rng_state`, this exhaustively and
/// exactly decides reachability — there is no hidden randomness to sample.
final class MergeRescueSolver {
  const MergeRescueSolver({
    this.rules = const MergeRules(),
    this.maxNodes = defaultMergeRescueSolverNodeCap,
  });

  final MergeRules rules;
  final int maxNodes;

  MergeRescueSolverResult solve({
    required MergeGameState state,
    required int targetScore,
    required int moveBudget,
  }) {
    if (moveBudget < 1 || moveBudget > maxMergeRescueSolverMoveBudget) {
      throw ArgumentError.value(moveBudget, 'moveBudget');
    }
    if (targetScore < 1) {
      throw ArgumentError.value(targetScore, 'targetScore');
    }
    var nodesExplored = 0;
    var winningLineCount = 0;
    List<MergeDirection>? bestLine;
    int? bestFirstReached;
    final path = <MergeDirection>[];

    void visit(MergeGameState current, int depth, int? firstReached) {
      nodesExplored += 1;
      if (nodesExplored > maxNodes) {
        throw MergeRescueSolverLimitExceeded(maxNodes);
      }
      final reachedNow =
          firstReached ?? (current.score >= targetScore ? depth : null);
      if (depth == moveBudget) {
        if (reachedNow != null) {
          winningLineCount += 1;
          final better =
              bestLine == null ||
              reachedNow < bestFirstReached! ||
              (reachedNow == bestFirstReached! &&
                  _beforeInDirectionOrder(path, bestLine!));
          if (better) {
            bestLine = List.unmodifiable(path);
            bestFirstReached = reachedNow;
          }
        }
        return;
      }
      if (current.isTerminal) return;
      for (final direction in MergeDirection.values) {
        final result = rules.apply(current, direction);
        if (!result.changed) continue;
        path.add(direction);
        visit(result.state, depth + 1, reachedNow);
        path.removeLast();
      }
    }

    visit(state, 0, null);
    return MergeRescueSolverResult(
      solvable: bestLine != null,
      winningLine: bestLine,
      winningLineCount: winningLineCount,
      firstReachedDepth: bestFirstReached,
      nodesExplored: nodesExplored,
    );
  }
}

bool _beforeInDirectionOrder(
  List<MergeDirection> candidate,
  List<MergeDirection> current,
) {
  for (var index = 0; index < candidate.length; index += 1) {
    final candidateRank = candidate[index].index;
    final currentRank = current[index].index;
    if (candidateRank != currentRank) return candidateRank < currentRank;
  }
  return false;
}
