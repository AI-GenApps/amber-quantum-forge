import 'merge_relay_parser_helpers.dart';
import 'merge_relay_save_receipts.dart';
import 'merge_relay_wire.dart';

MergeRelayJson parseSaveWriteData(Object? value) {
  final json = asJsonObject(value, 'save write result');
  requireFields(
    json,
    {'save'},
    'save write result',
    optional: {'write_receipt'},
  );
  return json;
}

MergeRelaySaveWriteReceipt? parseSaveWriteReceipt(
  Object? value, {
  required String expectedSaveId,
  required String? expectedClientWriteId,
  required String expectedPayloadFingerprint,
  required int expectedSavedVersion,
}) {
  if (value == null) {
    if (expectedClientWriteId != null) {
      throw const MergeRelayProtocolException(
        'Missing save write receipt for client write',
      );
    }
    return null;
  }
  final json = asJsonObject(value, 'save write receipt');
  final rawClientWriteId = json['client_write_id'];
  if (rawClientWriteId == null) {
    requireFields(
      json,
      {
        'client_write_id',
        'payload_fingerprint',
        'saved_version',
        'event_id',
        'replayed',
      },
      'manual save result',
      optional: {'save_id'},
    );
    if (json['save_id'] != null ||
        json['payload_fingerprint'] != null ||
        json['saved_version'] != null ||
        json['event_id'] != null ||
        json['replayed'] is! bool ||
        json['replayed'] as bool) {
      throw const MergeRelayProtocolException('Invalid manual save result');
    }
    if (expectedClientWriteId != null) {
      throw const MergeRelayProtocolException(
        'Missing save write receipt for client write',
      );
    }
    return null;
  }
  if (expectedClientWriteId == null) {
    throw const MergeRelayProtocolException(
      'Unexpected save write receipt for manual save',
    );
  }
  requireFields(json, {
    'save_id',
    'client_write_id',
    'payload_fingerprint',
    'saved_version',
    'event_id',
    'replayed',
  }, 'save write receipt');
  final saveId = relayId(json, 'save_id');
  final clientWriteId = _writeId(json, 'client_write_id');
  final fingerprint = relayOptionalHash(json, 'payload_fingerprint');
  final savedVersion = readInteger(json, 'saved_version');
  final eventId = relayId(json, 'event_id');
  final replayed = readBoolean(json, 'replayed');
  if (saveId != expectedSaveId || clientWriteId != expectedClientWriteId) {
    throw const MergeRelayProtocolException('Save receipt identity mismatch');
  }
  if (fingerprint != expectedPayloadFingerprint ||
      savedVersion != expectedSavedVersion ||
      fingerprint == null ||
      savedVersion < 0) {
    throw const MergeRelayProtocolException('Save receipt contents mismatch');
  }
  return MergeRelaySaveWriteReceipt(
    saveId: saveId,
    clientWriteId: clientWriteId,
    payloadFingerprint: fingerprint,
    savedVersion: savedVersion,
    eventId: eventId,
    replayed: replayed,
  );
}

String _writeId(MergeRelayJson json, String key) {
  final value = readText(json, key, 128);
  if (!RegExp(r'^[A-Za-z0-9._:-]+$').hasMatch(value)) {
    throw MergeRelayProtocolException('Invalid $key');
  }
  return value;
}
