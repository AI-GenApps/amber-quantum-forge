# Floodplain Dispatch - content plan (v1, complete)

This is the full named content list for v1. It drives the art briefs (`assets-index.md`), the
content task (`tasks/epics/20-web-floodplain-dispatch/02-content.md`) and the validators. Counts in
this file are binding; if task 02 must change a number, it edits this file, `economy.md` and
`decisions-log.md` in the same commit.

A "week" in lore is one turn of the season (4 simulation steps). "Par" is the exact cost of the
committed reference solution that earns three stars; "budget" is what the player may spend.
Piece codes: C canal, B barrier, P pump, S sluice gate, R reservoir. Costs: C 1, B 1, S 2, P 3, R 4.

## Totals

- 4 regions, 40 campaign maps, 120 campaign stars.
- 193 houses and 133 fields across the campaign (counts per map below).
- 5 placeable pieces, 5 house kinds, 3 tree kinds, 1 decor building (windmill), 7 map themes.
- 7 mechanic cards, 4 chapter intros and 4 chapter outros, 40 dispatcher briefs.
- Daily maps are generated, not listed; their template ladder is in `product.md`.
- Not applicable to this game (the shared spec template mentions them): customers, cases and
  evidence objects, constellations. They are not in v1; lore lives in the dispatcher briefs, chapter
  texts, mechanic cards and theme names below.

## Regions and chapters

| Region | Chapter title | Mechanic added | Unlock | Maps |
|---|---|---|---|---|
| Valley | Chapter 1 - The Valley Season | Rain surges | open | v01 to v10 |
| Delta | Chapter 2 - The Delta Gates | Sluice timing | 12 stars | d01 to d10 |
| Highland | Chapter 3 - The Highland Cisterns | Reservoirs and droughts | 33 stars | h01 to h10 |
| Estuary | Chapter 4 - The Estuary Tides | Tides and storm tides | 60 stars | e01 to e10 |

## Valley - Chapter 1 - The Valley Season

Intro text: The river is high and the town is thirsty. Dig canals from the inlet to every house and field before the surge weeks, and keep every doorstep dry.

Outro text: The valley holds. The first season goes in the ledger with no wet floors.

Mechanic: Rain surges.

| ID | Name | Size (w x h) | Weeks | Inlet rate | Houses | Fields | Inlets | Pieces | Par | Budget | Tide | Forecast events | Dispatcher brief |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| v01 | First Trickle | 8 x 12 | 20 | 2 | 1 cottage (1) | 1 | 1 | C | 6 | 9 | none | none | One house, one field, one river. Dig a canal and open the tap. |
| v02 | Two Fields Over | 8 x 12 | 20 | 2 | 2 cottage (2) | 2 | 1 | C | 9 | 12 | none | none | Two fields are thirsty. Share the river and keep the lane dry. |
| v03 | Sandbag Lane | 8 x 12 | 20 | 2 | 1 cottage, 1 barn (2) | 1 | 1 | CB | 9 | 12 | none | none | Sandbags hold back the water where the lane dips. Use them sparingly. |
| v04 | The Grey Week | 8 x 12 | 22 | 3 | 2 cottage, 1 barn (3) | 2 | 1 | CB | 11 | 14 | none | surge +2 wk8 x3 | Grey sky on the radio: a surge is coming at the bend in week eight. |
| v05 | Willow Bend | 9 x 12 | 22 | 3 | 2 cottage, 1 barn (3) | 2 | 1 | CB | 12 | 15 | none | surge +2 wk10 x3 | The willows lean over the bend. Keep the cottages above the waterline. |
| v06 | Pump House Row | 9 x 13 | 22 | 3 | 3 cottage (3) | 2 | 1 | CBP | 14 | 17 | none | surge +2 wk9 x3 | The old pump house still works. Lift the water up to the high pasture. |
| v07 | Back Pasture | 9 x 13 | 24 | 3 | 2 cottage, 2 barn (4) | 3 | 1 | CBP | 15 | 18 | none | surge +2 wk6 x2; surge +3 wk14 x3 | Two surges, one dry spell between. Plan for the second wave. |
| v08 | Ferryman's Rise | 9 x 13 | 24 | 3 | 3 cottage, 1 barn (4) | 2 | 2 | CBP | 16 | 19 | none | surge +3 wk12 x3 | Two springs feed the ferry road. One of them is not to be trusted. |
| v09 | Cress Hollow | 9 x 13 | 24 | 3 | 3 cottage, 2 barn (5) | 3 | 2 | CBP | 17 | 20 | none | surge +2 wk5 x2; surge +3 wk15 x3 | The hollow floods first and drains last. Send the water around it. |
| v10 | Midsummer Surge | 9 x 13 | 24 | 3 | 3 cottage, 2 barn (5) | 3 | 2 | CBP | 18 | 21 | none | surge +2 wk4 x2; surge +3 wk12 x3; surge +4 wk19 x2 | Midsummer fair weekend and three surges. Nobody gets wet feet. |

## Delta - Chapter 2 - The Delta Gates

Intro text: Where the river splits, the gates decide who drinks and who swims. Set each gate to open and close on the right week.

Outro text: The gates are oiled and the channels are clear. The delta ships its first dry harvest.

Mechanic: Sluice timing.

| ID | Name | Size (w x h) | Weeks | Inlet rate | Houses | Fields | Inlets | Pieces | Par | Budget | Tide | Forecast events | Dispatcher brief |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| d01 | Gatekeeper's Morning | 9 x 13 | 22 | 3 | 2 cottage, 1 townhouse (3) | 2 | 1 | CBPS | 14 | 17 | none | surge +2 wk8 x3 | The gatekeeper is late. Set the gate to close before the surge arrives. |
| d02 | Braided Channels | 9 x 13 | 22 | 3 | 1 cottage, 2 townhouse (3) | 3 | 2 | CBPS | 15 | 18 | none | surge +2 wk6 x3 | Channels braid and rejoin. Pick which strands to dig. |
| d03 | Reed Island | 9 x 13 | 24 | 3 | 1 cottage, 1 mill, 1 townhouse (3) | 2 | 1 | CBPS | 16 | 19 | none | surge +3 wk10 x3 | An island of reeds and a mill that will not move. Pump or ring it. |
| d04 | Timing Is Everything | 10 x 13 | 24 | 3 | 2 cottage, 1 mill, 1 townhouse (4) | 3 | 2 | CBPS | 17 | 20 | none | surge +3 wk7 x2; surge +3 wk15 x2 | Two surges, one gate. Open it between waves, not during. |
| d05 | Ninefold Mouth | 10 x 14 | 24 | 3 | 2 cottage, 2 townhouse, 1 mill (5) | 3 | 3 | CBPS | 19 | 22 | none | surge +2 wk5 x3; surge +3 wk16 x3 | Nine mouths, three inlets. The town sits in the middle of all of them. |
| d06 | Salt Meadow Dyke | 10 x 14 | 24 | 3 | 1 cottage, 2 townhouse, 1 mill (4) | 4 | 2 | CBPS | 19 | 22 | none | surge +3 wk9 x4 | The dyke keeps the salt meadow dry, if you build it where the ground is firm. |
| d07 | Heron Crossing | 10 x 14 | 26 | 3 | 2 cottage, 2 mill, 1 townhouse (5) | 3 | 2 | CBPS | 20 | 23 | none | surge +2 wk4 x2; surge +3 wk13 x3 | Herons own the crossing; the water must go around them. |
| d08 | Spring Thaw Run | 10 x 14 | 26 | 3 | 3 cottage, 2 townhouse, 1 mill (6) | 4 | 3 | CBPS | 22 | 25 | none | surge +2 wk4 x3; surge +3 wk14 x3; surge +4 wk21 x2 | Spring thaw comes in three pushes. Each one bigger than the last. |
| d09 | The Long Sluice | 10 x 14 | 26 | 3 | 2 cottage, 2 townhouse, 2 mill (6) | 4 | 2 | CBPS | 23 | 26 | none | surge +4 wk8 x3; surge +3 wk18 x3 | A long channel with a single gate. Time it to the turn. |
| d10 | Delta Festival Night | 10 x 14 | 26 | 3 | 3 cottage, 2 townhouse, 2 mill (7) | 5 | 3 | CBPS | 25 | 28 | none | surge +2 wk3 x2; surge +3 wk10 x3; surge +4 wk18 x3 | Festival lanterns on every bridge. Keep every house dry tonight. |

## Highland - Chapter 3 - The Highland Cisterns

Intro text: Up here the river sleeps for weeks at a time. Build reservoirs while it runs and let the hills drink slowly.

Outro text: The cisterns are full and the terraces are green. The highlands do not forget this year.

Mechanic: Reservoirs and droughts.

| ID | Name | Size (w x h) | Weeks | Inlet rate | Houses | Fields | Inlets | Pieces | Par | Budget | Tide | Forecast events | Dispatcher brief |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| h01 | Cistern Hill | 10 x 14 | 24 | 3 | 2 cottage, 1 barn (3) | 2 | 1 | CBPSR | 16 | 19 | none | drought -2 wk10 x4 | A cistern on the hill. Fill it while the river runs and drink when it stops. |
| h02 | Terrace Steps | 10 x 14 | 24 | 3 | 1 cottage, 2 barn, 1 school (4) | 3 | 1 | CBPSR | 18 | 21 | none | drought -2 wk8 x5 | Terraces step down to the village. Water wants to run the wrong way. |
| h03 | Dry Spell | 10 x 14 | 26 | 3 | 2 cottage, 1 barn, 1 school (4) | 3 | 1 | CBPSR | 19 | 22 | none | drought -3 wk6 x6 | The river sleeps for six weeks. Store before you share. |
| h04 | Quarry Basin | 10 x 14 | 26 | 3 | 2 cottage, 2 barn, 1 school (5) | 3 | 2 | CBPSR | 20 | 23 | none | surge +3 wk5 x2; drought -3 wk14 x5 | The quarry makes a fine basin, and a dangerous one. |
| h05 | Switchback Spring | 11 x 14 | 26 | 3 | 3 cottage, 1 barn, 1 school (5) | 4 | 2 | CBPSR | 22 | 25 | none | drought -3 wk8 x4; surge +3 wk18 x3 | Switchbacks slow the water. Use them to buy time before the surge. |
| h06 | Shepherd's Tank | 11 x 14 | 26 | 3 | 2 cottage, 2 barn, 2 school (6) | 4 | 2 | CBPSR | 23 | 26 | none | drought -3 wk6 x4; surge +3 wk16 x3 | The shepherd's tank feeds the school. Do not let it overflow. |
| h07 | Cloudbreak Pass | 11 x 15 | 28 | 3 | 3 cottage, 2 barn, 1 school (6) | 4 | 2 | CBPSR | 24 | 27 | none | surge +4 wk6 x3; drought -3 wk16 x6 | A cloud breaks over the pass. Short surge, big drop, long dry spell. |
| h08 | The Two Reservoirs | 11 x 15 | 28 | 3 | 3 cottage, 2 barn, 2 school (7) | 5 | 2 | CBPSR | 26 | 29 | none | drought -3 wk5 x5; surge +3 wk17 x3 | Two reservoirs, one choice: which one feeds the barns? |
| h09 | Drought Year | 11 x 15 | 28 | 3 | 3 cottage, 3 barn, 1 school (7) | 5 | 1 | CBPSR | 27 | 30 | none | drought -3 wk4 x6; drought -3 wk16 x6 | No rain for twelve weeks. Every drop you store counts. |
| h10 | High Water Mark | 11 x 15 | 28 | 3 | 3 cottage, 3 barn, 2 school (8) | 5 | 3 | CBPSR | 29 | 32 | none | drought -3 wk5 x5; surge +4 wk13 x3; surge +4 wk22 x3 | Last year's high water mark is painted on the school wall. Stay below it. |

## Estuary - Chapter 4 - The Estuary Tides

Intro text: The sea comes in twice a day and it does not ask. Build above the tide line and let the river leave on the ebb.

Outro text: The tide turns and the town stays dry. The dispatcher hangs the radio on its nail.

Mechanic: Tides and storm tides.

| ID | Name | Size (w x h) | Weeks | Inlet rate | Houses | Fields | Inlets | Pieces | Par | Budget | Tide | Forecast events | Dispatcher brief |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| e01 | Low Tide Landing | 11 x 15 | 24 | 3 | 2 townhouse, 1 cottage (3) | 2 | 1 | CBPSR | 17 | 20 | period 8, amp 1 | none | The sea breathes in and out. Dispatch at low tide, or the lane floods. |
| e02 | Spring Tide | 11 x 15 | 24 | 3 | 2 townhouse, 2 cottage (4) | 3 | 1 | CBPSR | 19 | 22 | period 8, amp 2 | none | Spring tide climbs higher than anyone remembers. Raise the lane. |
| e03 | Mudflat Market | 11 x 15 | 26 | 3 | 1 townhouse, 1 school, 2 cottage, 1 mill (5) | 3 | 2 | CBPSR | 21 | 24 | period 6, amp 2 | none | Market stalls stand on mud. Keep canals above the tide line. |
| e04 | Lighthouse Reach | 11 x 15 | 26 | 3 | 1 school, 2 townhouse, 2 cottage (5) | 4 | 2 | CBPSR | 22 | 25 | period 8, amp 2 | surge +3 wk12 x3 | The lighthouse keeper reports a surge from upriver and a tide from the sea. |
| e05 | Neap and Flow | 12 x 15 | 26 | 3 | 3 cottage, 2 townhouse, 1 mill (6) | 4 | 2 | CBPSR | 24 | 27 | period 10, amp 2 | none | A slow tide and a slow river. Patience is the whole puzzle. |
| e06 | Harbour Wall | 12 x 15 | 28 | 3 | 3 townhouse, 1 school, 1 mill, 1 cottage (6) | 4 | 2 | CBPSR | 25 | 28 | period 8, amp 3 | none | The harbour wall protects the school. Cheap to fix, costly to forget. |
| e07 | Cockle Beds | 12 x 16 | 28 | 3 | 3 cottage, 2 townhouse, 1 mill, 1 school (7) | 5 | 2 | CBPSR | 27 | 30 | period 6, amp 3 | surge +3 wk10 x3 | Cockle pickers go out at low tide. Houses behind them must stay dry. |
| e08 | Storm Tide | 12 x 16 | 28 | 3 | 3 townhouse, 2 cottage, 1 school, 1 mill (7) | 5 | 2 | CBPSR | 29 | 32 | period 8, amp 2 | surge +3 wk9 x3; storm tide +2 wk18 x3 | A storm pushes the tide two steps higher at week eighteen. |
| e09 | Pilot's Gamble | 12 x 16 | 30 | 3 | 3 townhouse, 2 cottage, 1 school, 2 mill (8) | 5 | 3 | CBPSR | 31 | 34 | period 10, amp 3 | storm tide +2 wk14 x3; surge +4 wk22 x3 | The pilot says it will hold. The forecast says otherwise. |
| e10 | Dispatch Day | 12 x 16 | 30 | 3 | 3 townhouse, 3 cottage, 2 school, 1 mill (9) | 6 | 3 | CBPSR | 34 | 37 | period 8, amp 3 | surge +4 wk6 x2; storm tide +2 wk12 x3; surge +4 wk20 x3 | The last dispatch of the season: every mechanic, nine houses, one shift. |

## Placeable pieces (items)

| Piece | Code | Cost | Introduced | Behaviour in one line | Art |
|---|---|---|---|---|---|
| Canal | C | 1 | v01 | Digs the cell 2 levels down and carries water fast (edge cap 4 per step). | code-drawn |
| Sandbag barrier | B | 1 | v03 | Raises the cell crest by 3; water only crosses when the surface passes it. | `sandbag-barrier` |
| Pump | P | 3 | v06 | Lifts up to 4 units per step from its cell to the cell it faces, uphill allowed. | `pump` |
| Sluice gate | S | 2 | d01 | A canal cell that is open only between two chosen weeks; a wall otherwise. | `sluice-gate` |
| Reservoir | R | 4 | h01 | Walled tank on one cell, holds 10 units, fills and drains only through canals. | `reservoir` |

Per-map piece sets are in the map tables. Pieces never carry over between maps.

## Buildings and scenery (art slots)

| Thing | Kinds / slot | Where it appears | Gameplay role |
|---|---|---|---|
| House kinds | `house-cottage`, `house-townhouse`, `house-mill`, `house-barn`, `house-school` | cottage everywhere; barn Valley and Highland; townhouse Delta and Estuary; mill Delta and Estuary; school Highland and Estuary | All behave the same: must be supplied, must not flood. |
| Fields | code-drawn (rows of crop, theme tinted) | every map | Must be irrigated. |
| Scenery trees | `tree-oak` (Valley, Highland), `tree-poplar` (Valley, Delta), `tree-willow` (Valley, Delta, Estuary) | scenery cells `T` | Unbuildable. |
| Windmill | `windmill` | Delta and Estuary scenery cells, at most 1 per map | Unbuildable. |
| Rock outcrop | code-drawn | Highland scenery cells | Unbuildable. |
| Water, canals, terrain, sea, inlet | code-drawn Canvas 2D | everywhere | Gameplay surfaces. |

## Map themes (cosmetic, unlocked by total stars)

| # | Theme | Stars | Look (terrain palette swap, water stays blue) |
|---|---|---|---|
| 1 | Gouache Meadow | 0 | Default: muted greens, ochre fields. |
| 2 | Harvest Ochre | 9 | Warm stubble ochres, rust roofs tint. |
| 3 | Reed and Mist | 27 | Cool grey greens, pale morning haze overlay. |
| 4 | Terracotta Dry | 48 | Baked clay terrain, sage fields. |
| 5 | Slate Highland | 75 | Slate and lichen greens. |
| 6 | Night Lantern | 100 | Dark dusk terrain, warm window lights, lighter water. |
| 7 | Paper Blueprint | 120 | Cream paper with ink-blue lines, still readable heights. |

Every theme keeps text and water contrast within the accessibility rules in `product.md`.

## Mechanic cards (first-time sheets)

| # | Title | Shown on | Text (one short paragraph) |
|---|---|---|---|
| 1 | Dig a canal | v01 (tutorial) | Water runs downhill. A canal is a groove that carries it faster. |
| 2 | Sandbags | v03 | Barriers lift the ground by three. Water only climbs over when it rises that high. |
| 3 | Rain surges | v04 | The forecast bar shows weeks when the river swells. Plan for the tallest wave. |
| 4 | Pumps | v06 | A pump pushes water uphill to the cell it faces. Tap it to turn it. |
| 5 | Sluice gates | d01 | A gate is open only between the weeks you set. Closed, it is a wall. |
| 6 | Reservoirs and droughts | h01 | A reservoir holds ten units. Droughts cut the river, so store water while it runs. |
| 7 | Tides | e01 | The sea rises and falls on a fixed schedule. Low land by the sea floods at high tide. |

## Tutorial plan (v01, steps shown by the onboarding task)

1. "This is the river." Highlights the inlet.
2. "Pick the canal." Highlights the canal tool.
3. "Drag from the river to the cottage." Requires a connected canal.
4. "Run the season." Highlights Run.
5. "Stars: supply, dry feet, thrift." Result sheet explainer.

## Titles and strings that need writing (all English)

- Game title: Floodplain Dispatch. Tagline: "Water the town before the water finds it."
- Result headlines: 3 stars "Dry feet, full barns."; 2 stars "Everyone drinks. Mind the mud."; 1 star "The town is watered, mostly."; 0 stars (not cleared) "The season got away from us."
- Share template and daily wording: see `product.md`.

## Content counts the validators enforce (task 02)

- 4 regions x 10 maps = 40; ids `v01..v10`, `d01..d10`, `h01..h10`, `e01..e10`.
- Sizes within 8 x 12 and 12 x 16; weeks 20 to 30; every map has a committed reference solution.
- House total 193, field total 133, as in the tables.
- Mechanic gating: surges from v04, sluice gates from d01, droughts from h01, tides and storm tides
  from e01; nothing earlier.
