import 'package:flame/components.dart';
import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_confetti.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';

void main() {
  group('LudoConfettiComponent', () {
    testWithFlameGame(
      'a full-motion celebration removes itself once its bounded lifetime '
      'ends',
      (game) async {
        final confetti = LudoConfettiComponent(boardSize: Vector2.all(300));
        await game.ensureAdd(confetti);

        expect(game.children.contains(confetti), isTrue);

        var elapsed = 0.0;
        const dt = 1 / 60;
        while (game.children.contains(confetti)) {
          game.update(dt);
          elapsed += dt;
          if (elapsed > 5) {
            fail('confetti never self-removed (unbounded lifetime)');
          }
        }

        expect(elapsed, greaterThan(0));
        expect(
          elapsed,
          lessThan(2.0),
          reason: 'confetti must have a bounded, non-persistent lifetime',
        );
      },
    );

    testWithFlameGame(
      'reduced motion renders a single static flash rather than falling '
      'confetti',
      (game) async {
        final reducedMotion = ReducedMotionSetting(enabled: true);
        final confetti = LudoConfettiComponent(
          boardSize: Vector2.all(300),
          reducedMotion: reducedMotion,
        );
        await game.ensureAdd(confetti);

        var frames = 0;
        while (game.children.contains(confetti) && frames < 20) {
          game.update(1 / 60);
          frames++;
        }

        expect(
          frames,
          lessThan(10),
          reason: 'reduced-motion flash must be near-instant',
        );
      },
    );
  });
}
