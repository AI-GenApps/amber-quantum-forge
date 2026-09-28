import 'package:flutter/material.dart';

/// Draws one tile as a physical card: a soft drop shadow, a darker
/// "thickness" edge along the bottom third of the card (as if the tile has
/// depth, like a Threes!-style chip resting on the board), and the tier-fill
/// face on top. [highContrast] adds a firm ink outline around the whole
/// card so tier colour is never the only boundary cue between two tiles.
void paintTileCard(
  Canvas canvas,
  Rect rect, {
  required Color fill,
  required Color edgeColor,
  required double radius,
  Color? outlineColor,
  bool highContrast = false,
}) {
  final edgeHeight = (rect.height * 0.05).clamp(2.0, 6.0);
  final cardRRect = RRect.fromRectAndRadius(rect, Radius.circular(radius));

  final shadowRRect = RRect.fromRectAndRadius(
    rect.shift(Offset(0, rect.height * 0.035)),
    Radius.circular(radius),
  );
  canvas.drawRRect(
    shadowRRect,
    Paint()
      ..style = PaintingStyle.fill
      ..color = Colors.black.withValues(alpha: highContrast ? 0.22 : 0.14)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
  );

  // The full silhouette in the darker "edge" shade — a sliver of it peeks
  // out below the face rect drawn on top, reading as the tile's thickness.
  canvas.drawRRect(
    cardRRect,
    Paint()
      ..style = PaintingStyle.fill
      ..color = edgeColor,
  );

  final faceRect = Rect.fromLTRB(
    rect.left,
    rect.top,
    rect.right,
    rect.bottom - edgeHeight,
  );
  canvas.drawRRect(
    RRect.fromRectAndRadius(faceRect, Radius.circular(radius)),
    Paint()
      ..style = PaintingStyle.fill
      ..color = fill,
  );

  if (highContrast) {
    canvas.drawRRect(
      cardRRect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..color = outlineColor ?? Colors.black.withValues(alpha: 0.7),
    );
  }
}
