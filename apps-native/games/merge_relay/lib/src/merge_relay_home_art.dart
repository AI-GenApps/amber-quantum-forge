part of 'merge_relay_home.dart';

/// The wordmark header: the [MergeRelayArtManifest.logoWide] slot (falls
/// back to plain "MERGE RELAY" text — no bitmap art ships until task 22)
/// plus the Settings icon action.
final class _HomeHeader extends StatelessWidget {
  const _HomeHeader({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 34,
            child: Align(
              alignment: Alignment.centerLeft,
              child: MergeRelayArtManifest.logoWide(),
            ),
          ),
        ),
        const SizedBox(width: 8),
        MrIconButton(
          icon: Icons.tune_rounded,
          tooltip: 'Settings',
          onPressed: () => showMergeRelaySettings(context, game, theme),
        ),
      ],
    );
  }
}

/// The hero scene: the [MergeRelayArtManifest.homeScene] slot (a code-drawn
/// stacked-character-tile scene until real art lands in task 20/23) behind
/// a dark scrim, a short original tagline, and the primary Continue/Play
/// action.
final class _HomeHero extends StatelessWidget {
  const _HomeHero({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    final hasSaved = game.hasSavedSession.value;
    final label = !hasSaved
        ? 'Play rescue'
        : game.result.value == null
        ? 'Continue run'
        : 'See result';
    final onTap = hasSaved
        ? game.continueSession
        : () => game.openPlay(requestedMode: MergeRelayMode.rescue);
    return ClipRRect(
      borderRadius: BorderRadius.circular(MrTokens.radiusLarge),
      child: Stack(
        children: [
          AspectRatio(
            aspectRatio: 1.2,
            child: MergeRelayArtManifest.homeScene(),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    theme.ink.withValues(alpha: 0),
                    theme.ink.withValues(alpha: 0.4),
                    theme.ink.withValues(alpha: 0.88),
                  ],
                  stops: const [0.2, 0.52, 1],
                ),
              ),
            ),
          ),
          Positioned(
            left: 18,
            right: 18,
            bottom: 18,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'A tiny board. A clean handoff.',
                  style: TextStyle(
                    color: MrTokens.paper,
                    fontSize: 20,
                    fontFamily: 'Fredoka',
                    fontWeight: FontWeight.w900,
                    height: 1.06,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Slide, merge, and leave a better board behind.',
                  style: TextStyle(
                    color: MrTokens.paper.withValues(alpha: 0.82),
                    fontSize: 13,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 14),
                MrButton(
                  label: label,
                  icon: Icons.play_arrow_rounded,
                  color: MrTokens.paper,
                  foreground: MrTokens.ink,
                  expand: false,
                  onPressed: onTap,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
