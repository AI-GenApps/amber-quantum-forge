import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/widgets/ludo_avatar.dart';

Future<Uint8List> _renderPng(WidgetTester tester, String avatarId) async {
  final key = GlobalKey();
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: Center(
          child: RepaintBoundary(
            key: key,
            child: LudoAvatarView(avatarId: avatarId, size: 64),
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
  final boundary =
      key.currentContext!.findRenderObject() as RenderRepaintBoundary;
  // `toImage`/`toByteData` complete via a real engine (raster thread)
  // callback, not the fake test clock `pump`/`pumpAndSettle` advance — so
  // they must run inside `tester.runAsync` or they can hang indefinitely
  // (reliably reproduced under concurrent test-suite load, since other
  // simultaneously-running `flutter_tester` engines contend for the same
  // real thread this callback depends on, and nothing inside the fake
  // async zone ever gives it a chance to fire).
  final result = await tester.runAsync(() async {
    final image = await boundary.toImage();
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    return bytes!.buffer.asUint8List();
  });
  return result!;
}

void main() {
  test('at least 8 distinct, unique avatar ids exist', () {
    expect(ludoAvatarIds.length, greaterThanOrEqualTo(8));
    expect(ludoAvatarIds.toSet().length, ludoAvatarIds.length);
  });

  test('every avatar id is a distinct color/motif combination', () {
    final combos = ludoAvatars.map((a) => '${a.color}-${a.motif}').toSet();
    expect(combos.length, ludoAvatars.length);
  });

  testWidgets(
    'avatars sharing a color but different motif paint different pixels',
    (tester) async {
      final face = await _renderPng(tester, 'red-face');
      final spark = await _renderPng(tester, 'red-spark');
      expect(face, isNot(equals(spark)));
    },
  );

  testWidgets(
    'avatars sharing a motif but different color paint different pixels',
    (tester) async {
      final red = await _renderPng(tester, 'red-face');
      final green = await _renderPng(tester, 'green-face');
      expect(red, isNot(equals(green)));
    },
  );

  testWidgets('all 8+ avatars are pairwise visually distinct', (tester) async {
    final renders = <String, Uint8List>{};
    for (final id in ludoAvatarIds) {
      renders[id] = await _renderPng(tester, id);
    }
    final ids = renders.keys.toList();
    for (var i = 0; i < ids.length; i++) {
      for (var j = i + 1; j < ids.length; j++) {
        expect(
          renders[ids[i]],
          isNot(equals(renders[ids[j]])),
          reason: '${ids[i]} and ${ids[j]} render identically',
        );
      }
    }
  });

  testWidgets(
    'every avatar tile has a Semantics label and a 48dp+ tap target',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Wrap(
              children: [
                for (final id in ludoAvatarIds) LudoAvatarView(avatarId: id),
              ],
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      for (final id in ludoAvatarIds) {
        final spec = ludoAvatarById(id);
        final label = 'Avatar: ${spec.color.name} ${spec.motif.name}';
        final finder = find.bySemanticsLabel(label);
        expect(finder, findsOneWidget, reason: 'missing Semantics for $id');
        final size = tester.getSize(finder);
        expect(size.width, greaterThanOrEqualTo(48));
        expect(size.height, greaterThanOrEqualTo(48));
      }
    },
  );
}
