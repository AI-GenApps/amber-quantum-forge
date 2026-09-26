import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_content_validation.dart';

const mergeRelayContentVersion = 'MR-CONTENT-1';
const mergeRelayContentSchemaVersion = 1;
const mergeRelayGoalRevision = 'MR-GOALS-2';

final class MergeRelayContentLoadException implements Exception {
  const MergeRelayContentLoadException(this.message, {this.cause});

  final String message;
  final Object? cause;

  @override
  String toString() => cause == null ? message : '$message ($cause)';
}

const mergeRelayDefaultRescueMoveBudget = 3;

final class MergeRescueBoard {
  const MergeRescueBoard({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.state,
    required this.originSeed,
    required this.originMoves,
    this.objective = 'Fuse the marked pair.',
    this.targetScore = 4,
    this.goalRevision = 'MR-GOALS-1',
    this.chapter = 1,
    this.indexInChapter = 1,
    this.moveBudget = mergeRelayDefaultRescueMoveBudget,
  });

  factory MergeRescueBoard.fromJson(Map<String, Object?> json) {
    final id = json['id'];
    final title = json['title'];
    final subtitle = json['subtitle'];
    if (id is! String || title is! String || subtitle is! String) {
      throw const FormatException('Invalid rescue metadata');
    }
    final trace = MergeRescueTraceRecord.fromJson(_traceFields(json));
    validateCatalog([trace]);
    final objective = json['objective'];
    final targetScore = json['target_score'];
    final goalRevision = json['goal_revision'];
    if (objective != null && objective is! String ||
        targetScore != null && targetScore is! int ||
        goalRevision != null && goalRevision is! String) {
      throw const FormatException('Invalid rescue objective');
    }
    final chapter = json['chapter'];
    final indexInChapter = json['index_in_chapter'];
    final moveBudget = json['move_budget'];
    if (chapter != null && chapter is! int ||
        indexInChapter != null && indexInChapter is! int ||
        moveBudget != null && moveBudget is! int) {
      throw const FormatException('Invalid rescue campaign metadata');
    }
    final resolvedChapter = chapter as int? ?? 1;
    final resolvedIndexInChapter = indexInChapter as int? ?? 1;
    final resolvedMoveBudget =
        moveBudget as int? ?? mergeRelayDefaultRescueMoveBudget;
    if (resolvedChapter < 1 ||
        resolvedIndexInChapter < 1 ||
        resolvedMoveBudget < 1 ||
        resolvedMoveBudget > 6) {
      throw const FormatException('Invalid rescue campaign metadata');
    }
    final resolvedTarget = targetScore as int? ?? 4;
    if (resolvedTarget <= 0 || resolvedTarget > maxMergeScore) {
      throw const FormatException('Invalid rescue target');
    }
    if (targetScore != null &&
        !validateMergeRelayGoal(
          state: trace.state,
          targetScore: resolvedTarget,
          rules: const MergeRules(),
          maxMoves: resolvedMoveBudget,
        ).reachable) {
      throw const FormatException('Rescue target is not reachable');
    }
    return MergeRescueBoard(
      id: id,
      title: title,
      subtitle: subtitle,
      state: trace.state,
      originSeed: trace.originSeed,
      originMoves: trace.originMoves,
      objective: objective as String? ?? 'Fuse the marked pair.',
      targetScore: resolvedTarget,
      goalRevision: goalRevision as String? ?? 'MR-GOALS-1',
      chapter: resolvedChapter,
      indexInChapter: resolvedIndexInChapter,
      moveBudget: resolvedMoveBudget,
    );
  }

  final String id;
  final String title;
  final String subtitle;
  final MergeGameState state;
  final int originSeed;
  final List<MergeDirection> originMoves;
  final String objective;
  final int targetScore;
  final String goalRevision;
  final int chapter;
  final int indexInChapter;
  final int moveBudget;

  static Map<String, Object?> _traceFields(Map<String, Object?> json) {
    const fields = {
      'id',
      'board',
      'score',
      'move_count',
      'seed',
      'rng_state',
      'rule_version',
      'origin_seed',
      'origin_moves',
      'provenance',
      'difficulty',
    };
    return {
      for (final entry in json.entries)
        if (fields.contains(entry.key)) entry.key: entry.value,
    };
  }
}

final class MergeRelayContentCatalog {
  const MergeRelayContentCatalog(
    this.rescues, {
    this.contentVersion = mergeRelayContentVersion,
    this.ruleConfig = const MergeRuleConfig.legacy(),
  });

  final List<MergeRescueBoard> rescues;
  final String contentVersion;
  final MergeRuleConfig ruleConfig;

  MergeRescueBoard get firstRescue => rescues.first;

  factory MergeRelayContentCatalog.fromJson(Object raw) {
    if (raw is! Map) throw const FormatException('Invalid relay content');
    final json = raw.map<String, Object?>((key, value) {
      if (key is! String) {
        throw const FormatException('Invalid relay content keys');
      }
      return MapEntry(key, value);
    });
    const requiredFields = {
      'content_version',
      'rule_version',
      'schema_version',
      'rule_config',
      'generator',
      'rescue_boards',
    };
    const fields = {...requiredFields, 'campaign'};
    if (json.keys.any((key) => !fields.contains(key)) ||
        requiredFields.any((key) => !json.containsKey(key))) {
      throw const FormatException('Unexpected relay content fields');
    }
    final campaign = json['campaign'];
    if (campaign != null && campaign is! Map) {
      throw const FormatException('Invalid rescue campaign metadata');
    }
    if (json['content_version'] != mergeRelayContentVersion ||
        json['rule_version'] != mergeRuleVersion ||
        json['schema_version'] != mergeRelayContentSchemaVersion) {
      throw const FormatException('Unsupported relay content version');
    }
    final ruleConfig = json['rule_config'];
    if (ruleConfig is! Map) {
      throw const FormatException('Invalid relay rule config');
    }
    late final MergeRuleConfig parsedConfig;
    try {
      parsedConfig = MergeRuleConfig.fromJson(
        ruleConfig.cast<String, Object?>(),
      );
    } on Object {
      throw const FormatException('Invalid relay rule config');
    }
    if (!parsedConfig.matches(const MergeRuleConfig.legacy())) {
      throw const FormatException('Unsupported relay rule config');
    }
    final generator = json['generator'];
    if (generator is! Map ||
        generator.length != 1 ||
        generator['algorithm'] != mergeRescueTraceAlgorithm) {
      throw const FormatException('Unsupported rescue generator');
    }
    final records = json['rescue_boards'];
    if (records is! List || records.isEmpty) {
      throw const FormatException('Rescue content is empty');
    }
    final rescues = records
        .whereType<Map>()
        .map(
          (record) => MergeRescueBoard.fromJson(
            record.map<String, Object?>((key, value) {
              if (key is! String) {
                throw const FormatException('Invalid rescue record keys');
              }
              return MapEntry(key, value);
            }),
          ),
        )
        .toList(growable: false);
    if (rescues.length != records.length) {
      throw const FormatException('Invalid rescue record');
    }
    final ids = rescues.map((rescue) => rescue.id).toSet();
    if (ids.length != rescues.length) {
      throw const FormatException('Duplicate rescue id');
    }
    return MergeRelayContentCatalog(
      List.unmodifiable(rescues),
      contentVersion: json['content_version'] as String,
      ruleConfig: parsedConfig,
    );
  }

  static Future<MergeRelayContentCatalog> load({
    Future<String> Function()? readAsset,
  }) async {
    try {
      final encoded =
          await (readAsset?.call() ??
              rootBundle.loadString('content/rescue_boards.json'));
      return MergeRelayContentCatalog.fromJson(jsonDecode(encoded));
    } on MergeRelayContentLoadException {
      rethrow;
    } on Object catch (error) {
      throw MergeRelayContentLoadException(
        'Merge Relay content could not be loaded',
        cause: error,
      );
    }
  }

  static final fallback = _generatedFallback();
}

MergeRelayContentCatalog _generatedFallback() {
  const entries = [
    (
      spec: MergeRescueGenerationSpec(
        id: 'rescue-signal',
        originSeed: 101,
        originMoveCount: 3,
      ),
      title: 'Signal in',
      subtitle: 'Pair the blue tiles.',
      objective: 'Reach 16 points.',
      targetScore: 16,
      goalRevision: mergeRelayGoalRevision,
    ),
    (
      spec: MergeRescueGenerationSpec(
        id: 'rescue-echo',
        originSeed: 202,
        originMoveCount: 4,
      ),
      title: 'Echo lane',
      subtitle: 'Find the matching pair.',
      objective: 'Reach 16 points.',
      targetScore: 16,
      goalRevision: mergeRelayGoalRevision,
    ),
    (
      spec: MergeRescueGenerationSpec(
        id: 'rescue-crossing',
        originSeed: 303,
        originMoveCount: 5,
      ),
      title: 'Crossing',
      subtitle: 'Open a path through the middle.',
      objective: 'Reach 28 points.',
      targetScore: 28,
      goalRevision: mergeRelayGoalRevision,
    ),
    (
      spec: MergeRescueGenerationSpec(
        id: 'rescue-coral',
        originSeed: 404,
        originMoveCount: 6,
      ),
      title: 'Coral turn',
      subtitle: 'Bring the warm pair together.',
      objective: 'Reach 24 points.',
      targetScore: 24,
      goalRevision: mergeRelayGoalRevision,
    ),
    (
      spec: MergeRescueGenerationSpec(
        id: 'rescue-late',
        originSeed: 505,
        originMoveCount: 7,
      ),
      title: 'Last Light',
      subtitle: 'Choose the cleanest first move.',
      objective: 'Reach 28 points.',
      targetScore: 28,
      goalRevision: mergeRelayGoalRevision,
    ),
  ];
  const generator = MergeRescueGenerator();
  final records = generator.generateCatalog(entries.map((entry) => entry.spec));
  return MergeRelayContentCatalog([
    for (var index = 0; index < records.length; index += 1)
      MergeRescueBoard(
        id: records[index].id,
        title: entries[index].title,
        subtitle: entries[index].subtitle,
        objective: entries[index].objective,
        targetScore: entries[index].targetScore,
        goalRevision: entries[index].goalRevision,
        state: records[index].state,
        originSeed: records[index].originSeed,
        originMoves: records[index].originMoves,
      ),
  ]);
}
