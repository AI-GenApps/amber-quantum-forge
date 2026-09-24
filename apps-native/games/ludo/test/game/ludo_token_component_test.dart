import 'dart:async';

import 'package:flame/components.dart';
import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_token_component.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

void main() {
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
