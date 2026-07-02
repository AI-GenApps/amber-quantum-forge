/// Mirrors `AIError.swift`.
sealed class AIException implements Exception {
  const AIException();
}

class AINetworkError extends AIException {
  const AINetworkError(this.cause);
  final Object cause;

  @override
  String toString() => 'AINetworkError: $cause';
}

class StreamParseError extends AIException {
  const StreamParseError();

  @override
  String toString() => 'StreamParseError';
}

class Unauthorized extends AIException {
  const Unauthorized();

  @override
  String toString() => 'Unauthorized';
}

class AIServerError extends AIException {
  const AIServerError(this.statusCode);
  final int statusCode;

  @override
  String toString() => 'AIServerError($statusCode)';
}
