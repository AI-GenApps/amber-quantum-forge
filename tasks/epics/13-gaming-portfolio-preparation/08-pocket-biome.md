---
epic: 13-gaming-portfolio-preparation
task: 08-pocket-biome
status: completed
commit_scope: gaming
depends_on: [00-shared-contracts, 01-registry, 02-tooling]
estimate: L
---

# Pocket Biome foundation and Play readiness

## Implementation Checklist

- [x] Keep the habitat client and `biome_rules` package independent from the other games.
- [x] Add versioned specimen, growth, genetics, save and deterministic replay contracts.
- [x] Add the playable local habitat path, recovery UI and accessibility composition.
- [x] Record the complete v0.3 requirement ledger in [the handoff](../../../docs-internal/gaming/handoffs/pocket-biome).
- [x] Separate preparation evidence from the full MVP requirements PB-02–PB-15.

## Verification

- `bun run games:analyze -- --app pocket_biome`
- `bun run games:test -- --app pocket_biome`
- `bun run games:validate:strict`

## Acceptance

The repository foundation is implemented and has a real client consumer. The current bounded lifecycle/settlement/accessibility and game-copy refinement passes 8 focused widget tests and analysis; Android QA accepted the postmigration readable final smoke relaunch on the physical device. The full collection, breeding, visitor, gifting, service, reminder, commerce and content MVP remains assigned by PB-02–PB-15. Google Play/Android is the effective sequence; artifact, physical-device, listing, signing, privacy and support gates must be evidenced before any publication request, and further iOS QA is paused until after Google Play publication.
