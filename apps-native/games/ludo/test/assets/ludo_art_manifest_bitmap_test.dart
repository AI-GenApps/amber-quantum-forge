import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/assets/ludo_art_manifest.dart';

/// A minimal 1x1 transparent PNG, valid enough for [Image.asset] to decode
/// without a real art asset in this package.
final Uint8List _onePixelPng = Uint8List.fromList([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, //
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, //
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, //
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, //
  0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41, //
  0x54, 0x78, 0x9C, 0x63, 0x64, 0x60, 0x60, 0x60, //
  0x00, 0x00, 0x00, 0x05, 0x00, 0x01, 0x5A, 0x98, //
  0x22, 0x91, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, //
  0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82, //
]);

/// A fake [AssetBundle] that has exactly one bitmap present, at
/// `assets/art/present-slot.png`, and throws for any other key — proving
/// [LudoArtManifest.hasBitmap]/[LudoArtSlot] resolve per-slot rather than
/// via a single hardcoded boolean.
class _FakeBundle extends CachingAssetBundle {
  /// `Image.asset` resolves variants via `AssetManifest.bin` before it
  /// ever calls [load] for the actual asset key — an empty manifest here
  /// (no declared assets/variants) keeps that resolution path happy so
  /// this fake bundle only needs to answer for the one asset key it cares
  /// about.
  static final ByteData _emptyAssetManifest = const StandardMessageCodec()
      .encodeMessage(<String, Object?>{})!;

  @override
  Future<ByteData> load(String key) async {
    if (key == 'AssetManifest.bin') {
      return _emptyAssetManifest;
    }
    if (key == 'assets/art/present-slot.png') {
      return _onePixelPng.buffer.asByteData();
    }
    throw FlutterError('Unable to load asset: $key');
  }

  @override
  Future<T> loadStructuredData<T>(
    String key,
    FutureOr<T> Function(String value) parser,
  ) async {
    throw UnimplementedError();
  }
}

void main() {
  final bundle = _FakeBundle();

  group('LudoArtManifest.hasBitmap', () {
    test('resolves true for a slot present in the bundle', () async {
      expect(
        await LudoArtManifest.hasBitmap('present-slot', bundle: bundle),
        isTrue,
      );
    });

    test('resolves false for a slot absent from the bundle', () async {
      expect(
        await LudoArtManifest.hasBitmap('missing-slot', bundle: bundle),
        isFalse,
      );
    });

    test('resolves false against the real bundle for any slot today', () async {
      // No bitmap art exists yet anywhere in this package (task 12b adds
      // none) — every slot must fall back to its code-drawn painter.
      expect(await LudoArtManifest.hasBitmap('board-background'), isFalse);
    });

    test('resolves true against the real bundle for every lobby art slot '
        '(task 12h) — proves the 5 bundled bitmaps are actually wired '
        'through pubspec.yaml\'s assets/art/ declaration, not just present '
        'as files on disk', () async {
      for (final slot in [
        LudoArtManifest.lobbyBackgroundSlot,
        LudoArtManifest.lobbyTileComputerSlot,
        LudoArtManifest.lobbyTilePassAndPlaySlot,
        LudoArtManifest.lobbyTileFriendsSlot,
        LudoArtManifest.lobbyTileOnlineSlot,
      ]) {
        expect(
          await LudoArtManifest.hasBitmap(slot),
          isTrue,
          reason: 'expected a bundled bitmap for slot "$slot"',
        );
      }
    });
  });

  group('LudoArtSlot', () {
    testWidgets('falls back to the code-drawn painter when no bitmap exists', (
      tester,
    ) async {
      var painterCalled = false;
      await tester.pumpWidget(
        MaterialApp(
          home: LudoArtSlot(
            slot: 'missing-slot',
            bundle: bundle,
            fallbackPainter: (canvas, rect) {
              painterCalled = true;
              canvas.drawRect(rect, Paint()..color = Colors.red);
            },
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(painterCalled, isTrue);
      expect(find.byType(Image), findsNothing);
      expect(find.byType(CustomPaint), findsWidgets);
    });

    testWidgets('renders the bitmap when one is present for the slot', (
      tester,
    ) async {
      // The [FutureBuilder]'s very first (synchronous) build necessarily
      // has no data yet and paints the fallback for one frame — this
      // test asserts the *settled* state, once [hasBitmap] has resolved,
      // shows the bitmap and stops calling the fallback painter.
      await tester.pumpWidget(
        MaterialApp(
          home: LudoArtSlot(
            slot: 'present-slot',
            bundle: bundle,
            fallbackPainter: (canvas, rect) {},
          ),
        ),
      );
      await tester.pumpAndSettle();

      var painterCalledAfterSettling = false;
      await tester.pumpWidget(
        MaterialApp(
          home: LudoArtSlot(
            slot: 'present-slot',
            bundle: bundle,
            fallbackPainter: (canvas, rect) =>
                painterCalledAfterSettling = true,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(painterCalledAfterSettling, isFalse);
      expect(find.byType(Image), findsOneWidget);
    });
  });
}
