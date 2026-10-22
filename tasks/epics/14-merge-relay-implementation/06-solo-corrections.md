---
epic: 14-merge-relay-implementation
task: 06-solo-corrections
status: in-progress
commit_scope: merge-relay-client
depends_on: [14-merge-relay-implementation/00-contracts]
estimate: L
---

# Build the Merge Relay solo play shell

## Ownership

Client and UX owners own this task. The work may proceed against the frozen
domain and contract interfaces while network relay wiring remains open.

## Checklist

- [x] Implement the swipe-first fixed-board viewport with optional accessible
  controls and deterministic gesture arbitration.
- [x] Add a versioned one-time tutorial with skip, replay, and preserved saves.
- [ ] Add Home, Continue, Play, Daily, Relays, profile, theme, settings, and
  achievement entry points with explicit mode outcomes and pause/reset guards.
- [x] Restore ordered writes after every legal move and test process death,
  resume, offline practice, and an existing-save migration.
- [ ] Exercise the solo flow on a physical Android device with small-screen and
  large-text evidence; retain full v0.3 content and progression scope.

## Acceptance

The local solo flow is useful without login, ads, payment, or PGS. A client
screen does not claim ranked validation until task 09 and the service gate are
integrated. This task does not close MR-01–MR-15.

## Evidence note (client lane)

Items 1, 2 and 4 are covered by `flutter test` (gesture, tutorial version,
legacy migration, and `test/merge_relay_process_death_test.dart` for per-move
death, in-flight-write death, burst ordering, and offline daily restart).
Item 3 stays open: no profile or achievement entry point was found on Home.
Item 5 is NOT RUN: no Android device or emulator was available. Eight golden
pixel comparisons fail on this Linux host before and after this change.

## Home entry points note

Home now has Profile and Achievements buttons, shown only when the social gate
(`pgsAccountController`) is present, so the solo v1 build still hides every PGS
control. Profile opens a sheet with rescues cleared, best Endless score and the
Play Games section. Achievements opens provider UI only and never submits a
score. The pause/reset-guard part of the Home checklist item is not audited,
and physical Android evidence is NOT RUN.
