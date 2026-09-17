# Meme Court implementation handoff

This handoff reconciles the current Meme Court source set. The v0.3 PRD and validation reference supersede the twenty-prompt/tile-only smoke scope: the selected-MVP target is a private Court with approximately 100 reviewed prompts, real membership/invitations, genuine pair voting, explicit low-participation/tie results, profiles, web voting entry, share cards, moderation, reporting/blocking, audit and safety switches. The repository proposal is `meme_court` with production technical ID `app.w3dev.memecourt`; external registration, publisher ownership and store reservation remain unresolved.

Source provenance is recorded in [meme-court.json](../sources/meme-court.json), including canonical Drive URLs, revision metadata, retrieval hashes, and the retained archive marker. The source bodies used for this reconciliation were read-only local snapshots; builds and tests do not depend on those snapshots or on Drive access. The source set includes the index, PRD, gameplay, technical, economy/operations, validation/delivery, decisions, Apple iOS, Google Play and the retained v0.1 archive.

## Ownership and boundaries

| Logical owner | Owns | Required handoff contract |
|---|---|---|
| `court-domain` | `apps-native/games/packages/court_rules` | Versioned rounds, phrase IDs, moderation states, seeded pairings, ballots, outcomes and injected clock |
| `court-client` | `apps-native/games/meme_court` | Flutter widgets, sample-versus-real labels, caption flow, voting/results accessibility |
| `court-service` | `/games/meme_court` API integration | Signed app-scoped membership, invite, pair, ballot and private-content authorization |
| `court-safety` | content/review tooling and operations | Reviewed prompt versions, held/pending/approved transitions, report/block, audit and emergency switches |
| `court-release` | app config, Google Play-first Android QA, web entry, share and evidence | Independent version/build, guest browser checks, support ownership and release gates |

The pure rules package cannot depend on Flutter or device SDKs. Client-submitted `staffed`, `approved`, tally, deadline or `app_id` fields are not authorization. Generic API isolation exists under `packages/api/src/games`; Court-specific routes, moderation storage and web voting are not integrated.

## v0.3 selected-MVP correction

Build the broader private-group product within the execution window. The early twenty reviewed prompts and tile-only flow remain a useful P0 fixture. Free text must have distinct pending/held/approved states and stay disabled until a human safety owner and response operation exist. Reviewed AI drafting may be an offline staff tool; live unreviewed generation is not required. No open stranger discovery, cash prizes, purchased votes or generated images.

## Requirement ledger

`yes` means specified in the current source; `partial` means code or a testable slice exists; `no` means no evidence in this worktree. `enabled` is a release gate, not a debug button.

| ID | Stage and requirement | Contract / acceptance test | Owner | Specified | Implemented | Integrated | Verified | Enabled |
|---|---|---|---|---|---|---|---|---|
| MC-01 | P0 sample-versus-real distinction | Sample captions/votes are visible examples; no synthetic player/activity presented as real | `court-client` | yes | partial | partial | partial: widget/domain tests | no |
| MC-02 | P0 curated prompt library | Versioned language/theme/reviewer metadata; banned prompts disable immediately | `court-safety` | yes | partial: prompt fixture | partial | partial: content validation | no |
| MC-03 | P0/P1 membership/invitations | Expired/revoked/removed/blocked users cannot join/fetch; codes resist enumeration | `court-service` | yes | no | no | no | no |
| MC-04 | P0/P1 tile-caption lifecycle | Assemble/edit/freeze/delete states; phrase IDs pass safety; free text remains held until approved | `court-domain` | yes | partial | partial | partial: `court_round_safety_test.dart` | no |
| MC-05 | P0 fair private pair battle | Entire pair containing voter caption is excluded; equal seeded presentation and one ballot | `court-domain` | yes | partial | partial | partial: `court_round_core_test.dart` | no |
| MC-06 | P0/P1 idempotent ballots/finalization | Retries do not multiply counts/trophies; injected authoritative deadlines | `court-domain` | yes | partial | partial | partial: core/safety tests | no |
| MC-07 | P0 honest small-group resolution | One independent valid vote may decide; ties/zero/odd showcase are explicit and never trophy | `court-domain` | yes | partial | partial | partial: core tests | no |
| MC-08 | P1 guest web voting | Crawlers cannot cast/reserve; invalid/replayed tokens cannot add ballots | `court-service` | yes | no | no | no | no |
| MC-09 | P0/P1 reporting/blocking | Report prompt/caption/profile and block interactions; hide immediately for reporter | `court-safety` | yes | no | no | no | no |
| MC-10 | P0/P1 accountable human review | Supervised escalation and P1 review console with owner, audit decisions and appeals | `court-safety` | yes | partial: moderation state model | partial: local state machine only | partial: `court_round_safety_test.dart`; service console, staffing and appeals pending | no |
| MC-11 | P1 100 reviewed seed prompts | 100 approved usable versions; retired items excluded from new rounds | `court-content` | yes | no | no | no | no |
| MC-12 | Deferred bounded AI augmentation | Untrusted output is moderated/reviewed; timeout/rejection returns curated queue | `court-safety` | yes | no | no | no | no |
| MC-13 | P1 consented safe share card | Reviewed content and author permission required; owned page can withdraw | `court-service` | yes | no | no | no | no |
| MC-14 | P1 trophy/profile integrity | Settled results issue once; cosmetics never grant placement/vote privilege | `court-service` | yes | partial: trophy state | no | partial: core tests | no |
| MC-15 | P1 operational safety gating | Disable generation, free text, group creation or discovery independently | `court-safety` | yes | no | no | no | no |
| MC-16 | P0/P1 truthful stage and marketing boundaries | Deferred, synthetic and untested outcomes are not advertised as live | `court-release` | yes | partial: local sample label | partial | partial: widget/content checks | no |

## Current evidence and next tests

The actual local consumers are `apps-native/games/meme_court/lib/meme_court_app.dart`, `apps-native/games/meme_court/assets/content/prompts.json` and `apps-native/games/packages/court_rules`. Domain tests cover pair exclusion in both directions, seeded pairing, held/pending moderation, withdrawal invalidation, tie/insufficient/cancelled/odd-showcase outcomes and idempotent finalization. The current client source adds an authored practice prompt with three safe caption choices, distinct selected phrase IDs for Alice and Bea, actual captions in vote options and the winning result, plus flow-1 legacy-label compatibility and transactional malformed-restore handling. `apps-native/games/meme_court/test/widget_test.dart` has 5 focused widget tests and `flutter analyze` is clean. The local entrypoint now uses `path_provider` application documents with a one-time app-scoped migration from the former temporary root; readback is verified before the legacy save is deleted, and failures preserve the source. Android QA accepted the readable 1080×2400 post-remediation route set on the physical device; current source metadata and the complete route/device/recovery join are recorded in [the visual review](../visual-review) and its durable provenance ledger. Next tests must use real signed app-scoped tokens and Hono requests for invites, private reads, browser tokens, reporting/blocking, moderation audit, share withdrawal and rate limits; no fake users or votes may enter evidence.

## Release and unresolved gates

The effective repository sequence is Google Play and Android first, following user steering on 2026-09-17. This supersedes the source records' Apple-first wording for execution while retaining that wording in the source set. Play readiness means the Android artifact, device evidence, listing, privacy declarations, signing and support gates are prepared; it does not mean registration, submission or publication. Store fields, Play publisher ownership, signing, billing, privacy manifests, track configuration and web deployment remain unresolved. The Court theme price is a hypothesis, not a SKU. UGC moderation staffing, support contact and appeal ownership are unresolved. Android physical UI evidence remains an owner gate for this app; the prior iOS signed/install/play baseline is retained, and further iOS QA is paused until after Google Play publication. Enablement requires accountable safety operations and the service isolation tests; submission, spending and production migrations still require explicit approval.
