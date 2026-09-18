---
epic: 14-merge-relay-implementation
task: 10-backend-corrective-foundation
status: completed
commit_scope: merge-relay
depends_on: [14-merge-relay-implementation/00-contracts, 14-merge-relay-implementation/01-service]
estimate: L
---

# Close the bounded Merge Relay backend corrective foundation

## Scope

This task records the accepted implementation foundation. It does not mark
the full MR-01–MR-15 product, Google Play Games configuration, commerce,
publication, or production migration complete.

## Checklist

- [x] Enforce immutable protected daily provisioning and read-only daily GETs,
  including frozen config/content references after later tuning.
- [x] Bound and fence provider outbox leases, retries, identity revisions, and
  response bodies; validate official Google provider response shapes.
- [x] Exercise PostgreSQL migrations, foreign-key/uniqueness constraints,
  targeted artifact writes, rollback, and fresh-config lifecycle behavior.
- [x] Preserve app/environment/subject authorization and guest-upgrade mapping
  boundaries, with route and identity-status regression coverage.
- [x] Publish route-produced HTTP fixtures and update the API contract/audit
  with specified, implemented, integrated, and verified states.

## Verification

- Pinned Bun 1.3.3 focused remediation: 35 tests, 98 assertions.
- Full API suite: 111 passed, 6 skipped; API/root typechecks pass.
- Fresh isolated PostgreSQL 16.15: migrations applied; five adapter tests and
  one fresh-config lifecycle test passed.
- `bun run check:ci`, `bun run knip:ci`, `bun run check:max-lines`, and docs
  validation pass.

## Acceptance boundary

The service foundation is reviewable and deployable as code. Configured PGS,
external provider IDs, authored full content, client/domain parity, two-device
relay proof, commerce, production migration, and publication remain open in
the existing corrective gates.
