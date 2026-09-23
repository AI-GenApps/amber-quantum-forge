---
epic: 15-ludo-launch
task: 12-local-modes-and-quality
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/11-save-and-resume]
estimate: L
---

# Finish local-mode wiring, add local telemetry, and a full quality pass

## Goal

Fully wire the two offline-first modes (vs Computer, local pass-and-play
2-4) end to end using `ludo_rules`' engine and bot strategies directly on
device, add the `ludo` telemetry namespace's LOCAL events, and close out
this epic's client quality bar with a full onboarding-to-results widget
flow test, golden-test coverage across the flow, and accessibility
(`Semantics` labels + 48dp tap targets) verification across every
interactive control built in tasks 03-11.

## Context/Decisions

- vs Computer: one human seat plus 1-3 bot seats (task 02's
  `EasyBotStrategy`/`MediumBotStrategy`/`HardBotStrategy`), difficulty
  chosen per bot seat in `mode_setup_sheet.dart` (task 09). After the
  human's turn resolves, bot turns execute automatically in sequence
  (roll -> pick move via strategy -> apply -> repeat while it's still a bot
  seat's turn, including extra rolls on sixes) with a short visible delay
  between bot actions so the board animation (tasks 04/05) is perceptible
  rather than instant-jumping.
- Pass-and-play: 2-4 human seats sharing one device; between turns, show a
  brief "Pass to <player>" interstitial (reusing the player-panel avatar/
  name from task 09) before revealing that seat's view — all state is
  public in Ludo, so the interstitial is a UX courtesy, not an
  information-hiding mechanism; keep it dismissible/skippable via a
  per-session "don't show again" toggle.
- Both modes use `ludo_local_save.dart` (task 11) for resume, and the
  timer-ring/dice-zone/legal-move wiring already built in task 09 — this
  task's job is specifically the bot-turn automation and the pass-and-play
  interstitial, not rebuilding the board screen. The same bot-turn runner
  built here is reused by task 26 for a bot-filled online seat (do not
  duplicate bot-turn logic between local and online paths).
- Telemetry: check `apps-native/games/packages/platform_core/lib/
  src/telemetry.dart` for the existing event-emission API (used by the
  other five games) and add a `ludo` analytics namespace (`game.ludo`, from
  the registry's `namespaces("ludo").analytics`, task 00) in
  `lib/src/telemetry/ludo_telemetry.dart` with the LOCAL events:
  `ludo_onboarding_completed`, `ludo_onboarding_skipped`,
  `ludo_match_started` (mode, ruleset, seatCount, `vsComputer`/
  `passAndPlay` variants), `ludo_match_finished` (winner seat, duration,
  ruleset, local variants), `ludo_turn_timed_out`, `ludo_settings_changed`
  (which toggle). Task 26 extends this same file with ONLINE events
  (`ludo_room_created`, `ludo_matchmaking_started`, etc.) — do not create a
  second telemetry wrapper. Follow the exact event-naming and
  payload-shape conventions already established by another game's
  telemetry usage (e.g. `merge_relay`). No telemetry event may include PII
  beyond what the existing `platform_core` telemetry API already permits.
- Full-flow quality pass: a single widget test drives onboarding -> home
  lobby -> mode/setup sheet -> game board -> results end to end (skip path
  and complete path both), asserting no crash and correct navigation at
  each step. Golden coverage for board/tokens (task 04), dice faces (task
  05), lobby (task 08), and results (task 10) already exists per-component;
  this task adds the one remaining flow-level golden — the results screen
  reached via a real full local match (not a screen constructed in
  isolation) — and an audit pass confirming every interactive control
  introduced across tasks 03-11 has a `Semantics` label and a 48dp+ tap
  target (tasks 07/08/10 already assert this locally; this task adds one
  repo-wide grep/lint-style check plus tests for any control those tasks
  missed, e.g. the mode/setup sheet's and pause dialog's controls from task
  09, which did not carry an explicit accessibility requirement in their
  own acceptance criteria).

## Implementation Checklist

- [ ] Create `lib/src/game/ludo_bot_turn_runner.dart`: drives sequential bot
  turns after each human action, using task 02's bot strategies, with a
  configurable inter-action delay.
- [ ] Wire `game_board_screen.dart` to invoke the bot-turn runner whenever
  the active seat is a bot seat (vs-Computer and any bot-filled online seat
  — reuse the same runner for both, do not duplicate bot-turn logic between
  local and online paths; task 26 wires the online call site).
- [ ] Create `lib/src/screens/pass_and_play_interstitial.dart` with a
  dismissible "Pass to <player>" screen and a "don't show again this
  session" toggle.
- [ ] Wire `mode_setup_sheet.dart` -> `game_board_screen.dart` navigation to
  show the interstitial between turns for Pass N Play sessions only.
- [ ] Create `lib/src/telemetry/ludo_telemetry.dart` wrapping
  `platform_core`'s telemetry API with the LOCAL events above.
- [ ] Call the telemetry events from their respective call sites across
  onboarding (task 07), setup/board/pause (task 09), and results/settings
  (task 10).
- [ ] Add `test/game/ludo_bot_turn_runner_test.dart` covering: bot turns
  execute automatically including extra rolls on six, and control returns
  to a human seat correctly after the bot sequence ends.
- [ ] Add `test/screens/pass_and_play_interstitial_test.dart` covering the
  dismiss/don't-show-again behavior.
- [ ] Add `test/telemetry/ludo_telemetry_test.dart` (using
  `platform_core`'s existing test double/fake telemetry sink, matching how
  another game's telemetry tests are structured) asserting each LOCAL event
  fires with the expected name/payload for a representative scenario per
  event.
- [ ] Add `test/app_flow_test.dart`: a full widget test driving
  splash -> onboarding (both skip and complete variants) -> home lobby ->
  mode/setup sheet -> game board -> results, asserting no crash and correct
  navigation.
- [ ] Add `test/goldens/results_screen_full_flow.png` (or equivalently
  named) captured from `test/app_flow_test.dart`'s completed run, committed
  under `apps-native/games/ludo/test/goldens/`.
- [ ] Add `test/accessibility/ludo_tap_targets_test.dart` asserting every
  interactive control reachable from the full flow (including
  `mode_setup_sheet.dart`'s and `pause_quit_dialog.dart`'s controls from
  task 09, which task 09 did not independently test for this) has a
  `Semantics` label and a minimum 48dp tap target.

## Files Touched

- `apps-native/games/ludo/lib/src/game/ludo_bot_turn_runner.dart`
- `apps-native/games/ludo/lib/src/screens/pass_and_play_interstitial.dart`
- `apps-native/games/ludo/lib/src/telemetry/ludo_telemetry.dart`
- `apps-native/games/ludo/lib/src/screens/*.dart` (telemetry call sites,
  extended)
- `apps-native/games/ludo/test/game/ludo_bot_turn_runner_test.dart`
- `apps-native/games/ludo/test/screens/pass_and_play_interstitial_test.dart`
- `apps-native/games/ludo/test/telemetry/ludo_telemetry_test.dart`
- `apps-native/games/ludo/test/app_flow_test.dart`
- `apps-native/games/ludo/test/goldens/results_screen_full_flow.png`
- `apps-native/games/ludo/test/accessibility/ludo_tap_targets_test.dart`

## Acceptance Criteria

- A full vs-Computer match (1 human + up to 3 bots, any difficulty) plays to
  completion with zero manual intervention on bot turns.
- A full 4-human Pass N Play match plays to completion with the interstitial
  shown between each seat change unless dismissed for the session.
- Every named LOCAL telemetry event fires at its documented call site with
  no PII beyond what `platform_core`'s existing usage already permits.
- `test/app_flow_test.dart` passes for both the skip and complete
  onboarding variants, reaching the results screen via a real played match.
- Every interactive control reachable from the full flow has a `Semantics`
  label and a 48dp+ tap target, verified by
  `test/accessibility/ludo_tap_targets_test.dart`.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Online telemetry events and online lobby wiring (task 26).
- Online telemetry backend ingestion/dashboarding (analytics pipeline is
  out of scope for this epic).
- Any monetization-related event.
- Human/physical-device review of the resulting build (task 13).

## Commit message

`feat(ludo): wire local bot turns, pass-and-play, local telemetry, and quality pass [15-ludo-launch/12]`
