part of 'merge_relay_home.dart';

final class _HomeHero extends StatelessWidget {
  const _HomeHero({required this.game, required this.theme});

  final MergeRelayGame game;
  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.ink,
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: [
            theme.ink,
            Color.alphaBlend(theme.blue.withValues(alpha: 0.35), theme.ink),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'A tiny board. A clean handoff.',
                    style: TextStyle(
                      color: theme.paper,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      height: 1.06,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Slide, merge, and leave a better board behind.',
                    style: TextStyle(
                      color: theme.paper.withValues(alpha: 0.74),
                      fontSize: 14,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: () =>
                        game.openPlay(requestedMode: MergeRelayMode.rescue),
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: const Text('Play rescue'),
                    style: FilledButton.styleFrom(
                      backgroundColor: theme.paper,
                      foregroundColor: theme.ink,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            _SparkMark(theme: theme),
          ],
        ),
      ),
    );
  }
}

final class _SparkMark extends StatelessWidget {
  const _SparkMark({required this.theme});

  final MergeRelayTheme theme;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 88,
      height: 116,
      child: CustomPaint(painter: _SparkPainter(theme)),
    );
  }
}

final class _SparkPainter extends CustomPainter {
  const _SparkPainter(this.theme);

  final MergeRelayTheme theme;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    paint.color = theme.sky;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(8, 18, 54, 54),
        const Radius.circular(16),
      ),
      paint,
    );
    paint.color = theme.warm;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(28, 38, 54, 54),
        const Radius.circular(16),
      ),
      paint,
    );
    paint.color = theme.paper.withValues(alpha: 0.8);
    canvas.drawCircle(const Offset(65, 26), 5, paint);
    canvas.drawCircle(const Offset(22, 90), 4, paint);
  }

  @override
  bool shouldRepaint(covariant _SparkPainter oldDelegate) =>
      oldDelegate.theme != theme;
}
