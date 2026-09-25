part of 'merge_relay_home.dart';

final class _HomeBar extends StatelessWidget {
  const _HomeBar({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            color: theme.ink,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(11),
            child: Icon(Icons.alt_route_rounded, color: theme.paper, size: 26),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'MERGE RELAY',
                style: TextStyle(
                  color: theme.muted,
                  fontSize: 11,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.6,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                'Pass the spark.',
                style: TextStyle(
                  color: theme.ink,
                  fontSize: 28,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.8,
                ),
              ),
            ],
          ),
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

final class _LegacyOffer extends StatelessWidget {
  const _LegacyOffer({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.warm.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: theme.warm.withValues(alpha: 0.4)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 12, 10, 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Your older board is safe.',
              style: TextStyle(
                color: theme.ink,
                fontFamily: 'Fredoka',
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              'Keep its saved goal, or begin a fresh rescue with today\'s goal.',
              style: TextStyle(color: theme.muted, fontSize: 13),
            ),
            Wrap(
              spacing: 4,
              children: [
                TextButton(
                  onPressed: game.continueSession,
                  child: const Text('Keep saved board'),
                ),
                TextButton(
                  onPressed: () =>
                      game.openPlay(requestedMode: MergeRelayMode.rescue),
                  child: const Text('Fresh rescue'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

final class _RestoreFailure extends StatelessWidget {
  const _RestoreFailure({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.coral.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: theme.coral.withValues(alpha: 0.4)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 12, 10, 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Your saved board needs another look.',
              style: TextStyle(
                color: theme.ink,
                fontFamily: 'Fredoka',
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              'Your current board is protected until it can be read.',
              style: TextStyle(color: theme.muted, fontSize: 13),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: game.retryRestore,
                child: const Text('Retry restore'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

final class _HomeAction extends StatelessWidget {
  const _HomeAction({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.foreground,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final Color foreground;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      child: Material(
        color: color,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
            child: Row(
              children: [
                Icon(icon, color: foreground, size: 27),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          color: foreground,
                          fontSize: 17,
                          fontFamily: 'Fredoka',
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: foreground.withValues(alpha: 0.72),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_rounded,
                  color: foreground.withValues(alpha: 0.7),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

final class _SmallAction extends StatelessWidget {
  const _SmallAction({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.theme,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final MergeRelayTheme theme;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.fromLTRB(12, 14, 10, 14),
        alignment: Alignment.centerLeft,
        side: BorderSide(color: theme.ink.withValues(alpha: 0.2)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
      child: Row(
        children: [
          Icon(icon, color: theme.coral),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: theme.ink,
                    fontFamily: 'Fredoka',
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(color: theme.muted, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

final class _PathBadge extends StatelessWidget {
  const _PathBadge({required this.index, required this.theme});

  final int index;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      backgroundColor: theme.ink,
      foregroundColor: theme.paper,
      child: Text('${index + 1}'),
    );
  }
}
