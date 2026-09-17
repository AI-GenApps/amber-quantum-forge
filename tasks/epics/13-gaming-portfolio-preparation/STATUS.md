# Epic 13 — Gaming Portfolio Preparation

Status: completed

## Purpose

Prepare one repository for five independently runnable Flutter applications while preserving the existing Expo, SwiftUI, KMP, web, API, database, release, and OTA surfaces.

## Ownership

| Task | Owner | Scope | Status |
|---|---|---|---|
| 00 | Integration lead | Shared Dart contracts and path freeze | [x] |
| 01 | Registry owner | App registry, source links, identity validation | [x] |
| 02 | Tooling owner | Commands, toolchain, Pub workspace, codegen | [x] |
| 03 | Generator owner | Generic sixth-app generator and smoke test | [x] |
| 04 | CI owner | Affected detection and Linux/macOS workflow matrix | [x] |
| 05 | Hygiene owner | Knip analysis and evidence-backed cleanup | [x] |
| 06 | Documentation owner | Audit, architecture, migration, commands, verification, handoff | [x] |
| 07 | Merge Relay owner | Client and `merge_rules` package | [x] |
| 08 | Pocket Biome owner | Client and `biome_rules` package | [x] |
| 09 | Sixty-Second Heist owner | Client and `heist_rules` package | [x] |
| 10 | Meme Court owner | Client and `court_rules` package | [x] |
| 11 | SnapQuest owner | Client, camera capability consumer, and `snapquest_rules` package | [x] |
| 12 | API owner | Per-app authorization, storage, and negative isolation tests | [x] |
| 13 | Visual review owner | Coordinated Android screenshots, play-through and Play-first gates | [x] |
| 14 | Integration lead | Factual records, durable visual evidence, save migration and commit staging plan | [x] |

## Frozen layout

```text
apps-native/games/
  pubspec.yaml
  toolchain.json
  merge_relay/
  pocket_biome/
  sixty_second_heist/
  meme_court/
  snapquest/
  packages/
    platform_core/
    merge_rules/
    biome_rules/
    heist_rules/
    court_rules/
    snapquest_rules/
```

The existing `apps-native/flutter-app` and `plugins/flutter/*` remain independent and are not moved into this workspace.

## Notes

Production bundle/application identifiers are finalized in the registry as `app.w3dev.mergerelay`, `app.w3dev.pocketbiome`, `app.w3dev.sixtysecondheist`, `app.w3dev.memecourt`, and `app.w3dev.snapquest`. Tasks 00–12 are completed preparation foundations, not full MVP or publication gates. Android QA accepted the postmigration readable five-app smoke set on physical `SM-A525F` serial `RZ8R32EAB7T`, Android 14; Tasks 13 and 14 record the completed bounded visual/integration milestone. The 79 full-MVP requirement rows remain open as appropriate. Store registrations, publisher credentials, product identifiers, and release credentials remain explicitly unverified.
