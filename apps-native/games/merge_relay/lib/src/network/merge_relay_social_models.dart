import 'merge_relay_wire.dart';

enum MergeRelaySocialAction { report, block }

final class MergeRelaySocialRequest {
  MergeRelaySocialRequest({
    required this.action,
    required this.reason,
    this.targetChallengeId,
    this.targetAlias,
  }) {
    if (reason.isEmpty ||
        reason.length > 256 ||
        RegExp(r'[\u0000-\u001f]').hasMatch(reason)) {
      throw ArgumentError.value(reason, 'reason');
    }
    if (targetChallengeId == null && targetAlias == null) {
      throw ArgumentError('A challenge or alias target is required');
    }
    final challengeId = targetChallengeId;
    if (challengeId != null) validateId(challengeId, 'targetChallengeId');
    final alias = targetAlias;
    if (alias != null &&
        (alias.isEmpty ||
            alias.length > 40 ||
            RegExp(r'[\u0000-\u001f]').hasMatch(alias))) {
      throw ArgumentError.value(alias, 'targetAlias');
    }
  }

  final MergeRelaySocialAction action;
  final String reason;
  final String? targetChallengeId;
  final String? targetAlias;

  Map<String, Object?> toWireJson() => {
    'reason': reason,
    if (targetChallengeId != null)
      'target_challenge_id': targetChallengeId
    else
      'target_alias': targetAlias,
  };
}

final class MergeRelaySocialRecord {
  const MergeRelaySocialRecord({required this.recordId, required this.action});

  final String recordId;
  final MergeRelaySocialAction action;
}

MergeRelaySocialRecord parseSocialRecord(
  Object? value,
  MergeRelaySocialAction expected,
) {
  final data = asJsonObject(value, 'social');
  requireFields(data, {'record'}, 'social');
  final record = asJsonObject(data['record'], 'social record');
  requireFields(record, {
    'record_id',
    'target_subject',
    'target_alias',
    'action',
    'created_at',
  }, 'social record');
  final id = readText(record, 'record_id', 128);
  validateId(id, 'record_id');
  readText(record, 'target_subject', 128);
  readOptionalText(record, 'target_alias', 128);
  readDate(record, 'created_at');
  if (record['action'] != expected.name) {
    throw const MergeRelayProtocolException('Unexpected social action');
  }
  return MergeRelaySocialRecord(recordId: id, action: expected);
}
