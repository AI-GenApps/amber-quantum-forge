import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/assets/merge_relay_art_manifest.dart';

/// A 1x1 transparent PNG, used to stand in for a "bundled" art asset
/// without shipping a real one in this task (art comes in tasks 08+).
final Uint8List _samplePng = base64Decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY'
  '42YAAAAASUVORK5CYII=',
);

/// Serves [_samplePng] for exactly one asset path — this is what lets the
/// "bundled" test path be distinguished from the (default) "not bundled"
/// fallback path. Every other lookup (notably `AssetManifest.bin`, which
/// `AssetImage` reads first to resolve resolution-aware variants) falls
/// through to the real [rootBundle] so that bookkeeping still succeeds; it
/// simply has no knowledge of this fake path, which is exactly "no known
/// variants" — the outcome this test wants.
final class _SingleAssetBundle extends CachingAssetBundle {
  _SingleAssetBundle(this.bundledPath);

  final String bundledPath;

  @override
  Future<ByteData> load(String key) async {
    if (key == bundledPath) return ByteData.sublistView(_samplePng);
    return rootBundle.load(key);
  }
}

void main() {
  group('fallback path (no bundled art)', () {
    testWidgets('homeScene renders its fallback', (tester) async {
      await tester.runAsync(() async {
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 200,
              height: 200,
              child: MergeRelayArtManifest.homeScene(),
            ),
          ),
        );
        await tester.pump();
        await tester.pump();
      });

      expect(find.byIcon(Icons.alt_route_rounded), findsOneWidget);
    });

    testWidgets('tileFace(2) renders its fallback disc with a numeral', (
      tester,
    ) async {
      await tester.runAsync(() async {
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 80,
              height: 80,
              child: MergeRelayArtManifest.tileFace(2),
            ),
          ),
        );
        await tester.pump();
        await tester.pump();
      });

      expect(find.text('2'), findsOneWidget);
    });

    testWidgets('boardFrame and logo slots render their fallbacks', (
      tester,
    ) async {
      await tester.runAsync(() async {
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: Column(
              children: [
                SizedBox(
                  width: 200,
                  height: 200,
                  child: MergeRelayArtManifest.boardFrame(),
                ),
                SizedBox(
                  width: 200,
                  height: 80,
                  child: MergeRelayArtManifest.logoWide(),
                ),
                SizedBox(
                  width: 200,
                  height: 80,
                  child: MergeRelayArtManifest.logoStacked(),
                ),
              ],
            ),
          ),
        );
        await tester.pump();
        await tester.pump();
      });

      expect(find.text('MERGE RELAY'), findsOneWidget);
      expect(find.text('MERGE\nRELAY'), findsOneWidget);
    });
  });

  group('bundled path (art present under assets/art/)', () {
    testWidgets('homeScene decodes and paints the bundled bitmap', (
      tester,
    ) async {
      final bundle = _SingleAssetBundle('assets/art/homeScene.png');
      await tester.runAsync(() async {
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 200,
              height: 200,
              child: MergeRelayArtManifest.homeScene(bundle: bundle),
            ),
          ),
        );
        await tester.pump();
        await tester.pump();
      });

      // The fallback's marker icon must NOT appear once the bitmap decodes.
      expect(find.byIcon(Icons.alt_route_rounded), findsNothing);
      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('tileFace(4096) decodes the bundled bitmap, not the disc', (
      tester,
    ) async {
      final bundle = _SingleAssetBundle('assets/art/tileFace_4096.png');
      await tester.runAsync(() async {
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 80,
              height: 80,
              child: MergeRelayArtManifest.tileFace(4096, bundle: bundle),
            ),
          ),
        );
        await tester.pump();
        await tester.pump();
      });

      expect(find.text('4096'), findsNothing);
      expect(find.byType(Image), findsOneWidget);
    });
  });
}
