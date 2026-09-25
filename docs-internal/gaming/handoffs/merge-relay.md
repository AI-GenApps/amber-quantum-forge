# Merge Relay implementation handoff

This handoff reconciles the current source set for Merge Relay. The PRD v0.3 and validation reference govern the expanded scope; the twenty tile/checkpoint fixture from the older plan is an early integration milestone. The repository proposal is `merge_relay` with production technical ID `app.w3dev.mergerelay`; external bundle registration, publisher ownership and store reservation remain unresolved.

Source provenance is recorded in [merge-relay.json](../sources/merge-relay.json), including canonical Drive URLs, revision metadata, retrieval hashes, and the retained archive marker. The source bodies used for this reconciliation were read-only local snapshots; builds and tests do not depend on those snapshots or on Drive access. The source set includes the index, PRD, gameplay, technical, economy/operations, validation/delivery, decisions, Apple iOS, Google Play and the retained v0.1 archive.

The corrective implementation and release sequence is recorded in the [Merge Relay corrective release plan](../merge-relay-release-plan). It preserves the full MR-01–MR-15 scope. The typed client gateway, local service loop, app-local PGS bridge/status seam, and bounded provider tests are implemented; configured PGS, two-device evidence, external configuration, full authored content, and publication remain pending gates.

## Ownership and boundaries

| Logical owner | Owns | Required handoff contract |
|---|---|---|
| `merge-domain` | `apps-native/games/packages/merge_rules` | Versioned board, seeded RNG, legal moves, terminal state, replay payload |
| `merge-client` | `apps-native/games/merge_relay` | Flutter/Flame composition, onboarding, save/reconnect UX and accessibility |
| `merge-service` | `/games/merge_relay` API integration | Signed app-scoped identity, opaque challenge, reservation, server recomputation and idempotent rewards |
| `merge-content` | `apps-native/games/merge_relay/content` and validators | Versioned rescue/daily boards, themes, fixture hashes and review records |
| `merge-release` | app config, Google Play-first Android QA, sandbox commerce and evidence | Independent version/build, device evidence, feature gates and store checklist |

The pure rules package cannot import Flutter, Flame or SDKs. The service must never trust a client score, rule version or `app_id` header for authorization. Generic API isolation exists under `packages/api/src/games`; Merge-specific routes are mounted in `packages/api/src/index.ts`, with the versioned wire contract recorded in [the API contract](../merge-relay-api-contract).

## v0.3 selected-MVP correction

The target is a polished rescue/daily/endless experience with deterministic replay, genuine server-validated friend and return relays, guest identity and recovery, save synchronization, progression/themes, telemetry/configuration, and sandbox-tested cosmetic/rewarded-ad paths. The local two-device code demo is a P0 integration fixture, not the endpoint. Ranked continuation is at most three legal moves and is separate from practice. No deferred feature may be presented as live.

## Requirement ledger

`yes` means the requirement is specified in the current source. `partial` means there is repository code or a testable slice. `no` means no evidence in this worktree. `enabled` means an explicit release gate, not that a debug button exists.

| ID | Stage and requirement | Contract / acceptance test | Owner | Specified | Implemented | Integrated | Verified | Enabled |
|---|---|---|---|---|---|---|---|---|
| MR-01 | P0 deterministic merge engine and seeded spawning | Same version/snapshot/generator/moves match across Dart client, JS/server fixtures | `merge-domain` | yes | partial | partial | partial: `merge_rules_test.dart`, `bun run games:parity` | no |
| MR-02 | P0 embedded onboarding with immediate input | First swipe works signed out; hints/payment/notification prompts cannot block it | `merge-client` | yes | partial | partial | partial: `merge_relay/test/widget_test.dart` | no |
| MR-03 | P0 legal-move and end-state checks | No-op does not advance RNG; full/no-merge and chain-merge fixtures terminate correctly | `merge-domain` | yes | partial | partial | partial: `merge_rules_test.dart` | no |
| MR-04 | P1 valid checkpoint capture and challenge creation | Terminal boards rejected; duplicate create is idempotent; published payload immutable | `merge-service` | yes | partial: TypeScript service foundation | partial: `/games/merge_relay/:environment` routes | partial: `packages/api/src/games/merge-relay/service.test.ts`, `routes.test.ts` | no |
| MR-05 | P1 challenge-first deep-link/code routing | Fresh, installed, signed-out, offline and unsupported-version outcomes are explicit | `merge-client` | yes | no | no | no | no |
| MR-06 | P1 at-most-three-move ranked continuation | Only legal moves count; finish/expiry/retry cannot improve a result | `merge-service` | yes | partial: reservation/finalize service | partial: protected relay routes | partial: `service.test.ts` expiry and move-budget cases | no |
| MR-07 | P1 replay and reciprocal relay | Accepted final state replays; parent/child links and dead continuations are safe | `merge-service` | yes | partial: server replay and return child | partial: finalize route | partial: engine and service replay fixtures | no |
| MR-08 | P1 anonymous identity and optional account upgrade | Guest play/recovery and transactional upgrade do not duplicate rewards/purchases | `merge-service` | yes | partial: guest recovery/upgrade service | partial: guest routes and protected upgrade | partial: `service.test.ts`, `routes.test.ts` | no |
| MR-09 | P1 daily challenge and separate ruleset boards | Date seed/rules version is fixed; practice and ranked histories stay separate | `merge-content` | yes | partial: protected provisioning plus immutable daily endpoint | partial: public read and admin/service provision routes | partial: route fixture and config-revision regression; curated content/client separation remains | no |
| MR-10 | P1 local save and reconnect reconciliation | Restart restores a move; conflicting devices cannot silently overwrite ranked history | `merge-service` | yes | partial: optimistic server save | partial: save routes and normalized store | partial: concurrent save test and API isolation tests | no |
| MR-11 | P1 rewards and purchases | Ad/IAP callbacks settle once; cancel/no-fill/failure never blocks base play | `merge-release` | yes | partial: server-only Google Play ProductPurchaseV2 verifier, restore, and idempotent cosmetic entitlement settlement | partial: scoped commerce routes/runtime; native Billing and live provider remain disabled | partial: official fixture plus provider, route, runtime, vault, and service tests; dedicated commerce PostgreSQL suite remains open | no |
| MR-12 | P1 versioned remote tuning and rollback | New runs only receive tuning; old links replay frozen rules or retire explicitly | `merge-service` | yes | partial: versioned config/rollback API | partial: admin routes | partial: revision conflict/rollback service test; client run application remains open | no |
| MR-13 | P1 safe social surfaces | Codes resist enumeration; names report/block; no contacts or direct messaging | `merge-service` | yes | partial: report/block records and reciprocal block check | partial: protected social routes | partial: block reservation test | no |
| MR-14 | P1 telemetry completeness | Create/open/start/complete/return events reconcile with artifacts, not share intent | `merge-service` | yes | partial: idempotent event API and artifact events | partial: protected event route | partial: event/idempotency service test; full analytics reconciliation remains open | no |
| MR-15 | P0/P1 audience-led staged release | Prototype, listing and deferred scope are distinct in UI, tests and marketing | `merge-release` | yes | partial: config labels | partial | partial: registry/content validation | no |

## Current evidence and next tests

The current consumer is `apps-native/games/merge_relay/lib/src/merge_relay_app.dart`; the domain is `apps-native/games/packages/merge_rules`. The deterministic Dart/compiled-JS replay fixture now passes through `bun run games:parity`; the focused client suite also covers restart recovery, save failure, future/corrupt payload recovery and disposal during a pending restore. The route-produced HTTP fixture and bounded backend remediation suite pass 35 tests and 98 assertions across provider response/body limits, outbox pagination/concurrency/leases, daily immutability, route policy, identity migration, status routing, and create/resolve/reserve/submit/finalize/daily parity. The 2026-09-17 source/UI check and Android QA evidence are dated records in [verification](../verification) and [visual review](../visual-review), not a full-MVP or configured-provider claim. Curated daily content, configured Google Play Games identity/sync, sandbox provider verification, revision application to all client run modes, analytics reconciliation, and two-device service acceptance remain required before enablement. No store, server deployment, or demand evidence is present.

## Release and unresolved gates

The effective repository sequence is Google Play and Android first, following user steering on 2026-09-17. This supersedes the source records' Apple-first wording for execution while retaining that wording in the source set. Play readiness means the Android artifact, device evidence, listing, privacy declarations, signing and support gates are prepared; it does not mean registration, submission or publication. Store fields, Play publisher ownership, minimum OS/device matrix, signing, billing, privacy manifests and track configuration remain unresolved. Camera, microphone, contacts, location and AI permissions are not required by this app. Theme/IAP prices in the source are hypotheses only. Android physical QA is the current owner gate; the prior iOS signed/install/play baseline is retained, and further iOS QA is paused until after Google Play publication. A build can be enabled for internal QA after the tests above, but submission, spending and production migrations still require explicit approval.

## 2026-09-25 user decision — solo v1 scope cut

The user directed a renamed, **single-player v1**: Rescue (expanding to 60 boards in 6
chapters), Daily, and Endless, with local save only, and **no monetization in v1** (no
ads, no IAP). This is a scope cut for v1, not a cancellation — every deferred
requirement row below stays specified in this ledger, its code stays in the repository,
and it is the target for **v1.1**. Full context: `tasks/epics/16-games-portfolio-wave2/`
(epic "Games portfolio wave 2"), and the per-game knowledge base at
`.agents/games/merge-relay/` (`economy.md`, `decisions-log.md`).

Rows deferred to v1.1, gated off for v1:

- **MR-04** (valid checkpoint capture and challenge creation) — needs the friend-relay
  backend, out of scope for a local-save-only v1.
- **MR-05** (challenge-first deep-link/code routing) — no relays to route to in v1.
- **MR-06** (at-most-three-move ranked continuation) — ranked continuation is a relay
  concept; v1 has no ranked/relay mode.
- **MR-07** (replay and reciprocal relay) — depends on MR-04–MR-06.
- **MR-08** (anonymous identity and optional account upgrade) — no server identity is
  needed when there is no relay, save-sync, or commerce path exposed in v1.
- **MR-11** (rewards and purchases) — v1 has no ads and no IAP; the server-only
  verifier/entitlement code stays but is not wired into any v1 build.
- **MR-13** (safe social surfaces) — only meaningful once relays/social are live.
- Play Games Services (PGS) sign-in/leaderboards (`merge_relay_pgs_account.dart`,
  `merge_relay_play_games.dart`) — not part of the ledger's numbered rows, but explicitly
  gated off for v1 alongside the network paths above.

No requirement row was deleted or marked `no` as a result of this decision; deferred
rows keep their existing `Specified`/`Implemented`/`Integrated`/`Verified` values in the
table above, since the underlying code and specification are unchanged — only the v1
release gate (`Enabled`) excludes them, same as before this decision (all rows were
already `Enabled: no`).
