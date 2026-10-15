# Task 07: player car, controls and chase camera

Evidence for `17-city-drive/07-player-car-controls-camera`. Everything was verified headlessly
(Vitest with Node, happy-dom and Babylon `NullEngine`; `vite build`; a `curl` probe of the Vite dev
server). **No browser, screenshot or device was used, so nothing visual or feel-related has been
judged.** Driving feel, camera feel, button size and placement on a real phone, and wheel/body looks
belong to the human checkpoint (task 08).

Files here: `budget-report.json` (the task 06 budget test re-run with the player car parked at every
pose; deterministic, no timestamps).

## Budget with the car

| | Task 06 (no car) | Task 07 (car added) | Limit |
|---|---|---|---|
| Worst draw calls, 9 poses | 43 | **49** | 100 (target < 60) |
| Worst triangles, 9 poses | 123,215 | **125,267** | 150,000 |
| Sweep worst (grid of positions x 4 headings) | n/a | 49 draws, 125,267 tris | 100 / 150,000 |

The car costs 6 draw calls (body, 4 wheels, blob shadow) and about 2,050 triangles. The per-pose
numbers are in `budget-report.json`.

## What was built

Core (`apps-games/city-drive-core/src`, pure TypeScript, no DOM, no Babylon):

| Module | Purpose |
|---|---|
| `cars/respawn.ts` | `RespawnDetector`: flipped (tilt over 70 degrees for 2 s) and stuck (under 1 km/h on full throttle for 4 s). One `update(dt, sample)` per fixed step. |
| `city/raycast.ts` | `raycastBoxes`: slab-test ray against the `ColliderPlan` boxes (buildings and boundary walls). The chase camera uses it for occlusion pull-in. |
| `city/respawn-point.ts` | `laneRespawn`: nearest lane point (task 05 `LaneIndex`) plus the lane direction as a quaternion. |
| `physics/math.ts` | `quatFromForward` (trig-free, sqrt only), `uprightness`. |

App (`apps-games/city-drive/src`):

| Module | Purpose |
|---|---|
| `game/loop.ts` | `GameLoop.frame(nowMs)`: fixed 1/60 s step through core `SimClock` (max 5 steps per frame), then one render with interpolation `alpha`. Never reads a clock; `main.ts` calls it from `engine.runRenderLoop`. |
| `game/session.ts` | `GameSession`: physics world, district colliders, the car, the respawn detector, last two states for interpolation, manual and automatic respawn. |
| `game/interpolate.ts` | Blend of the last two car states (position, short-way nlerp rotation, wheel angles and suspension). |
| `game/fpsOverlay.ts` | `?fps` overlay: fps, draw calls (`SceneInstrumentation`), triangles (`frameStats`). |
| `input/` | `InputSource` interface; `KeyboardInput` (WASD/arrows, Space, R), `TouchInput` (per-button pointer-id sets, steer ramp 0.25 s up / 0.15 s down), `GamepadInput` (optional, injected pad list), `mergeInputs` (larger absolute value wins), `CombinedInput`. |
| `ui/controls/` | Preact `TouchControls`, `HoldButton` (pointer events, pointer capture, `touch-action: none`), `RotateOverlay`, `controls.css` (safe-area insets, portrait guard), `mount.tsx`. |
| `render/carModel.ts`, `render/carVisual.ts` | Splits the Kenney car GLB into body and four wheels, scales, syncs from the interpolated pose, adds the blob shadow. |
| `render/cameraMath.ts`, `render/chaseCamera.ts` | Pure smoothing, speed-dependent distance/height/FOV and occlusion maths, and the camera class that uses them. |
| `main.ts` | Starts free drive on `district-1`. `?debugcam` keeps the orbit camera, `?fps` shows the overlay, `?touch` forces the on-screen buttons on desktop, `?inspector` as before. Vite dev server has `host: true`. |

## Decisions and findings (please read)

1. **The screen is a mirror of the simulation.** Rapier and the city map are right-handed (facing
   +Z, +X is on the left), but Babylon draws the same numbers left-handed (facing +Z, +X is on the
   right). Task 06 handled this for the buildings (`-yawDeg`, the loader's x mirror), so the city is
   self-consistent, but it means a steer of +1 ("right" in the simulation) turned the car toward the
   screen's left. `toCarInput` therefore negates the player's steer. An integration test checks, with
   the mesh's own right-hand direction, that pressing right moves the car to its right and left to
   its left. Side effects for the human to judge at task 08: the map looks mirrored against its
   ASCII/compass description, and "right-hand traffic" lanes appear on the left of the screen.
2. **Latent task 06 bug fixed.** `AssetCache.dispose()` disposed the glTF textures, which the shared
   pack `StandardMaterial`s still sample. A disposed texture is never "ready", so a real WebGL engine
   would have skipped every textured mesh (invisible city). `NullEngine` could not show it. The cache
   now keeps the textures; `test/render/city.test.ts` asserts every pack texture `isReady()`.
3. **Wheels are separate nodes** in the Kenney car GLBs (`wheel-<front|back>-<left|right>`), so each
   wheel is its own mesh that spins (X rotation, positive when rolling forward, checked by test) and
   steers (Y rotation). Wheels keep the model's own axle X/Z; only their height follows the physics
   suspension.
4. **Model scale** comes from the wheel radius (physics 0.35 m, model 0.3 m, so x1.167). The wheels
   then touch the ground exactly; the body is about 3.4 m long against the 4.2 m collider box, so the
   car looks slightly shorter than its collision. Ride height uses the settled mean suspension length
   (0.27 m, measured).
5. **Auto-respawn** counts total tilt from upright (roll and pitch), not roll only, so a car on its
   nose also respawns. Stuck also triggers for full reverse throttle.
6. **Respawn target** is the nearest lane point of the road graph, which can be on the opposite side
   of a block; it is the nearest by straight-line distance, not by route.
7. **Gamepad** fit within the budget, so it is included (left stick, RT/LT or A/B, X handbrake, Y
   reset). It is untested on hardware (no pad here); the mapping is covered with a fake pad.
8. **Chase camera**: exponential follow (frame-rate independent), heading smoothed so spins do not
   whip the view; distance 10 to 13 m, height 6 to 7 m and FOV 0.85 to 1.05 rad with speed;
   occlusion ray runs from the car (1.2 m above its centre) to the wanted camera spot and pulls the
   camera in instantly, releasing smoothly.

## Tests added

| Where | File | Covers |
|---|---|---|
| core | `test/cars/respawn.test.ts` | flip and stuck timers, thresholds, resets |
| core | `test/city/raycast.test.ts` | slab test, nearest of several, parallel rays, district-1 |
| core | `test/city/respawn-point.test.ts` | `quatFromForward`, `laneRespawn` |
| app | `test/game/loop.test.ts` | fake clock: 7 ms and 40 ms frame sequences, stall cap, first frame, alpha |
| app | `test/game/interpolate.test.ts` | blend, clamp, short-way rotation |
| app | `test/game/session.test.ts` | driving, flipped respawn, stuck respawn, lane facing, manual reset |
| app | `test/game/integration.test.ts` | loop + core + `NullEngine` scene: 5 s of throttle, mesh vs simulated distance within 0.1 m, pose equality, steer direction both ways, camera placement, budget |
| app | `test/game/fps.test.ts` | formatting and refresh interval |
| app | `test/input/keyboard.test.ts`, `test/input/merge.test.ts` | keyboard events in happy-dom, merge rule, gamepad, steer mirror |
| app | `test/ui/controls.test.tsx` | pointer events, multi-touch, cancel, ramp, 56 px targets, portrait guard, safe areas |
| app | `test/render/cameraMath.test.ts`, `test/render/chaseCamera.test.ts` | damping, speed effects, occlusion, jitter, snap |
| app | `test/render/carVisual.test.ts` | ground contact, wheel corners, suspension, steering, spin direction, shadow |
| app | `test/render/budget.test.ts`, `city.test.ts` | budget with the car; texture readiness |

## Verification commands (results)

See the task file and the final report: `bun run city-drive:test`, `city-drive:typecheck`,
`city-drive:build` all exit 0. Extra: `bun run check:ci` clean, `knip` reports nothing new for
`apps-games/city-drive*` (two pre-existing task 03 exports remain: `wheelbase`, `WheelCommand`).
The Vite dev server was started with `host: true` and probed with `curl` (HTML, `main.ts`,
`mount.tsx`, `controls.css` all HTTP 200, JSX transformed), then stopped.

## NOT RUN

- Any browser run, screenshot, or visual check (forbidden for agents; task 08).
- Phone on the LAN (needs a device; task 08).
- Real-hardware gamepad.
