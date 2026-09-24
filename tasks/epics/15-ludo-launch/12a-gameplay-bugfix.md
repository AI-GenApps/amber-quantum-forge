---
epic: 15-ludo-launch
task: 12a-gameplay-bugfix
status: completed
commit_scope: ludo
depends_on: [15-ludo-launch/12-local-modes-and-quality]
estimate: L
---

# Fix the stuck-turn and black-canvas bugs; add unattended real-match coverage

## Goal

Root-cause and fix two critical bugs found via physical-device testing on a
Samsung A52 (1080x2400) that make the app effectively unplayable, then add
the class of test coverage that should have caught them: controller-level
tests that drive **complete** matches through the **real** game controller
and bot scheduler (not a mocked/constructed screen state) with a fake
clock, across enough seeded games to be confident the fix holds.

## Context/Decisions

- **Bug 1 — stuck turn.** In a 4-player vs-Computer game, Bot 1's turn
  froze indefinitely (roll button disabled, UI reports "not your turn").
  Reproduced in a 2-player Quick game: after the human rolled a 2, the game
  stopped responding to any taps for over a minute; the results screen was
  unreachable. All of tasks 03-12's unit/widget tests passed despite this,
  because none of them drives a full match through the real
  `ludo_bot_turn_runner.dart` + `game_board_screen.dart` + `ludo_rules`
  controller stack end to end with real (non-instant) timers — investigate
  `lib/src/game/ludo_bot_turn_runner.dart`'s inter-action delay/async
  scheduling, `game_board_screen.dart`'s turn-phase gating, and any place a
  `Future`/`Timer`/animation-completion callback could fail to fire or
  fail to hand control back (e.g. an awaited animation controller that
  never completes when reduced-motion is off, a bot-turn future that isn't
  awaited before the next legality check, or a phase-gate check reading
  stale state). Do not guess-patch symptoms — find the actual root cause
  and explain it in this task's PR/commit body.
- **Bug 2 — black canvas / misplaced dice.** A solid black rectangle
  renders below the board on every game screen. Root cause is almost
  certainly the Flame `GameWidget`'s canvas not being sized/fitted as a
  square (check `ludo_game.dart`'s `camera`/`viewport` setup and
  `game_board_screen.dart`'s layout — likely missing an `AspectRatio`/
  `FittedBox` wrapper or a hardcoded/unconstrained game-widget size that
  leaves leftover space unpainted). The dice component also renders inside
  the green yard region instead of its intended dice-zone location — check
  `lib/src/widgets/dice_zone.dart`'s positioning relative to
  `ludo_game.dart`'s component tree and whether the dice is being added as
  a Flame component positioned by board coordinates when it should be a
  separate Flutter widget/zone outside the board's `GameWidget`.
- **Debug-only "all bots" demo match.** Add a way to start a match where
  every seat (including the nominal "human" seat) is bot-controlled, so a
  full game can run unattended on a physical device for QA and so the new
  controller tests below have a documented manual-repro path too. This
  entry point must be compiled out of release builds (guard with
  `kDebugMode` or an equivalent debug-only flag/build config — verify by
  grepping the release build output or the relevant `if (kDebugMode)`
  guard) and must not be reachable from the normal lobby UI in a release
  build.
- **Controller-level regression tests.** The existing test suite constructs
  screens/states in isolation; this task adds a new test file that drives
  the *real* `ludo_bot_turn_runner.dart` and `game_board_screen.dart` (or
  the underlying controller they share, if extracting one clarifies the
  fix) through complete matches using `package:fake_async`'s `FakeAsync` or
  Flutter's `flutter_test` `tester.pump`/`pumpAndSettle` with real timers
  elapsed, across >=50 seeded games spanning Classic+Quick rulesets, 2p/4p
  seat counts, and including at least one human seat auto-playing via the
  all-bots demo path (so the human seat's own turn-taking code path is
  exercised, not just bot seats). Every one of the >=50 seeded games must
  reach the results screen/state; a single stuck game fails the test.
- **Specific regression test.** Add a targeted test for the exact class of
  bug found: "human rolls a non-6 with no legal move, then turn passes" —
  assert the turn advances to the next seat without requiring any further
  input, and that the roll control re-enables for the next eligible actor.

## Implementation Checklist

- [x] Investigate and fix the stuck-turn bug in
  `apps-native/games/ludo/lib/src/game/ludo_bot_turn_runner.dart` and
  `apps-native/games/ludo/lib/src/screens/game_board_screen.dart` (or
  wherever the real root cause lives); document the root cause in the
  commit body.
- [x] Fix the black-canvas/board-sizing bug in
  `apps-native/games/ludo/lib/src/game/ludo_game.dart` and
  `apps-native/games/ludo/lib/src/screens/game_board_screen.dart` so the
  Flame `GameWidget` renders as a perfect square with no unpainted/black
  area.
- [x] Fix dice placement in
  `apps-native/games/ludo/lib/src/widgets/dice_zone.dart` (and/or
  `ludo_game.dart`) so the dice renders in its intended dice-zone location,
  never inside the yard.
- [x] Add a debug-build-only "all bots" demo match entry point (e.g. a
  hidden dev menu item or a `kDebugMode`-guarded button on the mode setup
  sheet or lobby), verified absent from release builds.
- [x] Add
  `apps-native/games/ludo/test/game/ludo_full_match_controller_test.dart`:
  >=50 seeded full matches through the real controller/bot scheduler with a
  fake clock, spanning Classic/Quick x 2p/4p x human-seat-auto-play,
  asserting every game reaches results.
- [x] Add a regression test in the same file (or a sibling test file) for
  "human rolls a non-6 with no legal move then turn passes."
- [x] Re-run the full existing Ludo test suite to confirm no regression.

## Files Touched

- `apps-native/games/ludo/lib/src/game/ludo_bot_turn_runner.dart`
- `apps-native/games/ludo/lib/src/game/ludo_game.dart`
- `apps-native/games/ludo/lib/src/screens/game_board_screen.dart`
- `apps-native/games/ludo/lib/src/widgets/dice_zone.dart`
- `apps-native/games/ludo/lib/src/screens/mode_setup_sheet.dart` (debug-only
  all-bots entry, if wired here)
- `apps-native/games/ludo/test/game/ludo_full_match_controller_test.dart`

## Acceptance Criteria

- On the physical device, a 4-player vs-Computer game and a 2-player Quick
  game each play to completion with no stuck turn, verified by the device
  verification steps below.
- On the physical device, no black rectangle renders anywhere on the game
  screen, and the dice renders in its dice zone, not inside the yard.
- The debug-only all-bots demo entry point is present in a debug build and
  absent/unreachable in a release build.
- `test/game/ludo_full_match_controller_test.dart` runs >=50 seeded games
  through the real controller/bot scheduler and every one reaches results.
- The "non-6, no legal move, turn passes" regression test passes and would
  have failed against the pre-fix code (verified by temporarily reverting
  the fix locally during development — not committed).

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- Device verification (physical device, serial `RZ8R32EAB7T`):
  1. `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
  2. `adb -s RZ8R32EAB7T install -r apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
  3. `adb -s RZ8R32EAB7T shell monkey -p app.w3dev.ludo.debug -c android.intent.category.LAUNCHER 1`
  4. Navigate via `adb -s RZ8R32EAB7T shell input tap <x> <y>` to start an
     all-bots demo match (or a 4-player vs-Computer / 2-player Quick game)
     and let it run to results.
  5. Capture screenshots with
     `adb -s RZ8R32EAB7T exec-out screencap -p > <file>.png` at match start,
     mid-match, and results; the verifier must **view** each with the Read
     tool and confirm no black rectangle and correct dice placement.
  - If the device is not attached, report NOT RUN — this task cannot pass
    without the device verification above.

## Out of Scope

- Visual/design-system restyling (tasks 12b-12e) — this task fixes
  functional bugs and canvas sizing only; it may leave the Material-default
  look in place.
- Device visual QA sweep of every screen (task 12f).
- Any new gameplay feature.

## Commit message

`fix(ludo): resolve stuck-turn and black-canvas bugs, add real-match controller tests [15-ludo-launch/12a]`
