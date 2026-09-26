import 'dart:convert';

import 'package:ludo/src/net/ludo_http.dart';

/// Test-only [LudoHttpTransport]: never touches the network, keyed by
/// `"METHOD /path"` against `games/ludo/debug/` and `api/` stripped off
/// (mirrors `merge_relay`'s `FixtureTransport`/`mergeRelayRequestKey`
/// pattern in `apps-native/games/merge_relay/test/
/// merge_relay_network_test_support.dart`).
final class FixtureLudoTransport implements LudoHttpTransport {
  FixtureLudoTransport(this.responses);

  final Map<String, LudoHttpResponse> responses;
  final requests = <(String key, Object? body)>[];

  @override
  Future<LudoHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    required Object? body,
    required Duration timeout,
    required int maxRequestBytes,
    required int maxResponseBytes,
  }) async {
    final key = ludoRequestKey(method, uri);
    requests.add((key, body));
    final response = responses[key];
    if (response == null) throw StateError('No fixture for $key');
    return response;
  }
}

/// A transport that replays a queue of responses per key, for tests that
/// need to see a first (e.g. 401) response then a second (retry) one.
final class QueueLudoTransport implements LudoHttpTransport {
  QueueLudoTransport(this.responses);

  final Map<String, List<LudoHttpResponse>> responses;
  final requests = <(String key, Object? body, String? bearer)>[];

  @override
  Future<LudoHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    required Object? body,
    required Duration timeout,
    required int maxRequestBytes,
    required int maxResponseBytes,
  }) async {
    final key = ludoRequestKey(method, uri);
    requests.add((key, body, headers['Authorization']));
    final queue = responses[key];
    if (queue == null || queue.isEmpty) throw StateError('No fixture for $key');
    return queue.removeAt(0);
  }
}

String ludoRequestKey(String method, Uri uri) {
  const gamePrefix = '/games/ludo/debug/';
  var path = uri.path;
  if (path.startsWith(gamePrefix)) path = path.substring(gamePrefix.length);
  if (path.startsWith('/')) path = path.substring(1);
  return '$method $path';
}

LudoHttpResponse jsonResponse(Object? body, {int statusCode = 200}) =>
    LudoHttpResponse(statusCode: statusCode, body: jsonEncode(body));

Map<String, Object?> ludoFixtureError(String code, {int statusCode = 400}) => {
  'contract_version': 'ludo.v1',
  'error': {
    'code': code,
    'message': 'fixture error',
    'diagnostic_id': 'fixture',
  },
};
