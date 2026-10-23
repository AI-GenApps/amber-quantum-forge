# Floodplain Dispatch - product

Compact strategy puzzles for a riverside town. Place canals, pumps, barriers, sluice gates and
reservoirs on a top-down grid, run the flood season, read what happened, rewind and improve.
Portrait, offline, no accounts, no ads, no purchases, English only.

## The loop in one minute

1. Pick a map (campaign or the daily).
2. **Plan**: the board shows terrain heights, the river inlet, houses, fields and the sea. A
   forecast bar lists the surge, drought and tide weeks. Spend the budget by placing pieces.
3. **Run**: tap Run season. The season is simulated deterministically (20 to 30 weeks, 4 steps per
   week) and plays back as an animation with 1x, 2x and 4x speed, pause, and a scrub bar.
4. **Read**: each house and field gets a badge (supplied, dry, flooded, irrigated). The result
   sheet shows stars, score, spend and what failed.
5. **Edit and rerun**: Edit returns to planning with all pieces intact. Undo and redo are unlimited
   while planning. There is no failure state, only fewer stars.

## Grid, terrain and cells

- Map size from 8 x 12 (columns x rows) to 12 x 16.
- Each cell has a terrain height 0 to 7 and one kind:
  `land`, `house`, `field`, `scenery` (trees, windmill, rocks; unbuildable), `inlet` (river
  source), `sea` (outlet and tide).
- Buildable cells: land only. Houses, fields, scenery, inlets and sea cells never take a piece.
- Max one piece per cell. Tapping a piece selects it; removing refunds its full cost.
- Water is an integer depth per cell (units). Surface = effective crest + depth.

## Pieces and costs

| Piece | Cost | Effect on the cell |
|---|---|---|
| Canal | 1 | Crest = max(0, height - 2). Edges between two canal-type cells carry up to 4 units per step. |
| Sandbag barrier | 1 | Crest = height + 3. Holds no extra rule; it is simply higher ground. |
| Pump | 3 | Faces N, E, S or W (tap to rotate). Each step moves min(4, depth) from its own cell to the faced cell, uphill allowed, if the target can take it. |
| Sluice gate | 2 | Canal behaviour while open, a wall while closed. Player sets "opens week" and "closes week" (open from the first up to but not including the second). Default open for the whole season. |
| Reservoir | 4 | Crest = max(0, height - 3). Walled: land neighbours never exchange water with it. Exchanges water only with canal, open gate, pump-in or pump-out neighbours. Holds max 10 units. |

Canal-type cells for edge capacity: canal, open sluice gate, reservoir, sea, inlet.

## Water simulation (fixed step, deterministic)

All numbers are integers; no randomness, no clock. 1 week = 4 steps. One step, in this order:

1. **Inlets** add `rate(week)` units to their own cell. `rate = max(0, base + sum of active surge
   deltas - sum of active drought deltas)`. Base is the map's inlet rate (2 or 3).
2. **Pumps** act in row-major order on the live depths.
3. **Flow**: from a snapshot of depths, for each cell A (row-major) and each neighbour B (order N,
   E, S, W by ascending surface of B), if S_A - S_B >= 2 the desired flow is
   `min(edgeCap, floor((S_A - S_B) / 2), remaining depth of A)`. `edgeCap` is 4 on canal-type
   edges and 2 on all others. Reservoir capacity and wall rules clip flows. Gates closed block.
   All flows are applied together after calculation. A cell never holds more than 99 units; the excess is discarded.
4. **Sea**: each sea cell is set to the current tide level (excess discarded, shortfall created).
   Tide level for week w: `phase = w mod period; half = period / 2`; level is
   `floor(amp * phase / half)` when `phase <= half` else `floor(amp * (period - phase) / half)`,
   plus the active storm-tide delta. With no tide the level is 0 (a pure drain).
5. **Metrics**: per house `floodedSteps` (depth >= 2 at step end) and `suppliedSteps` (an adjacent
   canal-type cell has depth >= 2); per field `wetSteps` (depth 1 to 4).

Rules read from the metrics at season end:

| Result | Rule |
|---|---|
| House supplied | suppliedSteps >= 6 |
| House flooded | floodedSteps >= 1 (any single step) |
| Field irrigated | wetSteps >= 6 |

Rationale and tuning: `decisions-log.md`. Balance constants live in one file in the core
(`constants.ts`); any change updates this table, `economy.md` and the tests.

## Events and forecast

- **Surge** (from v04): inlet rate +delta for N weeks starting at week W. Shown as a blue wave on
  the forecast bar.
- **Drought** (from h01): inlet rate -delta (floor 0) for N weeks. Shown as a sun mark.
- **Tide** (from e01): period and amplitude per map. Shown as a sine strip with the sea level.
- **Storm tide** (from e08): adds +delta to the tide level for N weeks. Shown as a cloud on the strip.
- The forecast is always fully visible before Run; there are no hidden events.

## Goals, stars and score

| Star | Condition |
|---|---|
| 1 (Supply) | Every house supplied and every field irrigated. |
| 2 (Dry feet) | Star 1 and zero flooded houses. |
| 3 (Thrift) | Star 2 and spend <= par (par = cost of the reference solution). |

Score for the best-score history: `200 (if star 1) + 100 per supplied house + 50 per irrigated
field - 150 per flooded house + 20 per unspent budget point`, never below 0. A map is "cleared"
at star 1. The result sheet also lists partial progress (for example 3 of 4 houses supplied).

## Campaign structure

- 4 regions x 10 maps. Map n+1 unlocks when map n is cleared. Regions unlock by total stars: Delta
  12, Highland 33, Estuary 60 (120 maximum). Mechanics per region are in `content-plan.md`.
- Replaying any cleared map is free and only improves stars, score and (once) coins.

## Daily Dispatch

- One generated map per local calendar day, seed `dailySeed("floodplain-dispatch", dateKey)` from
  the kit, generated on the device. Same date, same map, on every device and run.
- Weekday ladder (local weekday): Mon 8 x 12 no events; Tue 8 x 12 with a surge; Wed 9 x 13 with
  surges; Thu 10 x 14 with gates and surges; Fri 10 x 14 with reservoirs and droughts; Sat 11 x 15
  with tides; Sun 12 x 16 with every mechanic. Piece sets match the region that teaches the mechanic.
- The generator proves a 3-star solution exists by running a bounded solver on the finished map,
  rerolling the attempt index up to 12 times, then using a proven fallback template. The test
  checks 365 consecutive dates: every one must have a verified 3-star solution, and at most 5 percent
  (18 dates) may use the fallback templates.
- Daily stars do not count toward the 120 campaign stars. Rewards and streak: `economy.md`.
- Streak: +1 per day with at least one daily star; missing a day resets it unless a streak freeze
  is used. A clock that moves backwards never advances or breaks the streak (kit `streakStep`).

## Hints

A hint reveals the next piece of the reference solution (a ghost piece on the right cell) and costs
coins (`economy.md`). Using hints does not remove stars. Daily hints use the solver's solution.

## Screens

1. Boot and loading (fonts, art, audio preload with progress).
2. Title and home: Play, Daily Dispatch (with streak), Themes, Records, How to play, Settings.
3. Region select (four regions, lock state, stars needed).
4. Level select (ten map tiles per region, stars, par and best).
5. Planning board (board, piece tray, forecast bar, budget meter, undo/redo, Run).
6. Season playback (same board; speed, pause, scrub, week counter; badges appear live).
7. Result sheet (stars, score, spend, what failed, Next, Retry, Edit, Share).
8. Piece inspector sheet (rotate pump, set gate weeks, remove).
9. Daily Dispatch screen (today's map, streak, freezes, last 14 days).
10. Themes (seven themes, stars needed, apply).
11. Records (best score per map, history list, totals).
12. Settings (sound, music, haptics, reduced motion, high contrast, reset save).
13. How to play (six pages) and mechanic cards.
14. Pause sheet, hint confirm, reset confirm, exit confirm, credits and licences.

## Controls

- Tap a tool in the tray, then tap or drag across the board. Dragging with the canal tool paints
  a connected path; dragging is cancelled by moving the finger out of the board.
- Tap a placed piece to select it. Selected: rotate (pump), set weeks (gate), remove.
- Eraser tool and long-press remove. Pinch or the zoom buttons zoom the board (fit, 1.5x, 2x) and
  drag pans when zoomed.
- Keyboard: arrow keys move a cursor, Enter places or selects, Backspace removes, R rotates,
  Space runs. This is required for accessibility testing in happy-dom.
- Android back: closes sheets, then stops playback, then returns up the stack (kit router).

## Onboarding

First launch plays the v01 guided tutorial (five steps in `content-plan.md`). Each new mechanic
shows its one-time card. How to play can be reopened from home. Flags are saved so nothing repeats.

## Accessibility

- Body text 16 px minimum, labels 14 px minimum; text contrast >= 4.5:1 and non-text UI >= 3:1
  (token table below, verified by a unit test in task 04).
- Every button, tray tool and toggle has a hit area of at least 44 x 44 CSS px. Board cells are
  visually 26 to 30 px at fit zoom; the zoom steps (1.5x, 2x) bring them to 40 to 60 px, and the
  keyboard cursor offers an exact alternative.
- Colour is never the only signal: pieces have distinct silhouettes and glyphs, flood and supply
  badges use icons and text, water depth has hatching in the high-contrast mode.
- Reduced motion (system and in-app) removes playback easing, ripples and parallax; playback
  becomes step-by-week jumps.
- A text summary of the board and the result is exposed as an ARIA live region.
- Fonts: Bricolage Grotesque (display) and Atkinson Hyperlegible (body), both OFL, bundled.

## Art-bible palette (design tokens)

| Token | Hex | Use |
|---|---|---|
| ink | #1f2b22 | text on light, shorelines |
| paper | #f4ecd8 | card and sheet surface |
| paper-2 | #e8dcc0 | secondary surface |
| night | #18231d | app background |
| meadow | #8aa468 | land |
| meadow-deep | #4f6b3c | land shade, positive accents |
| ochre | #c8923a | fields |
| ochre-deep | #7d5516 | field rows, warning text |
| clay | #a7432c | flood alert |
| water | #3b8dc4 | water |
| water-deep | #1f5f8f | deep water, links |
| water-light | #a5d3ee | shallow water, highlights |
| rock | #7d776b | scenery rock |
| sea | #2a6c9c | sea cells |

Measured contrast: ink on paper 12.5, paper on night 13.75, paper on water-deep 5.77, paper on
meadow-deep 5.09, paper on clay 5.12, paper on ochre-deep 5.6, ink on meadow 5.32, ink on ochre 5.35.
Water against land is separated by a 2 px ink shoreline (ink vs meadow 5.32, ink vs water 4.06)
because water vs meadow alone is only 1.31.

## Share text

Campaign: `Floodplain Dispatch - Valley 4 "The Grey Week": 3/3 stars, 0 flooded, spent 11 of 14.`
Daily: `Floodplain Dispatch Daily 2026-10-23: 2/3 stars, 1 flooded. Streak 5.`
Shared through the kit `shareContent` (no URL in v1).

## Non-goals for v1

Ads, purchases, accounts, leaderboards, multiplayer, user-made maps, localisation, tablets in
landscape, cloud save, notifications.
