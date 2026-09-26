/// Guest-first Ludo identity, with optional Google linking (task 24).
///
/// Flow (matches task 23's documented sequence exactly):
/// 1. Firebase anonymous sign-in (`firebase_auth`'s `signInAnonymously`) if
///    not already signed in.
/// 2. `POST /api/auth/exchange` with the Firebase ID token -> API access
///    token.
/// 3. `POST /games/ludo/:environment/session` with the API access token
///    -> a short-lived Ludo game token (`SESSION_TOKEN_TTL_SECONDS` = 300s
///    server-side).
///
/// The game token is cached and silently refreshed (re-running step 3, or
/// steps 2-3 if the API access token itself expired) whenever a caller
/// asks for one within [_refreshMargin] of expiry. "Link Google account"
/// (task 10's settings screen) calls `linkWithCredential` on the *same*
/// Firebase user, which keeps its `uid` — no re-identification, only a
/// fresh token exchange so the new provider/email are reflected.
library;

import 'package:platform_core/platform_core.dart' show Clock, SystemClock;

import 'ludo_firebase_gateway.dart';
import 'ludo_gateway.dart';
import 'ludo_wire_json.dart';

/// Why [LudoAuthController.ensureGameToken] could not produce a token —
/// every value here is a normal, displayable state, never a bug.
enum LudoAuthFailureReason {
  /// No Firebase config present at build time (`ensureLudoFirebaseInitialized`
  /// returned `false`). The lobby's Online tiles must show "unavailable",
  /// not crash or retry forever.
  firebaseUnavailable,

  /// A network/transport error talking to the API.
  network,

  /// The server rejected the request (a decoded [LudoApiException] or
  /// [LudoProtocolException]).
  server,
}

final class LudoAuthFailure implements Exception {
  const LudoAuthFailure(this.reason, this.cause);

  final LudoAuthFailureReason reason;
  final Object cause;

  @override
  String toString() => 'LudoAuthFailure($reason, $cause)';
}

/// The controller's current, observable identity state.
final class LudoAuthState {
  const LudoAuthState({required this.uid, required this.isLinked});

  /// Stable Firebase UID — the `subject` on every Ludo game token,
  /// unchanged across Google linking per task 23.
  final String uid;

  /// Whether a non-anonymous provider (Google) has been linked.
  final bool isLinked;
}

final class LudoAuthController {
  LudoAuthController({
    required this.gateway,
    required this.firebaseAuth,
    required this.googleSignIn,
    Clock? clock,
  }) : clock = clock ?? const SystemClock();

  final LudoGateway gateway;
  final LudoFirebaseAuthGateway firebaseAuth;
  final LudoGoogleSignInGateway googleSignIn;
  final Clock clock;

  /// How long before the server-declared expiry a cached token is treated
  /// as stale, so a call never races the token's real expiry.
  static const _refreshMargin = Duration(seconds: 30);

  String? _apiAccessToken;
  String? _apiRefreshToken;
  String? _gameToken;
  DateTime? _gameTokenExpiresAt;
  LudoAuthState? _state;

  /// The current identity, once established by [ensureGameToken] or
  /// [linkGoogleAccount]. `null` before the first successful sign-in.
  LudoAuthState? get state => _state;

  bool get _gameTokenFresh =>
      _gameToken != null &&
      _gameTokenExpiresAt != null &&
      clock.now().isBefore(_gameTokenExpiresAt!.subtract(_refreshMargin));

  /// Returns a valid, unexpired Ludo game token, signing in as a guest and
  /// exchanging for one if this is the first call, or silently refreshing
  /// it if the cached one is stale. Throws [LudoAuthFailure] (never a raw
  /// plugin/HTTP exception) on any failure, tagged with a
  /// [LudoAuthFailureReason] so the UI can render "connecting" vs.
  /// "unavailable" vs. "offline" distinctly.
  Future<String> ensureGameToken() async {
    if (_gameTokenFresh) return _gameToken!;
    final firebaseUser = await _ensureFirebaseUser();
    if (_apiAccessToken == null) {
      await _exchangeAndSession(firebaseUser);
      return _gameToken!;
    }
    try {
      await _refreshSessionOnly();
      return _gameToken!;
    } on LudoApiException catch (error) {
      if (!error.isUnauthorized) {
        throw LudoAuthFailure(LudoAuthFailureReason.server, error);
      }
    }
    // The API access token itself expired; roll it forward and retry once.
    if (_apiRefreshToken != null) {
      try {
        await _refreshApiAccessToken();
        await _refreshSessionOnly();
        return _gameToken!;
      } on LudoApiException {
        // Fall through to a full re-exchange below.
      }
    }
    await _exchangeAndSession(firebaseUser);
    return _gameToken!;
  }

  /// Links a Google account onto the current (anonymous) Firebase user and
  /// re-exchanges for a fresh game token reflecting the linked identity.
  /// The user cancelling the Google picker returns normally with no state
  /// change (not a [LudoAuthFailure]).
  Future<void> linkGoogleAccount() async {
    final firebaseUser = await _ensureFirebaseUser();
    final LudoGoogleSignInResult? googleResult;
    try {
      googleResult = await googleSignIn.signIn();
    } on LudoFirebaseUnavailableException catch (error) {
      throw LudoAuthFailure(LudoAuthFailureReason.firebaseUnavailable, error);
    } on Object catch (error) {
      throw LudoAuthFailure(LudoAuthFailureReason.network, error);
    }
    if (googleResult == null) return; // user cancelled
    final linked = await firebaseUser.linkWithGoogleCredential(
      googleIdToken: googleResult.idToken,
      googleAccessToken: googleResult.accessToken,
    );
    _state = LudoAuthState(uid: linked.uid, isLinked: true);
    // Force a fresh ID token so `/exchange` observes the linked provider.
    _apiAccessToken = null;
    _apiRefreshToken = null;
    _gameToken = null;
    _gameTokenExpiresAt = null;
    await _exchangeAndSession(linked);
  }

  Future<LudoFirebaseUser> _ensureFirebaseUser() async {
    final existing = firebaseAuth.currentUser;
    if (existing != null) return existing;
    try {
      final user = await firebaseAuth.signInAnonymously();
      _state = LudoAuthState(uid: user.uid, isLinked: !user.isAnonymous);
      return user;
    } on LudoFirebaseUnavailableException catch (error) {
      throw LudoAuthFailure(LudoAuthFailureReason.firebaseUnavailable, error);
    }
  }

  Future<void> _exchangeAndSession(LudoFirebaseUser firebaseUser) async {
    final idToken = await _guardedFirebaseCall(
      () => firebaseUser.getIdToken(forceRefresh: true),
    );
    final tokens = await _guardedApiCall(
      () => gateway.exchangeFirebaseIdToken(idToken),
    );
    _apiAccessToken = tokens.accessToken;
    _apiRefreshToken = tokens.refreshToken;
    _state = LudoAuthState(
      uid: firebaseUser.uid,
      isLinked: !firebaseUser.isAnonymous,
    );
    await _refreshSessionOnly();
  }

  Future<void> _refreshSessionOnly() async {
    final session = await _guardedApiCall(
      () => gateway.exchangeSession(apiAccessToken: _apiAccessToken!),
    );
    _gameToken = session.gameToken;
    _gameTokenExpiresAt = clock.now().add(Duration(seconds: session.expiresIn));
  }

  Future<void> _refreshApiAccessToken() async {
    final tokens = await _guardedApiCall(
      () => gateway.refreshApiAccessToken(_apiRefreshToken!),
    );
    _apiAccessToken = tokens.accessToken;
    _apiRefreshToken = tokens.refreshToken;
  }

  Future<T> _guardedFirebaseCall<T>(Future<T> Function() call) async {
    try {
      return await call();
    } on LudoFirebaseUnavailableException catch (error) {
      throw LudoAuthFailure(LudoAuthFailureReason.firebaseUnavailable, error);
    }
  }

  Future<T> _guardedApiCall<T>(Future<T> Function() call) async {
    try {
      return await call();
    } on LudoApiException {
      rethrow;
    } on LudoProtocolException catch (error) {
      throw LudoAuthFailure(LudoAuthFailureReason.server, error);
    } on Object catch (error) {
      throw LudoAuthFailure(LudoAuthFailureReason.network, error);
    }
  }
}
