import 'dart:convert';

import 'package:merge_rules/merge_rules.dart';

import 'network/merge_relay_models.dart';
import 'network/merge_relay_pgs_models.dart';
import 'network/merge_relay_save_receipts.dart';

export 'network/merge_relay_http.dart';
export 'network/merge_relay_models.dart';
export 'network/merge_relay_network.dart';
export 'network/merge_relay_pgs_models.dart';
export 'network/merge_relay_save_receipts.dart';
export 'network/merge_relay_secure_auth.dart';
export 'platform/merge_relay_challenge_links.dart';

const mergeRelayContractVersion = 'merge-relay.v1';

abstract interface class MergeRelayGateway {
  Future<MergeRelayGuestSession> createGuest();

  Future<MergeRelayGuestSession> recoverGuest(String recoveryToken);

  Future<void> upgradeGuest(String recoveryToken);

  Future<MergeRelayChallenge> createChallenge(
    MergeRelayChallengeRequest request,
  );

  Future<MergeRelayChallenge> resolveChallenge(String challengeId);

  Future<MergeRelayChallenge> getChallenge(String challengeId);

  Future<MergeRelayAttempt> reserveAttempt(
    String challengeId,
    String reservationKey,
  );

  Future<MergeRelayAttempt> submitMoves(
    String attemptId,
    MergeRelayMoveRequest request,
  );

  Future<MergeRelayAttempt> getAttempt(String attemptId);

  Future<MergeRelayResultEnvelope> finalizeAttempt(
    String attemptId,
    MergeRelayFinalizeRequest request,
  );

  Future<MergeRelayResultEnvelope> getResult(String resultId);

  Future<MergeRelayDailyChallenge> getDaily(String date);

  Future<MergeRelayConfigRevision> getConfig();

  Future<MergeRelaySave?> getSave(String saveId);

  Future<MergeRelaySave> putSave(String saveId, MergeRelaySaveRequest request);

  Future<MergeRelaySaveWriteResult> putSaveWithReceipt(
    String saveId,
    MergeRelaySaveRequest request,
  );

  Future<MergeRelayPgsIdentity> linkPgsIdentity(String serverAuthCode);

  Future<MergeRelayPgsIdentitySnapshot> getPgsIdentityStatus();
}

final class MergeRelayChallengeRequest {
  MergeRelayChallengeRequest({
    required this.idempotencyKey,
    required this.creatorAlias,
    required this.checkpoint,
    this.mode = MergeRelayMode.rescue,
    this.maxLegalMoves,
    this.contentId,
    this.contentVersion,
    this.originMode,
    this.parentChallengeId,
  }) {
    _validateRequestKey(idempotencyKey, 'idempotencyKey');
    _validateText(creatorAlias, 'creatorAlias', 40);
    if (maxLegalMoves != null && (maxLegalMoves! < 1 || maxLegalMoves! > 3)) {
      throw ArgumentError.value(maxLegalMoves, 'maxLegalMoves');
    }
    _validateOptionalId(contentId, 'contentId');
    _validateOptionalId(contentVersion, 'contentVersion');
    _validateOptionalId(parentChallengeId, 'parentChallengeId');
  }

  final String idempotencyKey;
  final String creatorAlias;
  final MergeCheckpoint checkpoint;
  final MergeRelayMode mode;
  final int? maxLegalMoves;
  final String? contentId;
  final String? contentVersion;
  final MergeRelayMode? originMode;
  final String? parentChallengeId;
}

final class MergeRelayMoveRequest {
  MergeRelayMoveRequest({
    required this.expectedVersion,
    required Iterable<MergeDirection> moves,
  }) : moves = List.unmodifiable(moves) {
    if (expectedVersion < 0) {
      throw ArgumentError.value(expectedVersion, 'expectedVersion');
    }
    if (this.moves.isEmpty || this.moves.length > 3) {
      throw ArgumentError.value(this.moves, 'moves');
    }
  }

  final int expectedVersion;
  final List<MergeDirection> moves;
}

final class MergeRelayFinalizeRequest {
  MergeRelayFinalizeRequest({
    required this.idempotencyKey,
    this.finishEarly = false,
    this.returnAlias,
  }) {
    _validateRequestKey(idempotencyKey, 'idempotencyKey');
    if (returnAlias != null) _validateText(returnAlias!, 'returnAlias', 40);
  }

  final String idempotencyKey;
  final bool finishEarly;
  final String? returnAlias;
}

final class MergeRelaySaveRequest {
  MergeRelaySaveRequest({
    required this.expectedVersion,
    required this.schemaVersion,
    required Map<String, Object?> payload,
    this.clientWriteId,
  }) : payload = Map.unmodifiable(payload) {
    if (expectedVersion < 0) {
      throw ArgumentError.value(expectedVersion, 'expectedVersion');
    }
    if (schemaVersion != 1) {
      throw ArgumentError.value(schemaVersion, 'schemaVersion');
    }
    try {
      if (utf8.encode(mergeRelayCanonicalJson(payload)).length > 32 * 1024) {
        throw const FormatException('Save payload is too large');
      }
    } on FormatException {
      throw ArgumentError.value(payload, 'payload');
    }
    if (clientWriteId != null) {
      _validateRequestKey(clientWriteId!, 'clientWriteId');
    }
  }

  final int expectedVersion;
  final int schemaVersion;
  final Map<String, Object?> payload;
  final String? clientWriteId;
}

void _validateText(String value, String name, int maxLength) {
  if (value.isEmpty ||
      value.length > maxLength ||
      RegExp(r'[\u0000-\u001f]').hasMatch(value)) {
    throw ArgumentError.value(value, name);
  }
}

void _validateRequestKey(String value, String name) {
  if (value.isEmpty ||
      value.length > 128 ||
      !RegExp(r'^[A-Za-z0-9._:-]+$').hasMatch(value)) {
    throw ArgumentError.value(value, name);
  }
}

void _validateOptionalId(String? value, String name) {
  if (value == null) return;
  if (value.isEmpty ||
      value.length > 128 ||
      !RegExp(r'^[A-Za-z0-9_.:-]+$').hasMatch(value)) {
    throw ArgumentError.value(value, name);
  }
}
