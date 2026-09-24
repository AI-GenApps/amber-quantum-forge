import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_dice_component.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';

void main() {
  group('LudoDiceComponent', () {
    testWithFlameGame(
      'rollTo lands on the requested face after a >=600ms tumble with '
      '>=3 distinct face flickers and a settle bounce',
      (game) async {
        final dice = LudoDiceComponent();
        await game.ensureAdd(dice);

        final done = dice.rollTo(5);
        expect(dice.isRolling, isTrue);

        var elapsed = 0.0;
        const dt = 1 / 60;
        var sawSettling = false;
        while (dice.isRolling) {
          if (dice.isSettling) sawSettling = true;
          game.update(dt);
          elapsed += dt;
          if (elapsed > 5) {
            fail('dice roll animation never settled');
          }
        }
        await done;

        expect(elapsed, greaterThanOrEqualTo(0.6));
        expect(dice.distinctFacesFlickered, greaterThanOrEqualTo(3));
        expect(sawSettling, isTrue, reason: 'settle-bounce phase never ran');
        expect(dice.displayFace, 5);
        expect(dice.isRolling, isFalse);
      },
    );

    testWithFlameGame('every landed face 1..6 is reachable', (game) async {
      final dice = LudoDiceComponent();
      await game.ensureAdd(dice);

      for (var face = 1; face <= 6; face++) {
        final done = dice.rollTo(face);
        while (dice.isRolling) {
          game.update(1 / 60);
        }
        await done;
        expect(dice.displayFace, face);
      }
    });

    testWithFlameGame(
      'reduced motion reveals the final face immediately, with no tumble '
      'frame observed',
      (game) async {
        final reducedMotion = ReducedMotionSetting(enabled: true);
        final dice = LudoDiceComponent(reducedMotion: reducedMotion);
        await game.ensureAdd(dice);

        // No update(dt) call in between: reduced motion must resolve the
        // whole roll within this single rollTo call.
        await dice.rollTo(3);

        expect(dice.isRolling, isFalse);
        expect(dice.isSettling, isFalse);
        expect(dice.displayFace, 3);
        expect(dice.distinctFacesFlickered, 0);
      },
    );
  });
}
