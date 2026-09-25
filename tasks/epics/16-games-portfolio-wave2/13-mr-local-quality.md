---
epic: 16-games-portfolio-wave2
task: 13-mr-local-quality
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/12-mr-onboarding-and-how-to-play]
estimate: M
owner: agent
---

# Merge Relay: local quality gate (seeded runs, flows, budgets)

## Goal

Prove the solo v1 is robust before branding and art: seeded full-run tests
through the real controller, end-to-end flow tests, accessibility checks,
and measured size budgets.

## Context / Decisions

- Ludo lesson: every unit test passed while the device showed a frozen
  turn. Tests here must drive the **real** game controller and scheduler
  with a fake clock, not only the rules package.
- Seeded runs: **≥50 Endless games** (seeds 1..50) played by a simple
  deterministic policy (prefer merges, then corner-bias) until the terminal
  state; each must reach the result screen state with a consistent score.
  Also **≥20 Daily dates** (consecutive UTC dates), each producing its
  documented seed and a reachable terminal state. All **60 rescue boards**
  replay the solver's line to "cleared" through the UI controller.
- Flow tests: fresh install → tutorial → board 1 cleared → chapter map;
  mid-run kill and restore (process-death simulation via the save adapter);
  Settings toggles persist across restart.
- Accessibility: every interactive element has a semantics label, tap
  targets are ≥48 dp, and text scale 1.3 causes no overflow on every screen.
- Budgets (record them, fail only when exceeded): release APK (split-per-ABI
  arm64) ≤ 40 MB; Home frame build ≤ 16 ms in a `flutter test` benchmark (a
  best-effort signal, not a device profile); cold start is measured on
  device in task 25.

## Implementation Checklist

- [ ] Add `test/quality/endless_seeded_runs_test.dart`,
      `daily_seeded_test.dart`, `rescue_campaign_replay_test.dart`,
      `app_flows_test.dart`, and `accessibility_test.dart`.
- [ ] Build a release APK split per ABI and record its size in
      `.agents/resources/2026-09-25/games-wave2-qa/13/budgets.md`.
      Signing with the debug key is acceptable for measurement only; note
      that.
- [ ] Fix every bug the tests reveal, within scope, and list the fixes in
      the evidence README.

## Files Touched

- `apps-native/games/merge_relay/test/quality/**`
- `apps-native/games/merge_relay/lib/**` (bug fixes only)
- `.agents/resources/2026-09-25/games-wave2-qa/13/**`

## Acceptance Criteria

- All quality tests pass. The whole suite finishes in < 3 minutes, and the
  verifier times it.
- `budgets.md` records the arm64 release APK size, with the exact command
  used, and it is ≤ 40 MB.
- The test count is ≥ task 12's plus the new files.

## Verification Commands

- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `time bun run games:test -- --app merge_relay`
- `cd apps-native/games/merge_relay && flutter build apk --release --split-per-abi --dart-define=MERGE_RELAY_SOCIAL=false` (records the size; if release signing config blocks it, record the error and measure `--debug` instead, marked as such)
- `bun run games:validate:strict`

## Out of Scope

- New features. Visual changes, beyond bug fixes.

## Commit message

`test(merge-relay): add seeded run, flow, accessibility, and budget quality gate [16-games-portfolio-wave2/13]`
