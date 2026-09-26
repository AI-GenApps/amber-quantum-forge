/// Converts the server's wire `LudoMatchState` (`ludo_match_models.dart`,
/// mirroring `packages/api/src/games/ludo/contracts.ts`) into the
/// `ludo_rules` engine state `game_board_screen.dart`/`LudoGame` render.
///
/// Extracted from `game_board_screen.dart`'s original private
/// `_toEngineState` (task 25) so task 26's online-launch flows (room
/// create/join, matchmaking) can build the same engine state from a
/// create/join/match response *before* ever constructing a
/// `GameBoardScreen` — the two call sites must never drift into two
/// separate wire-to-engine mappings.
library;

import 'package:ludo_rules/ludo_rules.dart';

import 'ludo_match_models.dart' as ludo_wire;

/// See this library's doc comment. Throws [StateError] if [wire]'s `mode`
/// doesn't match a known [LudoRuleset] id — this can only happen if the
/// server and `ludo_rules` disagree on which modes exist, never from
/// ordinary gameplay data.
LudoMatchState ludoEngineStateFromWire(ludo_wire.LudoMatchState wire) {
  final ruleset = LudoRuleset.byId[wire.mode.toWire()];
  if (ruleset == null) {
    throw StateError('Unknown Ludo mode from server: ${wire.mode}');
  }
  return LudoMatchState(
    ruleset: ruleset,
    players: [
      for (final player in wire.players)
        LudoPlayerState(
          seat: player.seat,
          subject: player.subject,
          color: LudoColor.values.byName(player.color.toWire()),
          tokens: [
            for (final token in player.tokens)
              LudoToken(id: token.id, pathPosition: token.pathPosition),
          ],
          captureCount: player.captureCount,
        ),
    ],
    currentPlayerIndex: wire.currentPlayerIndex,
    phase: LudoMatchPhase.values.byName(wire.phase.name),
    currentRoll: wire.currentRoll,
    consecutiveSixes: wire.consecutiveSixes,
    winnerOrder: wire.winnerOrder,
  );
}

/// Whether [subject] identifies a server-assigned bot seat (`bot:<uuid>`,
/// per `packages/api/src/games/ludo/matchmaking-service.ts`'s bot-fill —
/// the same prefix room bot-fill and matchmaking bot-fill both use).
bool ludoSubjectIsBot(String subject) => subject.startsWith('bot:');
