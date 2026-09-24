---
epic: 15-ludo-launch
task: 12h-device-polish-and-lobby-art
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/12g-quick-mode-alignment]
estimate: L
---

# Device polish: bot-turn stall root-cause, stacked tokens, and lobby art

## Goal

Close out three device-only gaps found while executing task 12g before the
human local-play checkpoint (task 13) runs: (a) a device-only bot-turn
stall that a 4-player all-bots match hit on the physical device — the
match stopped advancing bot turns and never reached the results screen,
even though this same class of bug was supposedly fixed in task 12a and
widget tests with a fake clock complete 60+ full matches without issue —
root-cause it for real and prove the fix with a real-time-like regression
test plus on-device evidence; (b) render 2+ tokens sharing a board cell
clearly (Quick's 2 pre-released start-square tokens are the common case,
but any mid-game stack of any color must also read clearly), like Ludo
King does; (c) integrate the user-approved lobby background and mode-tile
art from `.agents/resources/2026-09-25/ludo-vortex-art/lobby/` into the
lobby screen through the existing art-manifest bitmap-slot mechanism, and
enlarge the lobby's wide logo to match the mockups. This task also updates
the Ludo Vortex game knowledge base to reflect the lobby art now being
integrated.

## Context/Decisions

- **(a) Bot-turn-runner stall — investigation starting points.** Read task
  12g's own task file notes and verification-run history for any mention
  of a stall observed during its device pass, task 12a's task file
  (`tasks/epics/15-ludo-launch/12a-gameplay-bugfix.md`) in full — it fixed
  a very similar "stuck turn" symptom before and documents the prior root
  cause and the fix's exact shape — and its commit via
  `git log --grep 12a --oneline` (currently `e686ceb`) plus `git show
  e686ceb` for the actual diff. The prior fix touched
  `apps-native/games/ludo/lib/src/game/ludo_bot_turn_runner.dart` and
  `game_board_screen.dart`'s turn-phase gating. This task's bug reproduces
  on-device in a 4-player all-bots match (both Classic and Quick) but not
  in this repo's existing widget tests, which use a fake clock and
  complete 60+ matches cleanly — that gap is itself a clue: whatever hangs
  depends on *real* timer/animation timing, real frame scheduling, or real
  app-lifecycle events that a fake clock or a widget-test pump never
  exercises. Read, end to end, before forming a hypothesis:
  `lib/src/screens/game_board_screen.dart` (turn-phase gating, the
  animation-completion futures it awaits before allowing the next
  action), `lib/src/game/ludo_bot_turn_runner.dart` (inter-action delay
  scheduling, whatever `Future`/`Timer` chain drives one bot action to the
  next), the token hop/move animation-completion signal it awaits
  (wherever `ludo_token_component.dart`'s or the game's animation
  controller reports "done" back to the controller), any `Timer`/
  `Future.delayed` that could be silently cancelled by a widget rebuild or
  disposed `State`, and any Flutter/Flame app-lifecycle hook
  (`AppLifecycleState` pause/resume, Flame's `Game.pauseEngine`/
  `resumeEngine`, or the engine's per-frame `update` loop) that a real
  device's frame pacing, thermal throttling, screen-off, or background/
  foreground transition could hit but an in-process widget test never
  does. Plausible root-cause shapes to weigh (do not assume one without
  evidence — confirm via logging/breakpoint/repro, and record what you
  found and ruled out): an animation-completion `Future`/`Completer` that
  never completes when a hop is interrupted (a rebuild swaps the
  `AnimationController` out from under an in-flight animation, or the
  controller is disposed before it fires its completion callback); a
  `Timer` the bot-turn runner scheduled getting cancelled by a widget
  rebuild that recreates the runner or its host `State`; a lifecycle pause
  (screen timeout, app backgrounding via a notification, launcher/monkey
  interaction) stopping Flame's engine loop or a Dart `Timer` without a
  resume path wiring the pending action back up; a race between the bot
  runner's own scheduling and `game_board_screen.dart`'s phase-gate read
  of match state, where the two disagree about whose turn it is and both
  then wait for each other. Whatever the actual mechanism turns out to be,
  fix it at the root — not by adding a watchdog/timeout that merely papers
  over a hung future — and explain the real cause in this task's PR/commit
  body, same as 12a's precedent required.
- **Regression test must exercise real-time-like conditions**, not another
  fake-clock pump — this is the entire reason the previous test suite
  missed the bug. Use `tester.runAsync` (per `flutter_test`'s guidance for
  code that uses real `Timer`s/`Future.delayed`/platform channels inside a
  widget test) driving the real controller/bot-runner/animation stack with
  real `Timer`s, and construct at least one scenario that interrupts an
  in-flight token hop animation (e.g. trigger a rebuild or a simulated
  lifecycle pause/resume mid-hop) to reproduce the hang before the fix and
  prove it resolved after. If `tester.runAsync` cannot reach far enough
  into Flame's real engine loop to reproduce it, an integration-test-style
  test (`integration_test` package, if already present in this workspace,
  or a new minimal one) driving the actual compiled app is acceptable —
  check `apps-native/games/ludo/pubspec.yaml`/`test/` for existing
  precedent before adding new test infrastructure.
- **(b) Stacked tokens.** When 2 or more tokens (any color, any mix) occupy
  the same track/yard cell, they must be visually distinguishable and
  individually tappable, matching Ludo King's convention: a small
  offset/fan-out of each token within the cell bounds (each token's anchor
  point shifted a few pixels from cell-center, arranged so all tokens in
  the stack remain visible and non-overlapping at their base) and/or a
  small count badge on the stack. This applies to Quick's 2 pre-released
  tokens sitting together on the start square at match start, and to any
  in-game stack of same- or different-colored tokens on any cell.
  `ludo_token_component.dart` (rendering, from task 12d2's pin-shape work)
  and whichever board/game component currently lays out one token per cell
  (likely `ludo_board_component.dart` or `ludo_game.dart`'s token-layer
  logic) both need to read the actual per-cell token count and offset
  each token's render position and tap-hit-test region accordingly — tap
  selection of an individual stacked token must keep working (the correct
  token must be selectable/highlighted, not just the topmost render).
- **(c) Lobby art integration — user-approved assets.** The user approved,
  for the lobby screen specifically:
  - Background: `.agents/resources/2026-09-25/ludo-vortex-art/lobby/bg-b.png`
  - Mode tiles: `tile-a-computer.png`, `tile-a-pass.png`,
    `tile-a-friends.png`, `tile-a-online.png` (same directory)
  - `mockup-b.png` (background) and `mockup-a.png` (tiles) in that
    directory show the approved layout intent — view both with Read
    before implementing.
  Optimize copies of these source files into
  `apps-native/games/ludo/assets/art/` (do not commit the raw
  `.agents/resources/...` originals as app assets): background resized to
  at most 1080px wide, tiles resized to at most 512px, each file kept
  under roughly 600 KB. Route them through `ludo_art_manifest.dart`'s
  existing bitmap-slot mechanism (`lib/src/assets/ludo_art_manifest.dart`
  — read it and `test/assets/ludo_art_manifest_bitmap_test.dart` first for
  the established slot-naming/loading convention from task 12b) so the
  lobby screen resolves art through a manifest slot with the existing
  code-drawn painter as fallback when a slot is empty, consistent with
  every other manifest-driven surface in this app — do not hardcode an
  `Image.asset` path directly in the lobby screen. Update
  `apps-native/games/ludo/assets/art/LICENSES.md` with provenance for
  each new file (source path, generation method/tool per the `.json`
  sidecar files already sitting next to each `.png` in the lobby art
  directory, license/rights basis — same format as existing LICENSES.md
  entries for `logo_stacked.png`/`logo_wide.png`).
  Also: the lobby header's wide logo (`logo_wide.png`, already integrated)
  must render much larger than its current size — approximately 80% of
  the lobby's content width, matching the scale shown in
  `mockup-a.png`/`mockup-b.png` — adjust whatever layout constraint in the
  lobby screen currently constrains it. Mode-tile labels must use the
  game's established display font (from task 12b's bundled-font theme
  tokens), not a default/system font. Tiles that are dimmed/"Coming soon"
  (per the current lobby — online tile prior to task 26, any other
  disabled tile) must stay dimmed with their existing affordance; this
  task only swaps their background art in, not their enabled state.
- **(d) Knowledge-base update.** `.agents/games/ludo-vortex/
  assets-index.md` tracks asset status for this game outside the
  `tasks/` tree. Update its lobby-art entry/section to reflect that lobby
  art is now integrated (from "planned"/pending to actual file paths and
  manifest slot names), consistent with however other integrated assets
  are already recorded in that file — read the file first and match its
  existing format rather than inventing a new one.
- This task does not touch `ludo_rules`, match/turn rules logic, or any
  screen besides the lobby (for art) and the game board/token rendering
  layer (for the stall fix and stacked-token rendering) — it is a
  device-quality and asset-integration pass, not a feature or rules
  change.

## Implementation Checklist

- [ ] Read task 12g's notes for the stall observation, task 12a's full
  task file and `git show e686ceb`, and `ludo_bot_turn_runner.dart`/
  `game_board_screen.dart`/the token animation-completion path; form and
  record a root-cause hypothesis before touching code.
- [ ] Reproduce the stall in a real-time-like automated test
  (`tester.runAsync` with real `Timer`s and an interrupted animation, or
  an `integration_test`), confirming it fails on the pre-fix code.
- [ ] Fix the actual root cause (not a watchdog/timeout workaround);
  re-run the new test to confirm it now passes.
- [ ] Add/confirm existing fake-clock widget tests (60+-match coverage
  from 12a) still pass unmodified — the fix must not regress that
  coverage's assumptions.
- [ ] Implement stacked-token rendering: per-cell token count detection,
  fan-out offset and/or count badge, correct individual tap-hit-testing
  for each token in a stack.
- [ ] Add/regenerate goldens covering: 2 same-color tokens stacked on a
  Quick start square; a mixed-color stack mid-game (construct a state
  with 2+ tokens sharing a track cell) — diff old vs. new before
  committing.
- [ ] Add a widget/component test asserting stacked tokens remain
  individually tappable (tapping each token's offset position selects
  the correct token id).
- [ ] Resize/optimize `bg-b.png`, `tile-a-computer.png`, `tile-a-pass.png`,
  `tile-a-friends.png`, `tile-a-online.png` from
  `.agents/resources/2026-09-25/ludo-vortex-art/lobby/` into
  `apps-native/games/ludo/assets/art/` at the size/weight budget above.
- [ ] Wire the resized files into `ludo_art_manifest.dart`'s bitmap-slot
  mechanism with code-drawn fallback; update the lobby screen to resolve
  background/tile art through the manifest instead of any hardcoded
  path or code-drawn-only painter.
- [ ] Update `apps-native/games/ludo/assets/art/LICENSES.md` with
  provenance entries for all 5 new files.
- [ ] Enlarge the lobby header's wide logo to ~80% of content width;
  set mode-tile labels to the game's display font; confirm dimmed
  "Coming soon" tiles keep their disabled affordance with the new art.
- [ ] Regenerate lobby goldens with image decode inside `tester.runAsync`
  (per this app's established golden pattern for bitmap-backed
  components); diff old vs. new before committing.
- [ ] Update `.agents/games/ludo-vortex/assets-index.md`'s lobby-art
  status to integrated, matching its existing format.
- [ ] Update task `13-human-local-checkpoint.md`'s frontmatter
  `depends_on` to `[15-ludo-launch/12h-device-polish-and-lobby-art]`.
- [ ] Add a `12h` row to `tasks/epics/15-ludo-launch/STATUS.md` (already
  added ahead of this task's execution — verify it is present and
  correct, do not duplicate).

## Files Touched

- `apps-native/games/ludo/lib/src/game/ludo_bot_turn_runner.dart`
- `apps-native/games/ludo/lib/src/screens/game_board_screen.dart`
- `apps-native/games/ludo/lib/src/game/ludo_token_component.dart`
- `apps-native/games/ludo/lib/src/game/ludo_board_component.dart` (or the
  actual token-layer component, per investigation)
- `apps-native/games/ludo/lib/src/game/ludo_game.dart`
- `apps-native/games/ludo/lib/src/assets/ludo_art_manifest.dart`
- `apps-native/games/ludo/lib/src/screens/*lobby*.dart`
- `apps-native/games/ludo/assets/art/bg-b.png` (new, optimized)
- `apps-native/games/ludo/assets/art/tile-a-computer.png` (new, optimized)
- `apps-native/games/ludo/assets/art/tile-a-pass.png` (new, optimized)
- `apps-native/games/ludo/assets/art/tile-a-friends.png` (new, optimized)
- `apps-native/games/ludo/assets/art/tile-a-online.png` (new, optimized)
- `apps-native/games/ludo/assets/art/LICENSES.md`
- `apps-native/games/ludo/test/**` (new/updated real-time regression test,
  stacked-token tests, regenerated goldens)
- `.agents/games/ludo-vortex/assets-index.md`
- `tasks/epics/15-ludo-launch/13-human-local-checkpoint.md` (`depends_on`
  update only)
- `tasks/epics/15-ludo-launch/STATUS.md`

## Acceptance Criteria

- The bot-turn stall's real root cause is identified and documented in the
  commit/PR body (not guess-patched); a new test reproduces it under
  real-time-like conditions (real timers/interrupted animation) and passes
  only after the fix.
- Existing 60+-match fake-clock controller tests from task 12a still pass
  unmodified.
- On device (serial `RZ8R32EAB7T`): at least two full 4-player all-bots
  matches (one Classic, one Quick) reach the results screen unattended,
  each with screenshots and a logcat excerpt saved under
  `.agents/resources/2026-09-25/ludo-visual-qa/12h/`.
- Stacked tokens (2+ in one cell, any color mix) render with a clear
  fan-out and/or count badge and remain individually tappable — covered by
  a golden and a tap-hit-test.
- Lobby background and 4 mode tiles render the approved art via the art
  manifest with code-drawn fallback when a slot is empty; `LICENSES.md`
  has provenance for all 5 new files; each optimized file is ≤1080px wide
  (background) or ≤512px wide (tiles) and well under ~600 KB.
- The lobby's wide logo renders at ~80% of content width, matching the
  mockups; mode-tile labels use the game's display font; dimmed
  "Coming soon" tiles remain dimmed.
- Lobby goldens are regenerated with image decode inside `tester.runAsync`
  and diffed before commit; a device screenshot of the lobby is visually
  compared against `mockup-a.png`/`mockup-b.png` and the comparison result
  recorded.
- `.agents/games/ludo-vortex/assets-index.md` reflects lobby art as
  integrated.
- `13-human-local-checkpoint.md`'s `depends_on` points at 12h; `STATUS.md`
  has a 12h row.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `cd apps-native/games/packages/ludo_rules && dart analyze && dart test`
- `bun run games:validate -- --strict`
- Device verification (physical device, serial `RZ8R32EAB7T`):
  1. `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
  2. `adb -s RZ8R32EAB7T install -r apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
  3. `adb -s RZ8R32EAB7T logcat -c` (clear log before each run)
  4. `adb -s RZ8R32EAB7T shell monkey -p app.w3dev.ludo.debug -c android.intent.category.LAUNCHER 1`
  5. Start a fresh 4-player all-bots Classic debug game and let it run
     unattended to completion; capture
     `adb -s RZ8R32EAB7T exec-out screencap -p > .agents/resources/2026-09-25/ludo-visual-qa/12h/classic-4p-bots-result.png`
     and
     `adb -s RZ8R32EAB7T logcat -d > .agents/resources/2026-09-25/ludo-visual-qa/12h/classic-4p-bots-logcat.txt`.
  6. Repeat step 5 for a 4-player all-bots Quick debug game, saving
     `quick-4p-bots-result.png` and `quick-4p-bots-logcat.txt` in the same
     directory.
  7. Navigate to a match state with 2+ tokens stacked on one cell (e.g. a
     fresh Quick start) and capture
     `.agents/resources/2026-09-25/ludo-visual-qa/12h/stacked-tokens.png`.
  8. Navigate to the lobby screen and capture
     `.agents/resources/2026-09-25/ludo-visual-qa/12h/lobby-art.png`;
     compare (Read tool, side by side) against
     `.agents/resources/2026-09-25/ludo-vortex-art/lobby/mockup-a.png` and
     `mockup-b.png`, recording pass/fail per element (background, 4 tile
     images, logo size, tile label font, dimmed-tile affordance) in the
     commit/PR notes.
  - If the device is not attached, report NOT RUN for all device steps
    (do not skip the step — mark it NOT RUN explicitly).

## Out of Scope

- Any change to `ludo_rules`, match/turn validation logic, or Quick/
  Classic win conditions — this task only fixes scheduling/animation
  plumbing around turns, not rules.
- Board geometry, token pin shape/size, or any other 12d2-established
  visual spec beyond the stacked-token offset/badge treatment.
- Art for any screen other than the lobby (background + 4 mode tiles +
  existing logo resize) — no other screen's art changes in this task.
- The economy art session (task 26f) and any economy/store art.
- Server-authoritative online play (tasks 14-26) — this task is
  local-client-only.
- Re-litigating task 12a's original fix — this task investigates why the
  symptom recurred on-device, it does not revert or redo 12a's change
  without evidence that it was wrong.

## Commit message

`feat(ludo): device polish, stacked tokens, and lobby art [15-ludo-launch/12h]`
