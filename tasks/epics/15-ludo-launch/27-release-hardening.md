---
epic: 15-ludo-launch
task: 27-release-hardening
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/26i-economy-compliance-and-provisioning-docs]
estimate: M
---

# Add crash reporting, perf/size budgets, and release-prep drafts

## Goal

Add crash reporting behind a Firebase-optional interface, prove the board
scene meets a frame-build performance budget, measure (or document why not
measured) a release APK size budget, and draft the privacy policy, Play
Data Safety answers, and store listing text that task 29's human checklist
needs.

## Context/Decisions

- Crash reporting: add `firebase_crashlytics` behind a `LudoCrashReporter`
  interface (mirroring task 24's guarded-Firebase-init pattern) with a
  `FirebaseCrashlyticsReporter` implementation and a `NullCrashReporter`
  selected when Firebase config is absent — the same no-op-without-config
  discipline task 22 established server-side for `NullMatchViewPublisher`.
  The app must never crash *because* crash reporting itself failed to
  initialize.
- Performance budget: the board scene (`ludo_game.dart`, tasks 04/05) must
  keep its per-frame build/update cost within a ~16ms budget (60fps) under
  a representative load (4-token board, an in-flight hop animation, a
  particle burst active). Prove this with a Flutter profile-mode benchmark
  test (`flutter_test`'s `binding.traceAction`/`benchmark` harness, or
  `flame_test`'s equivalent if that's what tasks 04/05 already used) that
  fails if frame build time exceeds budget; if the workspace's test tooling
  cannot produce a reliable timed benchmark in CI, document that limitation
  explicitly in this task's doc output and record a manual profiling
  procedure instead of silently skipping the budget.
- Size budget: a release APK for `ludo` must stay at or under 40MB. Measure
  it with `bun run games:build -- --app ludo --platform android --mode
  release --environment <env>` if that command succeeds in this execution
  environment (it may not — release signing config may be absent before
  task 29's provisioning); if it does not run, record the result as `NOT
  RUN` rather than fabricating a size number, and note the real measurement
  is deferred to task 29's device-acceptance pass.
- Release-prep drafts (content only, no provisioning): a privacy policy
  draft covering what Ludo collects (Firebase UID, match state, telemetry
  events — no raw display names per task 12's PII discipline) under
  `docs-internal/gaming/ludo-privacy-policy.md`; a Play Console Data Safety
  form draft (what data is collected/shared, in the same categories Play
  Console asks for) under `docs-internal/gaming/ludo-data-safety.md`; and a
  store listing text draft (title, short description, long description)
  under `docs-internal/gaming/ludo-store-listing.md`. These are drafts task
  29's human operator uses to actually fill in Play Console — this task
  does not touch any external console.

## Implementation Checklist

- [ ] Create `lib/src/telemetry/ludo_crash_reporter.dart`: the
  `LudoCrashReporter` interface, `FirebaseCrashlyticsReporter`, and
  `NullCrashReporter`, selected the same way task 24 selects Firebase-backed
  vs. no-op implementations.
- [ ] Wire the crash reporter into `main.dart`'s error handling
  (`FlutterError.onError`, `PlatformDispatcher.instance.onError`).
- [ ] Add `test/telemetry/ludo_crash_reporter_test.dart` covering:
  `NullCrashReporter` never throws, and the factory picks the right
  implementation based on Firebase config presence.
- [ ] Add a profile-mode benchmark test for `ludo_game.dart`'s frame
  build/update cost under representative load, asserting it stays within
  the ~16ms budget; if CI tooling cannot support this reliably, add a
  documented manual profiling procedure instead and say so explicitly in
  the doc.
- [ ] Run `bun run games:build -- --app ludo --platform android --mode
  release --environment debug` (or the closest environment that succeeds
  without real release signing) and record the resulting APK size, or
  record `NOT RUN` with the reason if it fails.
- [ ] Create `docs-internal/gaming/ludo-privacy-policy.md`.
- [ ] Create `docs-internal/gaming/ludo-data-safety.md`.
- [ ] Create `docs-internal/gaming/ludo-store-listing.md`.

## Files Touched

- `apps-native/games/ludo/lib/src/telemetry/ludo_crash_reporter.dart`
- `apps-native/games/ludo/lib/main.dart` (wired)
- `apps-native/games/ludo/test/telemetry/ludo_crash_reporter_test.dart`
- `apps-native/games/ludo/test/perf/ludo_game_frame_budget_test.dart` (or a
  documented manual procedure if CI tooling cannot support it)
- `docs-internal/gaming/ludo-privacy-policy.md`
- `docs-internal/gaming/ludo-data-safety.md`
- `docs-internal/gaming/ludo-store-listing.md`

## Acceptance Criteria

- `NullCrashReporter` absorbs every call without throwing when Firebase
  config is absent; the real reporter is selected only when config is
  present.
- The board scene's frame-build cost is verified against the ~16ms budget
  by an automated benchmark test, or — if that is genuinely not feasible in
  this environment — a documented manual profiling procedure exists and
  says so explicitly rather than silently omitting the check.
- The release APK size is either measured and recorded (pass/fail against
  the 40MB budget) or explicitly recorded as `NOT RUN` with a reason — never
  fabricated.
- All three release-prep documents exist under `docs-internal/gaming/` with
  real, specific content (not placeholder lorem ipsum).

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- `bun run games:build -- --app ludo --platform android --mode release --environment debug` (record size or `NOT RUN`)
- `bun run check:doc-paths`
- `bun run check:staged-docs`

## Out of Scope

- Actually configuring Firebase Crashlytics in a real console, or applying
  for release signing keys (task 29).
- Actually submitting the Data Safety form or store listing in Play
  Console (task 29 uses these drafts to do that).
- Any gameplay/feature code change.

## Commit message

`feat(ludo): add crash reporting, perf/size budgets, and release-prep drafts [15-ludo-launch/27]`
