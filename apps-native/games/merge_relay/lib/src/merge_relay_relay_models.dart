import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_models.dart';
import 'merge_relay_pending_create.dart';
import 'merge_relay_relay_share.dart';
import 'merge_relay_replay.dart';
import 'network/merge_relay_models.dart';

const mergeRelayDefaultReturnAlias = 'You';

enum MergeRelayRelayPhase {
  idle,
  bootstrapping,
  ready,
  creating,
  creator,
  loadingPreview,
  preview,
  reserving,
  playing,
  syncing,
  offline,
  conflict,
  finalizing,
  result,
  expired,
  error,
}

final class MergeRelayRelayLocalState {
  const MergeRelayRelayLocalState({
    this.challengeId,
    this.attemptId,
    this.reservationKey,
    this.expectedVersion = 0,
    this.acknowledgedMoveCount = 0,
    this.pendingMove,
    this.finalizeKey,
    this.finalizeFinishEarly = false,
    this.finalizeReturnAlias,
    this.resultId,
    this.returnChallengeId,
    this.saveId,
    this.serverSaveVersion = 0,
    this.createdChallengeId,
    this.pendingChallengeId,
    this.pendingCreate,
  });

  final String? challengeId;
  final String? attemptId;
  final String? reservationKey;
  final int expectedVersion;
  final int acknowledgedMoveCount;
  final MergeDirection? pendingMove;
  final String? finalizeKey;
  final bool finalizeFinishEarly;
  final String? finalizeReturnAlias;
  final String? resultId;
  final String? returnChallengeId;
  final String? saveId;
  final int serverSaveVersion;
  final String? createdChallengeId;
  final String? pendingChallengeId;
  final MergeRelayPendingCreate? pendingCreate;

  bool get hasAttempt => attemptId != null && challengeId != null;

  Map<String, Object?> toJson() => {
    'version': 1,
    'challenge_id': challengeId,
    'attempt_id': attemptId,
    'reservation_key': reservationKey,
    'expected_version': expectedVersion,
    'acknowledged_move_count': acknowledgedMoveCount,
    'pending_move': pendingMove?.name,
    'finalize_key': finalizeKey,
    'finalize_finish_early': finalizeFinishEarly,
    'finalize_return_alias': finalizeReturnAlias,
    'result_id': resultId,
    'return_challenge_id': returnChallengeId,
    'save_id': saveId,
    'server_save_version': serverSaveVersion,
    'created_challenge_id': createdChallengeId,
    'pending_challenge_id': pendingChallengeId,
    'pending_create': pendingCreate?.toJson(),
  };

  factory MergeRelayRelayLocalState.fromJson(Object? raw) {
    if (raw is! Map) throw const FormatException('Invalid relay state');
    final json = raw.map<String, Object?>((key, value) {
      return MapEntry(key.toString(), value);
    });
    if (json['version'] != 1 ||
        json.keys.any((key) => !_fields.contains(key))) {
      throw const FormatException('Unsupported relay state');
    }
    final state = MergeRelayRelayLocalState(
      challengeId: _optionalId(json['challenge_id']),
      attemptId: _optionalId(json['attempt_id']),
      reservationKey: _optionalKey(json['reservation_key']),
      expectedVersion: _nonNegativeInt(json['expected_version']),
      acknowledgedMoveCount: _nonNegativeInt(json['acknowledged_move_count']),
      pendingMove: _optionalDirection(json['pending_move']),
      finalizeKey: _optionalKey(json['finalize_key']),
      finalizeFinishEarly: _optionalBool(json['finalize_finish_early']),
      finalizeReturnAlias: _optionalAlias(json['finalize_return_alias']),
      resultId: _optionalId(json['result_id']),
      returnChallengeId: _optionalId(json['return_challenge_id']),
      saveId: _optionalId(json['save_id']),
      serverSaveVersion: _nonNegativeInt(json['server_save_version']),
      createdChallengeId: _optionalId(json['created_challenge_id']),
      pendingChallengeId: _optionalId(json['pending_challenge_id']),
      pendingCreate: json['pending_create'] == null
          ? null
          : MergeRelayPendingCreate.fromJson(json['pending_create']),
    );
    state._validateCombination();
    return state;
  }

  static const _fields = {
    'version',
    'challenge_id',
    'attempt_id',
    'reservation_key',
    'expected_version',
    'acknowledged_move_count',
    'pending_move',
    'finalize_key',
    'finalize_finish_early',
    'finalize_return_alias',
    'result_id',
    'return_challenge_id',
    'save_id',
    'server_save_version',
    'created_challenge_id',
    'pending_challenge_id',
    'pending_create',
  };

  static String? _optionalId(Object? value) {
    if (value == null) return null;
    if (value is! String ||
        !RegExp(r'^[A-Za-z0-9_-]{1,128}$').hasMatch(value)) {
      throw const FormatException('Invalid relay identifier');
    }
    return value;
  }

  static String? _optionalKey(Object? value) {
    if (value == null) return null;
    if (value is! String ||
        value.isEmpty ||
        value.length > 128 ||
        !RegExp(r'^[A-Za-z0-9._:-]+$').hasMatch(value)) {
      throw const FormatException('Invalid relay request key');
    }
    return value;
  }

  static int _nonNegativeInt(Object? value) {
    if (value is! int || value < 0 || value > 1000000) {
      throw const FormatException('Invalid relay state count');
    }
    return value;
  }

  static bool _optionalBool(Object? value) {
    if (value == null) return false;
    if (value is! bool) throw const FormatException('Invalid relay flag');
    return value;
  }

  static String? _optionalAlias(Object? value) {
    if (value == null) return null;
    if (value is! String ||
        value.isEmpty ||
        value.length > 40 ||
        RegExp(r'[\u0000-\u001f]').hasMatch(value)) {
      throw const FormatException('Invalid relay alias');
    }
    return value;
  }

  static MergeDirection? _optionalDirection(Object? value) {
    if (value == null) return null;
    if (value is! String) throw const FormatException('Invalid relay move');
    return MergeDirection.values.firstWhere(
      (direction) => direction.name == value,
      orElse: () => throw const FormatException('Invalid relay move'),
    );
  }

  void _validateCombination() {
    if (challengeId == null &&
        (reservationKey != null ||
            attemptId != null ||
            pendingMove != null ||
            finalizeKey != null ||
            resultId != null ||
            returnChallengeId != null)) {
      throw const FormatException('Relay state is missing a challenge');
    }
    if (attemptId == null &&
        (pendingMove != null ||
            finalizeKey != null ||
            resultId != null ||
            returnChallengeId != null ||
            expectedVersion != 0 ||
            acknowledgedMoveCount != 0)) {
      throw const FormatException('Relay state is missing an attempt');
    }
    if (attemptId != null && reservationKey == null) {
      throw const FormatException('Relay attempt is missing its reservation');
    }
    if (finalizeKey == null &&
        (finalizeFinishEarly || finalizeReturnAlias != null)) {
      throw const FormatException('Relay finalize state is incomplete');
    }
    if (resultId != null && finalizeKey == null) {
      throw const FormatException('Relay result is missing its finalize key');
    }
    if (returnChallengeId != null && resultId == null) {
      throw const FormatException('Relay return is missing its result');
    }
    if (pendingCreate != null &&
        (challengeId != null ||
            attemptId != null ||
            resultId != null ||
            createdChallengeId != null)) {
      throw const FormatException('Pending relay create has active state');
    }
    if (createdChallengeId != null && challengeId != createdChallengeId) {
      throw const FormatException('Created relay challenge is not selected');
    }
    if (pendingChallengeId != null && pendingCreate != null) {
      throw const FormatException('Pending challenge overlaps pending create');
    }
  }
}

final class MergeRelayRelaySnapshot {
  MergeRelayRelaySnapshot({
    this.phase = MergeRelayRelayPhase.idle,
    this.preview,
    this.attempt,
    this.result,
    this.returnChallenge,
    this.config,
    this.feedback,
    this.pendingMove,
    this.errorCode,
    this.message,
    this.guestReady = false,
    this.saveVersion = 0,
    this.sharePayload,
    this.replay,
    this.shareStatus,
  });

  MergeRelayRelayPhase phase;
  MergeRelayChallenge? preview;
  MergeRelayAttempt? attempt;
  MergeRelayResultEnvelope? result;
  MergeRelayChallenge? returnChallenge;
  MergeRelayConfigRevision? config;
  MergeMovePresentation? feedback;
  MergeDirection? pendingMove;
  String? errorCode;
  String? message;
  bool guestReady;
  int saveVersion;
  MergeRelaySharePayload? sharePayload;
  MergeRelayReplayReport? replay;
  int replayStep = 0;
  bool replayPlaying = false;
  MergeRelayShareStatus? shareStatus;

  MergeGameState? get replayState {
    final report = replay;
    if (report == null) return null;
    if (replayStep <= 0 || report.replay.traces.isEmpty) {
      return report.replay.initialState;
    }
    final index = replayStep.clamp(1, report.replay.traces.length) - 1;
    return report.replay.traces[index].after;
  }

  bool get canMove =>
      phase == MergeRelayRelayPhase.playing && pendingMove == null;

  void clearError() {
    errorCode = null;
    message = null;
  }
}
