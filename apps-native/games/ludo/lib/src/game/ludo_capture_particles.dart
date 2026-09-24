/// Capture effect: a code-drawn particle burst at the cell where a token
/// was captured, plus the flight-back tween the knocked token itself runs
/// (via [LudoTokenComponent.flyTo]) instead of teleporting to its yard.
///
/// Uses Flame's particle system (`ParticleSystemComponent`) with a bounded
/// lifetime — no persistent performance cost after the burst ends. No
/// bitmap asset is used, per task 05's Context/Decisions.
library;

import 'dart:math' as math;

import 'package:flame/components.dart';
import 'package:flame/particles.dart';
import 'package:flutter/material.dart';

import '../assets/ludo_art_manifest.dart';
import '../state/reduced_motion_setting.dart';
import '../theme/ludo_theme_tokens.dart';

/// How long a (non-reduced-motion) capture particle burst lives.
const ludoCaptureParticleLifespan = Duration(milliseconds: 480);

/// How long the static flash substituted under reduced motion lives — long
/// enough to render one frame, short enough to be effectively instant.
const ludoCaptureFlashLifespan = Duration(milliseconds: 60);

/// Number of particles in a full-motion capture burst.
const ludoCaptureParticleCount = 10;

/// How far (in local px) a capture particle travels from the burst origin.
const ludoCaptureParticleReach = 70.0;

/// Cool red/blue palette for the capture burst, sourced from
/// [LudoThemeTokens]'s per-seat palette rather than ad hoc colors, kept
/// visually distinct from [ludoHomeArrivalPalette]'s warm gold one so a
/// golden/screenshot can tell the two effects apart.
const ludoCaptureParticlePalette = [
  LudoThemeTokens.seatRed,
  LudoThemeTokens.seatBlue,
  Colors.white,
];

/// Builds the capture particle: a ring of small circles flying outward and
/// fading over [ludoCaptureParticleLifespan]. With
/// [ReducedMotionSetting.value] `true`, returns a single static flash
/// particle instead of an animated burst.
Particle buildLudoCaptureParticle({
  required ReducedMotionSetting reducedMotion,
}) {
  if (reducedMotion.value) {
    return CircleParticle(
      radius: 16,
      paint: Paint()
        ..color = ludoCaptureParticlePalette.first.withValues(alpha: 0.85),
      lifespan: ludoCaptureFlashLifespan.inMilliseconds / 1000,
    );
  }
  return Particle.generate(
    count: ludoCaptureParticleCount,
    lifespan: ludoCaptureParticleLifespan.inMilliseconds / 1000,
    generator: (i) {
      final angle = (2 * math.pi * i) / ludoCaptureParticleCount;
      final color =
          ludoCaptureParticlePalette[i % ludoCaptureParticlePalette.length];
      return CircleParticle(
        radius: 4,
        paint: Paint()..color = color,
      ).accelerated(
        acceleration: Vector2(0, 40),
        speed:
            Vector2(math.cos(angle), math.sin(angle)) *
            ludoCaptureParticleReach,
      );
    },
  );
}

/// A one-shot capture particle burst placed at [position] (board pixel
/// space). Self-removes once its particle's bounded lifetime ends.
class LudoCaptureBurstComponent extends ParticleSystemComponent {
  LudoCaptureBurstComponent({
    required Vector2 position,
    ReducedMotionSetting? reducedMotion,
  }) : super(
         position: position,
         anchor: Anchor.center,
         particle: buildLudoCaptureParticle(
           reducedMotion: reducedMotion ?? ReducedMotionSetting(),
         ),
       );

  @override
  Future<void> onLoad() async {
    await super.onLoad();
    await LudoArtManifest.sfxCapture();
  }
}
