---
epic: 18-web-games-kit
task: 02-game-skeletons-and-registry
status: pending
commit_scope: web-games-kit
depends_on: [18-web-games-kit/01-kit-package]
estimate: L
owner: agent
---

# Six game skeletons, workspace wiring and registry entries

## Goal

Give every web game a buildable, testable, registered starting point so each
game branch only adds game code. After this task `bun.lock` is final for all
six games and game branches never touch it.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final: each game is
  `apps-games/<slug>` (`@web-games/<slug>`) plus `apps-games/<slug>-core`
  (`@web-games/<slug>-core`); Capacitor 8; portrait; no network; no engines.
- **Pin rule:** Exact-pin every dependency. Reuse the exact versions already
  used by apps-games/city-drive/package.json for preact, vite, vitest,
  typescript, happy-dom, sharp, @types/node and all @capacitor/* packages it
  uses. @capacitor/share must be the newest 8.x release, exact-pinned. Add no
  other runtime dependency to the kit or any skeleton.
  Use the same exact versions as the kit from task 01 (copy them from
  `apps-games/web-kit/package.json`).
- The six games (slug, working title, epic, `appId`):

  | Slug | Title (appName) | Epic dir | appId |
  |---|---|---|---|
  | `lantern-loops` | Lantern Loops | `19-web-lantern-loops` | `app.w3dev.lanternloops` |
  | `floodplain-dispatch` | Floodplain Dispatch | `20-web-floodplain-dispatch` | `app.w3dev.floodplaindispatch` |
  | `cloud-observatory` | Cloud Observatory | `21-web-cloud-observatory` | `app.w3dev.cloudobservatory` |
  | `the-last-window` | The Last Window | `22-web-the-last-window` | `app.w3dev.thelastwindow` |
  | `dress-rehearsal` | Dress Rehearsal | `23-web-dress-rehearsal` | `app.w3dev.dressrehearsal` |
  | `lost-parcel-desk` | Lost Parcel Desk | `24-web-lost-parcel-desk` | `app.w3dev.lostparceldesk` |

- **App skeleton** (`apps-games/<slug>`): `package.json` with scripts `dev`,
  `build`, `preview`, `test`, `typecheck`, `cap:sync` and EXACTLY the
  dependency set the game needs for all of v1:
  - dependencies: `preact`, `@web-games/kit` (`workspace:*`),
    `@web-games/<slug>-core` (`workspace:*`), `@capacitor/core`,
    `@capacitor/android`, `@capacitor/ios`, `@capacitor/app`,
    `@capacitor/haptics`, `@capacitor/preferences`,
    `@capacitor/screen-orientation`, `@capacitor/status-bar`,
    `@capacitor/share`;
  - devDependencies: `@capacitor/cli`, `@capacitor/assets`, `vite`, `vitest`,
    `happy-dom`, `typescript`, `sharp`, `@types/node`.
  - Plus `vite.config.ts`, `vitest.config.ts` (happy-dom), `tsconfig.json`,
    `index.html`, `capacitor.config.ts` (`appId` from the table,
    `appName` = working title, `webDir: "dist"`, portrait, no `server.url`),
    `src/main.tsx` rendering a minimal title screen through the kit, a
    `public/` folder (with `.gitkeep`), and one smoke test.
  - `cap:sync` is `vite build && cap sync`. Do not generate `android/` or
    `ios/` and do not run `cap sync` in this task.
- **Core skeleton** (`apps-games/<slug>-core`): `package.json` (`exports` and
  `types` point at `./src/index.ts`; scripts `test`, `typecheck`, `build`),
  `tsconfig.json` without DOM types, `src/index.ts` exporting a `version`
  constant, and one test. Add an architecture test that fails on `window`,
  `document`, `Date.now`, `Math.random`, `localStorage`, `performance.now` in
  `src/**` (same purity rule as City Drive).
- **Install:** run `bun install` so `bun.lock` is final for all six games. The
  only lock changes must be the new workspaces and their pinned dependencies.
- **Root scripts:** add `web-games:test`, `web-games:typecheck`,
  `web-games:build`, each `bun run --filter '@web-games/*' <script>`. Do not
  change the existing `test` script.
- **Biome and Knip:** wire the new packages following the City Drive pattern
  (workspace entries `src/main.tsx`, `vite.config.ts`, `vitest.config.ts`,
  `capacitor.config.ts`, `src/index.ts`, `test/**`). Biome already excludes
  `apps-games/**/android`, `ios` and `public/assets`; keep that.
  Acceptance for Knip is `bun run knip:ci | grep apps-games` printing nothing
  for the new packages.
- **Registry:** add six `GAME_REGISTRY` entries in
  `scripts/games/registry-games.ts` following the `city_drive` entry:
  `engine: "web"`, `lifecycle: "concept"`, `paths` `{ app, rulesPackage }`,
  `source` pointing at `.agents/games/<slug>/` and
  `tasks/epics/<epic dir>/STATUS.md`, `platforms: ["android", "ios"]`, ids in
  snake_case (`lantern_loops`, ...). Add a new `rendering` value `"dom"` to
  `scripts/games/registry-types.ts` and use it. Update the `scripts/games`
  tests (counts of registered games, rendering values) and add
  `scripts/games/registry-web.test.ts` asserting that every web entry has an
  existing `package.json` at `paths.app` and `paths.rulesPackage`, the `dom`
  rendering, correct source paths, unique ids and `appId`s, and that
  Flutter-only code paths still skip `engine: "web"` entries.
  - Run the existing tooling tests before and after. `bun run
    games:test:tooling` rewrites a frozen generated Dart file; always follow it
    with `git checkout -- apps-native/`. Pre-existing failures must be proven
    on a throwaway worktree of `origin/main` under
    `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/` and recorded, not fixed.
- **Placeholders:** create `.agents/games/<slug>/README.md` for each game (one
  line pitch from the game spec, link to its epic) so registry paths resolve.
  The epic directories themselves are created by each game's own task 00.

## Implementation Checklist

- [ ] Confirm the branch and that task 01 is complete.
- [ ] Scaffold the six `<slug>-core` packages (with architecture test).
- [ ] Scaffold the six `<slug>` apps (config files, `src/main.tsx` title screen
      through the kit, smoke test, `public/.gitkeep`).
- [ ] Run `bun install`; verify the lock diff contains only the new packages.
- [ ] Add the three root `web-games:*` scripts.
- [ ] Update `biome.json` and `knip.json`.
- [ ] Add `"dom"` to the rendering type and the six registry entries.
- [ ] Update `scripts/games/*.test.ts` and add `registry-web.test.ts`.
- [ ] Create the six `.agents/games/<slug>/README.md` placeholders.
- [ ] Record versions and the lock diff summary in
      `.agents/resources/2026-10-23/web-games/web-games-kit/02/README.md`.
- [ ] Tick task 02 in `STATUS.md`.

## Files Touched

- `apps-games/<slug>/**` and `apps-games/<slug>-core/**` for the six slugs (new)
- `package.json` (root scripts only), `bun.lock`, `biome.json`, `knip.json`
- `scripts/games/registry-games.ts`, `scripts/games/registry-types.ts`,
  `scripts/games/*.test.ts` (including new `registry-web.test.ts`)
- `.agents/games/<slug>/README.md` (six placeholders)
- `.agents/resources/2026-10-23/web-games/web-games-kit/02/README.md`
- `tasks/epics/18-web-games-kit/STATUS.md`

## Acceptance Criteria

- Each of the six apps has exactly the dependency set listed above, all
  exact-pinned with the same versions as the kit and City Drive.
- `bun run --filter '@web-games/*' test|typecheck|build` pass for the kit, six
  apps and six cores; each `capacitor.config.ts` has the correct `appId`,
  `appName`, `webDir: "dist"`, portrait, and no `server.url`.
- `bun.lock` is final: `bun install --frozen-lockfile` succeeds and a game
  branch needs no lock change.
- `GAME_REGISTRY` has the six new `engine: "web"`, `rendering: "dom"` entries;
  `validateGameRegistry()` passes; no Flutter command (`games:format`,
  `games:analyze`, `games:test`, build) tries to process web entries.
- Pre-existing tooling-test failures (if any) are proven on `origin/main` and
  recorded; no new failure is introduced.
- Core packages have no DOM usage (architecture test green).
- No `android/` or `ios/` directory was generated; no browser or screenshot was
  used.

## Verification Commands

- `bun run --filter '@web-games/*' typecheck`
- `bun run --filter '@web-games/*' test`
- `bun run --filter '@web-games/*' build`
- `bunx biome check apps-games scripts/games`
- `bun test --max-concurrency=1 scripts/games/registry-web.test.ts`

## Out of Scope

- Any game rules, content, art, fonts, audio or screens beyond the title stub.
- Capacitor native projects, `cap sync`, icons and splash (each game's task 07).
- CI workflow and docs (task 03).
- Changing City Drive, Flutter games, Ludo or Merge Relay.

## Commit message

`feat(web-games-kit): add six game skeletons and registry entries [18-web-games-kit/02]`
