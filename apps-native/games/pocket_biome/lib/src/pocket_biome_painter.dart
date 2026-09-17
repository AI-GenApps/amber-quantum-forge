import 'package:flutter/material.dart';

import 'biome_content.dart';
import 'pocket_biome_app.dart';
import 'pocket_biome_art.dart';

final class PocketBiomePainter extends CustomPainter {
  const PocketBiomePainter({required this.game});

  final PocketBiomeGame game;

  @override
  void paint(Canvas canvas, Size size) {
    PocketBiomeArt.paint(
      canvas,
      size: size,
      state: game.state.value,
      now: game.clock.now(),
      selectedSlot: game.selectedSlot.value,
      species: {
        for (final definition in pocketBiomeSpecies) definition.id: definition,
      },
    );
  }

  @override
  bool shouldRepaint(PocketBiomePainter oldDelegate) => true;
}
