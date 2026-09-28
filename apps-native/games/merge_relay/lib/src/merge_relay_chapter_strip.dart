import 'package:flutter/material.dart';

import 'merge_relay_app.dart';
import 'merge_relay_campaign.dart';
import 'merge_relay_theme.dart';
import 'ui/mr_panel.dart';
import 'ui/mr_tokens.dart';

/// A one-glance preview of all 6 chapters (task 11): each dot is cleared
/// (blue, check), current (coral ring — the chapter holding the suggested
/// next board), locked (dim, lock icon), or open (plain, cleared count).
/// Tapping any dot opens the full chapter map. Shared by Home's footer and
/// the Result screen's footer (both need a composed, non-empty lower area).
final class MergeRelayChapterStrip extends StatelessWidget {
  const MergeRelayChapterStrip({
    required this.game,
    required this.theme,
    super.key,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    final chapters = game.rescueChapters;
    final currentChapter = game.suggestedRescue?.chapter;
    return MrPanel(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      border: Border.all(color: theme.ink.withValues(alpha: 0.1)),
      shadow: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Chapters',
            style: TextStyle(
              color: theme.ink,
              fontFamily: 'Fredoka',
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              for (final chapter in chapters) ...[
                Expanded(
                  child: _ChapterDot(
                    theme: theme,
                    number: chapter.chapter,
                    unlocked: game.isChapterUnlocked(chapter.chapter),
                    cleared:
                        game.clearedCountInChapter(chapter.chapter) ==
                        chapter.boards.length,
                    current: chapter.chapter == currentChapter,
                    onTap: game.openChapterMap,
                  ),
                ),
                if (chapter != chapters.last) const SizedBox(width: 8),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

final class _ChapterDot extends StatelessWidget {
  const _ChapterDot({
    required this.theme,
    required this.number,
    required this.unlocked,
    required this.cleared,
    required this.current,
    required this.onTap,
  });

  final MergeRelayTheme theme;
  final int number;
  final bool unlocked;
  final bool cleared;
  final bool current;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final background = cleared
        ? theme.blue
        : unlocked
        ? MrTokens.paperMuted
        : MrTokens.paperMuted.withValues(alpha: 0.5);
    final foreground = cleared
        ? Colors.white
        : unlocked
        ? theme.ink
        : theme.muted;
    return GestureDetector(
      onTap: onTap,
      child: AspectRatio(
        aspectRatio: 1,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: background,
            shape: BoxShape.circle,
            border: current ? Border.all(color: theme.coral, width: 2.5) : null,
          ),
          child: Center(
            child: !unlocked
                ? Icon(Icons.lock_rounded, size: 15, color: foreground)
                : cleared
                ? Icon(Icons.check_rounded, size: 16, color: foreground)
                : Text(
                    '$number',
                    style: TextStyle(
                      color: foreground,
                      fontFamily: 'Fredoka',
                      fontWeight: FontWeight.w800,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}
