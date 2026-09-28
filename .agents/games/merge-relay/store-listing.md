# Glow Rescue — store listing answer bank

Answers for Google Play Console (now) and App Store Connect (later), completed at
task 24 (release readiness). Google Play first, per
`.claude/skills/audit-game-and-prepare-for-release/references/10-store-submission.md`.
Every data-safety and permission answer below cites the code it was verified
against — grep the same paths to re-verify before submission if the code
changes.

v1 is offline-only: no accounts, no ads, no in-app purchases, no network
calls (task 05's `MERGE_RELAY_SOCIAL` gate). Copy stays truthful to that —
no "play with friends" claim.

## Identity

| Field | Answer |
|---|---|
| App name (≤30) | **Glow Rescue** (11 chars) — chosen at task 17 (`tasks/epics/16-games-portfolio-wave2/decisions.md`), applied task 18 |
| Package name | `app.w3dev.mergerelay` (production), `app.w3dev.mergerelay.debug` (debug) |
| Developer name / account | **TBD (human)** — which Play developer account submits this app |
| Default language | **TBD (human)**; English (United States) expected |
| App or game | Game |
| Category | Puzzle |
| Tags | puzzle, merge, tile, casual, offline |
| Free or paid | Free (no ads, no IAP in v1) |
| Contact email / website | **TBD (human)** |
| Privacy policy URL | **TBD (human — hosting)**; page content is done: `docs-public/legal/glow-rescue-privacy-policy.md` (see `open-questions.md` #3) |

## Listing copy

- **Short description (≤80, this draft is 69 chars):** "Merge tiles, rescue the board. 60 boards, 6 chapters. No ads, no IAP."
- **Full description (≤4000):**

  > Glow Rescue is a cozy tile-merge puzzle: slide tiles together, merge them
  > up, and clear the board. Every board has a path — find it.
  >
  > **Rescue** — a 60-board campaign across 6 chapters, each with its own
  > goal and a warm cast of tile characters.
  >
  > **Daily** — a fresh board every day, the same for everyone.
  >
  > **Endless** — no goal, no end. Keep the chain going and chase your best
  > score.
  >
  > No ads. No in-app purchases. No account needed — just open the app and
  > play. Your progress saves on your device.

- **App Store (later):** subtitle, keywords — **TBD (human, at the iOS submission task)**.

## Graphics

| Asset | Spec | Source |
|---|---|---|
| App icon | 512×512 PNG, 32-bit | **Not exported yet (human/console step)** — the final icon art is integrated as the Android launcher `mipmap-*/ic_launcher.png` set (task 22; xxxhdpi is 192×192, confirmed by inspection) and as `assets/art/logoStacked.png` (610×606); a dedicated 512×512 export for the Play Console listing (distinct from the launcher mipmaps) still needs to be produced from that same master art at submission time |
| Feature graphic | 1024×500, no alpha | `.agents/resources/2026-09-25/merge-relay-store/feature-graphic.png` (this task) |
| Phone screenshots | 6, 1080×2400 | `.agents/resources/2026-09-25/merge-relay-store/screenshots/` (this task) |
| iOS screenshots (later) | 6.9" set | **TBD (human, at the iOS submission task)** |

## Content rating (IARC questionnaire) — answers

| Topic | Answer | Evidence |
|---|---|---|
| Violence / fear / sexuality / crude humor / language / drugs, alcohol, tobacco | None | No such content anywhere in `apps-native/games/merge_relay/lib` or `content/rescue_boards.json` — a numeral tile-merge puzzle with cartoon character faces |
| Gambling / simulated gambling | None | No coin tables, no loot boxes, no random paid items — v1 has no IAP at all (`pubspec.yaml` has no purchase/billing package) |
| User-generated content / user interaction | No | v1 is solo-only: `mergeRelaySocialEnabled` (`lib/src/merge_relay_features.dart:12`) defaults `false`, and `createMergeRelayClient` — the only path to the relay/chat/share surface — returns `null` before constructing anything when the gate is off (`lib/src/merge_relay_client.dart:56`) |
| Shares location | No | No location package in `pubspec.yaml`; no `ACCESS_*_LOCATION` permission in `android/app/src/main/AndroidManifest.xml` |
| Digital purchases | No | No IAP in v1 (see `economy.md` for what's deferred to v1.1) |
| Ads | No | No ad SDK in `pubspec.yaml` |

## Target audience & content

Broad / all-ages: no gambling, no ads, no user-to-user interaction, no
data collection, no purchases. A cartoon tile-merge puzzle with a solo
campaign, daily board, and endless mode.

## Data safety form (Google Play) — answers

Verified 2026-09-28 by reading the shipped v1 code path (not the gated
v1.1 relay/PGS code, which is unreachable — see the "Data collection or
transfer" row below).

| Data type | Collected? | Shared? | Evidence |
|---|---|---|---|
| Personal info (name, email, user IDs, address, phone) | No | No | No auth, no account, no PII field anywhere in `lib/src` outside the disabled relay/PGS code |
| Financial info (purchase history, card info) | No | No | No IAP/billing package in `pubspec.yaml`; no purchase code |
| Location | No | No | No location package; no location permission in the manifest |
| App activity (app interactions, in-app search history, installed apps) | No | No | Telemetry exists but is **never persisted to disk or sent off-device** — see below |
| App info and performance (crash logs, diagnostics) | No | No | Crash reporting ships as `NoOpCrashReporter` (`lib/src/crash/merge_relay_crash_reporter.dart`) — every method is a no-op; no crash SDK is bundled (`pubspec.yaml` has no Crashlytics/Sentry/Firebase dependency) |
| Device or other IDs | No | No | No advertising-ID package; no ads in v1 |
| Photos, videos, audio files, contacts, calendar, health | No | No | Not read or requested anywhere |

**"App activity" detail (why it's "No" despite in-app telemetry existing):**
`MergeRelayGame` creates one `MemoryTelemetrySink` per session
(`lib/src/merge_relay_game.dart:102`) and every `telemetry.record(...)` call
(e.g. `merge_move_completed`, `merge_move_ignored` in
`lib/src/merge_relay_game_actions.dart:94` and `:147`) writes into it.
`MemoryTelemetrySink.record` only appends to an in-memory `List`
(`packages/platform_core/lib/src/telemetry.dart:34-40`) — there is no file
write, no HTTP call, and no other `TelemetrySink` implementation wired into
`merge_relay` (confirmed by grep: `MemoryTelemetrySink` is the only
concrete `TelemetrySink` referenced under `apps-native/games/merge_relay`).
The list is discarded when the app process ends.

**Data collection or transfer while the app is running:** none. The only
outbound HTTP path is `MergeRelayGateway`/`DartIoMergeRelayHttpTransport`
(`lib/src/network/merge_relay_http.dart`), and it is never constructed:
`createMergeRelayClient` checks `if (!features.socialEnabled) return null;`
(`lib/src/merge_relay_client.dart:56`) before doing anything else, and
`MergeRelayFeatures.socialEnabled` defaults to the compile-time constant
`mergeRelaySocialEnabled = bool.fromEnvironment('MERGE_RELAY_SOCIAL')`
(`lib/src/merge_relay_features.dart:12`), which is `false` unless a build
explicitly passes `--dart-define=MERGE_RELAY_SOCIAL=true` (the shipped
release build does not).

**Local storage:** save data only — `createMergeRelaySaveStore` writes a
JSON file under the OS-provided app documents directory
(`path_provider`'s `getApplicationDocumentsDirectory()`,
`lib/src/save_adapter.dart:7-8`). It never leaves the device and is deleted
if the app is uninstalled.

**Data deletion request path:** not applicable — no server-side data
exists to delete. Local save data is removed by uninstalling the app or
clearing app storage from Android Settings.

**Encryption in transit:** not applicable in v1 (no network calls). When
v1.1 re-enables the relay, the existing gateway already requires TLS
(`android:usesCleartextTraffic="false"` in
`android/app/src/main/AndroidManifest.xml`).

**Independent security review:** No.

## Ads declaration & consent

Contains ads: **No**. No ad SDK is present in `pubspec.yaml`.

## In-app products

None in v1. See `economy.md` for what's deferred to v1.1 (friend relays,
Play Games Services, and any future commerce are all still gated off by
`mergeRelaySocialEnabled`).

## Permissions (Android)

The merged manifest (`android/app/src/main/AndroidManifest.xml:3`) declares
exactly one permission: `android.permission.INTERNET`.

**Decision: keep it for v1.** Rationale:
- It is a normal (not dangerous) permission — Android grants it
  automatically at install time with no runtime prompt or user-facing
  disclosure, unlike camera/location/contacts.
- No network call is ever made while it's unused: see the "Data collection
  or transfer" evidence above (`merge_relay_client.dart:56` returns `null`
  before any `HttpClient` is constructed).
- The gated v1.1 relay/PGS feature already depends on it, and the deep-link
  intent filters for that feature were likewise kept in the manifest for v1
  (`.agents/games/merge-relay/decisions-log.md`, 2026-09-25 entry) so v1.1
  needs no manifest migration. Removing and re-adding it would be pure
  churn with no safety benefit, since the permission grants no capability
  the app doesn't already legitimately need for its next release.
- Play's review does not flag `INTERNET` as sensitive; the Data safety form
  above is what accurately discloses "no data collected or transmitted,"
  which is the substantive claim reviewers and players care about.

No other permission is requested (no camera, location, contacts,
microphone, storage, or advertising-ID access).

## Testing & release track

- Suggested rollout: Internal testing → Closed testing (a Google Group or
  a tester list, per the current Play requirement for new personal
  developer accounts — verify the live number at submission time) →
  Production, staged rollout.
- Release notes (v1.0.0 draft): "Glow Rescue launches! Rescue 60 boards
  across 6 chapters, plus Daily and Endless modes. No ads, no
  purchases — just merge tiles and clear the board."
- Signing: see `docs-internal/gaming/merge-relay-release-plan.md` (§ "Glow
  Rescue v1 solo release", added this task) for the upload-keystore guide.

## FAQ for support/reviews

- *Can I play offline?* Yes — v1 is entirely offline, local-save only.
- *Can I play with a friend?* Not in v1; friend relays are planned for a
  future update.
- *Are there ads or purchases?* No — v1 has neither.
- *Do you collect my data?* No account, no analytics leave your device —
  see the privacy policy for details.
- *I lost my progress after reinstalling / clearing storage.* Progress is
  saved locally only in this version; there's no cloud backup yet.
