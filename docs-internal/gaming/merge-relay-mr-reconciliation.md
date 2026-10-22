---
title: Merge Relay MR-01 to MR-15 reconciliation
description: Read-only audit of every MR requirement against the code and tests, with the external inputs still needed before task 05 can close.
---

# Merge Relay MR-01 to MR-15 reconciliation

Audit date: 2026-10-22, branch `main`. Method: file and test grep plus reading the release plan,
audit, requirements ledger and the Merge Relay handoff. **No test suite was run for this audit**, so
"test evidence" means tests exist and cover the topic, not that they pass today.

Abbreviations: **C** = `apps-native/games/merge_relay`, **R** = `apps-native/games/packages/merge_rules`,
**A** = `packages/api/src/games/merge-relay`, **DB** = `packages/db` schema and migrations 0000 to 0010.

Status key: **done** (implemented and locally tested, no gap found), **partial** (named gap),
**missing**, **external-gate** (needs a Play or PGS console, device, secrets or a second device).

Nothing here is "done" under the plan's Verified or Enabled definitions. There is no physical,
two-device or configured-provider evidence. In the shipped v1 build `mergeRelaySocialEnabled`
(`C/lib/src/merge_relay_features.dart`) defaults to false and compiles out the gateway, relay and
PGS paths, so the service loop is unreachable. The 2026-09-25 v1 scope cut defers MR-04, 05, 06, 07,
08, 11 and 13 to v1.1; they are gated off, not deleted.

## Matrix

| ID | Requirement | Status | Gap |
|---|---|---|---|
| MR-01 | Deterministic engine and seeded spawn match across Dart, JS and server | partial | Fixtures exist on both runtimes (`scripts/games/*fixture.json`, `parity.ts`). Dart-to-HTTP wire parity and malformed-field vectors (audit P1-01) are open. |
| MR-02 | Swipe-first input, versioned tutorial with skip and replay, fixed viewport | partial | Code and widget tests exist. Physical first-input proof, small-screen and large-text review, and the 1080x2400 capture are NOT RUN. Pause/reset-guard audit open. |
| MR-03 | No-op keeps RNG, terminal and chain fixtures, ordered animation trace, process-death survival | partial | Ordered-save and burst tests exist. Physical process-death and relaunch evidence NOT RUN. |
| MR-04 | Valid checkpoint capture, terminal boards rejected, idempotent immutable create | partial | Server implemented and tested, including PostgreSQL 16 runs. The client loop runs only against fake and local Hono, and is compiled out in v1. No real-service or two-device proof. |
| MR-05 | Challenge-first link and code routing across fresh, installed, signed-out, offline and unsupported cases | partial | Link delivery and outcome mapping exist. No single five-case test. The https App Link needs `MERGE_RELAY_PUBLIC_ORIGIN` and domain verification (external-gate). |
| MR-06 | At most three legal moves for ranked relay; finish, expiry and retry cannot improve a result | partial | Server logic and tests exist. Client and service integration unproven, compiled out in v1. |
| MR-07 | Replay and reciprocal return relay with immutable parent and child links | external-gate | Code partial. A real incoming and return route on two physical devices is required and not recorded. |
| MR-08 | Anonymous guest, optional upgrade, PGS mapping and conflict choice, no duplicate rewards | partial | Audit P1-02 restart, injected-failure and cross-environment recovery tests open. Auth-code exchange and link flow need real credentials. |
| MR-09 | Daily references, date seed, revision, separate practice and ranked history, authored quantity | partial | Manifest still labels Daily as local practice. No authored daily reference list. Audit P1-06 open. Server daily path compiled out in v1. |
| MR-10 | Local and server save, optimistic conflict, ordered writes, offline queue, cross-device restore | partial | Receipts tested on Docker postgres:16. Cross-device conflict UI partly done. Second-device restore is external-gate. Task 12 independent review open. |
| MR-11 | Sandbox ad and IAP providers, callback idempotency, no client settlement | missing on client | Server pieces implemented and tested. No billing or rewarded-ad code in the Flutter app. Live Play, Pub/Sub and AdMob delivery are external-gate. |
| MR-12 | Versioned tuning and rollback, new-run application, frozen old links, kill switch | partial | Server revisions, rollback and disable guards tested. No client new-run tuning application. Audit P1-05 open. |
| MR-13 | Codes resist enumeration, report and block, membership scope, rate limits, no contacts or DMs | partial | Report and block are server-side only, no client surface. No rate limiting anywhere in `merge-relay`. Audit P2-02 open. |
| MR-14 | Artifact-linked telemetry, outbox reconciliation, redaction, retention, outage handling | partial | Client records events to an in-memory sink and never sends them. No retention or pruning code. Reconciliation open. |
| MR-15 | Separate prototype, MVP, Play-test, enabled and published states in UI, CI, docs, listing | partial | Staging exists in config, CI and scope tests. Manifest `stage` text is stale. No Play-test or enabled state recorded. Listing has TBD fields. |

## Other task 05 items

- **PGS v2 dependency and bridge:** `play-services-games-v2:22.1.0` is in
  `C/android/app/build.gradle.kts`, with a typed Kotlin bridge, gate and unit tests. Dormant until a
  numeric PGS application ID is set. Enablement is an external gate.
- **Server platform path:** identity mapping, outbox, dispatch and provider adapter exist and are
  tested, stored as generic artifact rows. Live provider verification is an external gate.
- **Achievement catalogue:** none authored in the repo. The plan's minimum of ten visible, four
  attainable within an hour, is not met.
- **Optional Play Integrity:** no code.
- **Audit items still open:** retention and pruning, per-route rate limits, the signed-token role
  matrix (P1-03) and the retirement timing matrix (P1-04).

## External inputs still needed

No value may be invented. Step names come from the docs and were not verified in any console.

- [ ] PGS project and numeric application ID per environment (`MERGE_RELAY_PGS_<ENV>_APPLICATION_ID`).
- [ ] PGS achievement IDs and thresholds, and the leaderboard ID and cohort policy.
- [ ] Android OAuth client IDs and SHA-1 fingerprints for debug, staging, upload and Play App Signing keys.
- [ ] Web OAuth client ID, and the client secret and credential key in Vercel secret storage only.
- [ ] Play Console app creation by the account owner, with Play App Signing.
- [ ] Upload keystore, generated with `keytool` and kept outside the repo, with the four `ANDROID_*` signing variables.
- [ ] Tester access, a closed-testing track, and a second physical Android device.
- [ ] Physical runs: swipe play, process death, offline resume, guest upgrade, second-device restore, and the artifact checks (API 36, AAB identity, signing provenance, 64-bit, 16 KB alignment, permissions, vitals).
- [ ] Commerce and ad sandbox: Play service account, package and product IDs, sandbox product, Pub/Sub RTDN delivery, AdMob SSV keys, and native Billing, which is not built.
- [ ] Optional Play Integrity project and service account.
- [ ] `MERGE_RELAY_PUBLIC_ORIGIN` and domain verification for the challenge App Link.
- [ ] Production database approval, with the retention policy and independent review (P1-07).
- [ ] Privacy policy hosting URL, support contact and developer name.
- [ ] Data Safety form, verified for the dormant Play Games SDK and redone before enabling PGS.
- [ ] Content rating questionnaire submission.
- [ ] 512x512 Play Console icon export.
- [ ] Crash-reporting vendor decision (not a v1 blocker).
- [ ] Final submission and publication, a separately approved human action.
