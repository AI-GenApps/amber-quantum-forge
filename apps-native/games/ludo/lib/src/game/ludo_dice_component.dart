/// The animated, code-drawn Ludo die: a face-swap "tumble" illusion (not a
/// real 3D mesh) that flickers through several pip faces before settling
/// with a small overshoot-and-correct bounce on the value it was told to
/// land on.
///
/// No bitmap asset is used anywhere in this file — every pixel is drawn
/// with `Canvas`/`Paint` calls, per task 05's Context/Decisions.
/// [LudoDicePainter.paintFace] is the single place that draws one die
/// face's art, shared by [LudoDiceComponent.render] and the manifest slots
/// in `ludo_art_manifest.dart`.
library;

import 'dart:async';

import 'package:flame/components.dart';
import 'package:flutter/material.dart';

import '../assets/ludo_art_manifest.dart';
import '../state/reduced_motion_setting.dart';

/// Minimum time [LudoDiceComponent.rollTo]'s tumble phase runs before it is
/// allowed to settle (task 05 spec: at least 600ms).
const ludoDiceTumbleMinDuration = Duration(milliseconds: 650);

/// Minimum number of *distinct* face values the tumble must flicker through
/// before settling (task 05 spec: at least 3).
const ludoDiceMinDistinctFaces = 3;

/// How often the displayed face changes during the tumble.
const ludoDiceFlickerInterval = Duration(milliseconds: 80);

/// Duration of the settle-bounce that follows the tumble: a brief
/// overshoot-and-correct scale tween on the final face, not an instant
/// stop.
const ludoDiceSettleDuration = Duration(milliseconds: 180);

/// Draws one die face (pips arranged for `face` 1..6) into [rect] with a
/// gradient-shaded, bordered, drop-shadowed bezel so it reads as a
/// 3D-looking cube face rather than a flat square.
abstract final class LudoDicePainter {
  static const Map<int, List<Alignment>> _pipLayouts = {
    1: [Alignment.center],
    2: [Alignment.topLeft, Alignment.bottomRight],
    3: [Alignment.topLeft, Alignment.center, Alignment.bottomRight],
    4: [
      Alignment.topLeft,
      Alignment.topRight,
      Alignment.bottomLeft,
      Alignment.bottomRight,
    ],
    5: [
      Alignment.topLeft,
      Alignment.topRight,
      Alignment.center,
      Alignment.bottomLeft,
      Alignment.bottomRight,
    ],
    6: [
      Alignment.topLeft,
      Alignment.topRight,
      Alignment.centerLeft,
      Alignment.centerRight,
      Alignment.bottomLeft,
      Alignment.bottomRight,
    ],
  };

  static void paintFace(Canvas canvas, Rect rect, int face) {
    assert(face >= 1 && face <= 6, 'die face must be 1..6, got $face');
    final radius = Radius.circular(rect.shortestSide * 0.18);
    final rrect = RRect.fromRectAndRadius(rect, radius);

    canvas.drawRRect(
      rrect.shift(Offset(rect.width * 0.05, rect.height * 0.08)),
      Paint()
        ..color = const Color(0x552B1B0E)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
    );

    canvas.drawRRect(
      rrect,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFFDF7), Color(0xFFE3D9C2)],
        ).createShader(rect),
    );
    canvas.drawRRect(
      rrect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = rect.shortestSide * 0.035
        ..color = const Color(0xFFB8A98A),
    );

    final pipRadius = rect.shortestSide * 0.09;
    final pipArea = rect.deflate(rect.shortestSide * 0.22);
    for (final alignment in _pipLayouts[face]!) {
      canvas.drawCircle(
        alignment.withinRect(pipArea),
        pipRadius,
        Paint()..color = const Color(0xFF2B1B0E),
      );
    }
  }
}

/// A single animated die. Callers ask it to land on a value with
/// [rollTo]; it always ends up displaying that value, but (unless reduced
/// motion is enabled) only after a tumble that flickers through several
/// other faces first and settles with a small bounce.
class LudoDiceComponent extends PositionComponent {
  LudoDiceComponent({ReducedMotionSetting? reducedMotion, int initialFace = 1})
    : assert(initialFace >= 1 && initialFace <= 6),
      reducedMotion = reducedMotion ?? ReducedMotionSetting(),
      _displayFace = initialFace,
      super(anchor: Anchor.center);

  /// Consulted by [rollTo]: when `true`, the final face is revealed
  /// immediately with no tumble/flicker/bounce.
  final ReducedMotionSetting reducedMotion;

  int _displayFace;
  int? _target;
  bool _settling = false;
  double _tumbleElapsed = 0;
  double _flickerClock = 0;
  double _settleElapsed = 0;
  double _scale = 1.0;
  final Set<int> _distinctFacesFlickered = {};
  Completer<void>? _rollCompleter;

  /// The face currently on display (`1..6`).
  int get displayFace => _displayFace;

  /// Whether a tumble/settle animation is in progress.
  bool get isRolling => _target != null;

  /// Whether the current roll is in its settle-bounce phase (test-visible,
  /// so a test can confirm settling is a distinct, non-instant phase).
  bool get isSettling => _settling;

  /// The number of distinct face values flickered through so far during
  /// the current (or most recently finished) roll's tumble phase.
  int get distinctFacesFlickered => _distinctFacesFlickered.length;

  /// Tumbles the die and lands it on [face]. Always resolves with
  /// [displayFace] equal to [face]. With reduced motion enabled, resolves
  /// immediately with no intermediate frame.
  Future<void> rollTo(int face) {
    assert(face >= 1 && face <= 6, 'die face must be 1..6, got $face');
    unawaited(LudoArtManifest.sfxDiceRoll());
    if (reducedMotion.value) {
      _displayFace = face;
      _scale = 1.0;
      _distinctFacesFlickered.clear();
      return Future.value();
    }
    // If a previous roll is still mid-tumble/settle when this one is
    // requested, complete its completer now instead of silently
    // overwriting `_rollCompleter` below — otherwise the earlier caller
    // (e.g. `LudoGame.applyEvents`, awaited by `GameBoardScreen`'s turn
    // machinery) would await a `Future` whose completer was orphaned and
    // never resolves, permanently stalling everything chained after it
    // (see `ludo_full_match_controller_test.dart` and this task's
    // Context/Decisions on the stuck-turn bug).
    final previousCompleter = _rollCompleter;
    if (previousCompleter != null && !previousCompleter.isCompleted) {
      previousCompleter.complete();
    }
    _target = face;
    _settling = false;
    _tumbleElapsed = 0;
    _flickerClock = 0;
    _settleElapsed = 0;
    _distinctFacesFlickered.clear();
    final completer = Completer<void>();
    _rollCompleter = completer;
    return completer.future;
  }

  @override
  void update(double dt) {
    super.update(dt);
    final target = _target;
    if (target == null) return;

    if (!_settling) {
      _tumbleElapsed += dt;
      _flickerClock += dt;
      final flickerSeconds = ludoDiceFlickerInterval.inMilliseconds / 1000;
      if (_flickerClock >= flickerSeconds) {
        _flickerClock = 0;
        _displayFace = (_displayFace % 6) + 1; // deterministic, always new.
        _distinctFacesFlickered.add(_displayFace);
      }
      final minTumbleSeconds = ludoDiceTumbleMinDuration.inMilliseconds / 1000;
      if (_tumbleElapsed >= minTumbleSeconds &&
          _distinctFacesFlickered.length >= ludoDiceMinDistinctFaces) {
        _settling = true;
        _settleElapsed = 0;
        _displayFace = target;
      }
      return;
    }

    _settleElapsed += dt;
    final settleSeconds = ludoDiceSettleDuration.inMilliseconds / 1000;
    final t = (_settleElapsed / settleSeconds).clamp(0.0, 1.0);
    // Overshoot-and-correct: bulge above 1.0 then ease back down to 1.0.
    _scale = 1.0 + 0.18 * (1 - t) * (t < 0.5 ? t * 2 : (1 - t) * 2);
    if (_settleElapsed >= settleSeconds) {
      _scale = 1.0;
      _settling = false;
      _target = null;
      final completer = _rollCompleter;
      _rollCompleter = null;
      completer?.complete();
    }
  }

  @override
  void render(Canvas canvas) {
    final rect = Rect.fromLTWH(0, 0, size.x, size.y);
    final center = rect.center;
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.scale(_scale);
    canvas.translate(-center.dx, -center.dy);
    LudoDicePainter.paintFace(canvas, rect, _displayFace);
    canvas.restore();
  }
}
