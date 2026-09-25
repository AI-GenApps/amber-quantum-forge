import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_campaign.dart';
import 'merge_relay_content.dart';
import 'merge_relay_models.dart';
import 'merge_relay_overlays.dart';
import 'merge_relay_theme.dart';

part 'merge_relay_home_art.dart';
part 'merge_relay_home_widgets.dart';

final class MergeRelayHome extends StatelessWidget {
  const MergeRelayHome({required this.game, required this.theme, super.key});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _HomeBar(game: game, theme: theme),
          if (game.restoreFailed.value) ...[
            const SizedBox(height: 12),
            _RestoreFailure(game: game, theme: theme),
          ],
          const SizedBox(height: 22),
          _HomeHero(game: game, theme: theme),
          if (game.legacyOffer.value) ...[
            const SizedBox(height: 14),
            _LegacyOffer(game: game, theme: theme),
          ],
          const SizedBox(height: 18),
          if (game.hasSavedSession.value)
            _HomeAction(
              icon: Icons.play_arrow_rounded,
              title: game.result.value == null ? 'Continue run' : 'See result',
              subtitle: game.result.value == null
                  ? '${game.mode.value.label} · ${game.state.value.score} points'
                  : '${game.result.value!.outcome.title} · ${game.result.value!.score} points',
              color: theme.ink,
              foreground: theme.paper,
              onTap: game.continueSession,
            ),
          const SizedBox(height: 10),
          _HomeAction(
            icon: Icons.route_rounded,
            title: 'Rescue paths',
            subtitle:
                '${game.completedRescueIds.value.length} of ${game.content.rescues.length} cleared',
            color: theme.blue,
            foreground: Colors.white,
            onTap: () => _pickRescue(context),
          ),
          if (game.features.socialEnabled && game.relayController != null) ...[
            const SizedBox(height: 10),
            _HomeAction(
              icon: Icons.swap_horizontal_circle_rounded,
              title: 'Join a relay',
              subtitle: 'Play a shared challenge',
              color: theme.coral,
              foreground: theme.paper,
              onTap: game.openRelay,
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _SmallAction(
                  icon: Icons.today_rounded,
                  label: 'Daily',
                  subtitle: 'Practice',
                  theme: theme,
                  onTap: () =>
                      game.openPlay(requestedMode: MergeRelayMode.daily),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _SmallAction(
                  icon: Icons.all_inclusive_rounded,
                  label: 'Endless',
                  subtitle: 'Keep going',
                  theme: theme,
                  onTap: () =>
                      game.openPlay(requestedMode: MergeRelayMode.endless),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Future<void> _pickRescue(BuildContext context) async {
    final chapters = game.rescueChapters;
    final selected = await showModalBottomSheet<int>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(18, 4, 18, 22),
          children: [
            Text(
              'Rescue paths',
              style: TextStyle(
                color: theme.ink,
                fontSize: 22,
                fontFamily: 'Fredoka',
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            for (final chapter in chapters) ...[
              _ChapterHeader(
                chapter: chapter,
                unlocked: game.isChapterUnlocked(chapter.chapter),
                clearedCount: game.clearedCountInChapter(chapter.chapter),
                theme: theme,
              ),
              for (final rescue in chapter.boards)
                _RescueTile(
                  game: game,
                  rescue: rescue,
                  theme: theme,
                  onSelected: () => Navigator.pop(
                    context,
                    game.content.rescues.indexOf(rescue),
                  ),
                ),
              const SizedBox(height: 6),
            ],
          ],
        ),
      ),
    );
    if (selected != null) {
      if (!game.tutorialComplete.value) {
        game.openRescue(index: selected);
      } else {
        game.startRescue(index: selected);
      }
    }
  }
}

final class _ChapterHeader extends StatelessWidget {
  const _ChapterHeader({
    required this.chapter,
    required this.unlocked,
    required this.clearedCount,
    required this.theme,
  });

  final MergeRelayChapter chapter;
  final bool unlocked;
  final int clearedCount;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 14, 4, 2),
      child: Row(
        children: [
          if (!unlocked) Icon(Icons.lock_rounded, size: 16, color: theme.muted),
          if (!unlocked) const SizedBox(width: 6),
          Text(
            'Chapter ${chapter.chapter}',
            style: TextStyle(
              color: unlocked ? theme.ink : theme.muted,
              fontSize: 15,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w900,
            ),
          ),
          const Spacer(),
          Text(
            '$clearedCount of ${chapter.boards.length}',
            style: TextStyle(color: theme.muted, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

final class _RescueTile extends StatelessWidget {
  const _RescueTile({
    required this.game,
    required this.rescue,
    required this.theme,
    required this.onSelected,
  });

  final MergeRelayGame game;
  final MergeRescueBoard rescue;
  final MergeRelayTheme theme;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    final unlocked = game.isRescueUnlocked(rescue);
    final cleared = game.completedRescueIds.value.contains(rescue.id);
    return ListTile(
      enabled: unlocked,
      contentPadding: EdgeInsets.zero,
      leading: _PathBadge(index: rescue.indexInChapter - 1, theme: theme),
      title: Text(rescue.title),
      subtitle: Text(
        unlocked ? rescue.objective : 'Clear more of the chapter before this.',
      ),
      trailing: !unlocked
          ? Icon(Icons.lock_rounded, color: theme.muted)
          : cleared
          ? Icon(Icons.check_circle, color: theme.blue)
          : const Icon(Icons.chevron_right),
      onTap: unlocked ? onSelected : null,
    );
  }
}
