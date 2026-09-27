import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'merge_relay_art_manifest.dart';

/// Decoded bitmaps for the manifest slots that a raw `CustomPainter.paint`
/// draws directly onto a `Canvas` — `MergeRelayBoardArt.paintTile`'s
/// tile-tier art and `paintBoardTray`'s board-frame art (task 23). Unlike
/// the widget-level slots in [MergeRelayArtManifest] (which can just use an
/// `Image` widget's own async decode + `errorBuilder` fallback), a
/// `CustomPainter.paint` call is synchronous and can't await an asset
/// decode mid-frame — so this cache is populated once, ahead of time
/// ([ensureLoaded]), and read back synchronously via [imageFor]. A path
/// with no bundled file (not yet rendered, or intentionally left to the
/// caller's procedural fallback) is simply absent from the map; callers
/// treat a null [imageFor] result exactly like the widget slots' fallback
/// path.
final class MrBitmapArtCache {
  MrBitmapArtCache._();

  static final MrBitmapArtCache instance = MrBitmapArtCache._();

  final Map<String, ui.Image> _images = {};
  Future<void>? _loading;

  /// Bumped once after every completed [ensureLoaded] pass — callers that
  /// paint from this cache (the board widget) merge this into their own
  /// repaint `Listenable`s so a bitmap that finishes decoding after the
  /// first frame still shows up without waiting for an unrelated repaint.
  final ValueNotifier<int> version = ValueNotifier<int>(0);

  ui.Image? imageFor(String assetPath) => _images[assetPath];

  /// Decodes every bundled tile-tier and board-frame asset once. Safe to
  /// call more than once (returns the same in-flight/completed future).
  Future<void> ensureLoaded({AssetBundle? bundle}) {
    return _loading ??= _load(bundle ?? rootBundle);
  }

  Future<void> _load(AssetBundle bundle) async {
    final paths = [
      for (final tier in MergeRelayArtManifest.tileFaceTiers)
        'assets/art/tileFace_$tier.png',
      'assets/art/boardFrame.png',
    ];
    for (final path in paths) {
      try {
        final data = await bundle.load(path);
        final codec = await ui.instantiateImageCodec(data.buffer.asUint8List());
        final frame = await codec.getNextFrame();
        _images[path] = frame.image;
      } on Object {
        // Not bundled (yet) — the caller's procedural fallback handles it.
      }
    }
    version.value += 1;
  }

  /// Test-only: clears cached state so isolated tests don't leak bitmaps
  /// decoded by an earlier test in the same file/isolate.
  @visibleForTesting
  void resetForTest() {
    _images.clear();
    _loading = null;
  }

  /// Test-only: injects a decoded image directly, skipping the asset
  /// bundle entirely — lets a unit test exercise the bitmap-paint branch
  /// with a synthetic `ui.Image` it built in-memory (e.g. via
  /// `PictureRecorder`) instead of needing a real PNG fixture.
  @visibleForTesting
  void putForTest(String assetPath, ui.Image image) {
    _images[assetPath] = image;
  }
}
