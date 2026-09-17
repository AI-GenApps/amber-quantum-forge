---
epic: 13-gaming-portfolio-preparation
task: 00-shared-contracts
status: completed
commit_scope: gaming
depends_on: []
estimate: M
---

# Freeze shared game boundaries

## Context

The repository already contains a standalone Flutter starter and separate Expo and SwiftUI clients. The five games need shared infrastructure without a universal game framework or a dependency on device SDKs.

## Implementation Checklist

- [x] Add the scoped `apps-native/games` Pub workspace.
- [x] Add `packages/platform_core` as a pure Dart package.
- [x] Implement injected clock and deterministic random interfaces.
- [x] Implement bounded, versioned replay and save envelopes with app identity checks.
- [x] Implement redacted telemetry interfaces.
- [x] Add unit tests for determinism, limits, migration, redaction, and camera denial.
- [x] Publish the frozen path and dependency rules in gaming architecture docs.

## Verification

- `(cd apps-native/games && dart pub get --enforce-lockfile)`
- `bun run games:analyze -- --app merge_relay`
- `(cd apps-native/games/packages/platform_core && dart analyze && dart test)`
- `bun run check:ci`

## Acceptance

The package contains no Flutter, Flame, camera, billing, analytics-vendor, or device SDK dependency. Consumers can inject all time, randomness, persistence, and telemetry behavior. SnapQuest keeps its camera capability interface in its own package.
