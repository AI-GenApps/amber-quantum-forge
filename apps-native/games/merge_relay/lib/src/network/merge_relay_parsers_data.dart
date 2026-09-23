import 'dart:convert';

import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_models.dart';
import 'merge_relay_parser_helpers.dart';
import 'merge_relay_parsers.dart';
import 'merge_relay_wire.dart';

MergeRelayGuestSession parseCreatedGuest(Object? value) {
  final json = asJsonObject(value, 'guest response');
  requireFields(json, {
    'guest',
    'recovery_token',
    'access_token',
  }, 'guest response');
  final guest = relayGuest(json['guest']);
  return MergeRelayGuestSession(
    guestId: guest.id,
    subject: guest.subject,
    recoveryToken: readText(json, 'recovery_token', 256),
    accessToken: relayNullableToken(json, 'access_token'),
    createdAt: guest.createdAt,
    upgradedSubject: guest.upgradedSubject,
    upgradedAt: guest.upgradedAt,
  );
}

MergeRelayGuestSession parseRecoveredGuest(
  Object? value, {
  required String recoveryToken,
}) {
  final json = asJsonObject(value, 'guest recovery');
  requireFields(json, {
    'guest_id',
    'subject',
    'upgraded_subject',
    'access_token',
  }, 'guest recovery');
  return MergeRelayGuestSession(
    guestId: relayId(json, 'guest_id'),
    subject: readText(json, 'subject', 128),
    recoveryToken: recoveryToken,
    accessToken: relayNullableToken(json, 'access_token'),
    createdAt: null,
    upgradedSubject: relayNullableText(json, 'upgraded_subject', 128),
  );
}

void parseGuestUpgrade(Object? value) {
  final json = asJsonObject(value, 'guest upgrade');
  requireFields(json, {
    'guest_id',
    'subject',
    'upgraded_subject',
  }, 'guest upgrade');
  relayId(json, 'guest_id');
  readText(json, 'subject', 128);
  readText(json, 'upgraded_subject', 128);
}

MergeRelayDailyChallenge parseDaily(Object? value) {
  final json = asJsonObject(value, 'daily');
  requireFields(json, {
    'date',
    'mode',
    'max_legal_moves',
    'checkpoint',
    'content_revision',
    'generated',
    'updated_at',
  }, 'daily');
  if (readText(json, 'mode', 16) != 'daily') {
    throw const MergeRelayProtocolException('Invalid daily mode');
  }
  final contentRevision = readText(json, 'content_revision', 64);
  if (contentRevision != relaySupportedContentVersion) {
    throw const MergeRelayProtocolException('Unsupported content revision');
  }
  return MergeRelayDailyChallenge(
    date: relayDateText(json, 'date'),
    checkpoint: parseCheckpoint(json['checkpoint']),
    maxLegalMoves: relayBoundedInt(json, 'max_legal_moves'),
    contentRevision: contentRevision,
    generated: readBoolean(json, 'generated'),
    updatedAt: readDate(json, 'updated_at'),
  );
}

MergeRelayConfigRevision parseConfig(Object? value) {
  final json = asJsonObject(value, 'config');
  requireFields(json, {
    'revision',
    'rules_version',
    'content_revision',
    'spawn_two_weight',
    'spawn_four_weight',
    'features',
    'active',
    'created_at',
  }, 'config');
  final features = asJsonObject(json['features'], 'features');
  requireFields(features, {
    'daily',
    'endless',
    'ranked_relay',
    'rewarded_ads',
    'cosmetics',
  }, 'features');
  final contentRevision = readText(json, 'content_revision', 64);
  if (contentRevision != relaySupportedContentVersion) {
    throw const MergeRelayProtocolException('Unsupported content revision');
  }
  return MergeRelayConfigRevision(
    revision: relayPositiveInt(json, 'revision'),
    rulesVersion: _supportedRulesVersion(json),
    contentRevision: contentRevision,
    spawnWeights: MergeSpawnWeights(
      spawnTwoWeight: readInteger(json, 'spawn_two_weight'),
      spawnFourWeight: readInteger(json, 'spawn_four_weight'),
    ),
    features: MergeRelayFeatureFlags(
      daily: readBoolean(features, 'daily'),
      endless: readBoolean(features, 'endless'),
      rankedRelay: readBoolean(features, 'ranked_relay'),
      rewardedAds: readBoolean(features, 'rewarded_ads'),
      cosmetics: readBoolean(features, 'cosmetics'),
    ),
    active: readBoolean(json, 'active'),
    createdAt: readDate(json, 'created_at'),
  );
}

MergeRelaySave parseSave(Object? value) {
  final json = asJsonObject(value, 'save');
  requireFields(
    json,
    {'save_id', 'schema_version', 'version', 'payload', 'updated_at'},
    'save',
    optional: {'payload_fingerprint'},
  );
  return MergeRelaySave(
    saveId: relayId(json, 'save_id'),
    schemaVersion: _saveSchemaVersion(json),
    version: _saveVersion(json),
    payload: _savePayload(json),
    updatedAt: readDate(json, 'updated_at'),
    payloadFingerprint: relayOptionalHash(json, 'payload_fingerprint'),
  );
}

String _supportedRulesVersion(MergeRelayJson json) {
  final value = readText(json, 'rules_version', 32);
  if (value != mergeRuleVersion) {
    throw const MergeRelayProtocolException('Unsupported merge rules version');
  }
  return value;
}

int _saveSchemaVersion(MergeRelayJson json) {
  final value = readInteger(json, 'schema_version');
  if (value != 1) {
    throw const MergeRelayProtocolException('Unsupported save schema');
  }
  return value;
}

int _saveVersion(MergeRelayJson json) {
  final value = readInteger(json, 'version');
  if (value < 0) {
    throw const MergeRelayProtocolException('Invalid save version');
  }
  return value;
}

Map<String, Object?> _savePayload(MergeRelayJson json) {
  final payload = Map<String, Object?>.unmodifiable(
    asJsonObject(json['payload'], 'payload'),
  );
  try {
    if (utf8.encode(jsonEncode(payload)).length > 32 * 1024) {
      throw const FormatException('Save payload is too large');
    }
  } on FormatException {
    throw const MergeRelayProtocolException('Invalid save payload');
  }
  return payload;
}
