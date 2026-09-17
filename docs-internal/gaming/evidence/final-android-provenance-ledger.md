# Final Android provenance ledger

Generated: 2026-09-17T09:22:27.336Z

This is the authoritative final batch record for the five optimized release-mode debug-ID APKs and production-ID AAB verification. It supersedes older metadata sidecars that reference shared source 424dc4... or 4f43be....

Device: SM-A525F, serial RZ8R32EAB7T, Android 14 (SDK 34). Device inventory: /tmp/amber-android-final-device-inventory.log.
Source commit recorded by the final CLI metadata: 30b3057f166883d65da4107cd9801166d55aab0c. Official shared source hash: 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167. The worktree was dirty because the gaming task files are present in the shared checkout; each app's official app source hash is recorded below.

Build commands:

- APK: `bun scripts/games/cli.ts build --app <app> --platform android --mode release --environment debug`
- AAB: `bun scripts/games/cli.ts build --app <app> --platform android --mode aab --environment production`

| App | Installed debug APK SHA-256 | Production AAB SHA-256 | App source | Shared source | Device join |
|---|---|---|---|---|---|
| Meme Court | c57fce059a9aec3122fe120217b6d2ad87b2baf9784fe02c9cedde262ae02872 | 446949938550456e1cdc1bfd6410346c9cc567b2ff853476a4feee1da89de307 | 12eff4e8c9e5d42925f3809f095464f7785a6831cab4344c560f867bf63d87db | 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167 | SM-A525F/RZ8R32EAB7T/Android 14 |
| Merge Relay | 3c8bb71bde67b602a5bf78fd6546ff4884ea922df3c090a2cb44c7486ceb2956 | 36fe4512e99f741963aae1887a5c5a19b36ce4cc78751ca84099185189fb2f3c | a73f41e13cda0f00a44e8c605a0460b522122eed3e0a0a97a037955698e6a4c4 | 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167 | SM-A525F/RZ8R32EAB7T/Android 14 |
| Pocket Biome | bd517a39269a183a01188b3e2c1c0f4485f9470effe5161b85b466946df033b3 | e5e58484a53a1bf991f69b32946e345f0d19d49e523b35913e09dbee9595216b | dcaffc6ebdd8c566be163e2d4aa66ca47c55dfdd22a307493db8563bc1f80d35 | 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167 | SM-A525F/RZ8R32EAB7T/Android 14 |
| Sixty-Second Heist | 84dcd681a09902dbe587f8e7a5ab885574f7502c9c3767374561bda0a701c1d8 | 75de69e566933ba79c0d6502de2de49e667cb0c964749851a195ed6c9a800b24 | 6037b8df81bfbd116503cf210b0a04b60af1e4dbc1ac45b47dd0c122e6e6152d | 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167 | SM-A525F/RZ8R32EAB7T/Android 14 |
| Peeklings | e11e7f4d2ecc5474b4de0fd25c299e4c3aa1ac2baf42316265b1520f9fcd723a | b68f1d99861e4ef35bc15ed0e10404f02bec5b5a483408a4438345430c915028 | 5c1d5dbfb33781d62f12e4f299c1e43943fc7099c8e1b351a5a39345eda0ae90 | 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167 | SM-A525F/RZ8R32EAB7T/Android 14 |

Each installed APK was pulled from pm path and its SHA-256 equals the final APK output. APK zipalign verification passed. Each production AAB passed jarsigner verification and 16 KiB zipalign verification; its signing subject is the isolated nonpublishable test key and no AAB was uploaded.

## Meme Court

- Debug package: app.w3dev.memecourt.debug; production package in AAB: app.w3dev.memecourt.
- APK: /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge-games/apps-native/games/meme_court/build/app/outputs/flutter-apk/app-release.apk; build log /tmp/amber-android-final-build-meme_court.log; metadata /tmp/amber-android-final-metadata-meme_court.json.
- AAB: /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge-games/apps-native/games/meme_court/build/app/outputs/bundle/release/app-release.aab; build log /tmp/amber-android-final-aab-build-meme_court.log; metadata /tmp/amber-android-final-metadata-meme_court-production.json.
- Official app source hash: 12eff4e8c9e5d42925f3809f095464f7785a6831cab4344c560f867bf63d87db; shared source hash: 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167.
- Tests: 5 Flutter tests passed and dart analyze passed; consolidated log /tmp/amber-android-final-test-analyze.log.
- Artifact join: Gameplay screenshots were captured on the same c57fce... APK bytes; the final rebuild was byte-identical and the final installed pull matches c57fce... .

Screenshots:
  - /tmp/amber-android-court-final-reset-confirmation.png — App bar reset; Start over confirmation is visible; it states the current docket and saved picks will be cleared. SHA-256 7316ba97980117f31bb9b66e4e700d98218b1b92d9aa1008032cecb83d7c44a3 (1080x2400, 134428 bytes).
  - /tmp/amber-android-court-final-selected-both.png — Practice round with both caption cards; Alice's pick and Bea's pick show different selected caption text and Picked state. SHA-256 fa168ae25e9e75001ac134750ac8a1bc5c9874ca070351c1f7ac92579b214370 (1080x2400, 243962 bytes).
  - /tmp/amber-android-court-final-frozen.png — Open the vote; Docket frozen state shows the Open the vote action. SHA-256 4f8901e59074478d66e257319a012768172bfe510233dc945598ee3166cdf91f (1080x2400, 110492 bytes).
  - /tmp/amber-android-court-final-verdict.png — Vote then verdict; Verdict names Alice and displays the winning caption: Midnight snack, daytime confidence. SHA-256 eb28ac1671a2c755a8110438beefffc78518876f9cab614e05cc4a715d089976 (1080x2400, 155560 bytes).
  - /tmp/amber-android-court-final-relaunch.png — Relaunch from verdict; Verdict state and winning caption persist after relaunch. SHA-256 6af424981df71be9a383fd3624d312d743d56c1d780f2b580894ceab86c7ec75 (1080x2400, 158048 bytes).
  - /tmp/amber-android-final-memecourt-relaunch.png — Final APK smoke relaunch; Final release-mode debug-ID APK opens at persisted Verdict ready state. SHA-256 db9ae41d778a81738ba62bcae0886b5ea2ad440f0cccc747464cb9e20598ef83 (1080x2400, 156416 bytes).

## Merge Relay

- Debug package: app.w3dev.mergerelay.debug; production package in AAB: app.w3dev.mergerelay.
- APK: /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge-games/apps-native/games/merge_relay/build/app/outputs/flutter-apk/app-release.apk; build log /tmp/amber-android-final-build-merge_relay.log; metadata /tmp/amber-android-final-metadata-merge_relay.json.
- AAB: /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge-games/apps-native/games/merge_relay/build/app/outputs/bundle/release/app-release.aab; build log /tmp/amber-android-final-aab-build-merge_relay.log; metadata /tmp/amber-android-final-metadata-merge_relay-production.json.
- Official app source hash: a73f41e13cda0f00a44e8c605a0460b522122eed3e0a0a97a037955698e6a4c4; shared source hash: 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167.
- Tests: 5 Flutter tests passed and dart analyze passed; consolidated log /tmp/amber-android-final-test-analyze.log.
- Artifact join: Gameplay screenshots were captured on the same 3c8bb7... APK bytes; the final rebuild was byte-identical and the final installed pull matches 3c8bb7... .

Screenshots:
  - /tmp/amber-android-merge-relay-real-merge.png — Move and merge; A real merge route is visible with score 8 and best tile 4. SHA-256 4e88eb791b951c955afd9d492f19d2ba5dbedd7d7859d01791032f5f2cfbc983 (1080x2400, 132878 bytes).
  - /tmp/amber-android-merge-relay-new-confirmation.png — New round confirmation; Reset/new-round confirmation is visible before data is cleared. SHA-256 f46ebd830577f34ef0819452c8a8a7b4512eabe41ec1c99bf4b19f3c0aa9cc67 (1080x2400, 149931 bytes).
  - /tmp/amber-android-merge-relay-new-round.png — New round; A fresh Round 1 board is shown after the confirmed new round. SHA-256 ba9a11af591f1d2d91905eaf75dfa52c82123d3f69cba16cace2496d34a9ad0a (1080x2400, 129895 bytes).
  - /tmp/amber-android-merge-relay-relaunch.png — Saved board relaunch; The saved board is restored after relaunch. SHA-256 49be2bbaa35fd2c7171e6224c97fbe30d6828e11bdfb4db9296ae6b4b294d98d (1080x2400, 130291 bytes).
  - /tmp/amber-android-final-mergerelay-relaunch.png — Final APK smoke relaunch; Final release-mode debug-ID APK opens at the saved board route. SHA-256 2d50c94e729f7837cabe72142871cb8259afa8b7200ef6f9a289c8504a208d48 (1080x2400, 128744 bytes).

## Pocket Biome

- Debug package: app.w3dev.pocketbiome.debug; production package in AAB: app.w3dev.pocketbiome.
- APK: /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge-games/apps-native/games/pocket_biome/build/app/outputs/flutter-apk/app-release.apk; build log /tmp/amber-android-final-build-pocket_biome.log; metadata /tmp/amber-android-final-metadata-pocket_biome.json.
- AAB: /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge-games/apps-native/games/pocket_biome/build/app/outputs/bundle/release/app-release.aab; build log /tmp/amber-android-final-aab-build-pocket_biome.log; metadata /tmp/amber-android-final-metadata-pocket_biome-production.json.
- Official app source hash: dcaffc6ebdd8c566be163e2d4aa66ca47c55dfdd22a307493db8563bc1f80d35; shared source hash: 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167.
- Tests: 8 Flutter tests passed and dart analyze passed; consolidated log /tmp/amber-android-final-test-analyze.log.
- Artifact join: Gameplay screenshots were captured on the same bd517a... APK bytes; the final rebuild was byte-identical and the final installed pull matches bd517a... .

Screenshots:
  - /tmp/amber-android-pocket-biome-plant.png — Plant; Plant Mossling action is available and a seedling is shown. SHA-256 084635ef0df3c152f84520b16b7880af54a0cccdf8a286d545bd3432f34f80e3 (1080x2400, 161071 bytes).
  - /tmp/amber-android-pocket-biome-inspect-ready.png — Inspect; The selected pot is inspectable and its growth route is visible. SHA-256 fb187d51d91fbb5d39ed486010753081fd3bd6b4e86f8923d81a8dd9f59c5345 (1080x2400, 158914 bytes).
  - /tmp/amber-android-pocket-biome-harvest.png — Harvest; Harvest completes and the album shows Mossling. SHA-256 6c9a8132e6dd777fd3a503ff99fccea8ab377c352916251bc14159111068f39f (1080x2400, 153738 bytes).
  - /tmp/amber-android-pocket-biome-lifecycle-growing.png — Lifecycle relaunch; A growing lifecycle state is retained after relaunch. SHA-256 e52f0475919b78d97fac0f98cb3e0872368ba270a50a9f211f23370e6c39b6b8 (1080x2400, 160528 bytes).
  - /tmp/amber-android-pocket-biome-relaunch.png — Saved album relaunch; Album and retained pot state are visible after relaunch. SHA-256 58c76eb9d2912ae0b094e903bb6ca4ad8c67c76962063003204abf6bbbfcdba7 (1080x2400, 152894 bytes).
  - /tmp/amber-android-final-pocketbiome-relaunch.png — Final APK smoke relaunch; Final release-mode debug-ID APK opens with album 1, compost 6, and Mossling ready. SHA-256 d3c8c3afd79bf0ab3945b0121ca5a91ef8f6517961b595969750a2dc85398ccf (1080x2400, 159155 bytes).

## Sixty-Second Heist

- Debug package: app.w3dev.sixtysecondheist.debug; production package in AAB: app.w3dev.sixtysecondheist.
- APK: /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge-games/apps-native/games/sixty_second_heist/build/app/outputs/flutter-apk/app-release.apk; build log /tmp/amber-android-final-build-sixty_second_heist.log; metadata /tmp/amber-android-final-metadata-sixty_second_heist.json.
- AAB: /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge-games/apps-native/games/sixty_second_heist/build/app/outputs/bundle/release/app-release.aab; build log /tmp/amber-android-final-aab-build-sixty_second_heist.log; metadata /tmp/amber-android-final-metadata-sixty_second_heist-production.json.
- Official app source hash: 6037b8df81bfbd116503cf210b0a04b60af1e4dbc1ac45b47dd0c122e6e6152d; shared source hash: 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167.
- Tests: 8 Flutter tests passed and dart analyze passed; consolidated log /tmp/amber-android-final-test-analyze.log.
- Artifact join: Gameplay screenshots were captured on the same 84dcd6... APK bytes; the final rebuild was byte-identical and the final installed pull matches 84dcd6... .

Screenshots:
  - /tmp/amber-android-heist-draft-relaunch.png — Draft relaunch; Draft route and planned controls are restored after relaunch. SHA-256 cb1dfbbe2072e060a5bcd1622ed037e7664a8dafbaaf3aa4b5f95bdec0e7d12d (1080x2400, 166901 bytes).
  - /tmp/amber-android-heist-success.png — Successful escape; Escaped state shows route 2, path 3, loot YES, and the right/right plan. SHA-256 21f04ede7a6bbb0cbc5f2e84243d3365deada90836d31c1569aefe629f6bf58d (1080x2400, 146150 bytes).
  - /tmp/amber-android-heist-success-relaunch.png — Success relaunch; Escaped state persists after relaunch. SHA-256 18bb8d77fa08a668e5c8ff5e84814316ced20561f39f12b6fad03803f1068736 (1080x2400, 146170 bytes).
  - /tmp/amber-android-final-heist-relaunch.png — Final APK smoke relaunch; Final release-mode debug-ID APK opens at Escaped with route 2, path 3, loot YES. SHA-256 cba02ee0dfcc5213c3278a4e55e1d61f9133081d21c3fefd6307a477645e38da (1080x2400, 145287 bytes).

## Peeklings

- Debug package: app.w3dev.snapquest.debug; production package in AAB: app.w3dev.snapquest.
- APK: /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge-games/apps-native/games/snapquest/build/app/outputs/flutter-apk/app-release.apk; build log /tmp/amber-android-final-build-snapquest.log; metadata /tmp/amber-android-final-metadata-snapquest.json.
- AAB: /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge-games/apps-native/games/snapquest/build/app/outputs/bundle/release/app-release.aab; build log /tmp/amber-android-final-aab-build-snapquest.log; metadata /tmp/amber-android-final-metadata-snapquest-production.json.
- Official app source hash: 5c1d5dbfb33781d62f12e4f299c1e43943fc7099c8e1b351a5a39345eda0ae90; shared source hash: 023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167.
- Tests: 19 Flutter tests passed and dart analyze passed; consolidated log /tmp/amber-android-final-test-analyze.log.
- Artifact join: Primary and relaunch screenshots were captured after the final e11e7f... APK was installed. The controlled in-app Clear local album confirmation was used to exercise the primary route, then both hunts were completed and the collection was restored before relaunch.

Screenshots:
  - /tmp/amber-android-final-snapquest-reset-confirmation.png — Clear local album confirmation; Destructive local reset requires confirmation; the dialog states it clears the local collection. SHA-256 0842cd8c8620249f296208dd13734c1b756825e35f73e043f24cbe02137b14bd (1080x2400, 137949 bytes).
  - /tmp/amber-android-final-snapquest-primary-start.png — Primary desk hunt start; 0 hunts complete; red target Emberling and red, blue, and gold desk objects are visible. SHA-256 a37e21bdc21726c4e6d5306f874b87e0fb70c09c8faf495462589efeceba1d8b (1080x2400, 165839 bytes).
  - /tmp/amber-android-final-snapquest-primary-wrong.png — Wrong desk choice; Blue shell missed message identifies the red target and leaves the hunt available. SHA-256 0cd023fdedb78ce7130933905ec7ef289c3dbf6060357b71a357f0776cd5194e (1080x2400, 167994 bytes).
  - /tmp/amber-android-final-snapquest-primary-first-success.png — First correct choice; Emberling joins the album and the second blue target hunt appears. SHA-256 5b2b9aa0ecb39ab2d5a3c02b30efc8505c0a580c0773798d6340183fa9722f84 (1080x2400, 181198 bytes).
  - /tmp/amber-android-final-snapquest-primary-complete.png — Second correct choice and album; Azurling joins; 2 hunts complete, 2 in album, and distinct Emberling/Azurling art is shown. SHA-256 6d58f6fd6530350fb6208119956ea3a69a5ecaf70c668695c89368d1648900e8 (1080x2400, 140793 bytes).
  - /tmp/amber-android-final-snapquest-primary-relaunch.png — Primary route relaunch; Your collection is back after relaunch with both creatures retained. SHA-256 b1deb80542fc20100672bc0faf3a654883c54ef82e5c0dfbf4fd65f8f873c37a (1080x2400, 140737 bytes).

- Camera boundary: Camera recognition remains unvalidated. No raw frames or photo archive are included; the prior camera metadata evidence is separate from this final desk-hunt artifact join.

## Read-only AAB manifest inspection

The first manifest-summary helper looked for `/AndroidManifest.xml` at the AAB root and recorded `NoSuchFileException: /AndroidManifest.xml`. A read-only inspection of the same frozen AAB bytes extracted `base/manifest/AndroidManifest.xml` and decoded it with Android SDK `aapt2`; no AAB was rebuilt, modified, installed or re-signed. All five production manifests report version `0.1.0`/code `1`, minimum SDK `24` and target SDK `36`: Meme Court `app.w3dev.memecourt`, Merge Relay `app.w3dev.mergerelay`, Pocket Biome `app.w3dev.pocketbiome`, Sixty-Second Heist `app.w3dev.sixtysecondheist`, and Peeklings `app.w3dev.snapquest`. The helper error is retained as historical tooling output; the manifest package/version/SDK inspection is now verified.

## Explicitly not run or not claimed

- Google Play publication/upload was not run.
- Production-ID AABs were not installed on the device; only the release-mode debug-ID APKs were installed over the existing packages.
- SnapQuest camera recognition remains unvalidated (descriptorId: null); no recognition pass is claimed.
- No iOS or simulator/emulator QA is included.
