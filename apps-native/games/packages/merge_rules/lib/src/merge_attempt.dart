import 'merge_board.dart';

enum MergeAttemptStatus { reserved, completed, abandoned, cancelled }

final class MergeAttempt {
  MergeAttempt({
    required this.challengeId,
    required this.reservationId,
    required this.maxLegalMoves,
    required Iterable<MergeDirection> acceptedMoves,
    this.status = MergeAttemptStatus.reserved,
    this.version = 0,
  }) : acceptedMoves = List.unmodifiable(acceptedMoves) {
    _validateId(challengeId, 'challengeId');
    _validateId(reservationId, 'reservationId');
    if (maxLegalMoves < 1 || maxLegalMoves > 3) {
      throw ArgumentError.value(maxLegalMoves, 'maxLegalMoves');
    }
    if (this.acceptedMoves.length > maxLegalMoves) {
      throw const FormatException('Attempt exceeds its legal move budget');
    }
    if (version < 0) throw ArgumentError.value(version, 'version');
  }

  final String challengeId;
  final String reservationId;
  final int maxLegalMoves;
  final List<MergeDirection> acceptedMoves;
  final MergeAttemptStatus status;
  final int version;

  MergeAttempt append(MergeDirection direction) {
    if (status != MergeAttemptStatus.reserved) {
      throw StateError('Attempt is no longer reserved');
    }
    if (acceptedMoves.length >= maxLegalMoves) {
      throw StateError('Attempt exceeds its legal move budget');
    }
    return MergeAttempt(
      challengeId: challengeId,
      reservationId: reservationId,
      maxLegalMoves: maxLegalMoves,
      acceptedMoves: [...acceptedMoves, direction],
      status: status,
      version: version + 1,
    );
  }

  MergeAttempt finish({bool abandoned = false}) {
    if (status != MergeAttemptStatus.reserved) {
      throw StateError('Attempt is no longer reserved');
    }
    return MergeAttempt(
      challengeId: challengeId,
      reservationId: reservationId,
      maxLegalMoves: maxLegalMoves,
      acceptedMoves: acceptedMoves,
      status: abandoned
          ? MergeAttemptStatus.abandoned
          : MergeAttemptStatus.completed,
      version: version + 1,
    );
  }

  Map<String, Object?> toJson() => {
    'challenge_id': challengeId,
    'reservation_id': reservationId,
    'max_legal_moves': maxLegalMoves,
    'accepted_moves': acceptedMoves.map((move) => move.name).toList(),
    'status': status.name,
    'version': version,
  };
}

void _validateId(String value, String name) {
  if (value.isEmpty ||
      value.length > 128 ||
      !RegExp(r'^[A-Za-z0-9_.:-]+$').hasMatch(value)) {
    throw ArgumentError.value(value, name);
  }
}
