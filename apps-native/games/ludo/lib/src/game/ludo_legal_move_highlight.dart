/// Legal-move highlight: while it is the local player's move phase, every
/// token with a legal move (per `ludo_rules`' `legalMoves(state)`) renders
/// a visible ring/glow, independent of and distinct from that token's
/// normal glossy rendering. Drawn entirely with `Canvas`/`Paint` calls.
library;

import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart';

import 'ludo_board_geometry.dart';

const _board = LudoBoard();

/// Renders a highlight ring over every board cell that holds a token the
/// current player may legally move.
class LudoLegalMoveHighlightComponent extends PositionComponent {
  LudoLegalMoveHighlightComponent({required Vector2 boardSize})
    : super(size: boardSize, anchor: Anchor.topLeft);

  List<Offset> _highlightCenters = const [];

  /// How many token cells are currently highlighted. Exposed for tests.
  int get highlightedCellCount => _highlightCenters.length;

  /// Recomputes which cells to highlight from [state]. Pass `null` to
  /// clear all highlights (e.g. outside the local player's move phase).
  void updateFromState(LudoMatchState? state) {
    if (state == null || state.phase != LudoMatchPhase.awaitingMove) {
      _highlightCenters = const [];
      return;
    }
    final boardRect = Rect.fromLTWH(0, 0, size.x, size.y);
    final player = state.currentPlayer;
    final centers = <Offset>[];
    for (final tokenId in legalMoves(state)) {
      final token = player.tokens.firstWhere((t) => t.id == tokenId);
      final grid = _gridForToken(player.color, token, state.ruleset);
      if (grid != null) centers.add(ludoCellCenterAt(grid, boardRect));
    }
    _highlightCenters = centers;
  }

  (int, int)? _gridForToken(
    LudoColor color,
    LudoToken token,
    LudoRuleset ruleset,
  ) {
    switch (token.state(ruleset)) {
      case LudoTokenState.finished:
        return null;
      case LudoTokenState.yard:
        return ludoYardSlotGrid(color, token.id);
      case LudoTokenState.active:
        if (_board.isOnSharedTrack(ruleset, token.pathPosition)) {
          final absoluteCell = _board.absoluteCellOf(color, token.pathPosition);
          return ludoTrackCellGrid[absoluteCell];
        }
        final stretchIndex = token.pathPosition - ruleset.stepsToHomeEntry;
        return ludoHomeStretchCellGrid(color, stretchIndex);
    }
  }

  @override
  void render(Canvas canvas) {
    final cellSize = size.x / ludoGridSize;
    for (final center in _highlightCenters) {
      // Soft outer glow, then a crisp fully-opaque ring on top — a blurred
      // stroke alone dilutes its own opacity too much to read clearly.
      canvas.drawCircle(
        center,
        cellSize * 0.48,
        Paint()
          ..color = const Color(0x5500E5FF)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
      );
      canvas.drawCircle(
        center,
        cellSize * 0.46,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = cellSize * 0.1
          ..color = const Color(0xFF00E5FF),
      );
    }
  }
}
