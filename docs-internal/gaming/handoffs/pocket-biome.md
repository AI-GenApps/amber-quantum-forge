# Pocket Biome implementation handoff

This handoff reconciles the current Pocket Biome source set. The v0.3 PRD and validation reference supersede the smaller v0.2 quantity limits: the selected-MVP target is approximately 30 authored species and six authored behaviors. The economy reference body still contains the earlier twelve-species/three-behavior wording; that is a resolved precedence issue, not an unresolved requirement. The repository proposal is `pocket_biome` with production technical ID `app.w3dev.pocketbiome`; external registration, publisher ownership and store reservation remain unresolved.

Source provenance is recorded in [pocket-biome.json](../sources/pocket-biome.json), including canonical Drive URLs, revision metadata, retrieval hashes, and the retained archive marker. The source bodies used for this reconciliation were read-only local snapshots; builds and tests do not depend on those snapshots or on Drive access. The source set includes the index, PRD, gameplay, technical, economy/operations, validation/delivery, decisions, Apple iOS, Google Play and the retained v0.1 archive.

## Ownership and boundaries

| Logical owner | Owns | Required handoff contract |
|---|---|---|
| `biome-domain` | `apps-native/games/packages/biome_rules` | Versioned species/recipe graph, elapsed settlement, inventory grants and migrations |
| `biome-client` | `apps-native/games/pocket_biome` | Flutter/Flame habitat, planting/water/decoration, accessibility and recovery UI |
| `biome-service` | `/games/pocket_biome` API integration | App-scoped ledger, read-only visits, invitation membership and idempotent settlement |
| `biome-content` | `apps-native/games/pocket_biome/content` and validators | Species, recipes, behaviors, art fallback, reachability and review records |
| `biome-release` | app config, Google Play-first Android QA, reminders, sandbox commerce and evidence | Independent version/build, consent, device evidence and feature gates |

`biome_rules` stays pure Dart and cannot depend on Flutter, Flame or device SDKs. Growth uses an injected clock; server settlement must not trust client time or arbitrary currency. Generic app isolation exists under `packages/api/src/games`; Pocket-specific routes, ledger schemas and generated DTOs are not integrated.

## v0.3 selected-MVP correction

Build the complete collection/breeding experience in one habitat: approximately 30 authored species, three trait axes, six behaviors, elapsed growth, decoration, durable inventory/recovery, read-only visits, gifting and crossbreeding invitations, sharing, optional reminders, analytics and sandbox-tested cosmetic commerce. The six-species fixture and earlier twelve-species listing are early checkpoints. Photo-to-trait remains an optional disabled experiment and cannot become a dependency of manual play. No plant death for absence, paid dominant genetics, mandatory camera or public photo feed.

## Requirement ledger

`yes` means specified in the current source; `partial` means code or a testable slice exists; `no` means no evidence in this worktree. `enabled` is a release gate, not a debug button.

| ID | Stage and requirement | Contract / acceptance test | Owner | Specified | Implemented | Integrated | Verified | Enabled |
|---|---|---|---|---|---|---|---|---|
| PB-01 | P0 immediate plant/water/growth onboarding | First plant grows without account, camera, payment or notification consent | `biome-client` | yes | partial | partial | partial: widget and biome tests | no |
| PB-02 | P0 elapsed-time growth | Reopen/timezone/clock changes cannot repeat harvest, create negative timers or lose specimens | `biome-domain` | yes | partial | partial | partial: `biome_rules_test.dart` | no |
| PB-03 | P0 three-axis breeding system | Outputs stay in approved species/trait catalogue; preview and committed recipe versions agree | `biome-domain` | yes | partial | partial | partial: `biome_rules_test.dart` | no |
| PB-04 | P0 persistent decoration | Restart preserves slots; invalid overlap cannot corrupt habitat; reduced motion works | `biome-client` | yes | partial: save hydration only | partial: local client save composition | partial: `pocket_biome/test/widget_test.dart` restart/corruption tests; decoration pending | no |
| PB-05 | P1 authoritative inventory/ledger | Harvest/gift/purchase/breed settle once; device conflicts are explicit | `biome-service` | yes | no | no | no | no |
| PB-06 | P1 read-only friend visits | Visitor cannot mutate habitat or inspect private inventory; revoked links fail | `biome-service` | yes | no | no | no | no |
| PB-07 | P1 gift and crossbreed invitation flow | Server eligibility and one-time acceptance prevent duplicate/destroyed items | `biome-service` | yes | no | no | no | no |
| PB-08 | P1 growth share artifact | Still/time-lapse derives from saved state; failure falls back; no source photo | `biome-client` | yes | no | no | no | no |
| PB-09 | P1 authored species catalogue; v0.3 target is ~30 | Unique IDs, recipes, fallback art and reachable progression; v0.3 count governs | `biome-content` | yes | partial: fixture only | partial | partial: manifest validation | no |
| PB-10 | P1 six authored behaviors; v0.3 target is six | Idle/grow/harvest reactions and reduced motion; v0.3 count governs | `biome-client` | yes | partial: fixture only | partial: content manifest is wired | partial: `apps-native/games/pocket_biome/lib/src/biome_content.dart`, content validation; behavior matrix pending | no |
| PB-11 | Deferred optional photo-to-trait | Denied/unsupported/offline/model errors reach identical manual traits; output cannot alter economy | `biome-client` | yes | no | no | no | no |
| PB-12 | Deferred one simple event | Versioned start/end/eligibility; optional join; no permanent specimen loss | `biome-service` | yes | no | no | no | no |
| PB-13 | P1 optional reminders | Only opt-in; growth changes/cancellation update reminders; refusal does not alter yield | `biome-release` | yes | no | no | no | no |
| PB-14 | P1 cosmetic commerce | Cosmetics cannot change breeding; restore/refund/duplicate callbacks reconcile | `biome-release` | yes | no | no | no | no |
| PB-15 | P1 recovery and observability | Settlement, storage, downloads and network interruptions have recoverable diagnostic states | `biome-service` | yes | no | no | no | no |
| PB-16 | P0/P1 audience-led staged release | Prototype, listing and deferred scope are distinct in UI, tests and marketing | `biome-release` | yes | partial: config labels | partial | partial: registry/content validation | no |

## Current evidence and next tests

Current consumers are `apps-native/games/pocket_biome/lib/src/pocket_biome_app.dart` and `apps-native/games/packages/biome_rules`; the save adapter is local only. The focused client suite now covers accessible per-pot inspection, restart/corrupt-save recovery, bounded settlement writes/telemetry, lifecycle pause/resume, save failure and disposal during a pending restore. The current worktree adds lifecycle-gated trusted settlement, idempotent Flame cleanup, async guards and concise game-native copy; its eight focused widget tests and focused analysis pass. Android QA accepted the postmigration 1080×2400 final route set on the recorded physical device; the unchanged APK hash reflects unused/tree-shaken migration code. Add migration fixtures, clock rollback, duplicate settlement and interrupted-write tests before claiming PB-02/PB-05. The next integration slice needs a server-owned ledger, read-only visitor authorization, invitation expiry, content reachability for the v0.3 catalogue, reduced-motion snapshots, opt-in reminder cancellation and sandbox receipt reconciliation. No camera plugin is required for base play.

## Release and unresolved gates

The effective repository sequence is Google Play and Android first, following user steering on 2026-09-17. This supersedes the source records' Apple-first wording for execution while retaining that wording in the source set. Play readiness means the Android artifact, device evidence, listing, privacy declarations, signing and support gates are prepared; it does not mean registration, submission or publication. Store fields, Play publisher ownership, minimum OS/device matrix, signing, billing, privacy manifests and track configuration are unconfigured. Prices and rewarded-offer limits are hypotheses, not live commerce. Android physical QA and content review remain owner gates; the prior iOS signed/install/play baseline is retained, and further iOS QA is paused until after Google Play publication. No external demand evidence is present. Enablement requires the ledger/access/recovery tests and an accountable support owner; submission, spending and production migrations still require explicit approval.
