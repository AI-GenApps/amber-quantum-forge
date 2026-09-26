/// Guarded Firebase/Google Sign-In abstraction (task 24).
///
/// Real `firebase_auth`/`google_sign_in`/`firebase_core` types are never
/// referenced outside this file: every other Ludo source (including
/// `ludo_auth_controller.dart` and every screen) depends only on the
/// narrow interfaces declared here, so:
///
/// - Widget/unit tests inject [FakeLudoFirebaseAuthGateway] and
///   [FakeLudoGoogleSignInGateway] instead of touching real Firebase
///   plugin channels (which don't exist in a `flutter test` host process).
/// - The app boots and plays every local mode with no Firebase config
///   present at all: [ensureLudoFirebaseInitialized] catches any
///   initialization failure (missing `google-services.json`/
///   `GoogleService-Info.plist`, no Firebase project configured) and
///   returns `false` rather than throwing, and [LudoAuthController]
///   (`ludo_auth_controller.dart`) treats "Firebase unavailable" as a
///   normal, displayable state rather than a crash.
library;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb_auth;
import 'package:firebase_core/firebase_core.dart' as fb_core;
import 'package:google_sign_in/google_sign_in.dart' as google_sign_in;

/// Thrown by any [LudoFirebaseAuthGateway] method when Firebase could not
/// be initialized (no config present) — the caller's cue to show the
/// lobby's "Online unavailable" state instead of crashing.
final class LudoFirebaseUnavailableException implements Exception {
  const LudoFirebaseUnavailableException([
    this.message = 'Firebase is not configured',
  ]);

  final String message;

  @override
  String toString() => 'LudoFirebaseUnavailableException: $message';
}

/// A signed-in Firebase user, narrowed to what Ludo's auth flow needs.
abstract interface class LudoFirebaseUser {
  String get uid;

  bool get isAnonymous;

  /// Fetches (and, when [forceRefresh] is true, renews) this user's
  /// Firebase ID token, the input to `POST /api/auth/exchange`.
  Future<String> getIdToken({bool forceRefresh = false});

  /// Links a Google credential onto this (presumably anonymous) user via
  /// Firebase's `linkWithCredential`, preserving [uid] per task 23's
  /// documented guarantee. Returns the (still same-`uid`) linked user.
  Future<LudoFirebaseUser> linkWithGoogleCredential({
    required String googleIdToken,
    required String googleAccessToken,
  });
}

/// The narrow slice of `firebase_auth`'s `FirebaseAuth` Ludo depends on.
abstract interface class LudoFirebaseAuthGateway {
  LudoFirebaseUser? get currentUser;

  /// Signs in a new anonymous Firebase user, or throws
  /// [LudoFirebaseUnavailableException] if Firebase isn't configured.
  Future<LudoFirebaseUser> signInAnonymously();
}

/// The narrow slice of `google_sign_in`'s `GoogleSignIn` Ludo depends on:
/// just enough to produce the ID/access token pair Firebase's
/// `GoogleAuthProvider.credential` needs.
abstract interface class LudoGoogleSignInGateway {
  /// Runs the interactive Google sign-in flow. Returns `null` if the user
  /// cancels it (not an error).
  Future<LudoGoogleSignInResult?> signIn();
}

final class LudoGoogleSignInResult {
  const LudoGoogleSignInResult({
    required this.idToken,
    required this.accessToken,
    required this.email,
  });

  final String idToken;
  final String accessToken;
  final String? email;
}

/// Attempts `Firebase.initializeApp()`. Returns `true` once initialized
/// (or already initialized), `false` if it throws for any reason — most
/// commonly no platform config file present, which this app must treat as
/// an ordinary, expected condition rather than a fatal error (see this
/// file's doc comment and task 24's Context/Decisions).
Future<bool> ensureLudoFirebaseInitialized() async {
  try {
    if (fb_core.Firebase.apps.isNotEmpty) return true;
    await fb_core.Firebase.initializeApp();
    return true;
  } on Object {
    return false;
  }
}

final class _FirebaseLudoUser implements LudoFirebaseUser {
  _FirebaseLudoUser(this._user);

  final fb_auth.User _user;

  @override
  String get uid => _user.uid;

  @override
  bool get isAnonymous => _user.isAnonymous;

  @override
  Future<String> getIdToken({bool forceRefresh = false}) async {
    final token = await _user.getIdToken(forceRefresh);
    if (token == null) {
      throw const LudoFirebaseUnavailableException('No Firebase ID token');
    }
    return token;
  }

  @override
  Future<LudoFirebaseUser> linkWithGoogleCredential({
    required String googleIdToken,
    required String googleAccessToken,
  }) async {
    final credential = fb_auth.GoogleAuthProvider.credential(
      idToken: googleIdToken,
      accessToken: googleAccessToken,
    );
    final result = await _user.linkWithCredential(credential);
    final linked = result.user;
    if (linked == null) {
      throw const LudoFirebaseUnavailableException(
        'Linking did not return a user',
      );
    }
    return _FirebaseLudoUser(linked);
  }
}

/// Production [LudoFirebaseAuthGateway] wrapping `firebase_auth`'s
/// `FirebaseAuth.instance`. Every method throws
/// [LudoFirebaseUnavailableException] (never a raw plugin exception) when
/// Firebase has not been initialized, so callers have exactly one
/// "unavailable" signal to handle.
final class FirebaseLudoAuthGateway implements LudoFirebaseAuthGateway {
  const FirebaseLudoAuthGateway();

  @override
  LudoFirebaseUser? get currentUser {
    if (fb_core.Firebase.apps.isEmpty) return null;
    final user = fb_auth.FirebaseAuth.instance.currentUser;
    return user == null ? null : _FirebaseLudoUser(user);
  }

  @override
  Future<LudoFirebaseUser> signInAnonymously() async {
    if (fb_core.Firebase.apps.isEmpty) {
      throw const LudoFirebaseUnavailableException();
    }
    try {
      final result = await fb_auth.FirebaseAuth.instance.signInAnonymously();
      final user = result.user;
      if (user == null) {
        throw const LudoFirebaseUnavailableException(
          'Anonymous sign-in returned no user',
        );
      }
      return _FirebaseLudoUser(user);
    } on fb_auth.FirebaseAuthException catch (error) {
      throw LudoFirebaseUnavailableException(error.message ?? error.code);
    }
  }
}

/// Production [LudoGoogleSignInGateway] wrapping `google_sign_in`.
final class GoogleSignInLudoGateway implements LudoGoogleSignInGateway {
  GoogleSignInLudoGateway({google_sign_in.GoogleSignIn? googleSignIn})
    : _googleSignIn =
          googleSignIn ?? google_sign_in.GoogleSignIn(scopes: const ['email']);

  final google_sign_in.GoogleSignIn _googleSignIn;

  @override
  Future<LudoGoogleSignInResult?> signIn() async {
    final account = await _googleSignIn.signIn();
    if (account == null) return null;
    final authentication = await account.authentication;
    final idToken = authentication.idToken;
    final accessToken = authentication.accessToken;
    if (idToken == null || accessToken == null) {
      throw const LudoFirebaseUnavailableException(
        'Google sign-in returned no tokens',
      );
    }
    return LudoGoogleSignInResult(
      idToken: idToken,
      accessToken: accessToken,
      email: account.email,
    );
  }
}

/// Whether Firestore is usable, i.e. Firebase initialized successfully.
/// Task 25 wires the actual match-view listener; this is only the guard
/// point so that check lives in one place.
bool ludoFirestoreAvailable() => fb_core.Firebase.apps.isNotEmpty;

/// Production `FirebaseFirestore.instance` accessor, exposed so task 25's
/// listener doesn't import `cloud_firestore` directly at every call site.
/// Throws [LudoFirebaseUnavailableException] if Firebase isn't
/// initialized.
FirebaseFirestore ludoFirestore() {
  if (!ludoFirestoreAvailable()) throw const LudoFirebaseUnavailableException();
  return FirebaseFirestore.instance;
}
