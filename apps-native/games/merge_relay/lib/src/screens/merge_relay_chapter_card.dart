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
/// chapter's ten board nodes. A locked chapter dims to ~40% opacity and
/// swaps its header icon for a lock, per the task's Context/Decisions.
final class MergeRelayChapterCard extends StatelessWidget {
  const MergeRelayChapterCard({
    required this.game,
    required this.theme,
    required this.chapter,
    required this.unlocked,
    required this.clearedCount,
    required this.currentRescueId,
    required this.isLastChapter,
    super.key,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final MergeRelayChapter chapter;
  final bool unlocked;
  final int clearedCount;
  final String? currentRescueId;
  final bool isLastChapter;

  @override
  Widget build(BuildContext context) {
    final card = MrPanel(
      color: unlocked ? theme.paper : MrTokens.paperMuted,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
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
          ),
          const SizedBox(height: 12),
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
                          onTap: unlocked
                              ? () => game.pickRescueFromMap(
                                  game.content.rescues.indexOf(rescue),
                                )
                              : null,
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
            ),
        ],
      ),
    );
    return unlocked ? card : Opacity(opacity: 0.62, child: card);
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
  });

  final MergeRelayTheme theme;
  final int chapter;
  final bool unlocked;
  final int clearedCount;
  final int total;
  final bool isLastChapter;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
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
              ),
              const SizedBox(height: 2),
              Text(
                unlocked
                    ? _unlockedHint(clearedCount, total)
                    : 'Clear $mergeRelayChapterUnlockThreshold of $total in '
                          'Chapter ${chapter - 1} to unlock.',
                style: TextStyle(
                  color: theme.muted,
                  fontSize: 12,
                  height: 1.25,
                ),
              ),
            ],
          ),
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
