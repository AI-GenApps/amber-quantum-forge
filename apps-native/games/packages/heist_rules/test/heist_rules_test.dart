import 'package:heist_rules/heist_rules.dart';
import 'package:test/test.dart';

HeistLevel level({bool withLaser = false, bool withCamera = false}) {
  final cells = [
    for (var y = 0; y < 6; y += 1)
      for (var x = 0; x < 6; x += 1) HeistPoint(x, y),
  ];
  return HeistLevel(
    id: 'fixture-1',
    walkable: cells,
    start: const HeistPoint(0, 0),
    loot: const HeistPoint(1, 0),
    exit: const HeistPoint(2, 0),
    guardPath: const [HeistPoint(5, 5), HeistPoint(5, 4)],
    camera: withCamera
        ? const VisionSensor(
            position: HeistPoint(3, 0),
            facing: HeistActionType.left,
          )
        : null,
    lasers: withLaser
        ? const [
            LaserSegment(
              id: 'laser-a',
              from: HeistPoint(1, 0),
              to: HeistPoint(2, 0),
              activeTicks: 2,
            ),
          ]
        : const [],
  );
}

void main() {
  const rules = HeistRules();

  test('successful route emits a deterministic trace', () {
    final actions = [
      const HeistAction(HeistActionType.right),
      const HeistAction(HeistActionType.right),
    ];
    final first = rules.run(level: level(), actions: actions);
    final second = rules.run(level: level(), actions: actions);

    expect(first.status, HeistOutcomeStatus.success);
    expect(first.reason, 'escaped');
    expect(first.toJson(), second.toJson());
    expect(first.trace.map((event) => event.type), [
      'tick_complete',
      'tick_complete',
      'success',
    ]);
  });

  test('invalid wall route is rejected before simulation', () {
    final result = rules.run(
      level: level(),
      actions: const [HeistAction(HeistActionType.up)],
    );

    expect(result.status, HeistOutcomeStatus.invalid);
    expect(result.reason, 'route_contains_illegal_step');
    expect(result.trace, isEmpty);
  });

  test('laser detection precedes exit success on the same tick', () {
    final result = rules.run(
      level: level(withLaser: true),
      actions: const [
        HeistAction(HeistActionType.right),
        HeistAction(HeistActionType.right),
      ],
    );

    expect(result.status, HeistOutcomeStatus.failure);
    expect(result.reason, 'laser_crossed');
    expect(result.finalTick, 1);
    expect(result.trace.last.type, 'failure');
  });

  test('camera failure records the hazard tick', () {
    final result = rules.run(
      level: level(withCamera: true),
      actions: const [HeistAction(HeistActionType.right)],
    );

    expect(result.status, HeistOutcomeStatus.failure);
    expect(result.reason, 'camera_detection');
    expect(result.trace.single.type, 'failure');
    expect(result.trace.single.tick, 0);
  });

  test('bounded route limit is explicit', () {
    final result = rules.run(
      level: level(),
      actions: List<HeistAction>.filled(
        65,
        const HeistAction(HeistActionType.wait),
      ),
    );

    expect(result.status, HeistOutcomeStatus.invalid);
    expect(result.reason, 'route_exceeds_tick_limit');
  });

  test('stationary guard keeps its facing while the player waits', () {
    final stationary = HeistLevel(
      id: 'stationary-guard',
      walkable: [
        for (var y = 0; y < 6; y += 1)
          for (var x = 0; x < 6; x += 1) HeistPoint(x, y),
      ],
      start: const HeistPoint(0, 2),
      loot: const HeistPoint(0, 0),
      exit: const HeistPoint(0, 1),
      guardPath: const [HeistPoint(2, 2), HeistPoint(2, 2)],
    );

    final result = rules.run(
      level: stationary,
      actions: const [HeistAction(HeistActionType.wait)],
    );

    expect(result.status, HeistOutcomeStatus.failure);
    expect(result.reason, 'guard_vision');
  });

  test('closed doors occlude camera vision', () {
    final occluded = HeistLevel(
      id: 'door-occlusion',
      walkable: [
        for (var y = 0; y < 6; y += 1)
          for (var x = 0; x < 6; x += 1) HeistPoint(x, y),
      ],
      start: const HeistPoint(0, 0),
      loot: const HeistPoint(0, 1),
      exit: const HeistPoint(0, 2),
      guardPath: const [HeistPoint(5, 5), HeistPoint(5, 4)],
      camera: const VisionSensor(
        position: HeistPoint(3, 0),
        facing: HeistActionType.left,
      ),
      door: const HeistPoint(1, 0),
    );

    final result = rules.run(
      level: occluded,
      actions: const [HeistAction(HeistActionType.wait)],
    );

    expect(result.status, HeistOutcomeStatus.timeout);
  });

  test('tools are bounded, targeted, and single use', () {
    final repeated = rules.run(
      level: level(),
      actions: const [
        HeistAction(HeistActionType.wait),
        HeistAction(HeistActionType.wait),
      ],
      tools: const [
        ScheduledTool(tick: 0, tool: HeistTool.smoke, target: HeistPoint(0, 0)),
        ScheduledTool(tick: 1, tool: HeistTool.smoke, target: HeistPoint(0, 0)),
      ],
    );
    final outOfBounds = rules.run(
      level: level(),
      actions: const [HeistAction(HeistActionType.wait)],
      tools: const [
        ScheduledTool(tick: 0, tool: HeistTool.decoy, target: HeistPoint(9, 9)),
      ],
    );

    expect(repeated.reason, 'tool_already_used');
    expect(outOfBounds.reason, 'invalid_decoy_target');
  });

  test('upward guard movement updates facing deterministically', () {
    final upward = HeistLevel(
      id: 'upward-guard',
      walkable: [
        for (var y = 0; y < 6; y += 1)
          for (var x = 0; x < 6; x += 1) HeistPoint(x, y),
      ],
      start: const HeistPoint(2, 0),
      loot: const HeistPoint(5, 5),
      exit: const HeistPoint(5, 4),
      guardPath: const [HeistPoint(2, 2), HeistPoint(2, 1)],
    );

    final result = rules.run(
      level: upward,
      actions: const [HeistAction(HeistActionType.wait)],
    );

    expect(result.reason, 'guard_vision');
  });

  test('invalid geometry and future action payloads are rejected', () {
    expect(
      () => HeistLevel(
        id: 'invalid-start',
        walkable: const [HeistPoint(0, 0)],
        start: const HeistPoint(9, 9),
        loot: const HeistPoint(0, 0),
        exit: const HeistPoint(0, 0),
        guardPath: const [HeistPoint(0, 0)],
      ),
      throwsArgumentError,
    );
    expect(
      () => HeistAction.fromJson({'type': 'teleport'}),
      throwsFormatException,
    );
    expect(HeistAction.fromJson({'type': 'right'}).toJson(), {'type': 'right'});
  });
}
