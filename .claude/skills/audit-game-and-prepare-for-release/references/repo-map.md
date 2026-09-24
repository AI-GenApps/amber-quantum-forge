# Repo map for games (amber-quantum-forge)

## Where games live

- Flutter + Flame games: `apps-native/games/<id>/` (pub workspace `apps-native/games/pubspec.yaml`),
  pure rules packages `apps-native/games/packages/<id>_rules` (no Flutter/Flame/device imports),
  shared `apps-native/games/packages/platform_core` (save, telemetry, clock, random, registry codegen).
- Unity projects: `apps-native/unity/<id>/` (Unity not installed on the dev Mac as of 2026-09).
- Registry (source of truth for ids, bundle ids, capabilities): `scripts/games/registry*.ts`
  → `bun run games:codegen` → `game.config.json` + `platform_core/.../game_app_registry.dart`.
- Rules for agents: `apps-native/games/AGENTS.md` (never boot emulators; edit
  `ios/project.yml` then `games:xcodegen`; native ids via `games:native`).
- Backend per game: `packages/api/src/games/<id>/`; schema `packages/db/src/schema.ts`.
- Tasks: `tasks/START.md`, `tasks/STATUS.md`, `tasks/epics/NN-*/`.
- Evidence/research: `.agents/resources/<date>/<topic>/`; older plans `.agents/tasks/`.
- Reference epic: `tasks/epics/15-ludo-launch/` (Ludo Vortex) — copy its task shapes.

## Commands

| Command | Use |
|---|---|
| `bun run games:doctor` | toolchain check (Flutter 3.47.x, Dart 3.13.x pinned in `apps-native/games/toolchain.json`) |
| `bun run games:generate -- --id <id> --title "<t>" --output <dir>` | shell scaffold (does NOT register) |
| `bun run games:codegen` / `games:bootstrap` | after registry edits |
| `bun run games:format -- --check` · `games:analyze -- --app <id>` · `games:test -- --app <id>` | client checks |
| `bun run games:validate -- --strict` | registry/config/native/content validation |
| `bun run games:build -- --app <id> --platform android --mode debug --environment debug` | debug APK → `apps-native/games/<id>/build/app/outputs/flutter-apk/app-debug.apk` |
| `bun run games:run -- --app <id> --device-id <serial>` | physical devices only |
| `bun run check` · `bun run typecheck` | Biome + TS (pre-commit runs max-lines, doc paths, secretlint) |

## Gotchas

- Registry length hard-coded in `scripts/games/registry.ts` validateGameRegistry; CI
  allowlists in games-build / games-android-release / games-ci workflows; generator blocklist.
- `games:validate --strict` literal-matches `applicationIdSuffix = ".debug"` twice in
  `android/app/build.gradle.kts` — string interpolation breaks it.
- `--app <id>` commands fail until the app is scaffolded.
- Goldens need fonts loaded in `test/flutter_test_config.dart`; Flame game loops never
  settle — avoid `pumpAndSettle` with live `GameWidget`s; decode images in `runAsync`.
- Debug APKs are large (~170 MB); measure release APK size for budgets.
- Samsung dev phone used: SM-A525F, serial `RZ8R32EAB7T`, 1080x2400; Ludo King installed
  for comparison.
