part of 'merge_relay_play_screen.dart';

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
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 26),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: game.openHome,
                tooltip: 'Home',
                icon: Icon(Icons.arrow_back_rounded, color: theme.ink),
              ),
              const SizedBox(width: 8),
              Text(
                'Run result',
                style: TextStyle(
                  color: theme.ink,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          DecoratedBox(
            decoration: BoxDecoration(
              color: theme.ink,
              borderRadius: BorderRadius.circular(28),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    outcome.outcome.title,
                    style: TextStyle(
                      color: theme.paper,
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    outcome.message,
                    style: TextStyle(
                      color: theme.paper.withValues(alpha: 0.74),
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      _ResultMetric(
                        label: 'Score',
                        value: '${outcome.score}',
                        theme: theme,
                      ),
                      _ResultMetric(
                        label: 'Best tile',
                        value: '${outcome.maxTile}',
                        theme: theme,
                      ),
                      _ResultMetric(
                        label: 'Moves',
                        value: '${outcome.movesUsed}',
                        theme: theme,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            outcome.objective,
            style: TextStyle(
              color: theme.ink,
              fontSize: 17,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            _resultHint(outcome),
            style: TextStyle(color: theme.muted, height: 1.3),
          ),
          const SizedBox(height: 22),
          FilledButton.icon(
            onPressed: _primaryAction,
            icon: Icon(_primaryIcon(outcome)),
            label: Text(_primaryLabel(outcome)),
            style: FilledButton.styleFrom(
              backgroundColor: theme.ink,
              foregroundColor: theme.paper,
              minimumSize: const Size.fromHeight(52),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: game.openHome,
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(50),
            ),
            child: const Text('Home'),
          ),
          if (game.features.socialEnabled && game.relayController != null) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: game.createRelayFromCurrentBoard,
              icon: const Icon(Icons.ios_share_rounded),
              label: const Text('Share this board'),
            ),
          ],
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
    MergeRelayOutcome.completed => 'Carry the spark into the next path.',
    MergeRelayOutcome.missed =>
      'Read the open lanes, then try a different first handoff.',
    MergeRelayOutcome.terminal =>
      'The board is full. A new run starts only when you choose it.',
    MergeRelayOutcome.earlyFinish =>
      'Come back from Continue when you are ready to play again.',
  };
}

final class _ResultMetric extends StatelessWidget {
  const _ResultMetric({
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
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}
