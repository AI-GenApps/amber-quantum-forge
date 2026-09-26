part of 'merge_relay_home.dart';

final class _LegacyOffer extends StatelessWidget {
  const _LegacyOffer({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return MrPanel(
      color: theme.warm.withValues(alpha: 0.14),
      border: Border.all(color: theme.warm.withValues(alpha: 0.4)),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
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
            "Keep its saved goal, or begin a fresh rescue with today's goal.",
            style: TextStyle(color: theme.muted, fontSize: 13),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              MrButton(
                label: 'Keep saved board',
                variant: MrButtonVariant.secondary,
                color: theme.warm,
                expand: false,
                onPressed: game.continueSession,
              ),
              const SizedBox(width: 8),
              MrButton(
                label: 'Fresh rescue',
                variant: MrButtonVariant.secondary,
                color: theme.warm,
                expand: false,
                onPressed: () =>
                    game.openPlay(requestedMode: MergeRelayMode.rescue),
              ),
            ],
          ),
        ],
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
    return MrPanel(
      color: theme.coral.withValues(alpha: 0.14),
      border: Border.all(color: theme.coral.withValues(alpha: 0.4)),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
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
          const SizedBox(height: 10),
          MrButton(
            label: 'Retry restore',
            variant: MrButtonVariant.secondary,
            color: theme.coral,
            expand: false,
            onPressed: game.retryRestore,
          ),
        ],
      ),
    );
  }
}

/// A full-width tappable row opening the chapter map — restyled task 11
/// from a plain "Rescue paths" action tile into one that also states
/// campaign progress, matching the Daily/Endless cards below it.
final class _RescueAction extends StatelessWidget {
  const _RescueAction({
    required this.game,
    required this.theme,
    required this.cleared,
    required this.total,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final int cleared;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Rescue paths. $cleared of $total cleared.',
      child: GestureDetector(
        onTap: game.openChapterMap,
        child: MrPanel(
          color: theme.blue,
          padding: const EdgeInsets.fromLTRB(18, 16, 16, 16),
          child: Row(
            children: [
              const Icon(Icons.route_rounded, color: Colors.white, size: 28),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Rescue paths',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$cleared of $total cleared',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.78),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_rounded,
                color: Colors.white.withValues(alpha: 0.85),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The v1.1 "Join a relay" row (task 05's gate keeps this unreachable in
/// the shipped v1 build — `game.features.socialEnabled` is `false` by
/// default — but the code and its test coverage stay live for v1.1).
final class _RelayAction extends StatelessWidget {
  const _RelayAction({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Join a relay. Play a shared challenge.',
      child: GestureDetector(
        onTap: game.openRelay,
        child: MrPanel(
          color: theme.coral,
          padding: const EdgeInsets.fromLTRB(18, 16, 16, 16),
          child: Row(
            children: [
              const Icon(
                Icons.swap_horizontal_circle_rounded,
                color: Colors.white,
                size: 26,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Join a relay',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontFamily: 'Fredoka',
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      'Play a shared challenge',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_rounded,
                color: Colors.white.withValues(alpha: 0.85),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A compact home card: an icon, a title, and a one-line status — the
/// shared shape for [_DailyCard] and [_EndlessCard].
final class _HomeCard extends StatelessWidget {
  const _HomeCard({
    required this.icon,
    required this.accent,
    required this.title,
    required this.subtitle,
    required this.theme,
    required this.onTap,
  });

  final IconData icon;
  final Color accent;
  final String title;
  final String subtitle;
  final MergeRelayTheme theme;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      child: GestureDetector(
        onTap: onTap,
        child: MrPanel(
          padding: const EdgeInsets.fromLTRB(14, 14, 12, 14),
          border: Border.all(color: theme.ink.withValues(alpha: 0.12)),
          shadow: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: accent, size: 22),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  color: theme.ink,
                  fontFamily: 'Fredoka',
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: theme.muted, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

final class _DailyCard extends StatelessWidget {
  const _DailyCard({required this.game, required this.theme, this.result});

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final MergeRelayResult? result;

  @override
  Widget build(BuildContext context) {
    final subtitle = switch (result?.outcome) {
      null => "Today's board",
      MergeRelayOutcome.completed => 'Cleared today',
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

final class _EndlessCard extends StatelessWidget {
  const _EndlessCard({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    final best = game.bestEndlessScore.value;
    return _HomeCard(
      icon: Icons.all_inclusive_rounded,
      accent: theme.sky,
      title: 'Endless',
      subtitle: best > 0 ? 'Best $best' : 'Keep going',
      theme: theme,
      onTap: () => game.openPlay(requestedMode: MergeRelayMode.endless),
    );
  }
}
