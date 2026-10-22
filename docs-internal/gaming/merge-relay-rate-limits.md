---
title: Merge Relay rate limits
description: Store-backed fixed-window rate limits for the public and abuse-prone Merge Relay routes.
---

# Merge Relay rate limits

Closes the server half of MR-13. Limits are enforced by an injected `MergeRateLimiter`
(`rate-limit.ts`). The production limiter, `createStoreRateLimiter`, keeps one counter artifact
(`rate_limit` record type) per action, key and window in the same Merge Relay artifact store as the
rest of the service, so the count is shared by every instance and survives restarts. There is no
in-process state on the production path. `InMemoryRateLimiter` exists for tests only.

## Algorithm

Fixed window: the window start is `floor(now / windowSeconds) * windowSeconds`. Each call in a
window increments the counter inside an artifact transaction; once the count would exceed the limit
the call is denied and nothing is written. A new window starts a new counter, so counts do not carry
over. Denied responses carry `Retry-After` (seconds until the window ends, minimum 1).

## Routes and keys

| Action | Route | Key | Default |
|---|---|---|---|
| `guest_create` | `POST /:environment/guest` | client address | 20 per hour |
| `guest_recover` | `POST /:environment/guest/recover` | client address | 30 per hour |
| `challenge_create` | `POST /:environment/challenges` | effective subject | 30 per hour |
| `attempt_reserve` | `POST /:environment/challenges/:id/attempts` | effective subject | 60 per hour |
| `event_post` | `POST /:environment/events` | effective subject | 120 per minute |
| `social_post` | `POST /:environment/social/report` and `/block` | effective subject | 20 per hour |

Counters are scoped by environment (they live in the environment's artifact scope), action and key,
and the key is hashed before storage. Limits are checked before body parsing and before any business
logic. A denied call returns HTTP 429 with error code `rate_limited`.

The client address is the first `X-Forwarded-For` entry, then `X-Real-IP`, else `unknown`. This is
only trustworthy behind a proxy that overwrites those headers (the hosting platform does); behind
anything else a client can rotate it. Requests with no usable address share the `unknown` bucket,
which is deliberately strict.

## Configuration

`createConfiguredMergeRelayRoutes` always enables the store-backed limiter. Override a rule with
`MERGE_RELAY_RATE_LIMIT_<ACTION>=<limit>:<windowSeconds>`, for example
`MERGE_RELAY_RATE_LIMIT_EVENT_POST=240:60`. Limits must be 1 to 1,000,000 and windows 1 to 86,400
seconds; invalid values fail the request closed. `createMergeRelayRoutes` has no limiter unless one
is injected, which is how the existing route tests run without limits.

## Trade-offs

- Each counted call is one artifact transaction and therefore takes the per-environment scope lock.
  This is acceptable for the current traffic and keeps one consistent store; a high-volume launch
  should move counters to an atomic upsert table behind the same interface.
- A storage failure fails the request with 503 rather than skipping the limit.
- Counter artifacts are deleted by the `rate_limits` category of [retention](merge-relay-retention).
