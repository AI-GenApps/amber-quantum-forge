/// Mirrors `AuthProvider.swift` — a source of a Firebase ID token.
abstract class AuthProvider {
  /// Performs the platform sign-in flow and returns a Firebase ID token.
  Future<String> signIn();
}
