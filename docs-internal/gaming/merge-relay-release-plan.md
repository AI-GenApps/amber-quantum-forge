---
title: Merge Relay corrective release plan
description: Implementation-ready plan for the full Merge Relay v0.3 product and Google Play-first release gates.
---

# Merge Relay corrective release plan

Status: **Release NOT READY. Plan only.** This record does not claim that the
full v0.3 product, Google Play Games, Play Console configuration, publication,
or production deployment is complete. The PRD, platform records, validation
references, and current handoff remain authoritative. The earlier five-app
smoke milestone is evidence for repository preparation only.

## Decision and current evidence

The rejected preview exposed a product integration gap rather than a build
failure. The current client can play local deterministic rescue/endless paths,
restore a local save, and render a bounded Flame board. It now also has a
typed Merge Relay gateway, route-produced fixture coverage, and a local Hono
physical smoke path. The API has a tested Merge Relay service foundation for
signed app scope, guest recovery, immutable challenges, reservations, server
replay, results, saves, configuration, social records, rewards, and telemetry.
The full client/service loop, authored content, configured provider paths, and
release gates remain open.

The following evidence is retained and bounded:

| Area | Current evidence | Release meaning |
|---|---|---|
| Android smoke | 2026-09-17, physical `SM-A525F` / `RZ8R32EAB7T`, Android 14, 1080x2400 app-only route captures | Physical smoke accepted; one device is insufficient for cross-device or release coverage |
| Merge Relay | 2026-09-17 [current real-merge capture](evidence/visual/merge-relay-final-real-merge.png), SHA-256 `4e88eb791b951c955afd9d492f19d2ba5dbedd7d7859d01791032f5f2cfbc983`; artifact/source joins are in the [current ledger](evidence/final-android-provenance-ledger) | One-device local service smoke only; MR-04 through MR-14 remain open in the handoff |
| AAB | Frozen artifact used a `NOTFORUPLOAD` test key; target 36/min 24 decoded from the bundle | Artifact inspection only; no Play signing or upload claim |
| Google Play Games | App-local typed Android bridge, backend identity-status/mapping seam, provider adapter, and outbox tests exist; no PGS project or external IDs | Configured tester/provider verification is NOT RUN; capability remains disabled |
| Cross-device relay | One physical Android device is recorded; no second device or real incoming/return relay route is accepted | Two-device relay and restore evidence is still required |
| iOS | Prior baseline retained; further iOS QA paused until after Google Play publication | No current iOS release gate |

The final product keeps the full v0.3 quantity and feature scope. Rescue-first
smoke fixtures, small local content, and widget tests do not reduce that scope.

## Product and UX contract before implementation

`merge-client` and `merge-domain` must reconcile these contracts before the
service wiring begins:

- The default board is swipe-first with a fixed, legible board viewport.
  Accessibility arrow/buttons are optional controls, not the default input.
- A one-time interactive tutorial is versioned independently from saves. It
  supports skip and replay; existing saves are never treated as tutorial
  complete by inference.
- Home is compact: Continue, Play, Daily, and Relays are primary actions.
  Settings, profile, themes, achievements, and secondary modes stay behind
  secondary menus. Pause/reset requires contextual confirmation.
- Every session exposes its mode, goal, outcome, and continuation state. An
  endless terminal state shows its result; only an explicit New Run action gets
  a new seed. Ordered writes survive process death without publishing a
  half-written board.
- Every rescue board declares its objective, success result, missed result,
  terminal result, and early-finish result. Each result carries score delta,
  max tile, and moves used, with mode-appropriate Replay, Next, Home, Share,
  and Return actions.
- Daily challenge references, date seeding, content revision, and rule version
  are reconciled before implementation. Ranked relay attempts must have at most
  three legal moves. Rescue boards may have their own source-bound move budget;
  daily practice is a separate resolved contract and inherits neither budget by
  accident.
- Move animation follows the authoritative domain result and trace. UI-only
  animation cannot imply a server-accepted move.
- The full authored rescue, daily, endless, progression, theme, audio, haptic,
  branding, relay, moderation, economy, and telemetry scope remains in force.
- The first achievement catalogue and progression map must cover the full
  authored Merge Relay milestones, rescue/daily/endless progression, two themes,
  and cosmetic/rewarded-ad behavior. If PGS achievements are enabled, the
  catalogue must contain at least ten visible, attainable achievements, with at
  least four reasonably attainable within an hour; actual Play IDs and icons
  come from external configuration. Missing, declined, no-fill, cancelled, or
  failed providers leave base play available and do not grant a cosmetic.

## Google Play Games decision

Use the official Android PGS v2 SDK directly, pinned only after rechecking the
release notes dated 2026-09-15; that record lists
`com.google.android.gms:play-services-games-v2:22.1.0`. Do not add the
removed/nonfunctional v1 artifact or an unverified third-party Flutter wrapper.

Create an app-local typed capability:

```text
MergeRelayPlayGamesCapability (Dart interface)
  -> Pigeon-generated Flutter/native messages
  -> PlayGamesBridge.kt (Merge Relay Android project)
  -> Play Games Services v2
```

The capability reports `authenticated`, `signed_out`, `declined`, `offline`,
`cancelled`, `unavailable`, and bounded `error` states. It exposes no email and
does not persist a raw token. The native bridge calls `isAuthenticated`, the
automatic v2 startup flow, manual `signIn` only after a failed automatic flow,
and `requestServerSideAccess` when the player chooses account linking.

The Android bridge is preferred over a third-party plugin because only Merge
Relay currently consumes PGS, the repository needs exact v2 lifecycle behavior,
and optional SDKs must stay out of the other four apps. Extract it into a
package only after a second real consumer exists. Flutter documents platform
channels and Pigeon as the supported mechanisms:

- [Flutter platform channels](https://docs.flutter.dev/platform-integration/platform-channels)
- [Flutter plugin packages](https://docs.flutter.dev/packages-and-plugins/developing-packages)

PGS is a platform identity, not the game account. The existing guest subject,
recovery token, app/environment JWT, local save, and server account remain the
Merge Relay identity. A verified PGS player ID is mapped to that subject in an
app/environment-scoped table. A mapping conflict returns an explicit choice;
it never silently merges progress.

Automatic platform authentication may run at startup, but profile creation or
an account-link prompt must be deferred until the one-time tutorial is complete
or another clearly chosen rewarded moment. A guest can reach first play without
an account prompt. Before a player first earns a PGS achievement or leaderboard
result, the UI should explain that platform progress will be saved when the
player authenticates.

## Backend and persistence contract

Add a protected link endpoint that accepts a single-use server auth code while
the caller is authenticated as the current game subject. The server exchanges
the code with the configured web OAuth client, verifies the PGS player through
the official API, and stores only the provider mapping and bounded audit data.
Codes, access tokens, refresh tokens, email, and raw platform responses are not
logged. Guest recovery remains usable if PGS is declined or unavailable.

Ranked settlement stays server-authoritative:

1. The server validates the checkpoint, legal moves, rule version, reservation,
   replay hash, expiry, and idempotency key.
2. Finalization writes one immutable result.
3. An outbox job binds the result ID, canonical replay hash, mapped PGS player,
   and configured achievement/leaderboard target.
4. A provider adapter retries idempotently and records success, decline, quota,
   and outage states. A client score or achievement claim never grants credit.

The current generic `merge_relay_records` adapter is suitable for local
foundation tests and now diffs normalized artifact rows with targeted upserts
and deletes. A fresh isolated PostgreSQL 16.15 run on 2026-09-18 applied the
checked-in migrations and passed six tests: five adapter checks covering
concurrent writes, rollback, environment scope, bounded cursors, and database
constraints, plus one fresh-config lifecycle check across revisions 9, 10,
99, and 100. The bounded remediation
suite also passes 35 tests and 98 assertions across provider response schema
and body limits, outbox pagination/concurrency/leases, daily immutability,
route policy, identity migration, status routing, and HTTP fixture parity. Before production
traffic, add bounded retention for identity mappings,
outbox jobs, telemetry, configs, and social records. Keep app, environment,
subject, and provider uniqueness constraints in the database; do not use the
legacy universal user/admin tables as authorization.

The independent service review has eight P1 and four P2 release blockers. They
are recorded with paths, policy decisions, and regression gates in the [Merge
Relay service/release audit](merge-relay-release-audit). They run in parallel
with client polish; passing local foundation tests does not close those gates.

Play Integrity is an optional ranked-abuse layer after the deterministic server
checks. If enabled, bind a standard request to a digest of the ranked request,
decode the verdict on the server, avoid caching verdicts, and apply tiered
policy. PGS sign-in alone is not an anti-cheat system.

## Full requirement execution map

| ID | Owner | Corrective work and acceptance gate |
|---|---|---|
| MR-01 | merge-domain | Versioned board/RNG/replay parity across Dart, JS, and server; high-value numeric fixtures pass |
| MR-02 | merge-client | Swipe-first fixed viewport, tutorial version/skip/replay, accessibility controls, physical first-input proof |
| MR-03 | merge-domain | No-op, terminal, chain merge, ordered animation trace, and process-death fixtures pass |
| MR-04 | merge-service | Immutable checkpoint, idempotent challenge, normalized persistence, real client request/response loop |
| MR-05 | merge-client | Challenge-first deep link/code routing for fresh, installed, signed-out, offline, and unsupported versions |
| MR-06 | merge-service | At-most-three legal moves for ranked relay only; expiry, retry, and finish cannot improve results |
| MR-07 | merge-service | Replay and reciprocal return relay with immutable parent/child links and device reconnect |
| MR-08 | merge-service | Guest recovery, optional upgrade, PGS mapping, conflict choice, and no duplicate rewards |
| MR-09 | merge-content | Daily references, date seed, rules/content revision, separate practice/ranked history, full authored quantity |
| MR-10 | merge-client/service | Local save, server save, optimistic conflict UI, ordered writes, offline queue, and cross-device restore |
| MR-11 | merge-release/service | Sandbox ad/IAP providers, callback idempotency, cancel/no-fill/failure fallback, no client settlement |
| MR-12 | merge-service/client | Versioned tuning, rollback, new-run application, frozen old links, and kill switch |
| MR-13 | merge-service/client | Codes, aliases, report/block, membership scope, rate limits, and no contact/direct-message surface |
| MR-14 | merge-service/release | Complete artifact-linked telemetry, outbox reconciliation, redaction, retention, and outage handling |
| MR-15 | merge-release | Separate prototype, full MVP, Play-test, enabled, and publication states in UI, CI, docs, and listing |

## External configuration matrix

Nothing in this matrix may be invented in source:

| Configuration | Owner | Storage/status |
|---|---|---|
| PGS numeric application ID and game project | Play Console owner | Per environment; external and unresolved |
| Android OAuth client IDs/fingerprints | Play Console owner | Debug, staging, upload, and Play signing fingerprints; external |
| Web OAuth client ID/secret | backend owner | Client ID in environment config; secret only in Vercel secret storage |
| Achievement IDs/icons/thresholds | product/content owner | At least ten visible and four attainable within one hour if enabled |
| Leaderboard IDs and fair score policy | product/domain owner | No global checkpoint ranking; only comparable server-settled results |
| PGS testers/release tracks | release owner | Play Console allowlist; external |
| Play Integrity project/service account | security/backend owner | Optional, external, never committed |
| Store listing, privacy, Data Safety, content rating, support | publication owner | External review inputs; no submission in this phase |

## First polished solo milestone

This is an intermediate client acceptance milestone, separate from full MVP
release readiness. It must be visible in fresh 1080x2400 physical screenshots
or a short app-only video, with no store or server claims:

- Fresh install: Home -> tutorial -> first swipe -> authoritative merge
  animation -> result/outcome -> Continue.
- Returning player: process death -> relaunch -> saved board and mode ->
  explicit Continue, with New Run confirmation and a new seed only after choice.
- Daily: Home -> Daily -> resolved date/content/rule reference -> separate
  practice result and return to Home.
- Incoming relay: a challenge code/deep link resolves to a preview, handles
  signed-out/offline/unsupported versions, then reserves only after explicit
  acceptance. Return relay shows the reciprocal result and status.

The milestone is accepted only when the design review can inspect those routes
on a physical device. Incoming and return relay routes are full integration
gates, not part of this solo milestone. It does not mark the service, PGS, full
content, or Play release gates complete.

## Phases, dependencies, and tests

1. **Contract freeze:** merge-domain, merge-client, merge-service, and
   merge-release agree on daily references, internal identity, PGS mapping,
   ranked score direction, achievement semantics, error states, and config
   names. Test DTO fixtures before native work.
2. **Domain/client completion:** implement the full board/content/tutorial/home
   contract, real service gateway, offline/reconnect UI, ordered persistence,
   animation trace, audio/haptics, and all MR-01–03/MR-05/MR-09/MR-10 tests.
3. **Native PGS:** reverify the current Google Play services release notes
   immediately before pinning `22.1.0`, then review the existing app-local v2
   dependency, typed Kotlin bridge, lifecycle tests, missing-config fallback,
   and no-blocking guest flow. Test automatic auth, decline, cancellation,
   resume, and process recreation with a fake native task seam.
4. **External non-production configuration:** obtain the PGS application ID,
   debug/staging/release fingerprints, web OAuth client, achievement and
   leaderboard IDs, and tester allowlist from the authorized owner. Missing
   values block real PGS integration tests but do not block fake-provider and
   contract work. Do not upload, publish, spend, or accept vendor terms.
5. **Service/PGS:** review the implemented identity mapping, auth-code
   exchange adapter, normalized outbox, server-settled results, retry bounds,
   and cross-app, cross-environment, replay, and mapping-conflict tests. Use a
   provider fake until external credentials exist.
6. **Physical Play test:** with a configured tester and a second physical
   Android device, verify guest recovery, account linking, restore conflict,
   offline completion, PGS achievement/leaderboard sync, relaunch, and no data
   leakage. No emulator or iOS result substitutes for this gate.
7. **Artifact gate:** verify API 36, min SDK, AAB identity/version, signing
   provenance, 64-bit libraries, 16 KB bundle/ELF alignment, merged permissions,
   crash/ANR behavior, and Android vitals. A prior test-key AAB is not current
   16 KB physical-device proof.
8. **Enablement/publication:** only after all requirement rows are verified,
   the authorized owner may configure final Play settings/listing/privacy/
   support and request a separate upload or publication decision. This plan
   performs none of those external actions.

Required automated coverage includes Dart capability fakes, Kotlin bridge tests,
API OAuth/identity/outbox tests, replay and score-tampering negatives, guest/PGS
conflicts, offline retry/idempotency, generated config validation, and CI
artifact inspection. Physical coverage must include swipe play, process death,
offline/resume, guest upgrade, configured PGS tester auth, and a second device.

## State gates

| State | Meaning for Merge Relay |
|---|---|
| Specified | MR-01–MR-15 are source-backed; PGS is an explicit user-added requirement and the UX bullets are current design decisions |
| Implemented | Domain, client, service, native bridge, persistence, and provider code exists with focused tests |
| Integrated | Real client/API/PGS test path works in a configured non-production environment |
| Verified | Physical Android scenarios, artifact checks, cross-device tests, and release quality gates pass |
| Enabled | Product gates and external configuration permit the capability for users |
| Published | Explicitly outside this plan until store approval and user authorization |

Current status is **specified and partially implemented only**. The app-local
PGS bridge and provider seam are implemented behind missing external config,
but no PGS feature, ranked relay, purchase, ad, or publication capability is
enabled.

## Official references

- [PGS platform authentication](https://developer.android.com/games/pgs/platform-authentication)
- [PGS server-side access](https://developer.android.com/games/pgs/android/server-access)
- [PGS setup, credentials, and testers](https://developer.android.com/games/pgs/console/setup)
- [PGS quality checklist](https://developer.android.com/games/pgs/quality)
- [Achievements](https://developer.android.com/games/pgs/android/achievements) and [leaderboards](https://developer.android.com/games/pgs/android/leaderboards)
- [Google Play services release notes](https://developers.google.com/android/guides/releases)
- [Play target API requirement](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- [16 KB page sizes](https://developer.android.com/guide/practices/page-sizes), [64-bit support](https://developer.android.com/google/play/requirements/64-bit), and [Play Integrity](https://developer.android.com/google/play/integrity/overview)

## Open QA questions

For final verification, Android QA should confirm the exact fixed-viewport
and swipe findings from the rejected preview, whether process-death/offline
tests were run on the recorded device, and whether any 16 KB test was physical
or bundle inspection only. A second physical Android device is still required
for cross-device relay and restore evidence.
