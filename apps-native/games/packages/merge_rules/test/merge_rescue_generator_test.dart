import 'package:merge_rules/merge_rules.dart';
import 'package:test/test.dart';

void main() {
  const specs = [
    MergeRescueGenerationSpec(
      id: 'rescue-a',
      originSeed: 101,
      originMoveCount: 3,
    ),
    MergeRescueGenerationSpec(
      id: 'rescue-b',
      originSeed: 202,
      originMoveCount: 5,
    ),
    MergeRescueGenerationSpec(
      id: 'rescue-c',
      originSeed: 303,
      originMoveCount: 1,
    ),
  ];

  test('generated records are deterministic and varied', () {
    const generator = MergeRescueGenerator();
    final first = generator.generateCatalog(specs);
    final second = generator.generateCatalog(specs);

    expect(
      first.map((record) => canonicalJson(record.toJson())),
      second.map((record) => canonicalJson(record.toJson())),
    );
    final report = validateCatalog(first);
    expect(report.recordCount, 3);
    expect(report.uniqueBoardCount, greaterThan(1));
    expect(report.uniqueOriginSeedCount, 3);
    expect(report.originMoveCounts, {1, 3, 5});
    for (final record in first) {
      expect(record.state.isTerminal, isFalse);
      expect(record.provenance.source, 'deterministic_play_trace');
      expect(record.provenance.algorithm, mergeRescueTraceAlgorithm);
      expect(record.difficulty.originMoveCount, record.originMoves.length);
    }
  });

  test('generated records round trip through the strict wire contract', () {
    const generator = MergeRescueGenerator();
    final record = generator.generate(specs.first);
    final restored = MergeRescueTraceRecord.fromJson(record.toJson());

    expect(restored.toJson(), record.toJson());
    expect(validateCatalog([restored]).hasBoardVariation, isFalse);
  });

  test('validator rejects tampered checkpoint and origin trace', () {
    const generator = MergeRescueGenerator();
    final record = generator.generate(specs.first);
    final changedScore = {
      ...record.toJson(),
      'score': (record.state.score + 4),
    };
    final changedMove = {
      ...record.toJson(),
      'origin_moves': ['up'],
    };

    expect(
      () => validateCatalog([MergeRescueTraceRecord.fromJson(changedScore)]),
      throwsA(isA<MergeRescueValidationError>()),
    );
    expect(
      () => validateCatalog([MergeRescueTraceRecord.fromJson(changedMove)]),
      throwsA(isA<MergeRescueValidationError>()),
    );
  });

  test('validator rejects duplicate IDs and stale difficulty facts', () {
    const generator = MergeRescueGenerator();
    final record = generator.generate(specs.first);
    final duplicate = MergeRescueTraceRecord.fromJson(record.toJson());
    final changedDifficulty = {
      ...record.toJson(),
      'difficulty': {
        ...record.difficulty.toJson(),
        'best_score_delta': record.difficulty.bestScoreDelta + 1,
      },
    };

    expect(
      () => validateCatalog([record, duplicate]),
      throwsA(isA<MergeRescueValidationError>()),
    );
    expect(
      () =>
          validateCatalog([MergeRescueTraceRecord.fromJson(changedDifficulty)]),
      throwsA(isA<MergeRescueValidationError>()),
    );
  });

  test('custom spawn configuration is included in provenance', () {
    final config = MergeRuleConfig(
      revision: 2,
      spawnWeights: MergeSpawnWeights(spawnTwoWeight: 80, spawnFourWeight: 20),
    );
    final generator = MergeRescueGenerator(config: config);
    final record = generator.generate(specs.first);

    expect(record.provenance.configRevision, 2);
    expect(record.provenance.spawnWeights.spawnTwoWeight, 80);
    expect(
      validateCatalog([record], rules: MergeRules(config: config)).recordCount,
      1,
    );
    expect(
      () => validateCatalog([record]),
      throwsA(isA<MergeRescueValidationError>()),
    );
  });
}
