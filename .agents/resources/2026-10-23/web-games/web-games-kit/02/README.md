# Task 02: game skeletons, workspace wiring and registry (evidence)

Date: 2026-10-23. Branch: `feat/web-games-kit`. No browser, screenshot, device or `cap sync` was used.

## Workspaces added

Six apps `apps-games/<slug>` (`@web-games/<slug>`) and six cores `apps-games/<slug>-core`
(`@web-games/<slug>-core`) for `lantern-loops`, `floodplain-dispatch`, `cloud-observatory`,
`the-last-window`, `dress-rehearsal`, `lost-parcel-desk`.

| Game | appId | Dev/preview port |
|---|---|---|
| Lantern Loops | `app.w3dev.lanternloops` | 4011 |
| Floodplain Dispatch | `app.w3dev.floodplaindispatch` | 4012 |
| Cloud Observatory | `app.w3dev.cloudobservatory` | 4013 |
| The Last Window | `app.w3dev.thelastwindow` | 4014 |
| Dress Rehearsal | `app.w3dev.dressrehearsal` | 4015 |
| Lost Parcel Desk | `app.w3dev.lostparceldesk` | 4016 |

## Exact pins (same as `apps-games/web-kit` and City Drive)

App dependencies: preact 11.0.1, @capacitor/core 8.5.3, @capacitor/android 8.5.3,
@capacitor/ios 8.5.3, @capacitor/app 8.1.2, @capacitor/haptics 8.0.2, @capacitor/preferences 8.0.1,
@capacitor/screen-orientation 8.0.2, @capacitor/status-bar 8.0.4, @capacitor/share 8.0.3,
`@web-games/kit` and `@web-games/<slug>-core` as `workspace:*`.

App devDependencies: @capacitor/cli 8.5.3, @capacitor/assets 3.0.5, vite 8.3.4, vitest 5.0.5,
happy-dom 21.0.1, typescript 5.9.3, sharp 0.35.3, @types/node 20.19.43.

Core devDependencies: @types/node 20.19.43, typescript 5.9.3, vitest 5.0.5 (no runtime dependency).

## Lock diff summary

`bun.lock`: 534 lines added, 0 removed. Additions are only the 12 new workspace entries, their
`@web-games/*` workspace package rows and per-workspace `sharp@0.35.3` rows (bun duplicates sharp per
workspace because of its optional `@types/node` peer). No existing package changed version.
`bun install --frozen-lockfile` succeeds afterwards.

## Registry

Six `GAME_REGISTRY` entries (`engine: "web"`, `rendering: "dom"`, `lifecycle: "concept"`), `"dom"`
added to the rendering type and six ids added to `GAME_IDS`. `scripts/games/registry.ts` needed two
small changes the task implies: web validation accepts `dom` for the new games (City Drive stays
`babylon`), and `webEngineMessage` points the new games at `web-games:build` and
`bun run --filter @web-games/<slug> cap:sync`.

## Results

| Command | Result |
|---|---|
| `bun run --filter '@web-games/*' typecheck` | pass (kit, 6 apps, 6 cores) |
| `bun run --filter '@web-games/*' test` | pass: kit 243 tests, each core 8, each app 3 |
| `bun run --filter '@web-games/*' build` | pass |
| `bunx biome check apps-games scripts/games` | pass (1 pre-existing info in `merge-relay-deploy-workflow.test.ts`) |
| `bun test --max-concurrency=1 scripts/games/*.test.ts` (with `$HOME/flutter/bin` on PATH) | 80 pass, 0 fail |
| `bun test --max-concurrency=1 scripts/games/registry-web.test.ts` | pass |
| `bun run knip:ci \| grep apps-games` for the new packages | no output |

Notes:

- Without `$HOME/flutter/bin` on PATH, `codegen.test.ts` and `generate.test.ts` fail with
  "Executable not found" and `parity.test.ts` fails, because `dart` and `flutter` are not on the
  default PATH. This is a toolchain condition, not a regression: with the PATH set, all 80 tests pass
  on this branch; `generate.test.ts` and `parity.test.ts` also pass on a throwaway worktree of
  `origin/main` with the same PATH.
- One cold run with Flutter on PATH hit the 5 s default timeout in `generate.test.ts` and
  `parity.test.ts` while Dart compiled for the first time; the warm rerun passed.
- `bun run knip:ci` exits 1 because of existing findings (unused Ludo and Merge Relay exports, two
  City Drive findings, `GameEngine` exports); none are in the new packages.
- `games:test:tooling` did not modify any file under `apps-native/`.
