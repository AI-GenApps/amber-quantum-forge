part of 'merge_relay_play_screen.dart';

/// Merge Relay's Result screen, restyled task 11: a hero panel with the
/// run's best tile drawn as one of the board's own character tiles,
/// score/best-tile/moves as [MrPill]s, the contextual primary action plus
/// (on a Rescue win) a Replay action, and a campaign-progress footer so the
/// screen's lower half is never left as flat empty background.
final class MergeRelayResultScreen extends StatelessWidget {
  const MergeRelayResultScreen({
    required this.game,
    required this.theme,
    super.key,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    final outcome = game.result.value;
    if (outcome == null) {
      game.openHome();
      return const SizedBox.shrink();
    }
    final won = outcome.outcome == MergeRelayOutcome.completed;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 26),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              MrIconButton(
                icon: Icons.arrow_back_rounded,
                tooltip: 'Home',
                onPressed: game.openHome,
              ),
              const SizedBox(width: 8),
              Text(
                'Run result',
                style: TextStyle(
                  color: theme.ink,
                  fontSize: 22,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _ResultHero(
            outcome: outcome,
            theme: theme,
            won: won,
            isNewEndlessBest:
                outcome.mode == MergeRelayMode.endless &&
                outcome.score > 0 &&
                outcome.score == game.bestEndlessScore.value,
          ),
          const SizedBox(height: 16),
          Text(
            outcome.objective,
            style: TextStyle(
              color: theme.ink,
              fontSize: 17,
              fontFamily: 'Fredoka',
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            _resultHint(outcome),
            style: TextStyle(color: theme.muted, height: 1.3),
          ),
          const SizedBox(height: 20),
          MrButton(
            label: _primaryLabel(outcome),
            icon: _primaryIcon(outcome),
            onPressed: _primaryAction,
          ),
          if (won && outcome.mode == MergeRelayMode.rescue) ...[
            const SizedBox(height: 8),
            MrButton(
              label: 'Replay',
              icon: Icons.replay_rounded,
              variant: MrButtonVariant.secondary,
              onPressed: game.retryRescue,
            ),
          ],
          const SizedBox(height: 8),
          MrButton(
            label: 'Home',
            variant: MrButtonVariant.secondary,
            onPressed: game.openHome,
          ),
          if (game.features.socialEnabled && game.relayController != null) ...[
            const SizedBox(height: 8),
            MrButton(
              label: 'Share this board',
              icon: Icons.ios_share_rounded,
              variant: MrButtonVariant.secondary,
              onPressed: game.createRelayFromCurrentBoard,
            ),
          ],
          const SizedBox(height: 18),
          MergeRelayCampaignProgressPanel(
            theme: theme,
            cleared: game.completedRescueIds.value.length,
            total: game.content.rescues.length,
          ),
          const SizedBox(height: 12),
          MergeRelayChapterStrip(game: game, theme: theme),
        ],
      ),
    );
  }

  String _primaryLabel(MergeRelayResult result) {
    if (result.mode == MergeRelayMode.rescue &&
        result.outcome == MergeRelayOutcome.completed) {
      return 'Next path';
    }
    if (result.mode == MergeRelayMode.rescue) return 'Try again';
    if (result.mode == MergeRelayMode.endless) return 'New run';
    return 'Play again';
  }

  IconData _primaryIcon(MergeRelayResult result) {
    return result.mode == MergeRelayMode.rescue &&
            result.outcome == MergeRelayOutcome.completed
        ? Icons.arrow_forward_rounded
        : Icons.replay_rounded;
  }

  void _primaryAction() {
    final current = game.result.value;
    if (current?.mode == MergeRelayMode.rescue &&
        current?.outcome == MergeRelayOutcome.completed) {
      game.nextRescue();
    } else {
      game.newRound();
    }
  }

  String _resultHint(MergeRelayResult result) => switch (result.outcome) {
    MergeRelayOutcome.completed => 'Keep the chain moving into the next path.',
    MergeRelayOutcome.missed =>
      'Read the open lanes, then try a different first move.',
    MergeRelayOutcome.terminal =>
      'The board is full. A new run starts only when you choose it.',
    MergeRelayOutcome.earlyFinish =>
      'Come back from Continue when you are ready to play again.',
  };
}

/// The result card's dark hero panel: the run's best tile painted as a real
/// character tile (task 08's card/face painters — "a tile character
/// celebrating" per the task), the outcome headline/message, and the
/// score/best-tile/moves pills. Endless shows a "New best" pill when this
/// run set (or matched) the player's all-time best.
final class _ResultHero extends StatelessWidget {
  const _ResultHero({
    required this.outcome,
    required this.theme,
    required this.won,
    required this.isNewEndlessBest,
  });

  final MergeRelayResult outcome;
  final MergeRelayTheme theme;
  final bool won;
  final bool isNewEndlessBest;

  @override
  Widget build(BuildContext context) {
    return MrPanel(
      color: theme.ink,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      outcome.outcome.title,
                      style: TextStyle(
                        color: theme.paper,
                        fontSize: 28,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      outcome.message,
                      style: TextStyle(
                        color: theme.paper.withValues(alpha: 0.74),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(
                width: 64,
                height: 64,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // `Positioned.fill` (not a bare `CustomPaint`): a
                    // non-positioned `Stack` child gets *loose* constraints
                    // (`StackFit.loose`), and `CustomPaint`'s own `size`
                    // defaults to `Size.zero`, which satisfies a loose
                    // constraint as-is — the tile silently painted at 0x0
                    // without this.
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _ResultTilePainter(
                          value: outcome.maxTile,
                          theme: theme,
                        ),
                      ),
                    ),
                    if (won)
                      Positioned(
                        right: -6,
                        top: -6,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: theme.warm,
                            shape: BoxShape.circle,
                            border: Border.all(color: theme.ink, width: 2),
                          ),
                          child: const Padding(
                            padding: EdgeInsets.all(3),
                            child: Icon(
                              Icons.star_rounded,
                              size: 14,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              _ResultStat(
                label: 'Score',
                value: '${outcome.score}',
                theme: theme,
              ),
              _ResultStat(
                label: 'Best tile',
                value: '${outcome.maxTile}',
                theme: theme,
              ),
              _ResultStat(
                label: 'Moves',
                value: '${outcome.movesUsed}',
                theme: theme,
              ),
            ],
          ),
          if (isNewEndlessBest) ...[
            const SizedBox(height: 10),
            MrPill(
              label: 'New best!',
              icon: Icons.star_rounded,
              color: theme.warm,
              foreground: Colors.white,
            ),
          ],
        ],
      ),
    );
  }
}

/// A pill-shaped stat (task 11: "score/best tile/moves in MrPills") — built
/// as its own two-line label-over-value pill rather than `MrPill` itself,
/// since `MrPill` takes one short label string and this needs the label and
/// the (much more prominent) value as clearly distinct text nodes.
final class _ResultStat extends StatelessWidget {
  const _ResultStat({
    required this.label,
    required this.value,
    required this.theme,
  });

  final String label;
  final String value;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(right: 8),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: theme.paper.withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(MrTokens.radiusMedium),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: theme.paper.withValues(alpha: 0.6),
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: TextStyle(
                    color: theme.paper,
                    fontSize: 22,
                    fontFamily: 'Fredoka',
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

final class _ResultTilePainter extends CustomPainter {
  const _ResultTilePainter({required this.value, required this.theme});

  final int value;
  final MergeRelayTheme theme;

  @override
  void paint(Canvas canvas, Size size) {
    MergeRelayBoardArt.paintTile(
      canvas,
      Offset.zero & size,
      value: value < 2 ? 2 : value,
      theme: theme,
      highContrast: false,
    );
  }

  @override
  bool shouldRepaint(covariant _ResultTilePainter oldDelegate) =>
      oldDelegate.value != value || oldDelegate.theme != theme;
}
