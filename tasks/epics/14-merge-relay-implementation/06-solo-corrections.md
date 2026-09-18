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

- [ ] Implement the swipe-first fixed-board viewport with optional accessible
  controls and deterministic gesture arbitration.
- [ ] Add a versioned one-time tutorial with skip, replay, and preserved saves.
- [ ] Add Home, Continue, Play, Daily, Relays, profile, theme, settings, and
  achievement entry points with explicit mode outcomes and pause/reset guards.
- [ ] Restore ordered writes after every legal move and test process death,
  resume, offline practice, and an existing-save migration.
- [ ] Exercise the solo flow on a physical Android device with small-screen and
  large-text evidence; retain full v0.3 content and progression scope.

## Acceptance

The local solo flow is useful without login, ads, payment, or PGS. A client
screen does not claim ranked validation until task 09 and the service gate are
integrated. This task does not close MR-01–MR-15.
