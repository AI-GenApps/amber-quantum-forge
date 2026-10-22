# Task 01 — shared web-games kit package

Date: 2026-10-23. Branch `feat/web-games-kit`. No browser, Playwright, simulator or screenshot used.

## Versions

Copied exactly from `apps-games/city-drive/package.json` unless noted.

| Package | Version | Note |
|---|---|---|
| preact | 11.0.1 | |
| @capacitor/core | 8.5.3 | |
| @capacitor/app | 8.1.2 | |
| @capacitor/haptics | 8.0.2 | |
| @capacitor/preferences | 8.0.1 | |
| @capacitor/screen-orientation | 8.0.2 | |
| @capacitor/status-bar | 8.0.4 | |
| @capacitor/share | 8.0.3 | newest stable 8.x |
| vitest | 5.0.5 | |
| happy-dom | 21.0.1 | |
| typescript | 5.9.3 | |
| @types/node | 20.19.43 | City Drive declares `^20.11.17`; this is the version resolved in `bun.lock` |

## `npm view @capacitor/share` summary (run 2026-10-23)

- 8.x stable releases published: `8.0.0`, `8.0.1`, `8.0.2`, `8.0.3`.
- dist-tags: `latest` = `8.0.3`, `latest-7` = `7.0.4`, `latest-6` = `6.0.4`, `nightly` =
  `8.0.4-nightly-20261022T151445.0`, `next` = `9.0.0-alpha.2`, `dev` = `9.0.0-dev-2594-20260922T111950.0`.
- Nightly and dev tags are not releases and were ignored. Pinned `8.0.3` (peer `@capacitor/core >=8.0.0`).

## `bun.lock`

`bun install` added only the `apps-games/web-kit` workspace entry and `@capacitor/share@8.0.3`
(24 added lines, no removals). A second `bun install` reported no changes.

## Results

| Command | Result |
|---|---|
| `bun run --filter '@web-games/kit' typecheck` | pass |
| `bun run --filter '@web-games/kit' test` | pass, 21 files, 243 tests |
| `bun run --filter '@web-games/kit' build` | pass (`tsc -p tsconfig.build.json`) |
| `bunx biome check apps-games/web-kit` | pass |
| `bunx biome check apps-games scripts/games` | pass (1 info, not from the kit) |
| `bun run knip:ci` | no findings for `apps-games/web-kit` (other workspaces have existing findings) |
| `bun test --max-concurrency=1 scripts/games/*.test.ts` | 72 pass, 3 fail |

`scripts/games/registry-web.test.ts` does not exist until task 02 (not applicable).

The 3 failures in `scripts/games/*.test.ts` need `dart` and `flutter`, which are not on PATH in this
shell ("generated Dart registry is formatter-stable", "generic generator keeps debug and production
native identities separate", "checked-in Dart VM and compiled JS replay fixture stays in parity").
The same command in a throwaway worktree of `origin/main` (2acb9db) also fails those three (it
showed 69 pass, 4 fail there; the fourth was a symlinked-`node_modules` artefact of the throwaway
checkout). They are pre-existing and unrelated to the kit.

## Tests per module

| Module | Test file(s) |
|---|---|
| rng | `src/rng/rng.test.ts` |
| daily | `src/daily/daily.test.ts` |
| save | `src/save/store.test.ts`, `src/save/adapters/adapters.test.ts` |
| settings | `src/settings/settings.test.ts` |
| audio | `src/audio/manager.test.ts` (includes the missing `AudioContext` path) |
| haptics | `src/haptics/haptics.test.ts` (missing plugin path) |
| share | `src/share/share.test.ts` (capacitor, navigator, clipboard, unavailable) |
| lifecycle | `src/lifecycle/lifecycle.test.ts` (web no-ops, missing plugins) |
| router | `src/router/router.test.tsx` |
| ui | `src/ui/{theme,styles,display,controls,tabs,overlays}.test.ts(x)` |
| fonts | `src/fonts/fonts.test.ts` |
| assets | `src/assets/assets.test.ts` |
| motion | `src/motion/motion.test.ts` |
| strings | `src/strings/strings.test.ts` |
| architecture | `test/architecture.test.ts` (no clock/random/platform in rng, daily, save core; pins; line count; no `any`) |
