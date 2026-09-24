/// Home-arrival effect: a code-drawn particle burst played when a token
/// reaches home, visually distinct from [LudoCaptureBurstComponent] (see
/// `ludo_capture_particles.dart`) — a warmer color palette and an
/// upward/outward fan shape instead of a flat radial ring — so the two
/// effects read differently in a golden/screenshot.
///
/// Uses Flame's particle system with a bounded lifetime; no bitmap asset is
/// used, per task 05's Context/Decisions.
library;

import 'dart:math' as math;

import 'package:flame/components.dart';
import 'package:flame/particles.dart';
import 'package:flutter/material.dart';

import '../state/reduced_motion_setting.dart';

/// How long a (non-reduced-motion) home-arrival burst lives.
const ludoHomeArrivalParticleLifespan = Duration(milliseconds: 600);

/// How long the static flash substituted under reduced motion lives.
const ludoHomeArrivalFlashLifespan = Duration(milliseconds: 60);

/// Number of particles in a full-motion home-arrival burst.
const ludoHomeArrivalParticleCount = 12;

/// Warmer palette than [ludoCaptureParticlePalette], so a home arrival and
/// a capture never share a color scheme.
const ludoHomeArrivalPalette = [
  Color(0xFFFFC107),
  Color(0xFFFF8F00),
  Color(0xFFFFF8E1),
];

/// Builds the home-arrival particle: an upward, outward-fanning spray of
/// small circles (distinct in shape from the capture burst's flat radial
/// ring) that rise and fade over [ludoHomeArrivalParticleLifespan]. With
/// [ReducedMotionSetting.value] `true`, returns a single static flash
/// instead.
Particle buildLudoHomeArrivalParticle({
  required ReducedMotionSetting reducedMotion,
}) {
  if (reducedMotion.value) {
    return CircleParticle(
      radius: 18,
      paint: Paint()
        ..color = ludoHomeArrivalPalette.first.withValues(alpha: 0.85),
      lifespan: ludoHomeArrivalFlashLifespan.inMilliseconds / 1000,
    );
  }
  return Particle.generate(
    count: ludoHomeArrivalParticleCount,
    lifespan: ludoHomeArrivalParticleLifespan.inMilliseconds / 1000,
    generator: (i) {
      // Fan spread across roughly a half-circle, biased upward (negative
      // y), rather than the capture burst's full 360-degree ring.
      final spread = (i / ludoHomeArrivalParticleCount - 0.5) * math.pi * 0.9;
      final direction = Vector2(math.sin(spread), -math.cos(spread));
      final color = ludoHomeArrivalPalette[i % ludoHomeArrivalPalette.length];
      return CircleParticle(
        radius: 5,
        paint: Paint()..color = color,
      ).accelerated(acceleration: Vector2(0, 160), speed: direction * 130);
    },
  );
}

/// A one-shot home-arrival particle burst placed at [position] (board
/// pixel space). Self-removes once its particle's bounded lifetime ends.
class LudoHomeArrivalBurstComponent extends ParticleSystemComponent {
  LudoHomeArrivalBurstComponent({
    required Vector2 position,
    ReducedMotionSetting? reducedMotion,
  }) : super(
         position: position,
         anchor: Anchor.center,
         particle: buildLudoHomeArrivalParticle(
           reducedMotion: reducedMotion ?? ReducedMotionSetting(),
         ),
       );
}
