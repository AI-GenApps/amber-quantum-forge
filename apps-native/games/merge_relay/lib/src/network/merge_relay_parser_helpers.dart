import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_models.dart';
import 'merge_relay_wire.dart';

const relaySupportedContentVersion = 'MR-CONTENT-1';

List<int> relayReadBoard(MergeRelayJson json) {
  final board = json['board'];
  if (board is! List ||
      board.length != 16 ||
      board.any((value) => value is! int)) {
    throw const MergeRelayProtocolException('Invalid board');
  }
  return List.unmodifiable(board.cast<int>());
}

String relayId(MergeRelayJson json, String key) {
  final value = readText(json, key, 128);
  validateId(value, key);
  return value;
}

String? relayNullableId(MergeRelayJson json, String key) {
  final value = relayNullableText(json, key, 128);
  if (value != null) validateId(value, key);
  return value;
}

String? relayOptionalId(MergeRelayJson json, String key) {
  if (!json.containsKey(key)) return null;
  final value = readText(json, key, 128);
  validateId(value, key);
  return value;
}

String? relayContentVersion(MergeRelayJson json, String key) {
  final value = relayOptionalText(json, key, 64);
  if (value != null && value != relaySupportedContentVersion) {
    throw MergeRelayProtocolException('Unsupported $key');
  }
  return value;
}

String relayEnvironment(MergeRelayJson json, String key) {
  final value = readText(json, key, 16);
  if (!{'debug', 'staging', 'production'}.contains(value)) {
    throw MergeRelayProtocolException('Invalid $key');
  }
  return value;
}

MergeRelayMode relayMode(MergeRelayJson json, String key) =>
    switch (readText(json, key, 16)) {
      'rescue' => MergeRelayMode.rescue,
      'daily' => MergeRelayMode.daily,
      'endless' => MergeRelayMode.endless,
      _ => throw MergeRelayProtocolException('Invalid $key'),
    };

MergeRelayChallengeStatus relayChallengeStatus(MergeRelayJson json) =>
    switch (readText(json, 'status', 16)) {
      'open' => MergeRelayChallengeStatus.open,
      'retired' => MergeRelayChallengeStatus.retired,
      _ => throw const MergeRelayProtocolException('Invalid challenge status'),
    };

MergeRelayAttemptStatus relayAttemptStatus(MergeRelayJson json) =>
    switch (readText(json, 'status', 16)) {
      'reserved' => MergeRelayAttemptStatus.reserved,
      'completed' => MergeRelayAttemptStatus.completed,
      'abandoned' => MergeRelayAttemptStatus.abandoned,
      'cancelled' => MergeRelayAttemptStatus.cancelled,
      _ => throw const MergeRelayProtocolException('Invalid attempt status'),
    };

MergeRelayResultOutcome relayOutcome(MergeRelayJson json) =>
    switch (readText(json, 'outcome', 32)) {
      'complete' => MergeRelayResultOutcome.complete,
      'tie' => MergeRelayResultOutcome.tie,
      'unfinished' => MergeRelayResultOutcome.unfinished,
      'early_finish' => MergeRelayResultOutcome.earlyFinish,
      'terminal' => MergeRelayResultOutcome.terminal,
      _ => throw const MergeRelayProtocolException('Invalid result outcome'),
    };

MergeDirection relayDirection(Object? value) => switch (value) {
  'up' => MergeDirection.up,
  'down' => MergeDirection.down,
  'left' => MergeDirection.left,
  'right' => MergeDirection.right,
  _ => throw const MergeRelayProtocolException('Invalid move direction'),
};

int relayPositiveInt(MergeRelayJson json, String key) {
  final value = readInteger(json, key);
  if (value < 1) throw MergeRelayProtocolException('Invalid $key');
  return value;
}

int relayBoundedInt(MergeRelayJson json, String key) {
  final value = readInteger(json, key);
  if (value < 1 || value > 3) {
    throw MergeRelayProtocolException('Invalid $key');
  }
  return value;
}

String relayDateText(MergeRelayJson json, String key) {
  final value = readText(json, key, 10);
  final parsed = DateTime.tryParse('${value}T00:00:00Z');
  if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(value) ||
      parsed == null ||
      parsed.toUtc().toIso8601String().substring(0, 10) != value) {
    throw MergeRelayProtocolException('Invalid $key');
  }
  return value;
}

String? relayOptionalText(MergeRelayJson json, String key, int maxLength) {
  if (!json.containsKey(key)) return null;
  return readText(json, key, maxLength);
}

String? relayNullableText(MergeRelayJson json, String key, int maxLength) {
  if (!json.containsKey(key) || json[key] == null) return null;
  return readText(json, key, maxLength);
}

String? relayNullableToken(MergeRelayJson json, String key) =>
    relayNullableText(json, key, 4096);

String? relayOptionalHash(MergeRelayJson json, String key) {
  if (!json.containsKey(key)) return null;
  final value = readText(json, key, 64);
  if (!RegExp(r'^[a-f0-9]{64}$').hasMatch(value)) {
    throw MergeRelayProtocolException('Invalid $key');
  }
  return value;
}

({
  String id,
  String subject,
  DateTime createdAt,
  String? upgradedSubject,
  DateTime? upgradedAt,
})
relayGuest(Object? value) {
  final json = asJsonObject(value, 'guest');
  requireFields(json, {
    'guest_id',
    'subject',
    'upgraded_subject',
    'created_at',
    'upgraded_at',
  }, 'guest');
  return (
    id: relayId(json, 'guest_id'),
    subject: readText(json, 'subject', 128),
    createdAt: readDate(json, 'created_at'),
    upgradedSubject: relayNullableText(json, 'upgraded_subject', 128),
    upgradedAt: json['upgraded_at'] == null
        ? null
        : readDate(json, 'upgraded_at'),
  );
}
