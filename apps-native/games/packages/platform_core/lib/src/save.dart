import 'dart:convert';

import 'app_context.dart';
import 'clock.dart';

typedef JsonObject = Map<String, Object?>;
typedef SaveMigration = JsonObject Function(JsonObject payload);

const maxSavePayloadBytes = 64 * 1024;
const maxSaveEnvelopeBytes = 96 * 1024;

final class SaveValidationException implements Exception {
  const SaveValidationException(this.message);

  final String message;

  @override
  String toString() => 'SaveValidationException: $message';
}

final class SaveEnvelope {
  const SaveEnvelope({
    required this.appId,
    required this.environment,
    required this.namespace,
    required this.schemaVersion,
    required this.savedAt,
    required this.payload,
    required this.checksum,
  });

  factory SaveEnvelope.create({
    required AppContext context,
    required int schemaVersion,
    required DateTime savedAt,
    required JsonObject payload,
  }) {
    context.validate();
    if (schemaVersion < 1 || schemaVersion > 1000) {
      throw const SaveValidationException('Unsupported save schema version');
    }
    final envelope = SaveEnvelope(
      appId: context.identity.stableId,
      environment: context.environment.name,
      namespace: context.identity.saveNamespaceFor(context.environment),
      schemaVersion: schemaVersion,
      savedAt: savedAt.toUtc(),
      payload: _copyObject(payload),
      checksum: '',
    );
    envelope._validatePayloadSize();
    return envelope.copyWith(checksum: envelope.computeChecksum());
  }

  factory SaveEnvelope.fromJson(Object? raw) {
    if (raw is! Map) {
      throw const SaveValidationException('Envelope must be an object');
    }
    final map = raw.map<String, Object?>((key, value) {
      return MapEntry(key.toString(), value);
    });
    final appId = map['app_id'];
    final environment = map['environment'];
    final namespace = map['namespace'];
    final schemaVersion = map['schema_version'];
    final savedAt = map['saved_at'];
    final payload = map['payload'];
    final checksum = map['checksum'];
    if (appId is! String ||
        environment is! String ||
        namespace is! String ||
        schemaVersion is! int) {
      throw const SaveValidationException('Envelope metadata is invalid');
    }
    if (savedAt is! int || payload is! Map || checksum is! String) {
      throw const SaveValidationException('Envelope body is invalid');
    }
    return SaveEnvelope(
      appId: appId,
      environment: environment,
      namespace: namespace,
      schemaVersion: schemaVersion,
      savedAt: dateTimeFromEpochMilliseconds(savedAt),
      payload: _copyObject(payload.cast<String, Object?>()),
      checksum: checksum,
    );
  }

  factory SaveEnvelope.decode(String encoded) {
    if (utf8.encode(encoded).length > maxSaveEnvelopeBytes) {
      throw const SaveValidationException('Save envelope exceeds size limit');
    }
    return SaveEnvelope.fromJson(jsonDecode(encoded));
  }

  final String appId;
  final String environment;
  final String namespace;
  final int schemaVersion;
  final DateTime savedAt;
  final JsonObject payload;
  final String checksum;

  SaveEnvelope copyWith({
    String? appId,
    String? environment,
    String? namespace,
    int? schemaVersion,
    DateTime? savedAt,
    JsonObject? payload,
    String? checksum,
  }) {
    return SaveEnvelope(
      appId: appId ?? this.appId,
      environment: environment ?? this.environment,
      namespace: namespace ?? this.namespace,
      schemaVersion: schemaVersion ?? this.schemaVersion,
      savedAt: savedAt ?? this.savedAt,
      payload: payload == null ? this.payload : _copyObject(payload),
      checksum: checksum ?? this.checksum,
    );
  }

  String computeChecksum() {
    final body = canonicalJson({
      'app_id': appId,
      'environment': environment,
      'namespace': namespace,
      'schema_version': schemaVersion,
      'saved_at': epochMilliseconds(savedAt),
      'payload': payload,
    });
    var hash = 2166136261;
    for (final byte in utf8.encode(body)) {
      hash ^= byte;
      hash = _multiplyFNV32(hash);
    }
    return hash.toRadixString(16).padLeft(8, '0');
  }

  void _validatePayloadSize() {
    if (utf8.encode(canonicalJson(payload)).length > maxSavePayloadBytes) {
      throw const SaveValidationException('Save payload exceeds size limit');
    }
  }

  void validate(AppContext context) {
    context.validate();
    if (appId != context.identity.stableId ||
        environment != context.environment.name ||
        namespace != context.identity.saveNamespaceFor(context.environment)) {
      throw const SaveValidationException(
        'Save belongs to another app or environment',
      );
    }
    if (schemaVersion < 1 || schemaVersion > 1000) {
      throw const SaveValidationException('Unsupported save schema version');
    }
    if (checksum != computeChecksum()) {
      throw const SaveValidationException('Save checksum mismatch');
    }
    _validatePayloadSize();
  }

  SaveEnvelope migrate({
    required AppContext context,
    required int targetVersion,
    required Map<int, SaveMigration> migrations,
  }) {
    validate(context);
    if (targetVersion < schemaVersion || targetVersion > 1000) {
      throw const SaveValidationException('Invalid migration target');
    }
    if (targetVersion == schemaVersion) return this;
    var version = schemaVersion;
    var nextPayload = _copyObject(payload);
    while (version < targetVersion) {
      final migration = migrations[version];
      if (migration == null) {
        throw SaveValidationException('Missing migration from $version');
      }
      nextPayload = _copyObject(migration(nextPayload));
      version += 1;
    }
    return SaveEnvelope.create(
      context: context,
      schemaVersion: version,
      savedAt: savedAt,
      payload: nextPayload,
    );
  }

  JsonObject toJson() {
    return {
      'app_id': appId,
      'environment': environment,
      'namespace': namespace,
      'schema_version': schemaVersion,
      'saved_at': epochMilliseconds(savedAt),
      'payload': payload,
      'checksum': checksum,
    };
  }

  String encode() {
    final encoded = jsonEncode(toJson());
    if (utf8.encode(encoded).length > maxSaveEnvelopeBytes) {
      throw const SaveValidationException('Save envelope exceeds size limit');
    }
    return encoded;
  }
}

abstract interface class SaveStore {
  Future<SaveEnvelope?> read(AppContext context);

  Future<void> write(AppContext context, SaveEnvelope envelope);

  Future<void> delete(AppContext context);
}

final class MemorySaveStore implements SaveStore {
  final Map<String, SaveEnvelope> _envelopes = {};

  @override
  Future<SaveEnvelope?> read(AppContext context) async {
    final envelope =
        _envelopes[context.identity.saveNamespaceFor(context.environment)];
    if (envelope == null) return null;
    envelope.validate(context);
    return _copyEnvelope(envelope);
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    envelope.validate(context);
    _envelopes[context.identity.saveNamespaceFor(context.environment)] =
        _copyEnvelope(envelope);
  }

  @override
  Future<void> delete(AppContext context) async {
    _envelopes.remove(context.identity.saveNamespaceFor(context.environment));
  }
}

SaveEnvelope _copyEnvelope(SaveEnvelope envelope) {
  return envelope.copyWith(payload: _copyObject(envelope.payload));
}

JsonObject _copyObject(Map<String, Object?> input) {
  return input.map((key, value) => MapEntry(key, _copyJson(value)));
}

Object? _copyJson(Object? value) {
  if (value is Map) return _copyObject(value.cast<String, Object?>());
  if (value is List) return value.map(_copyJson).toList(growable: false);
  if (value is String || value is num || value is bool || value == null) {
    return value;
  }
  throw SaveValidationException('Unsupported JSON value: ${value.runtimeType}');
}

String canonicalJson(Object? value) {
  if (value == null || value is num || value is bool || value is String) {
    return jsonEncode(value);
  }
  if (value is List) return '[${value.map(canonicalJson).join(',')}]';
  if (value is Map) {
    final keys = value.keys.map((key) => key.toString()).toList()..sort();
    return '{${keys.map((key) => '${jsonEncode(key)}:${canonicalJson(value[key])}').join(',')}}';
  }
  throw ArgumentError('Unsupported JSON value: ${value.runtimeType}');
}

int _multiplyFNV32(int value) {
  final low = value & 0xffff;
  final high = (value >> 16) & 0xffff;
  final lowProduct = low * 0x0193;
  final nextHigh = high * 0x0193 + low * 0x0100 + (lowProduct >> 16);
  return ((nextHigh & 0xffff) << 16) | (lowProduct & 0xffff);
}
