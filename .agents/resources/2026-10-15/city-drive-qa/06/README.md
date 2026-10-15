# Task 06: Babylon city renderer and headless budget gate

Evidence for `17-city-drive/06-scene-renderer-and-budgets`. Everything here was measured headlessly
(Vitest + Babylon `NullEngine` in Node, plus `vite build`). No browser, screenshot or device was used,
so **nothing visual has been judged**: model orientation, scale of props, colours and fog are for the
human checkpoint (task 08).

Files in this folder: `budget-report.json` (per-pose numbers, deterministic, no timestamps) and
`bundle-report.json` (JS sizes from `bun scripts/bundle-report.ts`, run after `vite build`).

## What was built (`apps-games/city-drive/src/render/`)

| Module | Purpose |
|---|---|
| `assetCache.ts` | Loads each manifest model once with `LoadAssetContainerAsync` (bytes from a caller-supplied `LoadBytes`: `fetch` in the browser, `readFileSync` in tests). |
| `templates.ts` | Bakes every container mesh's world matrix (including the glTF loader's handedness flip, with faces re-flipped) into plain meshes used as clone sources. Templates and containers are disposed after the build. |
| `materials.ts` | One shared `StandardMaterial` per Kenney pack (4), replacing the loader's PBR materials (cheaper on low-end Android). Flat materials for ground and plaza. |
| `placements.ts` | Pure plan: `planCity(map, manifest)` gives road, building and prop placements (world x/z, yaw, scale, chunk) and plaza pads. Deterministic, never mutates the map. |
| `chunkBuilder.ts` | Per 4x4-tile chunk: a model used 3 or more times in the chunk becomes a **thin-instance host** (one per model per template part); the rest of the chunk is **merged** (`Mesh.MergeMeshes`, multi-material). |
| `pads.ts` | Plaza squares as one thin-instance host per chunk. |
| `lighting.ts` | One hemispheric plus one directional light, linear fog, flat sky colour (also the clear colour). No shadows, no HDR environment. |
| `city.ts` | `createCityScene(engine, map, manifest, loadBytes)`, freezing, `applyViewDistance(camera)`. |
| `stats.ts` | `frameStats(scene)`: the draw-call and triangle model used by the budget test. |
| `district.ts` | `loadDistrict1(manifest)`: validates `district-1.json` (from core) against the asset manifest. |

`src/main.ts` now loads `district-1` and shows it with a free `ArcRotateCamera`. The old placeholder
`src/scene.ts` and its test were removed (superseded; knip would flag them as unused).

### Static optimisation

After the build every chunk mesh, the ground and the pads get `freezeWorldMatrix()`,
`isPickable = false`, `alwaysSelectAsActiveMesh = false` and `doNotSyncBoundingInfo = true`; every material
is `freeze()`d; `scene.skipPointerMovePicking = true`. `autoClear` stays on (the sky is the clear colour; no
skybox mesh exists, so turning it off would leave smeared pixels). Thin-instance hosts call
`thinInstanceRefreshBoundingInfo(true)` so frustum culling works per chunk (a test checks the box covers
every instance, and that a camera facing away draws fewer meshes and triangles).

## Method and the draw-call definition

`SceneInstrumentation` counts are not meaningful under `NullEngine` (dry-run amendment), so:

- **Draw calls** = the sum over the meshes `scene.getActiveMeshes()` selected for the camera of their
  sub-mesh counts. A thin-instance host, or the source of an `InstancedMesh`, counts **once per sub-mesh**
  however many instances it carries. All Kenney models are single-material, so a host is one draw call.
- **Triangles** = (sub-mesh triangles) x (thin-instance count) over active meshes. Culling is per mesh, so the
  number is conservative: a chunk is counted whole if any of it is in the frustum.
- The chase pose is 6 m up and 10 m behind a car that stands at each of the 8 compass points (10 m inside
  the map edge, facing the centre) plus the centre (facing north). The camera looks at a point 15 m ahead
  of the car at 1 m height. Camera: vertical FOV 0.8 rad, aspect 2:1 (NullEngine default render size),
  `minZ` 0.5, `maxZ` 240 m. Fog is linear from 90 m to 220 m.
- `scene.render()` is called once per pose. The test writes `budget-report.json` **only when
  `BUDGET_REPORT=1`** (two consecutive runs gave an identical SHA-256, `728cfed7...3f15`).

## Measured: district-1 (12x12 tiles, 20 m, 9 chunks)

| Pose | Active meshes | Draw calls | Triangles |
|---|---|---|---|
| edge-N | 25 | 43 | 123,215 |
| edge-NE | 24 | 42 | 117,971 |
| edge-E | 25 | 43 | 123,215 |
| edge-SE | 25 | 43 | 123,215 |
| edge-S | 24 | 42 | 117,971 |
| edge-SW | 25 | 43 | 123,215 |
| edge-W | 24 | 42 | 117,971 |
| edge-NW | 25 | 43 | 123,215 |
| centre (north) | 16 | 28 | 70,422 |

Worst case: **43 draw calls** (budget 100, target under 60) and **123,215 triangles** (budget 150,000).
The test also sweeps the car over a 20 m grid with 4 headings (all in the map) and asserts the same limits;
its worst case is the same 43 draws and 123,215 triangles. Triangle headroom is only about 18%: the edge
poses see most of the map because a 240 m map is about the fog distance. Task 15 (performance pass) owns
any further saving (shorter view distance, LOD for buildings).

Chunk composition: 9 chunks, each with 1 to 3 thin-instance hosts (straight roads, repeated buildings,
trees) and one merged mesh (the unique buildings, junction/corner roads, lights), plus the ground and the
plaza pad hosts.

## Road orientation (filled `ROAD_MODEL_YAW_OFFSET`)

Task 05 left `ROAD_MODEL_YAW_OFFSET` empty because the artwork direction had not been checked. It is now
derived from the asphalt geometry (the y = 0.01 layer of each GLB) as Babylon's glTF loader places it, which
includes the loader's `x` mirror: straight 90, crossing 90, corner 270, road-end 270 (T and crossroads 0).
`test/render/road-alignment.test.ts` transforms the asphalt with the renderer's own matrix for all 4 tile
rotations and asserts the edges the asphalt reaches equal `tileSockets(...)`. The test fails if an offset is
wrong (verified by temporarily setting the corner offset to 0). This is geometric evidence only: **a human
should still confirm by eye in task 08** (for example crossing stripes and the road-end cap).

## JS bundle size (`vite build`, excluding wasm and models)

| Measure | Bytes | Gzip |
|---|---|---|
| **Initial JS** (entry plus the 21 chunks `index.html` preloads) | 1,358,586 | 329,583 |
| Lazy chunks (87, fetched on demand: shader sources, PBR material of the glTF loader) | 1,541,617 | 378,649 |
| Rapier chunk | 0 (not imported yet; task 07 must load it with a dynamic `import()`) | |

The initial JS is **1.30 MiB, inside the 1.5 MB target**. The sum of every JS file is 2.9 MB, which is over
1.5 MB if read as "all chunks"; those lazy chunks are never needed at startup, and the biggest are the
glTF loader's PBR/OpenPBR materials and shaders (`pbrMaterial`, `openpbrMaterial`, `pbr.fragment`,
`openpbr.fragment`, `brdfTextureTools`, `oitFragment`).

What drove the size, and what was done:

- `@babylonjs/loaders/glTF/index.js` (the barrel of the loader package) alone made the entry 1.46 MB and the
  total 3.6 MB, because it statically pulls glTF 1.0 and every glTF 2.0 extension (including the flow-graph
  interactivity runtime). Replaced by the two deep imports `@babylonjs/loaders/glTF/2.0/glTFLoader.js`
  and `.../Extensions/KHR_texture_transform.js` (the only extension the shipped GLBs declare): entry 956 kB.
- The remainder of the entry is `Engine`/`Scene` core, `StandardMaterial`, thin-instance and merge code, and
  the glTF 2.0 loader.
- If a model ever needs another glTF extension (Draco, meshopt, KTX2 are not used), add its deep import
  explicitly; do not go back to the loader barrel.

## Core changes outside `src/render` (small, necessary)

- `city-drive-core/package.json`: exports `./city` (the city module without Rapier, so the app bundle does not
  inline Rapier's 4 MB wasm) and `./maps/*` (district JSON). Core still imports no Babylon and no DOM.
- `city-drive-core/src/city/road-sockets.ts`: the filled `ROAD_MODEL_YAW_OFFSET` table above.
- `city-drive/tsconfig.json`: `resolveJsonModule` for the district import.
- `city-drive/scripts/bundle-report.ts`: sizes the build (used for `bundle-report.json`).

## Dev server

`vite --port 4010` was started and probed with curl only: `/`, `/assets/manifest.json`, `/src/main.ts`,
`/src/render/district.ts` and `/src/render/assetCache.ts` all returned HTTP 200 and the district import
resolved to the core package JSON. The server was then stopped (nothing listens on 4010). The page itself
was not opened in a browser.
