/// Merge Relay brand art manifest.
///
/// Named-slot registry for the approved "Merge Relay" brand bitmaps
/// (`.agents/resources/2026-09-26/merge-relay-brand/logo-round2/`, approved
/// 2026-09-26). Gameplay/UI code references a slot by name via
/// [MergeRelayArtSlot] — it never embeds a raw asset path. Each slot falls
/// back to an existing code-drawn widget if its bitmap fails to load, so the
/// app never breaks on a missing/corrupt asset.
library;

import 'package:flutter/material.dart';

abstract final class MergeRelayArtManifest {
  /// The stacked brand mark (gold-ringed emblem over the "MERGE RELAY"
  /// wordmark). Bitmap: `assets/art/logo_stacked.png`, derived from
  /// `wordmark-v2-transparent.png`. Used for the home-screen hero (this app
  /// has no dedicated splash widget).
  static const String logoStackedSlot = 'logo_stacked';

  /// The wide single-line "MERGE RELAY" wordmark. Bitmap:
  /// `assets/art/logo_wide.png`, derived from `wordmark-v1-transparent.png`.
  /// Used in the home header.
  static const String logoWideSlot = 'logo_wide';

  static String bitmapAssetPath(String slot) => 'assets/art/$slot.png';
}

/// Renders a named art-manifest [slot]: the bitmap at
/// `assets/art/<slot>.png` when it loads cleanly, otherwise [fallback] —
/// the existing code-drawn widget used before that bitmap existed. Uses
/// [Image.errorBuilder] rather than an async existence check, so the
/// fallback decision is synchronous and never depends on pump timing.
class MergeRelayArtSlot extends StatelessWidget {
  const MergeRelayArtSlot({
    super.key,
    required this.slot,
    required this.fallback,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
    this.bundle,
  });

  /// Slot name; resolves to `assets/art/<slot>.png`.
  final String slot;

  /// Existing code-drawn widget used when the bitmap fails to load.
  final Widget fallback;

  final double? width;
  final double? height;
  final BoxFit fit;

  /// Overrides the default asset bundle — tests use this to exercise the
  /// fallback path without touching the real asset file.
  final AssetBundle? bundle;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      MergeRelayArtManifest.bitmapAssetPath(slot),
      bundle: bundle,
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (context, error, stackTrace) => fallback,
    );
  }
}
