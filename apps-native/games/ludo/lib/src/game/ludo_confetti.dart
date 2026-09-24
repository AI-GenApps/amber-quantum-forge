/// Win confetti: a code-drawn, board-wide particle celebration played once
/// a match ends. Uses Flame's particle system (`ParticleSystemComponent`)
/// with a bounded lifetime, so it costs nothing once the celebration ends.
/// No bitmap asset is used, per task 05's Context/Decisions.
library;

import 'dart:math' as math;

import 'package:flame/components.dart';
import 'package:flame/particles.dart';
import 'package:flutter/material.dart';

import '../state/reduced_motion_setting.dart';

/// How long (non-reduced-motion) confetti falls before the effect ends.
const ludoConfettiLifespan = Duration(milliseconds: 1400);

/// How long the static flash substituted under reduced motion lives.
const ludoConfettiFlashLifespan = Duration(milliseconds: 60);

/// Number of confetti pieces in a full-motion celebration.
const ludoConfettiCount = 40;

/// The four player colors plus white, so every seat is represented in the
/// celebration regardless of who won.
const ludoConfettiPalette = [
  Color(0xFFE53935),
  Color(0xFF43A047),
  Color(0xFFFDD835),
  Color(0xFF1E88E5),
  Color(0xFFFFFFFF),
];

/// Builds the win-confetti particle: pieces spawn across the top of
/// [boardSize] and fall with gravity, drifting sideways and spinning, over
/// [ludoConfettiLifespan]. With [ReducedMotionSetting.value] `true`,
/// returns a single static flash frame (a scattered row of static dots)
/// instead of animated fall.
Particle buildLudoConfettiParticle({
  required Vector2 boardSize,
  required ReducedMotionSetting reducedMotion,
  math.Random? random,
}) {
  final rng = random ?? math.Random();
  if (reducedMotion.value) {
    return Particle.generate(
      count: ludoConfettiPalette.length,
      lifespan: ludoConfettiFlashLifespan.inMilliseconds / 1000,
      generator: (i) {
        final x = boardSize.x * (i + 0.5) / ludoConfettiPalette.length;
        return CircleParticle(
          radius: 6,
          paint: Paint()..color = ludoConfettiPalette[i],
        ).translated(Vector2(x, boardSize.y * 0.15));
      },
    );
  }
  return Particle.generate(
    count: ludoConfettiCount,
    lifespan: ludoConfettiLifespan.inMilliseconds / 1000,
    generator: (i) {
      final startX = rng.nextDouble() * boardSize.x;
      final color = ludoConfettiPalette[i % ludoConfettiPalette.length];
      return CircleParticle(radius: 4, paint: Paint()..color = color)
          .rotating(from: 0, to: (rng.nextDouble() - 0.5) * 4 * math.pi)
          .accelerated(
            position: Vector2(startX, -boardSize.y * 0.05),
            speed: Vector2(
              (rng.nextDouble() - 0.5) * 70,
              90 + rng.nextDouble() * 60,
            ),
            acceleration: Vector2(0, 60),
          );
    },
  );
}

/// A one-shot win-confetti celebration spanning [boardSize]. Self-removes
/// once its particle's bounded lifetime ends.
class LudoConfettiComponent extends ParticleSystemComponent {
  LudoConfettiComponent({
    required Vector2 boardSize,
    ReducedMotionSetting? reducedMotion,
    math.Random? random,
  }) : super(
         size: boardSize,
         particle: buildLudoConfettiParticle(
           boardSize: boardSize,
           reducedMotion: reducedMotion ?? ReducedMotionSetting(),
           random: random,
         ),
       );
}
