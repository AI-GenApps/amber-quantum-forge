import 'dart:convert';

import 'package:crypto/crypto.dart';

const maxMergeJsonBytes = 64 * 1024;

Object? canonicalizeJson(Object? value) {
  if (value == null || value is String || value is bool || value is int) {
    return value;
  }
  if (value is double) {
    throw const FormatException('Merge JSON numbers must be integers');
  }
  if (value is List) {
    return value.map(canonicalizeJson).toList(growable: false);
  }
  if (value is Map) {
    final keys = value.keys.toList();
    if (keys.any((key) => key is! String)) {
      throw const FormatException('Merge JSON object keys must be strings');
    }
    keys.sort((first, second) => (first as String).compareTo(second as String));
    return <String, Object?>{
      for (final key in keys) key as String: canonicalizeJson(value[key]),
    };
  }
  throw FormatException('Unsupported Merge JSON value: ${value.runtimeType}');
}

String canonicalJson(Object? value) {
  final encoded = jsonEncode(canonicalizeJson(value));
  if (utf8.encode(encoded).length > maxMergeJsonBytes) {
    throw const FormatException('Merge JSON payload is too large');
  }
  return encoded;
}

String sha256Hex(Object? value) =>
    sha256.convert(utf8.encode(canonicalJson(value))).toString();
