part of 'merge_relay_play_screen.dart';

final class _PausePanel extends StatelessWidget {
  const _PausePanel({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      // Fully opaque (task 07 round 2): a translucent panel let the
      // board's tiles show through behind the action labels, which read
      // as low-contrast text and, on a short screen, as if "Finish here"
      // overlapped a tile. An opaque `MrPanel`-style ink surface (plus its
      // own drop shadow) guarantees full contrast for every label.
      decoration: BoxDecoration(
        color: theme.ink,
        borderRadius: BorderRadius.circular(MrTokens.radiusLarge),
        boxShadow: MrTokens.cardShadow(opacity: 0.3),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: constraints.maxHeight > 32
                  ? constraints.maxHeight - 32
                  : 0,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.pause_circle_filled_rounded,
                  color: theme.paper,
                  size: 48,
                ),
                const SizedBox(height: 10),
                Text(
                  'Board paused',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: theme.paper,
                    fontSize: 23,
                    fontFamily: 'Fredoka',
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  'Your tiles are waiting.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: theme.paper.withValues(alpha: 0.7)),
                ),
                const SizedBox(height: 18),
                // `MrButton`'s defaults assume a paper background, so every
                // button here overrides `color`/`foreground` to read
                // correctly on this panel's own ink-coloured surface (task
                // 11): the primary action flips to a solid paper pill with
                // ink text, and every secondary action becomes a
                // paper-outlined, paper-labelled pill.
                MrButton(
                  label: 'Resume',
                  color: theme.paper,
                  foreground: theme.ink,
                  onPressed: () => game.setPaused(false),
                ),
                const SizedBox(height: 8),
                MrButton(
                  label: 'Restart run',
                  variant: MrButtonVariant.secondary,
                  color: theme.paper,
                  onPressed: () => confirmRestartRun(context, game),
                ),
                const SizedBox(height: 8),
                MrButton(
                  label: 'Finish here',
                  variant: MrButtonVariant.secondary,
                  color: theme.paper,
                  onPressed: game.finishEarly,
                ),
                const SizedBox(height: 8),
                MrButton(
                  label: 'Settings',
                  icon: Icons.tune_rounded,
                  variant: MrButtonVariant.secondary,
                  color: theme.paper,
                  onPressed: () => showMergeRelaySettings(context, game, theme),
                ),
                if (game.features.socialEnabled &&
                    game.relayController != null) ...[
                  const SizedBox(height: 8),
                  MrButton(
                    label: 'Share this board',
                    icon: Icons.ios_share_rounded,
                    variant: MrButtonVariant.secondary,
                    color: theme.paper,
                    onPressed: game.createRelayFromCurrentBoard,
                  ),
                ],
                const SizedBox(height: 8),
                MrButton(
                  label: 'Home',
                  variant: MrButtonVariant.secondary,
                  color: theme.paper,
                  onPressed: game.openHome,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Shared restart confirmation (task 11 fix round 1: previously private to
/// the pause panel, now also used by the Play screen's lower-tray quick
/// action so "Restart" is reachable without opening Pause first).
Future<void> confirmRestartRun(
  BuildContext context,
  MergeRelayGame game,
) async {
  final restart = await showDialog<bool>(
    context: context,
    builder: (context) => MrDialog(
      title: 'Restart this run?',
      message:
          'Your current board will stay in the saved run until you '
          'choose restart.',
      secondaryLabel: 'Keep board',
      onSecondary: () => Navigator.pop(context, false),
      primaryLabel: 'Restart',
      onPrimary: () => Navigator.pop(context, true),
    ),
  );
  if (restart == true) game.newRound();
}
