import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_board_art.dart';
import 'package:merge_relay/src/ui/mr_tokens.dart';

/// Task 08: the numeral must stay large and legible (>= 40% of tile height
/// for 1-2 digit values, >= 28% for 4+ digit values), and the face zone
/// drawn above it must never intersect the numeral's own box — the face
/// "sits above the numeral and never covers it" per the task's Context.
void main() {
  const tileRect = Rect.fromLTWH(0, 0, 200, 200);

  group('numeral text size ratio', () {
    for (final value in [2, 64, 512, 4096]) {
      testWidgets('value $value clears its digit-count floor', (tester) async {
        final digits = '$value'.length;
        final floor = digits >= 4 ? 0.28 : 0.40;
        final numeralBox = MergeRelayBoardArt.numeralBoxFor(tileRect);
        final text = MergeRelayBoardArt.numeralTextPainterFor(
          value,
          tileRect.height,
          color: MrTokens.tileNumeralColorFor(value),
          maxWidth: numeralBox.width * 0.92,
        );
        final ratio = text.height / tileRect.height;
        expect(
          ratio,
          greaterThanOrEqualTo(floor),
          reason: 'value $value ($digits digits) rendered at ratio $ratio',
        );
      });
    }
  });

  testWidgets('face box never intersects the numeral box, any tile size', (
    tester,
  ) async {
    for (final size in [80.0, 160.0, 320.0]) {
      final rect = Rect.fromLTWH(0, 0, size, size);
      final faceBox = MergeRelayBoardArt.faceBoxFor(rect);
      final numeralBox = MergeRelayBoardArt.numeralBoxFor(rect);
      expect(
        faceBox.bottom,
        lessThanOrEqualTo(numeralBox.top),
        reason: 'face box must sit entirely above the numeral box',
      );
      expect(faceBox.overlaps(numeralBox), isFalse);
    }
  });
}
