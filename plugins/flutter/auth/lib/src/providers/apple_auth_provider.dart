import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb_auth;
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../auth_error.dart';
import '../auth_provider.dart';

/// Mirrors `AppleAuthProvider.swift`: performs Sign in with Apple, verifies
/// the nonce, and exchanges the resulting credential for a Firebase session.
class AppleAuthProvider implements AuthProvider {
  const AppleAuthProvider();

  @override
  Future<String> signIn() async {
    try {
      final rawNonce = _randomNonce();
      final hashedNonce = _sha256(rawNonce);

      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: hashedNonce,
      );

      final oauthCredential = fb_auth.OAuthProvider('apple.com').credential(
        idToken: appleCredential.identityToken,
        rawNonce: rawNonce,
      );

      final result = await fb_auth.FirebaseAuth.instance.signInWithCredential(
        oauthCredential,
      );
      final idToken = await result.user?.getIdToken();
      if (idToken == null) {
        throw const InvalidAuthResponse();
      }
      return idToken;
    } on AuthException {
      rethrow;
    } catch (error) {
      throw FirebaseAuthFailure(error);
    }
  }

  /// Mirrors `CryptoUtils.randomNonceString`.
  String _randomNonce({int length = 32}) {
    const charset =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(
      length,
      (_) => charset[random.nextInt(charset.length)],
    ).join();
  }

  /// Mirrors `CryptoUtils.sha256`.
  String _sha256(String input) {
    return sha256.convert(utf8.encode(input)).toString();
  }
}
