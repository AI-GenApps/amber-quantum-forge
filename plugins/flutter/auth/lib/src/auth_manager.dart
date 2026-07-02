import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'auth_error.dart';
import 'auth_provider.dart';
import 'models/auth_token.dart';
import 'models/exchange_response.dart';
import 'storage/token_storage.dart';

/// Drives the two-stage Firebase -> API JWT auth flow described in
/// `docs/architecture/auth.md`. Mirrors the Swift `actor AuthManager`:
/// - `signIn`: Firebase sign-in -> `POST /api/auth/exchange`
/// - `authorizedFetch`/`request`: attaches the bearer token, retries once on
///   401 via a single-flight `POST /api/auth/refresh`
/// - `signOut`: `POST /api/auth/revoke` + clears secure storage
///
/// This is a process-wide singleton, matching `AuthManager.shared`.
class AuthManager {
  AuthManager._internal({TokenStorage? storage, http.Client? httpClient})
    : _storage = storage ?? TokenStorage(),
      _client = httpClient ?? http.Client();

  static final AuthManager instance = AuthManager._internal();

  /// Test-only factory that bypasses the singleton for unit tests.
  factory AuthManager.forTesting({
    required TokenStorage storage,
    required http.Client httpClient,
  }) => AuthManager._internal(storage: storage, httpClient: httpClient);

  final TokenStorage _storage;
  final http.Client _client;

  Uri? _baseUrl;
  AuthToken? _currentToken;
  Future<AuthToken>? _refreshFuture;

  /// Configures the API base URL. Must be called before any other method.
  void configure({required Uri baseUrl}) {
    _baseUrl = baseUrl;
  }

  /// Restores a persisted session (call once at app startup).
  Future<AuthToken?> restoreSession() async {
    _currentToken = await _storage.load();
    return _currentToken;
  }

  /// The current access token, if signed in.
  String? get accessToken => _currentToken?.accessToken;

  bool get isSignedIn => _currentToken != null;

  Future<AuthToken> signInWithGoogle(AuthProvider provider) => signIn(provider);

  Future<AuthToken> signInWithApple(AuthProvider provider) => signIn(provider);

  /// Generic sign-in entry point: runs [provider]'s platform flow, then
  /// exchanges the resulting Firebase ID token for API tokens.
  Future<AuthToken> signIn(AuthProvider provider) async {
    final idToken = await provider.signIn();
    final token = await _exchange(idToken: idToken);
    await _storage.save(token);
    _currentToken = token;
    return token;
  }

  Future<String> currentAccessToken() async {
    final token = _currentToken;
    if (token == null) throw const NotSignedIn();
    return token.accessToken;
  }

  /// Performs an authenticated HTTP request, attaching the bearer token and
  /// retrying once (with a fresh token) if the server responds 401.
  Future<http.Response> authorizedFetch(
    Uri url, {
    String method = 'GET',
    Map<String, String>? headers,
    Object? body,
  }) async {
    final token = _currentToken;
    if (token == null) throw const NotSignedIn();

    Future<http.Response> send(String accessToken) {
      final request = http.Request(method, url);
      request.headers.addAll(headers ?? {});
      request.headers['Authorization'] = 'Bearer $accessToken';
      if (body != null) {
        request.headers['Content-Type'] = 'application/json';
        request.body = body is String ? body : jsonEncode(body);
      }
      return http.Response.fromStream(
        _client.send(request).timeout(const Duration(seconds: 30)),
      );
    }

    final response = await send(token.accessToken);
    if (response.statusCode == 401) {
      final refreshed = await _refreshIfNeeded();
      return send(refreshed.accessToken);
    }
    return response;
  }

  Future<void> signOut() async {
    final baseUrl = _baseUrl;
    final token = _currentToken;
    if (baseUrl != null && token != null) {
      try {
        await _client
            .post(
              baseUrl.resolve('/api/auth/revoke'),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ${token.accessToken}',
              },
              body: jsonEncode({'refreshToken': token.refreshToken}),
            )
            .timeout(const Duration(seconds: 10));
      } catch (_) {
        // Best-effort, mirrors Swift's `try?`.
      }
    }
    await _storage.delete();
    _currentToken = null;
  }

  /// Single-flight refresh guard: concurrent 401s share one in-flight
  /// refresh `Future`, mirroring the Swift `refreshTask` actor guard.
  Future<AuthToken> _refreshIfNeeded() {
    final existing = _refreshFuture;
    if (existing != null) return existing;

    final future = _refresh();
    _refreshFuture = future;
    future.whenComplete(() => _refreshFuture = null);
    return future;
  }

  Future<AuthToken> _refresh() async {
    final baseUrl = _baseUrl;
    final current = _currentToken;
    if (baseUrl == null || current == null) throw const TokenExpired();

    final response = await _client
        .post(
          baseUrl.resolve('/api/auth/refresh'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'refreshToken': current.refreshToken}),
        )
        .timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) throw const TokenExpired();

    final decoded = ExchangeResponse.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
    final token = AuthToken(
      accessToken: decoded.accessToken,
      refreshToken: decoded.refreshToken,
      expiresAt: DateTime.now().add(Duration(seconds: decoded.expiresIn)),
    );
    await _storage.save(token);
    _currentToken = token;
    return token;
  }

  Future<AuthToken> _exchange({required String idToken}) async {
    final baseUrl = _baseUrl;
    if (baseUrl == null) throw const InvalidAuthResponse();

    final response = await _client
        .post(
          baseUrl.resolve('/api/auth/exchange'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'idToken': idToken}),
        )
        .timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) throw const InvalidAuthResponse();

    final decoded = ExchangeResponse.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
    return AuthToken(
      accessToken: decoded.accessToken,
      refreshToken: decoded.refreshToken,
      expiresAt: DateTime.now().add(Duration(seconds: decoded.expiresIn)),
    );
  }
}
