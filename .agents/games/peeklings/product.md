# Peeklings (SnapQuest) — product

## One-liner

Spot a color — by tapping an object on a desk or pointing the camera — meet a
collectible creature, and fill an album.

## Naming

SnapQuest and Peeklings are one product. "SnapQuest" is **taken many times** publicly
(App Store photo scavenger-hunt apps, a Play Store earning app, a Steam game) and must
never ship as the public name. "**Peeklings**" had no exact match in the portfolio
audit's checks and is kept as the public title. The internal identifier, registry id,
and source folder stay `snapquest`. Source:
`docs-internal/gaming/handoffs/snapquest.md`,
`.agents/resources/2026-09-25/games-portfolio-audit/README.md`.

## Scope for this epic (2026-09-25)

**Parked. Fonts only (task 04).** No gameplay work.

## Systems (as implemented today)

| System | Status | Source |
|---|---|---|
| Desk hunt (tap an object) | built, the only real loop today | `apps-native/games/snapquest/lib/snapquest_app.dart`, `apps-native/games/snapquest/lib/snapquest_home_actions.dart` |
| Camera capture | frame capture works | `apps-native/games/snapquest/lib/capabilities/camera_package_frame_source.dart`, `apps-native/games/snapquest/lib/capabilities/camera_capture_capability.dart` |
| Camera **recognition** | **does not work** — `frameCaptured=true` but `descriptorId=null` on device | `docs-internal/gaming/handoffs/snapquest.md` ("Current evidence and next tests"), `apps-native/games/snapquest/lib/capabilities/camera_capture_models.dart` |
| Descriptor / creature catalogue | 2 of ~30 target creatures, 2 descriptors | `apps-native/games/snapquest/assets/content/catalog.json` (`descriptors: [red, blue]`, `creatures: [emberling, azurling]`, each `status: "fixture-only"`) |
| Album | UI exists | `apps-native/games/snapquest/lib/snapquest_cards.dart`, `apps-native/games/snapquest/lib/snapquest_secondary_cards.dart` |

## Compliance note

Audience skews young; Families policy, COPPA, and a camera together are a heavy
compliance mix (portfolio audit). This is a product-level blocker independent of the
recognition-tech gap.

## Screens (current)

Desk hunt, first catch. Audit renders:
`.agents/resources/2026-09-25/games-portfolio-audit/renders/snapquest-01-home.png`,
`snapquest-02-caught.png`. Device evidence (2026-09-17):
`docs-internal/gaming/evidence/visual/snapquest-before.png`,
`snapquest-after.png`, `snapquest-final-camera.png`,
`snapquest-final-primary-first-success.png`,
`snapquest-final-primary-complete.png`.

## Tech

Flutter + Flame; pure Dart rules package `apps-native/games/packages/snapquest_rules`;
camera adapter behind `CameraFrameSource`
(`apps-native/games/snapquest/lib/capabilities/`), bounded frame, downsampled to at
most 96×96 RGB, no file/network/location/AR/cloud inference. Full requirement ledger
(SQ-01–SQ-16): `docs-internal/gaming/handoffs/snapquest.md`.
