# Gaming requirements reconciliation

This record is the durable cross-app reconciliation for the five current source sets. The complete 79-ID ledger is in the linked handoffs: MR-01–MR-15 (15), PB-01–PB-16 (16), SH-01–SH-16 (16), MC-01–MC-16 (16), and SQ-01–SQ-16 (16). Each row reports specified, implemented, integrated, verified, and enabled independently.

## Authority and refresh rule

The execution playbook establishes repository and safety rules. The current app index establishes source navigation and precedence. For each app, the v0.3 PRD and v0.3 validation/delivery record own selected scope and delivery acceptance; detailed gameplay, technical, economy, decision, Apple, and Google records remain authoritative for unchanged rules and platform constraints. Retained v0.1 material is historical context. A newer approved revision supersedes the current record and must update the relevant source JSON and handoff before code changes.

The effective release sequence is Google Play and Android first, following user steering on 2026-09-17. This execution decision supersedes Apple-first wording in the retained platform records while preserving those records as source history. Play readiness is preparation evidence for artifacts, permissions, listings, privacy, signing, device QA and support; it is not store registration, submission or publication. Further iOS QA is paused until after Google Play publication; the retained five-app signed/install/play baseline remains historical evidence.

The source manifests contain exact canonical Drive URLs, record IDs, source versions, Drive modification timestamps, retrieval timestamps, SHA-256 values, and revision checks:

- [Merge Relay sources](sources/merge-relay.json): v0.3 PRD/delivery authority; the older 20-tile fixture is an early checkpoint.
- [Pocket Biome sources](sources/pocket-biome.json): v0.3 PRD/delivery authority; the six-species fixture and old twelve-species description are early material.
- [Sixty-Second Heist sources](sources/sixty-second-heist.json): v0.3 PRD/delivery authority; the old twelve/thirty level limits are historical checkpoints.
- [Meme Court sources](sources/meme-court.json): v0.3 PRD/delivery authority; the old twenty-prompt tile fixture is an early checkpoint.
- [SnapQuest sources](sources/snapquest.json): v0.3 PRD/delivery authority; the stable internal product remains SnapQuest while the public-title candidate is Peeklings.

Refresh by listing Drive revisions for the current authority records, selecting the latest approved revision, fetching every linked source record, hashing the retrieved body, and updating the affected manifest and handoff. The repository build never reads Drive or a temporary snapshot.

## Effective v0.3 scope decisions

| App | Effective current scope | Historical material kept as context | Owner handoff |
|---|---|---|---|
| Merge Relay | Complete rescue/daily/endless, replay, invite/attempt/return relay, recovery, progression, telemetry, remote configuration, and sandbox commerce candidate | Local two-device/twenty-tile fixture | [Merge ledger](handoffs/merge-relay.md) |
| Pocket Biome | Approximately 30 authored species, three trait axes, six behaviors, decoration, recovery, read-only visits, gifting/crossbreeding invitations, sharing, reminders, and sandbox commerce candidate | Six-species fixture, old twelve-species/three-behavior limits | [Pocket ledger](handoffs/pocket-biome.md) |
| Sixty-Second Heist | Approximately 80 reviewed levels, six obstacles, three tools, constrained editor, proof/validation, immutable versions, challenges, attack/defense replay, timed option, progression, and daily operations | Twelve-puzzle/thirty-level checkpoint language | [Heist ledger](handoffs/sixty-second-heist.md) |
| Meme Court | Approximately 100 reviewed prompts, real private membership/invites, pair voting, low-participation/tie handling, web voting, reporting/blocking, moderation states and reviewer operations | Twenty-prompt/tile-only smoke fixture; live AI generation remains excluded | [Court ledger](handoffs/meme-court.md) |
| SnapQuest / Peeklings | Approximately 20 safe descriptor candidates, 30 authored creatures, real local camera validation, equal desk fallback, daily hunts, album/rewards, challenges, sharing, telemetry and controls | Five-color/five-creature fixture and old ten-descriptor/twelve-creature limits; optional AR remains outside base release | [SnapQuest ledger](handoffs/snapquest.md) |

The current ledgers preserve the source requirement IDs. Where a detailed v0.2 row said `Deferred` but the v0.3 PRD/delivery record restores it, the handoff uses its effective P0/P1 stage and states the old stage only in historical prose. This applies to Pocket exchange work, Heist editor/published challenge work, Court moderation-backed work, and SnapQuest catalogue targets. Features that the current authority still excludes or gates remain separately labelled, such as Pocket photo-to-trait experiment, Court live AI augmentation, and SnapQuest AR.

## Contracts and implementation evidence

Pure packages are `merge_rules`, `biome_rules`, `heist_rules`, `court_rules`, and `snapquest_rules`; they have no Flutter, Flame, camera, or device SDK imports. `platform_core` supplies injected clocks, bounded deterministic randomness, save envelopes, migration/checksum validation, redacted telemetry, and app/environment identity. Merge Relay, Pocket Biome, and Sixty-Second Heist are real shared consumers; Meme Court and SnapQuest consume only their game rules plus app-specific client capabilities.

The implemented game API boundary is mounted at `/games` from `packages/api/src/index.ts`. `packages/api/src/games` owns signed issuer/audience/app/environment/subject/expiry/role validation, bounded JSON bodies, owner/member/admin resource checks, collision-proof app/user/save keys, optimistic saves, snapshot scope binding, atomic file persistence, and production fail-closed behavior. Its 18 focused tests cover forged tokens, cross-app and cross-environment tokens, client scope spoofing, legacy admin tokens, private challenge access, server-writable purchases, malformed snapshots, write rollback, and body limits. It does not claim game-specific multiplayer or production persistence integration.

SnapQuest is the sole camera consumer. Its `camera 0.12.1` dependency and camera permission are app-local; `enable-swift-package-manager: false` keeps the current iOS plugin integration on CocoaPods. All five iOS projects target 15.0; SnapQuest's Android project sets minSdk 24, while the other Android projects use the Flutter project floor. These native settings are checked by the generated-project and build validations and remain separate from external store registration.

The implementation and verification states are intentionally conservative. A passing foundation test proves its named contract only. Physical camera recognition, held-out descriptor quality, signed device installs, store registration, distribution signing, service MVPs, content quantities, moderation staffing, and market evidence remain unverified until their owners provide the required evidence.
