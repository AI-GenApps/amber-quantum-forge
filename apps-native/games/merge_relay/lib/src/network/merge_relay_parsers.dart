import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_models.dart';
import 'merge_relay_parser_helpers.dart';
import 'merge_relay_wire.dart';

MergeRelayCheckpoint parseCheckpoint(Object? value) {
  final json = asJsonObject(value, 'checkpoint');
  requireFields(
    json,
    {'board', 'score', 'move_count', 'seed', 'rng_state', 'rule_version'},
    'checkpoint',
    optional: {
      'max_legal_moves',
      'content_id',
      'content_version',
      'spawn_two_weight',
      'spawn_four_weight',
    },
  );
  final state = MergeGameState.fromWireJson({
    'board': relayReadBoard(json),
    'score': readInteger(json, 'score'),
    'move_count': readInteger(json, 'move_count'),
    'seed': readInteger(json, 'seed'),
    'rng_state': readInteger(json, 'rng_state'),
    'rule_version': readText(json, 'rule_version', 32),
  });
  final maxLegalMoves = json.containsKey('max_legal_moves')
      ? readInteger(json, 'max_legal_moves')
      : 3;
  if (maxLegalMoves < 1 || maxLegalMoves > 3) {
    throw const MergeRelayProtocolException('Invalid max_legal_moves');
  }
  final hasTwo = json.containsKey('spawn_two_weight');
  final hasFour = json.containsKey('spawn_four_weight');
  final two = json['spawn_two_weight'];
  final four = json['spawn_four_weight'];
  if (hasTwo != hasFour || (hasTwo && (two is! int || four is! int))) {
    throw const MergeRelayProtocolException('Invalid spawn weights');
  }
  final weights = hasTwo
      ? MergeSpawnWeights(
          spawnTwoWeight: two as int,
          spawnFourWeight: four as int,
        )
      : null;
  return MergeRelayCheckpoint(
    state: state,
    maxLegalMoves: maxLegalMoves,
    contentId: relayOptionalId(json, 'content_id'),
    contentVersion: relayContentVersion(json, 'content_version'),
    spawnWeights: weights,
  );
}

MergeRelayChallenge parseChallenge(Object? value) {
  final json = asJsonObject(value, 'challenge');
  requireFields(
    json,
    {
      'challenge_id',
      'creator_alias',
      'mode',
      'origin_mode',
      'config_revision',
      'checkpoint',
      'checkpoint_hash',
      'parent_challenge_id',
      'status',
      'created_at',
    },
    'challenge',
    optional: {'payload_hash'},
  );
  final checkpoint = parseCheckpoint(json['checkpoint']);
  final hash = readText(json, 'checkpoint_hash', 64);
  if (!RegExp(r'^[a-f0-9]{64}$').hasMatch(hash) ||
      checkpoint.checkpointHash != hash) {
    throw const MergeRelayProtocolException('Checkpoint hash mismatch');
  }
  final payloadHash = relayOptionalHash(json, 'payload_hash');
  final parentChallengeId = relayNullableId(json, 'parent_challenge_id');
  final mode = relayMode(json, 'mode');
  final originMode = relayMode(json, 'origin_mode');
  final configRevision = relayPositiveInt(json, 'config_revision');
  if (payloadHash != null &&
      payloadHash !=
          sha256Hex({
            'checkpoint': {
              'board': checkpoint.state.board.cells,
              'content_id': checkpoint.contentId,
              'content_version': checkpoint.contentVersion,
              'max_legal_moves': checkpoint.maxLegalMoves,
              'move_count': checkpoint.state.moveCount,
              'rng_state': checkpoint.state.rngState,
              'rule_version': checkpoint.state.ruleVersion,
              'score': checkpoint.state.score,
              'seed': checkpoint.state.seed,
              'spawn_four_weight': checkpoint.spawnWeights?.spawnFourWeight,
              'spawn_two_weight': checkpoint.spawnWeights?.spawnTwoWeight,
            },
            'config_revision': configRevision,
            'mode': mode.name,
            'origin_mode': originMode.name,
            'parent_challenge_id': parentChallengeId,
          })) {
    throw const MergeRelayProtocolException('Challenge payload hash mismatch');
  }
  return MergeRelayChallenge(
    challengeId: relayId(json, 'challenge_id'),
    creatorAlias: readText(json, 'creator_alias', 40),
    mode: mode,
    originMode: originMode,
    configRevision: configRevision,
    checkpoint: checkpoint,
    checkpointHash: hash,
    payloadHash: payloadHash,
    parentChallengeId: parentChallengeId,
    status: relayChallengeStatus(json),
    createdAt: readDate(json, 'created_at'),
  );
}

MergeRelayAttempt parseAttempt(Object? value) {
  final json = asJsonObject(value, 'attempt');
  requireFields(json, {
    'attempt_id',
    'challenge_id',
    'environment',
    'recipient_subject',
    'checkpoint',
    'moves',
    'max_legal_moves',
    'status',
    'reservation_key',
    'reserved_at',
    'expires_at',
    'version',
    'result_id',
    'updated_at',
  }, 'attempt');
  final moves = json['moves'];
  if (moves is! List) throw const MergeRelayProtocolException('Invalid moves');
  final maxLegalMoves = relayBoundedInt(json, 'max_legal_moves');
  if (moves.length > maxLegalMoves) {
    throw const MergeRelayProtocolException('Attempt exceeds move budget');
  }
  final version = readInteger(json, 'version');
  if (version < 0) throw const MergeRelayProtocolException('Invalid version');
  return MergeRelayAttempt(
    attemptId: relayId(json, 'attempt_id'),
    challengeId: relayId(json, 'challenge_id'),
    environment: relayEnvironment(json, 'environment'),
    recipientSubject: readText(json, 'recipient_subject', 128),
    checkpoint: parseCheckpoint(json['checkpoint']),
    moves: List.unmodifiable(moves.map(relayDirection)),
    maxLegalMoves: maxLegalMoves,
    status: relayAttemptStatus(json),
    reservationKey: readText(json, 'reservation_key', 128),
    reservedAt: readDate(json, 'reserved_at'),
    expiresAt: readDate(json, 'expires_at'),
    version: version,
    resultId: relayNullableId(json, 'result_id'),
    updatedAt: readDate(json, 'updated_at'),
  );
}

MergeRelayResultEnvelope parseResult(
  Object? value, {
  MergeRelayChallenge? returnChallenge,
}) {
  final json = asJsonObject(value, 'result');
  requireFields(
    json,
    {
      'result_id',
      'attempt_id',
      'challenge_id',
      'recipient_subject',
      'environment',
      'score_delta',
      'final_score',
      'max_tile',
      'moves_used',
      'outcome',
      'mode',
      'origin_mode',
      'config_revision',
      'return_challenge_id',
      'created_at',
    },
    'result',
    optional: {'challenge_payload_hash'},
  );
  final scoreDelta = readInteger(json, 'score_delta');
  final finalScore = readInteger(json, 'final_score');
  final maxTile = readInteger(json, 'max_tile');
  final movesUsed = readInteger(json, 'moves_used');
  if (scoreDelta < 0 ||
      finalScore < 0 ||
      maxTile < 0 ||
      movesUsed < 0 ||
      movesUsed > 3) {
    throw const MergeRelayProtocolException('Invalid result metrics');
  }
  return MergeRelayResultEnvelope(
    resultId: relayId(json, 'result_id'),
    attemptId: relayId(json, 'attempt_id'),
    challengeId: relayId(json, 'challenge_id'),
    environment: relayEnvironment(json, 'environment'),
    recipientSubject: readText(json, 'recipient_subject', 128),
    scoreDelta: scoreDelta,
    finalScore: finalScore,
    maxTile: maxTile,
    movesUsed: movesUsed,
    outcome: relayOutcome(json),
    mode: relayMode(json, 'mode'),
    originMode: relayMode(json, 'origin_mode'),
    configRevision: relayPositiveInt(json, 'config_revision'),
    challengePayloadHash: relayOptionalHash(json, 'challenge_payload_hash'),
    returnChallengeId: relayNullableId(json, 'return_challenge_id'),
    createdAt: readDate(json, 'created_at'),
    returnChallenge: returnChallenge,
  );
}
