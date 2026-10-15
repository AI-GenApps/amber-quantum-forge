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

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **Baseline at HEAD (this server):** `bun run games:test:tooling` already fails **8 of 43** tests:
  - the Bun pin parity check (pinned 1.3.3, found 1.4.2)
  - the dart-missing and flutter-missing checks
  - **5 stale `toHaveLength(5)` expectations** (the registry now has 6 games): `cli.test.ts:31,49` and `affected.test.ts:89,104`

  Fix the 5 stale expectations; you are editing those tests anyway, so set them to the new correct counts. Treat the Bun pin, dart, and flutter failures as **pre-existing environment failures**. Acceptance: every test passes except exactly those environment-only ones, which are listed by name in the evidence README.
- **Frozen-file hazard:** `codegen.test.ts` calls `generateRegistry()`. Without `dart` on PATH, that rewrites the frozen file `apps-native/games/packages/platform_core/lib/src/generated/game_app_registry.dart` unformatted.
  - Make `codegen.ts` write the file only if its content changed, and skip `dart format` when `dart` is absent.
  - After **any** tooling run, execute `git checkout -- apps-native/`.
  - Acceptance: `git status --porcelain` lists nothing under `apps-native/`.
- **Gating is wider than listed:**
  - Filter `affected.ts` `workspaceMembers()` and `fullMatrix().apps` to `engine === "flutter"`. Otherwise city_drive adds "missing workspace pubspec" graph errors and enters the Flutter Android/iOS matrices.
  - Also gate `cli-device.ts` (`games:run`), `bootstrap()`, `validate --strict`, `validateGameConfigs` (which requires `game.config.json`), `validateContent` (which requires a content manifest), and `icons.ts`.
- **Source entry:** city_drive uses the existing `internalSource()` helper, with repo-relative links.
- **Verification:** add `bun run games:build -- --app city_drive` (it must print the web-engine message and exit 0).
- **`city-drive-ci.yml`:**
  - Use `actions/setup-node` **pinned by SHA** with `node-version: 24`, plus `oven-sh/setup-bun` with the **same SHA and Bun version as `games-ci.yml`**. The Vite 8, Vitest 5, and Capacitor 8 CLIs need Node 22.12 or newer.
  - Add `knip.json`, `biome.json`, and `turbo.json` to the path filters.
  - Validate the YAML in acceptance with `bun -e 'Bun.YAML.parse(await Bun.file(".github/workflows/city-drive-ci.yml").text())'`.
- **Files Touched:** add `.agents/resources/2026-10-15/city-drive-qa/02/README.md`.
