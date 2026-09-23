---
epic: 14-merge-relay-implementation
task: 12-cloud-save-receipts
status: in-progress
commit_scope: merge-relay
depends_on: [14-merge-relay-implementation/10-backend-corrective-foundation]
estimate: M
---

# Add idempotent Merge Relay cloud-save receipts

## Scope

Extend the existing authenticated save route without changing the client
save shape. A write may carry `client_write_id`; the server stores a canonical
payload fingerprint and a separate app/environment/subject/save-scoped receipt.
The receipt, save, and checkpoint event commit atomically. Ranked challenge,
attempt, result, reward, and PGS artifacts remain separate records.

## Checklist

- [x] Preserve old expected-version-only writes and existing `data.save` DTO.
- [x] Add additive receipt fields for successful writes and explicit write-ID
  and optimistic-version conflicts.
- [x] Make same-ID retries return the original saved version and event after
  later writes; reject changed payload/schema/expected-version reuse.
- [x] Keep receipt keys isolated by subject, environment, and save ID.
- [x] Migrate receipt records with guest save upgrades without crossing
  account or environment boundaries.
- [x] Add focused service and HTTP regression tests.
- [ ] Run the receipt path through the isolated PostgreSQL service suite and
  complete independent review before marking this task complete.

## Verification

Current focused run: 7 receipt service tests and 3 HTTP tests pass in memory,
including malformed unsafe-number rejection, and 5 PostgreSQL receipt tests
pass against an isolated PostgreSQL 16.15 cluster. API typecheck, root Biome,
max-lines, and Knip checks pass. Independent review and the final task commit
remain open.

## Acceptance boundary

This task covers durable receipt semantics and save isolation. It does not
implement commerce, telemetry, client retry UI, or full Merge Relay release
gates.
