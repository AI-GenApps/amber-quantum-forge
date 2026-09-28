/// A themed "searching for players" indicator (task 26x): replaces the
/// Material-default `CircularProgressIndicator` the matchmaking screen
/// used to show with a tumbling die cycling through faces on a gold-ring
/// backdrop, matching the game's own dice art (`LudoDicePainter`, task 05)
/// instead of a generic platform spinner.
library;

import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../game/ludo_dice_component.dart' show LudoDicePainter;
import '../theme/ludo_theme_tokens.dart';

/// Cycles a die through its six faces on a timer while slowly rotating a
/// gold ring behind it, for the duration this widget stays mounted (a
/// matchmaking/room-fill wait, bounded by [MatchmakingSearchScreen]'s own
/// lifecycle) — never a one-shot animation, since the real wait duration
/// isn't known in advance.
class LudoSearchingIndicator extends StatefulWidget {
  const LudoSearchingIndicator({super.key, this.size = 72});

  final double size;

  @override
  State<LudoSearchingIndicator> createState() => _LudoSearchingIndicatorState();
}

class _LudoSearchingIndicatorState extends State<LudoSearchingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  Timer? _faceTimer;
  int _face = 1;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
    _faceTimer = Timer.periodic(const Duration(milliseconds: 220), (_) {
      if (!mounted) return;
      setState(() => _face = (_face % 6) + 1);
    });
  }

  @override
  void dispose() {
    _faceTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return Stack(
            alignment: Alignment.center,
            children: [
              Transform.rotate(
                angle: _controller.value * 2 * math.pi,
                child: CustomPaint(
                  size: Size(widget.size, widget.size),
                  painter: _SearchRingPainter(),
                ),
              ),
              SizedBox(
                width: widget.size * 0.5,
                height: widget.size * 0.5,
                child: CustomPaint(painter: _DieFacePainter(_face)),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SearchRingPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final center = rect.center;
    final radius = size.shortestSide / 2 - 3;
    final base = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..color = LudoThemeTokens.gold.withValues(alpha: 0.25);
    canvas.drawCircle(center, radius, base);

    final sweep = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round
      ..color = LudoThemeTokens.gold;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      math.pi * 1.1,
      false,
      sweep,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _DieFacePainter extends CustomPainter {
  const _DieFacePainter(this.face);

  final int face;

  @override
  void paint(Canvas canvas, Size size) {
    LudoDicePainter.paintFace(canvas, Offset.zero & size, face);
  }

  @override
  bool shouldRepaint(covariant _DieFacePainter oldDelegate) =>
      oldDelegate.face != face;
}
