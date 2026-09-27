import 'dart:convert';
import 'dart:ui' as ui;

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

/// The inverse of [_SingleAssetBundle]: makes exactly [missingPath] behave
/// as "not bundled" (throws, the same as a real missing-asset lookup),
/// regardless of whether a real file happens to exist at that path in this
/// package's own `assets/art/` — used to prove the manifest's fallback
/// mechanism itself still works for [logoWide]/[logoStacked] now that task
/// 22 ships real bitmaps there by default.
final class _MissingAssetBundle extends CachingAssetBundle {
  _MissingAssetBundle(this.missingPath);

  final String missingPath;

  @override
  Future<ByteData> load(String key) async {
    if (key == missingPath) {
      throw FlutterError('Unable to load asset: "$missingPath".');
    }
    return rootBundle.load(key);
  }
}

void main() {
  group('fallback path (no bundled art)', () {
    // homeScene/tileFace/boardFrame/chapterCard all ship real bitmaps by
    // default as of task 23 (like logoWide/logoStacked since task 22), so
    // each fallback test below forces its own slot's asset path to behave
    // as "not bundled" via `_MissingAssetBundle` — proving the fallback
    // mechanism itself still works — rather than relying on the default
    // bundle actually missing the file.
    testWidgets('homeScene renders its fallback', (tester) async {
      final bundle = _MissingAssetBundle('assets/art/homeScene.png');
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

      expect(find.byIcon(Icons.alt_route_rounded), findsOneWidget);
    });

    testWidgets('tileFace(2) renders its fallback disc with a numeral', (
      tester,
    ) async {
      final bundle = _MissingAssetBundle('assets/art/tileFace_2.png');
      await tester.runAsync(() async {
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 80,
              height: 80,
              child: MergeRelayArtManifest.tileFace(2, bundle: bundle),
            ),
          ),
        );
        await tester.pump();
        await tester.pump();
      });

      expect(find.text('2'), findsOneWidget);
    });

    testWidgets('boardFrame renders its fallback', (tester) async {
      final bundle = _MissingAssetBundle('assets/art/boardFrame.png');
      await tester.runAsync(() async {
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 200,
              height: 200,
              child: MergeRelayArtManifest.boardFrame(bundle: bundle),
            ),
          ),
        );
        await tester.pump();
        await tester.pump();
      });

      // No on-screen text to assert on for this fallback (a plain
      // DecoratedBox) — this mainly guards against the fallback path
      // throwing when the bitmap fails to load.
      expect(tester.takeException(), isNull);
    });

    testWidgets('chapterCard(1) renders its fallback', (tester) async {
      final bundle = _MissingAssetBundle('assets/art/chapterCard_1.png');
      await tester.runAsync(() async {
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 40,
              height: 40,
              child: MergeRelayArtManifest.chapterCard(1, bundle: bundle),
            ),
          ),
        );
        await tester.pump();
        await tester.pump();
      });

      expect(find.byIcon(Icons.terrain_rounded), findsOneWidget);
    });

    testWidgets(
      'logoWide and logoStacked fall back to text when their bitmap fails '
      'to load',
      (tester) async {
        final wideBundle = _MissingAssetBundle('assets/art/logoWide.png');
        final stackedBundle = _MissingAssetBundle('assets/art/logoStacked.png');
        await tester.runAsync(() async {
          await tester.pumpWidget(
            Directionality(
              textDirection: TextDirection.ltr,
              child: Column(
                children: [
                  SizedBox(
                    width: 200,
                    height: 80,
                    child: MergeRelayArtManifest.logoWide(bundle: wideBundle),
                  ),
                  SizedBox(
                    width: 200,
                    height: 80,
                    child: MergeRelayArtManifest.logoStacked(
                      bundle: stackedBundle,
                    ),
                  ),
                ],
              ),
            ),
          );
          await tester.pump();
          await tester.pump();
        });

        expect(find.text('GLOW RESCUE'), findsOneWidget);
        expect(find.text('GLOW\nRESCUE'), findsOneWidget);
      },
    );
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

    testWidgets(
      'chapterCard(3) decodes the bundled bitmap, not the fallback icon',
      (tester) async {
        final bundle = _SingleAssetBundle('assets/art/chapterCard_3.png');
        await tester.runAsync(() async {
          await tester.pumpWidget(
            Directionality(
              textDirection: TextDirection.ltr,
              child: SizedBox(
                width: 40,
                height: 40,
                child: MergeRelayArtManifest.chapterCard(3, bundle: bundle),
              ),
            ),
          );
          await tester.pump();
          await tester.pump();
        });

        expect(find.byIcon(Icons.terrain_rounded), findsNothing);
        expect(find.byType(Image), findsOneWidget);
      },
    );

    testWidgets('logoWide decodes the bundled bitmap, not the fallback text', (
      tester,
    ) async {
      final bundle = _SingleAssetBundle('assets/art/logoWide.png');
      await tester.runAsync(() async {
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: SizedBox(
              width: 200,
              height: 80,
              child: MergeRelayArtManifest.logoWide(bundle: bundle),
            ),
          ),
        );
        await tester.pump();
        await tester.pump();
      });

      expect(find.text('GLOW RESCUE'), findsNothing);
      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets(
      'logoStacked decodes the bundled bitmap, not the fallback text',
      (tester) async {
        final bundle = _SingleAssetBundle('assets/art/logoStacked.png');
        await tester.runAsync(() async {
          await tester.pumpWidget(
            Directionality(
              textDirection: TextDirection.ltr,
              child: SizedBox(
                width: 200,
                height: 80,
                child: MergeRelayArtManifest.logoStacked(bundle: bundle),
              ),
            ),
          );
          await tester.pump();
          await tester.pump();
        });

        expect(find.text('GLOW\nRESCUE'), findsNothing);
        expect(find.byType(Image), findsOneWidget);
      },
    );
  });

  group('logoStacked.png background alpha (task 22 fix round 2)', () {
    testWidgets(
      'the corners and the area around the icon are transparent, not a '
      'visible pale box',
      (tester) async {
        // The icon master (direction A) came back opaque RGB with its own
        // flat cream background; the first cut of `logoStacked.png`
        // composited it straight in (full alpha=255), which painted a
        // visible pale square behind the glowing tile on `welcome.png`.
        // This decodes the REAL shipped asset (not a fake bundle) and
        // checks its actual alpha channel — real, file-backed decode, so
        // it must run inside `runAsync` (see `_bootApp`'s doc comment in
        // `test/goldens/screens_test.dart` for why).
        late ui.Image image;
        await tester.runAsync(() async {
          final data = await rootBundle.load('assets/art/logoStacked.png');
          final codec = await ui.instantiateImageCodec(
            data.buffer.asUint8List(),
          );
          image = (await codec.getNextFrame()).image;
        });

        final pixels = await tester.runAsync(
          () => image.toByteData(format: ui.ImageByteFormat.rawRgba),
        );
        final bytes = pixels!.buffer.asUint8List();
        final w = image.width;
        final h = image.height;
        int alphaAt(int x, int y) => bytes[(y * w + x) * 4 + 3];

        // Corners: must be fully transparent (no box edge anywhere near
        // the canvas bounds).
        for (final point in [(1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2)]) {
          expect(
            alphaAt(point.$1, point.$2),
            0,
            reason: 'corner ${point.$1},${point.$2} should be transparent',
          );
        }
        // A strip to the left of the icon, at a row that's within the
        // icon's own vertical span but past its left edge (the icon sits
        // roughly centered in the top third of the canvas) — this is
        // exactly where the old opaque composite showed its pale box
        // edge, and simple corner sampling alone wouldn't catch it.
        final iconRowY = h ~/ 8;
        for (var x = 1; x < 10; x++) {
          expect(
            alphaAt(x, iconRowY),
            0,
            reason: 'left-of-icon x=$x,y=$iconRowY should be transparent',
          );
        }
        // The tile's own interior (same row, centered) must still reach
        // full opacity — proves this is a real key-out with a soft edge,
        // not an accidentally-fully-transparent image.
        expect(alphaAt(w ~/ 2, iconRowY), 255);
      },
    );
  });
}
