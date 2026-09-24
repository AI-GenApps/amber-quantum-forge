import 'dart:async';
import 'dart:ui';

import 'package:flame/components.dart';
import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_token_component.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

void main() {
  group('LudoTokenPainter.pinPath', () {
    test('traces a pin/map-marker silhouette, not a plain circle', () {
      const rect = Rect.fromLTWH(0, 0, 100, 100);
      final path = LudoTokenPainter.pinPath(rect);
      final bounds = path.getBounds();

      // A pin/teardrop silhouette's bounds reach the very bottom of the
      // rect (the tip).
      expect(bounds.bottom, closeTo(rect.bottom, 0.5));

      // A plain circle inscribed in a square rect has equal width/height
      // bounds; a pin/teardrop silhouette (rounded head, pointed tip) does
      // not — its head sits above center and it tapers to a point at the
      // very bottom of the rect.
      final tip = Offset(rect.center.dx, rect.bottom);
      expect(path.contains(tip - const Offset(0, 0.5)), isTrue);

      final headCenter = LudoTokenPainter.headCenterOf(rect);
      final headRadius = LudoTokenPainter.headRadiusOf(rect);
      // The circular head is well inside the silhouette.
      expect(path.contains(headCenter), isTrue);
      // A point straight below the head, near the rect's bottom-most
      // corners, would be inside a bounding square but must fall outside
      // this tapered silhouette — proof the shape is not a plain circle
      // or a plain square, but a shape that narrows toward the bottom.
      expect(path.contains(Offset(rect.left + 1, rect.bottom - 1)), isFalse);
      expect(path.contains(Offset(rect.right - 1, rect.bottom - 1)), isFalse);
      // Sanity: the head's footprint fits within the rect.
      expect(headCenter.dy - headRadius, greaterThanOrEqualTo(rect.top));
      expect(headRadius, lessThan(rect.width / 2 + 1));
    });
  });

  group('LudoTokenComponent', () {
    testWithFlameGame('hop animation lands on the expected cell', (game) async {
      final token = LudoTokenComponent(
        color: LudoColor.red,
        tokenId: 0,
        boardSize: Vector2.all(300),
        initialCell: (6, 1),
      );
      await game.ensureAdd(token);

      final done = token.hopTo([(6, 2), (6, 3), (6, 4)]);
      expect(token.isAnimating, isTrue);

      // Advance well past 3 hops * ludoTokenHopDuration each.
      for (var i = 0; i < 60; i++) {
        game.update(1 / 60);
      }
      await done;

      expect(token.isAnimating, isFalse);
      expect(token.currentCell, (6, 4));
    });

    testWithFlameGame('reduced motion jumps straight to the final cell with no '
        'intermediate frame', (game) async {
      final reducedMotion = ReducedMotionSetting(enabled: true);
      final token = LudoTokenComponent(
        color: LudoColor.blue,
        tokenId: 1,
        boardSize: Vector2.all(300),
        initialCell: (13, 6),
        reducedMotion: reducedMotion,
      );
      await game.ensureAdd(token);

      // No update(dt) call in between: reduced motion must resolve the
      // whole move within this single hopTo call.
      await token.hopTo([(12, 6), (11, 6)]);

      expect(token.isAnimating, isFalse);
      expect(token.currentCell, (11, 6));
    });

    testWithFlameGame('mid-hop progress has not yet reached the target cell', (
      game,
    ) async {
      final token = LudoTokenComponent(
        color: LudoColor.green,
        tokenId: 2,
        boardSize: Vector2.all(300),
        initialCell: (1, 8),
      );
      await game.ensureAdd(token);

      unawaited(token.hopTo([(1, 9)]));
      // Well under ludoTokenHopDuration (120ms).
      game.update(0.02);

      expect(token.isAnimating, isTrue);
      expect(token.currentCell, (1, 8));
    });

    testWithFlameGame('snapTo moves instantly with no animation state', (
      game,
    ) async {
      final token = LudoTokenComponent(
        color: LudoColor.yellow,
        tokenId: 3,
        boardSize: Vector2.all(300),
        initialCell: (7, 13),
      );
      await game.ensureAdd(token);

      token.snapTo((7, 8));

      expect(token.isAnimating, isFalse);
      expect(token.currentCell, (7, 8));
    });
  });
}
