part of 'merge_relay_home.dart';

/// The wordmark header: the [MergeRelayArtManifest.logoWide] slot (falls
/// back to plain "GLOW RESCUE" text) plus the Settings icon action.
///
/// Task 22 fix round 1 (orchestrator review): the first pass constrained
/// this to a fixed 34dp *height*, so `BoxFit.contain` shrank the wordmark
/// to whatever width that tiny height implied (~1/3 of the header) instead
/// of the other way around. This instead fixes the wordmark's *width* to
/// ~60% of the header's own width (comfortably inside the 55-65% band the
/// review asked for, and — even at 65% of a 320dp content width, 208dp —
/// still leaving 320-208-8-48=56dp clear of the settings button) and lets
/// the height follow from the bitmap's own aspect ratio, so the row grows
/// to whatever height that implies and the button centers against it
/// (Row's default `CrossAxisAlignment.center`). `logoWide.png` also
/// dropped its small tile icon in this round (wordmark-only now) per the
/// review's suggestion, so it can be sized generously without looking
/// cramped next to the button.
final class _HomeHeader extends StatelessWidget {
  const _HomeHeader({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final logoWidth = constraints.maxWidth * 0.6;
        return Row(
          children: [
            SizedBox(width: logoWidth, child: MergeRelayArtManifest.logoWide()),
            const Spacer(),
            MrIconButton(
              icon: Icons.tune_rounded,
              tooltip: 'Settings',
              onPressed: () => showMergeRelaySettings(context, game, theme),
            ),
          ],
        );
      },
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
                  'A tiny board. A clean sweep.',
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
