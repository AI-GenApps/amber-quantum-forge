---
epic: 14-merge-relay-implementation
task: 01-service
status: in-progress
commit_scope: merge-relay
depends_on: [14-merge-relay-implementation/00-contracts, 14-merge-relay-implementation/02-database]
estimate: XL
---

# Implement the Merge Relay service

## Implementation Checklist

- [x] Implement immutable checkpoint creation and idempotent challenge writes.
- [x] Implement one-time 24-hour reservations and bounded legal move submits.
- [x] Implement finalize-once results, reciprocal playable child relays, and
  server replay validation.
- [x] Implement guest recovery/upgrade, daily content, optimistic save sync,
  tuning rollback, report/block, and artifact-linked telemetry.
- [x] Add adversarial tests for scope, replay, expiry, duplicate requests,
  cross-user access, and client score tampering.

The service foundation and bounded remediation are implemented and tested.
Remote configuration is versioned and rollback-safe at the API boundary;
daily provisioning is explicit and immutable, public daily reads do not write,
and applying a selected revision to every new client run remains a
client/domain integration task. Provider-backed rewards are fail-closed until
a real configured adapter is injected. The focused remediation suite currently
passes 35 tests and 98 assertions; this does not close the independent audit
or full-MVP integration gate.

## Verification

- `cd packages/api && bun run test`
- `cd packages/api && bun run typecheck`
- `bun run knip:ci`

## Acceptance

The service foundation owns all ranked outcomes and never accepts a client score, app ID,
rules version, or clock as authorization or truth. Local tests use the same
versioned fixtures as the client; production storage remains unapplied until
an explicit database operation is approved. Full MR-05 client routing,
MR-09 content curation, and MR-12 client revision application remain open in
the client/content work items.
