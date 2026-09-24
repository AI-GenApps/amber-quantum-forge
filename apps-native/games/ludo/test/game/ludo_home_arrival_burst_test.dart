import 'package:flame/components.dart';
import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_capture_particles.dart'
    show ludoCaptureParticlePalette;
import 'package:ludo/src/game/ludo_home_arrival_burst.dart';
import 'package:ludo/src/state/reduced_motion_setting.dart';

void main() {
  group('LudoHomeArrivalBurstComponent', () {
    testWithFlameGame(
      'a full-motion burst removes itself once its bounded lifetime ends',
      (game) async {
        final burst = LudoHomeArrivalBurstComponent(position: Vector2.all(50));
        await game.ensureAdd(burst);

        expect(game.children.contains(burst), isTrue);

        var elapsed = 0.0;
        const dt = 1 / 60;
        while (game.children.contains(burst)) {
          game.update(dt);
          elapsed += dt;
          if (elapsed > 3) {
            fail('home-arrival burst never self-removed (unbounded lifetime)');
          }
        }

        expect(elapsed, greaterThan(0));
        expect(
          elapsed,
          lessThan(1.0),
          reason: 'home-arrival burst must have a short, bounded lifetime',
        );
      },
    );

    testWithFlameGame(
      'reduced motion renders a single static flash rather than an '
      'animated burst',
      (game) async {
        final reducedMotion = ReducedMotionSetting(enabled: true);
        final burst = LudoHomeArrivalBurstComponent(
          position: Vector2.all(50),
          reducedMotion: reducedMotion,
        );
        await game.ensureAdd(burst);

        var frames = 0;
        while (game.children.contains(burst) && frames < 20) {
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

    test('uses a palette disjoint from the capture burst, so a golden/'
        'screenshot can tell the two effects apart', () {
      final homeArrivalColors = ludoHomeArrivalPalette.toSet();
      final captureColors = ludoCaptureParticlePalette.toSet();
      expect(homeArrivalColors.intersection(captureColors), isEmpty);
    });
  });
}
