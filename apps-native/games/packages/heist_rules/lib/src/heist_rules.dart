import 'heist_models.dart';
import 'heist_helpers.dart';

final class HeistRules {
  const HeistRules();

  HeistPoint previewPlayer({
    required HeistLevel level,
    required Iterable<HeistAction> actions,
  }) {
    var position = level.start;
    var keyCollected = false;
    var switchLatched = false;
    for (final action in actions.take(level.maxTicks)) {
      final next = position.move(action.type);
      if (!level.isWalkable(next, doorOpen: keyCollected || switchLatched)) {
        break;
      }
      position = next;
      if (position == level.key) keyCollected = true;
      if (position == level.switchPoint) switchLatched = true;
    }
    return position;
  }

  HeistOutcome run({
    required HeistLevel level,
    required Iterable<HeistAction> actions,
    Iterable<ScheduledTool> tools = const [],
  }) {
    final route = actions.toList(growable: false);
    final scheduled = tools.toList(growable: false);
    final invalid = _validateRoute(level, route);
    if (invalid != null) {
      return invalidOutcome(level, invalid);
    }
    final invalidTools = validateTools(level, route, scheduled);
    if (invalidTools != null) {
      return invalidOutcome(level, invalidTools);
    }
    final trace = <HeistEvent>[];
    var player = level.start;
    var previousPlayer = player;
    var guardIndex = 0;
    var guardFacing = _facing(
      level.guardPath[0],
      level.guardPath.length > 1 ? level.guardPath[1] : level.guardPath[0],
      HeistActionType.left,
    );
    var lootCollected = false;
    var switchLatched = false;
    var keyCollected = false;
    var smokeUntil = -1;
    HeistPoint? smokePoint;
    var decoyTick = -1;
    String? bypassLaser;

    for (var tick = 0; tick < route.length; tick += 1) {
      final action = route[tick];
      final tickTools = scheduled
          .where((tool) => tool.tick == tick)
          .toList(growable: false);
      for (final scheduledTool in tickTools) {
        switch (scheduledTool.tool) {
          case HeistTool.smoke:
            smokePoint = scheduledTool.target;
            smokeUntil = tick + 2;
          case HeistTool.decoy:
            decoyTick = tick;
          case HeistTool.laserBypass:
            bypassLaser = scheduledTool.target == null
                ? null
                : laserIdAt(level, scheduledTool.target!);
        }
      }
      final doorOpen = keyCollected || switchLatched;
      previousPlayer = player;
      final previousGuard = level.guardPath[guardIndex];
      final nextPlayer = player.move(action.type);
      if (!level.isWalkable(nextPlayer, doorOpen: doorOpen)) {
        return _failure(
          trace: trace,
          tick: tick,
          player: player,
          reason: 'invalid_move',
          hazard: 'wall_or_closed_door',
          lootCollected: lootCollected,
        );
      }
      player = nextPlayer;
      if (decoyTick != tick) {
        final nextGuardIndex = (guardIndex + 1) % level.guardPath.length;
        final nextGuard = level.guardPath[nextGuardIndex];
        if (nextGuard != level.guardPath[guardIndex]) {
          guardFacing = _facing(
            level.guardPath[guardIndex],
            nextGuard,
            guardFacing,
          );
        }
        guardIndex = nextGuardIndex;
      }
      final guard = level.guardPath[guardIndex];
      final detected = _detect(
        level: level,
        tick: tick,
        previousPlayer: previousPlayer,
        player: player,
        previousGuard: previousGuard,
        guard: guard,
        guardFacing: guardFacing,
        doorOpen: doorOpen,
        smokePoint: smokeUntil > tick ? smokePoint : null,
        bypassLaser: bypassLaser,
      );
      if (detected != null) {
        return _failure(
          trace: trace,
          tick: tick,
          player: player,
          reason: detected,
          hazard: detected,
          lootCollected: lootCollected,
        );
      }
      if (player == level.key) keyCollected = true;
      if (player == level.loot) lootCollected = true;
      if (player == level.switchPoint) switchLatched = true;
      trace.add(
        HeistEvent(
          tick: tick,
          type: 'tick_complete',
          message: 'Action resolved',
          player: player,
        ),
      );
      if (player == level.exit && lootCollected) {
        trace.add(
          HeistEvent(
            tick: tick,
            type: 'success',
            message: 'Loot escaped',
            player: player,
          ),
        );
        return HeistOutcome(
          status: HeistOutcomeStatus.success,
          reason: 'escaped',
          finalTick: tick,
          player: player,
          trace: List.unmodifiable(trace),
          lootCollected: true,
        );
      }
      bypassLaser = null;
    }
    return HeistOutcome(
      status: HeistOutcomeStatus.timeout,
      reason: 'route_ended_without_escape',
      finalTick: route.length,
      player: player,
      trace: List.unmodifiable(trace),
      lootCollected: lootCollected,
    );
  }

  String? _validateRoute(HeistLevel level, List<HeistAction> route) {
    if (route.length > level.maxTicks) return 'route_exceeds_tick_limit';
    var position = level.start;
    var keyCollected = false;
    var switchLatched = false;
    for (final action in route) {
      final next = position.move(action.type);
      if (!level.isWalkable(next, doorOpen: keyCollected || switchLatched)) {
        return 'route_contains_illegal_step';
      }
      position = next;
      if (position == level.key) keyCollected = true;
      if (position == level.switchPoint) switchLatched = true;
    }
    return null;
  }

  String? _detect({
    required HeistLevel level,
    required int tick,
    required HeistPoint previousPlayer,
    required HeistPoint player,
    required HeistPoint previousGuard,
    required HeistPoint guard,
    required HeistActionType guardFacing,
    required bool doorOpen,
    required HeistPoint? smokePoint,
    required String? bypassLaser,
  }) {
    if (player == guard ||
        (previousPlayer == guard && player == previousGuard)) {
      return 'guard_contact';
    }
    if (_inVision(guard, guardFacing, player, level, doorOpen, smokePoint))
      return 'guard_vision';
    final camera = level.camera;
    if (camera != null &&
        _inVision(
          camera.position,
          camera.facing,
          player,
          level,
          doorOpen,
          smokePoint,
        )) {
      return 'camera_detection';
    }
    for (final laser in level.lasers) {
      if (laser.id == bypassLaser) continue;
      if (laser.isActiveAt(tick) && laser.crosses(previousPlayer, player))
        return 'laser_crossed';
    }
    return null;
  }

  bool _inVision(
    HeistPoint origin,
    HeistActionType facing,
    HeistPoint target,
    HeistLevel level,
    bool doorOpen,
    HeistPoint? smokePoint,
  ) {
    var point = origin;
    for (var distance = 0; distance < 3; distance += 1) {
      point = point.move(facing);
      if (!level.isWalkable(point, doorOpen: doorOpen)) return false;
      if (point == smokePoint) return false;
      if (point == target) return true;
    }
    return false;
  }

  HeistActionType _facing(
    HeistPoint from,
    HeistPoint to,
    HeistActionType fallback,
  ) {
    if (to.x > from.x) return HeistActionType.right;
    if (to.x < from.x) return HeistActionType.left;
    if (to.y > from.y) return HeistActionType.down;
    if (to.y < from.y) return HeistActionType.up;
    return fallback;
  }

  HeistOutcome _failure({
    required List<HeistEvent> trace,
    required int tick,
    required HeistPoint player,
    required String reason,
    required String hazard,
    required bool lootCollected,
  }) {
    trace.add(
      HeistEvent(
        tick: tick,
        type: 'failure',
        message: reason,
        player: player,
        hazard: hazard,
      ),
    );
    return HeistOutcome(
      status: HeistOutcomeStatus.failure,
      reason: reason,
      finalTick: tick,
      player: player,
      trace: List.unmodifiable(trace),
      lootCollected: lootCollected,
    );
  }
}
