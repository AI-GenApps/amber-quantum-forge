---
epic: 17-city-drive
task: 16a-road-thin-instance-fix
status: completed
commit_scope: city-drive
depends_on: [17-city-drive/15-performance-pass]
estimate: S
owner: agent
---

# Fix: most roads not drawn (thin-instance hosts shared one geometry)

## Finding (owner playtest, 2026-10-16)

The owner reported that "the roads are not continuous": the car drives on grass and only an
occasional road piece is drawn (screenshot in the session). The road graph and the road models were
already proven correct (connectivity, socket alignment, matching edge profiles), and the minimap
showed the full grid.

**Root cause.** `buildChunks` turns a model used 3+ times in a chunk into a thin-instance host made
with `part.clone()`. A clone shares the source's `Geometry`, and Babylon stores thin-instance matrix
buffers (`world0`..`world3`) on the geometry. All 9 `road-straight` hosts of district 1 shared one
geometry and one `world0` buffer, so every host drew the **last** host's matrices. Only the merged
(one-off) pieces and one chunk's straight roads appeared. `buildPads` had the same bug for plazas.
Headless proof: 9 hosts, 1 geometry, 1 `world0` buffer (before); 9/9/9 (after).

## Fix

- `host.makeGeometryUnique()` right after the clone, in `src/render/chunkBuilder.ts` and
  `src/render/pads.ts`. Draw calls and triangles are unchanged.
- Regression test `test/render/thinInstances.test.ts`: for all 3 districts, every thin-instance host
  owns its geometry and its `world0` buffer, the positions in the buffers the GPU reads equal exactly
  the planned placements of that host group, and every road placement is drawn once. The test fails
  on all 3 districts without the fix.

## Verification

- `bun run city-drive:test`: core 483 passed; app 654 passed, 1 skipped. One run had a single
  failure in `test/ui/screens.test.tsx` ("minimap drawing rate"), a wall-clock timing test that
  passed 3/3 when re-run alone; unrelated to this change.
- `bun run city-drive:typecheck`, biome check: clean.
- Visual confirmation is the owner's (task 16 / 22 playtest).
