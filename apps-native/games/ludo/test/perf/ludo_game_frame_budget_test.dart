/// Frame-cost budget for the board scene (task 27).
///
/// Builds the representative worst case the task names — a full 4-seat
/// board (16 tokens), an in-flight hop animation, and active particle
/// bursts (capture, home arrival, win confetti) — then drives
/// `LudoGame.update` + `LudoGame.render` frame by frame, timing each one
/// with a [Stopwatch], and fails if the p90 frame cost exceeds the 16ms
/// (60fps) budget.
///
/// What this does and does not prove (also documented in
/// `docs-internal/gaming/ludo-performance-budgets.md`):
///
/// - It measures the Dart-side build/update/record cost of a frame
///   (component `update`, and `render` recorded into a `Canvas`). That is
///   the part under this app's control and it runs in a plain
///   `flutter test` host VM.
/// - It cannot measure GPU rasterization, which only a real device in
///   profile mode can. The manual on-device procedure for that is in the
///   doc above; it is a task 29 acceptance item.
/// - The host VM is JIT-compiled and on a developer/CI machine, so the
///   absolute numbers are not device numbers. The test asserts against the
///   real 16ms budget anyway: a regression that blows the budget even on a
///   fast host is certainly one on a phone, and a healthy scene is far
///   below it (typically 1-3ms), so it is not flaky. p90 (not max) is used
///   so one GC pause or scheduler hiccup cannot fail the run.
library;

import 'dart:ui';

import 'package:flame/components.dart' show Vector2;
import 'package:flame_test/flame_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_capture_particles.dart';
import 'package:ludo/src/game/ludo_confetti.dart';
import 'package:ludo/src/game/ludo_game.dart';
import 'package:ludo/src/game/ludo_home_arrival_burst.dart';
import 'package:ludo_rules/ludo_rules.dart';

const _frameBudgetMicros = 16000;
const _dt = 1 / 60;
const _warmupFrames = 30;
const _iterations = 40;
const _framesPerIteration = 14;
const _maxFramesPerIteration = 600;

LudoMatchState _fourSeatState() => LudoMatchState.initial(
  ruleset: LudoRuleset.quick,
  subjects: const ['seat-0', 'seat-1', 'seat-2', 'seat-3'],
);

void _renderFrame(LudoGame game) {
  final recorder = PictureRecorder();
  game.render(Canvas(recorder));
  recorder.endRecording().dispose();
}

int _p(List<int> sorted, double fraction) =>
    sorted[((sorted.length - 1) * fraction).round()];

void main() {
  testWithGame<LudoGame>(
    '4-seat board with a hop in flight and active particle bursts stays '
    'within the 16ms frame budget (p90)',
    () => LudoGame(initialState: _fourSeatState()),
    (game) async {
      await game.ready();
      game.onGameResize(Vector2(412, 915));

      for (var i = 0; i < _warmupFrames; i++) {
        game.update(_dt);
        _renderFrame(game);
      }

      expect(game.tokens, hasLength(16));

      var state = _fourSeatState();
      final frameMicros = <int>[];
      final stopwatch = Stopwatch();

      for (var iteration = 0; iteration < _iterations; iteration++) {
        final rolled = rollDice(state, FunctionDiceSource(() => 4));
        final moves = legalMoves(rolled.state);
        expect(moves, isNotEmpty);
        final moved = applyMove(rolled.state, moves.first);
        state = moved.state.copyWith(
          phase: LudoMatchPhase.awaitingRoll,
          currentPlayerIndex: (iteration + 1) % 4,
        );

        // Hop in flight: do not await; it completes while frames tick.
        var isSettled = false;
        final settled = game
            .applyEvents([...rolled.events, ...moved.events], state)
            .whenComplete(() => isSettled = true);
        game.add(LudoCaptureBurstComponent(position: Vector2(200, 200)));
        game.add(LudoHomeArrivalBurstComponent(position: Vector2(206, 206)));
        game.add(LudoConfettiComponent(boardSize: game.board.size));

        for (var f = 0; f < _framesPerIteration || !isSettled; f++) {
          if (f > _maxFramesPerIteration) fail('applyEvents never settled');
          stopwatch
            ..reset()
            ..start();
          game.update(_dt);
          _renderFrame(game);
          stopwatch.stop();
          frameMicros.add(stopwatch.elapsedMicroseconds);
          // Let the awaiting `applyEvents` continuation run between frames.
          await Future<void>.delayed(Duration.zero);
        }
        await settled;
      }

      final sorted = [...frameMicros]..sort();
      final p50 = _p(sorted, 0.5);
      final p90 = _p(sorted, 0.9);
      final worst = sorted.last;
      // Printed so the measured numbers land in the test log.
      // ignore: avoid_print
      print(
        'ludo frame cost over ${sorted.length} frames: '
        'p50=${p50}us p90=${p90}us max=${worst}us '
        '(budget ${_frameBudgetMicros}us, 16 tokens + hop + 3 particle '
        'systems)',
      );

      expect(
        p90,
        lessThanOrEqualTo(_frameBudgetMicros),
        reason: 'p90 frame update+render cost exceeded the 16ms budget',
      );
    },
  );
}
