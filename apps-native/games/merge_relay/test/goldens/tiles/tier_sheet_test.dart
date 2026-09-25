import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_board_art.dart';
import 'package:merge_relay/src/merge_relay_theme.dart';
import 'package:merge_relay/src/ui/tiles/mr_board_tray_painter.dart';

import '../screens/physical_golden.dart';

/// Task 08's tier-sheet golden: every one of the 12 tile tiers (values 2
/// through 4096/"8192+") at real tile size, plus an 8192 tile proving the
/// generic fallback (values above the last named tier reuse tier 11's
/// colour and face rather than looking undefined), and two empty wells for
/// a side-by-side check that slots read as pale trays, not dark holes.
void main() {
  testWidgets('tier sheet shows every tier with readable numerals', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1800, 1800);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    final key = UniqueKey();
    await tester.pumpWidget(
      RepaintBoundary(
        key: key,
        child: const MaterialApp(
          debugShowCheckedModeBanner: false,
          home: Scaffold(body: Center(child: _TierSheet())),
        ),
      ),
    );
    await tester.pump();

    await expectLater(
      capturePhysicalGolden(tester, find.byKey(key)),
      matchesGoldenFile('tier_sheet.png'),
    );
  });
}

/// Values shown left-to-right, top-to-bottom: the 12 named tiers, then an
/// 8192 tile (the generic-fallback proof), then two empty wells.
const _sheetValues = <int?>[
  2,
  4,
  8,
  16,
  32,
  64,
  128,
  256,
  512,
  1024,
  2048,
  4096,
  8192,
  null,
  0,
  0,
];

final class _TierSheet extends StatelessWidget {
  const _TierSheet();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: signalRelayTheme.paper,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: SizedBox(
          width: 520,
          height: 520,
          child: CustomPaint(painter: _TierSheetPainter()),
        ),
      ),
    );
  }
}

final class _TierSheetPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const columns = 4;
    const tileSize = 100.0;
    const gap = 24.0;
    final trayRect = Offset.zero & size;
    paintBoardTray(canvas, trayRect, trayColor: signalRelayTheme.board);

    for (var i = 0; i < _sheetValues.length; i += 1) {
      final row = i ~/ columns;
      final column = i % columns;
      final rect = Rect.fromLTWH(
        gap + column * (tileSize + gap),
        gap + row * (tileSize + gap),
        tileSize,
        tileSize,
      );
      final value = _sheetValues[i];
      if (value == null) continue;
      if (value == 0) {
        paintWell(canvas, rect, wellColor: signalRelayTheme.slot, radius: 16);
        continue;
      }
      MergeRelayBoardArt.paintTile(
        canvas,
        rect,
        value: value,
        theme: signalRelayTheme,
        highContrast: false,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _TierSheetPainter oldDelegate) => false;
}
