---
epic: 13-gaming-portfolio-preparation
task: 07-merge-relay
status: completed
commit_scope: gaming
depends_on: [00-shared-contracts, 01-registry, 02-tooling]
estimate: L
---

# Merge Relay foundation and Play readiness

## Implementation Checklist

- [x] Keep the client and `merge_rules` package independent from the other games.
- [x] Add deterministic rules, bounded versioned payloads, save identity and replay parity fixtures.
- [x] Add the playable local client path, restart recovery and accessible board controls.
- [x] Record the complete v0.3 requirement ledger in [the handoff](../../../docs-internal/gaming/handoffs/merge-relay).
- [x] Separate preparation evidence from the full MVP requirements MR-04–MR-14.

## Verification

- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run games:parity`
- `bun run games:validate:strict`

## Acceptance

The repository foundation is implemented and has a real client consumer. The current bounded lifecycle/save/accessibility and game-copy refinement passes 5 focused widget tests and analysis; Android QA accepted the postmigration readable final smoke relaunch on the physical device. The full service, social, commerce, telemetry and content MVP remains assigned by MR-04–MR-14. Google Play/Android is the effective sequence; artifact, physical-device, listing, signing, privacy and support gates must be evidenced before any publication request, and further iOS QA is paused until after Google Play publication.
