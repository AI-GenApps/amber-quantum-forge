/// Mirrors `ExchangeResponse.swift` — the body of
/// `POST /api/auth/exchange` and `POST /api/auth/refresh` responses.
class ExchangeResponse {
  const ExchangeResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
  });

  final String accessToken;
  final String refreshToken;

  /// Seconds until [accessToken] expires (6h = 21600 per the API contract).
  final int expiresIn;

  factory ExchangeResponse.fromJson(Map<String, dynamic> json) =>
      ExchangeResponse(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
        expiresIn: json['expiresIn'] as int,
      );
}
