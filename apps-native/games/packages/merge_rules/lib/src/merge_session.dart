import 'merge_models.dart';
import 'merge_board.dart';
import 'merge_config.dart';
import 'merge_replay.dart';
import 'merge_rules.dart';

enum MergeSessionKind { rescue, relay, daily, endless }

enum MergeSessionAccess { practice, ranked }

final class MergeMoveBudget {
  MergeMoveBudget.bounded(int value) : maxLegalMoves = value {
    if (value < 1 || value > 3) {
      throw ArgumentError.value(value, 'maxLegalMoves');
    }
  }

  const MergeMoveBudget.unbounded() : maxLegalMoves = null;

  factory MergeMoveBudget.fromJson(Map<String, Object?> json) {
    if (json.length != 1 || !json.containsKey('max_legal_moves')) {
      throw const FormatException('Unexpected merge move budget fields');
    }
    final value = json['max_legal_moves'];
    if (value == null) return const MergeMoveBudget.unbounded();
    if (value is! int) {
      throw const FormatException('Invalid merge move budget');
    }
    return MergeMoveBudget.bounded(value);
  }

  final int? maxLegalMoves;

  bool get isBounded => maxLegalMoves != null;

  Map<String, Object?> toJson() => {'max_legal_moves': maxLegalMoves};
}

final class MergeObjective {
  MergeObjective({required this.id, required this.title, this.detail}) {
    _validateId(id, 'id');
    _validateText(title, 'title', maxLength: 120);
    if (detail != null) _validateText(detail!, 'detail', maxLength: 240);
  }

  factory MergeObjective.fromJson(Map<String, Object?> json) {
    const fields = {'id', 'title', 'detail'};
    if (json.keys.any((key) => !fields.contains(key)) ||
        !json.containsKey('id') ||
        !json.containsKey('title')) {
      throw const FormatException('Unexpected merge objective fields');
    }
    final id = json['id'];
    final title = json['title'];
    final detail = json['detail'];
    if (id is! String ||
        title is! String ||
        (detail != null && detail is! String)) {
      throw const FormatException('Invalid merge objective');
    }
    return MergeObjective(id: id, title: title, detail: detail as String?);
  }

  final String id;
  final String title;
  final String? detail;

  Map<String, Object?> toJson() => {
    'id': id,
    'title': title,
    if (detail != null) 'detail': detail,
  };
}

final class MergeSessionSpec {
  MergeSessionSpec({
    required this.kind,
    required this.access,
    required this.checkpoint,
    required this.moveBudget,
    this.config = const MergeRuleConfig.legacy(),
    this.objective,
    this.sessionId,
    this.dailyDate,
  }) {
    if (access == MergeSessionAccess.ranked && kind != MergeSessionKind.relay) {
      throw ArgumentError.value(access, 'access');
    }
    if (kind == MergeSessionKind.relay && !moveBudget.isBounded) {
      throw ArgumentError.value(moveBudget, 'moveBudget');
    }
    if (kind == MergeSessionKind.rescue && !moveBudget.isBounded) {
      throw ArgumentError.value(moveBudget, 'moveBudget');
    }
    if (kind == MergeSessionKind.endless && moveBudget.isBounded) {
      throw ArgumentError.value(moveBudget, 'moveBudget');
    }
    if (kind == MergeSessionKind.daily && !moveBudget.isBounded) {
      throw ArgumentError.value(moveBudget, 'moveBudget');
    }
    if (kind == MergeSessionKind.daily && dailyDate == null) {
      throw ArgumentError.notNull('dailyDate');
    }
    if (kind != MergeSessionKind.daily && dailyDate != null) {
      throw ArgumentError.value(dailyDate, 'dailyDate');
    }
    if (dailyDate != null) _validateUtcDate(dailyDate!);
    if (sessionId != null) _validateId(sessionId!, 'sessionId');
    if (checkpoint.spawnWeights != null &&
        !checkpoint.spawnWeights!.matches(config.spawnWeights)) {
      throw ArgumentError.value(checkpoint.spawnWeights, 'checkpoint');
    }
    if (checkpoint.spawnWeights == null &&
        !config.spawnWeights.matches(const MergeSpawnWeights.legacy())) {
      throw ArgumentError.value(checkpoint.spawnWeights, 'checkpoint');
    }
  }

  factory MergeSessionSpec.fromJson(Map<String, Object?> json) {
    const fields = {
      'schema_version',
      'kind',
      'access',
      'checkpoint',
      'move_budget',
      'rule_config',
      'objective',
      'session_id',
      'daily_date',
    };
    const required = {
      'schema_version',
      'kind',
      'access',
      'checkpoint',
      'move_budget',
    };
    if (json.keys.any((key) => !fields.contains(key)) ||
        required.any((key) => !json.containsKey(key))) {
      throw const FormatException('Unexpected merge session fields');
    }
    final schemaVersion = json['schema_version'];
    final kind = json['kind'];
    final access = json['access'];
    final checkpoint = json['checkpoint'];
    final moveBudget = json['move_budget'];
    final ruleConfig = json['rule_config'];
    final objective = json['objective'];
    final sessionId = json['session_id'];
    final dailyDate = json['daily_date'];
    if (schemaVersion != 1 ||
        kind is! String ||
        access is! String ||
        checkpoint is! Map ||
        moveBudget is! Map ||
        (ruleConfig != null && ruleConfig is! Map) ||
        (objective != null && objective is! Map) ||
        (sessionId != null && sessionId is! String) ||
        (dailyDate != null && dailyDate is! String)) {
      throw const FormatException('Invalid merge session');
    }
    return MergeSessionSpec(
      kind: _parseKind(kind),
      access: _parseAccess(access),
      checkpoint: MergeCheckpoint.fromJson(checkpoint.cast<String, Object?>()),
      moveBudget: MergeMoveBudget.fromJson(moveBudget.cast<String, Object?>()),
      config: ruleConfig == null
          ? const MergeRuleConfig.legacy()
          : MergeRuleConfig.fromJson(
              (ruleConfig as Map).cast<String, Object?>(),
            ),
      objective: objective == null
          ? null
          : MergeObjective.fromJson((objective as Map).cast<String, Object?>()),
      sessionId: sessionId as String?,
      dailyDate: dailyDate as String?,
    );
  }

  final MergeSessionKind kind;
  final MergeSessionAccess access;
  final MergeCheckpoint checkpoint;
  final MergeMoveBudget moveBudget;
  final MergeRuleConfig config;
  final MergeObjective? objective;
  final String? sessionId;
  final String? dailyDate;

  Map<String, Object?> toJson() => {
    'schema_version': 1,
    'kind': kind.name,
    'access': access.name,
    'checkpoint': checkpoint.toJson(),
    'move_budget': moveBudget.toJson(),
    'rule_config': config.toJson(),
    if (objective != null) 'objective': objective!.toJson(),
    if (sessionId != null) 'session_id': sessionId,
    if (dailyDate != null) 'daily_date': dailyDate,
  };
}

final class MergeSessionResult {
  const MergeSessionResult({required this.spec, required this.replay});

  final MergeSessionSpec spec;
  final MergeReplayResult replay;

  MergeAttemptOutcome get outcome => replay.outcome;

  int get movesUsed => replay.legalMoves;

  int get scoreGained => replay.scoreGained;

  int get maxTile => replay.maxTile;

  Map<String, Object?> toJson() => {
    'session': spec.toJson(),
    'outcome': mergeAttemptOutcomeName(outcome),
    'moves_used': movesUsed,
    'score_gained': scoreGained,
    'max_tile': maxTile,
    'traces': replay.traces.map((trace) => trace.toJson()).toList(),
  };
}

extension MergeRulesSession on MergeRules {
  MergeSessionResult replaySession(
    MergeSessionSpec spec,
    Iterable<MergeDirection> moves, {
    bool finish = false,
  }) {
    if (!spec.config.matches(config)) {
      throw MergeRuleError(
        'config_mismatch',
        'Merge session config does not match the replay rules',
      );
    }
    final replay = spec.access == MergeSessionAccess.ranked
        ? replayAttempt(
            spec.checkpoint,
            moves,
            finish: finish,
            maxLegalMoves: spec.moveBudget.maxLegalMoves,
          )
        : replayFrom(
            spec.checkpoint.state,
            moves,
            maxLegalMoves: spec.moveBudget.maxLegalMoves,
            finish: finish,
            contentId: spec.checkpoint.contentId,
            contentVersion: spec.checkpoint.contentVersion,
            spawnWeights: spec.config.spawnWeights,
          );
    return MergeSessionResult(spec: spec, replay: replay);
  }
}

MergeSessionKind _parseKind(String value) => switch (value) {
  'rescue' => MergeSessionKind.rescue,
  'relay' => MergeSessionKind.relay,
  'daily' => MergeSessionKind.daily,
  'endless' => MergeSessionKind.endless,
  _ => throw const FormatException('Unsupported merge session kind'),
};

MergeSessionAccess _parseAccess(String value) => switch (value) {
  'practice' => MergeSessionAccess.practice,
  'ranked' => MergeSessionAccess.ranked,
  _ => throw const FormatException('Unsupported merge session access'),
};

void _validateId(String value, String name, {int maxLength = 128}) {
  if (value.isEmpty ||
      value.length > maxLength ||
      !RegExp(r'^[A-Za-z0-9_.:-]+$').hasMatch(value)) {
    throw ArgumentError.value(value, name);
  }
}

void _validateText(String value, String name, {required int maxLength}) {
  if (value.isEmpty ||
      value.length > maxLength ||
      RegExp(r'[\u0000-\u001f]').hasMatch(value)) {
    throw ArgumentError.value(value, name);
  }
}

void _validateUtcDate(String value) {
  if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(value)) {
    throw ArgumentError.value(value, 'dailyDate');
  }
  final parsed = DateTime.tryParse('${value}T00:00:00Z');
  if (parsed == null ||
      parsed.toUtc().toIso8601String().substring(0, 10) != value) {
    throw ArgumentError.value(value, 'dailyDate');
  }
}
