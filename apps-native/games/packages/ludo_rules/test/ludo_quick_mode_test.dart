// Task 12g: covers Quick mode's corrected rules — full-length track,
// per-player pre-released tokens, and the
// `LudoWinCondition.oneHomeAndOneCapture` win condition (win the instant a
// player has both a finished token and a capture, whichever happens
// second). See `tasks/epics/15-ludo-launch/12g-quick-mode-alignment.md`.
import 'package:ludo_rules/ludo_rules.dart';
import 'package:test/test.dart';

LudoMatchState _quickState({
  required List<List<LudoToken>> tokensByPlayer,
  List<int> captureCounts = const [],
  int currentPlayerIndex = 0,
  int? currentRoll,
  LudoMatchPhase phase = LudoMatchPhase.awaitingMove,
}) {
  final players = [
    for (var i = 0; i < tokensByPlayer.length; i++)
      LudoPlayerState(
        seat: i,
        subject: 'seat-$i',
        color: LudoColor.values[i],
        tokens: tokensByPlayer[i],
        captureCount: i < captureCounts.length ? captureCounts[i] : 0,
      ),
  ];
  return LudoMatchState(
    ruleset: LudoRuleset.quick,
    players: players,
    currentPlayerIndex: currentPlayerIndex,
    phase: phase,
    currentRoll: currentRoll,
  );
}

void main() {
  group('quick match setup', () {
    test('each player starts with exactly 2 tokens pre-released on the start '
        'square and 2 in the yard', () {
      final state = LudoMatchState.initial(
        ruleset: LudoRuleset.quick,
        subjects: ['a', 'b', 'c'],
      );
      for (final player in state.players) {
        final states = player.tokens
            .map((t) => t.state(LudoRuleset.quick))
            .toList();
        expect(
          states.where((s) => s == LudoTokenState.active).length,
          2,
          reason: 'player ${player.seat} should have 2 active tokens',
        );
        expect(
          states.where((s) => s == LudoTokenState.yard).length,
          2,
          reason: 'player ${player.seat} should have 2 yard tokens',
        );
        expect(
          player.tokens[0].pathPosition,
          0,
          reason: 'token 0 should be pre-released on the start square',
        );
        expect(
          player.tokens[1].pathPosition,
          0,
          reason: 'token 1 should be pre-released on the start square',
        );
        expect(player.tokens[2].pathPosition, ludoYardPathPosition);
        expect(player.tokens[3].pathPosition, ludoYardPathPosition);
      }
    });

    test(
      'classic starting placement is unaffected: all 4 tokens in the yard',
      () {
        final state = LudoMatchState.initial(
          ruleset: LudoRuleset.classic,
          subjects: ['a', 'b'],
        );
        for (final player in state.players) {
          expect(
            player.tokens.every((t) => t.pathPosition == ludoYardPathPosition),
            isTrue,
          );
        }
      },
    );

    test('a yard token in quick still requires rolling a 6 to release', () {
      final state = _quickState(
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: LudoRuleset.quick.pathLength),
            LudoToken(id: 1, pathPosition: LudoRuleset.quick.pathLength),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
        ],
        phase: LudoMatchPhase.awaitingRoll,
      );
      final rolledFour = rollDice(state, ScriptedDiceSource([4]));
      expect(rolledFour.state.phase, LudoMatchPhase.awaitingRoll);
      expect(
        (rolledFour.events.last as LudoTurnForfeitedEvent).reason,
        'no-legal-move',
      );

      final rolledSix = rollDice(state, ScriptedDiceSource([6]));
      expect(rolledSix.state.phase, LudoMatchPhase.awaitingMove);
      expect(legalMoves(rolledSix.state), contains(2));
      expect(legalMoves(rolledSix.state), contains(3));
    });
  });

  group('one-home-and-one-capture win condition', () {
    test('a home token without any capture does not win', () {
      final state = _quickState(
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: LudoRuleset.quick.pathLength - 2),
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
        ],
        currentRoll: 2,
      );
      final moved = applyMove(state, 0);
      expect(moved.events.whereType<LudoTokenFinishedEvent>(), hasLength(1));
      expect(moved.state.phase, isNot(LudoMatchPhase.finished));
      expect(moved.state.winnerOrder, isEmpty);
      expect(moved.state.players[0].hasHomeToken(LudoRuleset.quick), isTrue);
      expect(moved.state.players[0].hasCaptured, isFalse);
    });

    test('a capture followed later by a home-token arrival wins at the '
        'home-arrival moment', () {
      // Player 0 already has 1 capture; token 0 is one step from home.
      final state = _quickState(
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: LudoRuleset.quick.pathLength - 1),
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
        ],
        captureCounts: [1, 0],
        currentRoll: 1,
      );
      final moved = applyMove(state, 0);
      expect(moved.events.whereType<LudoTokenFinishedEvent>(), hasLength(1));
      expect(moved.state.phase, LudoMatchPhase.finished);
      expect(moved.state.winnerOrder.first, 0);
      expect(moved.events.whereType<LudoMatchFinishedEvent>(), hasLength(1));
    });

    test('a token already home followed later by a capture wins at the '
        'capture moment', () {
      // Player 0 already has a finished token; token 1 is about to
      // capture player 1's token 0.
      final state = _quickState(
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: LudoRuleset.quick.pathLength),
            LudoToken(id: 1, pathPosition: 15),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          [
            LudoToken(id: 0, pathPosition: 5),
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
        ],
        currentRoll: 3,
      );
      // Red (seat 0) starts at absolute cell 0; token 1's path position
      // 15 + roll 3 = 18 -> absolute cell 18. Green (seat 1) starts at
      // 13; its token 0 at path position 5 -> absolute cell 18 too, and
      // 18 is not a safe cell, so this move captures it.
      final moved = applyMove(state, 1);
      expect(moved.events.whereType<LudoTokenCapturedEvent>(), hasLength(1));
      expect(
        moved.state.players[1].tokens[0].pathPosition,
        ludoYardPathPosition,
        reason: 'quick still resets a captured token to the yard',
      );
      expect(moved.state.phase, LudoMatchPhase.finished);
      expect(moved.state.winnerOrder.first, 0);
    });

    test('winnerOrder ranks the remaining players by finished tokens, then '
        'captures, then progress, then seat', () {
      final state = _quickState(
        tokensByPlayer: [
          // Seat 0 wins this move.
          [
            LudoToken(id: 0, pathPosition: LudoRuleset.quick.pathLength - 1),
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          // Seat 1: 1 finished token, 0 captures, more progress than seat 2.
          [
            LudoToken(id: 0, pathPosition: LudoRuleset.quick.pathLength),
            LudoToken(id: 1, pathPosition: 10),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          // Seat 2: 0 finished tokens, 1 capture (ranks above seat 3).
          [
            LudoToken(id: 0, pathPosition: 5),
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          // Seat 3: 0 finished tokens, 0 captures, least progress.
          [
            LudoToken(id: 0, pathPosition: 1),
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
        ],
        captureCounts: [1, 0, 1, 0],
        currentRoll: 1,
      );
      final moved = applyMove(state, 0);
      expect(moved.state.phase, LudoMatchPhase.finished);
      expect(moved.state.winnerOrder, [0, 1, 2, 3]);
    });

    test('deadlock safety net: both players finishing all tokens with zero '
        'captures ever made still terminates the match', () {
      // Every token from both players is one step from home and neither
      // player has ever captured — the last finish should end the match
      // via the deadlock safety net (no further capture is ever possible
      // once every token is home), not hang forever.
      final ruleset = LudoRuleset.quick;
      final state = _quickState(
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: ruleset.pathLength),
            LudoToken(id: 1, pathPosition: ruleset.pathLength),
            LudoToken(id: 2, pathPosition: ruleset.pathLength),
            LudoToken(id: 3, pathPosition: ruleset.pathLength - 1),
          ],
          [
            LudoToken(id: 0, pathPosition: ruleset.pathLength),
            LudoToken(id: 1, pathPosition: ruleset.pathLength),
            LudoToken(id: 2, pathPosition: ruleset.pathLength),
            LudoToken(id: 3, pathPosition: ruleset.pathLength),
          ],
        ],
        currentRoll: 1,
      );
      final moved = applyMove(state, 3);
      expect(moved.state.phase, LudoMatchPhase.finished);
      expect(moved.state.winnerOrder, hasLength(2));
      expect(moved.state.winnerOrder.toSet(), {0, 1});
    });

    test('a lone player left with movable tokens is not falsely deadlocked '
        'when they already have a capture — they can still win later', () {
      // Seat 0 (acting) finishes their last token this move, becoming
      // fully finished with zero captures ever — normally a candidate
      // for the deadlock safety net. But seat 1 still has a movable
      // token *and* already has a capture from earlier in the match, so
      // seat 1 can still legitimately win later by finishing; the match
      // must NOT be force-ended here.
      final ruleset = LudoRuleset.quick;
      final state = _quickState(
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: ruleset.pathLength),
            LudoToken(id: 1, pathPosition: ruleset.pathLength),
            LudoToken(id: 2, pathPosition: ruleset.pathLength),
            LudoToken(id: 3, pathPosition: ruleset.pathLength - 1),
          ],
          [
            LudoToken(id: 0, pathPosition: ruleset.pathLength),
            LudoToken(id: 1, pathPosition: 10),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
        ],
        captureCounts: [0, 1],
        currentPlayerIndex: 0,
        currentRoll: 1,
      );
      final moved = applyMove(state, 3);
      expect(
        moved.state.phase,
        isNot(LudoMatchPhase.finished),
        reason:
            'seat 1 can still win later (already captured, still has a '
            'movable token) — not a real deadlock',
      );
    });

    test('classic win condition is unaffected: all tokens must be home', () {
      final ruleset = LudoRuleset.classic;
      final players = [
        LudoPlayerState(
          seat: 0,
          subject: 'seat-0',
          color: LudoColor.red,
          tokens: [
            LudoToken(id: 0, pathPosition: ruleset.pathLength - 1),
            LudoToken(id: 1, pathPosition: ruleset.pathLength),
            LudoToken(id: 2, pathPosition: ruleset.pathLength),
            LudoToken(id: 3, pathPosition: ruleset.pathLength),
          ],
          captureCount: 1,
        ),
        LudoPlayerState(
          seat: 1,
          subject: 'seat-1',
          color: LudoColor.green,
          tokens: [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
        ),
      ];
      final classicState = LudoMatchState(
        ruleset: ruleset,
        players: players,
        currentPlayerIndex: 0,
        phase: LudoMatchPhase.awaitingMove,
        currentRoll: 1,
      );
      // Even though this player already has a home token and a capture
      // (which would win instantly under Quick), Classic requires all 4
      // tokens finished — this move only finishes the 4th, so it wins under
      // Classic's own `allTokensHome` condition, not because of the
      // capture.
      final moved = applyMove(classicState, 0);
      expect(moved.state.phase, LudoMatchPhase.finished);
      expect(moved.state.winnerOrder.first, 0);
    });
  });
}
