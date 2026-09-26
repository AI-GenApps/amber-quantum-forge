/// Low-level JSON decoding helpers and exception types shared by every DTO
/// in `ludo_models.dart`.
///
/// Unlike `merge_relay`'s wire layer, the Ludo server (`packages/api/src/
/// games/ludo/routes.ts`) does not wrap successful responses in a
/// `{contract_version, data}` envelope — each route returns its own flat
/// object (e.g. `{match_state, idempotent}`). Only error responses carry a
/// `contract_version` envelope (`LudoErrorResponse` in `contracts.ts`).
library;

import 'dart:convert';
import 'dart:typed_data';

/// The contract version every Ludo error envelope and session response
/// declares. Mirrors `LUDO_CONTRACT_VERSION` in `contracts.ts`.
const ludoContractVersion = 'ludo.v1';

typedef LudoJson = Map<String, Object?>;

/// A well-formed error response from the Ludo API
/// (`packages/api/src/games/ludo/errors.ts`'s `LudoError.response()`).
final class LudoApiException implements Exception {
  const LudoApiException({
    required this.statusCode,
    required this.code,
    required this.message,
    required this.diagnosticId,
  });

  final int statusCode;
  final String code;
  final String message;
  final String diagnosticId;

  bool get isUnauthorized => statusCode == 401;

  bool get isConflict => statusCode == 409;

  @override
  String toString() => 'LudoApiException($statusCode, $code, $message)';
}

/// Thrown when a response cannot be parsed as the DTO shape it was
/// expected to be, distinct from a transport failure or a well-formed API
/// error.
final class LudoProtocolException implements Exception {
  const LudoProtocolException(this.message);

  final String message;

  @override
  String toString() => 'LudoProtocolException: $message';
}

LudoJson decodeJsonObject(String body, {required int maxBytes}) {
  final bytes = Uint8List.fromList(utf8.encode(body));
  if (bytes.length > maxBytes) {
    throw const LudoProtocolException('Response body is too large');
  }
  final decoded = jsonDecode(utf8.decode(bytes));
  return asJsonObject(decoded, 'response');
}

/// Decodes an API error response (`{contract_version, error: {code,
/// message, diagnostic_id}}`) for a non-2xx status.
LudoApiException decodeApiError(int statusCode, String body) {
  try {
    final envelope = decodeJsonObject(body, maxBytes: 64 * 1024);
    requireFields(envelope, {'contract_version', 'error'}, 'error envelope');
    if (envelope['contract_version'] != ludoContractVersion) {
      return LudoApiException(
        statusCode: statusCode,
        code: 'unsupported_contract',
        message: 'The server uses an unsupported Ludo contract',
        diagnosticId: 'protocol',
      );
    }
    final error = asJsonObject(envelope['error'], 'error');
    requireFields(error, {'code', 'message', 'diagnostic_id'}, 'error details');
    return LudoApiException(
      statusCode: statusCode,
      code: readText(error, 'code', 128),
      message: readText(error, 'message', 512),
      diagnosticId: readText(error, 'diagnostic_id', 128),
    );
  } on Object {
    return LudoApiException(
      statusCode: statusCode,
      code: 'invalid_error_response',
      message: 'The server returned an invalid error response',
      diagnosticId: 'protocol',
    );
  }
}

LudoJson asJsonObject(Object? value, String name) {
  if (value is! Map) {
    throw LudoProtocolException('Expected object for $name');
  }
  final result = <String, Object?>{};
  for (final entry in value.entries) {
    if (entry.key is! String) {
      throw LudoProtocolException('Expected string keys for $name');
    }
    result[entry.key as String] = entry.value;
  }
  return result;
}

List<Object?> asJsonList(Object? value, String name) {
  if (value is! List) {
    throw LudoProtocolException('Expected array for $name');
  }
  return value;
}

void requireFields(
  LudoJson value,
  Set<String> required,
  String name, {
  Set<String> optional = const {},
}) {
  if (required.any((key) => !value.containsKey(key))) {
    throw LudoProtocolException('Missing field in $name');
  }
}

String readText(LudoJson value, String key, int maxLength) {
  final result = value[key];
  if (result is! String || result.isEmpty || result.length > maxLength) {
    throw LudoProtocolException('Invalid $key');
  }
  return result;
}

String? readOptionalText(LudoJson value, String key, int maxLength) {
  final result = value[key];
  if (result == null) return null;
  return readText(value, key, maxLength);
}

int readInteger(LudoJson value, String key) {
  final result = value[key];
  if (result is! int) throw LudoProtocolException('Invalid $key');
  return result;
}

int? readOptionalInteger(LudoJson value, String key) {
  final result = value[key];
  if (result == null) return null;
  if (result is! int) throw LudoProtocolException('Invalid $key');
  return result;
}

bool readBoolean(LudoJson value, String key) {
  final result = value[key];
  if (result is! bool) throw LudoProtocolException('Invalid $key');
  return result;
}
