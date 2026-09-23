import 'dart:convert';
import 'dart:io';

import 'package:merge_relay/src/merge_relay_gateway.dart';

Map<String, Object?> loadMergeRelayFixture() => (jsonDecode(
  File('test/fixtures/merge_relay_route_fixture.json').readAsStringSync(),
) as Map).map<String, Object?>((key, value) => MapEntry(key.toString(), value));

MergeRelayHttpResponse fixtureResponse(Object? body, {int statusCode = 200}) =>
    MergeRelayHttpResponse(statusCode: statusCode, body: jsonEncode(body));

Map<String, Object?> fixtureError(String code) => {
  'contract_version': mergeRelayContractVersion,
  'error': {
    'code': code,
    'message': 'fixture error',
    'diagnostic_id': 'fixture',
  },
};

final class FixtureRequest {
  const FixtureRequest(this.key, this.body);

  final String key;
  final Object? body;
}

final class FixtureTransport implements MergeRelayHttpTransport {
  FixtureTransport(this.responses);

  final Map<String, MergeRelayHttpResponse> responses;
  final requests = <FixtureRequest>[];

  @override
  Future<MergeRelayHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    required Object? body,
    required Duration timeout,
    required int maxRequestBytes,
    required int maxResponseBytes,
  }) async {
    final key = mergeRelayRequestKey(method, uri);
    requests.add(FixtureRequest(key, body));
    var response = responses[key];
    if (response == null) {
      for (final entry in responses.entries) {
        if (key.startsWith(entry.key)) {
          response = entry.value;
          break;
        }
      }
    }
    if (response == null) throw StateError('No fixture for $key');
    return response;
  }
}

final class QueueTransport implements MergeRelayHttpTransport {
  QueueTransport(this.responses);

  final Map<String, List<MergeRelayHttpResponse>> responses;
  final requests = <FixtureRequest>[];

  @override
  Future<MergeRelayHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    required Object? body,
    required Duration timeout,
    required int maxRequestBytes,
    required int maxResponseBytes,
  }) async {
    final key = mergeRelayRequestKey(method, uri);
    requests.add(FixtureRequest(key, body));
    final queue = responses[key];
    if (queue == null || queue.isEmpty) throw StateError('No fixture for $key');
    return queue.removeAt(0);
  }
}

String mergeRelayRequestKey(String method, Uri uri) {
  const prefix = '/api/games/merge_relay/debug/';
  final path = uri.path.startsWith(prefix)
      ? uri.path.substring(prefix.length)
      : uri.path;
  return '$method $path';
}
