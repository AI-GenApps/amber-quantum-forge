import 'package:flutter/material.dart';

import '../merge_relay_theme.dart';
import '../ui/mr_button.dart';
import '../ui/mr_tokens.dart';
import '../ui/tiles/mr_tile_card_painter.dart';
import '../ui/tiles/mr_tile_expression.dart';
import '../ui/tiles/mr_tile_face_painter.dart';

/// The first-run welcome screen (task 12): a single static screen shown as
/// the opening step of [MergeRelayTutorial] the very first time a game
/// reaches the tutorial with its onboarding not yet complete — gated in
/// `_MergeRelayTutorialState` on `!game.tutorialComplete.value`, the same
/// flag "Replay tutorial" in Settings checks, so a returning player who has
/// already finished onboarding skips straight to the interactive board.
///
/// No account, network, or notification prompt anywhere here (solo v1) —
/// just the hero tiles and the one line that explains the whole game
/// (the task's Context/Decisions copy, verbatim). The logo slot uses the
/// wordmark text fallback: final logo art is task 22.
final class MergeRelayWelcome extends StatelessWidget {
  const MergeRelayWelcome({
    required this.theme,
    required this.onContinue,
    required this.onSkip,
    super.key,
  });

  final MergeRelayTheme theme;
  final VoidCallback onContinue;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    // The same "fill or scroll" idiom as the interactive tutorial step
    // (`merge_relay_tutorial.dart`): floors the column at the full
    // viewport height so there's no flat empty band on a normal phone, but
    // still scrolls instead of overflowing at a compact size with a large
    // text scale (`MainAxisAlignment.spaceBetween` is safe under the
    // scroll axis's unbounded max, unlike `Expanded`/`Spacer`).
    return LayoutBuilder(
      builder: (context, outer) => SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight: (outer.maxHeight - 36).clamp(0, double.infinity),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(onPressed: onSkip, child: const Text('Skip')),
              ),
              Text(
                'MERGE\nRELAY',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: theme.ink,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w900,
                  fontSize: 38,
                  height: 1.02,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 24),
              _HeroTiles(theme: theme),
              const SizedBox(height: 24),
              Text(
                'Slide to merge matching tiles.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: theme.ink,
                  fontFamily: 'Fredoka',
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Clear every board before you run out of moves.',
                textAlign: TextAlign.center,
                style: TextStyle(color: theme.muted, fontSize: 15, height: 1.3),
              ),
              const SizedBox(height: 24),
              MrButton(
                label: "Let's play",
                icon: Icons.arrow_forward_rounded,
                onPressed: onContinue,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Two static hero tiles (a low tile merging into a higher one) that show
/// the core gesture before the interactive board ever appears — the same
/// tile-card painter the real board and the chapter map's nodes use, so
/// this reads as the game's own art rather than a mockup.
final class _HeroTiles extends StatelessWidget {
  const _HeroTiles({required this.theme});

  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 92,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const _HeroTile(value: 2),
          const SizedBox(width: 14),
          Icon(Icons.arrow_forward_rounded, color: theme.muted, size: 26),
          const SizedBox(width: 14),
          const _HeroTile(value: 4),
        ],
      ),
    );
  }
}

final class _HeroTile extends StatelessWidget {
  const _HeroTile({required this.value});

  final int value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 82,
      height: 82,
      child: CustomPaint(painter: _HeroTilePainter(value: value)),
    );
  }
}

final class _HeroTilePainter extends CustomPainter {
  const _HeroTilePainter({required this.value});

  final int value;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final fill = MrTokens.tileColorFor(value);
    final numeralColor = MrTokens.tileNumeralColorFor(value);
    paintTileCard(
      canvas,
      rect,
      fill: fill,
      edgeColor: MrTokens.tileEdgeColorFor(value),
      radius: 20,
    );
    // The face sits in the tile's top band; the numeral below reuses the
    // same layout ratio as the real board's tiles (see
    // `MergeRelayBoardPainter`).
    paintTileFace(
      canvas,
      Rect.fromLTWH(
        rect.left + rect.width * 0.18,
        rect.top + rect.height * 0.12,
        rect.width * 0.64,
        rect.height * 0.32,
      ),
      expression: mrExpressionForTierIndex(MrTokens.tileTierIndex(value)),
      color: numeralColor,
    );
    final text = TextPainter(
      text: TextSpan(
        text: '$value',
        style: TextStyle(
          fontFamily: 'Fredoka',
          color: numeralColor,
          fontWeight: FontWeight.w800,
          fontSize: size.height * 0.32,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    text.paint(
      canvas,
      Offset(
        rect.center.dx - text.width / 2,
        rect.top + rect.height * 0.62 - text.height / 2,
      ),
    );
  }

  @override
  bool shouldRepaint(covariant _HeroTilePainter oldDelegate) =>
      oldDelegate.value != value;
}
