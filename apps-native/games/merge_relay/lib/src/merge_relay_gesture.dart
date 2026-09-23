import 'package:flutter/material.dart';
import 'package:merge_rules/merge_rules.dart';

const mergeSwipeSlop = 24.0;
const mergeFlingVelocity = 180.0;

final class MergeSwipeAccumulator {
  MergeSwipeAccumulator({this.slop = mergeSwipeSlop});

  final double slop;
  Offset _distance = Offset.zero;
  bool _active = false;

  void start() {
    _distance = Offset.zero;
    _active = true;
  }

  void update(Offset delta) {
    if (_active) _distance += delta;
  }

  MergeDirection? finish({Offset velocity = Offset.zero}) {
    if (!_active) return null;
    final distance = _distance;
    _distance = Offset.zero;
    _active = false;
    if (distance.distance >= slop) return directionForDelta(distance);
    if (velocity.distance >= mergeFlingVelocity) {
      return directionForDelta(velocity);
    }
    return null;
  }

  void cancel() {
    _distance = Offset.zero;
    _active = false;
  }
}

MergeDirection directionForDelta(Offset delta) {
  if (delta.dx.abs() > delta.dy.abs()) {
    return delta.dx > 0 ? MergeDirection.right : MergeDirection.left;
  }
  return delta.dy > 0 ? MergeDirection.down : MergeDirection.up;
}
