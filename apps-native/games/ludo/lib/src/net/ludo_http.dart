/// Low-level HTTP transport for the Ludo gateway (task 24).
///
/// Deliberately mirrors `merge_relay`'s `DartIoMergeRelayHttpTransport`
/// pattern (`apps-native/games/merge_relay/lib/src/network/
/// merge_relay_http.dart`): a small `dart:io`-based transport behind an
/// interface, so tests inject a fake transport and never touch the
/// network. No `package:http` dependency is needed.
library;

import 'dart:async';
import 'dart:convert';
import 'dart:io';

/// A single HTTP request/response transport, swappable in tests.
abstract interface class LudoHttpTransport {
  Future<LudoHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    required Object? body,
    required Duration timeout,
    required int maxRequestBytes,
    required int maxResponseBytes,
  });
}

/// A decoded HTTP response: status code, raw body, and lower-cased headers.
final class LudoHttpResponse {
  const LudoHttpResponse({
    required this.statusCode,
    required this.body,
    this.headers = const {},
  });

  final int statusCode;
  final String body;
  final Map<String, String> headers;
}

/// Thrown for transport-level failures (timeout, connection refused, body
/// too large) — never for a well-formed HTTP error response, which the
/// gateway decodes into a [LudoApiException] instead.
final class LudoTransportException implements Exception {
  const LudoTransportException(this.message);

  final String message;

  @override
  String toString() => 'LudoTransportException: $message';
}

/// Production [LudoHttpTransport] backed by `dart:io`'s [HttpClient].
final class DartIoLudoHttpTransport implements LudoHttpTransport {
  DartIoLudoHttpTransport({HttpClient? client})
    : _client = client ?? HttpClient();

  final HttpClient _client;

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
    final encodedBody = body == null ? null : utf8.encode(jsonEncode(body));
    if (encodedBody != null && encodedBody.length > maxRequestBytes) {
      throw const LudoTransportException('Request body is too large');
    }
    Future<LudoHttpResponse> operation() async {
      try {
        final request = await _client.openUrl(method, uri).timeout(timeout);
        request.followRedirects = false;
        headers.forEach(request.headers.set);
        if (encodedBody != null) {
          request.contentLength = encodedBody.length;
          request.add(encodedBody);
        }
        final response = await request.close().timeout(timeout);
        final bytes = <int>[];
        await for (final chunk in response.timeout(timeout)) {
          bytes.addAll(chunk);
          if (bytes.length > maxResponseBytes) {
            throw const LudoTransportException('Response body is too large');
          }
        }
        final responseHeaders = <String, String>{};
        response.headers.forEach((name, values) {
          responseHeaders[name.toLowerCase()] = values.join(',');
        });
        return LudoHttpResponse(
          statusCode: response.statusCode,
          body: utf8.decode(bytes),
          headers: responseHeaders,
        );
      } on LudoTransportException {
        rethrow;
      } on TimeoutException {
        throw const LudoTransportException('Request timed out');
      } on Object catch (error) {
        throw LudoTransportException('Request failed: $error');
      }
    }

    return operation().timeout(
      timeout,
      onTimeout: () => throw const LudoTransportException('Request timed out'),
    );
  }

  void close() => _client.close(force: true);
}

/// Static per-environment gateway configuration (base URL, timeouts, byte
/// caps). Mirrors `MergeRelayNetworkConfig`.
final class LudoNetworkConfig {
  LudoNetworkConfig({
    required Uri apiBaseUri,
    required this.environment,
    this.timeout = const Duration(seconds: 10),
    this.maxRequestBytes = 32 * 1024,
    this.maxResponseBytes = 128 * 1024,
    this.allowInsecureLocalDebug = false,
  }) : apiBaseUri = _normalizeBaseUri(apiBaseUri) {
    if (!{'debug', 'staging', 'production'}.contains(environment)) {
      throw ArgumentError.value(environment, 'environment');
    }
    if (timeout <= Duration.zero || timeout > const Duration(seconds: 30)) {
      throw ArgumentError.value(timeout, 'timeout');
    }
    if (maxRequestBytes < 1024 || maxRequestBytes > 256 * 1024) {
      throw ArgumentError.value(maxRequestBytes, 'maxRequestBytes');
    }
    if (maxResponseBytes < 1024 || maxResponseBytes > 1024 * 1024) {
      throw ArgumentError.value(maxResponseBytes, 'maxResponseBytes');
    }
    final insecure = this.apiBaseUri.scheme == 'http';
    if (insecure &&
        !(allowInsecureLocalDebug &&
            environment == 'debug' &&
            _isLocalHost(this.apiBaseUri.host))) {
      throw ArgumentError.value(apiBaseUri, 'apiBaseUri');
    }
    if (this.apiBaseUri.scheme != 'https' && !insecure) {
      throw ArgumentError.value(apiBaseUri, 'apiBaseUri');
    }
  }

  final Uri apiBaseUri;
  final String environment;
  final Duration timeout;
  final int maxRequestBytes;
  final int maxResponseBytes;
  final bool allowInsecureLocalDebug;

  /// Resolves a path relative to the API base, e.g. `endpoint('api/auth/exchange')`
  /// or, via [gameEndpoint], `games/ludo/<environment>/<suffix>`.
  Uri endpoint(String path) => apiBaseUri.resolve(path);

  /// Resolves `games/ludo/<environment>/<suffix>`, matching
  /// `packages/api/src/games/ludo/routes.ts`'s mount path.
  Uri gameEndpoint(String suffix) =>
      apiBaseUri.resolve('games/ludo/$environment/$suffix');
}

Uri _normalizeBaseUri(Uri value) {
  if (value.userInfo.isNotEmpty ||
      value.query.isNotEmpty ||
      value.fragment.isNotEmpty) {
    throw ArgumentError.value(value, 'apiBaseUri');
  }
  final path = value.path.endsWith('/') ? value.path : '${value.path}/';
  return value.replace(path: path);
}

bool _isLocalHost(String host) =>
    host == 'localhost' || host == '127.0.0.1' || host == '::1';
