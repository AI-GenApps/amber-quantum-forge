---
epic: 17-city-drive
task: 05-city-map-and-road-graph
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/03-vehicle-physics-core, 17-city-drive/04-cc0-asset-pipeline]
estimate: L
owner: agent
---

# City map format, road graph, static colliders

## Goal

Define the city as **data**: a tile grid that both the renderer (task 06) and
the simulation consume. Derive from it a lane-level road graph (for traffic,
missions, and routing) and the static physics colliders.

## Context / Decisions

- **Map format** (`apps-games/city-drive-core/src/city/`), versioned JSON:

  ```jsonc
  { "schema_version": 1, "id": "district-1", "tile_size_m": 20,
    "width": 12, "height": 12,
    "tiles": [{ "x": 0, "y": 0, "kind": "road", "model": "road-crossroads", "rot": 0 }, …],
    "spawn": { "x": …, "y": …, "heading": … } }
  ```

  - Kinds: `road | building | park | plaza | empty`.
  - `model` references a manifest id from task 04.
  - `rot` is 0, 90, 180, or 270.
  - Maps live in `apps-games/city-drive-core/content/maps/`.
- **Road connectivity** comes from each road model's sockets (N/E/S/W)
  declared in `src/city/road-sockets.ts`, keyed by manifest id. The validator
  rejects:
  - mismatched neighbours (a road edge facing a non-road)
  - unknown models
  - out-of-bounds tiles
- **Road graph:** right-hand traffic, one lane each way per road.
  - Nodes sit at lane entry/exit points per tile.
  - Edges carry polylines (straight segments, plus a quarter-circle sampled to
    8 points for corners) and a length.
  - Intersections create turn edges (left, straight, right) between incoming
    and outgoing lanes.
  - Add **A\*** routing by length.
  - Add a `nearestLanePoint(pos)` query backed by a uniform-grid spatial index.
- **Colliders:** one static box per building tile (from the manifest
  bounding box, scaled to the tile), a ground plane, and an invisible city
  boundary wall. Use **cuboids only**, never trimesh, for mobile performance.
- **Authoring aid:** `tool/render-map-ascii.ts` prints the map as ASCII
  (used in tests and evidence; not a browser screenshot).
- **One test map now:** `district-1` (12×12) with at least 2 crossroads, 2
  T-junctions, 4 corners, and a loop. Tasks 11+ add more.

## Implementation Checklist

- [ ] Map types, parser, and validator with clear error messages
      (tile coordinates included).
- [ ] Road sockets, road-graph builder, A\*, and spatial index.
- [ ] Collider builder that feeds the task 03 physics world.
- [ ] Author `district-1.json` and print its ASCII render into evidence.
- [ ] Tests:
  - [ ] The validator rejects each error class.
  - [ ] The graph is strongly connected for `district-1`.
  - [ ] A\* returns the shortest route on a hand-checked pair.
  - [ ] Every lane polyline stays within its road tile bounds.
  - [ ] A car spawned at `spawn` and driven straight at full throttle for 3 s
        does not pass through building colliders.
  - [ ] `nearestLanePoint` is correct on sample points.

## Files Touched

- `apps-games/city-drive-core/{src/city/**,content/maps/district-1.json,tool/render-map-ascii.ts,test/city/**}`
- `.agents/resources/2026-10-15/city-drive-qa/05/README.md`

## Acceptance Criteria

- All the tests above pass, and `district-1` validates.
- The road graph for `district-1` has no dead-end lanes, except where the map
  places an explicit `road-end` (these are recorded in the test).
- No Babylon or DOM imports in core.

## Out of Scope

- Rendering, traffic agents, missions.

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:typecheck`
- `bun apps-games/city-drive-core/tool/render-map-ascii.ts content/maps/district-1.json` (or the equivalent invocation)

## Commit message

`feat(city-drive): add tile city format, road graph and colliders [17-city-drive/05]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **Colliders:** `buildColliders(map, manifest)` takes the parsed manifest as a parameter. Core must not depend on the app package. Tests read it from `../city-drive/public/assets/manifest.json`.
- **Optional model:** `model` is optional for `park`, `plaza`, and `empty` tiles.
- **Stable ids:** node and edge ids are **deterministic**, derived from the tile `(x, y)`, the lane, and the turn. Missions (tasks 10 and 11) store lane points as `{ edgeId, s }`, and these must survive rebuilds. Add a test that two builds produce identical ids.
- **Spawn test:** `district-1`'s spawn must face a building within about 40 m along the drive line. The "drive straight 3 s" test then asserts the car collided or came to rest before the building's face. Otherwise the test is vacuous.
- **Verification path:** `bun apps-games/city-drive-core/tool/render-map-ascii.ts apps-games/city-drive-core/content/maps/district-1.json`, run from the repo root.
