---
epic: 13-gaming-portfolio-preparation
task: 09-sixty-second-heist
status: completed
commit_scope: gaming
depends_on: [00-shared-contracts, 01-registry, 02-tooling]
estimate: L
---

# Sixty-Second Heist foundation and Play readiness

## Implementation Checklist

- [x] Keep the editor/client and `heist_rules` package independent from the other games.
- [x] Add bounded route, solver, collision, timer, replay and versioned save contracts.
- [x] Add the playable local route/editor path with recovery and accessible cell controls.
- [x] Record the complete v0.3 requirement ledger in [the handoff](../../../docs-internal/gaming/handoffs/sixty-second-heist).
- [x] Separate preparation evidence from the full MVP requirements SH-04–SH-15.

## Verification

- `bun run games:analyze -- --app sixty_second_heist`
- `bun run games:test -- --app sixty_second_heist`
- `bun run games:validate:strict`

## Acceptance

The repository foundation is implemented and has a real client consumer. The current bounded cleanup, ordered-persistence, responsive-controls and game-copy refinement passes 8 final scoped checks and analysis; Android QA accepted the postmigration readable final smoke relaunch on the physical device. The full creator, service, discovery, moderation, content, commerce and operational MVP remains assigned by SH-04–SH-15. Google Play/Android is the effective sequence; artifact, physical-device, listing, signing, privacy and support gates must be evidenced before any publication request, and further iOS QA is paused until after Google Play publication.
