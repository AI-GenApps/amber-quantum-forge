import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_motion.dart';
import 'merge_relay_theme.dart';
import 'ui/mr_tokens.dart';
import 'ui/tiles/mr_board_tray_painter.dart';
import 'ui/tiles/mr_tile_card_painter.dart';
import 'ui/tiles/mr_tile_expression.dart';
import 'ui/tiles/mr_tile_face_painter.dart';

final class MergeRelayBoardArt {
  const MergeRelayBoardArt._();

  /// Font-size scale (fraction of the full tile height) per digit count,
  /// tuned so the rendered glyph height clears the task's numeral-ratio
  /// floor (>= 40% of tile height for 1-2 digits, >= 28% for 4+) while still
  /// fitting inside the bottom numeral box below the face — see
  /// `test/ui/tiles/mr_tile_numeral_test.dart`, which measures the actual
  /// rendered ratio with the real bundled Fredoka font.
  static double numeralFontScaleFor(int digits) => switch (digits) {
    1 => 0.60,
    2 => 0.52,
    3 => 0.42,
    _ => 0.34,
  };

  /// The face zone for a tile of [tileRect] — the top band the original
  /// per-tier face is drawn into. Never overlaps [numeralBoxFor].
  static Rect faceBoxFor(Rect tileRect) => Rect.fromLTWH(
    tileRect.left + tileRect.width * 0.12,
    tileRect.top + tileRect.height * 0.08,
    tileRect.width * 0.76,
    tileRect.height * 0.32,
  );

  /// The numeral zone for a tile of [tileRect] — the bottom band the value
  /// text is centered in. Starts a deliberate gap below [faceBoxFor]'s
  /// bottom edge so the two never touch, let alone overlap.
  static Rect numeralBoxFor(Rect tileRect) => Rect.fromLTRB(
    tileRect.left,
    tileRect.top + tileRect.height * 0.46,
    tileRect.right,
    tileRect.bottom - tileRect.height * 0.06,
  );

  /// Builds and lays out the numeral's [TextPainter] for [value] sized
  /// against [tileHeight] — shared by [paint] and the numeral-ratio test so
  /// both measure the exact same glyphs.
  static TextPainter numeralTextPainterFor(
    int value,
    double tileHeight, {
    required Color color,
    required double maxWidth,
  }) {
    final digits = '$value'.length;
    return TextPainter(
      text: TextSpan(
        text: '$value',
        style: TextStyle(
          fontFamily: 'Fredoka',
          color: color,
          fontSize: tileHeight * numeralFontScaleFor(digits),
          fontWeight: FontWeight.w600,
          letterSpacing: -0.5,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: maxWidth);
  }

  static void paint(
    Canvas canvas,
    MergeBoard board, {
    required Size size,
    MergeRelayTheme theme = signalRelayTheme,
    Set<int> changedCells = const {},
    Set<int> mergedCells = const {},
    int? spawnedCell,
    double pulse = 0,
    bool highContrast = false,
    MergeRelayMoveFrame frame = MergeRelayMoveFrame.settled,
    MergeDirection? direction,
    double shakeOffsetPx = 0,
    int? celebrationCell,
    double celebrationProgress = 0,
    double highlightAlpha = 1,
  }) {
    final bounds = Offset.zero & size;
    canvas.save();
    canvas.clipRect(bounds);
    // The blocked-move shake displaces the whole board horizontally
    // (task 09's decision: "a ±6 px horizontal shake"), independent of
    // the direction that was blocked.
    canvas.translate(shakeOffsetPx, 0);
    final side = bounds.shortestSide;
    final boardRect = Rect.fromLTWH(0, 0, side, side);
    paintBoardTray(canvas, boardRect, trayColor: theme.board);

    final padding = side * 0.045;
    final gap = side * 0.03;
    final cell = (side - (padding * 2) - (gap * 3)) / 4;
    final paint = Paint()..style = PaintingStyle.fill;
    // No per-tile source cell is tracked for a plain (non-merging) slide
    // — the domain trace only carries merge source/destination pairs —
    // so every changed cell eases in from a fixed offset opposite its
    // move direction rather than from its exact prior cell. That still
    // reads as "the board slid" without duplicating `merge_rules`'
    // compaction algorithm here just for presentation.
    final slideStart = direction == null
        ? Offset.zero
        : mergeRelayDirectionUnit(direction) * (-cell * 0.4);
    final slideOffset = Offset.lerp(slideStart, Offset.zero, frame.slideEase)!;
    Offset? celebrationCenter;

    for (var index = 0; index < board.cells.length; index += 1) {
      final row = index ~/ 4;
      final column = index % 4;
      final left = padding + column * (cell + gap);
      final top = padding + row * (cell + gap);
      final rect = Rect.fromLTWH(left, top, cell, cell);
      final value = board.cells[index];

      if (value == 0) {
        paintWell(
          canvas,
          rect,
          wellColor: theme.slot,
          radius: 16,
          highContrast: highContrast,
        );
        continue;
      }

      final isSpawn = spawnedCell == index;
      final isMerged = mergedCells.contains(index);
      // The merge pop is squash-and-stretch, not a uniform scale: it
      // anchors at the tile's bottom edge (so it reads as landing) and
      // uses the frame's independent x/y scales, which start non-uniform
      // (wider/shorter) before converging on a uniform stretch-to-peak
      // and settle. The spawn grow-in stays a simple uniform scale from
      // its own center.
      final double scaleX;
      final double scaleY;
      final Offset scaleAnchor;
      if (isSpawn) {
        final spawnScale = 0.6 + 0.4 * frame.spawnGrow;
        scaleX = spawnScale;
        scaleY = spawnScale;
        scaleAnchor = rect.center;
      } else if (isMerged) {
        scaleX = frame.scaleX;
        scaleY = frame.scaleY;
        scaleAnchor = Offset(rect.center.dx, rect.bottom);
      } else {
        scaleX = 1.0;
        scaleY = 1.0;
        scaleAnchor = rect.center;
      }
      final tileOffset = changedCells.contains(index) && !isSpawn
          ? slideOffset
          : Offset.zero;

      canvas.save();
      canvas.translate(tileOffset.dx, tileOffset.dy);
      if (scaleX != 1.0 || scaleY != 1.0) {
        canvas.translate(scaleAnchor.dx, scaleAnchor.dy);
        canvas.scale(scaleX, scaleY);
        canvas.translate(-scaleAnchor.dx, -scaleAnchor.dy);
      }
      paintTile(
        canvas,
        rect,
        value: value,
        theme: theme,
        highContrast: highContrast,
      );
      canvas.restore();

      // The changed/merged-cell ring is a transient "this just moved" cue,
      // not a persistent marker: `presentation` (and so `changedCells`)
      // is never cleared once the move settles — it stays the last move's
      // trace until the next one — so the ring's own opacity, not set
      // membership, is what makes it disappear. It fades out over the
      // move animation via [highlightAlpha] (1 at the move's start, 0 by
      // the time it settles) and draws nothing once fully faded or under
      // reduced motion (where `highlightAlpha` is already 0 — see
      // `_MergeRelayBoardState`).
      if (changedCells.contains(index) && highlightAlpha > 0) {
        paint
          ..style = PaintingStyle.stroke
          ..strokeWidth = cell * (0.018 + pulse * 0.012)
          ..color = (isMerged ? theme.coral : theme.sky).withValues(
            alpha: highlightAlpha.clamp(0.0, 1.0),
          );
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            rect.deflate(cell * 0.03),
            const Radius.circular(16),
          ),
          paint,
        );
        paint.style = PaintingStyle.fill;
      }
      // Same transience rule as the changed/merged ring above: the
      // spawn's "just arrived" halo fades with [highlightAlpha] instead
      // of persisting on that cell for the rest of the session.
      if (isSpawn && highlightAlpha > 0) {
        paint
          ..style = PaintingStyle.stroke
          ..strokeWidth = cell * (0.014 + pulse * 0.02)
          ..color = theme.paper.withValues(
            alpha: 0.65 * highlightAlpha.clamp(0.0, 1.0),
          );
        canvas.drawCircle(rect.center, cell * (0.3 + pulse * 0.06), paint);
        paint.style = PaintingStyle.fill;
      }
      if (celebrationCell == index) celebrationCenter = rect.center;
    }
    if (celebrationCenter != null && celebrationProgress > 0) {
      paintMergeRelayCelebration(
        canvas,
        celebrationCenter,
        side * 0.18,
        celebrationProgress,
      );
    }
    canvas.restore();
  }

  /// Draws one occupied tile at [rect]: the physical card, the tier's
  /// original face in the top zone, and the numeral in the bottom zone —
  /// the two zones never overlap, per the task's legibility requirement.
  /// Public so the tier-sheet golden can render every tier at tile size
  /// without duplicating this layout.
  static void paintTile(
    Canvas canvas,
    Rect rect, {
    required int value,
    required MergeRelayTheme theme,
    required bool highContrast,
  }) {
    paintTileCard(
      canvas,
      rect,
      fill: MrTokens.tileColorFor(value),
      edgeColor: MrTokens.tileEdgeColorFor(value),
      radius: 18,
      outlineColor: theme.ink,
      highContrast: highContrast,
    );

    final numeralColor = MrTokens.tileNumeralColorFor(value);
    final faceBox = faceBoxFor(rect);
    paintTileFace(
      canvas,
      faceBox,
      expression: mrExpressionForTierIndex(MrTokens.tileTierIndex(value)),
      color: numeralColor,
      highContrast: highContrast,
    );

    final numeralBox = numeralBoxFor(rect);
    final text = numeralTextPainterFor(
      value,
      rect.height,
      color: numeralColor,
      maxWidth: numeralBox.width * 0.92,
    );
    text.paint(
      canvas,
      Offset(
        numeralBox.center.dx - text.width / 2,
        numeralBox.center.dy - text.height / 2,
      ),
    );
  }
}
