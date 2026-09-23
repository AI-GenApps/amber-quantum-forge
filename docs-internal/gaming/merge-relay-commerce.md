---
title: Merge Relay server commerce boundary
description: Server-only cosmetic purchase contract, evidence, and enablement gates.
---

# Merge Relay server commerce boundary

Status: **server implementation reviewable; client and provider enablement open**.

This record covers the bounded server purchase phase. It does not claim a
Google Play project, product registration, native Billing SDK, live purchase,
AdMob integration, RTDN subscription, store submission, or user enablement.
The selected identifiers are repository decisions and are not externally
registered product claims:

| Field | Selected value | External state |
|---|---|---|
| Play one-time product | `merge_relay_theme_pack_v1` | Not registered or priced |
| Server entitlement | `merge_relay.theme_pack.v1` | Internal identifier |
| Product kind | `non_consumable` | Cosmetic-only; no currency purchase |
| Provider | `google_play_billing` | Adapter exists; live credentials absent |

## Source and fixture provenance

The provider parser follows the current Google Android Publisher references:

- [ProductPurchaseV2 get](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.productsv2/getproductpurchasev2)
  defines the package/token GET path and Android Publisher OAuth scope.
- [ProductPurchaseV2 resource](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.productsv2)
  defines `kind`, `productLineItem`, purchase state, and acknowledgement fields.
- [Product acknowledge](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/acknowledge)
  defines the product-token acknowledgement path and empty success body.

The checked-in official-shape fixture is
`packages/api/src/games/merge-relay/fixtures/google-play-product-purchase-v2.json`.
It is test data, not a customer purchase or a claim that the product exists in
Play Console. The fixture is consumed by
`commerce-provider.test.ts`; tests also exercise `PURCHASED`, `PENDING`, and
`CANCELLED` states, product mismatch, malformed responses, and token redaction.

## HTTP contract

The routes are mounted beneath `/api/games/merge_relay/:environment` in the
existing Hono API. The signed app/environment/subject/role session is the only
authorization source. Request bodies cannot select an app or environment.

| Method and path | Auth | Behavior |
|---|---|---|
| `GET /:environment/commerce/catalog` | player | Returns the fixed cosmetic product only when the environment runtime and cosmetics flag are enabled |
| `GET /:environment/commerce/entitlements` | player | Returns only the signed subject's entitlements |
| `POST /:environment/commerce/google-play/purchases` | player | Verifies and settles a new token when the shop is enabled |
| `POST /:environment/commerce/google-play/restore` | player | Re-verifies an authorized token while allowing the shop kill switch to hide new offers |

Purchase and restore requests use this body:

```json
{
  "product_id": "merge_relay_theme_pack_v1",
  "purchase_token": "provider-token",
  "client_request_id": "optional-idempotency-key"
}
```

`app_id` and `environment` are rejected if supplied by a client. Responses
contain product, entitlement, order, state, acknowledgement, timestamps, and
replay/restore flags. Raw purchase tokens, token digests, service-account
credentials, provider response bodies, and provider access tokens never appear
in response DTOs or error messages.

The server stores a SHA-256 token digest as the stable purchase key. A token
cannot move between subjects. A client request ID cannot be reused for a
different token or semantic request. Provider verification precedes the
transaction; purchase and entitlement records are written together. Pending
states do not grant an entitlement. Purchased states acknowledge before the
grant. Authorized refunded, revoked, or cancelled states revoke the entitlement
and remain idempotent. The catalog kill switch blocks new offers but does not
block restore or a later authorized settlement.

## Environment configuration

Runtime construction is scoped to the path environment and fails closed unless
all of these values are present and valid:

```text
MERGE_RELAY_PLAY_<ENV>_PACKAGE_NAME
MERGE_RELAY_PLAY_<ENV>_PRODUCT_ID=merge_relay_theme_pack_v1
MERGE_RELAY_PLAY_<ENV>_SERVICE_ACCOUNT_JSON
MERGE_RELAY_PLAY_<ENV>_PURCHASE_TOKEN_KEY   # optional 32-byte base64url key
```

The service-account adapter uses the Android Publisher OAuth scope and a fixed
Google token URI. If the optional token key is configured, AES-GCM retention is
bound by authenticated data to `merge_relay`, the environment, the subject,
the provider, and the vault version. Missing or invalid configuration leaves
the catalog disabled and purchase settlement unavailable; it does not create a
fake success path.

## Evidence state

| Capability | Specified | Implemented | Integrated | Verified | Enabled |
|---|---|---|---|---|---|
| Fixed product, entitlement, and cosmetic-only catalog | yes | yes | no native client | route/runtime tests | no |
| Purchase and restore HTTP DTOs | yes | yes | no native client | route/service tests | no |
| ProductPurchaseV2 verifier and acknowledgement | yes | yes | no live provider | 7 provider tests and official fixture | no |
| Service-account OAuth adapter | yes | yes | no live credentials | typecheck; live call NOT RUN | no |
| Pending/purchased/cancelled/refunded/revoked settlement | yes | yes | provider fake only | 6 service tests | no |
| Token ownership, request idempotency, and subject isolation | yes | yes | no native client | route/service tests | no |
| Encrypted token retention | yes | yes | no configured key | 2 vault tests | no |
| PostgreSQL commerce persistence | yes | generic adapter only | no purchase-specific PG suite | purchase tests use injected store; receipt/adapter PG run passed | no |
| Native Google Play Billing SDK | yes | no | no | NOT RUN | no |
| RTDN/voided-purchase requery | yes | no | no | NOT RUN | no |
| AdMob rewarded SSV | yes in full product scope | no | no | NOT RUN | no |
| External product registration, pricing, credentials, and live money | external | no | no | NOT RUN | no |

The server purchase tests use the same platform artifact store seam as the
PostgreSQL adapter, but there is no dedicated commerce PostgreSQL test yet.
The isolated run therefore reports the distinction explicitly instead of
claiming purchase durability was exercised against PostgreSQL.

## Changed-file snapshot

Receipt work is separated from purchase work for review and staging.

Receipt-specific files:

```text
packages/api/src/games/merge-relay/contracts.ts
packages/api/src/games/merge-relay/data-service.ts
packages/api/src/games/merge-relay/identity-artifact-migration.ts
packages/api/src/games/merge-relay/identity-service.ts
packages/api/src/games/merge-relay/route-data.ts
packages/api/src/games/merge-relay/save-contracts.ts
packages/api/src/games/merge-relay/save-receipt-migration.ts
packages/api/src/games/merge-relay/save-receipt-route.test.ts
packages/api/src/games/merge-relay/save-receipt.test.ts
packages/api/src/games/merge-relay/save-service.ts
packages/api/src/games/merge-relay/drizzle-postgres-save-receipt.test.ts
packages/api/src/games/merge-relay/wire.ts
```

Purchase-specific files:

```text
packages/api/src/games/merge-relay/commerce-contracts.ts
packages/api/src/games/merge-relay/commerce-google-auth.ts
packages/api/src/games/merge-relay/commerce-parsers.ts
packages/api/src/games/merge-relay/commerce-provider.ts
packages/api/src/games/merge-relay/commerce-provider.test.ts
packages/api/src/games/merge-relay/commerce-route.test.ts
packages/api/src/games/merge-relay/commerce-runtime.ts
packages/api/src/games/merge-relay/commerce-runtime.test.ts
packages/api/src/games/merge-relay/commerce-service-helpers.ts
packages/api/src/games/merge-relay/commerce-service.ts
packages/api/src/games/merge-relay/commerce-service.test.ts
packages/api/src/games/merge-relay/commerce-validation.ts
packages/api/src/games/merge-relay/commerce-vault.ts
packages/api/src/games/merge-relay/commerce-vault.test.ts
packages/api/src/games/merge-relay/commerce-wire.ts
packages/api/src/games/merge-relay/route-commerce.ts
packages/api/src/games/merge-relay/fixtures/google-play-product-purchase-v2.json
```

Shared boundary files are `artifact-store.ts`, `drizzle-legacy-state.ts`,
`drizzle-store.ts`, `dependencies.ts`, and `routes.ts`; they preserve platform
record rows and mount both the existing platform routes and commerce routes.
`fingerprint.ts`, `fingerprint.test.ts`, `validation.ts`, and
`state-validation.ts` are shared by receipt and gameplay records. Their change
adds finite-number/safe-integer validation and undefined-key canonicalization;
it affects every request fingerprint and is covered by the full Merge Relay
suite. `pgs-runtime.test.ts` is an independent Bun environment-test portability
fix and is not part of receipt or purchase behavior.

## Verification record

On 2026-09-18, an isolated temporary PostgreSQL 16.15 cluster on port 55441
applied all checked-in migrations and was stopped after the run. The combined
receipt/adapter/lifecycle and purchase command passed 31 tests across 8 files:
five receipt tests, five adapter tests, one fresh-config lifecycle test, and 20
purchase/provider/runtime/route/vault tests. The local temporary cluster was
not the QA server on port 4002.

The full Merge Relay suite passed 99 tests with 11 PostgreSQL tests skipped when
run without `MERGE_RELAY_TEST_DATABASE_URL`. API typecheck and `bun run
check:ci` passed. No production migration, provider call, native Billing SDK,
Play Console action, AdMob call, deployment, or publication was performed.
