import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_board_art.dart';
import 'merge_relay_theme.dart';

final class MergeRelayBoardPainter extends CustomPainter {
  const MergeRelayBoardPainter({
    required this.board,
    required this.theme,
    this.changedCells = const {},
    this.mergedCells = const {},
    this.spawnedCell,
    this.pulse = 0,
  });

  final MergeBoard board;
  final MergeRelayTheme theme;
  final Set<int> changedCells;
  final Set<int> mergedCells;
  final int? spawnedCell;
  final double pulse;

  @override
  void paint(Canvas canvas, Size size) {
    MergeRelayBoardArt.paint(
      canvas,
      board,
      size: size,
      theme: theme,
      changedCells: changedCells,
      mergedCells: mergedCells,
      spawnedCell: spawnedCell,
      pulse: pulse,
    );
  }

  @override
  bool shouldRepaint(MergeRelayBoardPainter oldDelegate) {
    return oldDelegate.board != board ||
        oldDelegate.theme != theme ||
        oldDelegate.changedCells != changedCells ||
        oldDelegate.mergedCells != mergedCells ||
        oldDelegate.spawnedCell != spawnedCell ||
        oldDelegate.pulse != pulse;
  }
}
