import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_app.dart';
import 'merge_relay_board_art.dart';
import 'merge_relay_board_widget.dart';
import 'merge_relay_campaign_progress_panel.dart';
import 'merge_relay_chapter_strip.dart';
import 'merge_relay_controls.dart';
import 'merge_relay_models.dart';
import 'merge_relay_overlays.dart';
import 'merge_relay_play_widgets.dart';
import 'merge_relay_theme.dart';
import 'ui/mr_button.dart';
import 'ui/mr_dialog.dart';
import 'ui/mr_icon_button.dart';
import 'ui/mr_panel.dart';
import 'ui/mr_pill.dart';
import 'ui/mr_tokens.dart';

part 'merge_relay_result_screen.dart';
part 'merge_relay_pause_panel.dart';
part 'merge_relay_play_lower.dart';

/// Merge Relay's Play screen, recomposed task 11 so the board reads as the
/// vertical focal point instead of floating in a large blank band: a
/// compact HUD (goal + score/best/moves) up top, the board sized by width
/// and pinned near the top of its row (not centred in a big `Expanded`,
/// which is what produced the ~20% empty bands the task's review found),
/// and a populated lower area — the current objective/next-tile hint plus
/// a pause strip, or the accessible move controls — filling the rest.
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
      padding: EdgeInsets.fromLTRB(16, compact ? 6 : 12, 16, compact ? 6 : 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _PlayBar(game: game, theme: theme, compact: compact),
          SizedBox(height: compact ? 4 : 8),
          _CompactHud(game: game, theme: theme, compact: compact),
          SizedBox(height: compact ? 4 : 8),
          if (!compact)
            AnimatedSwitcher(
              duration: game.preferences.value.reducedMotion
                  ? Duration.zero
                  : const Duration(milliseconds: 180),
              child: game.feedback.value == null
                  ? const SizedBox(height: 20)
                  : MergeFeedback(text: game.feedback.value!, theme: theme),
            ),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                // Sizes the board by the *actual* space left after the HUD
                // instead of centering a width-derived board inside a big
                // `Expanded` (the old layout, which is what produced ~20%
                // blank bands above/below it — see the task's Context). The
                // lower control tray is capped at a sensible height (a
                // review found the first version let it balloon to over
                // half the screen on a tall device, since it absorbed
                // *every* leftover pixel) — any further leftover becomes
                // top/bottom margin around the board+tray group instead, so
                // no single element ever ends up disproportionate. The
                // board still shrinks first under a tight viewport, so nothing
                // overflows regardless of screen height.
                final gapIdeal = compact ? 8.0 : 14.0;
                final lowerMin = compact ? 96.0 : 128.0;
                final lowerMax = compact ? 168.0 : 216.0;
                final maxBoardSide = constraints.maxWidth < 480
                    ? constraints.maxWidth
                    : 480.0;

                var boardSide = maxBoardSide;
                var gap = gapIdeal;
                var lowerHeight = lowerMax;
                var deficit =
                    boardSide + gap + lowerHeight - constraints.maxHeight;
                if (deficit > 0) {
                  final lowerShrink = deficit < lowerHeight - lowerMin
                      ? deficit
                      : lowerHeight - lowerMin;
                  lowerHeight -= lowerShrink;
                  deficit -= lowerShrink;
                }
                if (deficit > 0) {
                  final gapShrink = deficit < gap - 4 ? deficit : gap - 4;
                  gap -= gapShrink;
                  deficit -= gapShrink;
                }
                if (deficit > 0) {
                  boardSide = (boardSide - deficit).clamp(0.0, maxBoardSide);
                }

                final extra =
                    (constraints.maxHeight - boardSide - gap - lowerHeight)
                        .clamp(0.0, double.infinity);
                final topMargin = extra * 0.4;
                final bottomMargin = extra - topMargin;

                return Stack(
                  children: [
                    Column(
                      children: [
                        SizedBox(height: topMargin),
                        Center(
                          child: SizedBox(
                            width: boardSide,
                            height: boardSide,
                            child: MergeRelayBoard(game: game, theme: theme),
                          ),
                        ),
                        SizedBox(height: gap),
                        SizedBox(
                          height: lowerHeight,
                          width: double.infinity,
                          child: _PlayLowerArea(
                            game: game,
                            theme: theme,
                            compact: compact,
                          ),
                        ),
                        SizedBox(height: bottomMargin),
                      ],
                    ),
                    // Overlays the *entire* board+tray region (task 11
                    // review), not just the board's own square: with 5-6
                    // actions, the pause panel needed more height than the
                    // board alone gives on most screens, and it was
                    // silently clipping "Settings"/"Home" off the bottom
                    // with no visible scroll affordance.
                    if (game.isPaused.value)
                      Positioned(
                        top: topMargin,
                        left: 0,
                        right: 0,
                        bottom: bottomMargin,
                        child: _PausePanel(game: game, theme: theme),
                      ),
                  ],
                );
              },
            ),
          ),
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
        MrIconButton(
          icon: Icons.arrow_back_rounded,
          tooltip: 'Home',
          onPressed: game.openHome,
        ),
        const SizedBox(width: 6),
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
        MrIconButton(
          icon: Icons.pause_rounded,
          tooltip: 'Pause',
          onPressed: game.roundComplete.value
              ? null
              : () => game.setPaused(true),
        ),
        const SizedBox(width: 4),
        MrIconButton(
          icon: Icons.tune_rounded,
          tooltip: 'Settings',
          onPressed: () => showMergeRelaySettings(context, game, theme),
        ),
      ],
    );
  }
}

/// The Play screen's compact HUD (task 11): the current objective directly
/// above the score/best/moves pills, tightened into a single visual block
/// so the board underneath reads as the screen's focal point rather than
/// sharing space with a tall header.
final class _CompactHud extends StatelessWidget {
  const _CompactHud({
    required this.game,
    required this.theme,
    required this.compact,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _GoalCard(game: game, theme: theme, compact: compact),
        SizedBox(height: compact ? 4 : 6),
        MergeRelayScoreStrip(game: game, theme: theme, compact: compact),
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
