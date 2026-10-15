---
epic: 17-city-drive
task: 02-registry-and-ci
status: pending
commit_scope: games
depends_on: [17-city-drive/01-workspace-scaffold]
estimate: L
owner: agent
---

# Games registry `engine: "web"` + City Drive CI workflow

## Goal

Register `city_drive` in the games registry as the first **web-engine** game
without breaking any Flutter path. Add a dedicated GitHub Actions workflow
that gates City Drive changes.

## Context / Decisions

- **Registry files:** `scripts/games/registry.ts` (contains `validateGameRegistry()`,
  which currently hard-codes `GAME_REGISTRY.length !== 6`),
  `registry-types.ts` (`GameId`, `GameRegistration`, helpers), and
  `registry-games.ts` (entries). There is no engine field today, and
  `rendering` is `"flame" | "flutter_widgets"`.
- **Add `engine: "flutter" | "web"`** to `GameRegistration`.
  - Set `engine: "flutter"` on all six existing entries.
  - Widen `rendering` with `"babylon"`.
  - Make `paths.rulesPackage` allow the TS core path
    (`apps-games/city-drive-core`). Validation must branch on the engine:
    a web game needs a `package.json` at `paths.app`, not a `pubspec.yaml`.
  - Replace the hard-coded count with a check against the entry list.
- **Gate every Flutter-only code path by `engine === "flutter"`:**
  - `toolchain.ts`: `existingApps`, `existingPackages`
  - `cli-commands.ts`: format, analyze, test, bootstrap, doctor, `validate --strict`
  - `cli-build.ts`: `buildGame`
  - `config.ts`, `metadata.ts`, `native.ts`, `xcodegen.ts`, `icons.ts`
  - `codegen.ts`: exclude web games from the Dart registry codegen, or emit
    them with an engine marker if the Dart side tolerates it (prefer exclude)
  - `content.ts`: only if it iterates apps

  For `city_drive`:
  - `games:build` prints a clear "web engine: use `bun run city-drive:build`" message.
  - `games:list` shows the engine column.
- **`affected.ts`:** map `apps-games/city-drive/**` and
  `apps-games/city-drive-core/**` to `city_drive`. The Flutter Android/iOS
  matrices must **exclude** web games. Add a separate `web_apps` output field.
- **City Drive entry values:**
  - identity `app.w3dev.citydrive` (the debug variant follows the existing
    `.debug` convention)
  - namespaces via the existing helpers
  - `platforms: ["android", "ios"]`
  - `lifecycle: "concept"`
  - `capabilities` with no network, ads, IAP, or accounts
  - release `0.1.0` / build 1
  - title "City Drive" (working title)
- **Do not add `city_drive` to `packages/api/src/games/contracts.ts`
  `GAME_APP_IDS`.** v1 has no backend.
- **Update hard-coded game lists in workflows** only where a web game would
  otherwise be rejected or mis-routed:
  - `games-ci.yml`: path filters and the generated `game.config.json` diff list.
    City Drive has none; make sure the step doesn't expect one.
  - `games-build.yml` / `games-android-release.yml` `case` guards must keep
    rejecting `city_drive` (Flutter-only).
- **New workflow `.github/workflows/city-drive-ci.yml`:**
  - Triggers: push/PR to `main` on `apps-games/**`, `package.json`, `bun.lock`,
    and itself.
  - Steps: checkout, setup-bun (same pinned version as the other workflows),
    `bun install --frozen-lockfile`, then `bun run check:ci` scoped to
    `apps-games` (`bunx biome check apps-games`), `city-drive:typecheck`,
    `city-drive:test`, `city-drive:build`.
  - Upload `apps-games/city-drive/dist` as an artifact.
  - No deploy step. Web deploy is task 21 and goes through GitHub Actions only.
- Update the registry, affected, CLI, and metadata tests in
  `scripts/games/*.test.ts` to cover a web entry.
- Update `docs-internal/gaming/app-source-registry.md` (or the equivalent
  registry doc) with the new engine field and the City Drive row.
- Ludo is frozen. If a Ludo-specific branch in these scripts needs touching,
  keep the change mechanical (add the engine field only).

## Implementation Checklist

- [ ] Add the engine field, widen the types, and add the `city_drive` entry.
- [ ] Gate Flutter-only paths; give web games friendly messages.
- [ ] Update `affected.ts` and its tests.
- [ ] Update `games-ci.yml` path filters/lists, and add `city-drive-ci.yml`.
- [ ] Update the tooling tests and the registry doc.

## Files Touched

- `scripts/games/{registry.ts,registry-types.ts,registry-games.ts,toolchain.ts,cli-commands.ts,cli-build.ts,affected.ts,config.ts,metadata.ts,native.ts,xcodegen.ts,icons.ts,codegen.ts,*.test.ts}` (only those that need changes)
- `.github/workflows/games-ci.yml`, `.github/workflows/city-drive-ci.yml` (new)
- `docs-internal/gaming/app-source-registry.md` (or equivalent)

## Acceptance Criteria

- `bun run games:test:tooling` passes, with new tests for: a web entry
  validates; the Flutter commands skip `city_drive`; `affected` maps
  `apps-games` paths to `city_drive` and excludes it from the Flutter matrices.
- `bun run games:list` shows 7 games with an engine column.
- `bun run games:validate` passes for `city_drive`. Flutter games may report
  NOT RUN or toolchain-missing exactly as on HEAD; prove that with a HEAD
  worktree if any Flutter check fails.
- The generated Dart registry is unchanged for the six Flutter games
  (`git diff` on the generated Dart file shows no change, or only the
  documented web exclusion).
- `city-drive-ci.yml` is valid YAML and runs only Bun steps.

## Out of Scope

- Backend/API registration, web deployment, Capacitor.

## Verification Commands

- `bun run games:test:tooling`
- `bun run games:list`
- `bun run games:validate`
- `bun run games:affected -- --base HEAD~1 --format=json`
- `bun run check:ci`

## Commit message

`feat(games): register city drive as the first web-engine game [17-city-drive/02]`
