---
epic: 15-ludo-launch
task: 13-human-local-checkpoint
status: pending
commit_scope: ludo
owner: human
depends_on: [15-ludo-launch/12-local-modes-and-quality]
estimate: S
---

# Human checkpoint: local build, install, and visual review

**This task requires a human with a physical Android device — no agent
session can complete it.** The unattended workflow must stop here: every
prior task (00-12) is written to pass build/lint/test/golden checks without
an emulator or a physical device, but nothing before this task actually
looks at the app running, or plays it, on real hardware.

## Goal

Build a debug APK of the local-only Ludo client (tasks 00-12: rules,
scaffold, board/token/dice/effects rendering, audio/haptics, onboarding,
lobby, setup/board screen, results/settings, save/resume, local modes),
install it on a physical Android device, play vs Computer and Pass N Play,
review the golden-test screenshots and the running app's actual visuals
against them, and either sign off or file a fix list. No online
functionality exists yet (tasks 14-26 are all still pending at this point in
the linear execution order) — this checkpoint is scoped to local play only.

## Context/Decisions

- This checkpoint exists precisely because tasks 04/05/07/08/10/12's golden
  tests prove pixel-stable rendering but cannot prove the rendering is
  *good* — a flat placeholder-looking board that happens to pass its own
  golden (because the golden was captured from that same flat placeholder)
  would otherwise ship undetected. A human looking at the real device is
  the only check for that class of problem.
- Scope is deliberately narrow: local-only client quality (does the board
  look right, does the dice tumble feel right, do onboarding/lobby/setup/
  board/results flow make sense, does audio/haptics fire at the right
  moments, does resume work after actually force-closing the app). This is
  not a full release acceptance pass — that is task 29, after online
  features, backend provisioning, and release hardening are also done.
- If a real defect is found, file it as a new task (or a fix note in this
  task's own record) rather than patching code inside this checkpoint task.
  Do not silently wave through a defect to keep the workflow moving.

## Implementation Checklist (human-executed)

- [ ] Build a debug APK: `bun run games:build -- --app ludo --platform
  android --mode debug --environment debug`.
- [ ] Install and run it on a physical Android device (not an emulator):
  `bun run games:run -- --app ludo --device-id <physical-id>`.
- [ ] Complete onboarding once (name + avatar picker, interactive
  tutorial), and separately verify the skip path on a fresh install.
- [ ] Play a full vs-Computer match at each bot difficulty (easy, medium,
  hard) to a finish, reaching the results screen.
- [ ] Play a full Pass N Play match with 2 seats and, separately, with 4
  seats, verifying the pass interstitial and its dismiss/don't-show-again
  toggle.
- [ ] Force-close the app mid-match (both vs-Computer and Pass N Play) and
  relaunch; verify the home lobby's Resume affordance restores the exact
  in-progress state (task 11).
- [ ] Toggle sound/music/vibration and reduced-motion in both the pause
  dialog and the settings screen; confirm the toggles are audibly/visibly
  effective and stay in sync between the two surfaces.
- [ ] Visually compare the running app's board, tokens, dice faces, lobby,
  and results screen against the golden `.png` files committed under
  `apps-native/games/ludo/test/goldens/` (tasks 04/05/08/10/12); confirm the
  goldens reflect genuinely good-looking art, not a passing-but-flat
  placeholder.
- [ ] Record the device model, serial, and Android version used.
- [ ] Record a pass/fail per scenario above, and either sign off (mark this
  task's status `[x]` with no open fix items) or file a fix list (new task
  file(s), or a documented list in this file if minor enough to fold into a
  follow-up task) before allowing the workflow to proceed to task 14.

## Files Touched

- `tasks/epics/15-ludo-launch/13-human-local-checkpoint.md` (record
  results)
- `tasks/epics/15-ludo-launch/STATUS.md` (mark task 13 status)

## Acceptance Criteria

- Every scenario in the checklist above has a recorded pass/fail with the
  device identity that produced it.
- No scenario is marked passed based on emulator/simulator output.
- If any fix list item was filed, this task's own status is not marked
  `[x]` until the human operator re-runs the affected scenarios and confirms
  they pass.

## Verification Commands

- `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
- `bun run games:run -- --app ludo --device-id <physical-id>`

## Out of Scope

- Any online feature (tasks 14-26 are still pending).
- Backend provisioning, release hardening, or store-listing work (tasks
  14-29).
- Full release acceptance (task 29).
- Any code change — if a real defect is found, file it as a new task rather
  than patching code inside this checkpoint task.

## Commit message

`docs(ludo): record human local-play checkpoint results [15-ludo-launch/13]`
