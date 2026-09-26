import 'package:flutter/material.dart';

import '../merge_relay_board_art.dart';
import '../merge_relay_theme.dart';
import '../ui/mr_tokens.dart';

/// Named art slots for Merge Relay's original art (tasks 08/19/20/22/23).
/// Every slot tries `assets/art/<slot>.png` first and falls back to a
/// code-drawn placeholder when the bitmap isn't bundled yet — this task
/// (07) ships no bitmaps, so every slot renders its fallback; later art
/// tasks add the PNGs without touching call sites.
final class MergeRelayArtManifest {
  const MergeRelayArtManifest._();

  /// The tile-tier values with a named face slot, matching
  /// [MrTokens.tileTierColors]' 12 steps (4096 stands in for "4096+").
  static const List<int> tileFaceTiers = [
    2,
    4,
    8,
    16,
    32,
    64,
    128,
    256,
    512,
    1024,
    2048,
    4096,
  ];

  static Widget homeScene({AssetBundle? bundle, Key? key}) => _slot(
    'assets/art/homeScene.png',
    bundle: bundle,
    key: key,
    fallback: (context) => const _FallbackScene(),
  );

  static Widget logoWide({AssetBundle? bundle, Key? key}) => _slot(
    'assets/art/logoWide.png',
    bundle: bundle,
    key: key,
    fallback: (context) => const _FallbackWordmark(stacked: false),
  );

  static Widget logoStacked({AssetBundle? bundle, Key? key}) => _slot(
    'assets/art/logoStacked.png',
    bundle: bundle,
    key: key,
    fallback: (context) => const _FallbackWordmark(stacked: true),
  );

  static Widget tileFace(int tier, {AssetBundle? bundle, Key? key}) {
    assert(
      tileFaceTiers.contains(tier),
      'tileFace tier must be one of $tileFaceTiers',
    );
    return _slot(
      'assets/art/tileFace_$tier.png',
      bundle: bundle,
      key: key,
      fallback: (context) => _FallbackTileFace(tier: tier),
    );
  }

  static Widget boardFrame({AssetBundle? bundle, Key? key}) => _slot(
    'assets/art/boardFrame.png',
    bundle: bundle,
    key: key,
    fallback: (context) => const _FallbackBoardFrame(),
  );

  static Widget _slot(
    String assetPath, {
    required WidgetBuilder fallback,
    AssetBundle? bundle,
    Key? key,
  }) {
    return Image(
      key: key,
      image: AssetImage(assetPath, bundle: bundle),
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => fallback(context),
    );
  }
}

/// Home's hero fallback (task 11) until the real `homeScene` art ships
/// (tasks 20/23): a gradient backdrop with a loose stack of the same
/// character tiles the board uses (`MergeRelayBoardArt.paintTile`), plus
/// the brand mark badge in the corner so the "no bundled art" contract this
/// widget's own tests check (`find.byIcon(Icons.alt_route_rounded)`) still
/// holds.
final class _FallbackScene extends StatelessWidget {
  const _FallbackScene();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [MrTokens.paperMuted, MrTokens.paper],
        ),
      ),
      child: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: _FallbackSceneTiles())),
          Positioned(
            left: 14,
            top: 14,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: MrTokens.ink,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Padding(
                padding: EdgeInsets.all(8),
                child: Icon(
                  Icons.alt_route_rounded,
                  size: 20,
                  color: MrTokens.paper,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

final class _FallbackSceneTiles extends CustomPainter {
  const _FallbackSceneTiles();

  @override
  void paint(Canvas canvas, Size size) {
    // Kept entirely in the scene's top-right quadrant (task 11 review): the
    // hero's title/tagline/CTA occupy the bottom ~60% of the hero (see
    // `_HomeHero`'s `Positioned`), and a tile drifting down into that band
    // visibly collided with the headline text.
    final side = size.shortestSide * 0.24;
    final centers = [
      Offset(size.width * 0.62, size.height * 0.16),
      Offset(size.width * 0.84, size.height * 0.28),
      Offset(size.width * 0.7, size.height * 0.34),
    ];
    const values = [4, 16, 8];
    for (var i = 0; i < centers.length; i += 1) {
      final rect = Rect.fromCenter(
        center: centers[i],
        width: side,
        height: side,
      );
      MergeRelayBoardArt.paintTile(
        canvas,
        rect,
        value: values[i],
        theme: signalRelayTheme,
        highContrast: false,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _FallbackSceneTiles oldDelegate) => false;
}

final class _FallbackWordmark extends StatelessWidget {
  const _FallbackWordmark({required this.stacked});

  final bool stacked;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        stacked ? 'MERGE\nRELAY' : 'MERGE RELAY',
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontFamily: 'Fredoka',
          color: MrTokens.ink,
          fontSize: 22,
          fontWeight: FontWeight.w700,
          height: 1.05,
        ),
      ),
    );
  }
}

final class _FallbackTileFace extends StatelessWidget {
  const _FallbackTileFace({required this.tier});

  final int tier;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: MrTokens.tileColorFor(tier),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          '$tier',
          style: TextStyle(
            fontFamily: 'Fredoka',
            color: MrTokens.tileNumeralColorFor(tier),
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

final class _FallbackBoardFrame extends StatelessWidget {
  const _FallbackBoardFrame();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: MrTokens.ink,
        borderRadius: BorderRadius.circular(MrTokens.radiusLarge),
      ),
    );
  }
}
