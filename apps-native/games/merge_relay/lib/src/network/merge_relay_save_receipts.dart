import 'dart:convert';

import 'package:crypto/crypto.dart';

import 'merge_relay_models.dart';

String mergeRelaySavePayloadFingerprint({
  required int schemaVersion,
  required Map<String, Object?> payload,
}) {
  if (schemaVersion < 0) {
    throw ArgumentError.value(schemaVersion, 'schemaVersion');
  }
  final canonical = mergeRelayCanonicalJson({
    'schemaVersion': schemaVersion,
    'payload': payload,
  });
  return sha256.convert(utf8.encode(canonical)).toString();
}

String mergeRelayCanonicalJson(Object? value) {
  if (value == null || value is bool || value is String) {
    return jsonEncode(value);
  }
  if (value is int) return _encodeInteger(value);
  if (value is double) return _encodeDouble(value);
  if (value is List) {
    return '[${value.map(mergeRelayCanonicalJson).join(',')}]';
  }
  if (value is Map) {
    final entries = <String, Object?>{};
    for (final entry in value.entries) {
      if (entry.key is! String) {
        throw const FormatException(
          'Canonical JSON object keys must be strings',
        );
      }
      entries[entry.key as String] = entry.value;
    }
    final keys = entries.keys.toList()..sort();
    return '{${keys.map((key) => '${jsonEncode(key)}:${mergeRelayCanonicalJson(entries[key])}').join(',')}}';
  }
  throw FormatException(
    'Unsupported canonical JSON value: ${value.runtimeType}',
  );
}

final class MergeRelaySaveWriteReceipt {
  const MergeRelaySaveWriteReceipt({
    required this.saveId,
    required this.clientWriteId,
    required this.payloadFingerprint,
    required this.savedVersion,
    required this.eventId,
    required this.replayed,
  });

  final String saveId;
  final String clientWriteId;
  final String payloadFingerprint;
  final int savedVersion;
  final String eventId;
  final bool replayed;
}

final class MergeRelaySaveWriteResult {
  const MergeRelaySaveWriteResult({
    required this.save,
    required this.receipt,
    required this.replayed,
  });

  final MergeRelaySave save;
  final MergeRelaySaveWriteReceipt? receipt;
  final bool replayed;
}

String _encodeInteger(int value) {
  if (!_isSafeInteger(value)) {
    throw const FormatException(
      'Canonical JSON integer exceeds JavaScript safe range',
    );
  }
  return value.toString();
}

String _encodeDouble(double value) {
  if (!value.isFinite) {
    throw const FormatException('Canonical JSON numbers must be finite');
  }
  if (value == 0) return '0';
  if (value == value.truncateToDouble() && value.abs() > 9007199254740991) {
    throw const FormatException(
      'Canonical JSON integer exceeds JavaScript safe range',
    );
  }
  return _formatJavaScriptNumber(value.toString());
}

bool _isSafeInteger(int value) =>
    value >= -9007199254740991 && value <= 9007199254740991;

String _formatJavaScriptNumber(String text) {
  final negative = text.startsWith('-');
  final unsigned = negative ? text.substring(1) : text;
  final exponentIndex = unsigned.indexOf('e');
  final mantissa = exponentIndex < 0
      ? unsigned
      : unsigned.substring(0, exponentIndex);
  final exponent = exponentIndex < 0
      ? 0
      : int.parse(unsigned.substring(exponentIndex + 1));
  final dotIndex = mantissa.indexOf('.');
  var rawDigits = dotIndex < 0
      ? mantissa
      : '${mantissa.substring(0, dotIndex)}${mantissa.substring(dotIndex + 1)}';
  if (dotIndex >= 0) {
    var fractionDigits = mantissa.length - dotIndex - 1;
    while (fractionDigits > 0 && rawDigits.endsWith('0')) {
      rawDigits = rawDigits.substring(0, rawDigits.length - 1);
      fractionDigits--;
    }
  }
  final rawDecimalPosition = dotIndex < 0 ? mantissa.length : dotIndex;
  final leadingZeroCount = rawDigits.indexOf(RegExp(r'[^0]'));
  final digits = rawDigits.substring(leadingZeroCount);
  final decimalPosition = rawDecimalPosition + exponent - leadingZeroCount;
  final decimalExponent = decimalPosition - 1;
  final formatted = decimalExponent >= -6 && decimalExponent < 21
      ? _formatFixedNumber(digits, decimalPosition)
      : _formatExponentialNumber(digits, decimalExponent);
  return negative ? '-$formatted' : formatted;
}

String _formatFixedNumber(String digits, int decimalPosition) {
  if (decimalPosition <= 0) {
    return '0.${'0' * -decimalPosition}$digits';
  }
  if (decimalPosition >= digits.length) {
    return '$digits${'0' * (decimalPosition - digits.length)}';
  }
  return '${digits.substring(0, decimalPosition)}.${digits.substring(decimalPosition)}';
}

String _formatExponentialNumber(String digits, int decimalExponent) {
  final mantissa = digits.length == 1
      ? digits
      : '${digits[0]}.${digits.substring(1)}';
  final sign = decimalExponent < 0 ? '-' : '+';
  return '$mantissa e$sign${decimalExponent.abs()}'.replaceAll(' ', '');
}
