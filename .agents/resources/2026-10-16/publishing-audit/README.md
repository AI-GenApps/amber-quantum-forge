# Publishing-readiness audit (Google Play first, then App Store), 2026-10-16

Read-only audit of branch `main` (4 commits ahead of, 28 behind `origin/main`). Nothing was built, run, fetched or changed. The registry on `main` lists six games. `origin/main` adds a seventh, `city_drive` (public name **Street Royale**, Babylon.js + Capacitor), which I read through `git show origin/main:...`. Sources: `scripts/games/registry-games.ts`, `docs-internal/gaming/**`, `.agents/games/*`, epics 13/15/16 (and 17 on origin), each app's `android/` and `ios/`. Test counts and "passes" below are quoted from those docs, not re-run.

## Per-game table

| | Glow Rescue | Street Royale | Ludo Vortex | Sixty-Second Heist | Pocket Biome | Peeklings | Meme Court |
|---|---|---|---|---|---|---|---|
| Registry id | `merge_relay` | `city_drive` (origin only) | `ludo` (platforms: android only) | `sixty_second_heist` | `pocket_biome` | `snapquest` | `meme_court` |
| App/bundle ID (release; debug) | `app.w3dev.mergerelay`; `.debug` (`.staging`) | `app.w3dev.citydrive`; `.debug` | `app.w3dev.ludo`; `.debug`, `.staging` | `app.w3dev.sixtysecondheist`; `.debug` | `app.w3dev.pocketbiome`; `.debug` | `app.w3dev.snapquest`; `.debug` | `app.w3dev.memecourt`; `.debug` |
| Version | 0.1.0+1 (all seven; registry `registrationStatus` "unverified", `publisher` null, `domains` empty) | | | | | | |
| Maturity | Solo v1 playable: 60 solver-validated Rescue boards/6 chapters, Daily, Endless, tutorial, local save. ~16k LOC, 49 test files. Relay/PGS/network gated off (`mergeRelaySocialEnabled` false) | Playable free-roam, 3 districts, 24 missions, car roster + coin economy, traffic, audio, onboarding; epic 17 tasks 00-21 done, human task 22 open | Local modes (CPU, pass-n-play) device-signed-off 2026-09-26. Online, wallet, IAP, ads built and tested vs fakes only; 481 Flutter tests | 1 of ~80 levels; one mission; debug-style grid | 6-pot grid, 1 plantable species, 6 of ~30 defined; no art | 2 of ~30 creatures; camera recognition fails on device (`descriptorId=null`); desk-tap loop only | Hot-seat demo, fake players, 1 hard-coded round, 1 prompt, no memes. Parked |
| Monetization / SDK state | None. No ad/IAP SDK, but Gradle bundles `play-services-games-v2` (init provider removed) | None. No ads/IAP/accounts/analytics | IAP via RevenueCat (`purchases_flutter`), AdMob rewarded, Firebase Auth/Firestore/Crashlytics. No RevenueCat key (store disabled), AdMob manifest falls back to Google's sample app id, no real ad units, 8 product IDs only drafted | None | None | None | None |
| Art / icon / audio | Final icon A, wordmark B, 12 tile faces, 6 chapter cards, home scene; 7 SFX + loop, CC0 (`assets/audio/LICENSES.md`); Fredoka/Nunito | Final icon 1b, splash; Kenney CC0 3D; audio picks unauditioned; Russo One/Saira | Illustrated icon, lobby art, 8 audio files; economy art (26f) skipped, code-drawn fallbacks | Flat-vector icon; no audio; fonts only | Flat icon; no art/audio; direction B picked, dry-run only | Flat icon; no art/audio | Flat icon; no art/audio |
| Policy / Data safety / listing drafts | Policy `docs-public/legal/glow-rescue-privacy-policy.md` (URL and contact TBD); Data safety + rating + listing `.agents/games/merge-relay/store-listing.md` ("no data"). 6 screenshots + 1024x500 graphic in `.agents/resources/2026-09-25/merge-relay-store/`; 512 icon not exported | Policy `docs-public/legal/street-royale-privacy-policy.md`; listing + data safety `.agents/games/city-drive/store-listing.md`; release doc `docs-internal/gaming/city-drive-release.md`; graphic and screenshots not made | `docs-internal/gaming/ludo-privacy-policy.md`, `ludo-data-safety.md` (declares purchase history, ad ID, crash, UID), `ludo-content-rating.md`, `ludo-store-listing.md`; contact placeholders, no deletion path | Answer bank only (`.agents/games/sixty-second-heist/store-listing.md`) | Answer bank only | Answer bank only | Answer bank only |
| Match to SDKs/permissions | Plausible, but verify the bundled Play Games SDK and INTERNET against "no data" | Matches (a test pins no-network; only INTERNET) | Drafted from the SDK list; Crashlytics inert until the Gradle plugin lands | n/a | n/a | CAMERA + Families/COPPA exposure unresolved | UGC moderation unresolved |
| Android signing | `build.gradle.kts` reads `ANDROID_KEYSTORE_PATH/ALIAS/KEY_PASSWORD/STORE_PASSWORD` (no `key.properties`); throws without them in production; Play App Signing in `merge-relay-release-plan.md`; no keystore exists | No signing config; pass `-Pandroid.injected.signing.*` (release doc) | Same env-var scheme as Glow Rescue | Same | Same | Same (minSdk 24) | Same |
| Release build proof | Current: none. Only a 2026-09-17 test-key (NOTFORUPLOAD) AAB of pre-redesign code (hashes `docs-internal/gaming/verification.md`; logs were in /tmp). Stale 156 MB debug APK in `build/` | Debug APK only; AAB is task 22. JS budget 1.5 MiB with 5.7 KB margin | Release APKs 2026-10-16: universal 64.9 MB, arm64 28.4 MB vs 40 MB per-ABI budget (`ludo-performance-budgets.md`). AAB NOT RUN | 2026-09-17 test-key AAB only | Same | Same | Same |
| iOS | Runner + `ios/project.yml`; bundle = Android id; no `DEVELOPMENT_TEAM`, no `PrivacyInfo.xcprivacy`, no entitlements; deployment target 15.0. Historical 5-app signed device baseline (`verification.md`), now paused | Capacitor project committed; no privacy manifest (open question 16), no team; iOS 15 | Runner exists but out of scope: no `GADApplicationIdentifier`, no GoogleService-Info.plist | As Glow Rescue | As Glow Rescue | As Glow Rescue; camera string still says "SnapQuest" | As Glow Rescue |
| Firebase | None | None | `android/app/google-services.json` exists locally (gitignored; project `w3dev-games`, 3 package ids) but no Gradle plugin on `main` | None | None | None | None |
| Backend | None in v1 (optional `MERGE_RELAY_PUBLIC_ORIGIN`, PGS ids are v1.1) | None (static web build) | Needs deployed Hono API on Vercel, Postgres (migrations 0005-0010), Firebase Admin vars, `GAME_TOKEN_*`, `CRON_SECRET`, `REVENUECAT_*`, AdMob unit IDs (`ludo-release-checklist.md` s4) | None | Server ledger unbuilt | Server quests unbuilt | Live service + moderation required |
| AGENT-doable blockers | Build and inspect production AAB (empty PGS `APP_ID`, empty-host https intent filter); export 512 icon; audit PGS SDK vs Data safety | Merge origin; add AAB signing; build AAB; PrivacyInfo | Merge `feat/ludo-firebase-setup`; offline-profile or SDK declaration; AAB; deletion path | Rename; level generator + solver; art | Species/art content; policy docs | Fix recognition or ship desk-only; privacy docs | Moderation design; content |
| HUMAN-only blockers | Account, keystore, policy URL, support email, device checkpoint (task 25), closed test | Same, plus low-end device perf, screenshots, trademark | Firebase, RevenueCat, AdMob, Play products, trademark, content rating, task 29 | Pick name, art spend | Art spend | COPPA/Families decision | Moderator owner, copyright call |

## Findings worth acting on

- No game has a published identity: `publisher: null`, `domains: []`, no support email or domain anywhere in the repo.
- Glow Rescue's manifest has `com.google.android.gms.games.APP_ID` and an https intent filter driven by placeholders that are empty unless `MERGE_RELAY_PUBLIC_ORIGIN`/PGS ids are set. A production AAB has not been built since the rename and redesign, so this is unproven.
- Ludo's three known gaps (no `google-services` plugin, API base URL mismatch, `games:build` dropping dart-defines) are fixed only on unmerged branch `feat/ludo-firebase-setup` (commits `e444c67`, `41948e6`).
- `docs-internal/gaming/app-source-registry.md` still calls Glow Rescue "Merge Relay". The Ludo docs say no Firebase project exists, yet a `w3dev-games` config file is on disk; confirm.

## (a) Google Play checklist (cross-game)

Supported by repo docs:
- Account type decides the closed-test requirement; the repo records "12 testers for 14 days if personal" (`ludo-release-checklist.md:325`) and Glow Rescue's listing says to verify the live number at submission.
- Rollout: Internal, then Closed, then Production staged (`.agents/games/merge-relay/store-listing.md`).
- Play App Signing plus a separate upload key; AAB only for production (`scripts/games/cli-build.ts`).
- Per app: create the app (package ID above), listing text, 512 icon, 1024x500 graphic, phone screenshots, privacy policy URL, Data safety, IARC content rating, ads declaration, target audience (13+ planned for Ludo and Street Royale to avoid Families), and an account-deletion path for Ludo (its docs call it required).
- Ludo only: answer "simulated gambling: Yes" in the rating (`ludo-content-rating.md`); create 8 IAP products and the RevenueCat/AdMob setup.
- Everything else (target-API and 16 KB rules, testing-track rules for organisation accounts, Families questions, fees, identity verification): **verify in Play Console help**.

## (b) App Store checklist (after Play)

From repo constraints: Apple Developer Program membership and an App Store Connect record per bundle ID; Xcode 26 on macOS (CI uses `macos-26`, `games-build.yml`); iOS 15 target; Flutter games regenerate projects with `bun run games:xcodegen` (never edit `.xcodeproj`), Street Royale edits `project.pbxproj` in place; archive needs `IOS_DISTRIBUTION_TEAM` and `IOS_EXPORT_OPTIONS_PLIST`; set `DEVELOPMENT_TEAM` (absent everywhere); add `PrivacyInfo.xcprivacy` (absent everywhere; Street Royale needs `UserDefaults` reason `CA92.1`); 6.9" screenshots; App Privacy label ("Data Not Collected" is the Street Royale plan; derive for Glow Rescue); TestFlight internal first. Ludo iOS needs an AdMob iOS app ID and StoreKit products first. Review notes, age rating, label rules, fees: **verify in App Store Connect help**.

## (c) Do once for all games

1. Developer identity: account type, legal developer name, support email, website/domain; write into registry `release.publisher/domains`.
2. Host `docs-public` (Mintlify, legal tab) to get stable privacy-policy URLs; move Ludo's policy there.
3. One brand/publisher name across listings.
4. One signing/CI path: `.github/workflows/games-android-release.yml` with per-game environments `games-<app>-release` and secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `ANDROID_STORE_PASSWORD`. It covers the six Flutter games; Street Royale needs its own step.
5. Trademark clearance beyond the store-name checks.

## (d) Release order

| # | Game | Why | Effort |
|---|---|---|---|
| 1 | Glow Rescue | Offline, no data, no ads/IAP, listing assets done | Agent 1-2 days; human 1-2 days plus closed-test wait |
| 2 | Street Royale | Same compliance profile, release docs written; risk is WebView 3D perf on low-end Android | Agent 1 day after merge; human device pass |
| 3 | Ludo Vortex | Most complete game, but IAP, ads, accounts, simulated-gambling rating, deletion path. Ship offline v1.0 first (no keys), online/economy later | Offline: agent 3-5 days; full: 2-3 weeks plus human provisioning |
| 4 | Sixty-Second Heist | Needs rename and ~80 levels; solver approach reusable from Glow Rescue | Weeks |
| 5 | Pocket Biome | Art is the product; large art budget | Weeks, art-bound |
| 6 | Peeklings | Camera plus young audience (COPPA/Families), recognition unproven | Blocked on decision |
| 7 | Meme Court | Needs live service and moderation | Park |

## (e) Top 10 next tasks

1. HUMAN: choose Play account type, developer name, support email, domain; decide personal vs organisation (sets closed-test rule).
2. HUMAN: deploy public docs; get URLs for `docs-public/legal/glow-rescue-privacy-policy.md` and `street-royale-privacy-policy.md`. AGENT: fill the TBD contact lines afterwards.
3. AGENT (owner session): `git fetch`, merge `origin/main` (Street Royale) and `feat/ludo-firebase-setup`.
4. AGENT: prove a Glow Rescue production AAB with a throwaway keystore: `bun run games:build -- --app merge_relay --platform android --mode aab --environment production`; inspect merged manifest and AAB size; record under this folder.
5. AGENT: export the 512 icon from `apps-native/games/merge_relay/assets/art/logoStacked.png`; reconcile Data safety with `play-services-games-v2`; fix `app-source-registry.md`.
6. HUMAN: create the Glow Rescue upload keystore (guide in `merge-relay-release-plan.md`), set the `games-merge_relay-release` secrets, run `games-android-release.yml`, then the task 25 device pass and Internal testing upload.
7. HUMAN + AGENT: Street Royale task 22 (device perf, screenshots, Vercel optional); agent adds AAB signing and builds.
8. HUMAN: decide Ludo scope (offline v1.0 vs full) and start trademark clearance for "Ludo Vortex" and "Street Royale".
9. AGENT: Ludo offline release profile or Data safety by actual SDKs; build AAB and record size against the 40 MB per-ABI budget.
10. AGENT (needs a Mac): iOS prep for games 1 and 2: team ID, `PrivacyInfo.xcprivacy`, `bun run games:xcodegen`. HUMAN: Apple Developer enrollment and App Store Connect records.
