---
epic: 15-ludo-launch
task: 12f-device-visual-qa
status: completed
commit_scope: ludo
depends_on: [15-ludo-launch/12e-menus-restyle]
estimate: L
---

# Full device visual QA sweep: capture every screen, fix every defect, re-capture

## Goal

Walk the entire restyled app (tasks 12a-12e) on the physical device via
adb, capture a screenshot of every screen into a committed evidence
folder, run one complete all-bots game end to end, compare each
screenshot against the Ludo King reference for layout/overflow/contrast/
consistency defects, fix every defect found in the app code, and
re-capture until the evidence folder reflects a clean pass with zero
remaining Material-default styling.

## Context/Decisions

- This is the closing quality gate for the visual-overhaul sub-arc
  (12a-12f) before the epic's existing human checkpoint (task 13). It does
  not introduce new features or restyle new screens — it is a systematic
  audit-and-fix pass over what 12a-12e already built, using the physical
  device as the source of truth (goldens prove pixel-stability, not that
  the pixels look good on real hardware — the same rationale task 13's own
  Context section gives for why a human device checkpoint exists at all).
- **Screen walk**: use `adb shell uiautomator dump` to get semantics
  bounds for the current screen, then `adb shell input tap <x> <y>` to
  navigate — do not guess coordinates from memory; dump before each tap on
  an unfamiliar screen. Cover at minimum: splash, onboarding welcome,
  onboarding profile, onboarding tutorial (each step), home lobby, mode
  setup sheet (both Classic/Quick and 2p/4p variants), game board screen
  (2p and 4p), pause dialog, pass-and-play interstitial, results screen,
  settings screen, how-to-play screen (each rule diagram).
- **Evidence folder**: screenshot each screen into
  `.agents/resources/2026-09-24/ludo-visual-qa/12f/<NN-screen>.png` (numbered,
  matching the walk order — follow the naming convention already used by
  `.agents/resources/2026-09-19/ludo-reference/`'s numbered captures).
  Commit the final clean-pass set, not every intermediate/broken capture
  taken during the fix loop (intermediate captures may live in the
  scratchpad during work, not in the repo).
- **Full game run**: separately from the screen walk, use the debug-only
  all-bots demo entry point (task 12a) to run one complete match
  unattended from start to results on-device, confirming the stuck-turn
  fix (12a) and the new visuals (12c/12d) hold under a real full game, not
  just a static screen visit.
- **Defect fixing**: for every layout/overflow/contrast/consistency issue
  found (e.g. clipped text, a card overflowing its bounds at this specific
  device's real font metrics, a color that reads as low-contrast on
  hardware even though it passed a golden, a screen that still shows a
  Material-default widget), fix it in the relevant `lib/src/` file from
  12a-12e's scope, re-run the affected widget tests/goldens, then
  re-capture that screen's evidence PNG. Loop until the evidence set is
  clean.
- **Material-default grep checklist**: before signing off, grep `lib/src/`
  for stock Material tells — `colorSchemeSeed`, unstyled `AlertDialog(`,
  unstyled `ElevatedButton(` (outside 12b's own widget internals), and any
  remaining `Colors.indigo`/default seed color reference — and confirm
  zero matches (or each is a documented, deliberate exception).

## Implementation Checklist

- [x] Build and install a debug APK on the physical device (serial
  `RZ8R32EAB7T`).
- [x] `uiautomator dump` + `input tap` walk through every screen listed
  above, screenshotting each into
  `.agents/resources/2026-09-24/ludo-visual-qa/12f/<NN-screen>.png` (the
  workflow harness's evidence-path rule overrides this file's
  `docs-internal/...` path for this run).
- [x] Start the debug-only all-bots demo match and let it run unattended to
  results; screenshot match-start, mid-match, and results into the same
  evidence folder.
- [x] For each screenshot, view it (Read tool) and compare against
  `.agents/resources/2026-09-24/ludo-visual-reference/ludo-king-reference.png`
  and the target-look description in that directory's `README.md`; note
  every defect.
- [x] Fix every noted defect in the relevant 12a-12e source file; re-run
  `bun run games:test -- --app ludo` for the affected widget/golden tests.
- [x] Re-capture the affected screen(s) and repeat the compare step until
  clean.
- [x] Run the Material-default grep checklist across `lib/src/` and resolve
  or document every hit.
- [x] Commit the final evidence folder (clean-pass captures only). Evidence
  (`.agents/resources/2026-09-24/ludo-visual-qa/12f/*.png`, 22 files) and the
  `ludo_theme.dart` fix are staged/uncommitted as of this run.

## Files Touched

- `.agents/resources/2026-09-24/ludo-visual-qa/12f/*.png` (new evidence folder)
- Any `apps-native/games/ludo/lib/src/**/*.dart` file touched to fix a
  defect found during this sweep (scope limited to files already touched
  by 12a-12e; a defect requiring new scope outside that set is filed as a
  follow-up task instead of expanding this one).
- Corresponding updated tests/goldens for any fix made.

## Acceptance Criteria

- `.agents/resources/2026-09-24/ludo-visual-qa/12f/` contains a screenshot for
  every screen in the walk list above, committed.
- One full all-bots game reaches the results screen on the physical
  device, with match-start/mid-match/results evidence captured.
- Zero overflow stripes (the yellow/black diagonal `RenderFlex` overflow
  indicator) appear in any committed screenshot.
- The Material-default grep checklist returns zero unresolved/undocumented
  hits.
- Every committed screenshot has been visually compared (by the task
  author, recorded in the commit body) against the reference image, with
  no open defect left unfixed.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- Device verification (physical device, serial `RZ8R32EAB7T`) — this task
  IS the device verification:
  1. `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
  2. `adb -s RZ8R32EAB7T install -r apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
  3. `adb -s RZ8R32EAB7T shell monkey -p app.w3dev.ludo.debug -c android.intent.category.LAUNCHER 1`
  4. `adb -s RZ8R32EAB7T shell uiautomator dump` + `adb -s RZ8R32EAB7T shell input tap <x> <y>` to
     navigate each screen.
  5. `adb -s RZ8R32EAB7T exec-out screencap -p > <file>.png` per screen,
     saved under `.agents/resources/2026-09-24/ludo-visual-qa/12f/`.
  6. View every screenshot with the Read tool before sign-off.
  - If the device is not attached, this task cannot pass — report NOT RUN
    and do not mark the task complete.

## Out of Scope

- New screens or new restyling scope beyond fixing defects in 12a-12e's
  existing files.
- The human-executed checkpoint itself (task 13) — this task produces
  committed evidence a human later reviews at task 13, it does not replace
  task 13's own human sign-off.
- Original bitmap art creation (the art session scheduled between this
  task and task 13).
- Any online feature.

## Commit message

`test(ludo): device visual QA sweep, fix layout defects, commit evidence [15-ludo-launch/12f]`
