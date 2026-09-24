/// Controller-level regression coverage for the stuck-turn and
/// black-canvas/dice-placement bugs fixed by this task (see
/// `tasks/epics/15-ludo-launch/12a-gameplay-bugfix.md`).
///
/// Every other test in this suite (tasks 03-12) constructs a screen/state
/// in isolation or drives the bot-turn runner alone with an instant
/// (`Duration.zero`) clock — never the *real* `game_board_screen.dart` +
/// `ludo_bot_turn_runner.dart` + `ludo_rules` stack end to end with real
/// (non-instant) dice-tumble/token-hop animations. That's exactly the gap
/// that let the stuck-turn bug through task 12's own test suite: this file
/// closes it by driving >=50 seeded full matches through the real
/// `GameBoardScreen` widget, asserting every one reaches results.
library;

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'package:ludo/src/game/ludo_game.dart';
import 'package:ludo/src/screens/game_board_screen.dart';
import 'package:ludo/src/screens/mode_setup_sheet.dart';
import 'package:ludo/src/state/ludo_local_save.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';
import 'package:ludo/src/telemetry/ludo_telemetry.dart';
import 'package:ludo/src/widgets/dice_zone.dart';

const _seatColors = LudoColor.values;

/// A fresh in-memory [LudoLocalSave] so every game in this file persists to
/// its own isolated store rather than production's real file-backed
/// `SaveStore`, matching `ludo_local_save_test.dart`'s fake.
LudoLocalSave _memorySave() => LudoLocalSave(
  saveStore: MemorySaveStore(),
  appContext: runtimeAppContext(identity: ludoLocalMatchIdentity),
);

List<LudoSeatConfig> _allBotSeats(int seatCount) => [
  for (var i = 0; i < seatCount; i++)
    LudoSeatConfig(color: _seatColors[i], isBot: true, botDifficulty: 'easy'),
];

List<LudoSeatConfig> _vsComputerSeats(int seatCount) => [
  for (var i = 0; i < seatCount; i++)
    LudoSeatConfig(
      color: _seatColors[i],
      isBot: i != 0,
      botDifficulty: i != 0 ? 'easy' : null,
    ),
];

List<LudoSeatIdentity> _identitiesFor(int seatCount) => [
  for (var i = 0; i < seatCount; i++)
    LudoSeatIdentity(name: 'Seat $i', avatarId: '${_seatColors[i].name}-face'),
];

Widget _wrap(Widget child) =>
    MaterialApp(theme: ThemeData(useMaterial3: true), home: child);

LudoGame _gameOf(WidgetTester tester) => tester
    .widget<GameWidget<LudoGame>>(find.byType(GameWidget<LudoGame>))
    .game!;

bool _hasFinished(MemoryTelemetrySink sink) =>
    sink.events.any((event) => event.name == 'ludo_match_finished');

/// Pumps [count] frames of [step] each — large enough that a single frame
/// always advances the dice tumble/settle and token hop-by-hop state
/// machines (see `ludo_dice_component.dart`/`ludo_token_component.dart`)
/// past at least one of their internal thresholds, so a bounded number of
/// frames reliably drives an entire bot sequence forward without needing
/// wall-clock-real delays.
Future<void> _pumpFrames(
  WidgetTester tester, {
  int count = 6,
  Duration step = const Duration(milliseconds: 200),
}) async {
  for (var i = 0; i < count; i++) {
    await tester.pump(step);
  }
}

/// Drives an all-bots-demo (or vs-Computer, with [driveHumanSeat] taps for
/// seat 0) match to completion, pumping in bounded [_pumpFrames] chunks up
/// to [maxChunks] times, and asserts `ludo_match_finished` was recorded —
/// i.e. every game reached results, matching task 12a's acceptance
/// criteria. A single stuck game fails this via the `expect` below rather
/// than hanging the test run, since chunks (not wall time) are bounded.
Future<void> _playToResults(
  WidgetTester tester, {
  required LudoRuleset ruleset,
  required int seatCount,
  required int seed,
  required bool driveHumanSeat,
  int maxChunks = 4000,
}) async {
  final config = LudoLocalMatchConfig(
    ruleset: ruleset,
    seats: driveHumanSeat
        ? _vsComputerSeats(seatCount)
        : _allBotSeats(seatCount),
    isComputerMatch: true,
  );
  final sink = MemoryTelemetrySink();
  await tester.pumpWidget(
    _wrap(
      GameBoardScreen(
        config: config,
        seatIdentities: _identitiesFor(seatCount),
        soundSettings: LudoSoundSettings(),
        diceSeed: seed,
        localSave: _memorySave(),
        telemetry: LudoTelemetry(sink: sink),
        botTurnDelay: Duration.zero,
      ),
    ),
  );
  await _pumpFrames(tester, count: 2);

  for (var chunk = 0; chunk < maxChunks && !_hasFinished(sink); chunk++) {
    if (driveHumanSeat) {
      await _maybeDriveHumanSeat(tester);
    }
    await _pumpFrames(tester);
  }

  expect(
    _hasFinished(sink),
    isTrue,
    reason:
        'ruleset=${ruleset.id} seats=$seatCount seed=$seed did not reach '
        'results within $maxChunks pump chunks — stuck turn regression',
  );
}

/// While it's seat 0's (the local human's) turn, taps the dice zone (if a
/// roll is owed) or the first legal token (if a move is owed) — driving
/// `GameBoardScreen._rollDice`/`_handleTokenTap` (the human seat's own
/// turn-taking code path) exactly as a real tap would, rather than the
/// bot-turn runner. Never calls into `ludo_rules` directly.
Future<void> _maybeDriveHumanSeat(WidgetTester tester) async {
  final game = _gameOf(tester);
  final state = game.matchState;
  if (state == null || state.currentPlayerIndex != 0) return;
  if (state.phase == LudoMatchPhase.awaitingRoll) {
    final zoneFinder = find.byType(DiceZone);
    if (zoneFinder.evaluate().isEmpty) return;
    final zone = tester.widget<DiceZone>(zoneFinder);
    if (!zone.enabled) return;
    await tester.tap(zoneFinder);
    return;
  }
  if (state.phase == LudoMatchPhase.awaitingMove) {
    final legal = legalMoves(state);
    if (legal.isEmpty) return;
    final color = state.players[state.currentPlayerIndex].color;
    game.onTokenTap?.call(color, legal.first);
  }
}

void main() {
  final combos = <(LudoRuleset, int)>[
    (LudoRuleset.classic, 2),
    (LudoRuleset.classic, 4),
    (LudoRuleset.quick, 2),
    (LudoRuleset.quick, 4),
  ];

  // >=50 all-bots-demo games (including seat 0), weighted toward Quick to
  // keep the suite's runtime reasonable. Since task 12g, Quick shares
  // Classic's full-length track and still requires a 6 to leave the yard
  // (`ludo_config.dart`) — it is no longer a shorter race — but its
  // `oneHomeAndOneCapture` win condition (`ludo_engine.dart`) still tends
  // to end a match sooner than Classic's "all 4 tokens home" requirement
  // in practice, so the extra Quick coverage stays cheap.
  final seedCountByCombo = {
    (LudoRuleset.classic, 2): 6,
    (LudoRuleset.classic, 4): 4,
    (LudoRuleset.quick, 2): 22,
    (LudoRuleset.quick, 4): 18,
  };
  final allBotsCases = <(LudoRuleset, int, int)>[];
  for (final combo in combos) {
    final (ruleset, seatCount) = combo;
    for (var i = 0; i < seedCountByCombo[combo]!; i++) {
      allBotsCases.add((ruleset, seatCount, 1000 + seatCount * 100 + i));
    }
  }
  assert(
    allBotsCases.length >= 50,
    'expected >=50 seeded all-bots-demo games, got ${allBotsCases.length}',
  );

  group('all-bots demo: >=50 seeded full matches reach results', () {
    for (final (ruleset, seatCount, seed) in allBotsCases) {
      testWidgets('${ruleset.id} ${seatCount}p seed $seed reaches results', (
        tester,
      ) async {
        await _playToResults(
          tester,
          ruleset: ruleset,
          seatCount: seatCount,
          seed: seed,
          driveHumanSeat: false,
        );
      });
    }
  });

  group('vs-Computer: the human seat\'s own turn-taking code path reaches '
      'results too, not just bot seats', () {
    for (final (ruleset, seatCount) in combos) {
      testWidgets(
        '${ruleset.id} ${seatCount}p with a real human-tap-driven seat 0 '
        'reaches results',
        (tester) async {
          await _playToResults(
            tester,
            ruleset: ruleset,
            seatCount: seatCount,
            seed: 5000 + seatCount,
            driveHumanSeat: true,
          );
        },
      );
    }
  });

  group('regression: human rolls a non-six with no legal move', () {
    testWidgets(
      'the turn passes to the next seat with no further input, and the '
      'roll control re-enables for the next eligible actor',
      (tester) async {
        // Classic (requires a 6 to leave the yard) + every seat 0 token
        // still in the yard + `diceSeed: 1`'s deterministic first roll of
        // 4 (verified out-of-band, matching `game_board_screen_test.dart`
        // and `ludo_bot_turn_runner_test.dart`'s `_seedRollingFour`) is
        // exactly "a non-six roll with no legal move": before this task's
        // fix, this same setup left the dice zone disabled forever with
        // `_state.currentPlayerIndex` already pointing at seat 1 — see
        // this task's Context/Decisions.
        const config = LudoLocalMatchConfig(
          ruleset: LudoRuleset.classic,
          seats: [
            LudoSeatConfig(color: LudoColor.red, isBot: false),
            LudoSeatConfig(color: LudoColor.green, isBot: false),
          ],
          isComputerMatch: false,
        );
        await tester.pumpWidget(
          _wrap(
            GameBoardScreen(
              config: config,
              seatIdentities: _identitiesFor(2),
              soundSettings: LudoSoundSettings(),
              diceSeed: 1,
              localSave: _memorySave(),
              botTurnDelay: Duration.zero,
            ),
          ),
        );
        await _pumpFrames(tester, count: 2);

        var zone = tester.widget<DiceZone>(find.byType(DiceZone));
        expect(zone.enabled, isTrue);
        await tester.tap(find.byType(DiceZone));
        await _pumpFrames(tester);

        // The turn passed to seat 1 with no further input required: the
        // engine's own `currentPlayerIndex` already shows it, and this
        // task's fix means the UI is not left frozen mid-animation.
        expect(_gameOf(tester).matchState!.currentPlayerIndex, 1);
        expect(_gameOf(tester).matchState!.phase, LudoMatchPhase.awaitingRoll);

        // Pass N Play shows a "pass to the next player" interstitial
        // between human seats; dismiss it to reach the board again.
        await _pumpFrames(tester, count: 3);
        final readyButton = find.byKey(const Key('pass-and-play-ready-button'));
        if (readyButton.evaluate().isNotEmpty) {
          await tester.tap(readyButton);
          await _pumpFrames(tester, count: 3);
        }

        zone = tester.widget<DiceZone>(find.byType(DiceZone));
        expect(
          zone.enabled,
          isTrue,
          reason:
              'the roll control must re-enable for seat 1 with no further '
              'input beyond dismissing the pass-and-play interstitial',
        );
      },
    );
  });
}
