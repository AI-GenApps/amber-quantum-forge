import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

/// Motion timings (task 09's starting point — tuned later against a real
/// device in task 25): the slide-in ease for a shifted tile, the merge
/// squash-and-pop, the spawn grow-in, the shake for a blocked move, and
/// the new-best-tile confetti burst. Haptics fire off the same events,
/// from `merge_relay_game_actions.dart`.
const mergeRelaySlideDuration = Duration(milliseconds: _slideMs);
const mergeRelayMergePopDuration = Duration(milliseconds: _popMs);
const mergeRelaySpawnDuration = Duration(milliseconds: _spawnMs);
const mergeRelayBlockedShakeDuration = Duration(milliseconds: 180);
const mergeRelayCelebrationDuration = Duration(milliseconds: 520);

/// The score strip's own pop, distinct from the board's merge pop: a
/// quick overshoot-then-settle on the score number itself whenever it
/// changes (`MergeRelayScoreStrip` in `merge_relay_play_widgets.dart`).
const mergeRelayScorePopDuration = Duration(milliseconds: 160);

/// One move's whole animated span: the slide plays first, then the merge
/// pop; the spawn grow-in overlaps the pop window rather than extending
/// it, so a move never takes longer to settle than slide + pop.
const mergeRelayMoveAnimationDuration = Duration(milliseconds: _totalMs);

const _slideMs = 110;
const _popMs = 140;
const _spawnMs = 120;
const _totalMs = _slideMs + _popMs;
const _slideFraction = _slideMs / _totalMs;
const _popFraction = _popMs / _totalMs;
const _spawnFraction = _spawnMs / _totalMs;

/// A snapshot of one move's three sub-animations, sampled at overall
/// progress `t` (0 at the move's start, 1 once fully settled). Pure and
/// stateless so the trace-to-animation mapping is unit-testable without
/// pumping a widget — see `mergeRelayMoveFrameAt`.
final class MergeRelayMoveFrame {
  const MergeRelayMoveFrame({
    required this.slideEase,
    required this.mergeSquash,
    required this.spawnGrow,
    required this.scaleX,
    required this.scaleY,
  });

  /// 0 at the move's start (a changed tile still offset toward the cell
  /// it came from), eased to 1 once every tile has slid into place.
  final double slideEase;

  /// 0 outside the merge-pop window; rises to a peak of 1 mid-pop and
  /// back to 0 as a merged destination tile's squash-and-pop settles.
  /// Kept as a scalar "pop energy" signal alongside [scaleX]/[scaleY],
  /// which carry the actual (non-uniform) paint transform.
  final double mergeSquash;

  /// 0 before a spawned tile appears, eased to 1 once it has grown to
  /// full size.
  final double spawnGrow;

  /// The merged destination tile's horizontal scale for this frame. Not
  /// equal to [scaleY] during the early squash (wider/shorter, as if the
  /// tile just landed) — see [mergeRelayMoveFrameAt]. Converges with
  /// [scaleY] for the uniform stretch-to-peak (~1.18) and settle back to
  /// 1.0.
  final double scaleX;

  /// The merged destination tile's vertical scale for this frame — see
  /// [scaleX].
  final double scaleY;

  /// The steady, no-animation-in-flight state: every tile at rest, full
  /// size, no pop. Used as the default for board painters that never
  /// receive a live presentation (e.g. static relay/tutorial previews).
  static const settled = MergeRelayMoveFrame(
    slideEase: 1,
    mergeSquash: 0,
    spawnGrow: 1,
    scaleX: 1,
    scaleY: 1,
  );
}

/// Maps overall move progress `t` (0..1 over
/// [mergeRelayMoveAnimationDuration]) to the three sub-animation values
/// that drive the board painter.
MergeRelayMoveFrame mergeRelayMoveFrameAt(double t) {
  final clamped = t.clamp(0.0, 1.0);
  final slideT = (clamped / _slideFraction).clamp(0.0, 1.0);
  final slideEase = Curves.easeOut.transform(slideT);

  final poppingWindowOpen = clamped > _slideFraction;
  final popT = ((clamped - _slideFraction) / _popFraction).clamp(0.0, 1.0);
  final mergeSquash = poppingWindowOpen ? math.sin(math.pi * popT) : 0.0;
  final squash = _mergeSquashScaleAt(popT);

  final spawnT = ((clamped - _slideFraction) / _spawnFraction).clamp(0.0, 1.0);
  final spawnGrow = poppingWindowOpen ? Curves.easeOut.transform(spawnT) : 0.0;

  return MergeRelayMoveFrame(
    slideEase: slideEase,
    mergeSquash: mergeSquash,
    spawnGrow: spawnGrow,
    scaleX: squash.sx,
    scaleY: squash.sy,
  );
}

/// The merge pop's non-uniform squash-and-stretch, sampled at `popT`
/// (0..1 across the pop window only — see [mergeRelayMoveFrameAt]):
/// an early squash (wider/shorter, `sx` up and `sy` down, as if the tile
/// just landed), a uniform stretch/overshoot to the ~1.18 peak, then a
/// uniform settle back to 1.0. `sx == sy == 1.0` outside the window and
/// at both ends of it.
({double sx, double sy}) _mergeSquashScaleAt(double popT) {
  if (popT <= 0 || popT >= 1) return (sx: 1.0, sy: 1.0);
  const compressEnd = 0.3;
  const stretchEnd = 0.5;
  if (popT < compressEnd) {
    final e = Curves.easeOut.transform(popT / compressEnd);
    return (sx: 1.0 + 0.12 * e, sy: 1.0 - 0.10 * e);
  }
  if (popT < stretchEnd) {
    final e = Curves.easeInOut.transform(
      (popT - compressEnd) / (stretchEnd - compressEnd),
    );
    return (sx: 1.12 + 0.06 * e, sy: 0.90 + 0.28 * e);
  }
  final e = Curves.easeIn.transform((popT - stretchEnd) / (1 - stretchEnd));
  final settled = 1.18 - 0.18 * e;
  return (sx: settled, sy: settled);
}

/// The unit vector a settled tile ends up displaced along for
/// [direction] — e.g. an `up` move ends with tiles higher on the board,
/// so they visually slide in from below (the opposite vector).
Offset mergeRelayDirectionUnit(MergeDirection direction) => switch (direction) {
  MergeDirection.up => const Offset(0, -1),
  MergeDirection.down => const Offset(0, 1),
  MergeDirection.left => const Offset(-1, 0),
  MergeDirection.right => const Offset(1, 0),
};

/// A decaying horizontal shake for a blocked move, sampled at progress
/// `t` (0..1 over [mergeRelayBlockedShakeDuration]).
double mergeRelayShakeOffsetAt(double t, {double magnitudePx = 6}) {
  final clamped = t.clamp(0.0, 1.0);
  return magnitudePx * (1 - clamped) * math.sin(clamped * math.pi * 4);
}

const _mergeRelayConfettiColors = [
  Color(0xFFFF6B57),
  Color(0xFFFFC94D),
  Color(0xFF4DB6FF),
  Color(0xFF4DDE95),
];

/// Paints a short, deterministic burst of code-drawn confetti radiating
/// from [center] for the new-best-tile celebration, sampled at progress
/// `t` (0..1 over [mergeRelayCelebrationDuration]).
void paintMergeRelayCelebration(
  Canvas canvas,
  Offset center,
  double radius,
  double t,
) {
  final clamped = t.clamp(0.0, 1.0);
  if (clamped <= 0 || clamped >= 1) return;
  final travel = Curves.easeOut.transform(clamped);
  final fade = 1 - clamped;
  const particleCount = 12;
  final paint = Paint()..style = PaintingStyle.fill;
  for (var i = 0; i < particleCount; i += 1) {
    final angle = (2 * math.pi * i) / particleCount;
    final distance = radius * (0.35 + 0.9 * travel);
    final position =
        center + Offset(math.cos(angle), math.sin(angle)) * distance;
    paint.color =
        _mergeRelayConfettiColors[i % _mergeRelayConfettiColors.length]
            .withValues(alpha: fade);
    final particleSize = radius * 0.09;
    canvas.save();
    canvas.translate(position.dx, position.dy);
    canvas.rotate(angle + travel * math.pi);
    canvas.drawRect(
      Rect.fromCenter(
        center: Offset.zero,
        width: particleSize,
        height: particleSize * 1.8,
      ),
      paint,
    );
    canvas.restore();
  }
}
