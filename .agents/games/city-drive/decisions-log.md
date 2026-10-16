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

## Task 03: vehicle physics core (2026-10-15)

Rapier `DynamicRayCastVehicleController` inside `@city-drive/core`
(`src/physics/**`, `src/cars/**`). Fixed step 1/60 s through a pure `SimClock`.
Baseline car values live in `apps-games/city-drive-core/src/cars/specs.ts`
(`BASELINE_CAR`); task 12 adds the roster and reuses
`test/physics/handling-suite.ts` over each `CarSpec`.

| Value | Setting | Why |
|---|---|---|
| Mass / chassis | 1200 kg, box 1.7 x 0.9 x 4.2 m, centre of mass 0.35 m below centre | Low CoM keeps the car upright at full lock |
| Wheels | 4, radius 0.35 m, wheelbase 2.5 m, track 1.6 m; front steered, rear driven (RWD) and handbrake | Handbrake on driven rear wheels gives a drift |
| Suspension | rest 0.35 m, travel 0.3 m, stiffness 30, compression 0.83, relaxation 0.88, max force 60 kN | Settles in under 1 s without bouncing |
| Engine | 6000 N total, faded by `1 - (v/115 km/h)^3`; reverse is 60 % force, capped at 30 km/h | 0-60 km/h in 3.6 s, top speed 110 km/h |
| Brakes | 12000 N total (about 1 g), coast brake 4 % | 60 km/h to 0 in 13.5 m |
| Brake units | Rapier's wheel brake is an impulse limit per step, so the code passes `force * dt` | Passing newtons directly stopped the car in 0.2 s |
| Steering | 0.5 rad max, speed limit `wheelbase * 1.4 g / v^2` with a 0.05 rad floor; rate 3.5 rad/s | Keeps lateral G near 1.4 at any speed; the car stays upright at full lock at 110 km/h |
| Grip | friction slip 2.6; handbrake wheels use 35 % | A handbrake turn at 60 km/h gives about 3.2 rad/s yaw and does not flip |
| Damping | linear 0.02, angular 0.6 | Stops spin from building up |
| Axes | forward +Z, up +Y; steer +1 is right, which gives negative `yawRate` | Rapier engine force is positive along local +Z for this setup (verified by test) |

- **Determinism:** no platform trig in `src/` (a test scans for `Math.sin`,
  `Math.cos` and similar). `quatFromYaw` uses `detSin`/`detCos`, a degree-21
  Taylor series with error below 1e-9. The state hash rounds position,
  rotation and velocity to 1e-4 and leaves out visual wheel spin.
- **Fixture:** `test/fixtures/determinism.json` is written only by
  `bun run fixture:determinism` (Bun/JavaScriptCore) and compared inside
  Vitest (Node/V8), so the match also proves equal results across two engines.
- **Snapshot restore:** `takeSnapshot()` restores only the physics world. The
  `Car` rebuilds its controller from the `CarSpec` on `rebind()` and re-applies
  the wheel commands. The result is bit-exact against an uninterrupted run, so
  the 1e-3 tolerance fallback was not needed.
- **State for later tasks:** `Car.state()` returns velocity, yaw rate,
  smoothed longitudinal/lateral G (taxi comfort, task 10) and per-wheel slip
  (friction use, 0 rolling to 1 at the limit; skid audio, task 14).
  `PhysicsWorld.drainCollisionImpulses()` returns contact-force events for
  tasks 09 and 10.
- **CCD** is on for the chassis; a 0.2 m wall is not tunnelled at 110 km/h.

## Task 04 — CC0 asset pipeline (2026-10-15)

- **Uncompressed GLB.** 42 models total 2.36 MB against an 8 MB budget, so no meshopt or
  Draco is used and no decoder is shipped. Uncompressed GLBs also parse under Node
  `NullEngine`, which the budget tests of later tasks need.
- **Tooling:** `@gltf-transform/{core,functions,extensions,cli}` 4.5.1 and `sharp` 0.35.3, all
  exact-pinned dev dependencies. The script drives the library API (dedup, prune, weld,
  textureCompress at most 512 px); the CLI is used for `--validate`.
- **Triangle counts per node instance.** `dedup` merges identical meshes (the four car wheels), so
  triangles are summed per node, which matches what the renderer draws.
- **No bench** exists in the four Kenney packs; `prop-planter` is the street-furniture stand-in.
  No other pack was added (Kenney only, no Quaternius).
- **Road mapping:** `road-corner` = `road-bend`, `road-t` = `road-intersection` (3-way),
  `road-crossroads` = `road-crossroad` (4-way).
- **Raw packs** stay outside git (`assets-src/raw/`, gitignored). Without them the script verifies
  the committed manifest, budgets and licence records and exits 0.

## Task 07 — Player car, controls, chase camera (2026-10-15)

- **Handedness.** The simulation and city map are right-handed; Babylon draws them left-handed, so
  the screen is a mirror image. The player's steer is negated in `toCarInput` so "right" turns toward
  the screen's right (tested with the mesh's own right vector). Open for task 08: the map looks
  mirrored against its compass description, and right-hand traffic appears on the screen's left.
- **Task 06 fix.** `AssetCache.dispose()` no longer disposes textures (the pack materials share
  them); a disposed texture is never ready in WebGL, which would have hidden the whole city.
- **Respawn rules** live in core (`RespawnDetector`): tilt over 70 degrees for 2 s, or under 1 km/h
  on full throttle for 4 s. Target is the nearest lane point (`laneRespawn`), facing the lane.
- **Camera occlusion** is a pure slab-test ray against the collider boxes (`raycastBoxes`, core).
- **Input**: keyboard, touch (steer ramp 0.25 s up, 0.15 s down) and an optional gamepad merge with
  "larger absolute value wins". The simulation reads input once per fixed step; reset is edge-triggered.
- **Car visual**: Kenney `car-sedan` split into body and 4 wheel meshes; scaled so its wheel radius
  matches physics (x1.167). Cost: 6 draw calls, about 2,050 triangles (worst pose 49 draws, 125k tris).

## Task 08a — Render the scene right-handed (2026-10-15)

- **Decision.** Every Babylon scene is right-handed (`scene.useRightHandedSystem = true`), set in one
  place, `apps-games/city-drive/src/render/scene.ts` (`createScene`), which the city and every test
  scene use. Rapier and the map were already right-handed, so no coordinate is converted: a mesh at
  simulation (x, y, z) is at world (x, y, z). Closes open question 7.
- **Steering.** The negation in `toCarInput` is deleted: player right (+1) is the simulation's right
  turn (+1). The car's right is forward x up, which is -X when it faces +Z, and the east lane of a
  north-facing road.
- **glTF content.** With a right-handed scene Babylon's loader adds no `__root__` mirror, so the
  baked templates and car parts are the artwork as authored. A new `Mesh` defaults to the clockwise
  winding of builder meshes, so `buildTemplate` and `buildCarParts` copy the loader mesh's side
  orientation (counter-clockwise). Builder meshes (ground, plaza pads) keep Babylon's default.
- **Road yaw offsets re-derived** against the unmirrored geometry: `road-corner` 270 -> 180,
  `road-end` 270 -> 90; `road-straight` and `road-crossing` stay 90; `road-t` and `road-crossroads`
  stay 0. Every district-1 road tile is checked against its sockets by `road-alignment.test.ts`.
- **Camera.** The chase-camera maths needed no change (it works in simulation coordinates). Tests that
  read the camera's forward axis must use `Vector3.Forward(scene.useRightHandedSystem)`, which is
  -Z in a right-handed scene.
- **Not changed.** The `?debugcam` orbit camera keeps its start angle (it now looks from the north
  edge, so east is on its left); visual polish is for the human checkpoint.


## Task 10 — Mission engine (2026-10-16)

- **Where it lives.** Pure rules in `apps-games/city-drive-core/src/missions/` (no Babylon, no DOM,
  nothing reads a clock). The app only draws (`render/mission*.ts`) and shows a minimal DOM panel
  (`ui/mission-debug/`). Task 13 restyles the UI; the `MissionHud` and `MissionResult` shapes stay.
- **State machine.** `idle -> briefing -> active -> success | fail -> results -> idle`. `MissionRun`
  throws on any other transition. Pausing (`GameSession.setPaused`) stops the whole simulation, so
  the mission clock stops too. Fail reasons: `time_out`, `damage_limit` (delivery damage or parking
  touches), `comfort_zero`, `quit`.
- **Stars.** A completed mission is worth at least one star; tiers 2 and 3 are tested from three down.
  Time thresholds are compared in whole 1/60 s steps, so a boundary is exact. Reaching the goal on
  the last allowed step still succeeds (time out is `ticks > limit`).
- **Hits (damage / touches).** `HitDetector` counts a contact-force event on the player's chassis when
  its impulse is at least 400 N*s (force x 1/60 s), then ignores the rest of that crash for 30 steps.
  Buildings, boundary walls, parked cars and AI cars all count (every contact with the chassis
  collider is reported by Rapier).
- **Taxi comfort.** Starts at 100 once the passenger is aboard. Loses 100 per g per second above 0.35 g
  (longitudinal) and 0.4 g (lateral), and 25 per hit. 0 ends the ride.
- **Parking.** All four corners of the car inside the bay (0.15 m tolerance), within 15 degrees of the
  bay axis (either direction), under 1 km/h, for 60 steps in a row. The bay sits to the right of its
  lane point (`lateral_offset_m`) and is flanked by two static parked cars `flank_gap_m` (default 6 m)
  away along the lane. A forward pull-in needs about 6 m of swing room, so smaller gaps are a harder
  mission. Validation requires a plain two-way straight road along the bay and its parked cars.
- **Routing.** `RoutePlanner` plans A* over lane edges from the car's nearest lane point and keeps
  following the same edge list while the car stays near it, so a car crossing a junction does not flip
  between look-alike lanes. The renderer anchors route arrows a whole spacing back from the route end,
  so they hold still in the world.
- **Rendering cost.** Beams (start markers or the objective), route arrows and the bay pad are three
  meshes, at most three draw calls. Worst pose with everything on: 57 draw calls (target below 60),
  143k triangles.
- **Test autopilot** (`test/support/autopilot.ts`): pure pursuit on the route polyline with a
  curvature-limited speed profile and a smooth lane-to-bay approach. It completes all four district-1
  missions deterministically with three stars.

## Task 11: districts, missions, progression (2026-10-16)

- **Content is data, metrics are tool output.** `content/missions/*.json` hold the authored fields
  (route, limits, star thresholds, rewards) plus `difficulty` and a `validation` block that only
  `tool/validate-missions.ts` writes (canonical JSON, two-space indent, trailing newline). `--check`
  fails when a stored number differs from a fresh autopilot run; the Vitest suite does the same check
  on Node, and both runtimes agree to the last digit.
- **Difficulty** is `missionDifficulty()` in core with the weights and maxima in
  `content/progression.json`. The route/time term is route length over (time limit x 11.11 m/s,
  the autopilot's 40 km/h cruise), capped at 1. A route's junctions are passes through tiles with
  three or more open sides. Ids are assigned in difficulty order, so the ramp holds by construction.
- **Districts** are separate maps: Old Town 12x12 (8 cars), Harbor 16x14 (12), Downtown 12x12 (16).
  Downtown stays 12x12 because a 16x16 grid needs 65+ draw calls (target 60): the renderer pays about
  four draw calls per 4x4 chunk, so the chunk count in view is the budget. Districts 2 and 3 also keep
  an empty outer ring, use the lighter commercial models, and rotate models inside each chunk so none
  repeats three times (that would add a thin-instance host and its draw calls).
- **Unlocks**: district 2 at 10 total stars, district 3 at 24 (`progression.json`). The unlock helpers
  (`isDistrictUnlocked`, `unlockedDistricts`) are pure core code for task 12/13.
- **Autopilot with traffic.** The task-10 autopilot ignored other cars. The traffic does not yield to
  the player inside a junction, so it hit crossing cars. `TrafficWatch` (test support) makes the
  autopilot follow with a gap and wait for a busy junction. Stored autopilot times include those waits.
- **Task-10 samples** moved to `test/fixtures/missions/` as engine-test fixtures.
- **Dev switch**: `?district=district-2` (or `-3`) in the app URL loads that district with its own
  missions and traffic density. The real switch lives on the map screen (task 13).


## 2026-10-16 — Public name and icon (task 19, owner)

- **Name: Street Royale.** The owner rejected the task-18 shortlist (too cartoony) and asked for a cool /
  premium style, then dropped the domain requirement. Round 2 checked 52 names on Google Play, the App
  Store and the web; Street Royale had no exact or near match. Trademark clearance is still to do.
  Evidence: `.agents/resources/2026-10-15/city-drive-qa/18/round-2/`.
- **Icon: 1b** (teal coupe at sunset), unchanged.
- Registry id `city_drive` and bundle id `app.w3dev.citydrive` stay as they are.
