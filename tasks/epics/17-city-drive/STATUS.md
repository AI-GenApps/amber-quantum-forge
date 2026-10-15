# Epic 17 — City Drive (3D city-driving game, Babylon.js + Capacitor)

Status: pending

## Purpose

Build a seventh game: a **3D low-poly city-driving game** where the player
free-roams a small city and takes missions (deliveries, taxi pickups, time
trials, parking). It is built with web tech (Babylon.js + TypeScript),
packaged for Android and iOS with Capacitor, and also playable in desktop and
mobile browsers. Unity is not allowed, and Flutter has no production-ready 3D
stack, so this is the portfolio's first non-Flutter game.

"City Drive" is a **working title**. The registry id is `city_drive` and the
knowledge-base slug is `city-drive`. The public name is picked at task 19.

## Decisions (user, 2026-10-15)

| Decision | Choice |
|---|---|
| Engine | **Babylon.js** (TypeScript, Vite). Unity forbidden. |
| Packaging | **Capacitor 8** for Android/iOS; the same build runs in browsers |
| Core loop (v1) | **Free roam + missions**: drive a city with mission markers; missions grouped into districts that unlock by stars |
| Economy (v1) | **Coins + car unlocks only.** Coins come from missions; coins unlock cars. **No ads, no IAP, no accounts, no real money.** |
| Save | Local only (Capacitor Preferences on device, `localStorage` on web), versioned with migrations |
| Location | `apps-games/city-drive` (app) + `apps-games/city-drive-core` (pure-TS simulation). `apps-games/*` becomes a Bun workspace glob. |
| Visual QA | **No browser QA by agents.** No Playwright, Chromium, or screenshot passes. Agents verify logic headlessly (Vitest, Babylon `NullEngine`). Every visual judgement is an `owner: human` checkpoint (tasks 08, 16, 22). |
| Branch | Everything on `main`, one commit per task, never push |

## Technical decisions (from the 2026-10-15 research)

| Area | Choice | Why |
|---|---|---|
| Rendering | `@babylonjs/core` + `@babylonjs/loaders`, **exact-pinned** (9.31.0 at research time; weekly minors ship, so never use `^`) | Deep ES6 imports only (`@babylonjs/core/…/x.js`), never the barrel import |
| Graphics API | **WebGL2 baseline**; WebGPU is out of scope for v1 | Android WebView has no WebGPU |
| Physics | **Rapier** (`@dimforge/rapier3d-compat`, exact-pinned; 0.21.0 at research time), with its `DynamicRayCastVehicleController` | Babylon/Havok has no vehicle controller. Rapier is documented as deterministic, and the compat build inlines its wasm, so it runs under Vitest with no file loading. Babylon only renders; the simulation never imports Babylon. |
| Simulation step | Fixed 1/60 s, decoupled from `requestAnimationFrame` | Headless tests and replays depend on it |
| UI | DOM overlay (HTML/CSS + **Preact**) above the canvas; no Babylon GUI | Cheap, accessible, testable with Vitest + happy-dom |
| Fonts | **Russo One** (display) + **Saira** (body), both OFL, bundled | Portfolio rule: no screen renders the platform default font |
| Assets | **Kenney CC0 only**: City Kit (Roads, Commercial, Suburban) and Car Kit, as GLB. **No Quaternius** (its licence changed to the non-CC0 QAL in 2026-08). | A licence record is kept for every pack |
| Asset decoders | No Draco. Meshopt/KTX2 are allowed only if their decoders are **self-hosted** (offline app) | Babylon's decoders default to the CDN |
| Performance budget (low-end Android) | At most **100 draw calls** (target < 60), at most **150k visible triangles**, adaptive hardware scaling from 1.0 to 2.0 | Enforced by a headless budget test from task 06 on |
| Tests | Vitest everywhere. The simulation is fully headless. Scene budgets are checked with `NullEngine` in Node. | |
| Capacitor plugins | haptics, preferences, screen-orientation (landscape), status-bar, community keep-awake. **No AdMob, no RevenueCat in v1.** | |

## Environment (this server)

- **Tools:** Bun 1.4.2 (the repo pins 1.3.3 in `toolchain.json` and CI; do not change the pin in this epic) and Node 24. `codex` is at `~/.local/bin/codex`.
- **Not installed:** JDK, Android SDK, Flutter, Xcode. `/data/tools` does not exist.
- **Do not use:** the Flutter `games:*` commands (format, analyze, test, build, doctor). They need Flutter and are expected to fail or report NOT RUN here. `bun run games:test:tooling` runs, but at HEAD 8 of 43 tests fail for environment reasons (Bun pin, missing dart/flutter, 5 stale counts that task 02 fixes). It also rewrites a frozen generated Dart file, so always follow it with `git checkout -- apps-native/`.
- **Android builds:** task 17 may install **JDK 21** (Capacitor 8 / AGP 8.13 need Java 21) and the Android SDK under `/data/tools/` (the portfolio convention). If a licence prompt needs a human, the task returns blocked with the exact command.
- **Not available:** devices, emulators, and browser QA. Device and visual steps are always reported **NOT RUN**, never faked.

## Disk policy (user, 2026-10-15)

The root filesystem (`/`, `/home`, `/tmp`) has only about 20 GB free. **Everything installed, downloaded or cached goes under `/data/tools`:**

| What | Where |
|---|---|
| Toolchains (JDK 21, Android SDK, anything else) | `/data/tools/<name>` |
| Bun / npm / Gradle / XDG caches | `/data/tools/cache/{bun,npm,gradle,xdg}` (set by the workflow's env prefix) |
| Scratch downloads, extracted archives, throwaway HEAD worktrees | `/data/tools/tmp/<task-id>/`, deleted when the task ends |

Never `/tmp` or `$HOME`, and never `sudo`. `/data/tools` must exist and be owned by the user before the run (created once by the human).

## Dry-run review (2026-10-15)

A read-only Sonnet dry run reviewed every task against the repo. Its fixes are appended to each affected task file under **"Dry-run amendments"**, which take precedence over the original text.

## Shared-code caution

Another session owns Ludo (`apps-native/games/ludo`, `packages/ludo_rules`,
`apps-native/unity/ludo`, `tasks/epics/15-ludo-launch`,
`packages/api/src/games/ludo`), and epic 16's Merge Relay work is done. Both
are **frozen**. This epic's only edits outside `apps-games/` are the
small, listed changes to:

- `package.json`
- `biome.json`
- `knip.json`
- `scripts/games/*`
- `.github/workflows/*`
- `tasks/STATUS.md`
- `.agents/games/city-drive/`

## Execution order

Filename order is execution order. The workflow
`.claude/workflows/city-drive-sequential.js` (args:
`.claude/workflows/city-drive-args.json`) implements, independently verifies
(at most 2 fixes), and commits each task in sequence with **Sonnet agents only**.
**It stops at every `owner: human` task (08, 16, 19, 22).** The human
completes that task, marks it `[x]` here, commits, and resumes the workflow
with `startAt` set to the next task ID.

## Tasks

| ID | Task | Owner | Status |
|---|---|---|---|
| 00 | Knowledge base, decisions, competitor notes | agent | [ ] |
| 01 | Workspace scaffold (`apps-games/*`, Vite, Vitest, lint/knip wiring) | agent | [ ] |
| 02 | Games registry `engine: "web"` + City Drive CI workflow | agent | [ ] |
| 03 | Vehicle physics core (Rapier raycast vehicle, fixed step, determinism) | agent | [ ] |
| 04 | CC0 asset pipeline (Kenney kits → GLB, licence records, budgets) | agent | [ ] |
| 05 | City map format, road graph, static colliders | agent | [ ] |
| 06 | Babylon city renderer + headless draw-call/triangle budget test | agent | [ ] |
| 07 | Player car, touch/keyboard controls, chase camera | agent | [ ] |
| 08 | HUMAN: first-drive checkpoint (browser, desktop + phone) | human | [ ] |
| 09 | AI traffic on the road graph | agent | [ ] |
| 10 | Mission engine (delivery, taxi, time trial, parking; stars) | agent | [ ] |
| 11 | Three districts + 24 validated missions + free-roam markers | agent | [ ] |
| 12 | Economy: coins, car roster + unlocks, versioned local save | agent | [ ] |
| 13 | UI screens + HUD (home, map, garage, results, pause, settings) + fonts | agent | [ ] |
| 14 | Audio, haptics, first-drive onboarding | agent | [ ] |
| 15 | Performance pass (adaptive scaling, freezing, LOD, budget gate) | agent | [ ] |
| 16 | HUMAN: full browser playtest checkpoint | human | [ ] |
| 17 | Capacitor packaging (Android/iOS), Android toolchain, debug APK | agent | [ ] |
| 18 | Name candidates (strict uniqueness) + icon dry run | agent | [ ] |
| 19 | HUMAN: pick the name + icon direction | human | [ ] |
| 20 | Apply the name, final icon, splash | agent | [ ] |
| 21 | Release readiness (privacy, data safety, listing, web deploy workflow) | agent | [ ] |
| 22 | HUMAN: device checkpoint, Vercel project, store provisioning | human | [ ] |

## Evidence

Every research note, budget report, licence record, and generated image goes
under `.agents/resources/2026-10-15/city-drive-qa/<task-id>/` with a
`README.md`, and is committed with its task. Art masters go under
`.agents/resources/2026-10-15/city-drive-art/<set>/`.

The research that shaped this epic is summarized in
`.agents/games/city-drive/decisions-log.md` (task 00).
