import 'exchange_response.dart';

/// Mirrors `RefreshResponse.swift` — a type alias for [ExchangeResponse]
/// since `/api/auth/refresh` returns the same shape as `/api/auth/exchange`.
typedef RefreshResponse = ExchangeResponse;
