import 'merge_relay_content.dart';
import 'merge_relay_game.dart';

/// Chapter N+1 unlocks once at least this many of chapter N's boards
/// (out of [mergeRelayBoardsPerChapter]) have been cleared.
const mergeRelayChapterUnlockThreshold = 7;
const mergeRelayBoardsPerChapter = 10;

/// Groups the Rescue campaign into ordered chapters and exposes the
/// progression/unlock rules described in
/// `tasks/epics/16-games-portfolio-wave2/06-mr-rescue-campaign-60.md`:
/// chapter N+1 unlocks once 7 of chapter N's 10 boards are cleared.
extension MergeRelayCampaign on MergeRelayGame {
  /// Rescue boards grouped by chapter, each chapter's boards ordered by
  /// `indexInChapter`. Chapters appear in ascending order.
  List<MergeRelayChapter> get rescueChapters {
    final byChapter = <int, List<MergeRescueBoard>>{};
    for (final rescue in content.rescues) {
      (byChapter[rescue.chapter] ??= <MergeRescueBoard>[]).add(rescue);
    }
    final chapters = byChapter.keys.toList()..sort();
    return [
      for (final chapter in chapters)
        MergeRelayChapter(
          chapter: chapter,
          boards: byChapter[chapter]!
            ..sort((a, b) => a.indexInChapter.compareTo(b.indexInChapter)),
        ),
    ];
  }

  int clearedCountInChapter(int chapter) => content.rescues
      .where(
        (rescue) =>
            rescue.chapter == chapter &&
            completedRescueIds.value.contains(rescue.id),
      )
      .length;

  /// Chapter 1 is always unlocked; chapter N+1 unlocks once
  /// [mergeRelayChapterUnlockThreshold] boards of chapter N are cleared.
  bool isChapterUnlocked(int chapter) {
    if (chapter <= 1) return true;
    return clearedCountInChapter(chapter - 1) >=
        mergeRelayChapterUnlockThreshold;
  }

  bool isRescueUnlocked(MergeRescueBoard rescue) =>
      isChapterUnlocked(rescue.chapter);
}

final class MergeRelayChapter {
  const MergeRelayChapter({required this.chapter, required this.boards});

  final int chapter;
  final List<MergeRescueBoard> boards;
}
