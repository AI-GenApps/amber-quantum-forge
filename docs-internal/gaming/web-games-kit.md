---
title: Web games kit
description: Architecture, conventions and CI for the shared @web-games/kit package and the six web games (Preact, Vite, Capacitor 8) built on it.
---

# Web games kit

Six web games share one foundation, `@web-games/kit`, so each game branch only adds game code.
Progress is tracked in [`tasks/epics/18-web-games-kit/STATUS.md`](https://github.com/ashutoshpw/amber-quantum-forge/blob/main/tasks/epics/18-web-games-kit/STATUS.md).

| Epic | Game | Slug |
|---|---|---|
| 19 | Lantern Loops | `lantern-loops` |
| 20 | Floodplain Dispatch | `floodplain-dispatch` |
| 21 | Cloud Observatory | `cloud-observatory` |
| 22 | The Last Window | `the-last-window` |
| 23 | Dress Rehearsal | `dress-rehearsal` |
| 24 | Lost Parcel Desk | `lost-parcel-desk` |

Stack: TypeScript, Preact, Vite, Vitest (happy-dom) and Capacitor 8. Rendering is DOM, SVG or
Canvas 2D. No game engine and no extra library. v1 has no monetization, no accounts and no network
calls.

## Architecture: kit, app, core

```
apps-games/
  web-kit/            @web-games/kit              framework code, no rules, no content
  <slug>/             @web-games/<slug>           Preact app, screens, art, audio, Capacitor
  <slug>-core/        @web-games/<slug>-core      pure headless TypeScript game rules
```

- **kit** holds everything games share: save, daily seed, settings, audio, haptics, share,
  lifecycle, router, UI primitives, fonts, assets, motion and strings. Source is consumed directly
  (`exports` points at `src/index.ts`); the kit has no bundling step.
- **core** holds the rules: state, moves, scoring, level generation, daily generation. It is pure
  TypeScript so it runs headless in Vitest with no DOM, which makes rules deterministic and fast to
  test. `test/architecture.test.ts` in every core fails if `src` mentions `window`, `document`,
  `Date.now`, `performance.now`, `Math.random` or `localStorage`. Time and randomness are injected.
- **app** wires core to the screen: screens, rendering, input, audio, haptics, persistence, theme
  and the Capacitor config. The app depends on core, never the reverse.

## Kit modules

| Module | What it does |
|---|---|
| `rng` | Seedable sfc32 generator, string hashing, `pick`, `shuffle`, `fork` streams, state save and restore |
| `daily` | `localDateKey`, `dailySeed`, `dayNumber`, `streakStep` for device-date daily modes |
| `save` | Versioned save slots with ordered migrations, corrupt-data recovery and storage adapters |
| `settings` | Sound, music, haptics, reduced motion and high contrast toggles persisted through `save` |
| `audio` | WebAudio manager: unlock on first gesture, sfx by id, cross-fading music, volumes, mute |
| `haptics` | `@capacitor/haptics` on device, silent on the web, honours the haptics setting |
| `share` | `@capacitor/share`, then `navigator.share`, then clipboard; never throws |
| `lifecycle` | Pause and resume, Android back button, status bar and portrait lock |
| `router` | Typed screen stack with back interceptors for sheets and tutorials, plus Preact hooks |
| `ui` | Preact primitives themed by `--wg-*` CSS custom properties (Screen, Button, Sheet, Modal, Toggle, Tabs, Toast, StarRating, ProgressBar, Card) |
| `fonts` | `@font-face` registration for bundled woff2 plus a test helper proving no platform fallback |
| `assets` | Image preloader with progress and an asset-budget check for tests |
| `motion` | Reduced-motion-aware tween and spring helpers over the Web Animations API |
| `strings` | Typed English string table with compile-time checked placeholders |

Every platform wrapper degrades to a safe no-op when the API or Capacitor plugin is missing, and
anything that reads time, randomness or the platform takes it as an injected parameter.

## How a game is structured

```
apps-games/<slug>/
  index.html  vite.config.ts  vitest.config.ts  tsconfig.json  capacitor.config.ts
  package.json
  public/fonts/       woff2 plus OFL.txt (added by the game epic)
  public/audio/       CC0 files plus a licence record (added by the game epic)
  src/main.tsx        injectKitStyles, setupDisplay({ lockPortrait: true }), render
  src/App.tsx         skeleton title screen; game epics render screens from the router
  src/brand.ts        GAME_TITLE (kept in sync with capacitor.config.ts by a test)
  test/
apps-games/<slug>-core/
  src/index.ts  test/architecture.test.ts  test/version.test.ts
```

Scripts per app: `dev`, `build` (`vite build`), `preview`, `test`, `typecheck`, `cap:sync`
(`vite build && cap sync`). Per core: `test`, `typecheck`, `build`. Root scripts fan out across the
workspace:

```bash
bun run web-games:typecheck   # bun run --filter '@web-games/*' typecheck
bun run web-games:test
bun run web-games:build
```

Screens go through the kit router: define a typed `Routes` map, call `router.push`, let sheets and
tutorials register back interceptors so the Android back button closes them first. The app owns
presentation; the core owns every rule, so a screen never computes game logic itself.

## Save conventions

- One versioned slot per concern (`<slug>.profile`, `<slug>.settings`) through `createSaveStore`,
  stored as a `{ v, data }` envelope.
- Every shape change bumps `version` and adds an entry to `migrations`; `parse` validates the
  result.
- `createDefaultAdapter()` uses Capacitor Preferences on device, `localStorage` on the web and
  memory otherwise. Tests use `createMemoryAdapter()`.
- Corrupt data is never deleted: it is copied to `<key>.corrupt` and replaced by defaults.
  `load()` never throws and reports `fresh`, `loaded`, `migrated` or `recovered`.
- Local save only. No accounts, no sync.

## Daily conventions

- The date key comes from `localDateKey(clock)` in the device time zone, for example `2026-10-23`.
- The seed is `dailySeed(gameId, dateKey)`, so the same device date always gives the same puzzle.
- The daily is generated on the device from that seed. No server, no network.
- Streaks use `streakStep(last, today)`, which treats a clock that went backwards as its own state.

## Audio conventions

- CC0 only: Kenney audio packs or a page that explicitly states CC0.
- Record the source URL and licence for every file in the game's asset index.
- Never synthesize audio and call it CC0.
- The audio context is unlocked on the first gesture (`installUnlock`) and suspended on pause.

## Fonts

- OFL fonts named in the game spec, downloaded from `github.com/google/fonts`.
- Bundled as woff2 under the app's `public/fonts` with `OFL.txt`, registered with
  `registerFonts`.
- No rendered text may fall back to the platform default font. Tests call
  `assertNoPlatformFontFallback` against the rendered screens.

## Art pipeline

All graphics come from the MobileGamesDesigner T3 thread and must pass a strict art review before
integration. Nothing that fails review is integrated, and there is no placeholder AI art. Review
evidence is committed under `.agents/resources/<date>/web-games/<topic>/`.

## Pin rule

Exact-pin every dependency. Reuse the exact versions already used by
`apps-games/city-drive/package.json` for preact, vite, vitest, typescript, happy-dom, sharp,
`@types/node` and every `@capacitor/*` package it uses. `@capacitor/share` is the newest 8.x
release, exact-pinned. Add no other runtime dependency to the kit or any skeleton. The kit's
`test/architecture.test.ts` fails if a pin loosens or a dependency is added.

## Scope fence

A game epic may edit only its own `apps-games/<slug>/**`, `apps-games/<slug>-core/**` and
`.agents/games/<slug>/**`, plus its task files and evidence. Kit changes land through the kit epic.
Game branches must not touch `bun.lock`. City Drive, the Flutter games, Ludo and Merge Relay are
read-only for this work.

## QA

QA is browser-only and done by the owner at the end. Agents never open a browser, Playwright, a
simulator, an emulator or a device, never screenshot the app, and never build an APK. Agents verify
headlessly with Vitest (happy-dom), `tsc`, `vite build` and Biome.

## CI

`.github/workflows/web-games-ci.yml` runs on pull requests and on pushes to `main`, filtered to the
kit, the six apps and cores, `bun.lock`, `package.json` and the workflow file. The Bun version is
read from the `packageManager` field of the root `package.json`. Steps run in order:
`bun install --frozen-lockfile`, `bun run web-games:typecheck`, `bun run web-games:test`,
`bun run web-games:build`. The job has `contents: read` permissions, cancels superseded runs and
times out after 20 minutes. There are no browser, device, deploy or store jobs.
`scripts/games/web-games-ci-workflow.test.ts` pins these properties.

Local gate before a commit:

```bash
bun run --filter '@web-games/*' typecheck
bun run --filter '@web-games/*' test
bun run --filter '@web-games/*' build
bunx biome check apps-games scripts/games
bun test --max-concurrency=1 scripts/games/registry-web.test.ts
```
