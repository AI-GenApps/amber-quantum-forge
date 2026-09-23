import 'package:merge_rules/merge_rules.dart';

import 'merge_relay_gateway.dart';

final class MergeRelayPendingCreate {
  MergeRelayPendingCreate({
    required this.idempotencyKey,
    required this.creatorAlias,
    required this.checkpoint,
    this.mode = MergeRelayMode.rescue,
    this.maxLegalMoves,
    this.contentId,
    this.contentVersion,
    this.originMode,
    this.parentChallengeId,
  });

  factory MergeRelayPendingCreate.fromRequest(
    MergeRelayChallengeRequest request,
  ) => MergeRelayPendingCreate(
    idempotencyKey: request.idempotencyKey,
    creatorAlias: request.creatorAlias,
    checkpoint: MergeCheckpoint.fromState(
      request.checkpoint.state,
      maxLegalMoves: request.checkpoint.maxLegalMoves,
      contentId: request.checkpoint.contentId,
      contentVersion: request.checkpoint.contentVersion,
      parentChallengeId: request.checkpoint.parentChallengeId,
      spawnWeights: request.checkpoint.spawnWeights,
    ),
    mode: request.mode,
    maxLegalMoves: request.maxLegalMoves,
    contentId: request.contentId,
    contentVersion: request.contentVersion,
    originMode: request.originMode,
    parentChallengeId: request.parentChallengeId,
  );

  factory MergeRelayPendingCreate.fromJson(Object? raw) {
    if (raw is! Map) {
      throw const FormatException('Invalid pending relay create');
    }
    final json = raw.map<String, Object?>((key, value) {
      return MapEntry(key.toString(), value);
    });
    if (json['version'] != 1 ||
        json.keys.any((key) => !_fields.contains(key)) ||
        json.length != _fields.length) {
      throw const FormatException('Unsupported pending relay create');
    }
    final key = json['idempotency_key'];
    final alias = json['creator_alias'];
    final checkpoint = json['checkpoint'];
    if (key is! String || alias is! String || checkpoint is! Map) {
      throw const FormatException('Invalid pending relay request');
    }
    final mode = _mode(json['mode']);
    final maxLegalMoves = json['max_legal_moves'];
    if (maxLegalMoves != null && maxLegalMoves is! int) {
      throw const FormatException('Invalid pending relay move budget');
    }
    return MergeRelayPendingCreate(
      idempotencyKey: key,
      creatorAlias: alias,
      checkpoint: MergeCheckpoint.fromJson(
        checkpoint.map<String, Object?>((key, value) {
          return MapEntry(key.toString(), value);
        }),
      ),
      mode: mode,
      maxLegalMoves: maxLegalMoves as int?,
      contentId: _optionalText(json['content_id']),
      contentVersion: _optionalText(json['content_version']),
      originMode: _optionalMode(json['origin_mode']),
      parentChallengeId: _optionalText(json['parent_challenge_id']),
    );
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

  MergeRelayChallengeRequest toRequest() => MergeRelayChallengeRequest(
    idempotencyKey: idempotencyKey,
    creatorAlias: creatorAlias,
    checkpoint: checkpoint,
    mode: mode,
    maxLegalMoves: maxLegalMoves,
    contentId: contentId,
    contentVersion: contentVersion,
    originMode: originMode,
    parentChallengeId: parentChallengeId,
  );

  Map<String, Object?> toJson() => {
    'version': 1,
    'idempotency_key': idempotencyKey,
    'creator_alias': creatorAlias,
    'checkpoint': checkpoint.toJson(),
    'mode': mode.name,
    'max_legal_moves': maxLegalMoves,
    'content_id': contentId,
    'content_version': contentVersion,
    'origin_mode': originMode?.name,
    'parent_challenge_id': parentChallengeId,
  };

  static const _fields = {
    'version',
    'idempotency_key',
    'creator_alias',
    'checkpoint',
    'mode',
    'max_legal_moves',
    'content_id',
    'content_version',
    'origin_mode',
    'parent_challenge_id',
  };

  static MergeRelayMode _mode(Object? value) {
    if (value is! String) throw const FormatException('Invalid relay mode');
    return MergeRelayMode.values.firstWhere(
      (mode) => mode.name == value,
      orElse: () => throw const FormatException('Invalid relay mode'),
    );
  }

  static MergeRelayMode? _optionalMode(Object? value) {
    if (value == null) return null;
    return _mode(value);
  }

  static String? _optionalText(Object? value) {
    if (value == null) return null;
    if (value is! String || value.isEmpty || value.length > 128) {
      throw const FormatException('Invalid relay text');
    }
    return value;
  }
}
