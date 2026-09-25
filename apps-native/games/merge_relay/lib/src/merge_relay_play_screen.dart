import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_board_widget.dart';
import 'merge_relay_controls.dart';
import 'merge_relay_models.dart';
import 'merge_relay_overlays.dart';
import 'merge_relay_play_widgets.dart';
import 'merge_relay_theme.dart';
import 'ui/mr_tokens.dart';

part 'merge_relay_result_screen.dart';
part 'merge_relay_pause_panel.dart';

final class MergeRelayPlayScreen extends StatelessWidget {
  const MergeRelayPlayScreen({
    required this.game,
    required this.theme,
    super.key,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final compact = size.width < 380 || size.height < 560;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, compact ? 6 : 12, 16, compact ? 6 : 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _PlayBar(game: game, theme: theme, compact: compact),
          SizedBox(height: compact ? 4 : 10),
          _GoalCard(game: game, theme: theme, compact: compact),
          SizedBox(height: compact ? 4 : 10),
          MergeRelayScoreStrip(game: game, theme: theme, compact: compact),
          if (!compact) const SizedBox(height: 8),
          if (!compact)
            AnimatedSwitcher(
              duration: game.preferences.value.reducedMotion
                  ? Duration.zero
                  : const Duration(milliseconds: 180),
              child: game.feedback.value == null
                  ? const SizedBox(height: 24)
                  : MergeFeedback(text: game.feedback.value!, theme: theme),
            ),
          Expanded(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: AspectRatio(
                  aspectRatio: 1,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      MergeRelayBoard(game: game, theme: theme),
                      if (game.isPaused.value)
                        _PausePanel(game: game, theme: theme),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (!compact) const SizedBox(height: 8),
          if (game.preferences.value.accessibleControls)
            MergeMoveControls(
              game: game,
              enabled:
                  game.hydrated.value &&
                  !game.roundComplete.value &&
                  !game.isPaused.value,
              theme: theme,
            )
          else if (!compact)
            Text(
              'Swipe the board to move',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: theme.muted,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          if (game.persistenceMessage.value != null) ...[
            const SizedBox(height: 4),
            Text(
              game.persistenceMessage.value!,
              textAlign: TextAlign.center,
              style: TextStyle(color: theme.coral, fontSize: 11),
            ),
          ],
        ],
      ),
    );
  }
}

final class _PlayBar extends StatelessWidget {
  const _PlayBar({
    required this.game,
    required this.theme,
    required this.compact,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final title = game.mode.value == MergeRelayMode.rescue
        ? game.currentRescue.title
        : game.mode.value.label;
    return Row(
      children: [
        IconButton(
          onPressed: game.openHome,
          tooltip: 'Home',
          icon: Icon(Icons.arrow_back_rounded, color: theme.ink),
        ),
        const SizedBox(width: 2),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!compact)
                Text(
                  game.mode.value.label.toUpperCase(),
                  style: TextStyle(
                    color: theme.muted,
                    fontSize: 10,
                    fontFamily: 'Fredoka',
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                  ),
                ),
              Text(
                title,
                maxLines: compact ? 1 : 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: theme.ink,
                  fontSize: compact ? 17 : 22,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w900,
                  height: 1.05,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: game.roundComplete.value
              ? null
              : () => game.setPaused(true),
          tooltip: 'Pause',
          icon: Icon(Icons.pause_rounded, color: theme.ink),
        ),
        IconButton(
          onPressed: () => showMergeRelaySettings(context, game, theme),
          tooltip: 'Settings',
          icon: Icon(Icons.tune_rounded, color: theme.ink),
        ),
      ],
    );
  }
}

final class _GoalCard extends StatelessWidget {
  const _GoalCard({
    required this.game,
    required this.theme,
    required this.compact,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final copy = game.currentObjective;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.paper.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: theme.ink.withValues(alpha: 0.1)),
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 10 : 13,
          vertical: compact ? 6 : 9,
        ),
        child: Row(
          children: [
            Icon(
              Icons.flag_rounded,
              color: theme.coral,
              size: compact ? 16 : 18,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                copy,
                style: TextStyle(
                  color: theme.ink,
                  fontWeight: FontWeight.w800,
                  fontSize: compact ? 12 : 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
