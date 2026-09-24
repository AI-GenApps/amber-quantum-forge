import 'package:ludo_rules/ludo_rules.dart';
import 'package:test/test.dart';

LudoMatchState _state({
  required LudoRuleset ruleset,
  required List<List<LudoToken>> tokensByPlayer,
  int currentPlayerIndex = 0,
  LudoMatchPhase phase = LudoMatchPhase.awaitingRoll,
  int? currentRoll,
  int consecutiveSixes = 0,
  List<int> winnerOrder = const [],
}) {
  final players = [
    for (var i = 0; i < tokensByPlayer.length; i++)
      LudoPlayerState(
        seat: i,
        subject: 'seat-$i',
        color: LudoColor.values[i],
        tokens: tokensByPlayer[i],
      ),
  ];
  return LudoMatchState(
    ruleset: ruleset,
    players: players,
    currentPlayerIndex: currentPlayerIndex,
    phase: phase,
    currentRoll: currentRoll,
    consecutiveSixes: consecutiveSixes,
    winnerOrder: winnerOrder,
  );
}

void main() {
  group('yard exit', () {
    test('rolling a 6 unlocks yard tokens as legal moves', () {
      final state = _state(
        ruleset: LudoRuleset.classic,
        tokensByPlayer: [
          [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
          [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
        ],
      );
      final rolled = rollDice(state, ScriptedDiceSource([6]));
      expect(rolled.state.phase, LudoMatchPhase.awaitingMove);
      expect(legalMoves(rolled.state), [0, 1, 2, 3]);

      final moved = applyMove(rolled.state, 2);
      final token = moved.state.players[0].tokens[2];
      expect(token.pathPosition, 0);
      expect(token.state(LudoRuleset.classic), LudoTokenState.active);
      // Rolling a 6 grants a bonus roll for the same player.
      expect(moved.state.phase, LudoMatchPhase.awaitingRoll);
      expect(moved.state.currentPlayerIndex, 0);
    });

    test(
      'a non-6 roll leaves yard tokens with no legal move and passes the turn',
      () {
        final state = _state(
          ruleset: LudoRuleset.classic,
          tokensByPlayer: [
            [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
            [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
          ],
        );
        final rolled = rollDice(state, ScriptedDiceSource([4]));
        expect(rolled.state.phase, LudoMatchPhase.awaitingRoll);
        expect(rolled.state.currentPlayerIndex, 1);
        expect(rolled.events.map((e) => e.toJson()['type']), [
          'diceRolled',
          'turnForfeited',
        ]);
      },
    );
  });

  test('extra roll on 6 keeps the same player awaiting another roll', () {
    final state = _state(
      ruleset: LudoRuleset.classic,
      tokensByPlayer: [
        [
          LudoToken(id: 0, pathPosition: 10),
          LudoToken.inYard(1),
          LudoToken.inYard(2),
          LudoToken.inYard(3),
        ],
        [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
      ],
      currentRoll: 6,
      phase: LudoMatchPhase.awaitingMove,
      consecutiveSixes: 1,
    );
    final moved = applyMove(state, 0);
    expect(moved.state.players[0].tokens[0].pathPosition, 16);
    expect(moved.state.phase, LudoMatchPhase.awaitingRoll);
    expect(moved.state.currentPlayerIndex, 0);
    expect(moved.state.consecutiveSixes, 1);
  });

  test('a third consecutive six forfeits the turn without moving', () {
    final state = _state(
      ruleset: LudoRuleset.classic,
      tokensByPlayer: [
        [
          LudoToken(id: 0, pathPosition: 5),
          LudoToken.inYard(1),
          LudoToken.inYard(2),
          LudoToken.inYard(3),
        ],
        [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
      ],
      consecutiveSixes: 2,
    );
    final rolled = rollDice(state, ScriptedDiceSource([6]));
    expect(rolled.roll, 6);
    expect(rolled.state.currentPlayerIndex, 1);
    expect(rolled.state.consecutiveSixes, 0);
    // The token at path position 5 must not have moved.
    expect(rolled.state.players[0].tokens[0].pathPosition, 5);
    expect(rolled.events.map((e) => e.toJson()['type']), [
      'diceRolled',
      'turnForfeited',
    ]);
    expect(
      (rolled.events.last as LudoTurnForfeitedEvent).reason,
      'three-consecutive-sixes',
    );
  });

  group('capture', () {
    test(
      'landing on a non-safe cell sends the opponent token to the yard and grants a bonus roll',
      () {
        // Green starts at 13; green path position 5 -> absolute cell 18.
        // Red starts at 0; red path position 18 -> absolute cell 18 too, and
        // 18 is not one of the safe cells (0, 8, 13, 21, 26, 34, 39, 47).
        final state = _state(
          ruleset: LudoRuleset.classic,
          tokensByPlayer: [
            [
              LudoToken(id: 0, pathPosition: 15),
              LudoToken.inYard(1),
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
          currentPlayerIndex: 0,
          currentRoll: 3,
          phase: LudoMatchPhase.awaitingMove,
        );
        final moved = applyMove(state, 0);
        expect(moved.state.players[0].tokens[0].pathPosition, 18);
        expect(
          moved.state.players[1].tokens[0].pathPosition,
          ludoYardPathPosition,
        );
        expect(moved.state.phase, LudoMatchPhase.awaitingRoll);
        expect(moved.state.currentPlayerIndex, 0);
        final captureEvents = moved.events.whereType<LudoTokenCapturedEvent>();
        expect(captureEvents, hasLength(1));
        expect(captureEvents.first.seat, 1);
        expect(captureEvents.first.byseat, 0);
      },
    );

    test('a safe square grants immunity from capture', () {
      // Yellow starts at 26; yellow path position 0 -> absolute cell 26,
      // which is a start square and therefore safe.
      final state = _state(
        ruleset: LudoRuleset.classic,
        tokensByPlayer: [
          [
            LudoToken(id: 0, pathPosition: 23),
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
          [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
          [
            LudoToken(id: 0, pathPosition: 0),
            LudoToken.inYard(1),
            LudoToken.inYard(2),
            LudoToken.inYard(3),
          ],
        ],
        currentPlayerIndex: 0,
        currentRoll: 3,
        phase: LudoMatchPhase.awaitingMove,
      );
      final moved = applyMove(state, 0);
      expect(moved.state.players[0].tokens[0].pathPosition, 26);
      // Yellow (player 2) token must remain untouched.
      expect(moved.state.players[2].tokens[0].pathPosition, 0);
      expect(moved.events.whereType<LudoTokenCapturedEvent>(), isEmpty);
      // No bonus roll: roll wasn't a 6 and no capture/finish happened.
      expect(moved.state.phase, LudoMatchPhase.awaitingRoll);
      expect(moved.state.currentPlayerIndex, 1);
    });
  });

  test('reaching home grants a bonus roll and records tokenFinished', () {
    final ruleset = LudoRuleset.classic;
    final state = _state(
      ruleset: ruleset,
      tokensByPlayer: [
        [
          LudoToken(id: 0, pathPosition: ruleset.pathLength - 3),
          LudoToken.inYard(1),
          LudoToken.inYard(2),
          LudoToken.inYard(3),
        ],
        [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
      ],
      currentRoll: 3,
      phase: LudoMatchPhase.awaitingMove,
    );
    final moved = applyMove(state, 0);
    expect(moved.state.players[0].tokens[0].pathPosition, ruleset.pathLength);
    expect(
      moved.state.players[0].tokens[0].state(ruleset),
      LudoTokenState.finished,
    );
    expect(moved.events.whereType<LudoTokenFinishedEvent>(), hasLength(1));
    expect(moved.state.phase, LudoMatchPhase.awaitingRoll);
    expect(moved.state.currentPlayerIndex, 0);
  });

  test('overshooting the finish is not a legal move', () {
    final ruleset = LudoRuleset.classic;
    final state = _state(
      ruleset: ruleset,
      tokensByPlayer: [
        [
          LudoToken(id: 0, pathPosition: ruleset.pathLength - 2),
          LudoToken.inYard(1),
          LudoToken.inYard(2),
          LudoToken.inYard(3),
        ],
        [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
      ],
      currentRoll: 5,
    );
    expect(legalMoves(state), isEmpty);
  });

  test('auto-pass when the current player has no legal move at all', () {
    final ruleset = LudoRuleset.classic;
    final state = _state(
      ruleset: ruleset,
      tokensByPlayer: [
        [
          LudoToken(id: 0, pathPosition: ruleset.pathLength - 2),
          LudoToken.inYard(1),
          LudoToken.inYard(2),
          LudoToken.inYard(3),
        ],
        [for (var i = 0; i < 4; i++) LudoToken.inYard(i)],
      ],
    );
    // Rolling a 5 gives token 0 an illegal overshoot and every other token
    // is stuck in the yard without a 6: no legal move exists at all.
    final rolled = rollDice(state, ScriptedDiceSource([5]));
    expect(rolled.state.currentPlayerIndex, 1);
    expect(rolled.state.phase, LudoMatchPhase.awaitingRoll);
    expect(
      (rolled.events.last as LudoTurnForfeitedEvent).reason,
      'no-legal-move',
    );
  });

  test('classic starts every token in the yard; quick starts 2 of 4 tokens '
      'pre-released on the start square', () {
    final classicState = LudoMatchState.initial(
      ruleset: LudoRuleset.classic,
      subjects: ['a', 'b'],
    );
    final quickState = LudoMatchState.initial(
      ruleset: LudoRuleset.quick,
      subjects: ['a', 'b'],
    );

    // Classic: all tokens are in the yard, so a roll of 3 has no legal move.
    final classicRolled = rollDice(classicState, ScriptedDiceSource([3]));
    expect(classicRolled.state.phase, LudoMatchPhase.awaitingRoll);
    expect(classicRolled.state.currentPlayerIndex, 1);

    // Quick: tokens 0 and 1 are pre-released on the start square, so a
    // roll of 3 is immediately playable by the same player, moving one of
    // them forward.
    final quickTokenStates = quickState.players[0].tokens
        .map((t) => t.state(LudoRuleset.quick))
        .toList();
    expect(
      quickTokenStates,
      containsAllInOrder([
        LudoTokenState.active,
        LudoTokenState.active,
        LudoTokenState.yard,
        LudoTokenState.yard,
      ]),
    );
    final quickRolled = rollDice(quickState, ScriptedDiceSource([3]));
    expect(quickRolled.state.phase, LudoMatchPhase.awaitingMove);
    expect(quickRolled.state.currentPlayerIndex, 0);
    expect(legalMoves(quickRolled.state), [0, 1]);

    // A yard token in Quick still requires a 6 to release, same as
    // Classic.
    final quickYardOnly = rollDice(
      LudoMatchState(
        ruleset: LudoRuleset.quick,
        players: [
          quickState.players[0].copyWith(
            tokens: [
              LudoToken(id: 0, pathPosition: LudoRuleset.quick.pathLength),
              LudoToken(id: 1, pathPosition: LudoRuleset.quick.pathLength),
              LudoToken.inYard(2),
              LudoToken.inYard(3),
            ],
          ),
          quickState.players[1],
        ],
        currentPlayerIndex: 0,
        phase: LudoMatchPhase.awaitingRoll,
      ),
      ScriptedDiceSource([4]),
    );
    expect(quickYardOnly.state.phase, LudoMatchPhase.awaitingRoll);
    expect(
      (quickYardOnly.events.last as LudoTurnForfeitedEvent).reason,
      'no-legal-move',
    );
  });

  test('classic and quick share the same full-length track; only starting '
      'placement and win condition differ', () {
    expect(LudoRuleset.classic.stepsToHomeEntry, 51);
    expect(LudoRuleset.quick.stepsToHomeEntry, 51);
    expect(LudoRuleset.classic.pathLength, LudoRuleset.quick.pathLength);
    expect(LudoRuleset.classic.preReleasedTokensPerPlayer, 0);
    expect(LudoRuleset.quick.preReleasedTokensPerPlayer, 2);
    expect(LudoRuleset.classic.winCondition, LudoWinCondition.allTokensHome);
    expect(
      LudoRuleset.quick.winCondition,
      LudoWinCondition.oneHomeAndOneCapture,
    );
  });

  group('full match simulation', () {
    LudoMatchState playToCompletion(
      LudoRuleset ruleset,
      int playerCount,
      int seed,
    ) {
      var state = LudoMatchState.initial(
        ruleset: ruleset,
        subjects: List.generate(playerCount, (i) => 'seat-$i'),
      );
      // A simple deterministic PRNG local to this test, independent of the
      // engine, just to drive many rolls without depending on
      // platform_core from the rules-package test suite.
      var seedState = seed;
      int nextRoll() {
        seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
        return (seedState % 6) + 1;
      }

      final diceSource = FunctionDiceSource(nextRoll);
      var turns = 0;
      const maxTurns = 20000;
      while (!isTerminal(state)) {
        expect(turns, lessThan(maxTurns), reason: 'match did not terminate');
        turns++;
        final rolled = rollDice(state, diceSource);
        state = rolled.state;
        if (state.phase == LudoMatchPhase.awaitingMove) {
          final moves = List<int>.of(legalMoves(state))..sort();
          state = applyMove(state, moves.first).state;
        }
      }
      return state;
    }

    test(
      'a 2-player classic match always terminates with a full winner order',
      () {
        final finalState = playToCompletion(LudoRuleset.classic, 2, 1);
        expect(finalState.phase, LudoMatchPhase.finished);
        expect(finalState.winnerOrder, hasLength(1));
      },
    );

    test('a 4-player quick match always terminates with a full ranked order '
        '(winner plus every other player, unlike classic which leaves the '
        'sole last-place player implicit)', () {
      final finalState = playToCompletion(LudoRuleset.quick, 4, 99);
      expect(finalState.phase, LudoMatchPhase.finished);
      expect(finalState.winnerOrder, hasLength(4));
      expect(
        finalState.winnerOrder.toSet().length,
        finalState.winnerOrder.length,
      );
      final winner = finalState.players[finalState.winnerOrder.first];
      expect(winner.hasHomeToken(LudoRuleset.quick), isTrue);
      expect(winner.hasCaptured, isTrue);
    });
  });
}
