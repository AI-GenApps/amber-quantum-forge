import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_campaign.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_relay/src/merge_relay_models.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

/// Proves the 60-board, 6-chapter Rescue campaign
/// (`tasks/epics/16-games-portfolio-wave2/06-mr-rescue-campaign-60.md`):
/// every board is solver-provable AND, when the solver's own winning line
/// is replayed through the real rules/session layer and the real
/// `MergeRelayGame` controller, the run actually clears.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late MergeRelayContentCatalog catalog;

  setUpAll(() async {
    catalog = await MergeRelayContentCatalog.load();
  });

  test('exactly 60 boards in 6 chapters of 10, with unique ids', () {
    expect(catalog.rescues, hasLength(60));
    expect(catalog.rescues.map((r) => r.id).toSet(), hasLength(60));
    for (var chapter = 1; chapter <= 6; chapter += 1) {
      final boards = catalog.rescues.where((r) => r.chapter == chapter).toList()
        ..sort((a, b) => a.indexInChapter.compareTo(b.indexInChapter));
      expect(boards, hasLength(10), reason: 'chapter $chapter');
      expect(
        boards.map((b) => b.indexInChapter),
        List.generate(10, (i) => i + 1),
        reason: 'chapter $chapter',
      );
      final expectedBudget = 3 + (chapter - 1) ~/ 2;
      for (final board in boards) {
        expect(board.moveBudget, expectedBudget, reason: board.id);
      }
    }
  });

  test('board 1 of chapter 1 has a winning first move and at least two winning lines', () {
    final board = catalog.rescues.firstWhere(
      (r) => r.chapter == 1 && r.indexInChapter == 1,
    );
    const solver = MergeRescueSolver();
    final result = solver.solve(
      state: board.state,
      targetScore: board.targetScore,
      moveBudget: board.moveBudget,
    );

    expect(result.solvable, isTrue);
    expect(result.firstReachedDepth, 1);
    expect(result.winningLineCount, greaterThanOrEqualTo(2));
  });

  test('every board is solver-proven and replay-proven cleared within its own budget', () async {
    const solver = MergeRescueSolver();
    const rules = MergeRules();
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final game = MergeRelayGame(
      context: context,
      saveStore: MemorySaveStore(),
      content: catalog,
    );
    await game.restore();
    game.completeTutorial(skipped: true);

    for (var index = 0; index < catalog.rescues.length; index += 1) {
      final board = catalog.rescues[index];
      final result = solver.solve(
        state: board.state,
        targetScore: board.targetScore,
        moveBudget: board.moveBudget,
      );
      expect(result.solvable, isTrue, reason: '${board.id} must be solvable');
      final winningLine = result.winningLine!;
      expect(winningLine, hasLength(board.moveBudget), reason: board.id);

      // Pure rules/session replay: exactly the budget's worth of legal
      // moves, never terminal early, and the target is met at the end.
      // (maxLegalMoves is capped at 3 for the ranked-relay path, which
      // rescue does not use; legalMoves is checked explicitly instead.)
      final replay = rules.replayFrom(
        board.state,
        winningLine,
        rejectNoOp: true,
      );
      expect(replay.legalMoves, board.moveBudget, reason: board.id);
      expect(replay.finalState.isTerminal, isFalse, reason: board.id);
      expect(
        replay.finalState.score,
        greaterThanOrEqualTo(board.targetScore),
        reason: board.id,
      );

      // Real game/session controller path.
      game.startRescue(index: index);
      for (final direction in winningLine) {
        game.move(direction);
      }
      expect(
        game.result.value?.outcome,
        MergeRelayOutcome.completed,
        reason: '${board.id} did not clear via the controller path',
      );
      expect(game.result.value?.rescueId, board.id);
    }
    game.dispose();
  });

  test('difficulty rises within each chapter, allowing at most 2 local inversions per metric', () {
    const solver = MergeRescueSolver();
    for (var chapter = 1; chapter <= 6; chapter += 1) {
      final boards = catalog.rescues.where((r) => r.chapter == chapter).toList()
        ..sort((a, b) => a.indexInChapter.compareTo(b.indexInChapter));
      final targets = boards.map((b) => b.targetScore).toList();
      final counts = boards
          .map(
            (b) => solver
                .solve(
                  state: b.state,
                  targetScore: b.targetScore,
                  moveBudget: b.moveBudget,
                )
                .winningLineCount,
          )
          .toList();

      expect(
        _localInversions(targets, ascending: true),
        lessThanOrEqualTo(2),
        reason: 'chapter $chapter target_score should rise (targets=$targets)',
      );
      expect(
        _localInversions(counts, ascending: false),
        lessThanOrEqualTo(2),
        reason:
            'chapter $chapter winning_line_count should fall (counts=$counts)',
      );
    }
  });

  test('rescueChapters groups every board by chapter in order', () {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final game = MergeRelayGame(
      context: context,
      saveStore: MemorySaveStore(),
      content: catalog,
    );
    final chapters = game.rescueChapters;

    expect(chapters, hasLength(6));
    expect(chapters.map((c) => c.chapter), [1, 2, 3, 4, 5, 6]);
    for (final chapter in chapters) {
      expect(chapter.boards, hasLength(10));
      expect(
        chapter.boards.map((b) => b.indexInChapter),
        List.generate(10, (i) => i + 1),
      );
    }
    game.dispose();
  });

  test(
    'a chapter unlocks once 7 of the previous chapter\'s 10 boards are cleared',
    () {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final game = MergeRelayGame(
        context: context,
        saveStore: MemorySaveStore(),
        content: catalog,
      );

      expect(game.isChapterUnlocked(1), isTrue);
      expect(game.isChapterUnlocked(2), isFalse);

      final chapter1 = catalog.rescues.where((r) => r.chapter == 1).toList()
        ..sort((a, b) => a.indexInChapter.compareTo(b.indexInChapter));

      game.completedRescueIds.value = chapter1.take(6).map((r) => r.id).toSet();
      expect(game.clearedCountInChapter(1), 6);
      expect(game.isChapterUnlocked(2), isFalse);
      expect(game.isRescueUnlocked(chapter1.first), isTrue);
      final firstChapter2 = catalog.rescues.firstWhere(
        (r) => r.chapter == 2 && r.indexInChapter == 1,
      );
      expect(game.isRescueUnlocked(firstChapter2), isFalse);

      game.completedRescueIds.value = chapter1.take(7).map((r) => r.id).toSet();
      expect(game.isChapterUnlocked(2), isTrue);
      expect(game.isRescueUnlocked(firstChapter2), isTrue);
      expect(game.isChapterUnlocked(3), isFalse);
      game.dispose();
    },
  );
}

int _localInversions(List<int> values, {required bool ascending}) {
  var inversions = 0;
  for (var index = 1; index < values.length; index += 1) {
    final regressed = ascending
        ? values[index] < values[index - 1]
        : values[index] > values[index - 1];
    if (regressed) inversions += 1;
  }
  return inversions;
}
