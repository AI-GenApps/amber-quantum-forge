# Task 05: city map format, road graph, static colliders

Evidence for `17-city-drive/05-city-map-and-road-graph`. Rendered headlessly; no browser was used.

## What was built

All code is in `apps-games/city-drive-core/src/city/` (pure TS, no Babylon, no DOM).

| Module | Purpose |
|---|---|
| `direction.ts` | N/E/S/W helpers and the coordinate conventions below |
| `types.ts`, `parse.ts`, `validate.ts` | Map types, structural parser, rule validator, `CityMapError` with tile coordinates |
| `manifest.ts` | Minimal manifest view (`parseCityManifest`); core never imports the app package |
| `road-sockets.ts` | `ROAD_SOCKETS` per manifest id, `tileSockets(tile)` (rotation applied) |
| `lane-geometry.ts`, `graph.ts` | Lane polylines and the lane-level `RoadGraph` |
| `astar.ts`, `connectivity.ts` | A* by length, strong connectivity, dead-end check |
| `lane-index.ts` | Uniform-grid `LaneIndex`, `nearestLanePoint`, `pointOnEdge` |
| `colliders.ts` | `buildColliders(map, manifest)` plan plus `installColliders(world, plan)` |
| `ascii.ts`, `tool/render-map-ascii.ts` | ASCII renderer and CLI |

Map content: `content/maps/district-1.json` (12x12, 20 m tiles).

## Conventions (the renderer in task 06 must follow these)

- Tile (x, y): x grows east, y grows south. World metres: +X east, +Z south, map centred on the origin.
- Headings are compass degrees clockwise from north. `rot` turns a tile clockwise. The car's local +Z maps to heading `h` with yaw `PI - h`.
- Sockets at rot 0: straight and crossing N+S, corner N+E, T E+S+W (stem south), crossroads all four, road-end S only (cap on the north).
- `ROAD_MODEL_YAW_OFFSET` exists for the renderer, empty for now. **Whether each Kenney GLB's artwork lines up with these sockets was not checked visually** (no browser QA); task 08 (human) must confirm, and any fix goes into that table.
- Lane offset from the road centreline is 15% of the tile (3 m). Right-hand traffic.
- Corner edges are quarter circles sampled to 8 points (radius `T/2 - lane` for right turns, `T/2 + lane` for left turns). A road-end gets a U-turn edge (straight lead-in, 9-point half circle), so it is not a dead end.
- Ids are derived from tile coordinates: node `c:<x>,<y>><dir>` (lane crossing out of tile x,y through edge dir; the neighbour's entry node is the same node), edge `e:<x>,<y>:<in><out>` (for example `e:5,5:WE`). A test checks two builds produce identical ids.
- Buildings: manifest bounding boxes exceed one tile for 17 of 18 models (up to 1.83 tiles wide). The collider (and the renderer, via `buildingFitScale`) scales each model uniformly so its footprint is at most 90% of a tile. Tile `rot` of 90/270 swaps the footprint axes.
- `model` is optional for park/plaza/empty tiles; unlisted tiles are `empty`.

## district-1

Counts: 2 crossroads, 8 T-junctions, 4 corners, a loop (outer ring plus two avenues), 2 road-ends at (3,0) and (3,11), 3 pedestrian crossings. Graph: 130 nodes, 170 edges, strongly connected, 0 dead ends. Spawn (2,5) heading 270 (west) faces the building at (0,5), about 34 m along the drive line.

```
   0 1 2 3 4 5 6 7 8 9 0 1
 0 B B B ╷ B B B B B B B B
 1 B ┌───┴───┬─────┬───┐ B
 2 B │ B B B │ B B │ B │ B
 3 B │ B B B │ p p │ B │ B
 4 B │ B B B │ p p │ B │ B
 5 B ├─<─────┼─────┼───┤ B
 6 B │ B B B │ B B │ B │ B
 7 B │ B B B │ o o │ B │ B
 8 B │ B B B │ B B │ B │ B
 9 B │ B B B │ B B │ B │ B
10 B └───┬───┴─────┴───┘ B
11 B B B ╵ B B B B B B B B

district-1 12x12 tile=20m
road: ┼┬┤┴├ T/cross, │─ straight, └┌┐┘ corner, ╵╶╷╴ road-end; B building, p park, o plaza, . empty; ^>v< spawn
lane graph: 130 nodes, 170 edges, strongly connected: true, dead ends: 0
```

(Also in `district-1.ascii.txt`. Regenerate with `bun apps-games/city-drive-core/tool/render-map-ascii.ts apps-games/city-drive-core/content/maps/district-1.json` from the repo root.)

## Tests

`apps-games/city-drive-core/test/city/`: `validate.test.ts` (every error class), `graph.test.ts` (strong connectivity, road-end record, intersection turns, 8-point corners, polylines within tile bounds, deterministic ids, A* against a hand-checked route and a brute-force Dijkstra), `lane-index.test.ts` (sample points plus 300 random points against brute force), `colliders.test.ts` (box construction, footprint inside tile, no overlap with lanes, walls, and the spawn drive: full throttle for 3 s then until stopped, never within 0.5 m past the building face, collision impulse seen), `ascii.test.ts`.

The spawn drive test is not vacuous: the spawn is 34 m from the face, the car travels more than 10 m, an impulse is reported, and it ends below 5 km/h.
