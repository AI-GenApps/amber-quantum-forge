import 'merge_codec.dart';
import 'merge_game.dart';

enum MergeRelayMode { rescue, daily, endless }

enum MergeAttemptOutcome { inProgress, completed, earlyFinish, terminal }

final class MergeCheckpoint {
  MergeCheckpoint({
    required this.state,
    this.maxLegalMoves = 3,
    this.contentId,
    this.contentVersion,
    this.parentChallengeId,
  }) {
    if (state.isTerminal) {
      throw const FormatException('A Merge checkpoint must be playable');
    }
    if (maxLegalMoves < 1 || maxLegalMoves > 3) {
      throw ArgumentError.value(maxLegalMoves, 'maxLegalMoves');
    }
    _validateOptionalId(contentId, 'contentId');
    _validateOptionalId(contentVersion, 'contentVersion');
    _validateOptionalId(parentChallengeId, 'parentChallengeId');
  }

  factory MergeCheckpoint.fromState(
    MergeGameState state, {
    int maxLegalMoves = 3,
    String? contentId,
    String? contentVersion,
    String? parentChallengeId,
  }) => MergeCheckpoint(
    state: state,
    maxLegalMoves: maxLegalMoves,
    contentId: contentId,
    contentVersion: contentVersion,
    parentChallengeId: parentChallengeId,
  );

  factory MergeCheckpoint.fromJson(Map<String, Object?> json) {
    const stateFields = {
      'board',
      'score',
      'move_count',
      'seed',
      'rng_state',
      'rule_version',
    };
    const metadataFields = {
      'max_legal_moves',
      'content_id',
      'content_version',
      'parent_challenge_id',
    };
    if (json.keys.any(
      (key) => !stateFields.contains(key) && !metadataFields.contains(key),
    )) {
      throw const FormatException('Unexpected checkpoint fields');
    }
    final stateJson = <String, Object?>{
      for (final key in stateFields) key: json[key],
    };
    final state = MergeGameState.fromWireJson(stateJson);
    final maxLegalMoves = json['max_legal_moves'];
    final contentId = json['content_id'];
    final contentVersion = json['content_version'];
    final parentChallengeId = json['parent_challenge_id'];
    if (maxLegalMoves != null && maxLegalMoves is! int) {
      throw const FormatException('Invalid checkpoint move budget');
    }
    if (contentId != null && contentId is! String ||
        contentVersion != null && contentVersion is! String ||
        parentChallengeId != null && parentChallengeId is! String) {
      throw const FormatException('Invalid checkpoint metadata');
    }
    return MergeCheckpoint(
      state: state,
      maxLegalMoves: maxLegalMoves as int? ?? 3,
      contentId: contentId as String?,
      contentVersion: contentVersion as String?,
      parentChallengeId: parentChallengeId as String?,
    );
  }

  final MergeGameState state;
  final int maxLegalMoves;
  final String? contentId;
  final String? contentVersion;
  final String? parentChallengeId;

  Map<String, Object?> toWireJson() => state.toWireJson();

  Map<String, Object?> toJson() => {
    ...state.toWireJson(),
    'max_legal_moves': maxLegalMoves,
    if (contentId != null) 'content_id': contentId,
    if (contentVersion != null) 'content_version': contentVersion,
    if (parentChallengeId != null) 'parent_challenge_id': parentChallengeId,
  };

  String get checkpointHash => sha256Hex(toWireJson());
}

final class MergeChallenge {
  MergeChallenge({
    required this.challengeId,
    required this.mode,
    required this.checkpoint,
    required this.creatorAlias,
    this.parentChallengeId,
    String? payloadHash,
    this.schemaVersion = 1,
  }) : payloadHash =
           payloadHash ??
           sha256Hex(
             _challengeHashPayload(
               challengeId: challengeId,
               mode: mode,
               checkpoint: checkpoint,
               creatorAlias: creatorAlias,
               parentChallengeId: parentChallengeId,
               schemaVersion: schemaVersion,
             ),
           ) {
    if (schemaVersion != 1) {
      throw ArgumentError.value(schemaVersion, 'schemaVersion');
    }
    _validateId(challengeId, 'challengeId');
    _validateText(creatorAlias, 'creatorAlias', maxLength: 64);
    _validateOptionalId(parentChallengeId, 'parentChallengeId');
    if (!RegExp(r'^[a-f0-9]{64}$').hasMatch(this.payloadHash)) {
      throw ArgumentError.value(this.payloadHash, 'payloadHash');
    }
  }

  factory MergeChallenge.fromJson(Map<String, Object?> json) {
    const fields = {
      'schema_version',
      'challenge_id',
      'mode',
      'checkpoint',
      'creator_alias',
      'parent_challenge_id',
      'payload_hash',
    };
    if (json.keys.any((key) => !fields.contains(key)) ||
        json.length != fields.length) {
      throw const FormatException('Unexpected Merge challenge fields');
    }
    final schemaVersion = json['schema_version'];
    final challengeId = json['challenge_id'];
    final mode = json['mode'];
    final checkpoint = json['checkpoint'];
    final creatorAlias = json['creator_alias'];
    final parentChallengeId = json['parent_challenge_id'];
    final payloadHash = json['payload_hash'];
    if (schemaVersion is! int ||
        challengeId is! String ||
        mode is! String ||
        checkpoint is! Map ||
        creatorAlias is! String ||
        (parentChallengeId != null && parentChallengeId is! String) ||
        payloadHash is! String) {
      throw const FormatException('Invalid Merge challenge');
    }
    final parsedMode = _parseMode(mode);
    final result = MergeChallenge(
      schemaVersion: schemaVersion,
      challengeId: challengeId,
      mode: parsedMode,
      checkpoint: MergeCheckpoint.fromJson(checkpoint.cast<String, Object?>()),
      creatorAlias: creatorAlias,
      parentChallengeId: parentChallengeId as String?,
      payloadHash: payloadHash,
    );
    if (result.payloadHash != sha256Hex(result._hashPayload)) {
      throw const FormatException('Merge challenge hash mismatch');
    }
    return result;
  }

  final int schemaVersion;
  final String challengeId;
  final MergeRelayMode mode;
  final MergeCheckpoint checkpoint;
  final String creatorAlias;
  final String? parentChallengeId;
  final String payloadHash;

  Map<String, Object?> get _hashPayload => _challengeHashPayload(
    challengeId: challengeId,
    mode: mode,
    checkpoint: checkpoint,
    creatorAlias: creatorAlias,
    parentChallengeId: parentChallengeId,
    schemaVersion: schemaVersion,
  );

  Map<String, Object?> toJson() => {
    'schema_version': schemaVersion,
    'challenge_id': challengeId,
    'mode': mode.name,
    'checkpoint': checkpoint.toJson(),
    'creator_alias': creatorAlias,
    'parent_challenge_id': parentChallengeId,
    'payload_hash': payloadHash,
  };
}

Map<String, Object?> _challengeHashPayload({
  required int schemaVersion,
  required String challengeId,
  required MergeRelayMode mode,
  required MergeCheckpoint checkpoint,
  required String creatorAlias,
  required String? parentChallengeId,
}) => {
  'schema_version': schemaVersion,
  'challenge_id': challengeId,
  'mode': mode.name,
  'checkpoint': checkpoint.toJson(),
  'creator_alias': creatorAlias,
  'parent_challenge_id': parentChallengeId,
};

MergeRelayMode _parseMode(String value) => switch (value) {
  'rescue' => MergeRelayMode.rescue,
  'daily' => MergeRelayMode.daily,
  'endless' => MergeRelayMode.endless,
  _ => throw const FormatException('Unsupported Merge challenge mode'),
};

void _validateId(String value, String name, {int maxLength = 128}) {
  if (value.isEmpty ||
      value.length > maxLength ||
      !RegExp(r'^[A-Za-z0-9_.:-]+$').hasMatch(value)) {
    throw ArgumentError.value(value, name);
  }
}

void _validateText(String value, String name, {required int maxLength}) {
  if (value.isEmpty ||
      value.length > maxLength ||
      RegExp(r'[\u0000-\u001f]').hasMatch(value)) {
    throw ArgumentError.value(value, name);
  }
}

void _validateOptionalId(String? value, String name) {
  if (value != null) _validateId(value, name);
}
