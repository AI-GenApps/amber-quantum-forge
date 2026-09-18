---
epic: 14-merge-relay-implementation
task: 09-http-gateway
status: in-progress
commit_scope: merge-relay-client
depends_on: [14-merge-relay-implementation/00-contracts]
estimate: L
---

# Consume the Merge Relay HTTP contract in the client

## Ownership

Android/client owns this task. The gateway consumes the route-produced fixture
and does not duplicate server rules or select an identity from a client
app_id, score, or role field.

## Checklist

- [x] Decode canonical `merge-relay.v1` snake_case responses and errors with
  strict version, hash, outcome, config, and environment checks.
- [x] Add challenge-link parsing for `mergerelay://challenge/<opaque-id>` and
  the configured HTTPS public origin; crawlers never reserve attempts.
- [ ] Wire guest recovery, manual code fallback, reservation, move submit,
  finalize, daily, sync-conflict, retirement, and offline retry states.
- [x] Consume the deterministic create/resolve/reserve/submit/finalize/daily
  fixtures unchanged in a Dart client test and exercise signed role failures.
- [ ] Record real service, missing-config, expired-token, and provider-disabled
  states as actionable UI outcomes.

## Acceptance

The gateway can run against a configured local service and never presents a
client-only relay as ranked or server-authoritative. Full multi-device proof
and external deployment remain open in tasks 03–05.
