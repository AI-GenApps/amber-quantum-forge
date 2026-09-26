import 'package:flutter/material.dart';

import '../merge_relay_app.dart';
import '../merge_relay_campaign.dart';
import '../merge_relay_content.dart';
import '../merge_relay_theme.dart';
import '../ui/mr_panel.dart';
import '../ui/mr_tokens.dart';
import 'merge_relay_chapter_node.dart';

/// One chapter's card on the Rescue chapter map (task 11): a header (title,
/// cleared count, and the unlock-rule hint) plus a 5x2 grid of the
/// chapter's ten board nodes. A locked chapter dims to ~40% opacity, swaps
/// its header icon for a lock, and collapses its node grid to a single row
/// of small pips (fix round 1: the full two-row grid on every one of the
/// six chapters made the map so tall that chapters 5-6 never fit in the
/// 1080x2400 golden — a compact locked card is the fix the review asked
/// for over a second "scrolled" golden). Fix round 3: the unlock rule is
/// visible again, but only on [showUnlockHint] — the one locked chapter
/// that's actually next in line — so the other locked cards stay compact.
final class MergeRelayChapterCard extends StatelessWidget {
  const MergeRelayChapterCard({
    required this.game,
    required this.theme,
    required this.chapter,
    required this.unlocked,
    required this.clearedCount,
    required this.currentRescueId,
    required this.isLastChapter,
    required this.showUnlockHint,
    super.key,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final MergeRelayChapter chapter;
  final bool unlocked;
  final int clearedCount;
  final String? currentRescueId;
  final bool isLastChapter;
  final bool showUnlockHint;

  @override
  Widget build(BuildContext context) {
    final card = MrPanel(
      color: unlocked ? theme.paper : MrTokens.paperMuted,
      padding: EdgeInsets.fromLTRB(
        16,
        unlocked ? 14 : 10,
        16,
        unlocked ? 16 : 10,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Header(
            theme: theme,
            chapter: chapter.chapter,
            unlocked: unlocked,
            clearedCount: clearedCount,
            total: chapter.boards.length,
            isLastChapter: isLastChapter,
            showHint: unlocked || showUnlockHint,
          ),
          SizedBox(height: unlocked ? 12 : 8),
          if (unlocked)
            for (final row in _rowsOf(chapter.boards, 5))
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    for (final rescue in row) ...[
                      Expanded(
                        child: AspectRatio(
                          aspectRatio: 1,
                          child: MergeRelayChapterNode(
                            theme: theme,
                            rescue: rescue,
                            unlocked: unlocked,
                            cleared: game.completedRescueIds.value.contains(
                              rescue.id,
                            ),
                            current: rescue.id == currentRescueId,
                            onTap: () => game.pickRescueFromMap(
                              game.content.rescues.indexOf(rescue),
                            ),
                          ),
                        ),
                      ),
                      if (rescue != row.last) const SizedBox(width: 8),
                    ],
                    if (row.length < 5)
                      for (var i = row.length; i < 5; i += 1) ...[
                        const SizedBox(width: 8),
                        const Expanded(child: SizedBox.shrink()),
                      ],
                  ],
                ),
              )
          else
            _LockedBoardsPreview(theme: theme, count: chapter.boards.length),
        ],
      ),
    );
    return unlocked ? card : Opacity(opacity: 0.62, child: card);
  }
}

/// A single row of small pips standing in for a locked chapter's ten
/// boards — same information (there are 10 boards, none reachable yet)
/// as the full node grid, at a fraction of the height.
final class _LockedBoardsPreview extends StatelessWidget {
  const _LockedBoardsPreview({required this.theme, required this.count});

  final MergeRelayTheme theme;
  final int count;

  @override
  Widget build(BuildContext context) {
    // Fixed-size dots (task 11 fix round 1): the first attempt wrapped each
    // dot in `Expanded` + `AspectRatio`, but `Expanded` hands its child a
    // *tight* width, which forces `AspectRatio` to derive a matching
    // height and ignore this row's own height constraint — the "pips"
    // rendered at full node size (~90px) instead of the intended ~10px,
    // defeating the whole point of a compact locked card.
    return SizedBox(
      height: 10,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          for (var i = 0; i < count; i += 1)
            DecoratedBox(
              decoration: BoxDecoration(
                color: theme.muted.withValues(alpha: 0.4),
                shape: BoxShape.circle,
              ),
              child: const SizedBox(width: 10, height: 10),
            ),
        ],
      ),
    );
  }
}

final class _Header extends StatelessWidget {
  const _Header({
    required this.theme,
    required this.chapter,
    required this.unlocked,
    required this.clearedCount,
    required this.total,
    required this.isLastChapter,
    required this.showHint,
  });

  final MergeRelayTheme theme;
  final int chapter;
  final bool unlocked;
  final int clearedCount;
  final int total;
  final bool isLastChapter;

  /// Whether the unlock-rule/progress line renders as a second visible
  /// text row (unlocked chapters always show their own progress line; a
  /// locked chapter shows it only when this is the one chapter that's
  /// next in line to unlock).
  final bool showHint;

  @override
  Widget build(BuildContext context) {
    final hint = unlocked
        ? _unlockedHint(clearedCount, total)
        : 'Clear $mergeRelayChapterUnlockThreshold of $total in '
              'Chapter ${chapter - 1} to unlock.';
    final titleRow = Row(
      children: [
        if (!unlocked) ...[
          Icon(Icons.lock_rounded, size: 15, color: theme.muted),
          const SizedBox(width: 5),
        ],
        Text(
          'Chapter $chapter',
          style: TextStyle(
            color: unlocked ? theme.ink : theme.muted,
            fontSize: 17,
            fontFamily: 'Fredoka',
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
    return Semantics(
      // Every other locked card (not the one that's next to unlock) drops
      // the hint's own text row to stay compact (fix round 1: six full
      // -height cards didn't fit the golden's 1080x2400 frame) — kept here
      // for screen readers/tooltips rather than dropped outright.
      label: showHint ? null : hint,
      child: Tooltip(
        message: showHint ? '' : hint,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: showHint
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        titleRow,
                        const SizedBox(height: 2),
                        Text(
                          hint,
                          style: TextStyle(
                            color: theme.muted,
                            fontSize: 12,
                            height: 1.25,
                          ),
                        ),
                      ],
                    )
                  : titleRow,
            ),
            Text(
              '$clearedCount/$total',
              style: TextStyle(
                color: unlocked ? theme.blue : theme.muted,
                fontSize: 15,
                fontFamily: 'Fredoka',
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _unlockedHint(int clearedCount, int total) {
    if (clearedCount >= total) return 'Every path cleared.';
    if (isLastChapter) return 'The final chapter.';
    return clearedCount >= mergeRelayChapterUnlockThreshold
        ? 'The next chapter is unlocked.'
        : 'Clear $mergeRelayChapterUnlockThreshold of $total to unlock '
              'the next chapter.';
  }
}

/// Splits [boards] into fixed-size rows (the last row may be shorter) so
/// the map always lays out a stable 5-wide grid regardless of screen width
/// — a `Wrap` would reflow unpredictably at small widths/large text scale.
List<List<MergeRescueBoard>> _rowsOf(List<MergeRescueBoard> boards, int width) {
  return [
    for (var i = 0; i < boards.length; i += width)
      boards.sublist(i, i + width > boards.length ? boards.length : i + width),
  ];
}
