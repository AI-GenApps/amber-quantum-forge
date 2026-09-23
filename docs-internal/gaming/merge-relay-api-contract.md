---
title: Merge Relay API contract
description: Versioned Merge Relay HTTP, authorization, persistence, and release contract.
---

# Merge Relay API contract

The Merge Relay service is mounted at `/api/games/merge_relay/:environment`.
The current contract is `merge-relay.v1`; all successful responses use
`{"contract_version":"merge-relay.v1","data":...}`. The client sends the
canonical snake_case JSON names below. The server keeps a separate typed
internal model and validates every checkpoint before persistence or replay.
The route-produced deterministic exchange fixture is
`packages/api/src/games/merge-relay/fixtures/merge-relay-v1-http.json`; its
create, resolve, reserve, submit, finalize, daily, and error cases are checked
by `http-fixture.test.ts`.

## Checkpoints and replay

```json
{
  "board": [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "score": 0,
  "move_count": 0,
  "seed": 12345,
  "rng_state": 1955480042,
  "rule_version": "MR-2D-1",
  "max_legal_moves": 3,
  "content_id": "daily_20260917",
  "content_version": "MR-CONTENT-1",
  "spawn_two_weight": 90,
  "spawn_four_weight": 10
}
```

The board always has 16 non-negative power-of-two cells or zero. Scores,
move counts, seeds, and RNG state have bounded safe-integer ranges. The rule
version is fixed to `MR-2D-1`. `checkpoint_hash` is SHA-256 over compact,
recursively key-sorted JSON of only `board`, `move_count`, `rng_state`,
`rule_version`, `score`, and `seed`. Metadata and the hash field are excluded.
Spawn weights are copied from the frozen config into challenge and child
checkpoints so both runtimes replay the same rules.

## Endpoint matrix

| Method and path | Auth | Request | Result |
|---|---|---|---|
| `POST /:environment/guest` | public | none | guest subject, recovery token, server-issued guest token when configured |
| `POST /:environment/guest/recover` | public | `recovery_token` | guest identity and a refreshed token when configured |
| `POST /:environment/guest/upgrade` | player | `recovery_token` | account-linked guest identity |
| `GET /:environment/challenges/:id/resolve` | public | none | public immutable challenge checkpoint |
| `POST /:environment/challenges` | player | `idempotency_key`, `creator_alias`, `checkpoint`, optional `mode`, `max_legal_moves`, content metadata, `parent_challenge_id` | rescue relay challenge and idempotency result |
| `GET /:environment/challenges/:id` | owner, attempt member, or admin | none | private authenticated challenge view |
| `POST /:environment/challenges/:id/retire` | game admin | none | explicit retired-link state |
| `POST /:environment/challenges/:id/attempts` | player | `reservation_key` | 24-hour attempt reservation |
| `POST /:environment/attempts/:id/moves` | player | `expected_version`, one to three `moves` | authoritative attempt checkpoint |
| `GET /:environment/attempts/:id` | attempt owner or admin | none | reconnectable attempt state |
| `POST /:environment/attempts/:id/finalize` | player | `idempotency_key`, optional `finish_early`, `return_alias` | immutable result and optional returned relay |
| `GET /:environment/results/:id` | result recipient, challenge owner, or admin | none | immutable result |
| `GET /:environment/daily/:date` | public | ISO date in path | previously provisioned immutable daily checkpoint; never writes |
| `POST /:environment/daily/:date/provision` | game-admin or service | ISO date in path | idempotently freezes the daily checkpoint, content, and config revision |
| `GET /:environment/config` | public | none | active feature and tuning revision |
| `PUT /:environment/saves/:id` | player | `expected_version`, `schema_version`, `payload` | optimistic save version |
| `GET /:environment/saves/:id` | player | none | subject-owned save |
| `POST /:environment/rewards` | service | `result_id`, `kind`, `product_id`, `provider_transaction_id` | idempotent provider settlement through an injected adapter |
| `POST /:environment/events` | player | `idempotency_key`, approved `type`, `payload` | idempotent telemetry event |
| `GET /:environment/platform/google-play-games/identity` | player | none | app/environment-scoped link status; no provider ID or token |
| `POST /:environment/platform/google-play-games/identity` | player | `server_auth_code` | verified provider mapping when external configuration exists |
| `POST /:environment/platform/google-play-games/outbox/dispatch` | service | optional `limit` | bounded server-authorized provider delivery |
| `GET /:environment/commerce/catalog` | player | none | fixed cosmetic catalog when the scoped runtime and feature gate are enabled |
| `GET /:environment/commerce/entitlements` | player | none | signed-subject entitlements only |
| `POST /:environment/commerce/google-play/purchases` | player | `product_id`, `purchase_token`, optional `client_request_id` | verified and idempotently settled purchase |
| `POST /:environment/commerce/google-play/restore` | player | `product_id`, `purchase_token`, optional `client_request_id` | reverified entitlement restore, including authorized revocation |
| `POST /:environment/social/report` | player | `target_subject` or `target_alias`, `reason` | moderation report record |
| `POST /:environment/social/block` | player | `target_subject` or `target_alias`, `reason` | block record used by challenge reservation |
| `PUT /:environment/config` | game admin | revision, weights, feature flags | new active config revision |
| `POST /:environment/config/rollback` | game admin | target and expected revision | selected prior config revision |

Every relay attempt has a frozen `max_legal_moves` value from its challenge;
the current relay cap is three legal moves. A challenge may originate from a
rescue, daily, or endless playable board, but its relay `mode` remains
`rescue` and its `origin_mode` is preserved. Daily runs remain separate from
ranked relay comparison and settlement. The service
checks the verified subject, reservation owner, optimistic version, board
legality, reservation expiry, and terminal state. Finalization and rewards
are idempotent. Expiry is persisted as `abandoned` before its conflict is
returned. A client cannot choose the app or environment through a body field.
Save payloads currently require schema version `1`; future versions are
rejected until an explicit migration is added.

Daily content is materialized only by the protected provision endpoint. A
successful provision stores the UTC date seed, content revision, spawn
weights, and config revision; repeated provisioning returns the same record.
The public daily GET reads that immutable record and returns
`daily_unavailable` until an authorized writer has provisioned it. A daily
relay copies those frozen fields into its checkpoint even if a later config
revision is active.

The internal result stores idempotency and request fingerprints for replay
safety, but the public result omits those internal fields and private identity
data. Completion reason (`complete`, `terminal`, or `early_finish`) is kept
separate from any future win, loss, or tie comparison policy.

## Authorization and environments

Protected requests carry a signed HS256 game token. Verification requires the
fixed app ID `merge_relay`, the path environment, configured issuer and
audience, a bounded subject, integer `iat` and `exp`, and a declared role.
Legacy admin tokens do not satisfy this boundary. Guest tokens are issued only
after the server creates the guest subject; there is no public token endpoint
that signs a client-supplied app ID or subject.

`debug`, `staging`, and `production` are separate storage namespaces. A local
file store is never accepted for production. The configured Vercel service
uses PostgreSQL with a scope lock row and normalized per-artifact records for
challenges, attempts, results, saves, guests, daily content, configs, events,
social actions, rewards, and aliases. Each transaction diffs and upserts
changed artifact rows and deletes only rows removed by that transaction; it
never rewrites the complete environment snapshot. The service fails closed
when `DATABASE_URL` or token configuration is missing. No migration is applied
by this repository change. Rewarded ads and purchases remain disabled until an
approved adapter implements full provider attestation; a service role and a
client-supplied transaction ID alone cannot grant a reward.

For local HTTP/device work, set `MERGE_RELAY_LOCAL_STORE=memory` with a
non-production `NODE_ENV` and provide the debug token issuer, audience, and
`GAME_TOKEN_SECRET_MERGE_RELAY_DEBUG`. This is an explicit ephemeral local
service path; production and unconfigured Vercel instances fail closed.

The server-rendered share page resolves its read-only preview only through the
configured `MERGE_RELAY_PUBLIC_ORIGIN` or the trusted Vercel deployment origin.
It does not construct a backend URL from request `Host` headers. Share links
must carry `environment=debug` or `environment=staging` explicitly for local
and pre-production previews; an unknown environment is rejected rather than
silently selecting debug. The server-side cosmetic purchase boundary, fixed
product ID, ProductPurchaseV2 verifier, restore semantics, and disabled live
configuration are recorded in [the commerce boundary](merge-relay-commerce).
The native Billing client, live product registration, RTDN requery, and
rewarded-ad SSV remain disabled.

## Error envelope

Errors use the same contract version and return:

```json
{
  "contract_version": "merge-relay.v1",
  "error": {
    "code": "attempt_version_conflict",
    "message": "Attempt changed on another device",
    "diagnostic_id": "opaque-server-id"
  }
}
```

The client should handle `401` token failures, `403` role or ownership
failures, `409` idempotency/version/expiry conflicts, `422` validation errors,
and `503` missing configuration or storage. Diagnostic IDs are safe to show to
support; request payloads, recovery tokens, and raw captures are not logged.
