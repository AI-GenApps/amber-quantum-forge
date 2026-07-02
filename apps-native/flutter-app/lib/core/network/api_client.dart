import 'dart:convert';

import 'package:http/http.dart' as http;

/// Callback that returns the current bearer token, or `null` if
/// unauthenticated. Defined here (rather than importing `starter_auth`
/// directly) to avoid a hard dependency cycle between the app's core
/// network layer and the auth feature package — `starter_auth` supplies
/// an implementation of this typedef when the app wires things up.
typedef TokenProvider = Future<String?> Function();

/// Describes a single API request. Dart analog of `Endpoint` in
/// `apps-native/ios-app/Starter/Core/Network/APIClient.swift`.
class Endpoint {
  const Endpoint({
    required this.path,
    this.method = 'GET',
    this.body,
    this.requiresAuth = true,
  });

  final String path;
  final String method;
  final Map<String, dynamic>? body;
  final bool requiresAuth;
}

/// Thrown when the API returns a non-2xx response.
class ApiException implements Exception {
  ApiException(this.statusCode, this.message);

  final int statusCode;
  final String message;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Generic JSON client over `package:http`. Dart analog of `APIClient`
/// in `APIClient.swift`, extended with an auth header hook since the
/// Flutter app needs `Authorization: Bearer <token>` on mobile requests
/// (see docs-internal/architecture/auth.md).
class ApiClient {
  ApiClient({
    required this.baseUrl,
    http.Client? httpClient,
    TokenProvider? tokenProvider,
  })  : _httpClient = httpClient ?? http.Client(),
        _tokenProvider = tokenProvider;

  final String baseUrl;
  final http.Client _httpClient;
  final TokenProvider? _tokenProvider;

  Future<T> request<T>(
    Endpoint endpoint, {
    required T Function(dynamic json) decode,
  }) async {
    final uri = Uri.parse(baseUrl).resolve(endpoint.path);
    final headers = <String, String>{'Content-Type': 'application/json'};

    if (endpoint.requiresAuth && _tokenProvider != null) {
      final token = await _tokenProvider();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    final encodedBody = endpoint.body != null ? jsonEncode(endpoint.body) : null;

    final response = await _httpClient.request(
      endpoint.method,
      uri,
      headers: headers,
      body: encodedBody,
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(response.statusCode, response.body);
    }

    if (response.body.isEmpty) {
      return decode(null);
    }
    return decode(jsonDecode(response.body));
  }

  void close() => _httpClient.close();
}

extension on http.Client {
  Future<http.Response> request(
    String method,
    Uri uri, {
    Map<String, String>? headers,
    String? body,
  }) {
    switch (method.toUpperCase()) {
      case 'POST':
        return post(uri, headers: headers, body: body);
      case 'PUT':
        return put(uri, headers: headers, body: body);
      case 'PATCH':
        return patch(uri, headers: headers, body: body);
      case 'DELETE':
        return delete(uri, headers: headers, body: body);
      default:
        return get(uri, headers: headers);
    }
  }
}
