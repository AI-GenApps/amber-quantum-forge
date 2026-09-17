# Sixty-Second Heist implementation handoff

This handoff reconciles the current Sixty-Second Heist source set. The v0.3 PRD and validation reference supersede the older twelve-puzzle and thirty-level limits: the selected-MVP target is approximately 80 reviewed levels, six obstacles and three deterministic tools. The repository proposal is `sixty_second_heist` with production technical ID `app.w3dev.sixtysecondheist`; external registration, publisher ownership and store reservation remain unresolved.

Source provenance is recorded in [sixty-second-heist.json](../sources/sixty-second-heist.json), including canonical Drive URLs, revision metadata, retrieval hashes, and the retained archive marker. The source bodies used for this reconciliation were read-only local snapshots; builds and tests do not depend on those snapshots or on Drive access. The source set includes the index, PRD, gameplay, technical, economy/operations, validation/delivery, decisions, Apple iOS, Google Play and the retained v0.1 archive. The canonical index ID is the successful source record `1-_MqNs9Ul080QmH05rHsLORSGRq83F9J`.

## Ownership and boundaries

| Logical owner | Owns | Required handoff contract |
|---|---|---|
| `heist-domain` | `apps-native/games/packages/heist_rules` | Fixed-tick vault state, route legality, tools, hazards and deterministic event trace |
| `heist-client` | `apps-native/games/sixty_second_heist` | Flutter/Flame route editor, accessible cell-step controls, execution/replay and recovery UI |
| `heist-service` | `/games/sixty_second_heist` API integration | Bounded validator, reservation, immutable published versions, challenge attempts and reward ledger |
| `heist-content` | `apps-native/games/sixty_second_heist/content` and validators | Reviewed levels, goals, solver fixtures, obstacles/tools and daily manifest |
| `heist-release` | app config, Google Play-first Android QA, timed-mode and sandbox commerce evidence | Independent version/build, feature gates, device evidence and support handoff |

`heist_rules` is pure Dart and the renderer cannot decide detection. The service must recompute bounded traces and must not trust client timing, route validity or `app_id`. Generic app isolation exists under `packages/api/src/games`; Heist-specific routes, persistence and generated DTOs are not integrated.

## v0.3 selected-MVP correction

The target is a complete authored campaign of approximately 80 reviewed levels with six obstacles and three deterministic tools, route editing/accessibility, clear failure replay, optional timed mode, progression and daily heists. Build the constrained vault editor, solver proof, bounded server validation, immutable published versions, friend challenges and attack/defense replays during this run. Twelve puzzles and the earlier thirty-level listing are checkpoints. No unrestricted procedural generation, synchronous multiplayer, paid competitive loadout or destructive raid loss.

## Requirement ledger

`yes` means specified in the current source; `partial` means code or a testable slice exists; `no` means no evidence in this worktree. `enabled` is a release gate, not a debug button.

| ID | Stage and requirement | Contract / acceptance test | Owner | Specified | Implemented | Integrated | Verified | Enabled |
|---|---|---|---|---|---|---|---|---|
| SH-01 | P0 route editing and legal-path feedback | Drag and cell-step controls agree; invalid intersections/doors explain why | `heist-client` | yes | partial | partial | partial: widget/heist tests | no |
| SH-02 | P0 deterministic execution | Same vault/rules/seed/route/loadout yields identical traces on client and server | `heist-domain` | yes | partial | partial | partial: `heist_rules_test.dart` | no |
| SH-03 | P0 failure explanation and free retry | Authored failure maps to visible tick/obstacle reason; retry is free | `heist-client` | yes | partial | partial | partial: widget/heist tests | no |
| SH-04 | P1 six obstacles and three tools | Timing/conflict rules, tutorial fixtures and simultaneous-effect regressions | `heist-content` | yes | partial: small fixture | partial | partial: `heist_rules_test.dart` | no |
| SH-05 | P1 constrained editor | Invalid/over-budget placement is blocked without losing draft | `heist-client` | yes | no | no | no | no |
| SH-06 | P1 creator proof and validation | Publish requires accepted successful replay; retries cannot duplicate versions | `heist-service` | yes | no | no | no | no |
| SH-07 | P1 immutable player-vault challenges | Draft changes never alter published challenge/replay; withdrawals are safe | `heist-service` | yes | no | no | no | no |
| SH-08 | P1 deterministic attack and defense replay | Accepted local/online attempt replays and grants nothing; defense uses the validated builder | `heist-domain` | yes | partial: local replay | partial | partial: `heist_rules_test.dart` | no |
| SH-09 | P1 fair loadouts and no destructive raids | Same authored tools for challengers; future raids never remove inventory | `heist-service` | yes | no | no | no | no |
| SH-10 | P1 authored campaign levels; v0.3 target is ~80 | Manifest, goals, known solution and human review for v0.3 catalogue | `heist-content` | yes | partial: fixture only | partial | partial: content validation | no |
| SH-11 | P1 daily authored challenge/event | Freeze level/version/loadout; no unreviewed generated content | `heist-content` | yes | no | no | no | no |
| SH-12 | P1 timed and untimed modes | Timer/interruption/accessibility disclosed; fairness histories never mix | `heist-client` | yes | partial: mode fixture | partial: local route simulation | partial: `heist_rules_test.dart` bounded timing fixtures; UI mode separation pending | no |
| SH-13 | P1 economy and entitlements | Results/ad/receipt callbacks are idempotent; cosmetics cannot change visibility/collision | `heist-release` | yes | no | no | no | no |
| SH-14 | P1 recovery and abuse control | Timeouts, malformed routes, stale versions and replay floods fail with bounded work | `heist-service` | yes | no | no | no | no |
| SH-15 | P1 feature rollback | Daily/ranked/builder switches disable independently without corrupting campaigns | `heist-service` | yes | no | no | no | no |
| SH-16 | P0/P1 truthful stage and marketing boundaries | No deferred feature or untested outcome is advertised as live | `heist-release` | yes | partial: config labels | partial | partial: registry/content validation | no |

## Current evidence and next tests

Current consumers are `apps-native/games/sixty_second_heist/lib/src/heist_app.dart` and `apps-native/games/packages/heist_rules`; the save adapter is local only. The focused client suite now covers draft restore/reset ordering, future/corrupt-save recovery, save failure, disposal during a pending restore and compact 320/360dp controls under large text. The current worktree adds idempotent Flame cleanup, ordered writes, responsive controls and concise game-native copy; its eight final scoped checks and focused analysis pass. Android QA accepted the postmigration 1080×2400 final route set on the recorded physical device; the unchanged APK hash reflects unused/tree-shaken migration code. Add cross-runtime trace fixtures, route editor accessibility tests, solver proof/immutable version tests, reservation expiry, malformed trace limits, daily freeze, mode separation and reward idempotency. No public discovery, creator moderation, server persistence or demand evidence is present.

## Release and unresolved gates

The effective repository sequence is Google Play and Android first, following user steering on 2026-09-17. This supersedes the source records' Apple-first wording for execution while retaining that wording in the source set. Play readiness means the Android artifact, device evidence, listing, privacy declarations, signing and support gates are prepared; it does not mean registration, submission or publication. Store fields, Play publisher ownership, minimum OS/device matrix, signing, billing, privacy manifests and track configuration are unconfigured. A visual pack and ad limits are hypotheses, not live commerce. Camera, location, microphone and AI permissions are unnecessary. Android physical QA is the current owner gate; the prior iOS signed/install/play baseline is retained, and further iOS QA is paused until after Google Play publication. Enablement requires bounded validation, content review, recovery and support ownership; submission, spending and production migrations still require explicit approval.
