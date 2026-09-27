# Task 18 — Merge Relay: apply the chosen brand name

Applied the chosen name **Glow Rescue** (task 17,
`tasks/epics/16-games-portfolio-wave2/decisions.md`) to every user-visible surface of
`apps-native/games/merge_relay`, while keeping the internal id `merge_relay`, the
bundle ids `app.w3dev.mergerelay(.debug)`, the save/analytics namespaces, and the
folder names.

## What changed

- `scripts/games/registry-games.ts`: `canonicalName`/`publicTitle` → `Glow Rescue`;
  `subtitle` → `"Merge tiles, rescue the board."` (≤30 chars, no relay/friend promise).
- `bun run games:codegen` regenerated `apps-native/games/merge_relay/game.config.json`
  and `apps-native/games/packages/platform_core/lib/src/generated/game_app_registry.dart`.
- `apps-native/games/merge_relay/content/manifest.json`: `public_title` → `Glow Rescue`
  (required by `games:validate:strict`); `subtitle` aligned to the same store-style copy.
- `scripts/games/icons.ts` (`updateAndroidLabel`): fixed the pre-existing
  `games:icons:check` failure. Merge Relay's `AndroidManifest.xml` sets
  `android:label="${mergeRelayAppLabel}"`, a Gradle manifest placeholder resolved at
  build time (`android/app/build.gradle.kts`), not a literal string — the old check
  only ever compared against a literal `android:label="<title>"` and always failed for
  this app. The fix resolves the placeholder's Gradle assignment
  (`manifestPlaceholders["mergeRelayAppLabel"] = ...`) to its production string and
  accepts the manifest as-is when that resolves to the registry's `publicTitle`;
  otherwise it reports exactly which Gradle line is stale. Added a covering case to
  `scripts/games/icons.test.ts` (accepted-placeholder + stale-placeholder-value).
- `apps-native/games/merge_relay/android/app/build.gradle.kts`: the two literal Gradle
  strings behind that placeholder, `"Merge Relay"` / `"Merge Relay QA"` →
  `"Glow Rescue"` / `"Glow Rescue QA"`.
- `apps-native/games/merge_relay/ios/Runner/Info.plist`: `CFBundleDisplayName` →
  `Glow Rescue`, written by `bun scripts/games/icons.ts --app merge_relay` (the normal
  icon-asset writer; no icon pixels changed — same source SVG, deterministic render,
  confirmed via `git diff --stat` showing only the `Info.plist` line).
- In-app strings (the wordmark and its fallback-screen copy — see grep below for the
  full "in scope vs. gated" breakdown):
  - `lib/src/assets/merge_relay_art_manifest.dart` (`_FallbackWordmark`, the
    `logoWide`/`logoStacked` slot fallback used on Home and Settings' dimmed
    background): `'MERGE RELAY'` / `'MERGE\nRELAY'` → `'GLOW RESCUE'` / `'GLOW\nRESCUE'`.
  - `lib/src/screens/merge_relay_welcome.dart` (first-run welcome screen, hardcodes its
    own copy of the stacked wordmark): `'MERGE\nRELAY'` → `'GLOW\nRESCUE'`.
  - `lib/src/merge_relay_app.dart` (`_MergeRelayContentFailure`, the fallback screen
    shown if bundled content fails to load): `'Merge Relay needs a fresh start.'` →
    `'Glow Rescue needs a fresh start.'`.
  - `lib/src/merge_relay_content.dart` (`MergeRelayContentLoadException` message,
    surfaced verbatim in that same fallback screen's diagnostic text):
    `'Merge Relay content could not be loaded'` → `'Glow Rescue content could not be
    loaded'`.
  - `lib/src/merge_relay_play_widgets.dart` (`MergeRelayHeader`'s small eyebrow label —
    dead code, not referenced by any current screen composition, but still a literal
    rendered string): `'MERGE RELAY'` → `'GLOW RESCUE'`.
  - `lib/src/merge_relay_home_art.dart`: updated the doc comment naming the fallback
    text (`"MERGE RELAY"` → `"GLOW RESCUE"`), since it's not an internal/engineering
    descriptor but a literal quote of the rendered string.
- Tests asserting the old title:
  - `test/widget_test.dart`, `test/merge_relay_art_manifest_test.dart`: `'MERGE
    RELAY'`/`'MERGE\nRELAY'` → `'GLOW RESCUE'`/`'GLOW\nRESCUE'`.
  - `test/merge_relay_no_relay_wording_test.dart`: removed the `_isBrandWordmark`
    exemption (and its call site) per the orchestrator's instruction — the test now
    fails on **any** visible "relay" text in solo v1, with no wordmark carve-out. It
    still passes because the wordmark no longer says "relay" and every other "relay"
    reference in the app lives behind the `mergeRelaySocialEnabled` gate.
  - `apps-native/games/packages/platform_core/test/platform_core_runtime_test.dart`:
    asserted `appIdentityFor('merge_relay').canonicalName`/`.publicTitle` against the
    literal `'Merge Relay'`, which broke once the generated registry changed. Updated
    to `'Glow Rescue'`. (Outside the task's listed Files Touched, but required —
    `games:test` fails otherwise.)
- Goldens regenerated with `flutter test --update-goldens test/goldens/screens_test.dart`
  and viewed with the Read tool: `home.png`, `home_small.png`, `welcome.png`,
  `settings.png` (the settings sheet's dimmed background shows the Home header). All
  four render "GLOW RESCUE" cleanly at 1080x2400 (and 360x640 for `home_small.png`)
  with the bundled Fredoka font, no overflow, no clipped text, no empty bands. No other
  golden changed (none of the others show the wordmark).
- `.agents/games/merge-relay/README.md`: title, the "Name" row in Quick facts, and the
  Status row.
- `.agents/games/merge-relay/store-listing.md`: title and the "App name" identity row;
  filled in the short-description draft (was "TBD — written after the rename").
- `docs-internal/gaming/handoffs/merge-relay.md`: added a new dated section,
  "2026-09-27 user decision — brand name 'Glow Rescue'", recording the pick and what
  task 18 touched, alongside the existing "2026-09-25 ... solo v1 scope cut" section
  (left untouched other than the new section after it, per the task's "handoff's dated
  section" instruction).

## Deliberately left untouched (v1.1 relay copy behind the social gate)

Per the task's instruction to leave v1.1 relay copy alone:

- `lib/src/merge_relay_relay_share.dart`: the OS share-sheet `'title': 'Merge Relay'`
  and the share message `'Join $creatorAlias in Merge Relay: ...'`. Only reachable
  through `MergeRelayRelayController`/the share panel, which are gated behind
  `MergeRelayFeatures.socialEnabled` (`mergeRelaySocialEnabled`,
  `bool.fromEnvironment('MERGE_RELAY_SOCIAL')`, `false` by default and in every test
  that doesn't force it on).
- `lib/src/network/merge_relay_wire.dart`, `lib/src/network/merge_relay_network.dart`:
  `MergeRelayProtocolException` messages ("Unsupported/Invalid Merge Relay
  contract/response"). Part of `merge_relay_gateway.dart`'s HTTP client, only
  constructed/called when `socialEnabled` is true — unreachable in the v1 build.
- `test/merge_relay_share_test.dart`: asserts the gated share title above; left as-is
  since it's testing gated v1.1 code, not solo-v1 UI.

## Deliberately left untouched (internal/engineering name in comments)

Following the Ludo Vortex rename precedent (`git show --stat e7385da`, which also left
every `Ludo`-only doc comment as-is after renaming to "Ludo Vortex"): doc comments
across `lib/src/**` that use "Merge Relay" as the module's internal/engineering name
(e.g. "Merge Relay's Home screen", "Merge Relay's brand design tokens", "Compile-time
gate for Merge Relay's social surface") are unchanged — they describe the
`merge_relay` module, which keeps its internal id. Also unchanged for the same reason:
`apps-native/games/packages/merge_rules/lib/src/merge_rescue_solver.dart`'s doc comment,
and `apps-native/games/packages/platform_core/test/platform_core_test_support.dart`'s
hand-written `AppIdentity` test fixture (`canonicalName`/`publicTitle`/`subtitle` still
say "Merge Relay"/"Challenge friends") — it's a generic fixture for exercising
`platform_core`'s `AppContext`/`AppIdentity` types, not read from or compared against
the live game registry, so nothing depends on it matching the current name; no test
fails either way.

Also unchanged: the other `.agents/games/merge-relay/*.md` files (`product.md`,
`economy.md`, `decisions-log.md`, `open-questions.md`, `assets-index.md`) — the task
named only `README.md`, the handoff's dated section, and the store-listing skeleton in
scope for this task.

## `grep -rn "Merge Relay" apps-native/games/merge_relay/lib`

Before: `grep-before.txt` (24 hits). After: `grep-after.txt` (22 hits) — every
remaining hit is either a gated v1.1 relay code path (share/network, listed above) or
an internal/engineering-name doc comment (also listed above); none is user-visible
solo-v1 text.

## Verification

- `bun run games:codegen` — regenerated the config/registry files above.
- `bun run games:validate:strict` — pass (after fixing `content/manifest.json`'s
  `public_title`).
- `bun run games:icons:check` — pass (was the known pre-existing failure this task
  fixes).
- `bun test scripts/games/icons.test.ts` — pass, 2/2 (added the placeholder-label
  case).
- `bun run games:format:check` — pass (after `bun run games:format` reformatted the
  edited test file).
- `bun run games:analyze -- --app merge_relay` — pass, no issues.
- `bun run games:test -- --app merge_relay` — pass (after fixing
  `platform_core_runtime_test.dart`, broken by the registry change).
- `bun run check` — pass (added a `biome-ignore` for a literal Android manifest
  placeholder string in the new icons test that Biome's `noTemplateCurlyInString`
  otherwise flags).
- `bun run typecheck` — the only failure is the pre-existing, unrelated
  `web#typecheck` (10 `TS2322` errors in `apps/web/app/components/ui/*.tsx`), already
  documented by the orchestrator as reproduced on HEAD `a2b345d`; same file set and
  error count reproduced here. `@repo/api`, `@repo/db`, `@repo/ai`, `@repo/analytics`,
  `@repo/ui`, and `native` all typecheck clean.
- `bun run games:build -- --app merge_relay --platform android --mode debug
  --environment debug` — pass, `app-debug.apk` built (Gradle `assembleDebug`, 48.4s).
- Device/emulator steps: **NOT RUN** (no device or emulator on this server).

## Bundle ids / namespaces unchanged

`git diff` on `game.config.json`, `build.gradle.kts`, and `project.yml` shows no change
to `productionId`/`debugId`/`applicationId`/`namespace`
(`app.w3dev.mergerelay(.debug)`), `saveNamespace`, or `analyticsNamespace` — only the
name fields and the two label strings.
