---
epic: 17-city-drive
task: 15-performance-pass
status: completed
commit_scope: city-drive
depends_on: [17-city-drive/14-audio-haptics-onboarding]
estimate: M
owner: agent
---

# Performance pass: adaptive quality, freezing, LOD, CI budget gate

## Goal

Make the game hold its frame rate on low-end Android WebViews without a
device on this server. Do this through measurable budgets, adaptive quality,
and CPU-side profiling in Node.

## Context / Decisions

- **Adaptive quality:**
  - A `QualityGovernor` (pure, tested) samples the frame time over 2 s windows.
  - If p90 > 33 ms, it raises `engine.setHardwareScalingLevel` in steps
    (1.0 → 1.25 → 1.5 → 2.0), then shortens the fog and draw distance, then
    reduces traffic density.
  - If p90 < 20 ms for 10 s, it steps back up.
  - It has hysteresis and never oscillates (tested with synthetic frame-time
    streams).
  - The settings Low/Medium/High (task 13) set the starting tier and the
    ceiling.
- **Device pixel ratio cap:** start at min(devicePixelRatio, 2), so the render
  resolution never exceeds 2× and 3× screens are not overdrawn.
- **Scene:**
  - Verify that every static mesh and material is frozen.
  - `scene.freezeActiveMeshes()` is **not** usable with moving traffic, so
    freeze only the static chunk hosts (`alwaysSelectAsActiveMesh` false) and
    record the decision.
  - Add LOD for buildings if a lower-poly variant exists or can be produced
    with a gltf-transform simplify in the asset script; otherwise hide
    buildings beyond the fog distance.
  - Disable `scene.autoClear` when the sky covers the frame.
- **CPU budget in Node:**
  - A benchmark test runs the core sim (player car + 16 traffic agents +
    mission evaluator) for 3600 steps on `district-3`.
  - Assert at most 2 ms per step on this server as a coarse regression gate,
    with the margin documented (a phone is 5–10× slower; the target is ≤ 4 ms
    per frame on device).
  - Record the actual numbers.
- **Memory:**
  - Dispose asset containers and scenes on district switch. A test switches
    districts 10 times under `NullEngine` and asserts the mesh, material, and
    texture counts return to baseline (no leaks).
- **Bundle:**
  - Record the gzip sizes of the JS, wasm (Rapier), models, audio, and fonts.
  - JS target is at most 1.5 MB minified.
  - Total first-load payload is at most 20 MB. If it is over, lazy-load
    districts 2 and 3 assets.
- **CI gate:** the budget tests (draw calls, triangles, CPU step, leak) run in
  `city-drive-ci.yml`. They already run via `city-drive:test`; confirm that
  and make the budget failures readable.

## Implementation Checklist

- [x] `QualityGovernor` plus tests, wired into the loop and settings.
- [x] DPR cap, freeze audit, LOD or a hide-distance, and the autoClear decision.
- [x] CPU benchmark test, leak test, and bundle-size report script.
- [x] Evidence README: all numbers, before and after.
- [x] Update `.agents/games/city-drive/open-questions.md` with what can only
      be verified on a device (task 22).

## Files Touched

- `apps-games/city-drive/{src/perf/**,src/render/**,src/game/**,scripts/report-bundle.ts,test/perf/**}`
- `apps-games/city-drive/scripts/build-assets.ts` (if LOD is generated)
- `.agents/resources/2026-10-15/city-drive-qa/15/README.md`, `.agents/games/city-drive/open-questions.md`

## Acceptance Criteria

- The governor tests (no oscillation, correct stepping), CPU budget, leak
  test, and draw-call and triangle budgets on all districts all pass.
- The bundle report is committed, and the payload targets are met or the
  lazy-loading is implemented.

## Out of Scope

- On-device profiling (task 22), WebGPU.

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:build`
- `bun apps-games/city-drive/scripts/report-bundle.ts`

## Commit message

`perf(city-drive): add adaptive quality governor and budget gates [17-city-drive/15]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **CPU gate:** the server is shared, so take the **median of 5 runs**. Assert at most 2× a baseline recorded in `test/fixtures/perf-baseline.json`, which is written only by an explicit script. Put the absolute numbers in the evidence README.
- **Bundle report:** report the app JS, the Rapier chunk (wasm inlined; there is no separate `.wasm`), models, audio, and fonts separately.
