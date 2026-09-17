---
epic: 13-gaming-portfolio-preparation
task: 10-meme-court
status: completed
commit_scope: gaming
depends_on: [00-shared-contracts, 01-registry, 02-tooling]
estimate: L
---

# Meme Court foundation and Play readiness

## Implementation Checklist

- [x] Keep the widget client and `court_rules` package independent from the other games.
- [x] Add versioned round, moderation, seeded pairing, ballot and outcome contracts with safety checks.
- [x] Add a labelled local sample flow through submissions, freeze, voting and verdict, with local resume.
- [x] Record the complete v0.3 requirement ledger in [the handoff](../../../docs-internal/gaming/handoffs/meme-court).
- [x] Separate preparation evidence from the full MVP requirements MC-03, MC-08–MC-15.

## Verification

- `bun run games:analyze -- --app meme_court`
- `bun run games:test -- --app meme_court`
- `bun run games:validate:strict`

## Acceptance

The repository foundation is implemented and the widget suite exercises actual round transitions. The current bounded client remediation adds authored caption choices, selected-state feedback, persisted phrase IDs, actual vote/result captions and malformed-restore rollback; 5 focused widget tests and `flutter analyze` pass. The local entrypoint now uses a `path_provider` application-documents save with a one-time app-scoped migration from the former temporary root; destination readback is verified before the legacy save is deleted, and migration failures preserve the source. Android QA accepted the readable 1080×2400 post-remediation route set on the physical device, with current source and route/device/recovery metadata in the visual review and durable provenance ledger. The full membership, web voting, moderation operations, reviewed content, share, service and commerce MVP remains assigned by MC-03 and MC-08–MC-15. Google Play/Android is the effective sequence; artifact, physical-device, listing, signing, privacy and safety-support gates must be evidenced before any publication request, and further iOS QA is paused until after Google Play publication.
