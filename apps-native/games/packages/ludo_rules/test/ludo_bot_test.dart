import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart';
import 'package:test/test.dart';

LudoMatchState _state({
  required LudoRuleset ruleset,
  required List<List<LudoToken>> tokensByPlayer,
  int currentPlayerIndex = 0,
  int currentRoll = 3,
  List<int> captureCounts = const [],
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
    ruleset: ruleset,
    players: players,
    currentPlayerIndex: currentPlayerIndex,
    phase: LudoMatchPhase.awaitingMove,
    currentRoll: currentRoll,
  );
}

void main() {
  final ruleset = LudoRuleset.classic;

  group('ludoBotStrategyById', () {
    test('resolves the three known tiers and rejects everything else', () {
      expect(ludoBotStrategyById('easy'), isA<EasyBotStrategy>());
      expect(ludoBotStrategyById('medium'), isA<MediumBotStrategy>());
      expect(ludoBotStrategyById('hard'), isA<HardBotStrategy>());
      expect(() => ludoBotStrategyById('none'), throwsArgumentError);
      expect(() => ludoBotStrategyById('nightmare'), throwsArgumentError);
    });
  });

  group('EasyBotStrategy', () {
    test('always selects a legal move across many random draws', () {
      const strategy = EasyBotStrategy();
      final state = _state(
        ruleset: ruleset,
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: 15),
            LudoToken(id: 1, pathPosition: 20),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
        ],
        currentRoll: 3,
      );
      final legal = legalMoves(state);
      final seen = <int>{};
      for (var seed = 1; seed <= 200; seed++) {
        final random = DeterministicRng(seed);
        final chosen = strategy.selectMove(state, random);
        expect(legal, contains(chosen));
        seen.add(chosen);
      }
      // Uniform-random over 200 draws across 2 candidates should hit both.
      expect(seen, containsAll(legal));
    });
  });

  for (final strategy in [const MediumBotStrategy(), const HardBotStrategy()]) {
    group('${strategy.runtimeType}', () {
      test('always selects a legal move (forced finish-available state)', () {
        // Player 0, token 0 is one square from finishing; token 1 could
        // instead capture player 1's token. Finish must win.
        final state = _state(
          ruleset: ruleset,
          tokensByPlayer: [
            [
              LudoToken(
                id: 0,
                pathPosition: ruleset.pathLength - 3,
              ), // ->finish
              LudoToken(id: 1, pathPosition: 15), // -> 18, captures
              LudoToken.inYard(2),
              LudoToken.inYard(3),
            ],
            [
              LudoToken(id: 0, pathPosition: 5), // green start(13)+5=18
              LudoToken.inYard(1),
              LudoToken.inYard(2),
              LudoToken.inYard(3),
            ],
          ],
          currentRoll: 3,
        );
        final legal = legalMoves(state);
        expect(legal, containsAll([0, 1]));
        final chosen = strategy.selectMove(state, DeterministicRng(7));
        expect(legal, contains(chosen));
        expect(chosen, 0, reason: 'finishing a token outranks capturing');
      });

      test('prefers capture over a plain move (forced capture-available)', () {
        final state = _state(
          ruleset: ruleset,
          tokensByPlayer: [
            [
              LudoToken(id: 0, pathPosition: 15), // -> 18, captures
              LudoToken(id: 1, pathPosition: 2), // -> 5, plain move
              LudoToken.inYard(2),
              LudoToken.inYard(3),
            ],
            [
              LudoToken(id: 0, pathPosition: 5), // green start(13)+5=18
              LudoToken.inYard(1),
              LudoToken.inYard(2),
              LudoToken.inYard(3),
            ],
          ],
          currentRoll: 3,
        );
        final legal = legalMoves(state);
        expect(legal, containsAll([0, 1]));
        final chosen = strategy.selectMove(state, DeterministicRng(11));
        expect(legal, contains(chosen));
        expect(chosen, 0, reason: 'capturing outranks a plain move');
      });

      test(
        'prefers exiting the yard over a plain move (forced yard-exit-available)',
        () {
          final state = _state(
            ruleset: ruleset,
            tokensByPlayer: [
              [
                LudoToken(id: 0, pathPosition: 2), // -> 8 (safe star), plain
                LudoToken.inYard(1), // -> 0, yard exit
                LudoToken.inYard(2),
                LudoToken.inYard(3),
              ],
              [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
            ],
            currentRoll: 6,
          );
          final legal = legalMoves(state);
          expect(legal, containsAll([0, 1, 2, 3]));
          final chosen = strategy.selectMove(state, DeterministicRng(13));
          expect(legal, contains(chosen));
          expect(
            chosen,
            isNot(0),
            reason: 'a yard exit outranks moving an already-active token',
          );
        },
      );

      test('never selects an illegal move when there is no preference '
          '(forced no-preference state)', () {
        final state = _state(
          ruleset: ruleset,
          tokensByPlayer: [
            [
              LudoToken(id: 0, pathPosition: 2), // -> 5, plain
              LudoToken(id: 1, pathPosition: 20), // -> 23, plain
              LudoToken.inYard(2),
              LudoToken.inYard(3),
            ],
            [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
          ],
          currentRoll: 3,
        );
        final legal = legalMoves(state);
        expect(legal, containsAll([0, 1]));
        for (var seed = 1; seed <= 50; seed++) {
          final chosen = strategy.selectMove(state, DeterministicRng(seed));
          expect(legal, contains(chosen));
        }
      });
    });
  }

  for (final strategy in [const MediumBotStrategy(), const HardBotStrategy()]) {
    group('${strategy.runtimeType} quick-aware capture weighting', () {
      test('favors an available capture over finishing a token when the '
          'acting player does not yet have a capture (quick)', () {
        // Same shape as the classic "finish outranks capture" fixture
        // above, but under Quick with the acting player still lacking a
        // capture: capturing should now outrank finishing, since a
        // capture is the only thing standing between this player and an
        // instant win.
        final state = _state(
          ruleset: LudoRuleset.quick,
          tokensByPlayer: [
            [
              LudoToken(
                id: 0,
                pathPosition: LudoRuleset.quick.pathLength - 3,
              ), // -> finish
              LudoToken(id: 1, pathPosition: 15), // -> 18, captures
              LudoToken.inYard(2),
              LudoToken.inYard(3),
            ],
            [
              LudoToken(id: 0, pathPosition: 5), // green start(13)+5=18
              LudoToken.inYard(1),
              LudoToken.inYard(2),
              LudoToken.inYard(3),
            ],
          ],
          currentRoll: 3,
        );
        final legal = legalMoves(state);
        expect(legal, containsAll([0, 1]));
        for (var seed = 1; seed <= 20; seed++) {
          final chosen = strategy.selectMove(state, DeterministicRng(seed));
          expect(
            chosen,
            1,
            reason:
                'capturing outranks finishing when this player has no '
                'capture yet in quick mode',
          );
        }
      });

      test('finishing outranks capturing once the acting player already has '
          'a capture (quick), matching classic priority', () {
        final state = _state(
          ruleset: LudoRuleset.quick,
          tokensByPlayer: [
            [
              LudoToken(
                id: 0,
                pathPosition: LudoRuleset.quick.pathLength - 3,
              ), // -> finish
              LudoToken(id: 1, pathPosition: 15), // -> 18, captures
              LudoToken.inYard(2),
              LudoToken.inYard(3),
            ],
            [
              LudoToken(id: 0, pathPosition: 5), // green start(13)+5=18
              LudoToken.inYard(1),
              LudoToken.inYard(2),
              LudoToken.inYard(3),
            ],
          ],
          currentRoll: 3,
          captureCounts: [1, 0],
        );
        final legal = legalMoves(state);
        expect(legal, containsAll([0, 1]));
        for (var seed = 1; seed <= 20; seed++) {
          final chosen = strategy.selectMove(state, DeterministicRng(seed));
          expect(
            chosen,
            0,
            reason: 'finishing outranks capturing once already captured',
          );
        }
      });
    });
  }

  group('HardBotStrategy tie-break', () {
    test('prefers the token with the greatest path distance traveled when '
        'no finish/capture/yard-exit is available', () {
      const strategy = HardBotStrategy();
      final state = _state(
        ruleset: ruleset,
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: 2), // -> 5, plain, farther back
            LudoToken(id: 1, pathPosition: 20), // -> 23, plain, farthest
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
        ],
        currentRoll: 3,
      );
      for (var seed = 1; seed <= 20; seed++) {
        final chosen = strategy.selectMove(state, DeterministicRng(seed));
        expect(chosen, 1, reason: 'token 1 has traveled farther');
      }
    });

    test('avoids a landing cell capturable by an opponent next turn when a '
        'non-vulnerable alternative exists', () {
      const strategy = HardBotStrategy();
      // Token 0 would land on 18, reachable by the green opponent's token
      // at relative position 2 with a die of 3 next turn. Token 1 lands on
      // 39 (blue's start, a safe cell) — a non-vulnerable, if shorter,
      // move.
      final state = _state(
        ruleset: ruleset,
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: 15), // -> 18, vulnerable
            LudoToken(id: 1, pathPosition: 36), // -> 39, safe cell
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          [
            LudoToken(id: 0, pathPosition: 2), // green 13+2=15, reaches 18
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
        ],
        currentRoll: 3,
      );
      final legal = legalMoves(state);
      expect(legal, containsAll([0, 1]));
      for (var seed = 1; seed <= 20; seed++) {
        final chosen = strategy.selectMove(state, DeterministicRng(seed));
        expect(
          chosen,
          1,
          reason: 'token 1 is the safe alternative to the vulnerable move',
        );
      }
    });

    test('falls back to the farthest candidate when every option is equally '
        'vulnerable', () {
      const strategy = HardBotStrategy();
      // Both candidate landings (18 and 44) are reachable by an opponent
      // token next turn, so vulnerability cannot discriminate and the
      // strategy falls back to distance traveled (token 1 is farther).
      // Green (start=13) at relative 2 reaches absolute 18 with a 3.
      // Yellow (start=26) at relative 15 (absolute 41) reaches 44 with a 3.
      final fixed = _state(
        ruleset: ruleset,
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: 15), // -> 18, vulnerable
            LudoToken(id: 1, pathPosition: 41), // -> 44, vulnerable
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          [
            LudoToken(id: 0, pathPosition: 2), // green 13+2=15 -> reaches 18
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          [
            LudoToken(id: 0, pathPosition: 15), // yellow 26+15=41 -> reaches 44
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
        ],
        currentRoll: 3,
      );
      final legal = legalMoves(fixed);
      expect(legal, containsAll([0, 1]));
      for (var seed = 1; seed <= 20; seed++) {
        final chosen = strategy.selectMove(fixed, DeterministicRng(seed));
        expect(
          chosen,
          1,
          reason: 'both options are vulnerable, so distance traveled decides',
        );
      }
    });
  });
}
