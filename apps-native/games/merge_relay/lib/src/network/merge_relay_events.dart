import 'dart:convert';

enum MergeRelayClientEventType {
  challengeOpened('challenge_opened'),
  replayViewed('replay_viewed'),
  validationRejected('validation_rejected'),
  dailyRunComplete('daily_run_complete'),
  practiceRewindUsed('practice_rewind_used');

  const MergeRelayClientEventType(this.wireName);

  final String wireName;

  static MergeRelayClientEventType? fromWireName(Object? value) {
    for (final type in values) {
      if (type.wireName == value) return type;
    }
    return null;
  }
}

const mergeRelayReservedEventKeyPrefixes = [
  'retire:',
  'cancel:',
  'save:',
  'result:',
  'return:',
  'abandoned:',
  'attempt:',
  'challenge:',
];

const mergeRelayEventPayloadFields = {
  'mode',
  'origin_mode',
  'outcome',
  'reason',
  'date',
  'rule_version',
  'config_revision',
  'move_count',
  'score',
  'count',
};

const mergeRelayMaxEventPayloadBytes = 32 * 1024;

bool isMergeRelayClientEventKey(String value) {
  if (value.isEmpty ||
      value.length > 128 ||
      !RegExp(r'^[A-Za-z0-9._:-]+$').hasMatch(value)) {
    return false;
  }
  final lowered = value.toLowerCase();
  return !mergeRelayReservedEventKeyPrefixes.any(lowered.startsWith);
}

Map<String, Object?> redactMergeRelayEventPayload(Map<String, Object?> raw) {
  final safe = <String, Object?>{};
  for (final entry in raw.entries) {
    final key = entry.key.toLowerCase();
    if (!mergeRelayEventPayloadFields.contains(key)) continue;
    final value = entry.value;
    if (value is bool || (value is int && value.abs() <= 1 << 40)) {
      safe[key] = value;
    } else if (value is String &&
        value.length <= 64 &&
        RegExp(r'^[A-Za-z0-9_.:-]+$').hasMatch(value)) {
      safe[key] = value;
    }
  }
  return Map.unmodifiable(safe);
}

final class MergeRelayEventRequest {
  MergeRelayEventRequest({
    required this.idempotencyKey,
    required this.type,
    Map<String, Object?> payload = const {},
    this.artifactId,
  }) : payload = redactMergeRelayEventPayload(payload) {
    if (!isMergeRelayClientEventKey(idempotencyKey)) {
      throw ArgumentError.value(idempotencyKey, 'idempotencyKey');
    }
    final id = artifactId;
    if (id != null &&
        (id.isEmpty ||
            id.length > 128 ||
            !RegExp(r'^[A-Za-z0-9_.:-]+$').hasMatch(id))) {
      throw ArgumentError.value(id, 'artifactId');
    }
    if (utf8.encode(jsonEncode(this.payload)).length >
        mergeRelayMaxEventPayloadBytes) {
      throw ArgumentError.value(payload, 'payload');
    }
  }

  final String idempotencyKey;
  final MergeRelayClientEventType type;
  final Map<String, Object?> payload;
  final String? artifactId;

  Map<String, Object?> toWireJson() => {
    'idempotency_key': idempotencyKey,
    'type': type.wireName,
    if (artifactId != null) 'artifact_id': artifactId,
    'payload': payload,
  };
}
