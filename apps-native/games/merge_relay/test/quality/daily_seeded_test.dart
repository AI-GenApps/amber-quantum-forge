import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

/// Task 13: >=20 consecutive UTC Daily dates, each driven through the REAL
/// `MergeRelayGame` controller (via `startDaily`, itself driven by a
/// `FixedClock` rather than the system clock) to a reachable terminal
/// state, proving each date's own documented seed along the way.
///
/// `startDaily`'s seed formula (`_mergeRelayUtcDate`/`_mergeRelayDailySeed`
/// in `lib/src/merge_relay_seed.dart`) is a private, same-library helper —
/// unreachable from a `package:merge_relay/...` import — so it's
/// reproduced verbatim here as the documented algorithm under test; a
/// divergence between this copy and the game's own private implementation
/// would fail every case below on the seed assertion.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('20 consecutive UTC daily dates each reach a terminal result with the '
      'documented seed', () async {
    var day = DateTime.utc(2026, 1, 1);
    for (var index = 0; index < 20; index += 1) {
      final date = day;
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final game = MergeRelayGame(
        context: context,
        saveStore: MemorySaveStore(),
        clock: FixedClock(date),
      );
      await game.restore();
      game.completeTutorial(skipped: true);
      game.startDaily();

      final dateString = _utcDate(date);
      expect(
        game.state.value.seed,
        _dailySeed(dateString),
        reason: 'date $dateString',
      );
      expect(game.mode.value, MergeRelayMode.daily, reason: dateString);

      var guard = 0;
      while (!game.roundComplete.value) {
        guard += 1;
        expect(
          guard,
          lessThan(2000),
          reason: 'date $dateString never reached a result',
        );
        game.move(_policyMove(game.state.value));
      }

      expect(game.result.value, isNotNull, reason: dateString);
      expect(
        game.result.value!.score,
        game.state.value.score,
        reason: 'date $dateString produced an inconsistent score',
      );
      game.dispose();
      day = day.add(const Duration(days: 1));
    }
  });
}

const _cornerBias = [
  MergeDirection.down,
  MergeDirection.left,
  MergeDirection.up,
  MergeDirection.right,
];

/// Same weak, deliberately-terminating policy as
/// `endless_seeded_runs_test.dart` — see that file for why a
/// merge-maximizing policy is unsuitable for a bounded test.
MergeDirection _policyMove(MergeGameState state) {
  const rules = MergeRules();
  for (final direction in _cornerBias) {
    if (rules.apply(state, direction).scoreDelta > 0) return direction;
  }
  for (final direction in _cornerBias) {
    if (rules.apply(state, direction).changed) return direction;
  }
  return _cornerBias.first;
}

String _utcDate(DateTime value) {
  final utc = value.toUtc();
  return '${utc.year.toString().padLeft(4, '0')}-'
      '${utc.month.toString().padLeft(2, '0')}-'
      '${utc.day.toString().padLeft(2, '0')}';
}

int _dailySeed(String date) {
  var seed = 17;
  for (final code in date.codeUnits) {
    seed = ((seed * 31) + code) & maxMergeSeed;
  }
  return seed == 0 ? 1 : seed;
}
