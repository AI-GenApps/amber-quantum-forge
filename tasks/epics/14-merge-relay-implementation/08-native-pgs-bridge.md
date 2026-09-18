---
epic: 14-merge-relay-implementation
task: 08-native-pgs-bridge
status: in-progress
commit_scope: merge-relay-platform
depends_on: [14-merge-relay-implementation/00-contracts]
estimate: L
---

# Add the optional Google Play Games Services bridge

## Ownership

Android/native owns this task. The bridge is app-local to Merge Relay and must
not add PGS SDKs, permissions, or metadata to the other four games.

## Checklist

- [x] Add the current PGS v2 Kotlin capability bridge with typed results and
  guest-first startup; sign-in decline never blocks local play.
- [x] Keep the internal backend account separate from the PGS profile and
  provide an authenticated mapping/status/outbox seam for server verification.
- [ ] Add achievement and fair leaderboard policy checks without trusting a
  client score or fabricated external numeric IDs.
- [~] Test disabled/missing configuration, offline, decline, resume, upgrade,
  and configured tester flows. Native/unit coverage exists; live configured
  tester and console tests are NOT RUN because no PGS project exists.

## Acceptance

The compiled app remains functional when PGS is unavailable. External project
IDs, credentials, fingerprints, tester accounts, and store configuration are
release gates and are not invented or committed by this task.
