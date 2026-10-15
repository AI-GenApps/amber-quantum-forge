---
epic: 17-city-drive
task: 06-scene-renderer-and-budgets
status: completed
commit_scope: city-drive
depends_on: [17-city-drive/05-city-map-and-road-graph]
estimate: L
owner: agent
---

# Babylon city renderer + headless draw-call and triangle budget test

## Goal

Render any city map from task 05 in Babylon at mobile-friendly cost, with a
**headless budget test** that fails CI if the draw-call or triangle budget is
exceeded.

## Context / Decisions

- Code lives in `apps-games/city-drive/src/render/`. The renderer **reads**
  core data and never mutates simulation state.
- **Loading:** load each manifest model once with
  `LoadAssetContainerAsync` (deep import from `@babylonjs/core/Loading/…` plus
  a side-effect import of the glTF loader), then build the city from those
  containers.
- **Batching strategy:**
  - Repeated tiles (roads, props, identical buildings) use **thin instances**
    per (model, material) via `thinInstanceSetBuffer`.
  - Unique static meshes are merged per district chunk (4×4 tiles) with
    `Mesh.MergeMeshes`, keeping multi-material.
  - After building:
    - call `freezeWorldMatrix()` on static meshes
    - call `material.freeze()`
    - set `scene.skipPointerMovePicking = true`
    - set `autoClear` appropriately
- **Lighting:**
  - one hemispheric light plus one directional light
  - no dynamic shadows in v1
  - a fake blob shadow under cars (task 07)
  - linear fog to hide the far edge
  - a sky colour or gradient, no HDR environment download
- **Culling:** thin instances render all-or-nothing per mesh, so group them
  **per chunk** (one thin-instance host per model per chunk). Frustum culling
  then removes off-screen chunks. Set `alwaysSelectAsActiveMesh = false` and
  compute correct bounding info.
- **Budgets** (STATUS.md): at most 100 draw calls (target < 60) and at most
  150k visible triangles, from the worst-case camera position.
- **Headless budget test:** build `district-1` under `NullEngine` in Vitest.
  - Place a chase camera at the 8 compass points of the map, plus centre,
    looking inward, at the chase height from task 07 (assume 6 m up, 10 m behind).
  - Call `scene.render()` once per pose.
  - Read `SceneInstrumentation` draw calls (or count active meshes ×
    sub-meshes if instrumentation is unavailable under `NullEngine`; document
    which).
  - Sum the visible triangles over active meshes and thin-instance counts.
  - Assert the budgets and write a JSON report to
    `.agents/resources/2026-10-15/city-drive-qa/06/budget-report.json`.
- **Asset loading in Node:** read the GLB from disk into an ArrayBuffer and
  load it from a data or ArrayBuffer source, as task 04 proved.
- **`src/main.ts`:** after this task, the dev build shows `district-1` with a
  free orbit camera (`ArcRotateCamera`) for task 08's human check.

## Implementation Checklist

- [x] Asset container cache, city builder (thin instances per chunk plus
      merged uniques), lighting, and fog.
- [x] Freeze/static optimizations.
- [x] Headless budget test with the JSON report.
- [x] Wire `main.ts` to load `district-1` with an orbit camera.
- [x] Evidence README with the measured draw calls and triangles per pose,
      including the method.

## Files Touched

- `apps-games/city-drive/src/render/**`, `src/main.ts`, `test/render/**`
- `.agents/resources/2026-10-15/city-drive-qa/06/**`

## Acceptance Criteria

- The budget test passes for `district-1` at all 9 poses, and the report is
  committed.
- `bun run city-drive:build` passes. The JS bundle size (excluding wasm and
  models) is recorded; target at most 1.5 MB minified before gzip, and if it
  is larger, record which deep imports drove it.
- No barrel `@babylonjs/core` import and no CDN URLs.

## Out of Scope

- Player car, controls, traffic, UI. No browser screenshots (human task 08
  judges visuals).

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:build`
- `bun run city-drive:typecheck`

## Commit message

`feat(city-drive): render tile city with thin instances and budget gate [17-city-drive/06]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **JS budget, reworded:** Rapier's compat build inlines its wasm as base64 (about 4.3 MB of JS). Load Rapier through a dynamic `import()` so it lands in **its own chunk**. The budget becomes: **app JS excluding the Rapier chunk is at most 1.5 MB minified**. Report the Rapier chunk separately.
- **Budget report file:** the budget test writes `budget-report.json` **only when `BUDGET_REPORT=1`** is set, with deterministic content (no timestamps), so normal test runs never dirty the tree.
- **Draw calls under `NullEngine`:** `SceneInstrumentation` counts are not meaningful under `NullEngine`. Define the draw-call count as the sum over active meshes of their sub-mesh counts, where each thin-instance host or `InstancedMesh` source counts **once per sub-mesh**. Document this definition in the evidence.
- **Test environment:** render tests use `// @vitest-environment node`.
