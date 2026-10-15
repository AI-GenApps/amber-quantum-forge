# City Drive — decisions log

All decisions below come from `tasks/epics/17-city-drive/STATUS.md`
(user decisions and the 2026-10-15 research). Research facts and URLs are
also in `.agents/resources/2026-10-15/city-drive-qa/00/README.md`.

## User decisions (2026-10-15)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-10-15 | Engine: **Babylon.js** (TypeScript, Vite). **Unity is forbidden.** | Unity is ruled out by the user. Flutter has no production-ready 3D stack, so City Drive is the portfolio's first non-Flutter game. |
| 2026-10-15 | Packaging: **Capacitor 8** for Android and iOS; the same build runs in browsers | One web codebase for three targets. Capacitor 8 needs Node 22+, minSdk 24 / targetSdk 36, iOS 15+ (see research below). |
| 2026-10-15 | Core loop (v1): **free roam plus missions**; missions are grouped into districts that unlock by stars | Missions/career is the top retention driver for the genre (see research below). |
| 2026-10-15 | Economy (v1): **coins and car unlocks only**. Coins come from missions; coins unlock cars. **No ads, no IAP, no accounts, no real money.** | Clean offline first release; commerce is deferred (`economy.md`). |
| 2026-10-15 | Save: local only (Capacitor Preferences on device, `localStorage` on web), versioned with migrations | No accounts and no network in v1. |
| 2026-10-15 | Location: `apps-games/city-drive` (app) + `apps-games/city-drive-core` (pure-TS simulation); `apps-games/*` becomes a Bun workspace glob | Keeps the simulation free of Babylon and the DOM so it is headless-testable. |
| 2026-10-15 | Visual QA: **no browser QA by agents** (no Playwright, Chromium, or screenshot passes). Agents verify logic headlessly (Vitest, Babylon `NullEngine`). Every visual judgement is an `owner: human` checkpoint (tasks 08, 16, 22). | No browser or device exists on the build server. |
| 2026-10-15 | Branch: everything on `main`, one commit per task, never push | Matches the epic execution protocol. |
| 2026-10-15 | Working title "City Drive"; registry id `city_drive`; slug `city-drive`; public name picked at task 19 | Name needs the strict uniqueness check first (task 18). |
| 2026-10-15 | Disk policy: everything installed, downloaded or cached goes under `/data/tools` (toolchains `/data/tools/<name>`, caches `/data/tools/cache/*`, scratch `/data/tools/tmp/<task-id>/`); never `/tmp`, `$HOME` or `sudo` | The root filesystem has only about 20 GB free. |

## Technical decisions (2026-10-15 research)

| Date | Area | Choice | Why |
|---|---|---|---|
| 2026-10-15 | Rendering | `@babylonjs/core` + `@babylonjs/loaders`, exact-pinned (9.31.0 at research time; never `^`); deep ES6 imports only | Weekly minors ship; the bare barrel import defeats tree shaking. |
| 2026-10-15 | Graphics API | WebGL2 baseline; WebGPU out of scope for v1 | Android WebView has no WebGPU (caniuse.com/webgpu, `android` column). |
| 2026-10-15 | Physics | Rapier (`@dimforge/rapier3d-compat`, exact-pinned, 0.21.0 at research time) with `DynamicRayCastVehicleController` | Babylon/Havok has no native vehicle controller: the 9.31.0 tarball has no vehicle code under `Physics/`. Rapier ships the controller (rapier.rs/docs/user_guides/javascript/vehicle_controller) and documents cross-platform determinism (rapier.rs/docs/user_guides/javascript/determinism). The compat build inlines its wasm, so it runs under Vitest with no file loading. |
| 2026-10-15 | Simulation step | Fixed 1/60 s, decoupled from `requestAnimationFrame` | Headless tests and replays depend on it. Babylon only renders. |
| 2026-10-15 | UI | DOM overlay (HTML/CSS + Preact) above the canvas; no Babylon GUI | Cheap, accessible, testable with Vitest + happy-dom. |
| 2026-10-15 | Fonts | Russo One (display) + Saira (body), both OFL, bundled | Portfolio rule: no screen renders the platform default font. |
| 2026-10-15 | Assets | Kenney CC0 only: City Kit (Roads, Commercial, Suburban) and Car Kit, as GLB. **No Quaternius.** | Kenney is CC0 (kenney.nl). Quaternius moved to the non-CC0 "Quaternius Asset License" on 2026-08-28 (quaternius.com/license.html). A licence record is kept for every pack. |
| 2026-10-15 | Asset decoders | No Draco. Meshopt/KTX2 only with self-hosted decoders | Babylon's decoders default to the CDN and the app must work offline. |
| 2026-10-15 | Performance budget (low-end Android) | At most 100 draw calls (target below 60), at most 150k visible triangles, adaptive hardware scaling 1.0 to 2.0 | Enforced by a headless budget test from task 06 on. |
| 2026-10-15 | Tests | Vitest everywhere; simulation fully headless; scene budgets via `NullEngine` in Node | No browser on the server. |
| 2026-10-15 | Capacitor plugins | haptics, preferences, screen-orientation (landscape), status-bar, community keep-awake. **No AdMob, no RevenueCat in v1.** | Matches the no-ads, no-IAP decision. |
| 2026-10-15 | Toolchain pin | Bun 1.4.2 on this server while the repo pins 1.3.3; the pin is not changed in this epic | Out of scope; avoids touching CI. |

## Research findings (gathered 2026-10-15)

### Competitors (Google Play tiers, 2026-10-15)

| Game | Installs | Rating | Link |
|---|---|---|---|
| Dr. Driving | 500M+ | 4.3 | https://play.google.com/store/apps/details?id=com.ansangha.drdriving |
| Extreme Car Driving Simulator | 500M+ | 4.3 | https://play.google.com/store/apps/details?id=com.aim.racing |
| Car Parking Multiplayer | 100M+ | 4.5 | https://play.google.com/store/apps/details?id=com.olzhas.carparking.multyplayer |
| Drive Zone | 100M+ | 4.5 | https://play.google.com/store/apps/details?id=com.drivezone.car.race.game |
| Taxi Car Simulator: EVO | 10M+ | 4.5 | https://play.google.com/store/apps/details?id=com.ovilex.taxisim2019 |

All of them ship ads and IAP. City Drive's v1 differentiator is an offline,
no-ads, no-IAP mission game.

### Genre data and retention

- CrazyGames driving genre: about **8.7 minutes** average playtime and about
  **5.7%** day-1 retention. Source: https://docs.crazygames.com/resources/monetizing-driving/
- Retention drivers: missions/career, car unlocks, customization, daily
  challenges, login streaks. v1 takes missions and car unlocks; the rest are
  deferred (`economy.md`).

### Engine and platform facts

- **Babylon/Havok has no native vehicle controller.** Rapier does:
  https://rapier.rs/docs/user_guides/javascript/vehicle_controller and
  https://rapier.rs/docs/user_guides/javascript/determinism
- **Android WebView has no WebGPU:** https://caniuse.com/webgpu (`android` column)
- **Kenney City Kit and Car Kit are CC0:** https://kenney.nl
- **Quaternius moved to a non-CC0 licence on 2026-08-28:** https://quaternius.com/license.html
- **Capacitor 8** requires Node 22+, minSdk 24 / targetSdk 36, iOS 15+
  (Capacitor documentation, https://capacitorjs.com/docs; task 17 re-verifies
  against the installed version).
