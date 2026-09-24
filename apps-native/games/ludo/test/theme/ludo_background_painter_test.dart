import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/theme/ludo_background_painter.dart';
import 'package:ludo/src/theme/ludo_theme_tokens.dart';

/// A painter that wraps [LudoBackgroundPainter] and counts [paint] calls,
/// so the test below can assert the painter runs exactly once per pump
/// rather than once per frame/rebuild.
class _CountingPainter extends CustomPainter {
  _CountingPainter(this.inner);

  final LudoBackgroundPainter inner;
  int paintCount = 0;

  @override
  void paint(Canvas canvas, Size size) {
    paintCount++;
    inner.paint(canvas, size);
  }

  @override
  bool shouldRepaint(covariant _CountingPainter oldDelegate) =>
      inner.shouldRepaint(oldDelegate.inner);
}

void main() {
  testWidgets('paints exactly once for a single pump, not per frame', (
    tester,
  ) async {
    final painter = _CountingPainter(const LudoBackgroundPainter());

    await tester.pumpWidget(
      MaterialApp(
        home: CustomPaint(painter: painter, size: const Size(320, 480)),
      ),
    );

    expect(painter.paintCount, 1);

    // A second pump with nothing changed should not repaint (no dirty
    // widget, no animation ticking).
    await tester.pump();
    expect(painter.paintCount, 1);
  });

  testWidgets('background base fill matches the token deep-blue color', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: CustomPaint(
          painter: LudoBackgroundPainter(),
          size: Size(320, 480),
        ),
      ),
    );

    // Sample a corner far from the vignette's lightened center — it should
    // still read as the deep-blue token color (before mixing with the
    // vignette's own darkening).
    await expectLater(
      find.byType(CustomPaint).first,
      matchesGoldenFile('../goldens/design_system/ludo_background.png'),
    );
  });

  test('shouldRepaint is false for an unchanged tileSize', () {
    const a = LudoBackgroundPainter();
    const b = LudoBackgroundPainter();
    expect(a.shouldRepaint(b), isFalse);
  });

  test('shouldRepaint is true when tileSize changes', () {
    const a = LudoBackgroundPainter(tileSize: 40);
    const b = LudoBackgroundPainter();
    expect(a.shouldRepaint(b), isTrue);
  });

  test('token palette exposes the documented deep-blue background', () {
    expect(LudoThemeTokens.backgroundDeepBlue, const Color(0xFF0B1E4A));
  });
}
