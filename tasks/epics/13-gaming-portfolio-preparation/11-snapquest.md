---
epic: 13-gaming-portfolio-preparation
task: 11-snapquest
status: completed
commit_scope: gaming
depends_on: [00-shared-contracts, 01-registry, 02-tooling]
estimate: L
---

# SnapQuest / Peeklings foundation and Play readiness

## Implementation Checklist

- [x] Keep the Peeklings client and `snapquest_rules` package under the stable SnapQuest identity.
- [x] Add equal desk/camera completion, bounded capture metadata, lifecycle disposal and versioned album persistence.
- [x] Add a playable desk hunt with wrong-object feedback, creature reveal, restore and honest camera status messaging.
- [x] Record the complete v0.3 requirement ledger in [the handoff](../../../docs-internal/gaming/handoffs/snapquest).
- [x] Separate preparation evidence from the full MVP requirements SQ-06–SQ-15.

## Verification

- `bun run games:analyze -- --app snapquest`
- `bun run games:test -- --app snapquest`
- `bun run games:validate:strict`

## Acceptance

The repository foundation is implemented and the 20-test scoped widget/capability suite covers the equal desk path, persistence, lifecycle ordering, busy capture gating and unverified frame distinction. The local entrypoint now uses a `path_provider` application-documents save with a one-time app-scoped migration from the former temporary root; destination readback is verified before the legacy save is deleted, and migration failures preserve the source. Android QA accepted readable 1080×2400 camera and relaunch smoke captures on physical `SM-A525F` serial `RZ8R32EAB7T`, Android 14; the camera result remains `frameCaptured=true` with `descriptorId=null`. Current source metadata is available, while exact route/recovery joins and descriptor calibration remain separate gates. Exact physical descriptor calibration, content quantities, service, share, economy and operational MVP remain assigned by SQ-02 and SQ-06–SQ-15. Google Play/Android is the effective sequence; permission, physical-device, listing, signing, privacy and support gates must be evidenced before any publication request, and further iOS QA is paused until after Google Play publication.
