part of 'merge_relay_play_screen.dart';

final class _PausePanel extends StatelessWidget {
  const _PausePanel({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.ink.withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(27),
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
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => game.setPaused(false),
                    child: const Text('Resume'),
                  ),
                ),
                TextButton(
                  onPressed: () => _confirmRestart(context),
                  child: Text(
                    'Restart run',
                    style: TextStyle(color: theme.paper),
                  ),
                ),
                TextButton(
                  onPressed: game.finishEarly,
                  child: Text(
                    'Finish here',
                    style: TextStyle(color: theme.paper),
                  ),
                ),
                if (game.relayController != null)
                  TextButton.icon(
                    onPressed: game.createRelayFromCurrentBoard,
                    icon: Icon(Icons.ios_share_rounded, color: theme.paper),
                    label: Text(
                      'Share this board',
                      style: TextStyle(color: theme.paper),
                    ),
                  ),
                TextButton(
                  onPressed: game.openHome,
                  child: Text('Home', style: TextStyle(color: theme.paper)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _confirmRestart(BuildContext context) async {
    final restart = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Restart this run?'),
        content: const Text(
          'Your current board will stay in the saved run until you choose restart.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep board'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Restart'),
          ),
        ],
      ),
    );
    if (restart == true) game.newRound();
  }
}
