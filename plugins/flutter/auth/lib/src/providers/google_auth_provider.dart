import 'package:firebase_auth/firebase_auth.dart' as fb_auth;
import 'package:google_sign_in/google_sign_in.dart';

import '../auth_error.dart';
import '../auth_provider.dart';

/// Mirrors `GoogleAuthProvider.swift`: drives the native Google Sign-In flow,
/// exchanges the resulting Google credential for a Firebase session, and
/// returns the Firebase ID token for the two-stage exchange.
class GoogleAuthProvider implements AuthProvider {
  GoogleAuthProvider({GoogleSignIn? googleSignIn})
    : _googleSignIn = googleSignIn ?? GoogleSignIn();

  final GoogleSignIn _googleSignIn;

  @override
  Future<String> signIn() async {
    try {
      final account = await _googleSignIn.signIn();
      if (account == null) {
        throw const InvalidAuthResponse();
      }
      final googleAuth = await account.authentication;
      final credential = fb_auth.GoogleAuthProvider.credential(
        idToken: googleAuth.idToken,
        accessToken: googleAuth.accessToken,
      );
      final result = await fb_auth.FirebaseAuth.instance.signInWithCredential(
        credential,
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
}
