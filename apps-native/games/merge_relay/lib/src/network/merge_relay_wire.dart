import 'dart:convert';
import 'dart:typed_data';

import '../merge_relay_gateway.dart';

typedef MergeRelayJson = Map<String, Object?>;

final class MergeRelayApiException implements Exception {
  const MergeRelayApiException({
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
  String toString() => 'MergeRelayApiException($statusCode, $code)';
}

final class MergeRelayProtocolException implements Exception {
  const MergeRelayProtocolException(this.message);

  final String message;

  @override
  String toString() => 'MergeRelayProtocolException: $message';
}

MergeRelayJson decodeJsonObject(String body, {required int maxBytes}) {
  final bytes = Uint8List.fromList(utf8.encode(body));
  if (bytes.length > maxBytes) {
    throw const MergeRelayProtocolException('Response body is too large');
  }
  final decoded = jsonDecode(utf8.decode(bytes));
  return asJsonObject(decoded, 'response');
}

MergeRelayJson decodeSuccessEnvelope(String body, {required int maxBytes}) {
  final envelope = decodeJsonObject(body, maxBytes: maxBytes);
  requireFields(envelope, {'contract_version', 'data'}, 'success envelope');
  if (envelope['contract_version'] != mergeRelayContractVersion) {
    throw const MergeRelayProtocolException('Unsupported Merge Relay contract');
  }
  return asJsonObject(envelope['data'], 'success data');
}

MergeRelayApiException decodeApiError(int statusCode, String body) {
  try {
    final envelope = decodeJsonObject(body, maxBytes: 64 * 1024);
    requireFields(envelope, {'contract_version', 'error'}, 'error envelope');
    if (envelope['contract_version'] != mergeRelayContractVersion) {
      return MergeRelayApiException(
        statusCode: statusCode,
        code: 'unsupported_contract',
        message: 'The server uses an unsupported Merge Relay contract',
        diagnosticId: 'protocol',
      );
    }
    final error = asJsonObject(envelope['error'], 'error');
    requireFields(error, {'code', 'message', 'diagnostic_id'}, 'error details');
    return MergeRelayApiException(
      statusCode: statusCode,
      code: readText(error, 'code', 128),
      message: readText(error, 'message', 512),
      diagnosticId: readText(error, 'diagnostic_id', 128),
    );
  } on Object {
    return MergeRelayApiException(
      statusCode: statusCode,
      code: 'invalid_error_response',
      message: 'The server returned an invalid error response',
      diagnosticId: 'protocol',
    );
  }
}

MergeRelayJson asJsonObject(Object? value, String name) {
  if (value is! Map) {
    throw MergeRelayProtocolException('Expected object for $name');
  }
  final result = <String, Object?>{};
  for (final entry in value.entries) {
    if (entry.key is! String) {
      throw MergeRelayProtocolException('Expected string keys for $name');
    }
    result[entry.key as String] = entry.value;
  }
  return result;
}

void requireFields(
  MergeRelayJson value,
  Set<String> required,
  String name, {
  Set<String> optional = const {},
}) {
  if (required.any((key) => !value.containsKey(key)) ||
      value.keys.any(
        (key) => !required.contains(key) && !optional.contains(key),
      )) {
    throw MergeRelayProtocolException('Unexpected fields in $name');
  }
}

String readText(MergeRelayJson value, String key, int maxLength) {
  final result = value[key];
  if (result is! String ||
      result.isEmpty ||
      result.length > maxLength ||
      RegExp(r'[\u0000-\u001f]').hasMatch(result)) {
    throw MergeRelayProtocolException('Invalid $key');
  }
  return result;
}

String? readOptionalText(MergeRelayJson value, String key, int maxLength) {
  final result = value[key];
  if (result == null) return null;
  return readText(value, key, maxLength);
}

int readInteger(MergeRelayJson value, String key) {
  final result = value[key];
  if (result is! int || !_isSafeInteger(result)) {
    throw MergeRelayProtocolException('Invalid $key');
  }
  return result;
}

bool readBoolean(MergeRelayJson value, String key) {
  final result = value[key];
  if (result is! bool) throw MergeRelayProtocolException('Invalid $key');
  return result;
}

DateTime readDate(MergeRelayJson value, String key) {
  final raw = readText(value, key, 64);
  final parsed = DateTime.tryParse(raw);
  if (parsed == null || !parsed.isUtc) {
    throw MergeRelayProtocolException('Invalid $key');
  }
  return parsed;
}

void validateId(String value, String name) {
  if (!RegExp(r'^[A-Za-z0-9_-]{1,128}$').hasMatch(value)) {
    throw MergeRelayProtocolException('Invalid $name');
  }
}

bool _isSafeInteger(int value) =>
    value >= -9007199254740991 && value <= 9007199254740991;
