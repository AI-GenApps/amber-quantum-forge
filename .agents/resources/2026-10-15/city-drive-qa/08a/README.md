# Task 08a: render the scene right-handed

Evidence for `17-city-drive/08a-right-handed-scene-fix`. Everything was verified headlessly (Vitest
under Node with Babylon `NullEngine`). **No browser, screenshot or device was used, so nothing
visual has been judged by eye.** Whether the city now reads correctly on screen is for the human
checkpoint (task 08).

## What changed

| Area | Change |
|---|---|
| Scenes | New `src/render/scene.ts` (`createScene`) sets `scene.useRightHandedSystem = true` before any mesh exists. `createCityScene` and every test scene use it; a hygiene test bans `new Scene(` elsewhere in `src/`. |
| Steering | The negation in `toCarInput` is deleted (doc comment and test updated). |
| glTF templates and car parts | No `__root__` mirror is added in a right-handed scene, so the baked geometry is the authored artwork. A fresh `Mesh` defaults to the clockwise winding of builder meshes, so `buildTemplate` and `buildCarParts` now copy the loader mesh's side orientation (counter-clockwise). Without this the faces would be culled the wrong way round (checked headlessly by comparing winding with vertex normals; real culling is for the human to see). |
| Road yaw offsets | Re-derived (`road-sockets.ts`): `road-corner` 270 -> **180**, `road-end` 270 -> **90**. `road-straight` 90, `road-crossing` 90, `road-t` 0 and `road-crossroads` 0 are unchanged. |
| Camera | The chase-camera maths, look-at and occlusion ray work in simulation coordinates and needed no change. Only a test that read the camera's forward axis had to use `Vector3.Forward(scene.useRightHandedSystem)` (-Z in a right-handed scene). |
| Not changed | `?debugcam` orbit camera start angle (alpha -PI/2 now views from the north edge, so east is on its left); `placementMatrix` (`-yawDeg` about +Y is clockwise seen from above in a right-handed frame, which is what `rot` means). |

Small additions beyond the listed files: `src/render/scene.ts` (the factory), and test helpers
`test/render/projection.ts` (view-projection screen projection) and `test/render/winding.ts`
(winding vs normals).

## Projected points, before and after

Method: the same headless scripts run twice against the same code, once with the scene left-handed
and the steer negated (the state at HEAD, "before") and once as committed ("after"). Values are
normalised device x of the chase camera's view-projection: negative is the left half of the screen,
positive the right half. Raw numbers: `projection-before.json`, `projection-after.json`.

| Probe | Before (left-handed) | After (right-handed) | Correct? |
|---|---|---|---|
| Point 3 m to the car's simulation-right, 10 m ahead (car at origin facing +Z) | **-0.159** (left half) | **+0.159** (right half) | after |
| Same point on the car's simulation-left | +0.159 | -0.159 | after |
| Spawn: road centreline seen from the car in its right-hand lane | **+1.352** (road centre on the right, so the car is in the screen's left lane) | **-2.093** (road centre on the left, car in the right lane) | after |
| Player steers right: yaw of the car (cross(forward0, forward1).y, 45 frames) | +0.628 | -0.628 | both turn right on screen; the sign is the handedness |
| Player steers right: projected heading x, through the camera frozen before the turn | 0 -> +0.359 | 0 -> +0.359 | same on screen |
| Player steers left: projected heading x | 0 -> -0.362 | 0 -> -0.362 | same on screen |

Reading the table: before, the player's controls only looked right because the steer was negated,
while the world itself was a mirror image (the lane and the right-hand point were on the wrong
side). After, the controls pass straight through and the world is on the correct side.

## Tests that prove the fix

| Spec item | Test |
|---|---|
| 1. mesh at sim (x, y, z) is at world (x, y, z) | `test/render/handedness.test.ts`: car root at (13.5, 0.9, -42.25); every district-1 placement matrix keeps its (x, z); east is +X and south is +Z. |
| 2. a point on the car's sim-right projects to the right half | `test/game/handedness.test.ts`: chase camera, point 3 m right and 10 m ahead has NDC x > 0.1, the left one < -0.1, the look target is at the screen centre, a top-down camera shows east on the right and north up, and the spawn road centre is left of the car's right-hand lane. |
| 3. scripted steer right yaws toward the car's right and the screen heading moves right | `test/game/handedness.test.ts` (right and left): yaw sign, projected heading shift through the pre-turn camera, and the front wheel axle swings with the turn. `test/game/integration.test.ts` keeps the sideways-drift check, now using forward x up as "right". |
| 4. every rendered road tile touches the tile edges its sockets declare | `test/render/road-alignment.test.ts`: the template check (every model, every rotation) plus a pass over every placed road tile of district 1 comparing the placed asphalt bounding box edges with `tileSockets`. |
| Winding | `test/render/handedness.test.ts`: all glTF hosts, merged meshes and car parts are counter-clockwise with side orientation counter-clockwise; ground and pads (builders) are clockwise with the default. |

Mutation checks (temporary, reverted): setting the scene left-handed fails 11 tests (projection,
compass, spawn lane, steering, wheel naming, winding, both alignment tests); re-adding the steer
negation fails 5 (the `toCarInput` test, both steering handedness tests, both integration steering
tests).

## Budget

The task 06/07 budget tests (`test/render/budget.test.ts` and the integration budget test) pass
unchanged.
