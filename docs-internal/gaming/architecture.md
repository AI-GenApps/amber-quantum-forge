# Gaming portfolio architecture

The gaming portfolio adds five independent Flutter applications under `apps-native/games/`. The existing Expo app, SwiftUI app, Flutter starter, KMP sample, web admin, Hono API, and release tooling remain separate products and build graphs.

## Frozen paths

| Surface | Path | Boundary |
|---|---|---|
| Merge Relay client | `apps-native/games/merge_relay` | Flutter app, Flame rendering, `merge_rules` only |
| Pocket Biome client | `apps-native/games/pocket_biome` | Flutter app, Flame rendering, `biome_rules` only |
| Sixty-Second Heist client | `apps-native/games/sixty_second_heist` | Flutter app, Flame rendering, `heist_rules` only |
| Meme Court client | `apps-native/games/meme_court` | Flutter widgets, `court_rules` only |
| SnapQuest client | `apps-native/games/snapquest` | Flutter app, capability-driven camera, `snapquest_rules` only |
| Shared pure Dart | `apps-native/games/packages/platform_core` | Clock, RNG, replay, save, telemetry, capability interfaces |
| Game rules | `apps-native/games/packages/*_rules` | One package per game, no Flutter or device SDK imports |

The existing `apps-native/flutter-app` and `plugins/flutter/*` are not moved into this workspace. The games Pub workspace is intentionally scoped so a game dependency cannot change the legacy starter's resolution graph.

## Shared contract

`platform_core` exposes small interfaces for injected time, deterministic seeded randomness, bounded replay envelopes, versioned save envelopes, and redacted telemetry. A device implementation depends on these interfaces. The interfaces do not import Flutter, Flame, camera, billing, advertising, notification, or analytics-vendor packages. SnapQuest owns its camera capability interface in its own package so camera semantics do not become a speculative cross-game abstraction.

Each game rules package owns its rules version, serialization, numeric limits, fixtures, and replay validation. A client composes that package with Flutter or Flame. A server validator may consume the same pure package through an explicit generated contract or a separate implementation; Dart code is never imported directly from TypeScript or Go.

The API mounts `/games` behind a signed game token whose subject, stable app ID, and environment are checked against the route. Saves, entitlements, challenges, and admin summaries use the derived `games.<app>` namespace; a client-supplied `app_id`, header, or path cannot authorize another app. The implemented route factory and storage seam are in `packages/api/src/games`; 18 game-isolation tests cover signed-token negatives, owner/member/admin scope, body limits, collision-proof keys, optimistic saves, snapshot binding, atomic rollback, and production fail-closed behavior. The local file store is an opt-in debug/staging adapter with atomic snapshots and cross-scope rejection. Without an approved storage directory, routes fail closed, and production file storage is rejected. No gaming tables or production database migration are included.

## App identity and isolation

The canonical registry is `scripts/games/registry.ts`. It records stable internal IDs, source references, public title candidates, finalized technical identifiers, capabilities, permissions, save namespaces, analytics namespaces, and unresolved store/provider values. `snapquest` remains the internal ID and `Apps/SnapQuest/` remains its canonical Drive folder while `Peeklings` is the public title candidate.

Every client gets its own native project, asset tree, config, save namespace, entitlement namespace, analytics context, version/build controls, and artifacts. A client-supplied app ID never authorizes access. Backend authorization and storage boundaries remain an API concern and require negative cross-app tests.

## Release and update boundaries

Flutter code ships in store binaries. Content manifests, remote configuration, and store binaries are separate release artifacts. Existing Expo OTA updates remain attached to the Expo product and cannot distribute Flutter code. The effective release sequence is Google Play and Android first, following user steering on 2026-09-17; the retained five-app signed/install/play baseline is historical evidence, and further iOS QA is paused until after Google Play publication. Default CI builds Android debug artifacts on Linux and unsigned iOS artifacts on macOS. Device-signed and distribution checks are separate gates and report `NOT RUN` with a reason when credentials or a physical device are unavailable. Play readiness does not mean external registration, submission or publication.

## Capability rules

- Flame is used only by games whose actual rendering or game-loop requirements need it.
- Meme Court uses ordinary Flutter widgets and does not acquire Flame.
- SnapQuest recognition is behind `CameraCapability`; the SnapQuest-only `camera` adapter and camera permission are integrated, while denial, unavailable hardware, poor quality, and interruption must reach the equal desk fallback. SnapQuest uses the pinned `camera` package through CocoaPods because `enable-swift-package-manager: false` is set in its own `pubspec.yaml`; this is an app-local compatibility choice and is covered by unsigned iOS generation/build checks. A future camera SDK migration must rerun the same permission, lifecycle, and physical-device acceptance matrix.
- Optional SDK dependencies are selected per app from the registry and are absent from apps that do not require them.
