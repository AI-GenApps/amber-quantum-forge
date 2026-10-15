# Task 02 evidence: games registry `engine` field + City Drive CI

Date: 2026-10-15. Bun 1.4.2 on this server (repo pin 1.3.3 untouched). No Flutter, Dart, Xcode, JDK or Android SDK installed; no browser or device used.

## What changed

- `engine: "flutter" | "web"` added to `GameRegistration`; `rendering` widened with `"babylon"`; `GameId` now derives from a `GAME_IDS` list. `validateGameRegistry()` checks the entry list against `GAME_IDS` (no hard-coded count) and, for web games, requires `package.json` at `paths.app` and `paths.rulesPackage` (no `pubspec.yaml`).
- `city_drive` entry: `app.w3dev.citydrive`, `concept`, android+ios, `game_loop` only (no network/ads/IAP/accounts), `0.1.0` build 1, `internalSource()` with repo-relative links. Not added to `packages/api/src/games/contracts.ts`.
- Flutter-only paths gated with `flutterGames()` / `isWebGame()`: `toolchain.ts` (`existingApps`, `existingPackages`, new `requireFlutterApp`), `cli-commands.ts` (format, analyze, test, bootstrap, doctor, `validate --strict`), `cli-build.ts`, `cli-device.ts` (`run`), `config.ts`, `content.ts`, `native.ts`, `xcodegen.ts`, `icons.ts`, `metadata.ts`, `codegen.ts`, `affected.ts`.
- `affected.ts`: new `web_apps` field; `apps-games/city-drive/**` and `apps-games/city-drive-core/**` map to `city_drive`; Pub graph members and the full matrix are Flutter-only.
- `codegen.ts`: Flutter games only; writes the Dart registry only when its content changed (whitespace-insensitive compare); skips `dart format` when `dart` is absent. Generated Dart registry is unchanged.
- `games-ci.yml`: new `web_apps` output on the `affected` job. No path-filter or `game.config.json` diff-list change was needed (City Drive has none). `games-build.yml` and `games-android-release.yml` case guards already reject `city_drive` (asserted by a test).
- New `.github/workflows/city-drive-ci.yml`: checkout, `actions/setup-node` (SHA `49933ea5288caeca8642d1e84afbd3f7d6820020` = v4.4.0, looked up with `gh api`, Node 24), `oven-sh/setup-bun` (same SHA and Bun 1.3.3 as `games-ci.yml`), then only Bun commands: `bun install --frozen-lockfile`, `bunx biome check apps-games`, `city-drive:typecheck`, `city-drive:test`, `city-drive:build`; uploads `apps-games/city-drive/dist`. No deploy step. Path filters include `apps-games/**`, `package.json`, `bun.lock`, `knip.json`, `biome.json`, `turbo.json` and itself.
- Docs: `docs-internal/gaming/app-source-registry.md` (engine section, City Drive row), `docs-internal/gaming/commands.md` (list column, `web_apps`).
- Tests: stale counts fixed (`cli.test.ts` 2x, `affected.test.ts` 2x, plus the Pub-graph fixture now includes Ludo and its rules package, and the platform_core consumer list includes `ludo`); new `scripts/games/registry-web.test.ts` (12 tests) and a codegen no-op test.

Small additions beyond Files Touched: `cli-device.ts`, `content.ts` (listed in the amendments), new `registry-web.test.ts`, `commands.md`.

## Verification results

| Command | Result |
|---|---|
| `bun run games:test:tooling` (then `git checkout -- apps-native/`) | 58 pass, 3 fail (61 tests). The 3 failures are the environment-only ones: `checked-in Dart VM and compiled JS replay fixture stays in parity` (Pinned Bun 1.3.3 required, found 1.4.2), `generated Dart registry is formatter-stable` (`dart` not on PATH), `generic generator keeps debug and production native identities separate` (`flutter` not on PATH). At HEAD the dry run recorded 8 of 43 failing; the 5 stale-count tests now pass. |
| `bun run games:list` | PASS: 7 games with an engine column (6 `flutter`, `city_drive` `web`/`babylon`). |
| `bun run games:validate` | PASS ("Gaming registry and content validation passed."). `games:validate:strict` also passes. |
| `bun run games:build -- --app city_drive` | PASS: prints the web-engine message, exit 0. |
| `bun run games:affected -- --base HEAD~1 --format=json` | PASS: `apps` has the six Flutter games, `web_apps` is `["city_drive"]` (full matrix because `bun.lock` changed in HEAD~1). |
| `bun run check:ci` | PASS ("Checked 403 files, No fixes applied"). |
| YAML parse of `city-drive-ci.yml` with `Bun.YAML.parse` | PASS (one job `quality`). |
| `bun run check:max-lines`, `bun run check:doc-paths` | PASS. |
| `git status --porcelain` under `apps-native/` | empty after every tooling run. |

Pre-existing note: a throwaway HEAD worktree run of the tooling tests had no `node_modules`, so its counts (9 fail of 28) are not comparable; the HEAD baseline relied on is the dry-run record (8 of 43). The 3 remaining failures are environment-only and fail identically with the code reverted because they need Bun 1.3.3, `dart` and `flutter`.

## NOT RUN

Flutter `games:format/analyze/test/doctor` (no Flutter/Dart), the GitHub Actions workflows (never run locally), any browser or device check.
