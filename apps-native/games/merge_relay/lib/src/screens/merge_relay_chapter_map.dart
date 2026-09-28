import 'package:flutter/material.dart';

import '../merge_relay_app.dart';
import '../merge_relay_campaign.dart';
import '../merge_relay_theme.dart';
import '../ui/mr_icon_button.dart';
import 'merge_relay_chapter_card.dart';

/// The full-screen Rescue campaign map (task 11): one card per chapter,
/// each showing its ten board nodes' cleared/current/locked state. Replaces
/// the earlier "Rescue paths" bottom sheet — opened from Home's Rescue
/// action via `game.openChapterMap()`. Scrolls vertically and opens
/// centred on the chapter holding the player's suggested next board.
final class MergeRelayChapterMap extends StatefulWidget {
  const MergeRelayChapterMap({
    required this.game,
    required this.theme,
    super.key,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  State<MergeRelayChapterMap> createState() => _MergeRelayChapterMapState();
}

final class _MergeRelayChapterMapState extends State<MergeRelayChapterMap> {
  final _scroll = ScrollController();

  /// A rough per-card height estimate (header + two 5-wide node rows +
  /// padding) used only to jump-scroll near the current chapter on open —
  /// it doesn't need to be exact, just close enough that the current
  /// chapter lands on screen without an animated scroll (goldens capture a
  /// single settled frame).
  static const _cardEstimatedHeight = 224.0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _centerCurrentChapter(),
    );
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _centerCurrentChapter() {
    if (!mounted || !_scroll.hasClients) return;
    final chapters = widget.game.rescueChapters;
    final current = widget.game.suggestedRescue;
    final index = current == null
        ? -1
        : chapters.indexWhere((chapter) => chapter.chapter == current.chapter);
    if (index <= 0) return;
    final viewport = _scroll.position.viewportDimension;
    final target = (index * _cardEstimatedHeight) - viewport / 3;
    _scroll.jumpTo(target.clamp(0.0, _scroll.position.maxScrollExtent));
  }

  @override
  Widget build(BuildContext context) {
    final chapters = widget.game.rescueChapters;
    final current = widget.game.suggestedRescue;
    // The single locked chapter that's actually next in line to unlock
    // (fix round 3): chapters unlock strictly in order, so this is just
    // the first one in the list that isn't unlocked yet. `-1` never
    // matches a real chapter number, for the (rare) case every chapter is
    // already unlocked.
    final nextLockedChapter = chapters
        .map((chapter) => chapter.chapter)
        .firstWhere(
          (number) => !widget.game.isChapterUnlocked(number),
          orElse: () => -1,
        );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 4),
          child: Row(
            children: [
              MrIconButton(
                icon: Icons.arrow_back_rounded,
                tooltip: 'Home',
                onPressed: widget.game.openHome,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'RESCUE',
                      style: TextStyle(
                        color: widget.theme.muted,
                        fontSize: 10,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.6,
                      ),
                    ),
                    Text(
                      'Chapter map',
                      style: TextStyle(
                        color: widget.theme.ink,
                        fontSize: 20,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            controller: _scroll,
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 14),
            itemCount: chapters.length,
            itemBuilder: (context, index) {
              final chapter = chapters[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: MergeRelayChapterCard(
                  game: widget.game,
                  theme: widget.theme,
                  chapter: chapter,
                  unlocked: widget.game.isChapterUnlocked(chapter.chapter),
                  clearedCount: widget.game.clearedCountInChapter(
                    chapter.chapter,
                  ),
                  currentRescueId: current?.id,
                  isLastChapter: index == chapters.length - 1,
                  showUnlockHint: chapter.chapter == nextLockedChapter,
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
