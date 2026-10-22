---
title: Merge Relay retention policy
description: Bounded, idempotent, service-only pruning for Merge Relay telemetry, inactive attempts, ad callbacks, delivered outbox rows and old config revisions.
---

# Merge Relay retention policy

Closes the server half of MR-14 and the retention gate of audit P1-07. Pruning is an explicit,
service-role operation. Nothing runs on a timer and nothing is pruned on the request path.

## Operation

`POST /games/merge_relay/:environment/maintenance/prune` with a `service` role token.

Request body (all fields optional, unknown fields rejected with `invalid_retention`):

| Field | Meaning |
|---|---|
| `dry_run` | `true` reports what would be deleted and deletes nothing. |
| `cursors` | Map of category to the `next_cursor` of a previous partial run. |

Response: `data.prune.dry_run` and `data.prune.categories.<category>` with `scanned`, `deleted`,
`next_cursor` (non-null means the batch or scan limit stopped the run; call again with it) and
`skipped_reason`. Any other role gets 403 `service_role_required`. The service method is
`pruneRetention` in `retention-service.ts`; each category runs in its own artifact transaction under
the normal scope lock.

## Policy

Configured through `MergeRelayServiceDependencies.retention` or, in the configured routes, these
environment variables. Every value must be a positive integer inside a fixed upper bound or the call
fails closed.

| Category | Setting (env suffix after `MERGE_RELAY_RETENTION_`) | Default | Eligible rows |
|---|---|---|---|
| `events` | `EVENT_DAYS` | 90 | Telemetry events with `createdAt` older than the window. |
| `attempts` | `INACTIVE_ATTEMPT_DAYS` | 30 | Cancelled, abandoned or expired-reserved attempts with no result, last updated before the window, **whose challenge is retired**. |
| `ad_ssv` | `AD_SSV_DAYS` | 90 | Ad SSV callback records with `receivedAt` older than the window. |
| `pgs_outbox` | `DELIVERED_OUTBOX_DAYS` | 30 | Outbox rows with status `succeeded` and `updatedAt` older than the window. Pending, leased, retryable, disabled and failed rows are kept. |
| `configs` | `CONFIG_REVISIONS_KEEP` | 50 | Revisions beyond the newest N that are not active and not referenced by any challenge or daily record. |
| all | `BATCH_LIMIT` / `SCAN_LIMIT` | 500 / 5000 | Max deletions and rows examined per category per call. |

## Never deleted

Challenges, results, saves, guests, daily records, aliases, social records, rewards, PGS identities
and credentials, save write receipts, commerce purchases and entitlements, attempts that have a
result (they are the parent of that result), and any config revision a challenge or daily record
references. The memory store validates parent relations after every transaction and PostgreSQL
enforces the parent foreign key, so a mistaken delete fails the transaction.

## Decisions

- Abandoned or expired attempts on a still-open challenge are kept. The attempt row is the guard
  that stops a recipient from reserving the same challenge twice (`reservation_expired`); deleting
  it would reopen the challenge for a fresh try and allow result improvement. They become eligible
  once the challenge is retired.
- Deleting a delivered outbox row cannot cause a second delivery. Outbox rows are created only on
  the first finalize; finalize replays return before enqueueing.
- Deleting an old ad SSV record is safe because SSV timestamps older than the configured maximum age
  are rejected before any lookup.
- The prune is idempotent: a second call with the same policy deletes nothing.
- Config pruning ignores cursors (it always scans newest first) and is skipped with
  `skipped_reason: reference_scan_truncated` if the challenge/daily reference scan exceeds the scan
  limit.
- No schema change or migration is required. Scans are keyset-paged by record ID on the existing
  primary key.

## Operating

Run a `dry_run` first in each environment, then schedule the real call from a service credential
(for example daily), following `next_cursor` until it is `null`. Production execution still needs the
production database approval recorded in the release checklist.
