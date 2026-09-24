---
epic: 15-ludo-launch
task: 26d-revenuecat-iap-backend
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/26c-coin-tables-escrow]
estimate: L
---

# RevenueCat webhook, product grants, and Vortex Pass entitlement

## Goal

Add a RevenueCat webhook endpoint for Ludo, a product-id → grant mapping
covering every IAP product in task 26a's config (minus the dropped Remove
Ads product), idempotent grant handling, Vortex Pass subscription
entitlement tracking, refund/revocation handling, and a client sync
endpoint.

## Context/Decisions

- Per research.md section 3/4: this repo has **no existing RevenueCat
  webhook handler** to copy (`apps/native` checks entitlements client-side
  only). Merge Relay's Google-Play-direct verification
  (`packages/api/src/games/merge-relay/commerce-*.ts`) is the closer prior
  art for idempotency/transactional patterns, but Ludo Vortex uses
  RevenueCat webhooks specifically (per the approved decision), not direct
  Play Developer API verification — read Merge Relay's
  `commerce-service.ts` for the idempotency-key-from-hash pattern to copy,
  not for the verification transport.
- Webhook endpoint: `POST /:environment/revenuecat/webhook` on
  `packages/api/src/games/ludo/routes.ts`, authenticated by validating the
  `Authorization` header against a shared secret configured in the
  RevenueCat dashboard (env var `REVENUECAT_WEBHOOK_SECRET_LUDO` or reuse
  the existing `REVENUECAT_WEBHOOK_SECRET` env var documented in
  `CLAUDE.md` if it is meant to be shared across apps — confirm by reading
  how/whether `apps/native` or any existing route already reads
  `REVENUECAT_WEBHOOK_SECRET` before deciding to add a new Ludo-specific
  one).
- Product → grant mapping: a table (in `economy-config.ts` from task 26a,
  or a new `packages/api/src/games/ludo/iap-catalog.ts` that imports from
  it) mapping each RevenueCat product identifier (`ludo_coins_small`,
  `ludo_coins_medium`, `ludo_coins_large`, `ludo_diamonds_small`,
  `ludo_diamonds_medium`, `ludo_diamonds_large`, `ludo_starter_pack`,
  `ludo_pass_monthly`) to its grant payload (currency + amount, or the
  Vortex Pass entitlement). No `ludo_noads`/Remove-Ads product exists in
  this mapping.
- Idempotent grants: keyed on RevenueCat's event id (webhook payload's
  `event.id`), unique-constrained the same way task 26a's
  `ludo_wallet_transactions.idempotency_key` is — a replayed webhook for
  the same event id must be a no-op, verified by a test that POSTs the
  same fixture payload twice.
- Vortex Pass subscription entitlement: track active/expired state from
  `INITIAL_PURCHASE`/`RENEWAL`/`CANCELLATION`/`EXPIRATION`/`BILLING_ISSUE`
  event types in `ludo_inventory` (item_type `pass`, with an
  `expires_at`-bearing extension — add the column if `ludo_inventory` from
  task 26a doesn't already carry one; if it doesn't, add it here as a
  targeted column addition + migration rather than reworking task 26a's
  table) or a small dedicated `ludo_subscriptions` table if that's cleaner
  — pick one and be consistent, document the choice in this task's commit
  body.
- Refunds/revocations: a `REFUND`/`CANCELLATION` (with immediate revoke)
  event debits back the previously-granted currency/entitlement (reason
  `refund`, negative delta) — never simply delete the original grant row,
  since the ledger is append-only.
- Client sync endpoint: `POST /:environment/revenuecat/sync` — called by
  the client after a purchase or `restorePurchases()` to force-refresh
  entitlement state from a fresh RevenueCat `CustomerInfo` fetch (server-
  side call to RevenueCat's REST API using the account's secret key) rather
  than trusting the client's local purchase claim; this is the safety net
  for a webhook that hasn't arrived yet or was missed.

## Implementation Checklist

- [ ] Add `packages/api/src/games/ludo/iap-catalog.ts`: product-id → grant
  mapping for every IAP product in task 26a's config (confirm no Remove-Ads
  entry exists).
- [ ] Add `POST /:environment/revenuecat/webhook` to
  `packages/api/src/games/ludo/routes.ts`: header-secret auth, event-id
  idempotency, dispatch by event type to a grant/refund/subscription-state
  update, all inside one transaction per event.
- [ ] Add `POST /:environment/revenuecat/sync`: authenticated by the Ludo
  game token, calls RevenueCat's REST API for the subject's `CustomerInfo`,
  reconciles entitlement/subscription state.
- [ ] Add subscription/entitlement tracking for Vortex Pass per the Context
  decision (extend `ludo_inventory` or add `ludo_subscriptions` — pick one,
  migrate if schema changes, document the choice).
- [ ] Add `packages/api/src/games/ludo/revenuecat-webhook.test.ts` with
  fixture payloads for `INITIAL_PURCHASE` (coins), `NON_SUBSCRIPTION_
  PURCHASE`, `RENEWAL`/`CANCELLATION`/`EXPIRATION` (Vortex Pass), and
  `REFUND` — covering: correct grant per product, replayed event id is a
  no-op, refund debits the original grant, and an unrecognized product id
  is rejected/logged rather than silently ignored.
- [ ] Add `packages/api/src/games/ludo/revenuecat-sync.test.ts` covering
  the sync endpoint reconciling a mocked `CustomerInfo` response.

## Files Touched

- `packages/api/src/games/ludo/iap-catalog.ts`
- `packages/api/src/games/ludo/routes.ts`
- `packages/db/src/schema.ts` (only if a schema change is needed for
  subscription state, with a generated migration)
- `packages/api/src/games/ludo/revenuecat-webhook.test.ts`
- `packages/api/src/games/ludo/revenuecat-sync.test.ts`

## Acceptance Criteria (objective)

- Every IAP product in task 26a's config grants the correct currency/
  entitlement on its corresponding webhook event, verified by fixture
  tests; no Remove-Ads product exists anywhere in the mapping.
- The same webhook event id POSTed twice grants currency/entitlement
  exactly once, verified by a test.
- A `REFUND` event debits back the original grant via a negative-delta
  ledger row, never by deleting the original row, verified by a test.
- Vortex Pass entitlement state transitions correctly through
  active → renewed → cancelled/expired, verified by fixture tests.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test -- revenuecat-webhook.test.ts revenuecat-sync.test.ts`
- `bun run check`

## Out of Scope

- Client-side `purchases_flutter` integration (task 26g).
- AdMob rewarded ads (task 26h, unrelated to RevenueCat).
- Actually creating the RevenueCat project/products in the dashboard (task
  26i drafts the setup runbook; provisioning itself happens in a later
  human task per the epic's established pattern).

## Commit message

`feat(ludo): add revenuecat webhook, iap grants, and vortex pass entitlement [15-ludo-launch/26d]`
