# Epic 14 — Merge Relay selected-MVP implementation

Status: in-progress

## Ownership

| Task | Owner | Scope | Status |
|---|---|---|---|
| 00 | Integration lead | Versioned HTTP contracts, auth/session, clocks and errors | [~] |
| 01 | Merge service | Challenge, attempt, result, relay, daily, guest, social and telemetry service foundation | [~] |
| 02 | Database owner | Drizzle normalized adapter and unapplied migration | [~] |
| 03 | Client owner | Flutter gateway and end-to-end device wiring | [ ] |
| 04 | Release owner | Sandbox commerce, remote gates, Android review and service deployment checks | [ ] |
| 05 | Release/service owners | Corrective full-MVP, Google Play Games v2, Play quality, and external-config gates | [~] |
| 06 | Client and UX owners | Swipe-first solo shell, tutorial, ordered saves and physical Android evidence | [~] |
| 07 | Domain owner | Frozen config, daily seed, cross-runtime fixtures and numeric guards | [~] |
| 08 | Android/native owner | Optional PGS v2 bridge, guest-first auth and provider outbox seam | [~] typed bridge/tests; live project NOT RUN |
| 09 | Android/client owner | Strict HTTP gateway, links, recovery, sync and service error states | [~] gateway/fixture path present; full two-device gate open |
| 10 | Merge service owner | Bounded backend corrective foundation and PostgreSQL/provider regression gates | [x] 35 focused tests, 6 isolated PostgreSQL tests; full-MVP gates remain open |
| 11 | Integration/tooling owner | Pinned backend/Next maintenance CI and local share-preview smoke | [x] actionlint, root gates, docs, and local smoke pass; release gates remain open |

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
