# Merge Relay — product

Sourced from `docs-internal/gaming/handoffs/merge-relay.md`,
`docs-internal/gaming/merge-relay-release-plan.md`,
`docs-internal/gaming/merge-relay-api-contract.md`,
`docs-internal/gaming/merge-relay-commerce.md`,
`docs-internal/gaming/merge-relay-release-audit.md`,
`docs-internal/gaming/sources/merge-relay.json`, `scripts/games/registry-games.ts`,
`tasks/epics/14-merge-relay-implementation/STATUS.md`, and
`apps-native/games/merge_relay/lib/src/*`. PRD sources are v0.3 (Drive-modified
2026-09-10, checked latest 2026-09-16); an earlier v0.1 archive is superseded.

## Core loop / genre

A 2048-style number-merge puzzle: a fixed 4x4 (16-cell) board of power-of-two tiles,
swipe-first controls (Up/Left/Right/Down; on-screen accessibility arrow buttons are
optional, not the default input). Rule version is frozen to `MR-2D-1`. The domain package
(`apps-native/games/packages/merge_rules`) is pure Dart with no Flutter/Flame import,
and must match a compiled-JS/server implementation bit-for-bit (seed, RNG state, spawn
weights `spawn_two_weight`/`spawn_four_weight`, checkpoint hash over
`board/move_count/rng_state/rule_version/score/seed`).

On top of the core puzzle sits a **relay** layer: a checkpoint (board state) can become an
immutable "challenge" that a player sends via code/deep link to a friend, who plays a
bounded continuation and can send a reciprocal "return relay" back.

## Modes

- **Rescue** — authored, source-bound boards, each with its own move budget. Each board
  declares an objective and four distinct results: success, missed, terminal, and
  early-finish, each carrying score delta, max tile, and moves used, with mode-appropriate
  Replay/Next/Home/Share/Return actions.
- **Ranked relay** — a challenge created from a rescue/daily/endless checkpoint; capped at
  **at most 3 legal moves**; the challenge and its result are immutable and idempotent once
  created; a no-op move cannot advance the RNG; finish/expiry/retry cannot improve a result;
  a reciprocal "return relay" is possible with immutable parent/child links.
  Ranked history is kept separate from daily practice history.
- **Daily challenge** — a server-provisioned, UTC-date-seeded board (`content_id` like
  `daily_20260917`), fixed rule/content revision per date; a public read must not silently
  publish unreviewed content. Daily is **practice-only** and does not inherit the ranked
  move budget by accident — it is a separately resolved contract.
- **Endless** — a local, deterministic continuation mode (referenced in evidence as one of
  the "current client can play local deterministic rescue/endless paths").

Home screen (per the UX contract and `merge_relay_home.dart`) is compact: Continue/Play,
Rescue (progress: boards cleared/total), Join a relay, and Daily are the primary actions;
settings, profile, themes, and achievements stay behind secondary menus.

## Audience / tone

Casual puzzle audience, friend-to-friend competitive/social hook (challenge codes, not
open-ended chat/contacts/DMs — see MR-13 "safe social surfaces": codes resist enumeration,
players can report/block, no free-text messaging). Copy is plain and instructional ("Build
a clean chain before the board locks."), tone is calm/competitive rather than cartoon-cute
or aggressive.

## Visual style & palette (current)

Two named in-app themes (`apps-native/games/merge_relay/lib/src/merge_relay_theme.dart`):

| Theme | Paper (bg) | Ink/board | Slot | Accent blue | Accent sky | Coral | Warm | Muted |
|---|---|---|---|---|---|---|---|---|
| Signal (default) | `#EDF5FB` | `#10243E` | `#203754` | `#3E75B6` | `#4E93D3` | `#A53B36` | `#E5534B` | `#52677D` |
| Ember (alt) | `#FBF2EA` | `#2B1C36` | `#49304F` | `#8D4D85` | `#B76B88` | `#B34D3F` | `#D48742` | `#72566B` |

Current device screenshots (`docs-internal/gaming/evidence/visual/merge-relay-final-real-merge.png`,
`merge-relay-final-relaunch.png`) show the Signal theme: light powder-blue page background,
bold navy "Merge Relay" wordmark, a pill "ROUND 1" badge, three flat stat cards (Score /
Best Tile / Target Tile), a large rounded dark-navy board panel with lighter-navy empty
slots and solid mid-blue tile chips (white numerals, a subtle top-right highlight dot for a
soft-3D glossy look). Mood: clean, flat, high-contrast "scoreboard" feel — geometric rounded
rectangles, no textures or multi-stop gradients. This is functional/placeholder-adjacent
styling, not yet a full visual overhaul against a competitor reference.

## Monetization plan

- **Cosmetic-only** in the current design: a single non-consumable product,
  `merge_relay_theme_pack_v1` (Play one-time product) → server entitlement
  `merge_relay.theme_pack.v1`, provider `google_play_billing`. No currency/consumable
  economy is defined anywhere in the sourced docs.
- Server-side purchase/restore/catalog/entitlements routes exist and are tested against
  Google's official `ProductPurchaseV2` fixture (get/verify/acknowledge, pending/purchased/
  cancelled/refunded/revoked settlement, encrypted token vault, idempotency) — but there is
  **no native Google Play Billing SDK integration, no live Play product registration or
  pricing, no RTDN/voided-purchase requery**.
  Registry capabilities include `ads`, but AdMob rewarded-ad SSV is explicitly not built.
- MR-11 (rewards/purchases) requires that cancel/no-fill/failure never blocks base play, and
  ad/IAP callbacks settle exactly once — a design requirement, not yet fully verified.

## Platform / status

- Registry (`scripts/games/registry-games.ts`): `platforms: ["ios","android"]`,
  `rendering: "flame"`, `lifecycle: "concept"`, `release.version: "0.1.0"`,
  `buildNumber: 1`, `storeProductIds: {ios: null, android: null}`, `publisher: null`.
- Release sequencing: Google Play / Android first (user steering 2026-09-17); further iOS
  QA is paused until after Google Play publication, though an iOS signed/install/play
  baseline was retained from earlier work.
- Epic `tasks/epics/14-merge-relay-implementation/` is **in-progress**: most subtasks are
  `[~]` partial; task 03 (Flutter gateway / full end-to-end device wiring) is `[ ]` not
  started; task 10 (bounded backend corrective foundation) and task 11 (CI/local smoke) are
  the only `[x]` complete rows, and even those note "full-MVP gates remain open."
- Test evidence: `bun run games:parity` passes the deterministic Dart/compiled-JS replay
  fixture; the route-produced HTTP fixture and bounded backend suite pass 35 tests / 98
  assertions; a 2026-09-18 isolated PostgreSQL 16.15 run validated migrations across
  receipts/purchase/provider/vault. A single physical Android device
  (`SM-A525F`, Android 14, 1080x2400) was used for a 2026-09-17 smoke/real-merge capture —
  **no second device**, so cross-device relay/restore is unverified.
- Explicitly NOT done: PGS (Play Games Services v2) project/app ID/OAuth client/achievement
  IDs, Play signing/tracks, store listing/content rating/data safety inputs, native Billing
  SDK, AdMob, any store submission.

## Ownership map (from the handoff doc)

| Logical owner | Owns |
|---|---|
| `merge-domain` | `apps-native/games/packages/merge_rules` — board, seeded RNG, legal moves, terminal state, replay payload |
| `merge-client` | `apps-native/games/merge_relay` — Flutter/Flame composition, onboarding, save/reconnect UX, accessibility |
| `merge-service` | `/games/merge_relay` API — signed identity, opaque challenge, reservation, server recomputation, idempotent rewards |
| `merge-content` | `apps-native/games/merge_relay/content` + validators — versioned rescue/daily boards, themes, fixture hashes |
| `merge-release` | app config, Android QA, sandbox commerce, evidence, store checklist |

The pure rules package must never import Flutter/Flame/SDKs. The service must never trust a
client-reported score, rule version, or `app_id` header for authorization.
