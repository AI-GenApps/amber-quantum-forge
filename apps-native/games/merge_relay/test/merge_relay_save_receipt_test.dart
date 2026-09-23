import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/network/merge_relay_parsers_receipts.dart';

import 'merge_relay_network_test_support.dart';

Map<String, Object?> _fixture(String name) {
  final values = jsonDecode(
    File('test/fixtures/save_fingerprint_vectors.json').readAsStringSync(),
  ) as List;
  return (values.firstWhere((value) => value['name'] == name) as Map)
      .cast<String, Object?>();
}

void main() {
  test('matches TypeScript canonical fingerprint fixtures', () {
    for (final name in [
      'nested-unicode-null-bool',
      'numeric-boundaries',
      'unicode-key-order',
      'empty-and-negative',
      'boundary-lower-exponent',
      'boundary-lower-fixed',
      'boundary-lower-near-exponent',
      'boundary-lower-near-fixed',
      'safe-integral-double',
      'subnormal-minimum',
      'subnormal-next',
      'negative-zero',
    ]) {
      final fixture = _fixture(name);
      final payload = (fixture['payload'] as Map).cast<String, Object?>();
      if (name == 'numeric-boundaries') {
        payload['negativeZero'] = -0.0;
        payload['integralFloat'] = 1.0;
      }
      if (name == 'safe-integral-double') {
        payload['value'] = 9007199254740991.0;
      }
      if (name == 'negative-zero') {
        payload['value'] = -0.0;
      }
      final value = {
        'schemaVersion': fixture['schema_version'],
        'payload': payload,
      };
      expect(mergeRelayCanonicalJson(value), fixture['canonical']);
      expect(
        mergeRelaySavePayloadFingerprint(
          schemaVersion: fixture['schema_version']! as int,
          payload: payload,
        ),
        fixture['fingerprint'],
      );
    }
  });

  test('rejects unsupported canonical numbers', () {
    expect(
      () => mergeRelayCanonicalJson({'value': 9007199254740992}),
      throwsA(isA<FormatException>()),
    );
    expect(
      () => mergeRelayCanonicalJson({'value': 9007199254740992.0}),
      throwsA(isA<FormatException>()),
    );
    expect(
      () => mergeRelayCanonicalJson({'value': double.infinity}),
      throwsA(isA<FormatException>()),
    );
    for (final name in [
      'boundary-upper-fixed-rejected',
      'boundary-upper-exponent-rejected',
      'unsafe-integral-rejected',
    ]) {
      final fixture = _fixture(name);
      final payload = (fixture['payload'] as Map).cast<String, Object?>();
      expect(
        () => mergeRelaySavePayloadFingerprint(
          schemaVersion: fixture['schema_version']! as int,
          payload: payload,
        ),
        throwsA(isA<FormatException>()),
      );
    }
  });

  test('parses and correlates a typed save receipt', () {
    final receipt = parseSaveWriteReceipt(
      {
        'save_id': 'main',
        'client_write_id': 'write-1',
        'payload_fingerprint': 'a' * 64,
        'saved_version': 4,
        'event_id': 'evt_1',
        'replayed': false,
      },
      expectedSaveId: 'main',
      expectedClientWriteId: 'write-1',
      expectedPayloadFingerprint: 'a' * 64,
      expectedSavedVersion: 4,
    );
    expect(receipt?.saveId, 'main');
    expect(receipt?.clientWriteId, 'write-1');
    expect(receipt?.savedVersion, 4);
    expect(receipt?.replayed, isFalse);
  });

  test('rejects a receipt with missing or mismatched correlation', () {
    final base = {
      'client_write_id': 'write-1',
      'payload_fingerprint': 'a' * 64,
      'saved_version': 4,
      'event_id': 'evt_1',
      'replayed': false,
    };
    expect(
      () => parseSaveWriteReceipt(
        base,
        expectedSaveId: 'main',
        expectedClientWriteId: 'write-1',
        expectedPayloadFingerprint: 'a' * 64,
        expectedSavedVersion: 4,
      ),
      throwsA(isA<MergeRelayProtocolException>()),
    );
    expect(
      () => parseSaveWriteReceipt(
        {...base, 'save_id': 'other'},
        expectedSaveId: 'main',
        expectedClientWriteId: 'write-1',
        expectedPayloadFingerprint: 'a' * 64,
        expectedSavedVersion: 4,
      ),
      throwsA(isA<MergeRelayProtocolException>()),
    );
    expect(
      () => parseSaveWriteReceipt(
        {...base, 'save_id': 'main', 'replayed': 'false'},
        expectedSaveId: 'main',
        expectedClientWriteId: 'write-1',
        expectedPayloadFingerprint: 'a' * 64,
        expectedSavedVersion: 4,
      ),
      throwsA(isA<MergeRelayProtocolException>()),
    );
  });

  test('accepts the legacy manual-save null receipt shape', () {
    expect(
      parseSaveWriteReceipt(
        {
          'client_write_id': null,
          'payload_fingerprint': null,
          'saved_version': null,
          'event_id': null,
          'replayed': false,
        },
        expectedSaveId: 'main',
        expectedClientWriteId: null,
        expectedPayloadFingerprint: 'a' * 64,
        expectedSavedVersion: 1,
      ),
      isNull,
    );
  });

  test('writes client ID and verifies the full receipt over HTTP', () async {
    final payload = <String, Object?>{'score': 1.5, 'note': 'é'};
    final fingerprint = mergeRelaySavePayloadFingerprint(
      schemaVersion: 1,
      payload: payload,
    );
    final transport = FixtureTransport({
      'PUT saves/main': fixtureResponse({
        'contract_version': mergeRelayContractVersion,
        'data': {
          'save': {
            'save_id': 'main',
            'schema_version': 1,
            'version': 1,
            'payload': payload,
            'payload_fingerprint': fingerprint,
            'updated_at': '2026-09-18T00:00:00.000Z',
          },
          'write_receipt': {
            'save_id': 'main',
            'client_write_id': 'write-1',
            'payload_fingerprint': fingerprint,
            'saved_version': 1,
            'event_id': 'evt_1',
            'replayed': false,
          },
        },
      }),
    });
    final gateway = MergeRelayHttpGateway(
      config: MergeRelayNetworkConfig(
        apiBaseUri: Uri.parse('https://relay.example/api/'),
        environment: 'debug',
      ),
      transport: transport,
      authStore: MemoryMergeRelayAuthStore()..accessToken = 'token',
    );
    final result = await gateway.putSaveWithReceipt(
      'main',
      MergeRelaySaveRequest(
        expectedVersion: 0,
        schemaVersion: 1,
        payload: payload,
        clientWriteId: 'write-1',
      ),
    );
    expect(result.save.version, 1);
    expect(result.receipt?.payloadFingerprint, fingerprint);
    expect(result.replayed, isFalse);
    final body = transport.requests.single.body as Map;
    expect(body['client_write_id'], 'write-1');
    final legacy = await gateway.putSave(
      'main',
      MergeRelaySaveRequest(
        expectedVersion: 0,
        schemaVersion: 1,
        payload: payload,
      ),
    );
    expect(legacy.version, 1);
  });

  test('rejects a non-null receipt that omits save ID correlation', () async {
    final payload = <String, Object?>{'score': 1};
    final fingerprint = mergeRelaySavePayloadFingerprint(
      schemaVersion: 1,
      payload: payload,
    );
    final transport = FixtureTransport({
      'PUT saves/main': fixtureResponse({
        'contract_version': mergeRelayContractVersion,
        'data': {
          'save': {
            'save_id': 'main',
            'schema_version': 1,
            'version': 1,
            'payload': payload,
            'payload_fingerprint': fingerprint,
            'updated_at': '2026-09-18T00:00:00.000Z',
          },
          'write_receipt': {
            'client_write_id': 'write-1',
            'payload_fingerprint': fingerprint,
            'saved_version': 1,
            'event_id': 'evt_1',
            'replayed': false,
          },
        },
      }),
    });
    final gateway = MergeRelayHttpGateway(
      config: MergeRelayNetworkConfig(
        apiBaseUri: Uri.parse('https://relay.example/api/'),
        environment: 'debug',
      ),
      transport: transport,
      authStore: MemoryMergeRelayAuthStore()..accessToken = 'token',
    );
    await expectLater(
      gateway.putSaveWithReceipt(
        'main',
        MergeRelaySaveRequest(
          expectedVersion: 0,
          schemaVersion: 1,
          payload: payload,
          clientWriteId: 'write-1',
        ),
      ),
      throwsA(isA<MergeRelayProtocolException>()),
    );
  });
}
