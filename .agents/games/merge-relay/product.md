# Merge Relay — product

## One-liner

A warm, character-driven tile-merge puzzle: slide numbered tiles together to reach a
goal, work through a 60-board rescue campaign in 6 chapters, or play Daily and Endless —
solo, offline, no ads, no IAP.

## Scope for v1 (2026-09-25 decision)

Solo-only. Friend relays (async two-player handoff), Play Games Services, and every
server/network path are **gated off** for v1 but the code is kept for v1.1. See the
dated decision section added to `docs-internal/gaming/handoffs/merge-relay.md` (this
epic, task 00) for exactly which requirement-ledger rows (MR-04–MR-08, MR-11, MR-13)
are deferred.

The gate is a single compile-time constant,
`apps-native/games/merge_relay/lib/src/merge_relay_features.dart`
(`mergeRelaySocialEnabled = bool.fromEnvironment('MERGE_RELAY_SOCIAL', defaultValue: false)`),
wrapped in an injectable `MergeRelayFeatures` seam so relay/PGS tests can force it on
without deleting or skipping assertions (task 05,
`apps-native/games/merge_relay/test/solo_v1_scope_test.dart`). While the flag is
false: `createMergeRelayClient` (`lib/src/merge_relay_client.dart`) returns `null`
before building the HTTP gateway or auth store; `MergeRelayGame` never constructs the
`MergeRelayPgsAccountController` "PGS bridge"; `openRelay`, `createRelayFromCurrentBoard`,
and every native Play Games call (`initializePlayGames`, `linkPlayGames`,
`refreshPgsAccount`, achievements/leaderboards) no-op; and the "Join a relay" (Home),
"Share this board" (Pause, Result), and Play Games (Settings) controls are hidden.
An incoming `mergerelay://challenge…` or https challenge link is never even read while
gated — the app just opens to Home. The Android intent filters
(`apps-native/games/merge_relay/android/app/src/main/AndroidManifest.xml`) are kept
as-is for v1 so v1.1 needs no manifest migration; `games:validate:strict` does not
inspect manifest contents, so nothing forces their removal.

## Modes (as implemented today)

| Mode | Status | Source |
|---|---|---|
| Rescue (goal-in-N-moves boards) | built; 5 authored boards today, expanding to 60 boards / 6 chapters in task 06 | `apps-native/games/merge_relay/content/rescue_boards.json`, `apps-native/games/merge_relay/content/manifest.json` (`client_milestone.rescue_boards.count: 5`) |
| Daily | local-practice today (no server daily yet) | `apps-native/games/merge_relay/content/manifest.json` (`modes.daily: "local-practice"`) |
| Endless | playable | `apps-native/games/merge_relay/content/manifest.json` (`modes.endless: "playable"`) |
| Friend relay (async 2-player handoff) | **gated off for v1**, kept for v1.1 | `apps-native/games/merge_relay/lib/src/merge_relay_relay_models.dart`, `apps-native/games/merge_relay/lib/src/merge_relay_relay_actions.dart`, `apps-native/games/merge_relay/lib/src/network/merge_relay_network_operations.dart` |
| Play Games Services (PGS) | **gated off for v1**, kept for v1.1 | `apps-native/games/merge_relay/lib/src/platform/merge_relay_pgs_account.dart`, `apps-native/games/merge_relay/lib/src/platform/merge_relay_play_games.dart` |

## Rules (engine, as implemented)

- Deterministic merge engine with seeded spawning; board/snapshot/generator/moves must
  match across the Dart client and the server fixtures (`bun run games:parity`).
  Source: `apps-native/games/packages/merge_rules`.
- Rescue boards ship an `origin_seed` and `origin_moves` trace; the client replays it and
  rejects mismatched state (`apps-native/games/merge_relay/content/rescue_boards.json`,
  `apps-native/games/merge_relay/content/manifest.json`
  → `client_milestone.rescue_boards.provenance`).
- Board size 4×4, up to 3 ranked/legal moves considered for relay continuation logic
  (`apps-native/games/merge_relay/content/manifest.json` → `checkpoint.max_ranked_moves`),
  2 initial tiles, spawn distribution 90% "2" / 10% "4"
  (`checkpoint.initial_tiles`, `checkpoint.spawn_distribution`).
- Rule/content versions: `rule_version: MR-2D-1`, `content_version: MR-CONTENT-1`
  (`apps-native/games/merge_relay/content/manifest.json`).

## Content (today vs. v1 target)

| | Today | v1 target (this epic) |
|---|---|---|
| Rescue boards | 5 (`rescue_boards.json`) | 60, in 6 chapters, every board solver-validated (task 06) |
| Themes | 2 (`signal`, `ember`) (`manifest.json` → `client_milestone.themes`) | carried forward; visual overhaul restyles them (task 07–08) |

## Onboarding

A first-play tutorial exists (`apps-native/games/merge_relay/lib/src/merge_relay_tutorial.dart`),
shown in the audit render `.agents/resources/2026-09-25/games-portfolio-audit/renders/merge_relay-02-tutorial.png`
("First handoff").

## Screens (current)

Home (`apps-native/games/merge_relay/lib/src/merge_relay_home_widgets.dart`), play board
(`apps-native/games/merge_relay/lib/src/merge_relay_play_widgets.dart`), relay screens
(gated off for v1 — `apps-native/games/merge_relay/lib/src/merge_relay_relay_screen_views.dart`),
tutorial. Audit renders: `merge_relay-01-home.png`, `merge_relay-02-tutorial.png`,
`merge_relay-03-play.png`, `merge_relay-04-result.png` under
`.agents/resources/2026-09-25/games-portfolio-audit/renders/`.

## Audio & feel (current gap, being closed this epic)

Sound toggle exists but **no audio files are bundled yet** (portfolio audit,
`.agents/resources/2026-09-25/games-portfolio-audit/README.md`). Task 10 adds CC0 audio
and music; task 09 adds motion/juice/haptics.

## Tech

Flutter + Flame; pure Dart rules package (`apps-native/games/packages/merge_rules`) with
parity fixtures against a compiled JS server engine (`bun run games:parity`); a Hono
service exists at `packages/api/src/games/merge-relay/` for the (v1.1-deferred) relay,
guest-identity, save-sync and commerce paths — see
`docs-internal/gaming/handoffs/merge-relay.md` requirement ledger (MR-01–MR-15) for what
is specified vs. implemented vs. integrated vs. verified vs. enabled today.

## Platform gating references

- `apps-native/games/AGENTS.md` — source-indexed requirement rule (refresh provenance +
  affected handoff before changing a requirement).
- `docs-internal/gaming/handoffs/merge-relay.md` — requirement ledger and the 2026-09-25
  solo-v1 decision section (added by this task).
