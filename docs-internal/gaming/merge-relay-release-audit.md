---
title: Merge Relay service and release audit
description: Open contract, persistence, authorization, and product integration blockers for Merge Relay release readiness.
---

# Merge Relay service and release audit

Status: **open release blockers**. This is a corrective review record for the
current source tree and the rejected preview. It records implementation work
that must happen before the product can be called integrated or release ready;
the local service foundation below records partial remediation separately from
cross-runtime, configured, and physical acceptance. The full source scope remains
MR-01–MR-15. Google Play Games is an explicit user-added requirement, while
the UX rules in the [release plan](merge-relay-release-plan) are current design
decisions.

## P1 blockers

| ID | Area and current seam | Required decision and implementation | Regression gate |
|---|---|---|---|
| P1-01 | Wire, hash, outcome: `packages/api/src/games/merge-relay/{contracts,wire,engine}.ts`, `merge_rules`, API contract | Freeze one snake_case HTTP codec and one canonical checkpoint/hash representation. Map camelCase internals explicitly. Define complete, tie, unfinished, cancelled, retired, and rejected outcomes so Dart, compiled JS, and HTTP cannot silently reinterpret a result. | Shared Dart/JS/HTTP fixtures; hash vectors; round-trip wire tests; every outcome and malformed-field negative. |
| P1-02 | Guest recovery/upgrade: `identity-service.ts`, guest routes | Bind the recovery token to the verified current game subject and transaction. Make replay, account conflict, save/challenge/result ownership, and failed migration rollback explicit; preserve a recoverable guest when the destination account cannot accept it. | Two accounts, duplicate token, repeated upgrade, colliding save IDs, cross-environment token, injected transaction failure, and restart recovery tests. |
| P1-03 | Role guards: `route-context.ts`, `route-data.ts`, `route-relay.ts`, query service | Enforce player, game-admin, and service capabilities at every route and service seam. A body/header `app_id`, legacy admin token, or client score cannot elevate access. | Signed-token matrix for each role; forged/expired/wrong app or environment; private challenge/result/attempt isolation; admin config/retire; service reward negatives. |
| P1-04 | Retirement: `relay-queries.ts`, relay command/finalize paths | Choose and document grandfather-versus-safety-kill semantics for existing attempts and finalized results. Retired links must give an explicit status, block new reservation, and never rewrite immutable results or outbox work. | Retire before open, during reservation, after completion, repeated retire, public resolve, old-link replay, and reward/outbox idempotency fixtures. |
| P1-05 | Config revisions/frozen rules: `data-service.ts`, `engine.ts`, challenge/result records | A revision must freeze rule/content/tuning inputs for a challenge and its child. Rollback changes future runs only; it must not mutate old links or make the Dart client guess a revision. | Concurrent update/rollback; old challenge after rollback; new run selection; exact config/hash fixtures; client/server revision mismatch rejection. |
| P1-06 | Daily seed and writes: `data-service.ts`, `engine.ts`, daily content | Reconcile the canonical UTC date, seed algorithm, rule version, content revision, and authored daily references with Dart. A public GET must not silently publish unreviewed content; choose an authorized materialization path and idempotency policy. | Date-boundary and exact seed vectors across runtimes; invalid dates; concurrent reads; missing/retired content; public-read/no-write and authorized-materialization tests. |
| P1-07 | Durable store transaction shape: `drizzle-store.ts`, `packages/db/src/schema.ts` | Replace whole app/environment read-and-rewrite transactions with indexed per-artifact operations and bounded retention before production traffic. Preserve atomic optimistic writes and app/environment scope without one growing snapshot. | Parallel artifact writes, rollback/failure, large-history bounded query, scope indexes, restart, and cross-environment isolation against a real test database adapter. |
| P1-08 | Event/reward identity: `data-service.ts`, `relay-finalize.ts`, database uniqueness | Derive opaque IDs and uniqueness keys from environment, subject/artifact, event type, result, and provider transaction as appropriate. A repeated idempotency key with different meaning must conflict; distinct records must never collide. | Same key across subjects/types/environments, repeated finalize, provider transaction reuse, reward/result mismatch, outbox retry, and database constraint tests. |

## P2 backend blockers

These lower-severity service findings still block the release evidence gate.

| ID | Required guard | Regression gate |
|---|---|---|
| P2-01 | Idempotency fingerprints must include every semantic input: `parentChallengeId`, `finishEarly`, `returnAlias`, and `artifactId`, rather than only a caller key. | Reuse each key with one changed field and across retries; same request returns the same result and every changed request conflicts. |
| P2-02 | A `target_alias` block request must resolve a stable server-side target before membership/block checks; aliases are not unique authorization subjects. | Duplicate aliases, renamed aliases, unknown aliases, and blocked target reservation tests prove no ambiguous match or bypass. |
| P2-03 | State validation must enforce foreign keys, uniqueness, result-to-attempt links, parent/child challenge links, and exactly one active config. | Corrupt imported state fixtures, duplicate IDs, missing parents/results, cross-environment references, and two-active-config recovery tests fail closed. |
| P2-04 | Provider verification must attest subject, environment, result, product, refund/cancel state, and provider transaction; missing provider configuration must reject enabled settlement. | Fake provider tests cover subject/product mismatch, refund/cancel, cross-environment reuse, retries, and enabled-without-provider failure. |

## UX and physical evidence guards

These guards are separate from the backend P2 findings but remain release
evidence requirements for the rejected preview.

| ID | Required guard | Regression gate |
|---|---|---|
| UX-01 | Choose one authoritative board render path and run-state source. Restore mode, board, and gesture state after relaunch; pause during animation and process death after a legal move must preserve ordered saves. | Widget test performs a real swipe, checks the authoritative trace/outcome, pauses mid-animation, restores, and performs the next gesture against the restored state. |
| UX-02 | Keep fresh, returning, and Daily outcomes explicit in copy/navigation; Daily resolves date/content/rule references before play. | Physical route capture covers Home→tutorial→swipe→result, process-death→Continue, and Daily→resolved refs→practice result. |
| UX-03 | Keep progression, achievement, theme, and cosmetic state separate from score settlement. Provider decline, cancellation, no-fill, outage, or missing configuration leaves base play usable and grants no unverified reward. | Fake-provider/retry tests cover every failure; client-only claims cannot advance achievement or cosmetic state. |
| UX-04 | Preserve the fixed board viewport on small screens and large text, swipe-first gesture arbitration, optional accessibility controls, contextual reset confirmation, and tutorial skip/replay. | Small-screen/large-text gesture tests plus a dated 1080x2400 physical screenshot/video review; existing saves do not infer tutorial completion. |

## Execution order and ownership

`merge-service` owns P1-01, P1-03–P1-08, P2-01–P2-04 and the API/database tests;
`merge-domain` owns the cross-runtime codec, replay, seed, and rule fixtures;
`merge-client` owns UX-01, UX-02, UX-04 and the typed gateway; and
`merge-release` owns P1-02, UX-03, provider seams, artifact evidence, and the
configured physical tests. Contract/hash, identity, role, retirement, config,
daily, storage, and ID decisions must freeze before client/API integration.
The PGS bridge and external Play configuration remain separate gates in the
release plan; PGS quality's ten-visible/four-within-an-hour rule is an official
compatibility checklist, not a reduction or invented count for MR content.

## Local remediation status

The current backend branch has implemented and locally tested the following
foundation pieces: snake_case checkpoint/challenge/result codecs, six-field
checkpoint hashes, origin-mode preservation, frozen config and spawn metadata,
protected daily provisioning with read-only public reads, role guards, effective
guest upgrade subjects, stable alias resolution, retirement cancellation with
preserved results, semantic idempotency fingerprints, provider attestation
fields, foreign-key and uniqueness validation, targeted Drizzle row sync, and
bounded provider/outbox behavior. The current bounded remediation suite passes
35 tests and 98 assertions across nine files. A fresh temporary PostgreSQL
16.15 database received all checked-in migrations, and six database tests
passed with `MERGE_RELAY_TEST_DATABASE_URL` set: five adapter checks and one
fresh-config lifecycle check. No production database was used. Cross-runtime Dart/HTTP consumption, complete
client/service integration, configured-provider tests, and physical release
gates remain open. This section is evidence of implementation and local
verification only; it does not close the rows above.

The remediation status is deliberately split from release acceptance:

| Finding | Local evidence | Still open |
|---|---|---|
| P1-01 | Flat snake_case codecs and six-field hash are covered by API route and engine tests. | Dart/HTTP fixture parity, every outcome, and malformed-field cross-runtime vectors. |
| P1-02 | Guest recovery returns the effective upgraded subject; an upgraded account is used for an old guest token in a Hono route test. | Restart, injected transaction failure, and full cross-environment recovery tests. |
| P1-03 | Player, game-admin, and service checks are enforced at route/service seams; wrong app/environment and role negatives are covered by API tests. | The complete signed-token matrix and client/service integration. |
| P1-04 | Retirement cancels reserved attempts and leaves finalized results unchanged. | Outbox/reward retries and the full timing/old-link fixture matrix. |
| P1-05 | Challenges capture config revision and spawn weights; daily generation consumes custom weights; stale concurrent config updates conflict. | Concurrent rollback and Dart/server revision-parity fixtures. |
| P1-06 | UTC daily seed is deterministic; protected provisioning materializes one immutable date record and public reads do not write. | Authored daily references, cross-runtime vectors, and authorized missing-content policy. |
| P1-07 | Drizzle uses indexed artifact rows, scoped locking, read-only reads, targeted sync, and a bounded cursor; the fresh PostgreSQL 16.15 run passed five adapter tests plus one fresh-config lifecycle test. | Production migration approval, retention policy, and independent review. |
| P1-08 | Scoped event/reward IDs, provider context, settlement uniqueness, and bounded outbox retry are validated locally. | Database constraints, durable retention, and a configured provider. |
| P2-01 | Challenge parent, finalize return alias, event artifact, and repeated reward requests are covered by semantic idempotency tests; outbox delivery also has bounded retry coverage. | Full changed-field and cross-retry fixture matrix. |
| P2-02 | Alias resolution rejects unknown and ambiguous targets before social writes. | Rename/retirement and database-backed target resolution scenarios. |
| P2-03 | State import validates IDs, parents, attempts, results, configs, and environments; targeted adapter tests cover scoped rows. | Real database foreign-key/uniqueness enforcement and corruption recovery. |
| P2-04 | Provider attestation checks subject, environment, result, product, transaction, refund, and cancellation; missing config is disabled. | Live provider verification and configured sandbox evidence. |

The isolated PostgreSQL gate **ran on 2026-09-18** against a fresh temporary
PostgreSQL 16.15 database after `packages/db` migrations were applied:
`drizzle-postgres.test.ts` passed 5/5 tests and
`drizzle-postgres-lifecycle.test.ts` passed 1/1 test. The temporary server and database
are local test infrastructure only; production migration and deployment were
not run.

## Current evidence boundary

The API foundation and local client tests are useful preparation evidence. The
physical Android route set is a dated one-device smoke record in the [visual
review](visual-review) and [verification ledger](verification); it does not
prove the service loop, two-device restore, PGS, or the P1/P2 gates above.
The test-key AAB is `NOTFORUPLOAD`; API 36/min SDK and bundle inspection do not
constitute signing, 16 KB physical-device, Play Console, or publication proof.
