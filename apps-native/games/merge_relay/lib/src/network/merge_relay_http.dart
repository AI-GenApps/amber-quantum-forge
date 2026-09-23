import 'dart:async';
import 'dart:convert';
import 'dart:io';

abstract interface class MergeRelayHttpTransport {
  Future<MergeRelayHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    required Object? body,
    required Duration timeout,
    required int maxRequestBytes,
    required int maxResponseBytes,
  });
}

final class MergeRelayHttpResponse {
  const MergeRelayHttpResponse({
    required this.statusCode,
    required this.body,
    this.headers = const {},
  });

  final int statusCode;
  final String body;
  final Map<String, String> headers;
}

final class MergeRelayTransportException implements Exception {
  const MergeRelayTransportException(this.message);

  final String message;

  @override
  String toString() => 'MergeRelayTransportException: $message';
}

final class DartIoMergeRelayHttpTransport implements MergeRelayHttpTransport {
  DartIoMergeRelayHttpTransport({HttpClient? client})
    : _client = client ?? HttpClient();

  final HttpClient _client;

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
    final encodedBody = body == null ? null : utf8.encode(jsonEncode(body));
    if (encodedBody != null && encodedBody.length > maxRequestBytes) {
      throw const MergeRelayTransportException('Request body is too large');
    }
    Future<MergeRelayHttpResponse> operation() async {
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
            throw const MergeRelayTransportException(
              'Response body is too large',
            );
          }
        }
        final responseHeaders = <String, String>{};
        response.headers.forEach((name, values) {
          responseHeaders[name.toLowerCase()] = values.join(',');
        });
        return MergeRelayHttpResponse(
          statusCode: response.statusCode,
          body: utf8.decode(bytes),
          headers: responseHeaders,
        );
      } on MergeRelayTransportException {
        rethrow;
      } on TimeoutException {
        throw const MergeRelayTransportException('Request timed out');
      } on Object catch (error) {
        throw MergeRelayTransportException('Request failed: $error');
      }
    }

    return operation().timeout(
      timeout,
      onTimeout: () =>
          throw const MergeRelayTransportException('Request timed out'),
    );
  }

  void close() => _client.close(force: true);
}

final class MergeRelayNetworkConfig {
  MergeRelayNetworkConfig({
    required Uri apiBaseUri,
    required this.environment,
    this.timeout = const Duration(seconds: 10),
    this.maxRequestBytes = 32 * 1024,
    this.maxResponseBytes = 64 * 1024,
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

  Uri endpoint(String suffix) =>
      apiBaseUri.resolve('games/merge_relay/$environment/$suffix');
}

abstract interface class MergeRelayAuthStore {
  Future<String?> readAccessToken();

  Future<String?> readRecoveryToken();

  Future<void> saveGuest({required String recoveryToken, String? accessToken});

  Future<void> saveAccessToken(String? accessToken);

  Future<void> clearAccessToken();
}

final class MemoryMergeRelayAuthStore implements MergeRelayAuthStore {
  String? accessToken;
  String? recoveryToken;

  @override
  Future<String?> readAccessToken() async => accessToken;

  @override
  Future<String?> readRecoveryToken() async => recoveryToken;

  @override
  Future<void> saveGuest({
    required String recoveryToken,
    String? accessToken,
  }) async {
    this.recoveryToken = recoveryToken;
    this.accessToken = accessToken;
  }

  @override
  Future<void> saveAccessToken(String? accessToken) async {
    this.accessToken = accessToken;
  }

  @override
  Future<void> clearAccessToken() async {
    accessToken = null;
  }
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
