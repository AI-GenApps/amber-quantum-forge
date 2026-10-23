---
epic: 18-web-games-kit
task: 01-kit-package
status: in-progress
commit_scope: web-games-kit
depends_on: [18-web-games-kit/00-kit-epic-and-status]
estimate: XL
owner: agent
---

# Shared web-games kit package

## Goal

Create `apps-games/web-kit` (`@web-games/kit`): the framework code shared by
all six web games, fully unit-tested with Vitest. It contains no game rules and
no game content. When this task is done, a game only needs to import the kit
for save, daily seeds, settings, audio, haptics, share, lifecycle, routing, UI
primitives, fonts, assets, motion and strings.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. Relevant here:
  portrait, offline-first, local save only (Capacitor Preferences on device,
  `localStorage` on web), versioned with migrations; no network calls; no
  monetization; no game engines; DOM/SVG/Canvas 2D; Preact UI.
- **Pin rule:** Exact-pin every dependency. Reuse the exact versions already
  used by apps-games/city-drive/package.json for preact, vite, vitest,
  typescript, happy-dom, sharp, @types/node and all @capacitor/* packages it
  uses. @capacitor/share must be the newest 8.x release, exact-pinned. Add no
  other runtime dependency to the kit or any skeleton.
  - Copy the versions from `apps-games/city-drive/package.json` at the time
    of the task (`preact`, `vite`, `vitest`, `typescript`, `happy-dom`,
    `sharp`, `@types/node`, `@capacitor/core`, `app`, `haptics`,
    `preferences`, `screen-orientation`, `status-bar`). `@types/node` is a
    range in City Drive; use the exact version it resolves to in `bun.lock`.
  - Look up `@capacitor/share` with `npm view @capacitor/share versions`;
    pick the newest stable `8.x.y` (8.0.3 at planning time; ignore nightly
    and dev tags). Record the result in the evidence README.
  - Capacitor packages are `peerDependencies` or `dependencies` of the kit as
    the wrappers need; they are the only runtime dependencies besides `preact`.
- **Package shape:** `package.json` name `@web-games/kit`, `private: true`,
  `type: module`, `exports` and `types` pointing at `./src/index.ts` (source is
  consumed directly, as with `@city-drive/core`). Scripts: `test`
  (`vitest run`), `typecheck` (`tsc --noEmit`), `build` (`tsc -p
  tsconfig.build.json`, a build check only). `bun run --filter '@web-games/*'`
  must find all three scripts.
- **Vitest:** happy-dom environment; `testTimeout: 60000`. Never run
  `bunx vitest` from the repo root (`packages/api` uses another major); run it
  through the workspace scripts.
- **Determinism:** modules that read time, randomness or the platform take them
  as injected parameters (clock, `Storage`, `AudioContext` factory) so tests are
  deterministic. No `Math.random`, `Date.now` or `localStorage` inside rule-like
  code (rng, daily, save logic); only adapters touch the platform.
- **No visual QA** (owner decision): UI primitives are tested with
  plain Preact rendering in happy-dom (no extra test library) and assertions on DOM
  structure, attributes and CSS custom property usage, never on screenshots.
- Modules, each in `src/<module>/` with its own test file (code files under
  800 lines):
  1. `rng`: seedable PRNG (sfc32 or mulberry32), hashing a string to a seed,
     shuffle/pick helpers.
  2. `daily`: `localDateKey(date)` in the device time zone, `dailySeed(gameId,
     dateKey)`, day-number since an epoch.
  3. `save`: versioned save store with typed schema, ordered migrations,
     corrupt-data recovery, adapters for Capacitor Preferences, localStorage and
     in-memory (tests).
  4. `settings`: settings model (sound, music, haptics, reduced motion,
     high-contrast/colour-blind-safe toggle) persisted via `save`.
  5. `audio`: WebAudio manager with unlock on first user gesture, sfx playback
     by id, one music loop with fade, master/sfx/music volume, mute honouring
     settings, safe no-op when `AudioContext` is missing.
  6. `haptics`: wrapper over `@capacitor/haptics` with a web no-op, honouring
     settings.
  7. `share`: `@capacitor/share`, then `navigator.share`, then clipboard
     fallback, returning which path was used.
  8. `lifecycle`: pause/resume events, Android back-button routing via
     `@capacitor/app`, status bar setup, portrait lock via
     `@capacitor/screen-orientation`; all no-ops on web where unavailable.
  9. `router`: tiny typed screen stack (push/pop/replace, back handling).
  10. `ui`: Preact primitives themed only by CSS custom properties: `Screen`
      (safe-area aware), `Button`, `IconButton`, `Sheet`/`Modal`, `Toggle`,
      `Tabs`, `Toast`, `StarRating`, `ProgressBar`, `Card`, plus a
      `ThemeTokens` type and `applyTheme()`.
  11. `fonts`: `@font-face` registration helper and a test helper that asserts
      no text falls back to the platform default font.
  12. `assets`: image preloader with progress and an asset-budget helper usable
      from tests.
  13. `motion`: reduced-motion aware tween/spring helpers based on the Web
      Animations API.
  14. `strings`: typed string table helper (English only).
- `src/index.ts` re-exports the public API with named exports. Add a
  `README.md` explaining each module with short examples.
- Add `test/architecture.test.ts`: `rng`, `daily` and the `save` core (not its
  adapters) must not reference `Date.now`, `Math.random`, `window`, `document`
  or `localStorage`.

## Implementation Checklist

- [x] Verify the branch is `feat/web-games-kit`; look up and record the pinned
      versions (including `@capacitor/share`) in the evidence README.
- [x] Scaffold `apps-games/web-kit`: `package.json`, `tsconfig.json` (strict, DOM
      lib), `tsconfig.build.json`, `vitest.config.ts` (happy-dom), `src/index.ts`.
- [x] Implement and test `rng` and `daily`.
- [x] Implement and test `save` (schema, migrations, corrupt recovery, three
      adapters) and `settings`.
- [x] Implement and test `audio` (including the missing `AudioContext` path) and
      `haptics`.
- [x] Implement and test `share` (all three paths and the returned path name)
      and `lifecycle` (web no-ops).
- [x] Implement and test `router`.
- [x] Implement and test the `ui` primitives, `ThemeTokens` and `applyTheme()`.
- [x] Implement and test `fonts`, `assets`, `motion` and `strings`.
- [x] Write `README.md` with one short example per module.
- [x] Run `bun install` (the only `bun.lock` changes are the kit's dependencies).
- [x] Update `biome.json` and `knip.json` for `apps-games/web-kit` if the
      existing City Drive globs do not already cover it.
- [x] Update the knowledge base `.agents/games/web-games-kit/` (README, product,
      economy, store-listing, assets-index, decisions-log, open-questions) with
      the module list and the pin decisions.
- [x] Write `.agents/resources/2026-10-23/web-games/web-games-kit/01/README.md`
      (versions, `npm view` output summary, test counts).
- [x] Tick task 01 in `STATUS.md`.

## Files Touched

- `apps-games/web-kit/**` (new)
- `package.json` (only if a workspace entry is needed), `bun.lock`,
  `biome.json`, `knip.json`, `tsconfig*.json` (only if needed)
- `.agents/games/web-games-kit/**`
- `.agents/resources/2026-10-23/web-games/web-games-kit/01/README.md`
- `tasks/epics/18-web-games-kit/STATUS.md`

## Acceptance Criteria

- All 14 modules exist, are exported from `src/index.ts`, and each has tests
  that pass in happy-dom; failure paths (corrupt save, missing `AudioContext`,
  missing Capacitor plugin, no `navigator.share`) are covered.
- Every dependency in `apps-games/web-kit/package.json` is exact-pinned (no
  `^`, `~`, `*` or tags); versions match City Drive's, and `@capacitor/share` is
  the newest stable 8.x.
- No dependency exists beyond `preact`, the `@capacitor/*` packages above and
  the dev tools listed in the pin rule.
- `apps-games/web-kit/README.md` documents every module with an example.
- Code files are under 800 lines; no `any`.
- All five verification commands below pass (the registry test file does not
  exist until task 02; until then report that command as not applicable and
  prove the registry tests that do exist still pass with `bun test
  --max-concurrency=1 scripts/games/*.test.ts` compared against `origin/main`).
- No browser, Playwright or screenshot was used.

## Verification Commands

- `bun run --filter '@web-games/*' typecheck`
- `bun run --filter '@web-games/*' test`
- `bun run --filter '@web-games/*' build`
- `bunx biome check apps-games scripts/games`
- `bun test --max-concurrency=1 scripts/games/registry-web.test.ts`

## Out of Scope

- Any game rules, content, art, fonts or audio files (kit code only; test
  fixtures are synthetic).
- Game skeletons, registry entries, CI and docs (tasks 02 and 03).
- Capacitor native projects (`android/`, `ios/`) and `cap sync`.
- Visual QA, browsers, devices, APK builds.
- Changing City Drive or any other existing package.

## Commit message

`feat(web-games-kit): add shared web-games kit package [18-web-games-kit/01]`
