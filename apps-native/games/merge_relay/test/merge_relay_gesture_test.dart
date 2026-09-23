import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gesture.dart';
import 'package:merge_rules/merge_rules.dart';

void main() {
  test('slow horizontal and vertical swipes use accumulated distance', () {
    final horizontal = MergeSwipeAccumulator()..start();
    horizontal.update(const Offset(9, 1));
    horizontal.update(const Offset(10, -1));
    horizontal.update(const Offset(8, 0));
    expect(horizontal.finish(), MergeDirection.right);

    final vertical = MergeSwipeAccumulator()..start();
    vertical.update(const Offset(1, -13));
    vertical.update(const Offset(-1, -13));
    expect(vertical.finish(), MergeDirection.up);
  });

  test(
    'tap and jitter do not move, while dominant diagonal chooses one axis',
    () {
      final tap = MergeSwipeAccumulator()..start();
      tap.update(const Offset(4, 5));
      expect(tap.finish(), isNull);

      final diagonal = MergeSwipeAccumulator()..start();
      diagonal.update(const Offset(32, 14));
      expect(diagonal.finish(), MergeDirection.right);
    },
  );

  test('fast fling works without updates and emits only once', () {
    final fling = MergeSwipeAccumulator()..start();
    expect(fling.finish(velocity: const Offset(-240, 4)), MergeDirection.left);
    expect(fling.finish(velocity: const Offset(-240, 4)), isNull);
  });

  test('cancel clears the in-flight gesture', () {
    final gesture = MergeSwipeAccumulator()..start();
    gesture.update(const Offset(40, 0));
    gesture.cancel();
    expect(gesture.finish(), isNull);
  });
}
