import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'package:ludo/src/game/ludo_bot_turn_runner.dart';

/// A dice seed whose very first roll (via `DeterministicRng(seed)
/// .nextInt(6) + 1`) is deterministically a 6, verified out-of-band —
/// so a runner driven from this seed always earns at least one bonus
/// roll on its opening step.
const _seedRollingSix = 48;

/// A seed whose first roll is a non-six (verified out-of-band, see
/// `game_board_screen_test.dart`'s equivalent constant) — used wherever a
/// test needs a single-step bot turn with no bonus roll.
const _seedRollingFour = 1;

LudoMatchState _twoSeatQuickState() => LudoMatchState.initial(
  ruleset: LudoRuleset.quick,
  subjects: const ['local-0', 'bot-1'],
);

void main() {
  test(
    'a non-six roll drives exactly one roll step and one move step',
    () async {
      final state = _twoSeatQuickState().copyWith(currentPlayerIndex: 1);
      final rng = DeterministicRng(_seedRollingFour);
      final runner = LudoBotTurnRunner(
        seats: const [
          LudoBotSeat(isBot: false),
          LudoBotSeat(isBot: true, difficulty: 'easy'),
        ],
        delayBetweenSteps: Duration.zero,
      );

      final steps = <LudoBotTurnStep>[];
      final result = await runner.run(
        state,
        rng,
        onStep: (step) async => steps.add(step),
      );

      expect(steps, hasLength(2));
      expect(steps[0], isA<LudoBotRollStep>());
      expect(steps[1], isA<LudoBotMoveStep>());
      expect(steps.every((s) => s.seat == 1), isTrue);
      // Control returns to seat 0 (the human) once the bot's one-roll turn
      // resolves, since 4 was not a six.
      expect(result.currentPlayerIndex, 0);
      expect(result.phase, LudoMatchPhase.awaitingRoll);
    },
  );

  test('a six earns a bonus roll, driving another roll/move pair before '
      'control returns to the human seat', () async {
    final state = _twoSeatQuickState().copyWith(currentPlayerIndex: 1);
    final rng = DeterministicRng(_seedRollingSix);
    final runner = LudoBotTurnRunner(
      seats: const [
        LudoBotSeat(isBot: false),
        LudoBotSeat(isBot: true, difficulty: 'easy'),
      ],
      delayBetweenSteps: Duration.zero,
    );

    final steps = <LudoBotTurnStep>[];
    final result = await runner.run(
      state,
      rng,
      onStep: (step) async => steps.add(step),
    );

    // First roll (6) grants a bonus roll: at least two roll steps and two
    // move steps before the bot's turn ends (unless it rolled another 6,
    // in which case even more — but every step must still belong to seat
    // 1, and the sequence must end back on seat 0).
    expect(steps.length, greaterThanOrEqualTo(4));
    expect(steps.first, isA<LudoBotRollStep>());
    expect((steps.first as LudoBotRollStep).roll, 6);
    expect(steps.every((s) => s.seat == 1), isTrue);
    expect(result.currentPlayerIndex, 0);
  });

  test('never plays a human seat\'s turn: an already-human-turn state '
      'returns immediately with no steps', () async {
    final state = _twoSeatQuickState(); // currentPlayerIndex defaults to 0.
    final rng = DeterministicRng(_seedRollingFour);
    final runner = LudoBotTurnRunner(
      seats: const [
        LudoBotSeat(isBot: false),
        LudoBotSeat(isBot: true, difficulty: 'easy'),
      ],
      delayBetweenSteps: Duration.zero,
    );

    final steps = <LudoBotTurnStep>[];
    final result = await runner.run(
      state,
      rng,
      onStep: (step) async => steps.add(step),
    );

    expect(steps, isEmpty);
    expect(result, same(state));
  });

  test('resuming mid-turn (awaitingMove already set for the bot seat) only '
      'plays the pending move, never re-rolling', () async {
    final rolled = rollDice(
      _twoSeatQuickState().copyWith(currentPlayerIndex: 1),
      FunctionDiceSource(() => 4),
    );
    expect(rolled.state.phase, LudoMatchPhase.awaitingMove);

    final rng = DeterministicRng(_seedRollingFour);
    final runner = LudoBotTurnRunner(
      seats: const [
        LudoBotSeat(isBot: false),
        LudoBotSeat(isBot: true, difficulty: 'easy'),
      ],
      delayBetweenSteps: Duration.zero,
    );

    final steps = <LudoBotTurnStep>[];
    final result = await runner.run(
      rolled.state,
      rng,
      onStep: (step) async => steps.add(step),
    );

    expect(steps, hasLength(1));
    expect(steps.single, isA<LudoBotMoveStep>());
    expect(result.currentPlayerIndex, 0);
  });

  test('drives every consecutive bot seat across a 4-seat match before '
      'stopping on the next human seat', () async {
    // Seat 0 human, seats 1-3 bots; start mid-way through seat 1's turn
    // isn't needed — starting fresh at seat 1 with three consecutive bot
    // seats ahead of the human exercises multi-seat driving.
    final state = LudoMatchState.initial(
      ruleset: LudoRuleset.quick,
      subjects: const ['local-0', 'bot-1', 'bot-2', 'bot-3'],
    ).copyWith(currentPlayerIndex: 1);
    final rng = DeterministicRng(_seedRollingFour);
    final runner = LudoBotTurnRunner(
      seats: const [
        LudoBotSeat(isBot: false),
        LudoBotSeat(isBot: true, difficulty: 'easy'),
        LudoBotSeat(isBot: true, difficulty: 'medium'),
        LudoBotSeat(isBot: true, difficulty: 'hard'),
      ],
      delayBetweenSteps: Duration.zero,
    );

    final seatsSeen = <int>{};
    final result = await runner.run(
      state,
      rng,
      onStep: (step) async => seatsSeen.add(step.seat),
    );

    expect(seatsSeen, {1, 2, 3});
    expect(result.currentPlayerIndex, 0);
  });
}
