---
epic: 14-merge-relay-implementation
task: 00-contracts
status: in-progress
commit_scope: merge-relay
depends_on: [13-gaming-portfolio-preparation/07-merge-relay, 13-gaming-portfolio-preparation/12-api-isolation]
estimate: M
---

# Freeze the Merge Relay service contract

## Context

Merge Relay v0.3 requires a real server-validated friend and return relay.
The generic `/games` boundary supplies authorization and storage seams but has
no Merge-specific challenge, attempt, replay, daily, recovery, reward, or
telemetry contract.

## Implementation Checklist

- [x] Publish the versioned HTTP DTOs and endpoint matrix in the gaming docs.
- [x] Add pure TypeScript validation for checkpoint, move, alias, date, event,
  and idempotency inputs.
- [x] Define the injected clock, app/environment session, configuration, and
  error contracts without changing legacy auth.
- [x] Add route contract tests for signed scope, public resolution, malformed
  payloads, expiry, and error codes.
- [~] Resolve the service-review wire/hash/outcome, role, guest-upgrade,
  retirement, frozen-revision, daily-reference, and identity-key findings
  before declaring the HTTP contract frozen. Origin mode is preserved while
  relay mode remains rescue. Daily records are created by the protected,
  idempotent provision route; public GET is read-only and returns
  `daily_unavailable` until a date is provisioned.

## Verification

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test`
- `cd packages/api && bun run test -- contract-regressions.test.ts`
- `bun run check:ci`

## Acceptance

The client owner can implement against the route-produced `merge-relay.v1`
fixture and canonical snake_case codecs. The current fixture covers
create/resolve/reserve/submit/finalize/daily and error responses. Cross-runtime
Dart consumption, complete outcome coverage, and independent service review
remain open; every authorization decision still uses the verified app,
environment, subject, and role.
