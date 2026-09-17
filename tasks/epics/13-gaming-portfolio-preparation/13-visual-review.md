---
epic: 13-gaming-portfolio-preparation
task: 13-visual-review
status: completed
commit_scope: gaming
depends_on: [07-merge-relay, 08-pocket-biome, 09-sixty-second-heist, 10-meme-court, 11-snapquest]
estimate: M
---

# Five-app visual and physical-play review

## Implementation Checklist

- [x] Capture app-only before and after screenshots for all five apps on the coordinated Android device, retaining at least 720px width or reasonable original dimensions and losslessly optimizing without changing visible content.
- [x] Play the primary local flow for every app and record the exact device/build/source revision and route in [the visual review](../../../docs-internal/gaming/visual-review).
- [x] Review touch targets, typography, contrast, loading/error/recovery states and default icons against each source direction.
- [x] Review primary game-screen copy for concise game-native language, record one representative before/after wording row per app, and keep implementation/status explanations in docs or secondary help.
- [x] Record Play-first Android blockers separately from full-MVP requirements and avoid marking camera recognition or store publication enabled without evidence.
- [x] Keep previous iOS baseline evidence as history while pausing further iOS QA until after Google Play publication.

## Verification

- `bun run games:build -- --app <id> --platform android --mode release --environment debug`
- `bun run games:run -- --app <id> --device-id <physical-id>`
- `bun run games:validate:strict`
- `bun run check:doc-paths`

## Current evidence

Readable 1080×2400 app-only Android final smoke and route captures are preserved in the [visual review](../../../docs-internal/gaming/visual-review) for all five apps, with additional SnapQuest camera and recovery captures. Android QA accepted the postmigration five-app smoke set on physical `SM-A525F` serial `RZ8R32EAB7T`, Android 14. The visual ledger records each screenshot hash, final APK/AAB hash, production artifact ID, source/content/rules metadata, route state and recovery/error context. The final production metadata batch uses commit `30b3057f166883d65da4107cd9801166d55aab0c` and shared source `023c03ee010ad5b449024de3bdeec81157dd0b64dc5be56a36b94ae20cced167` for all five apps; unchanged first-three APK hashes reflect unused/tree-shaken migration code and do not indicate stale builds. Historical 243×540 before/after pairs remain context, while the readable final captures are the current visual evidence.

## Acceptance

The task is complete for the bounded physical visual milestone: every app has a durable postmigration before/after screenshot link and an actual-play record with exact device, build, source revision, relaunch route, recovery/error context and permission/fallback metadata. This does not close the Play gate or any MVP ledger. A compiling scaffold, widget test or Android APK alone cannot mark a game published.
