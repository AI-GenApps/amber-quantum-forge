---
epic: 16-games-portfolio-wave2
task: 27-mr-release-manifest-hardening
status: complete
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/26-mr-device-qa-fixes]
estimate: M
owner: agent
---

# Glow Rescue: harden the release manifest and align store disclosures with the Play Games SDK

## Goal

Fix the manifest and disclosure findings of the 2026-10-16 release inspection
(`.agents/resources/2026-10-16/glow-rescue-release-build/README.md`) for a v1
that **keeps the Google Play Games Services SDK in the app but gated off**
(`mergeRelaySocialEnabled` false). Task 25 (the human device checkpoint) stays
pending and human-owned; this task signs nothing off.

## Context

- **Product decision (owner, 2026-10-16):** `com.google.android.gms:play-services-games-v2`
  and the Kotlin/Dart PGS code MUST STAY. Nothing here removes either. The
  inspection report's "drop the SDK" suggestion is therefore rejected; every
  fix makes the manifest and the disclosures correct for "SDK present, dormant".
- The release inspection report is the spec; its findings 1-4 and the fix list
  in its section 5 are what this task implements.

## Decisions

### 1. Play Games `APP_ID`: omitted unless a real id is configured

(Full evidence: `.agents/resources/2026-10-16/glow-rescue-release-build/README.md`,
"After task 27", and `manifests/pgs-sdk-22.1.0-app-id-read.txt`.)

What the SDK does without the entry (read from the `play-services-games-v2:22.1.0`
AAR in the Gradle cache, decompiled with `javap`; not guessed):

- The SDK's own manifest does **not** declare `com.google.android.gms.games.APP_ID`.
  The app is expected to. The SDK's manifest declares only
  `PlayGamesInitProvider` (which this app removes with `tools:node="remove"`),
  `GamesResolutionActivity`, `PlayGamesAppShortcutsActivity`, the `games.version`
  meta-data and two `<queries>` packages.
- The only place the client library reads `APP_ID` is the app-shortcuts helper
  (`com.google.android.gms.games.internal.v2.appshortcuts.zzt.zza`), which runs
  from `PlayGamesSdk.initialize(context)` (`zzbw.zza`). It does
  `Long.parseLong(bundle.getString("com.google.android.gms.games.APP_ID", ""))`
  inside a `try` whose handler catches `NumberFormatException` and returns
  `null`, i.e. "no shortcuts". So an absent entry and an empty entry behave
  identically in the client library: no crash, no shortcuts.
- Nothing in the app calls `PlayGamesSdk.initialize` at start: the init provider
  is removed, and `MergeRelayPlayGamesSdkGate` only initialises after
  `applicationConfigured` (a non-blank id) and only when Dart invokes the bridge,
  which Dart does only behind `mergeRelaySocialEnabled`.
- So the SDK does **not** need the entry at app start. A numeric placeholder id
  is therefore not needed and would be worse (a fake id that looks real).
  What GMS (the Play services app, outside this repo) does on a sign-in with a
  missing id could not be read here; that is a v1.1 concern, covered by the
  human step below.

Implementation: the static manifest no longer contains the meta-data. A small
Gradle task (`MergeRelayManifestConditionalsTask` in `android/app/build.gradle.kts`),
wired through AGP's supported `SingleArtifact.MERGED_MANIFEST` transform, adds
it to the merged manifest **only** when `MERGE_RELAY_PGS_<ENV>_APPLICATION_ID`
(or `-PmergeRelayPgs<Env>ApplicationId`) is set. The value is a
`@string/merge_relay_pgs_application_id` reference (generated with `resValue`),
because aapt2 stores a literal of up to 10 digits as an **integer**
(verified with `aapt2 dump xmltree`: `1234567` becomes an int, `123456789012`
stays a string) and the SDK reads it with `Bundle.getString`, which does not
return an integer. A non-numeric id fails the build.

Human step (required before enabling PGS in v1.1): Play Console > Play Games
Services > Setup and management > Configuration: create the Play Games
Services project, link `app.w3dev.mergerelay`, and copy its **numeric project
id** into `MERGE_RELAY_PGS_PRODUCTION_APPLICATION_ID` (also the achievement
and leaderboard ids and the server client id for the other three
`MERGE_RELAY_PGS_*` values). Until then PGS features must stay off.

### 2. https App Link filter: only with a valid origin

The static manifest no longer declares the `https` intent-filter. The same
Gradle task adds it to `MainActivity` only when `MERGE_RELAY_PUBLIC_ORIGIN`
(or `-PmergeRelayPublicOrigin`) is set; the existing check in `build.gradle.kts`
already rejects anything that is not an https origin without path, query,
port or user info. The `mergerelay://challenge` custom-scheme filter stays
(the game's own challenge link, not an App Link). No `autoVerify` is added; that
needs a hosted `assetlinks.json` and is a v1.1 step.

### 3. Backups off

`android:allowBackup="false"` on `<application>`. The privacy policy promised
"no cloud backup or sync"; before, Android auto-backup was on by default and
only the secure-auth prefs were excluded. `backup_rules.xml`
(`fullBackupContent`, API 23-30) and `data_extraction_rules.xml` (API 31+,
the rules targetSdk 36 expects) now exclude **every** domain for both
cloud-backup and device-transfer, so they agree with `allowBackup=false` and
Lint does not see a half-excluding rule set.

### 4. Exported components

(Verified on the merged manifest of the rebuilt production APK and AAB.)

The game's own manifest declares exactly one exported component:
`MainActivity` (the launcher; the VIEW filters need it). It declares no
services, receivers or providers. Everything else exported or visible in the
merged manifest comes from libraries and stays:

| Component | exported | Source |
|---|---|---|
| `PlayGamesAppShortcutsActivity` | true | play-services-games-v2 (SDK stays) |
| `<queries>` `com.google.android.gms`, `com.android.vending` | n/a | play-services-games-v2 |
| `GamesResolutionActivity` | false | play-services-games-v2 |
| `GoogleApiActivity` | false | play-services-base |
| `androidx.profileinstaller.ProfileInstallReceiver` | true (DUMP-protected) | androidx.profileinstaller |
| `androidx.startup.InitializationProvider` | false | androidx.startup |
| permission `app.w3dev.mergerelay.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | signature | androidx.core |

### 5. Disclosures

Privacy policy, store-listing Data safety evidence and the release plan now
say: the app bundles the Play Games SDK; in v1 it is gated off, the game makes
no calls, no sign-in, and no network request (only the `INTERNET` permission is
declared); in v1.1 a Play Games player id is used and leaderboard and
achievement data is handled by Google; and SDK-collected-data answers in the
Data safety form must be re-checked in Play Console help before submission.
Nothing says Google collects nothing. The backup sentence matches change 3,
and the second permission and the `<queries>` entries are listed.

### 6. Release APK command

`scripts/games/cli-build.ts` now accepts `--environment production --mode release`
for Android (a production-signed release APK, `--split-per-abi`, the same
size-budget measurement as the AAB path) and applies the **same keystore
guard** as `--mode aab`: without the four `ANDROID_*` variables and an
existing keystore file it prints `NOT RUN` and exits 2 instead of failing late
in Gradle. Chosen over documenting a hand-typed `flutter build apk` because it
is a six-line change, it removes a source of drift in dart-define arguments,
and `scripts/games/cli.test.ts` pins it.

## Implementation Checklist

- [x] Static manifest: no `APP_ID` meta-data, no https filter, `allowBackup=false`.
- [x] Gradle: conditional APP_ID and https filter in the merged manifest; numeric id validation.
- [x] Backup rules exclude every domain.
- [x] `docs-public/legal/glow-rescue-privacy-policy.md`: SDK, backups, permissions.
- [x] `.agents/games/merge-relay/store-listing.md`: Data safety evidence, permissions, SDK.
- [x] `docs-internal/gaming/merge-relay-release-plan.md`: release notes, APK command, PGS human step.
- [x] `docs-internal/gaming/app-source-registry.md`: public title "Glow Rescue".
- [x] `scripts/games/cli-build.ts` production release APK + tests.
- [x] Non-device regression test `scripts/games/merge-relay-manifest.test.ts`.
- [x] Rebuild production AAB and release arm64 APK, re-inspect, record "After task 27".
- [ ] Task 25 (human) device launch check of the new APK: not done here, no device (stays open, human-owned; see Caveats).

## Files Touched

`apps-native/games/merge_relay/android/app/{build.gradle.kts,src/main/AndroidManifest.xml,src/main/res/xml/backup_rules.xml,src/main/res/xml/data_extraction_rules.xml}`,
`scripts/games/{cli-build.ts,cli.test.ts,merge-relay-manifest.test.ts (new)}`,
`docs-public/legal/glow-rescue-privacy-policy.md`,
`.agents/games/merge-relay/{store-listing,decisions-log,open-questions}.md`,
`docs-internal/gaming/{merge-relay-release-plan,app-source-registry,commands}.md`,
`.agents/resources/2026-10-16/glow-rescue-release-build/{README.md,manifests/*}`,
`tasks/epics/16-games-portfolio-wave2/{27-mr-release-manifest-hardening.md,STATUS.md}`.

## Test and build results (2026-10-16, this Mac, no device)

- `bun run games:format -- --check`: pass (0 changed).
- `bun run games:analyze -- --app merge_relay`: No issues found.
- `bun run games:validate -- --strict`: passed.
- `bun test scripts/games`: 70 pass, 1 fail. The one failure is
  `checked-in Dart VM and compiled JS replay fixture stays in parity`
  (`Pinned Bun 1.3.3 is required; found 1.4.2`), pre-existing: it fails the
  same way on a throwaway worktree of HEAD, which also failed
  `generic generator keeps debug and production native identities separate`
  there (that one passes in this tree; the worktree is a fresh checkout without
  the generated project files). The "6 known failures" figure was not
  reproduced here. The new tests fail on HEAD sources (4 of the 6 manifest
  tests and 3 of the 4 new CLI tests; the rest are guards that already held).
- `bun run check` fails only because of the nested `biome.json` in
  `.claude/worktrees/ludo-firebase-setup` (another session's); `bunx biome check`
  on the three changed `.ts` files is clean.
- Mintlify validation of the edited docs could not run (the tool fails to load
  its own dependencies under bun 1.4.2).
- Rebuilt a production AAB and release APKs with a throwaway key, plus one
  build with fake ids: results, before/after table and the PGS analysis are in
  `.agents/resources/2026-10-16/glow-rescue-release-build/README.md`
  ("After task 27").

## Caveats (open at completion)

- A launch check of the task 27 APK on a device is still pending (task 25, human). The device run in `.agents/resources/2026-10-16/glow-rescue-release-build/device/` is from the pre-task-27 APK.
- The Play Games application id must come from Play Console before PGS is enabled (v1.1); until then no `MERGE_RELAY_PGS_<ENV>_APPLICATION_ID` may be set for the v1 build.
- Data safety answers for SDK-collected data (bundled-but-dormant Play Games SDK and the other Google Play services components) still have to be checked in Play Console help.
- Mintlify validation of the edited docs was not run.
- `--mode release` with `--environment production` now applies to every game's CLI build, and its keystore guard (four `ANDROID_*` variables and an existing keystore file, else `NOT RUN`, exit 2) applies to all of them.

## Acceptance Criteria

- The merged production manifest has no `com.google.android.gms.games.APP_ID`
  entry and no https intent-filter when no PGS id and no public origin are set,
  has `allowBackup="false"`, and still contains the play-services-games-v2
  components.
- With a (fake) numeric PGS id and a (fake) https origin both entries appear
  with the configured values and nothing is empty.
- Disclosures say what the repo can prove and tell the reader to verify
  SDK-collected data answers in Play Console help.
- The arm64 release APK is at most 40 MB and passes the 16 KB alignment check.

## Verification Commands

- `export PATH="$HOME/flutter/bin:$PATH"`
- `bun run games:format -- --check`
- `bun run games:analyze -- --app merge_relay`
- `bun test scripts/games`
- `bun run games:validate -- --strict`
- `bun run check`
- Production AAB/APK builds and `aapt2 dump xmltree` inspection as recorded in the
  "After task 27" section of the release-build README.

## Out of Scope

- Removing the Play Games SDK or any PGS code (owner decision 2026-10-16).
- Enabling PGS, creating the Play Games project, real ids (human, v1.1).
- Filling the Data safety form in Play Console (human; SDK-collected data
  answers must be re-checked in Play Console help first).
- Launching the APK on a device (task 25, human).
- Ludo ad testing (unrelated).

## Commit message

`fix(merge-relay): harden release manifest and align store disclosures with the Play Games SDK [16-games-portfolio-wave2/27]`
