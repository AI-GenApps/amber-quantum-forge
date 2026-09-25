/// Glossy, code-drawn Ludo token: a filled circle with a radial gradient, a
/// drop shadow and a glossy highlight, plus hop-by-hop move animation.
///
/// No bitmap asset is used or referenced anywhere in this file — every
/// pixel is drawn with `Canvas`/`Paint` calls, per task 04's Context/
/// Decisions. [LudoTokenPainter.paint] is the single place that draws a
/// token's art, shared by [LudoTokenComponent.render] and the manifest
/// slots in `ludo_art_manifest.dart` so both draw identical art.
library;

import 'dart:async' as async show Timer;
import 'dart:async' show Completer, unawaited;
import 'dart:math' as math;

import 'package:flame/components.dart';
import 'package:flame/events.dart';
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import '../assets/ludo_art_manifest.dart';
import '../state/reduced_motion_setting.dart';
import 'ludo_board_geometry.dart';

/// Fraction of a board cell a token pin's width spans (task 12d2: ~0.9-1.0
/// cell, up from the previous 0.78 uniform square, leaving a small gap so
/// adjacent tokens and the cell grid stay visible).
const ludoTokenCellWidthFraction = 0.95;

/// Fraction of a board cell a token pin's height spans — taller than
/// [ludoTokenCellWidthFraction] so the pin/map-marker silhouette reads as
/// a marker standing on the cell rather than a squat circle (task 12d2:
/// ~1.3 cells tall).
const ludoTokenCellHeightFraction = 1.3;

/// Fraction-of-cell-size fan-out offset (task 12h) `LudoGame._syncTokens`
/// shifts each stacked token's center by, on each axis, when 2+ tokens
/// share a board cell — matching Ludo King's stacked-token convention
/// instead of every token rendering exactly on top of the others. Shared
/// with [LudoTokenComponent.containsLocalPoint]'s tightened stacked hit
/// radius ([_stackedTapHitRadiusFraction]) below so the two stay
/// consistent: the hit radius must always be smaller than this spread, or
/// stacked tokens' circular hit regions would themselves start
/// overlapping.
const ludoTokenStackFanOutFraction = 0.22;

/// Circular tap hit-test radius (fraction of one cell) for a *stacked*
/// token — see [LudoTokenComponent.containsLocalPoint]. Deliberately well
/// under [ludoTokenStackFanOutFraction] (the minimum center-to-center
/// distance between any two tokens in a fan-out, in every 2/3/4+ token
/// layout `LudoGame._fanOutOffset` produces) so no two stacked tokens'
/// hit regions can ever overlap.
const _stackedTapHitRadiusFraction = 0.16;

/// Duration of a single-cell hop.
const ludoTokenHopDuration = Duration(milliseconds: 120);

/// How far a token's y-position bulges upward mid-hop, as a fraction of the
/// cell size.
const ludoTokenHopArcHeight = 0.35;

/// Duration of a captured token's flight-back to its yard (task 05): one
/// longer, higher arc rather than a sequence of small board-step hops, so
/// a capture reads as visually distinct from a normal move.
const ludoTokenFlightDuration = Duration(milliseconds: 380);

/// How far a captured token's y-position bulges upward mid-flight, as a
/// fraction of the cell size — taller than [ludoTokenHopArcHeight] so the
/// flight-back arcs clearly over the board rather than hopping along it.
const ludoTokenFlightArcHeight = 1.4;

/// Draws one Ludo token's art into [rect] on [canvas] as a glossy 3D
/// pin/map-marker silhouette — a rounded teardrop shape with a circular
/// head — rather than a flat disc, per task 12c's Context/Decisions.
///
/// Concrete requirements (checked by golden test, not opinion — see task
/// 04 and 12c's acceptance criteria): (1) a non-circular teardrop
/// silhouette (see [LudoTokenPainter.pinPath]), (2) a radial gradient from
/// a lighter highlight at the top-left of the head to the base color, (3)
/// a drop shadow offset down-right, and (4) a small glossy ellipse
/// highlight near the top of the head. A flat single-color circle with
/// none of these fails the golden.
abstract final class LudoTokenPainter {
  static void paint(Canvas canvas, Rect rect, Color baseColor) {
    final pin = pinPath(rect);
    final headCenter = headCenterOf(rect);
    final headRadius = headRadiusOf(rect);

    // A colored base ring at the pin's tip — its anchor point on the cell
    // — matching the target look's "ring under the pin" (task 12d2).
    // Drawn before the pin body so the pin visually stands on top of it.
    final tip = Offset(rect.center.dx, rect.bottom);
    final baseRingRect = Rect.fromCenter(
      center: tip,
      width: rect.width * 0.9,
      height: rect.width * 0.36,
    );
    canvas.drawOval(
      baseRingRect,
      Paint()..color = baseColor.withValues(alpha: 0.3),
    );
    canvas.drawOval(
      baseRingRect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = rect.width * 0.06
        ..color = baseColor,
    );

    canvas.drawPath(
      pin.shift(Offset(rect.width * 0.09, rect.height * 0.1)),
      Paint()
        ..color = const Color(0x66000000)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
    );

    final fillPaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-0.35, -0.55),
        radius: 1.1,
        colors: [_lighten(baseColor, 0.5), baseColor, _darken(baseColor, 0.25)],
        stops: const [0.0, 0.55, 1.0],
      ).createShader(rect);
    canvas.drawPath(pin, fillPaint);

    canvas.drawPath(
      pin,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = rect.shortestSide * 0.05
        ..color = _darken(baseColor, 0.35),
    );

    // A small dark "eye" hole near the head's center sells the map-marker
    // read (a pin with a hollow center) rather than a plain droplet.
    canvas.drawCircle(
      headCenter,
      headRadius * 0.34,
      Paint()..color = _darken(baseColor, 0.4).withValues(alpha: 0.55),
    );
    canvas.drawCircle(
      headCenter,
      headRadius * 0.34,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = headRadius * 0.08
        ..color = _lighten(baseColor, 0.35),
    );

    final highlightRect = Rect.fromCenter(
      center: headCenter.translate(-headRadius * 0.32, -headRadius * 0.5),
      width: headRadius * 0.9,
      height: headRadius * 0.5,
    );
    canvas.drawOval(highlightRect, Paint()..color = const Color(0x99FFFFFF));
  }

  /// The circular head's center within [rect] — the rounded top of the
  /// teardrop silhouette [pinPath] traces.
  static Offset headCenterOf(Rect rect) =>
      Offset(rect.center.dx, rect.top + rect.height * 0.38);

  /// The circular head's radius within [rect].
  static double headRadiusOf(Rect rect) => rect.width * 0.36;

  /// Traces a rounded teardrop / map-marker silhouette inscribed in
  /// [rect]: a circular head (see [headCenterOf]/[headRadiusOf]) tapering
  /// to a point at the bottom-center, per this task's "pin/map-marker"
  /// requirement. Exposed (rather than inlined in [paint]) so tests can
  /// assert the token's silhouette is not a plain circle — e.g. the path's
  /// bounds are taller than wide, and it contains the bottom-center tip
  /// point a circle inscribed in [rect] would not.
  static Path pinPath(Rect rect) {
    final headCenter = headCenterOf(rect);
    final headRadius = headRadiusOf(rect);
    final tip = Offset(rect.center.dx, rect.bottom);

    // The rounded head: a ~300 degree arc of the circle, starting and
    // ending 30 degrees either side of straight-down (90 degrees in this
    // arcTo's screen-space angle convention), leaving a 60 degree gap at
    // the bottom for the two tangent curves down to the tip.
    const startAngle = 2 * math.pi / 3; // 120 degrees.
    const sweepAngle = 5 * math.pi / 3; // 300 degrees, clockwise.
    final leftGapPoint =
        headCenter +
        Offset(
          headRadius * math.cos(startAngle),
          headRadius * math.sin(startAngle),
        );
    final rightGapPoint =
        headCenter +
        Offset(
          headRadius * math.cos(startAngle + sweepAngle),
          headRadius * math.sin(startAngle + sweepAngle),
        );

    final path = Path()..moveTo(leftGapPoint.dx, leftGapPoint.dy);
    path.arcTo(
      Rect.fromCircle(center: headCenter, radius: headRadius),
      startAngle,
      sweepAngle,
      false,
    );
    // Tangent curves from the arc's end points down to the tip, each
    // gently curved (quadratic) so the taper reads as smooth rather than
    // a hard triangular point.
    path
      ..lineTo(rightGapPoint.dx, rightGapPoint.dy)
      ..quadraticBezierTo(
        headCenter.dx + headRadius * 0.45,
        tip.dy - rect.height * 0.08,
        tip.dx,
        tip.dy,
      )
      ..quadraticBezierTo(
        headCenter.dx - headRadius * 0.45,
        tip.dy - rect.height * 0.08,
        leftGapPoint.dx,
        leftGapPoint.dy,
      )
      ..close();
    return path;
  }

  static Color _lighten(Color color, double amount) {
    final hsl = HSLColor.fromColor(color);
    return hsl
        .withLightness((hsl.lightness + amount).clamp(0.0, 1.0))
        .toColor();
  }

  static Color _darken(Color color, double amount) {
    final hsl = HSLColor.fromColor(color);
    return hsl
        .withLightness((hsl.lightness - amount).clamp(0.0, 1.0))
        .toColor();
  }
}

/// A single Ludo token on the board, driven by grid cells rather than raw
/// pixels: callers move it with [hopTo], never by setting [position]
/// directly.
class LudoTokenComponent extends PositionComponent with TapCallbacks {
  LudoTokenComponent({
    required LudoColor color,
    required int tokenId,
    required Vector2 boardSize,
    required (int, int) initialCell,
    ReducedMotionSetting? reducedMotion,
  }) : this._(
         color: color,
         tokenId: tokenId,
         boardSize: boardSize,
         initialCell: initialCell,
         reducedMotion: reducedMotion ?? ReducedMotionSetting(),
       );

  LudoTokenComponent._({
    required this.color,
    required this.tokenId,
    required Vector2 boardSize,
    required (int, int) initialCell,
    required this.reducedMotion,
  }) : _boardSize = boardSize,
       _cell = initialCell,
       super(anchor: Anchor.center) {
    _layoutForBoardSize();
    position = _centerOf(_cell);
  }

  /// The color this token belongs to (used both for its paint color and
  /// for `ludo_rules` geometry lookups).
  final LudoColor color;

  /// This token's index within its owning player (`0..tokensPerPlayer-1`).
  final int tokenId;

  /// Consulted by [hopTo]: when `true`, moves jump straight to the final
  /// cell instead of animating.
  final ReducedMotionSetting reducedMotion;

  Vector2 _boardSize;
  (int, int) _cell;
  final List<(int, int)> _pendingHops = [];
  double _hopProgress = 0;
  Completer<void>? _moveCompleter;
  Duration _hopDuration = ludoTokenHopDuration;
  double _hopArcHeight = ludoTokenHopArcHeight;

  /// Real-time fallback for [_moveCompleter] — see [_armFallbackTimer]'s
  /// doc comment (task 12h) for why this exists: [update] only advances
  /// `_hopProgress` (and thus only ever completes [_moveCompleter]) while
  /// Flame is actually being ticked, which stops happening the moment the
  /// device's screen times out, the app backgrounds, or any other
  /// lifecycle event suspends frame scheduling — a real, reproducible
  /// device condition the existing fake-clock widget tests never hit.
  /// Without this, a hop/flight interrupted mid-animation hangs its
  /// `Future` forever, and since `game_board_screen.dart`'s
  /// `_game.applyEvents` awaits exactly that future before letting the
  /// bot-turn runner (or a human's next action) proceed, one interrupted
  /// animation permanently stalls the whole match.
  async.Timer? _fallbackTimer;

  /// Fan-out offset from this token's cell's pure pixel center, as a
  /// fraction of one cell's size on each axis (task 12h): `null`/zero when
  /// this token has its cell to itself. Set by `LudoGame._syncTokens` via
  /// [updateStackOffset] whenever 2+ tokens (any color mix) share a board
  /// cell, so every token in the stack renders at a distinct, individually
  /// tappable position instead of exactly on top of the others — Flame's
  /// tap hit-test uses this component's actual [position]/[size], so
  /// offsetting the pixel center here also offsets the tappable region,
  /// with no separate hit-test bookkeeping needed.
  Vector2 _stackOffset = Vector2.zero();

  /// The current fan-out offset (fraction of one cell), for tests.
  Vector2 get stackOffset => _stackOffset;

  /// Sets this token's [_stackOffset] (see its doc comment) and, unless a
  /// hop/flight is currently animating (which will land on the new offset
  /// naturally once it reaches its target cell), immediately repositions
  /// to reflect it.
  void updateStackOffset(Vector2 fraction) {
    if (_stackOffset == fraction) return;
    _stackOffset = fraction;
    if (!isAnimating) {
      position = _centerOf(_cell);
    }
  }

  // Whether the in-flight `_pendingHops` animation is a capture flight-back
  // ([flyTo]) rather than an ordinary hop-by-hop move ([hopTo]) — gates
  // whether landing on a cell plays the per-step SFX/haptic ([hopTo] does,
  // [flyTo] doesn't; a capture has its own distinct feedback, fired by
  // `LudoCaptureBurstComponent`).
  bool _isFlight = false;

  /// The grid cell this token currently occupies, or is animating away
  /// from mid-hop.
  (int, int) get currentCell => _cell;

  /// Invoked (with this token's [color] and [tokenId]) when this token is
  /// tapped. Set by `ludo_game.dart` on behalf of `GameBoardScreen` (task
  /// 09); left `null` wires no tap handling at all, matching every other
  /// tappable widget's "no handler while it shouldn't respond" convention.
  void Function(LudoColor color, int tokenId)? onTap;

  @override
  void onTapUp(TapUpEvent event) {
    onTap?.call(color, tokenId);
  }

  /// Tightens this token's tap hit-test region to a small circle around
  /// its own center when it's part of a stack (task 12h) — its full
  /// rectangular [size] bounding box (needed so the *rendered* pin, which
  /// is larger than [ludoTokenStackFanOutFraction]'s spread between
  /// stack-mates, always paints without being clipped) would otherwise
  /// still overlap a stack-mate's box even after the fan-out offset, and
  /// Flame's component dispatch always resolves an overlapping hit to
  /// whichever component was added last — meaning, without this
  /// override, tapping squarely on one stacked token could silently
  /// select a *different* one. [_stackedTapHitRadiusFraction] is smaller
  /// than [ludoTokenStackFanOutFraction], so stacked tokens' circular hit
  /// regions never overlap each other, and a tap always resolves to the
  /// token whose own center it's actually closest to. Un-stacked tokens
  /// (the default, zero offset) keep the full rectangular hit box,
  /// unchanged from every prior task.
  @override
  bool containsLocalPoint(Vector2 point) {
    if (_stackOffset == Vector2.zero()) return super.containsLocalPoint(point);
    final localCenter = Vector2(size.x / 2, size.y / 2);
    final hitRadius = _cellSize * _stackedTapHitRadiusFraction;
    return point.distanceTo(localCenter) <= hitRadius;
  }

  /// Whether a hop animation is in progress.
  bool get isAnimating => _pendingHops.isNotEmpty;

  double get _cellSize => _boardSize.x / ludoGridSize;

  Rect get _boardRect => Rect.fromLTWH(0, 0, _boardSize.x, _boardSize.y);

  Vector2 _centerOf((int, int) cell) {
    final offset = ludoCellCenterAt(cell, _boardRect);
    return Vector2(
      offset.dx + _stackOffset.x * _cellSize,
      offset.dy + _stackOffset.y * _cellSize,
    );
  }

  void _layoutForBoardSize() {
    size = Vector2(
      _cellSize * ludoTokenCellWidthFraction,
      _cellSize * ludoTokenCellHeightFraction,
    );
  }

  /// Called whenever the board is resized/laid out, so this token's pixel
  /// size and position stay in sync with the new board pixel size.
  void updateBoardSize(Vector2 boardSize) {
    _boardSize = boardSize;
    _layoutForBoardSize();
    if (!isAnimating) {
      position = _centerOf(_cell);
    }
  }

  /// Jumps instantly to [cell], cancelling any in-flight hop animation.
  void snapTo((int, int) cell) {
    _fallbackTimer?.cancel();
    _fallbackTimer = null;
    _cell = cell;
    _pendingHops.clear();
    _hopProgress = 0;
    position = _centerOf(cell);
    _moveCompleter?.complete();
    _moveCompleter = null;
  }

  /// Animates a hop-by-hop move through [path] (each entry one cell
  /// further along the route), landing on the last cell. Each hop takes
  /// [ludoTokenHopDuration] with an `easeOut` curve and a small vertical
  /// arc. When [ReducedMotionSetting.value] is `true`, jumps straight to
  /// the final cell with no intermediate animation frames.
  Future<void> hopTo(List<(int, int)> path) {
    if (path.isEmpty) return Future.value();
    if (reducedMotion.value) {
      unawaited(LudoArtManifest.sfxTokenStep());
      snapTo(path.last);
      return Future.value();
    }
    _completeStalePendingMove();
    _isFlight = false;
    _hopDuration = ludoTokenHopDuration;
    _hopArcHeight = ludoTokenHopArcHeight;
    _pendingHops
      ..clear()
      ..addAll(path);
    _hopProgress = 0;
    final completer = Completer<void>();
    _moveCompleter = completer;
    _armFallbackTimer(_hopDuration * path.length, path.last);
    return completer.future;
  }

  /// Completes any outstanding [_moveCompleter] left over from a previous
  /// [hopTo]/[flyTo] call that hadn't finished animating before this one
  /// started, so its awaiter never hangs forever — see the analogous fix
  /// in `LudoDiceComponent.rollTo`.
  void _completeStalePendingMove() {
    _fallbackTimer?.cancel();
    _fallbackTimer = null;
    final previousCompleter = _moveCompleter;
    if (previousCompleter != null && !previousCompleter.isCompleted) {
      previousCompleter.complete();
    }
  }

  /// Arms a wall-clock backstop for the hop/flight [_moveCompleter] just
  /// started, so it always resolves even if [update] never ticks again
  /// (see [_fallbackTimer]'s doc comment — task 12h's device-only
  /// stuck-turn root cause). [totalDuration] is the animation's full
  /// nominal length (a multi-cell hop's *sum* of per-hop durations, since
  /// [update] only removes one [_pendingHops] entry per elapsed hop); a
  /// generous buffer is added on top so a normally-ticking [update] always
  /// wins the race and this is only ever a last-resort unstick. When it
  /// does fire, this jumps straight to [finalCell] — matching the
  /// existing reduced-motion "snap" behavior — since no frames were being
  /// rendered to animate through in the first place.
  void _armFallbackTimer(Duration totalDuration, (int, int) finalCell) {
    _fallbackTimer?.cancel();
    _fallbackTimer = async.Timer(
      totalDuration + const Duration(milliseconds: 250),
      () {
        _fallbackTimer = null;
        final completer = _moveCompleter;
        if (completer == null || completer.isCompleted) return;
        _cell = finalCell;
        _pendingHops.clear();
        _hopProgress = 0;
        position = _centerOf(finalCell);
        _moveCompleter = null;
        completer.complete();
      },
    );
  }

  /// Animates a captured token's flight back to [cell] (its yard slot): a
  /// single, longer, higher-arcing tween — see [ludoTokenFlightDuration]
  /// and [ludoTokenFlightArcHeight] — used instead of [hopTo] so a capture
  /// never teleports and reads as visually distinct from a normal move
  /// (task 05). Reduced motion snaps instantly, like [hopTo].
  Future<void> flyTo((int, int) cell) {
    if (reducedMotion.value) {
      snapTo(cell);
      return Future.value();
    }
    _completeStalePendingMove();
    _isFlight = true;
    _hopDuration = ludoTokenFlightDuration;
    _hopArcHeight = ludoTokenFlightArcHeight;
    _pendingHops
      ..clear()
      ..add(cell);
    _hopProgress = 0;
    final completer = Completer<void>();
    _moveCompleter = completer;
    _armFallbackTimer(_hopDuration, cell);
    return completer.future;
  }

  @override
  void onRemove() {
    _fallbackTimer?.cancel();
    _fallbackTimer = null;
    super.onRemove();
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (_pendingHops.isEmpty) return;

    final hopSeconds = _hopDuration.inMilliseconds / 1000;
    _hopProgress += dt / hopSeconds;
    final rawT = _hopProgress.clamp(0.0, 1.0);
    final easedT = Curves.easeOut.transform(rawT);

    final from = _centerOf(_cell);
    final to = _centerOf(_pendingHops.first);
    final arcBulge = 4 * rawT * (1 - rawT) * _hopArcHeight * _cellSize;
    position = Vector2(
      from.x + (to.x - from.x) * easedT,
      from.y + (to.y - from.y) * easedT - arcBulge,
    );

    if (_hopProgress >= 1.0) {
      _cell = _pendingHops.removeAt(0);
      _hopProgress = 0;
      position = _centerOf(_cell);
      if (!_isFlight) {
        unawaited(LudoArtManifest.sfxTokenStep());
      }
      if (_pendingHops.isEmpty) {
        _fallbackTimer?.cancel();
        _fallbackTimer = null;
        final completer = _moveCompleter;
        _moveCompleter = null;
        completer?.complete();
      }
    }
  }

  @override
  void render(Canvas canvas) {
    LudoTokenPainter.paint(
      canvas,
      Rect.fromLTWH(0, 0, size.x, size.y),
      ludoColorPalette[color]!,
    );
  }
}
