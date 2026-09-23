import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_content.dart';
import 'package:merge_relay/src/merge_relay_content_validation.dart';
import 'package:merge_rules/merge_rules.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('bundled rescue content loads from the app asset', () async {
    final catalog = await MergeRelayContentCatalog.load();

    expect(catalog.rescues, hasLength(5));
    expect(catalog.firstRescue.id, 'rescue-signal');
    expect(
      catalog.rescues.map((rescue) => rescue.id),
      containsAllInOrder([
        'rescue-signal',
        'rescue-echo',
        'rescue-crossing',
        'rescue-coral',
        'rescue-late',
      ]),
    );
    for (final rescue in catalog.rescues) {
      expect(rescue.state.board.hasLegalMove, isTrue);
      expect(rescue.state.moveCount, rescue.originMoves.length);
      expect(rescue.state.seed, rescue.originSeed);
      expect(
        validateMergeRelayGoal(
          state: rescue.state,
          targetScore: rescue.targetScore,
        ).reachable,
        isTrue,
      );
      expect(rescue.targetScore, greaterThan(rescue.state.score));
    }
  });

  test('content loader reports missing and malformed assets', () async {
    expect(
      () => MergeRelayContentCatalog.load(
        readAsset: () async => '{"content_version":"MR-CONTENT-1"}',
      ),
      throwsA(isA<MergeRelayContentLoadException>()),
    );
    expect(
      () => MergeRelayContentCatalog.load(readAsset: () async => '{'),
      throwsA(isA<MergeRelayContentLoadException>()),
    );
  });

  test('authored rescue catalog contains varied playable boards', () {
    final catalog = MergeRelayContentCatalog.fallback;
    final ids = catalog.rescues.map((rescue) => rescue.id).toSet();

    expect(catalog.rescues, hasLength(5));
    expect(ids, hasLength(catalog.rescues.length));
    for (final rescue in catalog.rescues) {
      expect(rescue.state.board.cells, hasLength(16));
      expect(rescue.state.board.hasLegalMove, isTrue);
      expect(rescue.originMoves, isNotEmpty);
      expect(rescue.state.moveCount, rescue.originMoves.length);
      expect(
        rescue.state.board.cells.every(
          (value) => value == 0 || (value & (value - 1)) == 0,
        ),
        isTrue,
      );
      expect(
        validateMergeRelayGoal(
          state: rescue.state,
          targetScore: rescue.targetScore,
        ).reachable,
        isTrue,
      );
    }
  });

  test('content parser rejects malformed rescue records', () {
    expect(
      () => MergeRelayContentCatalog.fromJson(
        _contentEnvelope([
          {'id': 'broken', 'title': 'Broken', 'subtitle': 'Missing board'},
        ]),
      ),
      throwsFormatException,
    );
  });

  test('content parser rejects terminal rescue records', () {
    final record = const MergeRescueGenerator().generate(
      const MergeRescueGenerationSpec(id: 'terminal', originSeed: 77),
    );
    final terminal = record.toJson()
      ..['board'] = [
        2,
        4,
        8,
        16,
        32,
        64,
        128,
        256,
        512,
        1024,
        2048,
        4096,
        8192,
        16384,
        32768,
        65536,
      ];
    expect(
      () => MergeRelayContentCatalog.fromJson(
        _contentEnvelope([
          {...terminal, 'title': 'Terminal', 'subtitle': 'No path'},
        ]),
      ),
      throwsFormatException,
    );
  });

  test('content parser rejects a checkpoint with a false origin trace', () {
    final record = const MergeRescueGenerator().generate(
      const MergeRescueGenerationSpec(id: 'mismatch', originSeed: 101),
    );
    expect(
      () => MergeRelayContentCatalog.fromJson(
        _contentEnvelope([
          {
            'title': 'Mismatch',
            'subtitle': 'A trace that does not reach this board.',
            ...record.toJson(),
            'origin_seed': 202,
          },
        ]),
      ),
      throwsFormatException,
    );
  });

  test('content parser preserves authored rescue metadata and state', () {
    final record = const MergeRescueGenerator().generate(
      const MergeRescueGenerationSpec(id: 'rescue-test', originSeed: 101),
    );
    final catalog = MergeRelayContentCatalog.fromJson(
      _contentEnvelope([
        {
          'title': 'Test lane',
          'subtitle': 'Bring two tiles together.',
          ...record.toJson(),
        },
      ]),
    );

    expect(catalog.firstRescue.id, 'rescue-test');
    expect(catalog.firstRescue.title, 'Test lane');
    expect(catalog.firstRescue.originMoves, record.originMoves);
    expect(catalog.firstRescue.state.toJson(), record.state.toJson());
  });

  test('content parser requires the canonical envelope', () {
    final record = const MergeRescueGenerator().generate(
      const MergeRescueGenerationSpec(id: 'envelope', originSeed: 303),
    );
    final envelope = _contentEnvelope([record.toJson()]);
    envelope['schema_version'] = 2;

    expect(
      () => MergeRelayContentCatalog.fromJson(envelope),
      throwsFormatException,
    );
  });
}

Map<String, Object?> _contentEnvelope(List<Object?> records) => {
  'content_version': mergeRelayContentVersion,
  'rule_version': mergeRuleVersion,
  'schema_version': mergeRelayContentSchemaVersion,
  'rule_config': const MergeRuleConfig.legacy().toJson(),
  'generator': {'algorithm': mergeRescueTraceAlgorithm},
  'rescue_boards': records,
};
