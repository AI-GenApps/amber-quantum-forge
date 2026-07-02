/// Mirrors `AuthError.swift`.
sealed class AuthException implements Exception {
  const AuthException();
}

class FirebaseAuthFailure extends AuthException {
  const FirebaseAuthFailure(this.cause);
  final Object cause;

  @override
  String toString() => 'FirebaseAuthFailure: $cause';
}

class AuthNetworkError extends AuthException {
  const AuthNetworkError(this.cause);
  final Object cause;

  @override
  String toString() => 'AuthNetworkError: $cause';
}

class InvalidAuthResponse extends AuthException {
  const InvalidAuthResponse();

  @override
  String toString() => 'InvalidAuthResponse';
}

class TokenExpired extends AuthException {
  const TokenExpired();

  @override
  String toString() => 'TokenExpired';
}

class NotSignedIn extends AuthException {
  const NotSignedIn();

  @override
  String toString() => 'NotSignedIn';
}
