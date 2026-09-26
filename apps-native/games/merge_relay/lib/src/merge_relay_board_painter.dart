import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_board_art.dart';
import 'merge_relay_motion.dart';
import 'merge_relay_theme.dart';

final class MergeRelayBoardPainter extends CustomPainter {
  const MergeRelayBoardPainter({
    required this.board,
    required this.theme,
    this.changedCells = const {},
    this.mergedCells = const {},
    this.spawnedCell,
    this.pulse = 0,
    this.highContrast = false,
    this.frame = MergeRelayMoveFrame.settled,
    this.direction,
    this.shakeOffsetPx = 0,
    this.celebrationCell,
    this.celebrationProgress = 0,
    this.highlightAlpha = 1,
  });

  final MergeBoard board;
  final MergeRelayTheme theme;
  final Set<int> changedCells;
  final Set<int> mergedCells;
  final int? spawnedCell;
  final double pulse;
  final bool highContrast;
  final MergeRelayMoveFrame frame;
  final MergeDirection? direction;
  final double shakeOffsetPx;
  final int? celebrationCell;
  final double celebrationProgress;

  /// Opacity of the changed/merged-cell ring — 1 at a move's start, fading
  /// to 0 by the time its animation settles, so the highlight is
  /// transient rather than sticking to the last-moved cells for the rest
  /// of the session (`changedCells` itself is never cleared after a
  /// move — see `MergeRelayBoardArt.paint`).
  final double highlightAlpha;

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
      highContrast: highContrast,
      frame: frame,
      direction: direction,
      shakeOffsetPx: shakeOffsetPx,
      celebrationCell: celebrationCell,
      celebrationProgress: celebrationProgress,
      highlightAlpha: highlightAlpha,
    );
  }

  @override
  bool shouldRepaint(MergeRelayBoardPainter oldDelegate) {
    return oldDelegate.board != board ||
        oldDelegate.theme != theme ||
        oldDelegate.changedCells != changedCells ||
        oldDelegate.mergedCells != mergedCells ||
        oldDelegate.spawnedCell != spawnedCell ||
        oldDelegate.pulse != pulse ||
        oldDelegate.highContrast != highContrast ||
        oldDelegate.frame != frame ||
        oldDelegate.direction != direction ||
        oldDelegate.shakeOffsetPx != shakeOffsetPx ||
        oldDelegate.celebrationCell != celebrationCell ||
        oldDelegate.celebrationProgress != celebrationProgress ||
        oldDelegate.highlightAlpha != highlightAlpha;
  }
}
