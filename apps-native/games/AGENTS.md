# Gaming workspace guidance

This directory is a scoped Dart Pub workspace for the five gaming apps and their pure packages. The repository root remains a Bun/Turborepo workspace; use Bun for root commands and the documented `games:*` scripts.

Keep each app's identity, configuration, save namespace, analytics namespace, native project, permissions, and build artifacts isolated. Use the executable registry in `scripts/games/` rather than duplicating IDs or environment rules in an app.

Pure packages under `packages/` must not import Flutter, Flame, camera, billing, advertising, notification, or device SDKs. A device adapter depends on a small interface owned by the relevant package or shared core. Do not add another game's package as a shortcut.

Never edit a generated `*.xcodeproj` directly. Change `ios/project.yml`, then run `bun run games:xcodegen`; native identity and Android package changes must go through `bun run games:native`. Do not boot simulators or emulators for verification; missing physical devices or credentials are reported as `NOT RUN`.

Refresh source provenance in `docs-internal/gaming/sources.json` and the affected handoff before changing a source-indexed requirement. Keep generated build output and `.dart_tool` state untracked; the scoped `.gitignore` is intentional.
