import 'dart:math' as math;

import 'package:flame/components.dart';
import 'package:flame_test/flame_test.dart';
import 'package:ludo/src/game/ludo_capture_particles.dart';
import 'package:ludo/src/game/ludo_confetti.dart';
import 'package:ludo/src/game/ludo_dice_component.dart';

/// Golden tests for the animated dice and the capture/confetti particle
/// effects (task 05).
///
/// An instant face-swap with no tumble/flicker/bounce, or a capture burst
/// that is not visually distinct from the home-arrival burst, fails this
/// task's acceptance — see `tasks/epics/15-ludo-launch/05-dice-and-effects.md`.
/// Run `flutter test --update-goldens test/goldens/ludo_effects_golden_test.dart`
/// after any intentional visual change.
void main() {
  for (var face = 1; face <= 6; face++) {
    testGolden(
      'dice landed on face $face',
      (game, tester) async {
        final dice = LudoDiceComponent(initialFace: face)
          ..size = Vector2.all(160)
          ..position = Vector2.all(80);
        await game.ensureAdd(dice);
      },
      goldenFile: 'dice_face_$face.png',
      size: Vector2.all(160),
    );
  }

  testGolden(
    'capture particle burst mid-flight',
    (game, tester) async {
      final burst = LudoCaptureBurstComponent(position: Vector2.all(160));
      await game.ensureAdd(burst);
      await tester.pump(const Duration(milliseconds: 150));
    },
    goldenFile: 'capture_particle_frame.png',
    size: Vector2.all(320),
  );

  testGolden(
    'win confetti mid-fall',
    (game, tester) async {
      final confetti = LudoConfettiComponent(
        boardSize: Vector2.all(320),
        // Seeded so the golden's particle layout is reproducible.
        random: math.Random(7),
      );
      await game.ensureAdd(confetti);
      await tester.pump(const Duration(milliseconds: 300));
    },
    goldenFile: 'win_confetti_frame.png',
    size: Vector2.all(320),
  );
}
