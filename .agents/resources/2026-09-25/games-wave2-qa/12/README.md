# Task 12 — Merge Relay: onboarding + how-to-play

Evidence for `tasks/epics/16-games-portfolio-wave2/12-mr-onboarding-and-how-to-play.md`.

## What changed

- **Welcome step** (`lib/src/screens/merge_relay_welcome.dart`, new): a
  static first-run screen — the "MERGE RELAY" wordmark text fallback (logo
  art is task 22), two hero character tiles (2 → 4) illustrating a merge,
  the task's exact copy "Slide to merge matching tiles.", and a "Let's
  play" primary action. "Skip" (top right) ends onboarding immediately, the
  same as skipping the interactive step.
- **Tutorial gating** (`lib/src/merge_relay_tutorial.dart`): `MergeRelayTutorial`
  now shows `MergeRelayWelcome` first whenever `game.tutorialComplete` is
  still false — true for a genuine fresh install *and* for "Replay
  tutorial" tapped before onboarding was ever finished, but false (skips
  straight to the interactive board) once onboarding is done, so a normal
  replay from Settings never sees it again. This is a local widget flag,
  not a new `MergeRelayRoute` or game action — it keeps every existing
  "tap Play rescue → tutorial" entry point working unchanged (Skip is
  already on both the welcome and interactive screens).
- **Animated hand hint**: a looping "swipe left" `touch_app` icon over the
  interactive board's first step only, hidden whenever `reducedMotion` is
  on (the instructional text stays either way). It owns its own
  `AnimationController` and is removed from the tree once the merge
  completes, so it only exists while step 0 is showing.
- **Empty-band fix**: the task's known bug — the old tutorial screen's
  `Padding > SingleChildScrollView > Column` left whatever height the
  (short) content didn't use as one flat blank strip below the board,
  measured at ~57%. Fixed two ways: (1) a "fill or scroll" wrapper
  (`LayoutBuilder` + `ConstrainedBox(minHeight: viewport)` +
  `Column(mainAxisSize: min, mainAxisAlignment: spaceBetween)`, safe under
  the scroll axis's unbounded max unlike `Expanded`/`Spacer`) on both the
  welcome screen and the tutorial's interactive step, and (2) the
  interactive step's demo board grew from a cramped 340x210 box to a big
  400-wide square (matching the real Play board's own sizing), so there's
  simply less empty space to fill in the first place. The same wrapper was
  applied to the new how-to-play page, which had the same shape of bug.
  Measured with Pillow (row-uniformity against the paper background,
  tolerant of the dotted texture) after the fix:
  - `welcome.png`: largest empty band 395px / 2400px = **16.5%**
  - `tutorial.png` / `tutorial_hint.png`: 537px / 2400px = **22.4%**
  - `how_to_play.png`: 231px / 2400px = **9.6%**
  - `settings.png`: 91px / 2400px = 3.8% (unchanged shape, just taller by
    one button)
  All under the task's 25% ceiling.
- **How-to-play page** (`lib/src/screens/merge_relay_how_to_play.dart`,
  new): pushed via the ambient `Navigator` from a new "How to play" button
  in Settings (`lib/src/merge_relay_overlays.dart`) — Settings itself is a
  modal bottom sheet, not a `MergeRelayRoute`, so this follows the same
  pattern instead of adding a new top-level route. Three code-drawn cards
  (swipe, merge, goal + move budget) with small flat tile chips (not the
  real board's painted tile art — these only need to gesture at the
  mechanic), plus one line each for Daily and Endless.

## Tests added/updated

- `test/merge_relay_onboarding_test.dart` (new, 6 tests): a fresh install
  walks welcome → the interactive tutorial (a real fling-driven merge, not
  a skip) → wins rescue board 1 with the real solver → the chapter map then
  shows board 2 as "next up"; skip on the welcome step; skip on the
  interactive step; replaying after onboarding is done skips welcome; an
  existing (wrapped) save with `tutorial_version: 0` still shows welcome —
  the versioning rule ("an existing save never implies the tutorial is
  complete") stays intact; reduced motion hides the hand-hint icon but
  keeps the instructional text.
- `test/goldens/screens_test.dart`: added `welcome.png`, `tutorial_hint.png`
  (a second capture, one more pump after the first, since a `Ticker`'s
  elapsed time is relative to its own first frame callback — the very
  first pump after mounting only establishes that baseline), and
  `how_to_play.png`; `tutorial.png`'s capture now taps through welcome
  first.
- `test/widget_test.dart`, `test/typography_test.dart`,
  `test/merge_relay_no_relay_wording_test.dart`,
  `test/merge_relay_screens_responsive_test.dart`: small updates so the
  handful of assertions that specifically exercise the *interactive*
  tutorial step (not just "get past the tutorial gate", which "Skip" on
  welcome already satisfies unchanged) tap "Let's play" first. Every spot
  that reaches the interactive step now uses `pump()`/`pump(duration)`,
  never `pumpAndSettle`, since the hand-hint's animation repeats forever.

## Why `merge_relay_game_actions.dart`/`merge_relay_ui.dart` weren't touched

The welcome step lives entirely inside `MergeRelayTutorial`'s own widget
state (a local `_showWelcome` bool), not as a new `MergeRelayRoute`. This
was a deliberate scope decision: dozens of existing tests across this
suite use "tap Play rescue → land on the tutorial" as their idiom for
reaching a playable state, several of them at 320x540/2x text scale or
inside `MergeRelayGame`-only (no widget) tests. A new top-level route would
have meant re-auditing all of them for a change outside this task's real
scope (onboarding); gating the existing screen instead reuses "Skip" as-is
and needed no game/route/persistence changes.

## Verification

- `bun run games:format:check` — pass
- `bun run games:analyze -- --app merge_relay` — no issues
- `bun run games:test -- --app merge_relay` — **240 tests**, all pass
  (~19s; task 11's baseline was 229)
