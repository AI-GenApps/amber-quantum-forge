part of 'merge_relay_play_screen.dart';

/// The Play screen's lower area (task 11, reworked in fix round 1): a
/// full-bleed card in the board tray's own colour (so it reads as a
/// control tray continuing the board downward, not as background) holding
/// a mode-specific insight (goal progress for Rescue/Daily, best-tile/
/// next-milestone for Endless — all derived from data the game already
/// tracks, no new mechanics), a Restart/Settings quick-action row that
/// duplicates the pause menu without requiring a trip through Pause, and
/// either the accessible move controls or the swipe hint. Round 1 review:
/// the original version was just an icon and one line of text in a ~27%
/// -tall panel — this fills the same space with content a player would
/// actually use.
final class _PlayLowerArea extends StatelessWidget {
  const _PlayLowerArea({
    required this.game,
    required this.theme,
    required this.compact,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.board,
        borderRadius: BorderRadius.circular(MrTokens.radiusLarge),
        border: Border.all(color: theme.ink.withValues(alpha: 0.08)),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: 16,
            vertical: compact ? 8 : 14,
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: (constraints.maxHeight - (compact ? 16 : 28)).clamp(
                0,
                double.infinity,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _PlayInsight(game: game, theme: theme, compact: compact),
                SizedBox(height: compact ? 8 : 12),
                _QuickActionsRow(game: game, theme: theme, compact: compact),
                SizedBox(height: compact ? 8 : 12),
                if (game.preferences.value.accessibleControls)
                  MergeMoveControls(
                    game: game,
                    enabled:
                        game.hydrated.value &&
                        !game.roundComplete.value &&
                        !game.isPaused.value,
                    theme: theme,
                  )
                else
                  _SwipeHint(theme: theme, compact: compact),
                if (game.persistenceMessage.value != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    game.persistenceMessage.value!,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: theme.coral, fontSize: 11),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Picks the mode-specific insight — every value here already exists on
/// [MergeRelayGame]/[MergeGameState]; nothing new is computed for gameplay.
final class _PlayInsight extends StatelessWidget {
  const _PlayInsight({
    required this.game,
    required this.theme,
    required this.compact,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return switch (game.mode.value) {
      MergeRelayMode.rescue || MergeRelayMode.daily => _GoalProgressInsight(
        game: game,
        theme: theme,
        compact: compact,
      ),
      MergeRelayMode.endless => _EndlessInsight(
        game: game,
        theme: theme,
        compact: compact,
      ),
    };
  }
}

/// Rescue: progress toward the board's target score. Daily: progress
/// through its fixed 3-move chain (see `_updateCompletion`'s daily rule).
/// Both are "current / target, with a bar and a moves-to-go caption" —
/// the same shape with different units — so one widget covers both.
final class _GoalProgressInsight extends StatelessWidget {
  const _GoalProgressInsight({
    required this.game,
    required this.theme,
    required this.compact,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final isDaily = game.mode.value == MergeRelayMode.daily;
    final target = isDaily ? 3 : game.currentTargetScore;
    final current = isDaily
        ? game.state.value.moveCount.clamp(0, 3)
        : game.state.value.score;
    final label = isDaily ? "Today's chain" : 'Goal progress';
    final unit = isDaily ? 'moves' : 'points';
    if (target == null || target <= 0) {
      // A rescue board without a frozen target (shouldn't happen for real
      // content, but the fallback catalog's edge cases are defensive) —
      // fall back to the move budget alone rather than dividing by zero.
      final budget = game.movesRemaining;
      return _MovesLeftNote(theme: theme, budget: budget ?? 0);
    }
    final fraction = (current / target).clamp(0.0, 1.0);
    final remaining = (target - current).clamp(0, target);
    final budget = game.movesRemaining;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: theme.ink,
                  fontFamily: 'Fredoka',
                  fontSize: compact ? 12 : 13,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '$current / $target $unit',
              style: TextStyle(
                color: theme.muted,
                fontSize: compact ? 11 : 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        SizedBox(height: compact ? 5 : 7),
        ClipRRect(
          borderRadius: BorderRadius.circular(MrTokens.radiusPill),
          child: LayoutBuilder(
            builder: (context, constraints) => Stack(
              children: [
                Container(height: 8, color: MrTokens.paperMuted),
                Container(
                  height: 8,
                  width: constraints.maxWidth * fraction,
                  color: remaining == 0 ? theme.blue : theme.coral,
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: compact ? 4 : 6),
        Text(
          remaining == 0
              ? (isDaily ? 'Chain complete.' : 'Goal reached — finish strong.')
              : isDaily
              ? '$remaining ${remaining == 1 ? 'move' : 'moves'} to build the chain.'
              : '$remaining ${remaining == 1 ? 'point' : 'points'} to go'
                    '${budget != null ? ' · $budget ${budget == 1 ? 'move' : 'moves'} left' : ''}.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: theme.ink.withValues(alpha: 0.7),
            fontSize: compact ? 11 : 12,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

/// Endless: the best tile reached this run, the next milestone tile
/// (simply double the current best — every merge doubles a tile's value,
/// so this is the literal next rung, not a new mechanic), and the
/// player's all-time best score.
final class _EndlessInsight extends StatelessWidget {
  const _EndlessInsight({
    required this.game,
    required this.theme,
    required this.compact,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final bestTile = game.state.value.board.cells.fold<int>(
      0,
      (highest, value) => value > highest ? value : highest,
    );
    final currentTile = bestTile < 2 ? 2 : bestTile;
    final nextMilestone = currentTile * 2;
    final bestScore = game.bestEndlessScore.value;
    final tileSize = compact ? 34.0 : 40.0;
    return Row(
      children: [
        _MiniTile(value: currentTile, size: tileSize, theme: theme),
        const SizedBox(width: 6),
        Icon(
          Icons.arrow_forward_rounded,
          size: compact ? 14 : 16,
          color: theme.muted,
        ),
        const SizedBox(width: 6),
        _MiniTile(
          value: nextMilestone,
          size: tileSize,
          theme: theme,
          dim: true,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            'Next milestone',
            style: TextStyle(
              color: theme.muted,
              fontSize: compact ? 11 : 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'BEST SCORE',
              style: TextStyle(
                color: theme.muted,
                fontSize: 9,
                fontFamily: 'Fredoka',
                fontWeight: FontWeight.w900,
                letterSpacing: 0.8,
              ),
            ),
            Text(
              bestScore > 0 ? '$bestScore' : '—',
              style: TextStyle(
                color: theme.ink,
                fontSize: compact ? 15 : 17,
                fontFamily: 'Fredoka',
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

final class _MiniTile extends StatelessWidget {
  const _MiniTile({
    required this.value,
    required this.size,
    required this.theme,
    this.dim = false,
  });

  final int value;
  final double size;
  final MergeRelayTheme theme;
  final bool dim;

  @override
  Widget build(BuildContext context) {
    final tile = SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _ResultTilePainter(value: value, theme: theme),
      ),
    );
    return dim ? Opacity(opacity: 0.5, child: tile) : tile;
  }
}

/// Restart (with the same confirmation the pause menu uses) and Settings,
/// reachable directly from the lower tray so a player doesn't have to open
/// Pause first for either.
final class _QuickActionsRow extends StatelessWidget {
  const _QuickActionsRow({
    required this.game,
    required this.theme,
    required this.compact,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: MrButton(
            label: 'Restart',
            icon: Icons.replay_rounded,
            variant: MrButtonVariant.secondary,
            onPressed: () => confirmRestartRun(context, game),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: MrButton(
            label: 'Settings',
            icon: Icons.tune_rounded,
            variant: MrButtonVariant.secondary,
            onPressed: () => showMergeRelaySettings(context, game, theme),
          ),
        ),
      ],
    );
  }
}

final class _SwipeHint extends StatelessWidget {
  const _SwipeHint({required this.theme, required this.compact});

  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.swipe_rounded, color: theme.muted, size: compact ? 16 : 18),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            'Swipe the board to move',
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: theme.muted,
              fontSize: compact ? 11 : 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

/// Fallback for the rare case a rescue board has no frozen target score —
/// just the move budget, so the tray never renders empty.
final class _MovesLeftNote extends StatelessWidget {
  const _MovesLeftNote({required this.theme, required this.budget});

  final MergeRelayTheme theme;
  final int budget;

  @override
  Widget build(BuildContext context) {
    return Text(
      budget == 0 ? 'Last move — make it count.' : '$budget moves to go',
      textAlign: TextAlign.center,
      style: TextStyle(
        color: budget == 0 ? theme.coral : theme.ink.withValues(alpha: 0.7),
        fontSize: 12,
        fontFamily: 'Fredoka',
        fontWeight: FontWeight.w800,
      ),
    );
  }
}
