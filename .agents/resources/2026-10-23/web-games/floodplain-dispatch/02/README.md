# Task 02 - content evidence (40 maps)

Date: 2026-10-23. Everything here was produced and checked headlessly (engine runs, Vitest, tsc,
Biome, vite build). No browser, device or emulator was used.

## What is proven

- 40 maps, 10 per region, 193 houses, 133 fields, 120 stars (`test/content-plan.test.ts` parses
  `content-plan.md` and compares every row).
- Each map carries a committed reference solution. `test/reference-solutions.test.ts` runs all 40:
  3 stars, cost equal to par, no flooded house, every field irrigated, the empty placement does not
  clear the map, and removing any single reference piece loses a star (irredundancy, 40 x pieces
  re-runs). `validateContent()` returns no issues.

## What is NOT proven (par minimality)

Par is the cost of the committed reference, not a proven global minimum. The flow model lets water
creep overland and puddle into any canal cell, so cheaper "tap" solutions can exist on open ground.
The authoring pipeline blocked the cheaper solutions its stochastic search found (scenery, terrain
changes), but the search is seed dependent: re-checking the final maps with three fresh seeds
(9000, 31000, 52000; 8 runs x 60000 iterations each, half started from the reference) still found
cheaper placements on many maps. The last column below is the cheapest placement found over those
three seeds; a value below par means a player can still earn three stars for less than par. Maps with
a gap of 5 or more are the first candidates for rework if the owner finds par too loose in browser
QA; task 03's exact solver can measure the true minimum. See open question Q10.

## Reference cost table

| Map | Name | Size | Par | Ref cost | Reference pieces | Search min |
|---|---|---|---|---|---|---|
| v01 | First Trickle | 8 x 12 | 6 | 6 | 6 canal | 6 |
| v02 | Two Fields Over | 8 x 12 | 9 | 9 | 9 canal | 9 |
| v03 | Sandbag Lane | 8 x 12 | 9 | 9 | 8 canal, 1 barrier | 8 |
| v04 | The Grey Week | 8 x 12 | 11 | 11 | 10 canal, 1 barrier | 11 |
| v05 | Willow Bend | 9 x 12 | 12 | 12 | 11 canal, 1 barrier | 10 |
| v06 | Pump House Row | 9 x 13 | 14 | 14 | 1 pump, 11 canal | 14 |
| v07 | Back Pasture | 9 x 13 | 15 | 15 | 1 pump, 11 canal, 1 barrier | 15 |
| v08 | Ferryman's Rise | 9 x 13 | 16 | 16 | 1 pump, 12 canal, 1 barrier | 14 |
| v09 | Cress Hollow | 9 x 13 | 17 | 17 | 1 pump, 12 canal, 2 barrier | 16 |
| v10 | Midsummer Surge | 9 x 13 | 18 | 18 | 1 pump, 13 canal, 2 barrier | 18 |
| d01 | Gatekeeper's Morning | 9 x 13 | 14 | 14 | 1 gate, 12 canal | 11 |
| d02 | Braided Channels | 9 x 13 | 15 | 15 | 1 gate, 13 canal | 7 |
| d03 | Reed Island | 9 x 13 | 16 | 16 | 1 gate, 13 canal, 1 barrier | 9 |
| d04 | Timing Is Everything | 10 x 13 | 17 | 17 | 1 gate, 14 canal, 1 barrier | 10 |
| d05 | Ninefold Mouth | 10 x 14 | 19 | 19 | 1 pump, 1 gate, 14 canal | 17 |
| d06 | Salt Meadow Dyke | 10 x 14 | 19 | 19 | 1 gate, 15 canal, 2 barrier | 19 |
| d07 | Heron Crossing | 10 x 14 | 20 | 20 | 2 gate, 16 canal | 10 |
| d08 | Spring Thaw Run | 10 x 14 | 22 | 22 | 1 pump, 1 gate, 16 canal, 1 barrier | 12 |
| d09 | The Long Sluice | 10 x 14 | 23 | 23 | 1 gate, 19 canal, 2 barrier | 11 |
| d10 | Delta Festival Night | 10 x 14 | 25 | 25 | 1 gate, 23 canal | 20 |
| h01 | Cistern Hill | 10 x 14 | 16 | 16 | 1 reservoir, 12 canal | 12 |
| h02 | Terrace Steps | 10 x 14 | 18 | 18 | 1 reservoir, 14 canal | 15 |
| h03 | Dry Spell | 10 x 14 | 19 | 19 | 1 reservoir, 15 canal | 19 |
| h04 | Quarry Basin | 10 x 14 | 20 | 20 | 1 reservoir, 15 canal, 1 barrier | 13 |
| h05 | Switchback Spring | 11 x 14 | 22 | 22 | 1 reservoir, 17 canal, 1 barrier | 21 |
| h06 | Shepherd's Tank | 11 x 14 | 23 | 23 | 1 pump, 1 reservoir, 16 canal | 11 |
| h07 | Cloudbreak Pass | 11 x 15 | 24 | 24 | 1 reservoir, 1 gate, 17 canal, 1 barrier | 24 |
| h08 | The Two Reservoirs | 11 x 15 | 26 | 26 | 2 reservoir, 18 canal | 26 |
| h09 | Drought Year | 11 x 15 | 27 | 27 | 1 reservoir, 22 canal, 1 barrier | 27 |
| h10 | High Water Mark | 11 x 15 | 29 | 29 | 1 reservoir, 1 gate, 22 canal, 1 barrier | 23 |
| e01 | Low Tide Landing | 11 x 15 | 17 | 17 | 15 canal, 2 barrier | 11 |
| e02 | Spring Tide | 11 x 15 | 19 | 19 | 17 canal, 2 barrier | 14 |
| e03 | Mudflat Market | 11 x 15 | 21 | 21 | 19 canal, 2 barrier | 21 |
| e04 | Lighthouse Reach | 11 x 15 | 22 | 22 | 1 gate, 19 canal, 1 barrier | 9 |
| e05 | Neap and Flow | 12 x 15 | 24 | 24 | 22 canal, 2 barrier | 18 |
| e06 | Harbour Wall | 12 x 15 | 25 | 25 | 22 canal, 3 barrier | 20 |
| e07 | Cockle Beds | 12 x 16 | 27 | 27 | 1 pump, 22 canal, 2 barrier | 21 |
| e08 | Storm Tide | 12 x 16 | 29 | 29 | 1 gate, 25 canal, 2 barrier | 23 |
| e09 | Pilot's Gamble | 12 x 16 | 31 | 31 | 1 reservoir, 25 canal, 2 barrier | 31 |
| e10 | Dispatch Day | 12 x 16 | 34 | 34 | 1 pump, 1 reservoir, 1 gate, 23 canal, 2 barrier | 33 |

## Authoring pipeline (`authoring/`, not shipped, not imported by `src/`)

Run with Bun from a scratch copy of this directory (the scripts write `out/`, `merged_out/`,
`final_out/` and `final_out2/` in the current directory; the core is imported by relative path).

1. `run.ts <id> <seedFrom> <seedTo>` (`RECIPE` overrides the piece mix): `make.ts` builds a river
   layout and a Steiner-tree reference from the spec row, `design.ts` anneals terrain heights against
   the real engine, seals scenery, and rejects a seed if a cheaper placement is found.
2. `refine.ts <id> 3` (`SEEDBASE`): re-searches for cheaper placements and blocks them with scenery
   or, when the cheaper placement only re-uses reference cells, with terrain changes (sea and inlet
   cells are fixed).
3. `merge.ts` picks the latest record per map, `emit.ts` writes `src/content/{region}.ts`,
   `final-check.ts <id>` (`SEED`) reports the cheapest placement a fresh search finds.

Map d10 was authored with one gate (not the planned two): the two-gate recipe found no design in
several thousand seeds. The `Pieces` column of `content-plan.md` is unchanged (`CBPS` is what the
player may use, the reference uses a subset).
