/// Code-drawn Ludo avatar set for the onboarding profile picker (task 07).
///
/// Every avatar reuses [LudoTokenPainter]'s glossy-circle style (task 04)
/// as its base — same radial gradient, drop shadow, and glossy highlight a
/// token uses on the board — so the picker visually matches the game it
/// leads into, then adds one of two hand-drawn motifs on top so avatars of
/// the same color still read as distinct. No photo/bitmap asset is loaded
/// anywhere in this file; every pixel is drawn with `Canvas`/`Paint` calls.
library;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import '../game/ludo_board_geometry.dart' show ludoColorPalette;
import '../game/ludo_token_component.dart' show LudoTokenPainter;

/// The two motifs drawn over the base token color, each a visually
/// distinct code-drawn shape (not a re-tint of the other).
enum LudoAvatarMotif {
  /// A simple smiling face: two dot eyes and a curved mouth.
  face,

  /// A four-point sparkle badge in the upper-right of the circle.
  spark,
}

/// One avatar's identity: a stable [id] (persisted by
/// `ludo_profile_settings.dart`), the [color] and [motif] it paints.
final class LudoAvatarSpec {
  const LudoAvatarSpec({
    required this.id,
    required this.color,
    required this.motif,
  });

  final String id;
  final LudoColor color;
  final LudoAvatarMotif motif;
}

/// The full avatar set: every [LudoColor] crossed with every
/// [LudoAvatarMotif], for 4 x 2 = 8 distinct, visually-differentiated
/// avatars — satisfying task 07's "at least 8 distinct" acceptance bar.
const List<LudoAvatarSpec> ludoAvatars = [
  LudoAvatarSpec(
    id: 'red-face',
    color: LudoColor.red,
    motif: LudoAvatarMotif.face,
  ),
  LudoAvatarSpec(
    id: 'red-spark',
    color: LudoColor.red,
    motif: LudoAvatarMotif.spark,
  ),
  LudoAvatarSpec(
    id: 'green-face',
    color: LudoColor.green,
    motif: LudoAvatarMotif.face,
  ),
  LudoAvatarSpec(
    id: 'green-spark',
    color: LudoColor.green,
    motif: LudoAvatarMotif.spark,
  ),
  LudoAvatarSpec(
    id: 'yellow-face',
    color: LudoColor.yellow,
    motif: LudoAvatarMotif.face,
  ),
  LudoAvatarSpec(
    id: 'yellow-spark',
    color: LudoColor.yellow,
    motif: LudoAvatarMotif.spark,
  ),
  LudoAvatarSpec(
    id: 'blue-face',
    color: LudoColor.blue,
    motif: LudoAvatarMotif.face,
  ),
  LudoAvatarSpec(
    id: 'blue-spark',
    color: LudoColor.blue,
    motif: LudoAvatarMotif.spark,
  ),
];

/// The stable ids of [ludoAvatars], in the same order — the only valid
/// values for `LudoProfileSettings.avatarId`.
final List<String> ludoAvatarIds = List.unmodifiable(
  ludoAvatars.map((avatar) => avatar.id),
);

LudoAvatarSpec ludoAvatarById(String id) => ludoAvatars.firstWhere(
  (avatar) => avatar.id == id,
  orElse: () => ludoAvatars.first,
);

/// Minimum tap-target side (dp) for every avatar tile, per task 07's
/// accessibility requirement (verified by widget test, not left to visual
/// inspection).
const ludoAvatarMinTapTarget = 48.0;

/// Paints one avatar's art into [rect]: [LudoTokenPainter]'s glossy circle,
/// then [motif] on top.
abstract final class LudoAvatarPainter {
  static void paint(
    Canvas canvas,
    Rect rect,
    LudoColor color,
    LudoAvatarMotif motif,
  ) {
    LudoTokenPainter.paint(canvas, rect, ludoColorPalette[color]!);
    switch (motif) {
      case LudoAvatarMotif.face:
        _paintFace(canvas, rect);
      case LudoAvatarMotif.spark:
        _paintSpark(canvas, rect);
    }
  }

  static void _paintFace(Canvas canvas, Rect rect) {
    final center = rect.center;
    final radius = rect.shortestSide / 2;
    final eyePaint = Paint()..color = Colors.white;
    final eyeOffset = radius * 0.32;
    for (final dx in [-eyeOffset, eyeOffset]) {
      canvas.drawCircle(
        center.translate(dx, -radius * 0.15),
        radius * 0.11,
        eyePaint,
      );
    }
    final mouthRect = Rect.fromCenter(
      center: center.translate(0, radius * 0.05),
      width: radius * 0.9,
      height: radius * 0.9,
    );
    final mouthPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = radius * 0.1
      ..strokeCap = StrokeCap.round
      ..color = Colors.white;
    canvas.drawArc(mouthRect, 0.25, 2.6, false, mouthPaint);
  }

  static void _paintSpark(Canvas canvas, Rect rect) {
    final radius = rect.shortestSide / 2;
    final badgeCenter = rect.center.translate(radius * 0.42, -radius * 0.42);
    final badgeRadius = radius * 0.32;
    final paint = Paint()..color = Colors.white;
    final path = Path();
    for (var i = 0; i < 4; i++) {
      final angle = i * (math.pi / 2);
      final tip = badgeCenter.translate(
        badgeRadius * math.cos(angle),
        badgeRadius * math.sin(angle),
      );
      final innerAngle = angle + (math.pi / 4);
      final inner = badgeCenter.translate(
        badgeRadius * 0.35 * math.cos(innerAngle),
        badgeRadius * 0.35 * math.sin(innerAngle),
      );
      if (i == 0) {
        path.moveTo(tip.dx, tip.dy);
      } else {
        path.lineTo(tip.dx, tip.dy);
      }
      path.lineTo(inner.dx, inner.dy);
    }
    path.close();
    canvas.drawPath(path, paint);
  }
}

class _LudoAvatarCustomPainter extends CustomPainter {
  const _LudoAvatarCustomPainter(this.spec);

  final LudoAvatarSpec spec;

  @override
  void paint(Canvas canvas, Size size) {
    LudoAvatarPainter.paint(canvas, Offset.zero & size, spec.color, spec.motif);
  }

  @override
  bool shouldRepaint(covariant _LudoAvatarCustomPainter oldDelegate) =>
      oldDelegate.spec.id != spec.id;
}

/// A tappable avatar tile: [LudoAvatarPainter]'s art inside a `Semantics`-
/// labeled, at-least-[ludoAvatarMinTapTarget]dp button, with a selection
/// ring when [selected].
class LudoAvatarView extends StatelessWidget {
  const LudoAvatarView({
    super.key,
    required this.avatarId,
    this.size = 64,
    this.selected = false,
    this.onTap,
  });

  final String avatarId;
  final double size;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final spec = ludoAvatarById(avatarId);
    final tapTarget = size < ludoAvatarMinTapTarget
        ? ludoAvatarMinTapTarget
        : size;
    return Semantics(
      button: true,
      selected: selected,
      label: 'Avatar: ${spec.color.name} ${spec.motif.name}',
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: tapTarget,
          height: tapTarget,
          child: Center(
            child: Container(
              width: size,
              height: size,
              padding: const EdgeInsets.all(2),
              decoration: selected
                  ? BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Theme.of(context).colorScheme.primary,
                        width: 3,
                      ),
                    )
                  : null,
              child: CustomPaint(painter: _LudoAvatarCustomPainter(spec)),
            ),
          ),
        ),
      ),
    );
  }
}
