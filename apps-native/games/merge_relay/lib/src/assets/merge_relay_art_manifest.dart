import 'package:flutter/material.dart';

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
      child: const Center(
        child: Icon(Icons.alt_route_rounded, size: 48, color: MrTokens.ink),
      ),
    );
  }
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
