# Epic 14 — Merge Relay selected-MVP implementation

Status: in-progress

## Ownership

| Task | Owner | Scope | Status |
|---|---|---|---|
| 00 | Integration lead | Versioned HTTP contracts, auth/session, clocks and errors | [~] v1 DTOs, route-produced matrix fixture (21 outcomes, 47 error codes) consumed by strict Dart codecs; provider/PGS/commerce route codes and guest/config success fixtures not covered |
| 01 | Merge service | Challenge, attempt, result, relay, daily, guest, social and telemetry service foundation | [~] service foundation plus independent-review fixes (guest-upgrade rebind, owner-scoped idempotency, self-play and daily-checkpoint guards, commerce migration on upgrade, alias); re-review and production gates open |
| 02 | Database owner | Drizzle normalized adapter and unapplied migration | [~] Drizzle adapter, migrations 0000-0011 (0011 unapplied), Postgres 16 tests pass; production migration and retention policy open |
| 03 | Client owner | Flutter gateway and end-to-end device wiring | [~] gateway/rules separation done; routing and reservation sit behind MERGE_RELAY_SOCIAL (off), no manual-code UI, no reward/ad/tuning gate screens; device run NOT RUN |
| 04 | Release owner | Sandbox commerce, remote gates, Android review and service deployment checks | [~] providers disabled by default (tested), deploy-workflow secret scope tested, debug APK builds (not installed); device smoke and two-device NOT RUN |
| 05 | Release/service owners | Corrective full-MVP, Google Play Games v2, Play quality, and external-config gates | [~] MR-01..15 reconciled in merge-relay-mr-reconciliation.md (none fully done); PGS bridge dormant; Play/PGS inputs, device, tester and release evidence open |
| 06 | Client and UX owners | Swipe-first solo shell, tutorial, ordered saves and physical Android evidence | [~] swipe/tutorial/versioned saves with process-death tests, Home profile/achievement entries (provider UI only); pause/reset-guard audit open; physical Android evidence NOT RUN |
| 07 | Domain owner | Frozen config, daily seed, cross-runtime fixtures and numeric guards | [~] fixtures, client MergeChallenge shared hash, TS unknown-field strictness, max_legal_moves default and record immutability on rollback done; server-daily custom-weight spawns and result-record PostgreSQL test open |
| 08 | Android/native owner | Optional PGS v2 bridge, guest-first auth and provider outbox seam | [~] PGS bridge, guest-first startup, outbox seam and no-client-score policy checks unit-tested; live PGS project, tester and console NOT RUN |
| 09 | Android/client owner | Strict HTTP gateway, links, recovery, sync and service error states | [~] strict gateway, links, fixtures, service-outcome UI and server daily states tested on fake gateway; real-service/two-device proof NOT RUN |
| 10 | Merge service owner | Bounded backend corrective foundation and PostgreSQL/provider regression gates | [x] 35 focused tests, 6 isolated PostgreSQL tests; full-MVP gates remain open |
| 11 | Integration/tooling owner | Pinned backend/Next maintenance CI and local share-preview smoke | [x] actionlint, root gates, docs, and local smoke pass; release gates remain open |
| 12 | Merge service owner | Idempotent cloud-save receipts, atomic save events, and guest-upgrade migration | [~] receipt path passes on Docker postgres:16; independent review done (no receipt findings), re-review open |
| 13 | Merge service owner | Server-side Google Play cosmetic purchase verification, restore, and entitlement settlement | [~] commerce PostgreSQL tests, RTDN, voided requery, ad SSV tested; purchases/ad records migrate on guest upgrade; native Billing, sandbox product and live Play/AdMob delivery NOT RUN |

The v0.3 source scope is the active target. P0 local play remains an early
checkpoint; these tasks do not mark the product published or market validated.
Task 05 is in progress with the backend contract and persistence remediation
under review; client, PGS, and external-gate work remains open. The durable scope and acceptance
sequence are in [the corrective release plan](../../../docs-internal/gaming/merge-relay-release-plan.md);
writing that plan does not advance any implementation, integration, verification,
enablement, or publication state.

Tasks 00–02 have a tested service and persistence foundation, but remain open
until the canonical wire and independent service review are closed. The
isolated PostgreSQL 16.15 concurrency, rollback, environment-scope, and bounded
cursor run is now recorded; production migration remains unapplied. Tasks
06–09 are bounded parallel work and do not falsely mark tasks 03–05 or the
full v0.3 product complete. See [the audit](../../../docs-internal/gaming/merge-relay-release-audit.md).
