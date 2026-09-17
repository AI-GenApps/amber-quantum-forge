import 'package:platform_core/platform_core.dart';

const heistRuleVersion = 'SH-2D-1';
const maxHeistCoordinate = 32;
const maxHeistLevelIdLength = 64;
const maxHeistLaserCount = 64;

final class HeistPoint {
  const HeistPoint(this.x, this.y);

  final int x;
  final int y;

  HeistPoint move(HeistActionType action) {
    return switch (action) {
      HeistActionType.up => HeistPoint(x, y - 1),
      HeistActionType.down => HeistPoint(x, y + 1),
      HeistActionType.left => HeistPoint(x - 1, y),
      HeistActionType.right => HeistPoint(x + 1, y),
      HeistActionType.wait => this,
    };
  }

  @override
  bool operator ==(Object other) =>
      other is HeistPoint && other.x == x && other.y == y;

  @override
  int get hashCode => Object.hash(x, y);

  @override
  String toString() => '($x,$y)';

  JsonObject toJson() => {'x': x, 'y': y};

  factory HeistPoint.fromJson(Object? raw) {
    if (raw is! Map || raw['x'] is! int || raw['y'] is! int) {
      throw const FormatException('Invalid heist point');
    }
    return HeistPoint(raw['x']! as int, raw['y']! as int);
  }
}

enum HeistActionType { up, down, left, right, wait }

final class HeistAction {
  const HeistAction(this.type);

  final HeistActionType type;

  JsonObject toJson() => {'type': type.name};

  factory HeistAction.fromJson(Object? raw) {
    if (raw is! Map || raw['type'] is! String) {
      throw const FormatException('Invalid heist action');
    }
    try {
      return HeistAction(HeistActionType.values.byName(raw['type']! as String));
    } on ArgumentError {
      throw const FormatException('Unsupported heist action');
    }
  }
}

enum HeistTool { smoke, decoy, laserBypass }

final class ScheduledTool {
  const ScheduledTool({required this.tick, required this.tool, this.target});

  final int tick;
  final HeistTool tool;
  final HeistPoint? target;

  JsonObject toJson() => {
    'tick': tick,
    'tool': tool.name,
    if (target != null) 'target': target!.toJson(),
  };
}

final class VisionSensor {
  const VisionSensor({required this.position, required this.facing});

  final HeistPoint position;
  final HeistActionType facing;
}

final class LaserSegment {
  const LaserSegment({
    required this.id,
    required this.from,
    required this.to,
    this.period = 2,
    this.activeTicks = 1,
  });

  final String id;
  final HeistPoint from;
  final HeistPoint to;
  final int period;
  final int activeTicks;

  bool isActiveAt(int tick) {
    if (period <= 0 || activeTicks <= 0) return false;
    return tick % period < activeTicks;
  }

  bool crosses(HeistPoint start, HeistPoint end) {
    return (start == from && end == to) || (start == to && end == from);
  }
}

final class HeistLevel {
  HeistLevel({
    required this.id,
    required Iterable<HeistPoint> walkable,
    required this.start,
    required this.loot,
    required this.exit,
    required Iterable<HeistPoint> guardPath,
    this.camera,
    Iterable<LaserSegment> lasers = const [],
    this.key,
    this.door,
    this.switchPoint,
    this.maxTicks = 64,
  }) : walkable = Set.unmodifiable(walkable),
       guardPath = List.unmodifiable(guardPath),
       lasers = List.unmodifiable(lasers) {
    if (maxTicks <= 0 || maxTicks > 64)
      throw ArgumentError.value(maxTicks, 'maxTicks');
    if (this.walkable.length > 36)
      throw ArgumentError('A level has at most 36 cells');
    if (this.guardPath.isEmpty) throw ArgumentError('A guard path is required');
    _validatePoint(start, 'start');
    _validatePoint(loot, 'loot');
    _validatePoint(exit, 'exit');
    if (!this.walkable.contains(start) ||
        !this.walkable.contains(loot) ||
        !this.walkable.contains(exit)) {
      throw ArgumentError('Level goals must be walkable');
    }
    for (final point in this.guardPath) {
      _validatePoint(point, 'guard path');
      if (!this.walkable.contains(point)) {
        throw ArgumentError('Guard path must be walkable');
      }
    }
    for (var index = 0; index < this.guardPath.length; index += 1) {
      final next = this.guardPath[(index + 1) % this.guardPath.length];
      if (_distance(this.guardPath[index], next) > 1) {
        throw ArgumentError('Guard path contains a non-adjacent step');
      }
    }
    if (this.lasers.length > maxHeistLaserCount) {
      throw ArgumentError('A level has too many lasers');
    }
    final laserIds = <String>{};
    for (final laser in this.lasers) {
      if (laser.id.isEmpty ||
          laser.id.length > maxHeistLevelIdLength ||
          !laserIds.add(laser.id) ||
          laser.from == laser.to ||
          !this.walkable.contains(laser.from) ||
          !this.walkable.contains(laser.to) ||
          laser.period < 1 ||
          laser.period > maxTicks ||
          laser.activeTicks < 1 ||
          laser.activeTicks > laser.period) {
        throw ArgumentError('Invalid laser definition');
      }
    }
    for (final point in [camera?.position, key, door, switchPoint]) {
      if (point != null && !this.walkable.contains(point)) {
        throw ArgumentError('Sensor and interaction points must be walkable');
      }
    }
    if (camera?.facing == HeistActionType.wait) {
      throw ArgumentError('A camera must face a direction');
    }
    if (id.isEmpty || id.length > maxHeistLevelIdLength) {
      throw ArgumentError.value(id, 'id');
    }
  }

  final String id;
  final Set<HeistPoint> walkable;
  final HeistPoint start;
  final HeistPoint loot;
  final HeistPoint exit;
  final List<HeistPoint> guardPath;
  final VisionSensor? camera;
  final List<LaserSegment> lasers;
  final HeistPoint? key;
  final HeistPoint? door;
  final HeistPoint? switchPoint;
  final int maxTicks;

  bool isWalkable(HeistPoint point, {required bool doorOpen}) {
    if (!walkable.contains(point)) return false;
    if (door != null && point == door && !doorOpen) return false;
    return true;
  }
}

enum HeistOutcomeStatus { success, failure, invalid, timeout }

final class HeistEvent {
  const HeistEvent({
    required this.tick,
    required this.type,
    required this.message,
    required this.player,
    this.hazard,
  });

  final int tick;
  final String type;
  final String message;
  final HeistPoint player;
  final String? hazard;

  JsonObject toJson() => {
    'tick': tick,
    'type': type,
    'message': message,
    'player': player.toJson(),
    if (hazard != null) 'hazard': hazard,
  };
}

final class HeistOutcome {
  const HeistOutcome({
    required this.status,
    required this.reason,
    required this.finalTick,
    required this.player,
    required this.trace,
    required this.lootCollected,
    this.ruleVersion = heistRuleVersion,
  });

  final HeistOutcomeStatus status;
  final String reason;
  final int finalTick;
  final HeistPoint player;
  final List<HeistEvent> trace;
  final bool lootCollected;
  final String ruleVersion;

  bool get succeeded => status == HeistOutcomeStatus.success;

  JsonObject toJson() => {
    'status': status.name,
    'reason': reason,
    'final_tick': finalTick,
    'player': player.toJson(),
    'loot_collected': lootCollected,
    'rule_version': ruleVersion,
    'trace': trace.map((event) => event.toJson()).toList(growable: false),
  };
}

void _validatePoint(HeistPoint point, String name) {
  if (point.x.abs() > maxHeistCoordinate ||
      point.y.abs() > maxHeistCoordinate) {
    throw ArgumentError.value(point, name);
  }
}

int _distance(HeistPoint first, HeistPoint second) {
  return (first.x - second.x).abs() + (first.y - second.y).abs();
}
