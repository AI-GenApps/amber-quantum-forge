import 'package:ludo_rules/ludo_rules.dart';
import 'package:test/test.dart';

void main() {
  test(
    'replay reproduces a full match exactly, including forfeits, captures and finishes',
    () {
      final ruleset = LudoRuleset.classic;
      final initial = LudoMatchState.initial(
        ruleset: ruleset,
        subjects: ['a', 'b'],
      );

      // A simple local PRNG, independent of the engine, just to drive a full
      // match's worth of rolls deterministically.
      var seedState = 1234;
      int nextRoll() {
        seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
        return (seedState % 6) + 1;
      }

      final diceSource = FunctionDiceSource(nextRoll);
      var state = initial;
      final events = <LudoReplayEvent>[];
      var turns = 0;
      const maxTurns = 20000;
      while (!isTerminal(state)) {
        expect(turns, lessThan(maxTurns), reason: 'match did not terminate');
        turns++;
        final rolled = rollDice(state, diceSource);
        state = rolled.state;
        events.addAll(rolled.events);
        if (state.phase == LudoMatchPhase.awaitingMove) {
          final moves = List<int>.of(legalMoves(state))..sort();
          final moved = applyMove(state, moves.first);
          state = moved.state;
          events.addAll(moved.events);
        }
      }
      // Sanity check the recorded log actually exercised captures/forfeits.
      expect(events.whereType<LudoTurnForfeitedEvent>(), isNotEmpty);

      final replayed = replay(
        events,
        ruleset: ruleset,
        initialPlayers: initial.players,
      );

      expect(replayed.toJson(), state.toJson());
    },
  );

  test('replay event JSON round-trips through toJson/fromJson', () {
    const events = [
      LudoDiceRolledEvent(seat: 0, roll: 6),
      LudoTokenMovedEvent(seat: 0, tokenId: 1, from: -1, to: 0),
      LudoTokenCapturedEvent(seat: 1, tokenId: 2, byseat: 0),
      LudoTokenFinishedEvent(seat: 0, tokenId: 1),
      LudoTurnForfeitedEvent(seat: 1, reason: 'no-legal-move'),
      LudoMatchFinishedEvent(winnerOrder: [0]),
    ];
    for (final event in events) {
      final roundTripped = LudoReplayEvent.fromJson(event.toJson());
      expect(roundTripped.toJson(), event.toJson());
    }
  });
}
