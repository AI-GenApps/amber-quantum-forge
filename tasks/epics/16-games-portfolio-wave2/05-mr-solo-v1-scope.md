---
epic: 16-games-portfolio-wave2
task: 05-mr-solo-v1-scope
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/04-fonts-meme-court-and-peeklings]
estimate: M
owner: agent
---

# Merge Relay: gate v1 to single-player (relays, PGS, network, and commerce off)

## Goal

Make the v1 build a fully offline, single-player game: Rescue, Daily and
Endless with local save. Friend relays, challenge links, sharing, Play Games
Services sign-in, the HTTP gateway and commerce stay in the codebase and
their tests, but are unreachable in v1 builds behind a single feature gate.

## Context / Decisions

- User decisions (2026-09-25): solo v1 and **no monetization**. Relays
  move to v1.1 (see `docs-internal/gaming/handoffs/merge-relay.md`, dated
  section from task 00).
- Current entry points to gate (verify each by reading the code):
  `lib/src/merge_relay_client.dart` (`createMergeRelayClient`, driven by
  `MERGE_RELAY_API_BASE_URL`), the home "Play a shared challenge" entry
  (`lib/src/merge_relay_home.dart`), the pause-panel share button
  (`lib/src/merge_relay_pause_panel.dart`), the PGS account UI
  (`lib/src/merge_relay_platform_actions.dart`,
  `lib/src/platform/merge_relay_pgs_account.dart`), challenge links
  (`lib/src/platform/merge_relay_challenge_links.dart`), and the Android
  deep-link intent filters in `android/app/src/main/AndroidManifest.xml`.
- The gate is a compile-time constant:
  `lib/src/merge_relay_features.dart`, with
  `const mergeRelaySocialEnabled = bool.fromEnvironment('MERGE_RELAY_SOCIAL', defaultValue: false);`.
  While it is false, the app must never construct the gateway or PGS
  bridge, never make a network call, and hide every relay, share, and PGS
  control.
- Deep links while gated: an incoming `mergerelay://challenge…` or https
  challenge link opens Home without an error dialog. Keep the Android
  intent filters so v1.1 needs no manifest migration, **unless**
  `games:validate:strict` or Play policy requires otherwise; record the
  choice in the task's evidence README.
- Existing relay and PGS tests must keep passing. Run them with the gate
  forced on through a test seam (an injectable `MergeRelayFeatures` object
  whose default comes from the constant), not by deleting tests.
- Settings keeps only the local controls (sound, music, vibration,
  reduced motion, tutorial replay); later tasks add the music and
  vibration toggles.

## Implementation Checklist

- [ ] Add `merge_relay_features.dart` and thread it through `MergeRelayApp`.
- [ ] Gate every entry point listed above.
- [ ] Ignore links when gated (open Home).
- [ ] Add `test/solo_v1_scope_test.dart`: with the default gate, no relay,
      share, or PGS widget exists on Home, Pause, Result, or Settings; a
      fake gateway factory is **never invoked**; and a challenge-link
      launch lands on Home.
- [ ] Adapt the existing relay/PGS tests to force the gate on through the
      seam, keeping every assertion.
- [ ] Update `.agents/games/merge-relay/product.md` (v1 surface) and
      `decisions-log.md`.

## Files Touched

- `apps-native/games/merge_relay/lib/src/merge_relay_features.dart` (new)
- `apps-native/games/merge_relay/lib/src/{merge_relay_app,merge_relay_home,merge_relay_pause_panel,merge_relay_platform_actions,merge_relay_client}.dart`
- `apps-native/games/merge_relay/lib/src/platform/*.dart` (gating only)
- `apps-native/games/merge_relay/test/**`
- `.agents/games/merge-relay/{product,decisions-log}.md`

## Acceptance Criteria

- `solo_v1_scope_test.dart` passes and contains a **positive control**:
  with the gate forced on through the seam, the same finders locate the
  relay, share, and PGS entry points. This proves the absence assertions
  aren't trivially true.
- The total test count is ≥ the task 02 baseline (120); no test is deleted
  or skipped.
- `grep -rn "fromEnvironment('MERGE_RELAY_SOCIAL'" lib` finds exactly one
  definition.

## Verification Commands

- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run games:validate:strict`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`
- Device check: NOT RUN (no device).

## Out of Scope

- Deleting any relay, PGS, network, or commerce code. Backend changes. Visual changes.

## Commit message

`feat(merge-relay): gate v1 to offline solo play behind a social feature flag [16-games-portfolio-wave2/05]`
