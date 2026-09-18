---
epic: 14-merge-relay-implementation
task: 05-release-corrective-gates
status: in-progress
commit_scope: merge-relay
depends_on: [14-merge-relay-implementation/03-client, 14-merge-relay-implementation/04-release]
estimate: XL
---

# Execute the Merge Relay corrective release plan

## Context

The preview is not release-ready. The full v0.3 product remains the target,
and Google Play Games is an additional user-approved requirement. The current
repository has local play, a typed client/service loop for the local Hono path,
an app-local PGS bridge/status seam, service provider tests, and private
test-key artifacts; it does not have configured PGS, external Play config,
complete authored content, two-device evidence, or publication evidence.

The contract and database gates are reopened by the [service/release audit](../../../docs-internal/gaming/merge-relay-release-audit.md):
local API tests do not close canonical wire/hash/outcome, identity, role,
retirement, frozen-revision, daily, storage, or event/reward uniqueness work.

## Pending checklist

- [ ] Reconcile the full MR-01–MR-15 client, domain, service, content, economy,
  social, offline, and telemetry contracts before implementation.
- [ ] Complete swipe-first UX, fixed viewport, versioned tutorial, home/mode
  outcomes, daily references, ordered persistence, and full authored content.
- [ ] Wire the real versioned service gateway and cross-device conflict states.
- [ ] Add the official PGS v2 dependency and typed app-local Kotlin bridge;
  preserve guest identity and keep sign-in optional.
- [ ] Add verified PGS identity mapping, server-authoritative platform outbox,
  fair leaderboard/achievement policies, and optional Integrity checks.
- [ ] Obtain external Play IDs, credentials, fingerprints, tester access, and
  policy/store inputs without committing secrets or submitting releases.
- [ ] Pass Dart/native/API tests, physical Android configured-tester scenarios,
  second-device restore, AAB/API 36/16 KB/64-bit/permission checks, and the
  full release evidence review.

## Acceptance

All requirements are separately specified, implemented, integrated, verified,
and enabled. A local smoke build, test-key AAB, client-only relay, or client
score submission does not satisfy this task. Publication remains a separately
approved action.
