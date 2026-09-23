/// Pure bot move-selection strategies for `ludo_rules`.
///
/// A bot strategy only *chooses which token to move* once a roll has
/// already been made (`state.phase == LudoMatchPhase.awaitingMove`) — it
/// never rolls dice itself; the engine/service owns rolling (see
/// `ludo_engine.dart`'s `rollDice`). Strategies are pure functions over
/// [LudoMatchState] and [legalMoves]; the only randomness they use is the
/// caller-injected [DeterministicRng], mirroring the dice-source injection
/// pattern already required by the engine so bot play stays reproducible
/// for replay fixtures.
library;

import 'package:platform_core/platform_core.dart';

import 'ludo_board.dart';
import 'ludo_engine.dart';
import 'ludo_models.dart';

const _board = LudoBoard();

/// A pure function that picks one of `legalMoves(state)` to play.
abstract interface class LudoBotStrategy {
  /// Human-readable difficulty id, matching `bin/replay_fixture.dart`'s
  /// `--bot` flag values (`easy`/`medium`/`hard`).
  String get id;

  /// Chooses a token id to move. `state.phase` must be
  /// [LudoMatchPhase.awaitingMove] and `legalMoves(state)` must be
  /// non-empty; [random] drives any tie-break between otherwise-equal
  /// candidates.
  int selectMove(LudoMatchState state, DeterministicRng random);
}

/// Resolves a [LudoBotStrategy] by its `--bot` flag / fixture `id`
/// (`easy`/`medium`/`hard`). Throws [ArgumentError] for any other value,
/// including `none` (dice-only play has no bot strategy at all — callers
/// should simply not invoke one).
LudoBotStrategy ludoBotStrategyById(String id) {
  switch (id) {
    case 'easy':
      return const EasyBotStrategy();
    case 'medium':
      return const MediumBotStrategy();
    case 'hard':
      return const HardBotStrategy();
    default:
      throw ArgumentError.value(id, 'id', 'Unknown bot difficulty');
  }
}

/// Picks a uniformly random legal move.
final class EasyBotStrategy implements LudoBotStrategy {
  const EasyBotStrategy();

  @override
  String get id => 'easy';

  @override
  int selectMove(LudoMatchState state, DeterministicRng random) {
    final moves = legalMoves(state);
    if (moves.isEmpty) {
      throw StateError('selectMove called with no legal moves');
    }
    return moves[random.nextInt(moves.length)];
  }
}

/// Prefers, in order: (1) finishing a token, (2) capturing an opponent,
/// (3) exiting a token from the yard, (4) otherwise a random legal move.
final class MediumBotStrategy implements LudoBotStrategy {
  const MediumBotStrategy();

  @override
  String get id => 'medium';

  @override
  int selectMove(LudoMatchState state, DeterministicRng random) =>
      _mediumOrHardChoice(state, random, preferSafestAndFarthest: false);
}

/// Same priority ladder as [MediumBotStrategy], plus: (5) among the
/// remaining candidates (no finish/capture/yard-exit available), first
/// discards any candidate that would land on a cell an opponent could
/// capture with a single die roll next turn — *unless every candidate is
/// equally vulnerable*, in which case none is discarded (there is no
/// "equally-good alternative" to prefer) — and (6) among what remains,
/// prefers the token with the greatest path distance already traveled,
/// falling back to a random tie-break.
final class HardBotStrategy implements LudoBotStrategy {
  const HardBotStrategy();

  @override
  String get id => 'hard';

  @override
  int selectMove(LudoMatchState state, DeterministicRng random) =>
      _mediumOrHardChoice(state, random, preferSafestAndFarthest: true);
}

/// Classifies what a candidate legal move would do, computed analytically
/// (mirroring `ludo_engine.dart`'s `applyMove`) without mutating state.
final class _MoveOutlook {
  const _MoveOutlook({
    required this.tokenId,
    required this.exitsYard,
    required this.finishes,
    required this.captures,
    required this.distanceTraveled,
    required this.landingIsVulnerable,
  });

  final int tokenId;
  final bool exitsYard;
  final bool finishes;
  final bool captures;

  /// The token's path position *before* this move (higher = further along).
  final int distanceTraveled;

  /// Whether the token's position *after* this move sits on a shared-track
  /// cell that an opponent could reach (and thus capture on) with a single
  /// die roll `1..6` next turn.
  final bool landingIsVulnerable;
}

_MoveOutlook _outlookFor(LudoMatchState state, int tokenId) {
  final roll = state.currentRoll!;
  final playerIndex = state.currentPlayerIndex;
  final player = state.players[playerIndex];
  final token = player.tokens.firstWhere((t) => t.id == tokenId);
  final wasYard = token.state(state.ruleset) == LudoTokenState.yard;
  final newPosition = wasYard ? 0 : token.pathPosition + roll;
  final finishes = newPosition == state.ruleset.pathLength;

  var captures = false;
  var landingIsVulnerable = false;
  if (!finishes && _board.isOnSharedTrack(state.ruleset, newPosition)) {
    final landingCell = _board.absoluteCellOf(player.color, newPosition);
    if (!_board.isSafeCell(landingCell)) {
      for (
        var otherIndex = 0;
        otherIndex < state.players.length;
        otherIndex++
      ) {
        if (otherIndex == playerIndex) continue;
        final other = state.players[otherIndex];
        for (final otherToken in other.tokens) {
          if (otherToken.state(state.ruleset) != LudoTokenState.active) {
            continue;
          }
          if (!_board.isOnSharedTrack(state.ruleset, otherToken.pathPosition)) {
            continue;
          }
          final otherCell = _board.absoluteCellOf(
            other.color,
            otherToken.pathPosition,
          );
          if (otherCell == landingCell) {
            captures = true;
          }
          // Vulnerability: could this opponent reach `landingCell` with a
          // single die value 1..6 from its *current* position (i.e. after
          // our move completes and it becomes their turn)?
          for (var die = 1; die <= 6; die++) {
            final reachable = otherToken.pathPosition + die;
            if (reachable > state.ruleset.pathLength) continue;
            if (!_board.isOnSharedTrack(state.ruleset, reachable)) continue;
            if (_board.absoluteCellOf(other.color, reachable) == landingCell) {
              landingIsVulnerable = true;
            }
          }
        }
      }
    }
  }

  return _MoveOutlook(
    tokenId: tokenId,
    exitsYard: wasYard,
    finishes: finishes,
    captures: captures,
    distanceTraveled: wasYard ? -1 : token.pathPosition,
    landingIsVulnerable: landingIsVulnerable,
  );
}

int _mediumOrHardChoice(
  LudoMatchState state,
  DeterministicRng random, {
  required bool preferSafestAndFarthest,
}) {
  final moves = legalMoves(state);
  if (moves.isEmpty) {
    throw StateError('selectMove called with no legal moves');
  }
  final outlooks = [for (final id in moves) _outlookFor(state, id)];

  final finishers = outlooks.where((o) => o.finishes).toList();
  if (finishers.isNotEmpty) return _pickRandom(finishers, random).tokenId;

  final capturers = outlooks.where((o) => o.captures).toList();
  if (capturers.isNotEmpty) return _pickRandom(capturers, random).tokenId;

  final yardExits = outlooks.where((o) => o.exitsYard).toList();
  if (yardExits.isNotEmpty) return _pickRandom(yardExits, random).tokenId;

  if (!preferSafestAndFarthest) {
    return _pickRandom(outlooks, random).tokenId;
  }

  // Hard, tier 5: avoid a landing cell an opponent could capture with a
  // single die roll next turn — but only when a non-vulnerable alternative
  // actually exists; if every remaining candidate is equally vulnerable,
  // there is no "equally-good alternative" to prefer, so none is discarded.
  final nonVulnerable = outlooks.where((o) => !o.landingIsVulnerable).toList();
  final pool = nonVulnerable.isNotEmpty ? nonVulnerable : outlooks;

  // Hard, tier 6: among what's left, prefer the greatest path distance
  // already traveled, falling back to a random tie-break.
  final maxDistance = pool
      .map((o) => o.distanceTraveled)
      .reduce((a, b) => a > b ? a : b);
  final farthest = pool
      .where((o) => o.distanceTraveled == maxDistance)
      .toList();
  return _pickRandom(farthest, random).tokenId;
}

_MoveOutlook _pickRandom(
  List<_MoveOutlook> candidates,
  DeterministicRng random,
) {
  if (candidates.length == 1) return candidates.first;
  return candidates[random.nextInt(candidates.length)];
}
