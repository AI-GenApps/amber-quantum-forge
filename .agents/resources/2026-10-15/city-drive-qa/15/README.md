# Task 15 evidence: performance pass

No browser, screenshot, device or emulator was used. Everything is measured headlessly: Vitest, Babylon
`NullEngine`, the real Rapier session in Node, and the Vite build output. Frame rate on a phone and how
the quality steps look are NOT measured here (task 16 and task 22, see the end).

Files in this folder (regenerate with `BUDGET_REPORT=1 bun run city-drive:test`, then
`bun apps-games/city-drive/scripts/report-bundle.ts <this folder>/bundle-report.json` after a build):

| File | What |
|---|---|
| `tier-budget.json` | worst draw calls / triangles / active meshes per district and quality tier (9 budget poses) |
| `cpu-report.json` | the 5 CPU benchmark runs, the median, the baseline and the machine factor |
| `bundle-report.json` | gzip and raw sizes by kind |

## What changed

| Area | Before | After |
|---|---|---|
| Quality | Fixed Low/Medium/High profile; Auto = High; `engine` created with `adaptToDeviceRatio` (render scale = CSS pixels, no cap logic) | `QualityGovernor` (pure, `src/perf/governor.ts`) steps through 8 tiers; render scale = tier scaling / min(devicePixelRatio, 2) |
| Traffic density | Fixed per district | Governor can thin it (tiers 6 and 7: 60% and 30%), via the new `TrafficManager.setMaxAgents` |
| Materials | Static pack materials frozen; car, shadow and mission materials not | All frozen except the instanced traffic pack materials (marked `keepUnfrozen`) |
| Texture memory | Each district load left about 27 unused GLB colormap copies on the GPU | Disposed; live textures are flat across any number of switches |
| Bundle | One 5.5 MB entry chunk (Rapier wasm inlined) | App JS and Rapier are separate chunks; app JS loaded at start 1,567,122 B |

## Adaptive quality

Tier ladder (`src/perf/tiers.ts`), best to worst: resolution first, then view distance, then traffic.

| Tier | Hardware scaling | View (fog + far plane) | Traffic |
|---|---|---|---|
| 0 | 1.0 | 100% | 100% |
| 1 | 1.25 | 100% | 100% |
| 2 | 1.5 | 100% | 100% |
| 3 | 2.0 | 100% | 100% |
| 4 | 2.0 | 80% | 100% |
| 5 | 2.0 | 60% | 100% |
| 6 | 2.0 | 60% | 60% |
| 7 | 2.0 | 60% | 30% |

Rules, all in `governor.ts` and covered by `test/perf/governor.test.ts` (16 tests, synthetic frame-time
streams with 10% jitter):

- 2 s windows; p90 above 33 ms steps down one tier (reaching tier 7 from tier 0 takes 7 windows, about 14 s).
- p90 below 20 ms for 10 s in a row steps up one tier, never above the ceiling; between 20 and 33 ms
  nothing happens and the fast streak restarts (hysteresis).
- A step up that is undone within 20 s locks that tier out for the life of the governor. Tested: a device
  whose tier 0 costs 40 ms and tier 1 costs 14 ms makes exactly 3 changes (0 to 1, 1 to 0, 0 to 1) and then
  none for 15 simulated minutes. A sweep of 10 device cost models, each from 2 starting tiers, over 10 minutes shows at most 2 direction
  reversals and no change after minute 2.
- Frames over 500 ms (tab switch, district load) are ignored; a lone 200 ms hitch in a window does not
  move the p90.
- Settings: High and Auto start at tier 0 (ceiling 0), Medium at tier 1 (ceiling 1), Low at tier 2
  (ceiling 2). Applying the same setting again (the controller does this after every district load) keeps
  the learned tier; a different setting restarts at that setting's tier. Fog and far plane are the
  setting's own distances times the tier's view factor.
- DPR cap: render scale is `tierScaling / min(devicePixelRatio, 2)`, so a 3x screen renders at 2x at
  tier 0 and a 2x screen at 2x; nothing is ever drawn above 2x (tested for DPR 1 to 4.5 at every tier).

Wiring: `main.ts` feeds the time between animation frames to `GameHost.recordFrame` (skipped while the tab
is hidden); the host applies the tier to the engine, the camera and fog, and the traffic cap. Wiring is
tested end to end on a NullEngine host in `test/perf/hostGovernor.test.ts`.

## Freeze audit and culling decisions

- Static meshes (ground, pads, chunk hosts, merged chunks): world matrix frozen, `isPickable` false,
  `alwaysSelectAsActiveMesh` false (so frustum culling still drops far chunks). Audited on all 3 districts
  by `auditFreeze` (`test/perf/freeze.test.ts`).
- Materials: all frozen once the runtime is built, except the traffic pack materials, which are drawn by
  `InstancedMesh` copies that come and go and are left alone on purpose (marked `keepUnfrozen`, audited).
  Fog distances are scene uniforms that Babylon rebinds the first time each material is drawn in a frame,
  so the governor can change fog on frozen materials. NOT verifiable headlessly on a real GPU: see below.
- `scene.freezeActiveMeshes()` is not used: traffic and the car move every frame. Tested
  (`activeMeshesFrozen` is false).
- LOD: the Kenney City Kit has a single mesh per building and no lower-poly variant exists, and a
  gltf-transform simplify would change the look of the art, so no LOD meshes were produced
  (`build-assets.ts` is unchanged). Instead buildings beyond the fog are hidden: every chunk is its own
  mesh, so the camera far plane (`maxZ`, 240 m at High, shrinking to 60% at tier 5+) culls whole chunks.
  `test/perf/tierBudget.test.ts` checks that every chunk entirely beyond the shortest view is not an
  active mesh, and that cost never rises as the tier worsens.
- `scene.autoClear` stays ON: there is no sky mesh, the sky is the clear colour (equal to the fog colour),
  so clearing is what draws it. Turning it off would smear the sky area. Tested. The depth clear also
  stays on.

## Budgets by tier (NullEngine, worst of 9 poses, traffic as the tier thins it)

Draw calls / triangles (budget: 100 draw calls, 150,000 triangles):

| Tier | district-1 | district-2 | district-3 |
|---|---|---|---|
| 0 to 3 (resolution only) | 48 / 131,079 | 50 / 121,726 | 39 / 122,566 |
| 4 (view 80%) | 48 / 131,079 | 45 / 118,435 | 39 / 122,566 |
| 5 (view 60%) | 45 / 125,483 | 39 / 104,935 | 36 / 122,034 |
| 6 (traffic 60%) | 45 / 122,551 | 39 / 100,059 | 36 / 116,164 |
| 7 (traffic 30%) | 43 / 119,613 | 39 / 97,071 | 36 / 111,238 |

The full-quality overlay numbers of task 11 (`../11/budget-report.json`, with the car, markers and mission
route) are unchanged by this task: worst 54 / 133,131, 56 / 123,778 and 45 / 124,618 (mission overlay
sweep worst 57 / 137,007, 59 / 127,654, 48 / 128,494), all inside the budget.

## CPU benchmark (Node, this server)

`test/perf/cpuBench.ts`: `GameSession` on district-3, player car, 16 traffic agents, a delivery mission
accepted and kept active, a scripted driver that resets every 7 s, 300 warm-up steps then 3600 timed fixed
steps. 5 runs; the median by mean step time is used. Rendering is not included.

| | Value |
|---|---|
| Baseline (`test/fixtures/perf-baseline.json`, recorded by `scripts/record-perf-baseline.ts`, Node 24.22) | 0.1312 ms/step mean, p99 0.2672 ms |
| Gate run recorded in `cpu-report.json` (the full suite was running in parallel, so it is noisy) | runs 0.473, 0.209, 0.157, 0.136, 0.133; median 0.1566 ms, p99 0.371 ms, max 0.751 ms |
| Phone estimate (5 to 10x slower) | 0.78 to 1.57 ms per frame; target at most 4 ms |
| Work check | 16 agents alive, 506 m driven, 13 respawns, mission active in 3597 of 3600 steps, in every run |

Gate (amended by the dry run): the median must be at most 2x the baseline. Margin and one deviation to
note: the allowance is also multiplied by how much slower the machine is than the one that recorded the
baseline (a fixed 3M-iteration JS loop, `calibrateMachine`, 154 ms on this server), so a slow CI runner
does not fail a gate meant to catch code regressions. There is also an absolute ceiling of 2 ms per step
(the task's original number) and 4 ms for the p99. Failures print the median, all runs, the baseline and the
machine factor.

## Memory (district switching)

`test/perf/leak.test.ts` switches district 10 times through all three on a NullEngine host. After every
switch the scene's meshes, materials, textures, geometries, transform nodes, lights and cameras equal the
first visit of that district; exactly 1 scene is alive; old scenes are disposed and empty; live GPU
textures are flat (NullEngine never forgets a texture, so "live" = created minus `_releaseTexture`d).

| | Before (HEAD) | After |
|---|---|---|
| Live GPU textures, district-1 first visit | 32 | 5 |
| Live GPU textures, district-1 on its 4th visit | 105 | 5 |
| Live GPU textures after 10 reloads of one district | 457 (137 after the first) | 5 |

Cause and fix: every GLB embeds its own 512x512 copy of the pack colormap. `AssetCache.dispose` emptied
the container's texture list without disposing, so about 27 per district load stayed on the GPU, and the 5
colormaps the pack materials do use were never registered with the scene, so `scene.dispose()` never freed
them either. Now unused copies are disposed and the kept ones are added to the scene (`addTexture`).
On a phone that was roughly 27 x 1 MB (plus mips) leaked per district switch.

## Bundle (`bundle-report.json`, after `bun run city-drive:build`)

| Kind | Files | Raw | Gzip |
|---|---|---|---|
| App JS loaded at start (index.html preloads) | 22 | 1,567,122 B | 394,959 B |
| App JS lazy chunks (Babylon shaders and loaders pulled on demand) | 90 | 1,556,767 B | 381,368 B |
| Rapier chunk (wasm inlined, no separate .wasm file) | 1 | 4,332,815 B | 1,669,301 B |
| Models (GLB) | 42 | 2,470,860 B | 1,050,755 B |
| Audio | 14 | 1,177,951 B | 1,156,205 B |
| Fonts | 4 | 531,600 B | 247,808 B |
| HTML and CSS | 3 | 38,934 B | 6,415 B |
| Everything in `dist` | 176 | 11,676,049 B (11.1 MiB) | 4,906,811 B |

- JS target 1.5 MB: the app JS loaded at start is 1,567,122 B = 1.495 MiB, so it is inside 1.5 MiB
  (1,572,864 B) by only about 5.7 KB, and it is over if "1.5 MB" means 1,500,000 B. The Babylon engine is
  the bulk. The only trim made: the `SceneInstrumentation` code (about 9 KB) is now loaded on demand for
  the `?fps` overlay. `report-bundle.ts` fails (exit 1) when this goes over 1.5 MiB.
- Payload target 20 MB: the whole build is 11.1 MiB raw and 4.7 MiB gzipped, so lazy-loading districts 2
  and 3 is not needed (models already load per district).
- Before (HEAD): one 5,507,607 B entry chunk, 5,910,217 B of JS loaded at start, Rapier not separable.
  Rapier is now its own chunk through `build.rolldownOptions.output.codeSplitting` in `vite.config.ts`.
  The script `scripts/bundle-report.ts` was replaced by `scripts/report-bundle.ts` (reports app JS, Rapier,
  models, audio and fonts separately).

## CI gate

`city-drive-ci.yml` runs `bun run city-drive:test` (unchanged), which runs every file under `test/**`, so
the budget tests (task 06 draw-call and triangle budgets, the new tier budgets, the CPU gate, the leak
test, the freeze audit, the governor tests) already run in CI. The workflow file was not edited. Failure
messages name the budget, the measured number, the allowance and, for the CPU gate, how to re-record.
`city-drive:build` runs there too; `report-bundle.ts` is not in the workflow (a human can add it later).

## Core change outside the listed files (small, needed)

`apps-games/city-drive-core/src/traffic/manager.ts` gets `setMaxAgents(count)` and a new
`density.ts` (`surplusAgent`): lowering the cap removes one car per tick, cars the player cannot see
first, then the farthest. Needed so the governor can thin traffic. Tested in
`test/traffic/density.test.ts` (drain, refill, determinism, input validation). The simulation stays
deterministic for a given sequence of cap changes; the cap is only changed by the render-side governor,
and the determinism fixtures are untouched and still pass.

## Verification (2026-10-16)

| Command | Result |
|---|---|
| `bun run city-drive:test` | pass: core 53 files / 483 tests, app 59 files / 541 passed + 1 skipped (the baseline-recording test, only runs with `PERF_RECORD=1`) |
| `bun run city-drive:build` | pass |
| `bun apps-games/city-drive/scripts/report-bundle.ts` | pass (exit 0, both budgets met) |
| `bun run city-drive:typecheck` | pass |
| `bunx biome check apps-games` | pass |
| `bun run check:max-lines` | pass |
| `bun run knip:ci` | exit 1 from existing findings only (Ludo, Merge Relay, the workflow file, core `WheelCommand`); two unused exports of mine were removed |

## Cannot be verified here (also in `open-questions.md`)

On-device frame time and the governor's real behaviour on a low-end Android WebView; the visual look of
tiers 3 to 7 (blur at scaling 2.0, shorter fog); whether frozen materials plus changing fog render
correctly on real WebGL (the logic follows Babylon's source, but NullEngine draws nothing); GPU texture
memory after district switches on a real context; the 2x DPR cap on a 3x phone (sharpness versus cost);
whether the 20 s probation and 10 s recovery timings feel right in play.
