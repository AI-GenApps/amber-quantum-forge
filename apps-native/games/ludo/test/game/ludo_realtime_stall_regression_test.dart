/// Real-time regression coverage for the device-only bot-turn stall (task
/// 12h). Every other test that exercises [LudoDiceComponent]/
/// [LudoTokenComponent] animations (`ludo_dice_component_test.dart`,
/// `ludo_token_component_test.dart`, `ludo_full_match_controller_test.dart`)
/// drives them with a fake/manual clock — either calling `update(dt)`
/// directly in a tight loop, or pumping a `WidgetTester` with
/// `Duration.zero`-delay bot turns — and none of them ever stop calling
/// `update` mid-animation. That is exactly the gap that let the device-only
/// stall through: on a real device, Flutter's frame scheduler can stop
/// delivering `update` ticks to a running `FlameGame` (a screen timeout, the
/// app backgrounding, a dropped/coalesced frame under load) *after* a
/// roll/hop has already started, and nothing but a real wall-clock timer can
/// ever unstick a `Future` that only resolves from inside `update`.
///
/// These tests use real `dart:async` `Timer`s (this file's `test()` cases
/// run in a genuine, non-fake-async zone — see `flutter_test`'s guidance on
/// `tester.runAsync` for why a fake-clock `pumpAndSettle` can never exercise
/// this: there is no `WidgetTester` pump loop here at all, so nothing fakes
/// time) and deliberately stop ticking `update` mid-animation — reproducing
/// the exact device condition (frame scheduling stops, but real timers keep
/// running) that a fake-clock test cannot reach. Each assertion is bounded
/// by a real [Future.timeout] shorter than Dart's own test-runner timeout,
/// so a regression here fails fast with a clear message instead of hanging
/// the whole suite.
library;

import 'package:flame/components.dart' show Vector2;
import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_dice_component.dart';
import 'package:ludo/src/game/ludo_token_component.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

/// Generous real-time bound for every assertion below: comfortably longer
/// than any component's own real-time fallback duration (dice: tumble +
/// settle + 400ms buffer; token: hop/flight duration + 250ms buffer), so a
/// healthy fix always finishes well inside it, and a regression (a Future
/// that never resolves) fails the test instead of hanging the suite.
const _realTimeBound = Duration(seconds: 5);

void main() {
  group(
    'device-only stall regression (real timers, interrupted animation)',
    () {
      testWithFlameGame(
        'a dice roll whose frame loop stops ticking mid-tumble still '
        'resolves via the real-time fallback timer, not just update()',
        (game) async {
          final dice = LudoDiceComponent();
          await game.ensureAdd(dice);

          // Start a roll, then advance `update` only *once* (just past the
          // tumble's start) and never again — simulating a device frame
          // scheduler that stops delivering ticks to this component right
          // after a roll begins (screen timeout / backgrounded app / a
          // dropped frame under load). A pre-task-12h `LudoDiceComponent`
          // (no `_rollFallbackTimer`) would leave `rollTo`'s Future pending
          // forever in exactly this situation, permanently stalling
          // whatever awaited `LudoGame.applyEvents` (see
          // `game_board_screen.dart`'s `_rollDice`/`_runBotTurns`).
          final done = dice.rollTo(4);
          game.update(1 / 60);
          expect(
            dice.isRolling,
            isTrue,
            reason: 'roll should still be mid-tumble',
          );

          // No further `update` calls below this line — only real time
          // passing, exactly like a device whose Flame engine loop has
          // stopped ticking.
          await expectLater(
            done.timeout(
              _realTimeBound,
              onTimeout: () => fail(
                'LudoDiceComponent.rollTo never resolved within '
                '$_realTimeBound of real time after update() stopped '
                'ticking — the real-time fallback timer regressed (task '
                '12h stuck-turn root cause).',
              ),
            ),
            completes,
          );
          expect(dice.displayFace, 4);
          expect(dice.isRolling, isFalse);
        },
      );

      testWithFlameGame(
        'a multi-cell token hop whose frame loop stops ticking mid-hop still '
        'resolves and lands the token on its final cell',
        (game) async {
          final token = LudoTokenComponent(
            color: LudoColor.red,
            tokenId: 0,
            boardSize: Vector2.all(300),
            initialCell: (6, 1),
          );
          await game.ensureAdd(token);

          final done = token.hopTo([(6, 2), (6, 3), (6, 4)]);
          game.update(1 / 60);
          expect(
            token.isAnimating,
            isTrue,
            reason: 'hop should still be in flight',
          );

          // As above: no further `update` calls, only real time passing.
          await expectLater(
            done.timeout(
              _realTimeBound,
              onTimeout: () => fail(
                'LudoTokenComponent.hopTo never resolved within '
                '$_realTimeBound of real time after update() stopped '
                'ticking — the real-time fallback timer regressed (task '
                '12h stuck-turn root cause).',
              ),
            ),
            completes,
          );
          expect(token.currentCell, (6, 4));
          expect(token.isAnimating, isFalse);
        },
      );

      testWithFlameGame(
        'a capture flight-back whose frame loop stops ticking mid-flight '
        'still resolves and lands the token on its yard slot',
        (game) async {
          final token = LudoTokenComponent(
            color: LudoColor.blue,
            tokenId: 2,
            boardSize: Vector2.all(300),
            initialCell: (8, 6),
          );
          await game.ensureAdd(token);

          final done = token.flyTo((1, 10));
          game.update(1 / 60);
          expect(
            token.isAnimating,
            isTrue,
            reason: 'flight should still be in flight',
          );

          await expectLater(
            done.timeout(
              _realTimeBound,
              onTimeout: () => fail(
                'LudoTokenComponent.flyTo never resolved within '
                '$_realTimeBound of real time after update() stopped '
                'ticking — the real-time fallback timer regressed (task '
                '12h stuck-turn root cause).',
              ),
            ),
            completes,
          );
          expect(token.currentCell, (1, 10));
        },
      );

      testWithFlameGame(
        'a second rollTo started before the first has settled completes the '
        'orphaned first call instead of leaving its awaiter stranded',
        (game) async {
          final dice = LudoDiceComponent();
          await game.ensureAdd(dice);

          // This reproduces the other half of the stuck-turn mechanism this
          // task's Context/Decisions calls out: a rebuild (or a re-entrant
          // caller) starting a *second* roll while the first one's Future is
          // still unresolved. Without `rollTo`'s "complete the previous
          // orphaned completer" guard, `firstDone` would never resolve on
          // its own — nothing in this component's `update` loop ever
          // completes a completer that `_rollCompleter` no longer points to.
          final firstDone = dice.rollTo(2);
          game.update(1 / 60);
          final secondDone = dice.rollTo(5);

          await expectLater(
            firstDone.timeout(
              _realTimeBound,
              onTimeout: () => fail(
                'the orphaned first rollTo() call never resolved once a '
                'second rollTo() superseded it — an interrupted-animation '
                'regression of the task 12h stuck-turn fix.',
              ),
            ),
            completes,
          );
          // The second (current) roll still runs its full real-time course
          // to completion via ordinary `update` ticking.
          while (dice.isRolling) {
            game.update(1 / 60);
          }
          await secondDone;
          expect(dice.displayFace, 5);
        },
      );
    },
  );
}
