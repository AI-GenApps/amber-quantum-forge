part of 'merge_relay_home.dart';

final class _DailyCard extends StatelessWidget {
  const _DailyCard({required this.game, required this.theme, this.result});

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final MergeRelayResult? result;

  @override
  Widget build(BuildContext context) {
    final fallback = game.usesServiceDaily
        ? game.dailyStatus.value.subtitle
        : "Today's board";
    final subtitle = switch (result?.outcome) {
      null => fallback,
      MergeRelayOutcome.completed => 'Completed today',
      _ => 'Try again today',
    };
    return _HomeCard(
      icon: Icons.today_rounded,
      accent: theme.coral,
      title: 'Daily',
      subtitle: subtitle,
      theme: theme,
      onTap: () => game.openPlay(requestedMode: MergeRelayMode.daily),
    );
  }
}

final class _DailyStatusNote extends StatelessWidget {
  const _DailyStatusNote({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    final status = game.dailyStatus.value;
    if (!game.usesServiceDaily || !status.canRetry) {
      return const SizedBox.shrink();
    }
    final outcome = status.outcome!;
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Semantics(
        liveRegion: true,
        label: '${outcome.title} ${outcome.message}',
        child: Row(
          children: [
            Expanded(
              child: ExcludeSemantics(
                child: Text(
                  outcome.message,
                  style: TextStyle(color: theme.muted, fontSize: 12),
                ),
              ),
            ),
            const SizedBox(width: 8),
            MrButton(
              label: 'Retry',
              variant: MrButtonVariant.secondary,
              expand: false,
              onPressed: game.refreshDaily,
            ),
          ],
        ),
      ),
    );
  }
}
