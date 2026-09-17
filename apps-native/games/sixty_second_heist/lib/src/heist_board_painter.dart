import 'package:flutter/material.dart';

import 'heist_app.dart';
import 'heist_board_art.dart';

final class HeistBoardPainter extends CustomPainter {
  const HeistBoardPainter({required this.game});

  final HeistGame game;

  @override
  void paint(Canvas canvas, Size size) {
    HeistBoardArt.paint(
      canvas,
      size: size,
      level: game.level,
      actions: game.actions.value,
      player: game.plannedPlayer(),
      outcome: game.outcome.value,
    );
  }

  @override
  bool shouldRepaint(HeistBoardPainter oldDelegate) => true;
}
