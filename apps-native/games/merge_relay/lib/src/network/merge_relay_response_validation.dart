import 'package:merge_rules/merge_rules.dart';

import '../merge_relay_gateway.dart';

void validateCreatedChallenge(
  MergeRelayChallenge value,
  MergeRelayChallengeRequest request,
) {
  _require(
    value.mode == MergeRelayMode.rescue,
    'Created challenge has an invalid mode',
  );
  _require(
    value.originMode == (request.originMode ?? request.mode),
    'Created challenge has an invalid origin mode',
  );
  _require(
    value.checkpointHash ==
        MergeRelayCheckpoint.fromDomain(request.checkpoint).checkpointHash,
    'Created challenge checkpoint does not match the request',
  );
  _require(
    value.parentChallengeId == request.parentChallengeId,
    'Created challenge parent does not match the request',
  );
}

void validateChallengeIdentity(MergeRelayChallenge value, String challengeId) {
  _require(value.challengeId == challengeId, 'Challenge response ID mismatch');
}

void validateReservedAttempt(
  MergeRelayAttempt value,
  String challengeId,
  String reservationKey,
) {
  validateAttemptShape(value);
  _require(value.challengeId == challengeId, 'Attempt challenge ID mismatch');
  _require(
    value.reservationKey == reservationKey,
    'Attempt reservation mismatch',
  );
}

void validateAttemptIdentity(MergeRelayAttempt value, String attemptId) {
  validateAttemptShape(value);
  _require(value.attemptId == attemptId, 'Attempt response ID mismatch');
}

void validateSubmittedAttempt(
  MergeRelayAttempt value,
  String attemptId,
  MergeRelayMoveRequest request,
) {
  validateAttemptIdentity(value, attemptId);
  _require(
    value.version == request.expectedVersion + 1,
    'Attempt version does not acknowledge the request',
  );
  final suffixStart = value.moves.length - request.moves.length;
  _require(suffixStart >= 0, 'Attempt response is missing submitted moves');
  for (var index = 0; index < request.moves.length; index++) {
    _require(
      value.moves[suffixStart + index] == request.moves[index],
      'Attempt response move suffix does not match the request',
    );
  }
}

void validateAttemptShape(MergeRelayAttempt value) {
  _require(
    value.moves.length <= value.maxLegalMoves,
    'Attempt response exceeds its move budget',
  );
}

void validateFinalizedResult(MergeRelayResultEnvelope value, String attemptId) {
  _require(value.attemptId == attemptId, 'Result attempt ID mismatch');
  final child = value.returnChallenge;
  _require(
    (value.returnChallengeId == null) == (child == null),
    'Return challenge response is incomplete',
  );
  if (child != null) {
    _require(
      child.challengeId == value.returnChallengeId,
      'Return challenge ID mismatch',
    );
    _require(
      child.parentChallengeId == value.challengeId,
      'Return challenge parent mismatch',
    );
  }
}

void validateFinalizedResultCorrelation(
  MergeRelayResultEnvelope value,
  MergeRelayAttempt attempt, {
  String? expectedEnvironment,
  String? expectedRecipientSubject,
  int? expectedScoreDelta,
  MergeRelayAttemptStatus? expectedAttemptStatus,
  String? expectedResultId,
}) {
  validateFinalizedResult(value, attempt.attemptId);
  _require(
    value.challengeId == attempt.challengeId,
    'Result challenge ID mismatch',
  );
  _require(
    value.environment == attempt.environment,
    'Result environment mismatch',
  );
  _require(
    value.recipientSubject == attempt.recipientSubject,
    'Result recipient mismatch',
  );
  if (expectedEnvironment != null) {
    _require(
      value.environment == expectedEnvironment,
      'Result environment does not match session',
    );
  }
  if (expectedRecipientSubject != null) {
    _require(
      value.recipientSubject == expectedRecipientSubject,
      'Result recipient does not match session',
    );
  }
  if (expectedScoreDelta != null) {
    _require(
      value.scoreDelta == expectedScoreDelta,
      'Result score delta mismatch',
    );
  }
  if (expectedAttemptStatus != null) {
    _require(
      attempt.status == expectedAttemptStatus,
      'Attempt status mismatch',
    );
  }
  if (attempt.resultId != null) {
    _require(value.resultId == attempt.resultId, 'Result ID mismatch');
  }
  if (expectedResultId != null) {
    _require(
      value.resultId == expectedResultId,
      'Result ID does not match session',
    );
  }
}

void validateResultIdentity(MergeRelayResultEnvelope value, String resultId) {
  _require(value.resultId == resultId, 'Result response ID mismatch');
}

void validateDailyIdentity(MergeRelayDailyChallenge value, String date) {
  _require(value.date == date, 'Daily response date mismatch');
}

void validateSaveIdentity(MergeRelaySave value, String saveId) {
  _require(value.saveId == saveId, 'Save response ID mismatch');
}

void _require(bool condition, String message) {
  if (!condition) throw MergeRelayProtocolException(message);
}
