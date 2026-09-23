---
epic: 14-merge-relay-implementation
task: 13-commerce-server
status: in-progress
commit_scope: merge-relay-commerce
depends_on: [14-merge-relay-implementation/10-backend-corrective-foundation]
estimate: M
---

# Add the Merge Relay server commerce boundary

## Scope

Implement the server side of the selected cosmetic Google Play product while
preserving the existing game identity, environment, storage, and reward
boundaries. The selected IDs are repository decisions, not external Play
registrations. The client Billing SDK, live provider credentials, RTDN, AdMob,
and store publication remain separate gates.

## Checklist

- [x] Freeze `merge_relay_theme_pack_v1` and
  `merge_relay.theme_pack.v1` as cosmetic-only catalog identifiers.
- [x] Add environment-scoped ProductPurchaseV2 verification and product-token
  acknowledgement adapters with strict official-shape parsing.
- [x] Add authenticated catalog, subject entitlements, purchase, and restore
  routes. Reject client-supplied app or environment selectors.
- [x] Settle pending, purchased, cancelled, refunded, and revoked states with
  idempotent token/request ownership and transactional entitlement records.
- [x] Keep optional encrypted token retention bound to app, environment, and
  subject; never return or log raw provider credentials or tokens.
- [x] Add official-shape provider fixtures and service, route, runtime, and
  vault regression tests.
- [ ] Add dedicated commerce PostgreSQL lifecycle/concurrency coverage.
- [ ] Integrate the native Billing SDK and a configured sandbox product.
- [ ] Add authenticated RTDN/voided-purchase requery and rewarded-ad SSV.

## Verification

The focused commerce run passes 20 tests across service, provider, runtime,
route, and vault files. The full Merge Relay suite passes 99 tests with 11
PostgreSQL tests skipped when no test database URL is supplied. An isolated
PostgreSQL 16.15 run on temporary port 55441 passed 31 receipt, adapter,
lifecycle, and commerce tests across 8 files; it did not contain a dedicated
commerce PostgreSQL test. `bun run check:ci`, API typecheck, and the pinned Bun
test run pass. Provider and live external configuration are NOT RUN.

See [the commerce boundary](../../../docs-internal/gaming/merge-relay-commerce.md)
for the DTO, environment variables, source links, and specified/implemented/
integrated/verified/enabled ledger.

## Acceptance boundary

This task makes a reviewable server foundation. It does not claim a registered
Play product, native client purchase flow, live money, RTDN delivery, AdMob
settlement, store publication, or full MR-01–MR-15 completion.
