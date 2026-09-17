import 'package:heist_rules/heist_rules.dart';

final sixtySecondHeistLevel = HeistLevel(
  id: 'training-vault',
  walkable: [
    for (var y = 0; y < 6; y += 1)
      for (var x = 0; x < 6; x += 1) HeistPoint(x, y),
  ],
  start: const HeistPoint(0, 0),
  loot: const HeistPoint(1, 0),
  exit: const HeistPoint(2, 0),
  guardPath: const [
    HeistPoint(5, 5),
    HeistPoint(5, 4),
    HeistPoint(4, 4),
    HeistPoint(4, 5),
  ],
  camera: const VisionSensor(
    position: HeistPoint(3, 3),
    facing: HeistActionType.left,
  ),
  lasers: const [
    LaserSegment(
      id: 'training-laser',
      from: HeistPoint(3, 0),
      to: HeistPoint(4, 0),
      period: 2,
      activeTicks: 1,
    ),
  ],
  maxTicks: 64,
);
