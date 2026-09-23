---
title: Ludo implementation plan
description: Phased plan for the first Unity full 3D client and sixth monorepo game, with server-authoritative multiplayer and an iOS-first release.
---

# Ludo implementation plan

Status: **Implementation in progress; Phase 1 physical visual acceptance pending.** This document adds no task status, deployment, store registration, provider selection, database migration, or production claim.

Ludo is the sixth game in the monorepo and its first Unity client at `apps-native/unity/ludo/`, separate from the five-app Flutter workspace. The active Phase 1 gate is the mobile-first local flow on Samsung SM-A525F (`RZ8R32EAB7T`), Android 14, native 1080x2400; the flow scaffolding, local tutorial states, and provenance-backed visual assets are implemented, but physical build/install/capture acceptance remains open.
Unity 3D remains the implementation technology with a readable safe-area-aware top-down board. See [the mobile UI and tutorial annex](ludo-mobile-ui-plan.md), the [89-capture manifest](../../.agents/resources/2026-09-19/ludo-reference/manifest.json), [reference study](../../.agents/resources/2026-09-19/ludo-reference/study.md), [redesign evidence](../../.agents/resources/2026-09-20/ludo-redesign/README.md), and [visual provenance](../../apps-native/unity/ludo/Assets/Content/ludo_visual_provenance.json); the editor is pinned to Unity `6000.6.2f1`.
Backend, authentication, realtime, provider, scheduler, monetization, and store work remain deferred to later phases. The existing Next.js/Hono API and PostgreSQL are the later authority path. Nakama is out of scope, iOS is first for publication, and Android joins the same match contract after it.

## Product boundary and decisions

- Match size is two to four human players. v1 has private rooms with an
  invite code and quick public matchmaking. Reconnect after backgrounding,
  process death, network loss, or device change is a release requirement.
- Game Center/GameKit and Google Play Games Services v2 are optional platform
  capabilities. They link a verified provider identity to an existing
  canonical account; they do not replace API authentication, transport, or
  match authority. A Game Center identity is not Sign in with Apple.
- iOS and Android use the same versioned rules, wire contract, match state,
  replay events, and server decisions. Platform SDKs remain app-local native
  bridges and never become a cross-platform networking abstraction.
- The client is full 3D: Unity URP materials, authored models, physical dice,
  lighting, restrained camera movement, sound/haptics, and asset provenance/ownership.
- Base play remains usable when either platform SDK, push provider, or realtime
  provider is unavailable. Provider failure changes presence/notification
  quality and retry state, never the authoritative result.

## Identity, environments, and path map

The stable internal ID is `ludo`; the production iOS bundle ID and Android
application ID are both `app.w3dev.ludo`. The debug ID is
`app.w3dev.ludo.debug`; `debug`, `staging`, and `production` have separate API,
database, signing, provider, save, analytics, and entitlement configuration.
The namespaces are `games.ludo`, `game.ludo`, `games.ludo.entitlements`, and
`w3dev-ludo`. Store registration status remains unverified until the owner
confirms it externally.

| Concern | Planned path or boundary |
|---|---|
| Unity client and metadata | `apps-native/unity/ludo/{Assets,Packages,ProjectSettings}` and `apps-native/unity/ludo/ludo.config.json`; config supplies app/environment/API values; URP scenes, materials, models, lighting, audio, `content/`, and provenance records |
| Pure C# rules/presentation | `Assets/Scripts/{Rules,Presentation,Auth,Transport,Platform}` with assembly tests; shared JSON vectors also feed the authoritative TypeScript engine |
| iOS platform adapter | `Assets/Plugins/iOS/` and typed C# Game Center adapter using the official Unity-compatible GameKit plugin |
| Android platform adapter | `Assets/Plugins/Android/` and typed C# PGS v2 adapter using a Unity plugin whose compatibility is verified in Phase 0 |
| Auth/platform config | `Assets/Scripts/Auth/LudoAuthGateway.cs`, secure storage, and reviewed `content/ludo_platform_catalog.json` |
| Hono API | `packages/api/src/games/ludo/{contracts,wire,engine,identity,match-service,matchmaking,routes,realtime,outbox,timers}.ts` |
| Vercel realtime entrypoint | `apps/web/app/api/games/ludo/[environment]/realtime/route.ts`; upgrades/authenticates the WebSocket and delegates to the API adapter |
| Database | `packages/db/src/schema.ts` and a reviewed migration for Ludo tables and indexes |
| Unity workflow/exports | `.github/workflows/ludo-unity.yml` triggers on `apps-native/unity/ludo/**`, `packages/api/src/games/ludo/**`, `packages/db/**`, and the Ludo web route; pinned Unity/license setup runs headless `-batchmode -executeMethod LudoBuild.*`, ignores `build/ios/` and `build/android/`, and emits `app.w3dev.ludo.aab`; Bun orchestrates checks/invocations and never builds C# |
| API tests/load fixtures | `packages/api/src/games/ludo/*.test.ts` and a Bun load harness under `scripts/games/` |

Unity Ludo does not use the Flutter Pub workspace, `games:generate`, `games:native`, or `games:xcodegen`; exported `.xcodeproj`, Gradle, and AAB
outputs are generated and never hand-edited. Its config has a separate
validator, while `scripts/games/registry.ts` remains the five-count registry
and existing games CI remains five-app Flutter-only; no other game or dirty
file is changed.

## Proposed `rules_v1` defaults

These are explicit defaults for product review. No client or source document
may silently choose a different variant; the review freezes fixtures and the
rules version before service or native work begins.

| Rule | Proposed default |
|---|---|
| Board and pieces | 52-cell perimeter, six-cell home lane per color, four tokens per player; token positions are yard, track index, home index, or finished |
| Entry and finish | A token leaves the yard on a six; movement into the final cell requires an exact roll |
| Dice and turns | Server rolls one fair d6; a six grants another roll; a player chooses one legal token move or auto-passes when none exists |
| Three sixes | The third consecutive six ends that turn without applying that roll; earlier legal moves stand. Product review must explicitly approve this variant |
| Capture and safety | Landing on an opponent on a non-safe cell sends it to the yard; the proposed safe set is four start cells plus six authored star cells, but exact track indices are a Phase 0 fixture and are not assumed to be universal Ludo rules |
| Blockades | Two same-color tokens may form a blockade; an opposing token cannot cross or land on it; the exact coordinate and stacking fixture is frozen in Phase 0 |
| Win | The first player to finish all four tokens wins and terminates the match; v1 has no secondary ranking score |
| Timeout | 30 seconds for the roll phase and 30 seconds for the move phase; expiry records a miss and passes without an automatic move; three consecutive missed phase deadlines forfeit that seat, the last active seat wins, and all-forfeited matches are abandoned |
| Reconnect | Reconnect reads the current snapshot and remaining phase deadline; disconnect, backgrounding, and provider outage never pause or extend the clock |

The pure C# rules assembly exposes validation, legal moves, state transitions,
serialization, replay, and a test-injected dice source. A shared `ludo_v1.json`
fixture is consumed by the C# assembly tests and authoritative TypeScript
engine; it covers 2/3/4 players, entry, extra rolls, safety, blockades,
capture, exact finish, timeout, duplicate commands, and terminal replay.

The first current gate remains a usable local mobile visual/tutorial slice on the
verified physical Android target before backend expansion: welcome, reference-linked
tutorial states, local setup, a readable top-down Unity 3D board, and simulated
authority. Current evidence is code and archive evidence only; physical visual
acceptance is pending. The separate public release order remains iOS first. Later
slice evidence records device/OS/build/source-fixture IDs, die presentation,
profiler/thermal capture, and sound/haptic/reduced-motion results. Local physics
never becomes authority.

## Server authority and persistence

The API is mounted as `/api/games/ludo/:environment` in the existing Vercel
deployment. A path-derived `app_id` and environment are checked from the
signed game token; request bodies and headers cannot select another app,
environment, subject, or match.

Every turn command is authoritative on the server. Each roll uses a
cryptographically secure server RNG inside the command transaction and is
persisted as an event before the response. Clients send intent (`roll`, `move`,
`surrender`, or `rematch`) with a command ID and expected match/turn version;
they never send a die result, score, winner, or new state. A replay uses the
recorded rolls and frozen rules/content revision. A verifiable commit/reveal
seed is a separate product decision; it is not mixed into `rules_v1` without
its own review and security proof.

Use normalized PostgreSQL tables for `ludo_matches`, `ludo_players`,
`ludo_turns`, `ludo_events`, `ludo_commands`, `ludo_matchmaking_tickets`,
`ludo_identity_links`, `ludo_outbox`, and `ludo_timer_jobs`. Match rows carry
the current version, status, rules revision, turn ID, deadline, and bounded
snapshot; events are append-only with a unique `(match_id, sequence)`.

Each command runs in one transaction: lock the match row, validate the signed
subject, membership, status, turn, deadline, command fingerprint, and rules
state; apply the pure transition; insert the command receipt and event; update
the snapshot/version; insert one realtime/notification outbox row for that
event sequence; enqueue timer work; then commit. The outbox row is leased,
published after commit, retried with backoff, and dead-lettered after bounded
attempts. Unique `(environment, match, event_sequence, channel)` keys and
provider idempotency keys make duplicate delivery harmless. Tests must cover
commit success with publish failure, retry, lease expiry, dead-letter recovery,
and no lost or duplicate event sequence. A repeated command with the same
fingerprint returns its original result. A reused ID with different semantics
returns a conflict. No in-memory store or process-local timer is authoritative;
memory adapters are test-only.

Timeouts use durable timer rows containing match, turn, phase, deadline, miss
count, and lease data. A worker or provider wakeup claims due rows with
`FOR UPDATE SKIP LOCKED`, rechecks the deadline inside the match transaction,
and applies the same idempotent timeout command. Three consecutive missed
phases mark the seat forfeited and select the last active winner, or abandon
the match if no active seat remains. Vercel Cron's minute granularity is only
a repair sweep; it is not the gameplay timer. The release gate requires a
durable wakeup mechanism with a measured deadline SLA, or automatic timeout
processing stays disabled. A client request after a deadline may safely claim
the due row in the same transaction, so a scheduler outage never extends the
clock; provider outages leave rows retryable and are reconciled by authenticated
state polling on reconnect. Match creation must fail closed when the scheduler
health check cannot prove that deadline processing meets the agreed SLA; an
ongoing match retains its persisted deadlines and can recover through a due-row
claim without any grace extension.

## API, identity, realtime, and notifications

Initial endpoints are `POST /matches`, `POST /matches/:id/join`, matchmaking
queue create/cancel, `GET /matches/:id?after_seq=...`, and an idempotent
`POST /matches/:id/commands`. Add protected platform-link routes for
`game-center` and `play-games`; return a versioned state and error envelope
with match version, turn deadline, event cursor, and retry classification.

The Unity game must not assume that an existing server auth route has a client
implementation. `plugins/flutter/auth` (`starter_auth`) and `AuthManager` are
wired to `apps-native/flutter-app` and cannot be reused as Unity runtime code;
Ludo reuses only their HTTP auth contracts. First launch creates a recoverable
guest through `POST /guest`, stores opaque recovery material securely, and
offers `Sign in or link account` and `Recover guest`. Add a scoped game-token
exchange that verifies the guest or canonical API credential, then issues an
app/environment/subject game token; Unity never passes its API JWT directly to
game routes. Guest saves, matches, and platform links migrate transactionally;
cross-device restore requires an explicit link or recovery action.

Before this exchange is consumed, fix and test the canonical-subject seam in
`packages/api/src/routes/auth-tokens.ts`: Firebase exchange signs `sub`/`uid`
from the immutable Firebase UID, while refresh currently signs both from the
user email and exchange resolves users by email, including an empty email.
Freeze provider-immutable ID mapping with explicit no-email and collision
handling, then add exchange-to-refresh subject-continuity and guest/link
regression tests. This plan records the prerequisite and makes no auth-route
code change.

The canonical account comes from that verified API flow. On iOS, GameKit
returns its identity-verification signature; the server verifies the recent
timestamp and Apple public-key signature over the protocol's player/team and
bundle identity bytes, allow-lists the public-key URL, and applies SSRF
protections before linking the verified Game Center identity. The typed Unity
GameKit adapter is the client capability; it is not the server verifier. On
Android, the typed PGS v2 Unity adapter delegates the documented native
server-side-access request with the configured web OAuth client ID; the server
exchanges the one-time code and verifies the PGS player with the official API.
Store provider ID, app, environment,
canonical account, verification time, and bounded audit data only. Never link
by display name, email, or matching strings; never log raw codes, tokens, or
provider responses. Conflicts require an explicit recovery/support path and
never silently merge accounts. PGS multiplayer services are retired, so PGS
identity is not a matchmaking or transport dependency.

Platform services also require a source-reviewed capability contract and a
versioned, externally configured catalogue. GameKit client APIs may present or
submit an achievement/leaderboard result only after the server has finalized
that result and the user has an authenticated Game Center capability; this
client submission is distinct from any server verification API and cannot
authorize a match or score. The backend provider adapter, if enabled, uses
the documented provider API and its own credentials/scopes rather than a
fictional shared server SDK or Unity Authentication/backend replacement. PGS server access requires the real per-environment
web OAuth client, secret/scopes, Play project/application ID, package/signing
fingerprints, and tester configuration; all are external gates.

`ludo_platform_catalog` names the Game Center and PGS achievement IDs,
leaderboard IDs, descriptions, thresholds, and rules revision per environment;
IDs are supplied by App Store Connect/Game Center and Play Console and are
never fabricated in source. Finalized server results enqueue idempotent
provider deliveries keyed by `(environment, match, result, provider, item)`;
retries, rate limits, decline, and outage states are persisted. The client UI
and reporting screens show the authoritative finalized result and provider
sync state, never a client score claim. Missing catalogue or store config
keeps achievements/leaderboards disabled while base matches remain playable.

Realtime is a notification transport, not authority. The verified Vercel
direction is a direct WebSocket adapter on Fluid using
`experimental_upgradeWebSocket` from `@vercel/functions` (Beta, available on
all plans), exposed through the dedicated Next route above. A connection is
pinned only to one instance for its lifetime, can close at the platform's
maximum duration, and may reconnect to another instance or deployment.
Therefore committed event notifications fan out through an external,
subscription-capable Redis/pub-sub client; a REST-only Redis client is
insufficient. PostgreSQL snapshots and events remain authoritative, and the
WebSocket carries only match ID, event sequence, and a prompt to read state.
Phase 0 must validate the Beta API in an actual deployment, lifecycle and
maximum-duration behavior, auth, cost/limits, and Redis pub/sub client
capability. A durable external job scheduler is also required for turn
wakeups; Vercel Cron is only a coarse repair sweep. No Nakama or mandatory
managed realtime product is assumed.

`LudoRealtimeTransport` uses that adapter when enabled and always retains the
HTTPS command/read path. The fallback is versioned long-polling with
exponential backoff and cursor recovery; it remains correct during a WebSocket
or pub/sub outage. The handshake is subscribe-buffer, then snapshot plus
cursor, then fetch events after that cursor; the client deduplicates by event
sequence. Reconnect repeats the handshake, and periodic authenticated cursor
reconciliation detects a lost final notification even when the socket and
pub/sub layer both report success.

Committed match events enqueue an outbox row for invite, turn-start, expiry,
match-finished, and reconnect notifications. A durable worker claims rows,
sends through APNs or FCM adapters, records provider response/attempts, and
retries with backoff and a dead-letter state. Push is a hint only; a foreground
or resumed client always reads authoritative state. Notification tokens are
scoped to canonical account, app, and environment and are revocable.

## Phased implementation and dependencies

| Phase | Depends on | Deliverables and exit gate |
|---|---|---|
| 0. Contract/research freeze | None | Review `rules_v1`, visual budget, wire/auth semantics, privacy fields, and iOS-first scope; freeze Unity editor/plugin revisions and supported iOS/Android matrix, verify Apple GameKit and Google PGS Unity plugins, Vercel WS/Redis, lifecycle/cost limits, and durable scheduler options; use a custom native bridge if a plugin lacks a required identity API |
| 1. Unity vertical slice | 0 | Build and integrate the reference-first local home, tutorial, setup, and readable top-down URP board with materials, models, lighting, dice, camera, audio/haptics, legal highlight, simulated authority, and C# assembly tests; current flow scaffolding is in place, while the physical-Android visual gate remains open before backend expansion |
| 2. Rules and replay | 1 | Implement pure C# rules and deterministic replay; publish `ludo_v1.json` parity vectors consumed by the C# assembly and `packages/api/src/games/ludo/engine.ts`; malicious state is rejected |
| 3. API authority and Postgres | 2 | Add guest/recovery and canonical-account routes, normalized schema/migration, transactional command service, per-roll server RNG, idempotency, event cursor, matchmaking, room membership, durable timers, and Postgres-to-pub/sub publication; concurrency/rollback passes |
| 4. iOS identity and platform contract | 3 | Implement typed GameKit linking, guest/link/recovery UX, platform achievement/leaderboard contract, and fake PGS adapter; actual Android PGS plugin work waits for Phase 7 |
| 5. iOS client and transport | 2–4 | Build the Unity room/matchmaking/turn/reconnect UX, C# API gateway, WS adapter, polling fallback, GameKit adapter, lifecycle/offline handling, and outbox token registration; two-device iPhone flow passes |
| 6. Reliability and iOS release readiness | 3–5 | Durable wakeups, WS/Redis/push outage drills, load/soak and thermal/render profiling, crash/ANR/telemetry, App Store Connect catalogue/config, privacy/support, signed Unity iOS export, and TestFlight/App Store readiness; submission is separate |
| 7. Android parity and release readiness | 2–6 | Add PGS v2 Unity adapter/server access, Play OAuth/fingerprint/tester/catalogue gates, cross-platform vectors/matches, signed Unity Android Gradle/AAB export, and closed-testing/Play readiness; upload is separate |

## Security, reliability, and acceptance gates

- Reject forged, expired, wrong-app, wrong-environment, non-member, stale-turn,
  replayed, malformed, oversized, and rate-limited commands. Use TLS, signed
  short-lived game tokens, secret storage in Vercel environment settings,
  provider-specific scopes, audit IDs, redacted logs, retention limits, and
  no client-controlled score/RNG/state.
- Proposed initial launch SLO/load targets are 500 concurrent matches (up to
  2,000 connected clients), p95 command commit under 500 ms, p99 under 1.5 s,
  p95 state read under 300 ms, p95 reconnect under 2 s, timer wakeup lag p95
  under 5 s, outbox age p95 under 30 s, and at least 99.5% successful
  non-4xx commands. Test two to four concurrent players, simultaneous commands,
  conflicting idempotency keys, process restarts, transaction rollback,
  timeout races, provider outage, push retry, stale realtime events, polling
  recovery, and database failover at that load. Telemetry reports command/state
  latency, lock contention, error rate, reconnect success, active matches,
  timer lag, outbox age, WebSocket reconnects, provider sync outcomes, and
  abandoned matches with app/environment and opaque match IDs only.
- Real-device iOS acceptance requires two physical iPhones, Game Center
  sandbox/tester accounts, private-room invite, quick matchmaking, every turn
  rule, background/process death, network loss, reconnect from event cursor,
  timeout recovery, push/no-push behavior, account-link conflict, and replay.
  The polished Unity route must show a legible URP board, legal-move
  highlighting, authoritative-result-driven physical dice/token animation,
  tutorial, audio/haptics controls, reduced-motion behavior, measured thermal
  profile, and a 60fps target on the minimum supported physical device.
  No simulator or emulator result substitutes for this gate.
- After the iOS App Store readiness gate, Android acceptance requires two physical
  Android devices, PGS testers, the same cross-platform match scenarios,
  PGS decline/offline/relink, signed AAB identity and permissions, and closed
  Play testing. The planned sequence is iOS TestFlight readiness, authorized
  App Store submission/publication, then Android closed-testing readiness and
  authorized Play submission/publication; this plan does not execute those
  store actions.

Implementation readiness requires `rules_v1` review, the provider/timer
decision, Postgres transactions and outbox/timer recovery, guest/link/recovery
flows, cross-runtime parity, and both platform identity contracts without
name/email matching. Store publication is a separate release decision after
the physical-device and staged-store gates; implementation evidence must never
be presented as publication.

## References for implementation review

- [Mobile UI/tutorial annex](ludo-mobile-ui-plan.md) · [89-capture manifest](../../.agents/resources/2026-09-19/ludo-reference/manifest.json) · [redesign evidence](../../.agents/resources/2026-09-20/ludo-redesign/README.md) · [visual provenance](../../apps-native/unity/ludo/Assets/Content/ludo_visual_provenance.json) · [Vercel WebSockets](https://vercel.com/docs/functions/websockets) · [public beta](https://vercel.com/changelog/websocket-support-is-now-in-public-beta) · [Apple Unity plugins](https://github.com/apple/unityplugins) · [Unity iOS build](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/iphone/ios-building-and-delivering/build-process) · [PGS Unity plugin](https://developer.android.com/games/pgs/unity/overview) · [GameKit verification](https://developer.apple.com/documentation/gamekit/gklocalplayer/fetchitems(foridentityverificationsignature:)) · [PGS server access](https://developer.android.com/games/pgs/android/server-access) · [PGS migration](https://developer.android.com/games/pgs/migration_overview) · [PGS multiplayer retirement](https://support.google.com/googleplay/android-developer/answer/9469745)
