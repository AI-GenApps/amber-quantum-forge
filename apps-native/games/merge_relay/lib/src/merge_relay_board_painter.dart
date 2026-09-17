import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_board_art.dart';

final class MergeRelayBoardPainter extends CustomPainter {
  const MergeRelayBoardPainter({required this.board});

  final MergeBoard board;

  @override
  void paint(Canvas canvas, Size size) {
    MergeRelayBoardArt.paint(canvas, board, size: size);
  }

  @override
  bool shouldRepaint(MergeRelayBoardPainter oldDelegate) =>
      oldDelegate.board != board;
}
