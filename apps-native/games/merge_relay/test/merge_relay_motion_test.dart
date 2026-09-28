import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_motion.dart';
import 'package:merge_rules/merge_rules.dart';

/// Pure trace-to-animation mapping tests: `mergeRelayMoveFrameAt` is the
/// board painter's only source of slide/pop/spawn values, so these prove
/// the shape of one move's animation without pumping a widget.
void main() {
  group('mergeRelayMoveFrameAt', () {
    test('starts fully offset, with no pop and no growth', () {
      final frame = mergeRelayMoveFrameAt(0);
      expect(frame.slideEase, 0);
      expect(frame.mergeSquash, 0);
      expect(frame.spawnGrow, 0);
    });

    test('slide eases toward settled before the pop window opens', () {
      final early = mergeRelayMoveFrameAt(0.2);
      expect(early.slideEase, greaterThan(0));
      expect(early.slideEase, lessThan(1));
      expect(early.mergeSquash, 0);
      expect(early.spawnGrow, 0);
    });

    test('the slide finishes exactly as the pop window opens', () {
      final atSlideEnd = mergeRelayMoveFrameAt(110 / 250);
      expect(atSlideEnd.slideEase, 1);
    });

    test('merge squash rises to a peak mid-pop then returns to neutral', () {
      final midPop = mergeRelayMoveFrameAt(0.7);
      expect(midPop.slideEase, 1);
      expect(midPop.mergeSquash, greaterThan(0.9));

      final settled = mergeRelayMoveFrameAt(1);
      expect(settled.slideEase, 1);
      expect(settled.mergeSquash, closeTo(0, 1e-6));
      expect(settled.spawnGrow, 1);
    });

    test('spawn grows in across the pop window, not before it', () {
      final midSpawn = mergeRelayMoveFrameAt(0.6);
      expect(midSpawn.spawnGrow, greaterThan(0));
      expect(midSpawn.spawnGrow, lessThan(1));
    });

    test('values beyond the [0, 1] domain clamp to the settled ends', () {
      final before = mergeRelayMoveFrameAt(-0.5);
      final after = mergeRelayMoveFrameAt(1.5);
      expect(before.slideEase, 0);
      expect(after.slideEase, 1);
      expect(after.mergeSquash, closeTo(0, 1e-6));
      expect(after.spawnGrow, 1);
    });
  });

  group('MergeRelayMoveFrame squash-and-stretch (scaleX/scaleY)', () {
    test(
      'scale is uniform 1.0 at both ends of the move, not just mergeSquash',
      () {
        final start = mergeRelayMoveFrameAt(0);
        final end = mergeRelayMoveFrameAt(1);
        expect(start.scaleX, 1.0);
        expect(start.scaleY, 1.0);
        expect(end.scaleX, 1.0);
        expect(end.scaleY, 1.0);
      },
    );

    test('the early squash is non-uniform: wider (scaleX up) and shorter '
        '(scaleY down), not a single uniform scale', () {
      // popT ~= 0.15, inside the compression sub-phase (popT < 0.3).
      final frame = mergeRelayMoveFrameAt(0.524);
      expect(frame.scaleX, greaterThan(1.0));
      expect(frame.scaleY, lessThan(1.0));
      expect(frame.scaleX, isNot(closeTo(frame.scaleY, 1e-6)));
    });

    test('the stretch converges to a uniform peak around 1.18', () {
      // popT == 0.5 exactly: slideFraction (0.44) + 0.5 * popFraction (0.56).
      final peak = mergeRelayMoveFrameAt(0.72);
      expect(peak.scaleX, closeTo(1.18, 0.01));
      expect(peak.scaleY, closeTo(1.18, 0.01));
      expect(peak.scaleX, closeTo(peak.scaleY, 1e-6));
    });

    test('the settle phase stays uniform on the way back to 1.0', () {
      // popT ~= 0.85, inside the settle sub-phase (popT >= 0.5).
      final settling = mergeRelayMoveFrameAt(0.916);
      expect(settling.scaleX, closeTo(settling.scaleY, 1e-6));
      expect(settling.scaleX, greaterThan(1.0));
      expect(settling.scaleX, lessThan(1.18));
    });
  });

  group('MergeRelayMoveFrame.settled', () {
    test('matches the frame at full progress', () {
      const settled = MergeRelayMoveFrame.settled;
      expect(settled.slideEase, 1);
      expect(settled.mergeSquash, 0);
      expect(settled.spawnGrow, 1);
      expect(settled.scaleX, 1);
      expect(settled.scaleY, 1);
    });
  });

  group('mergeRelayShakeOffsetAt', () {
    test('starts and ends at zero, oscillating in between', () {
      expect(mergeRelayShakeOffsetAt(0), 0);
      expect(mergeRelayShakeOffsetAt(1), closeTo(0, 1e-9));
      expect(mergeRelayShakeOffsetAt(0.125).abs(), greaterThan(0));
    });

    test('decays toward zero as progress advances', () {
      final early = mergeRelayShakeOffsetAt(0.125).abs();
      final late = mergeRelayShakeOffsetAt(0.875).abs();
      expect(late, lessThan(early));
    });
  });

  group('mergeRelayDirectionUnit', () {
    test('points toward each direction of travel', () {
      expect(mergeRelayDirectionUnit(MergeDirection.up), const Offset(0, -1));
      expect(mergeRelayDirectionUnit(MergeDirection.down), const Offset(0, 1));
      expect(mergeRelayDirectionUnit(MergeDirection.left), const Offset(-1, 0));
      expect(mergeRelayDirectionUnit(MergeDirection.right), const Offset(1, 0));
    });
  });
}
