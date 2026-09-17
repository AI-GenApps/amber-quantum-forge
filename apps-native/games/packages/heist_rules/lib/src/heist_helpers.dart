import 'heist_models.dart';

HeistOutcome invalidOutcome(HeistLevel level, String reason) {
  return HeistOutcome(
    status: HeistOutcomeStatus.invalid,
    reason: reason,
    finalTick: 0,
    player: level.start,
    trace: const [],
    lootCollected: false,
  );
}

String? validateTools(
  HeistLevel level,
  List<HeistAction> route,
  List<ScheduledTool> tools,
) {
  final used = <HeistTool>{};
  for (final scheduled in tools) {
    if (scheduled.tick < 0 || scheduled.tick >= route.length) {
      return 'tool_tick_out_of_bounds';
    }
    if (!used.add(scheduled.tool)) return 'tool_already_used';
    final target = scheduled.target;
    switch (scheduled.tool) {
      case HeistTool.smoke:
        if (target == null || !level.walkable.contains(target)) {
          return 'invalid_smoke_target';
        }
      case HeistTool.decoy:
        if (target != null && !level.walkable.contains(target)) {
          return 'invalid_decoy_target';
        }
      case HeistTool.laserBypass:
        if (target == null || laserIdAt(level, target) == null) {
          return 'invalid_laser_target';
        }
    }
  }
  return null;
}

String? laserIdAt(HeistLevel level, HeistPoint point) {
  for (final laser in level.lasers) {
    if (laser.from == point || laser.to == point) return laser.id;
  }
  return null;
}
