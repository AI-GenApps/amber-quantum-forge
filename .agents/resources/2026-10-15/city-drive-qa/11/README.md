# Task 11: Three districts, 24 validated missions, district unlocks, QA evidence

Nothing here was produced in a browser. Missions are proven with the real core simulation (Rapier
car, city colliders, parked cars, AI traffic) driven by the test autopilot; rendering cost is checked
headlessly with Babylon `NullEngine`. All commands run on Bun 1.4.2 (the repo pins 1.3.3; the pin is
unchanged).

Files in this folder:

- `validation-report.json`: output of `bun apps-games/city-drive-core/tool/validate-missions.ts --json`
  (difficulty and autopilot metrics for all 24 missions).
- `budget-report.json`: output of `BUDGET_REPORT=1 bunx vitest run test/render/budget.test.ts` in
  `apps-games/city-drive` (per-district draw calls and triangles).

## What shipped

| District | Size | Traffic | Unlock | Mix |
|---|---|---|---|---|
| `district-1` "Old Town" | 12x12 | 8 cars | open | suburban, a little commercial, tight corners |
| `district-2` "Harbor" | 16x14 | 12 cars | 10 stars | commercial and plazas, long straights |
| `district-3` "Downtown" | 12x12 | 16 cars | 24 stars | dense commercial grid, many junctions |

The names are placeholders until the naming task. Each district has 8 missions, 2 of each type, ids
`d{n}-m01` to `d{n}-m08` in difficulty order. `content/progression.json` holds the unlock thresholds,
the difficulty weights and maxima, the traffic density per district and the validation rules.

District 3 is 12x12, not larger: a 16x16 dense grid has 16 render chunks in view from the edge poses and
cost 65 to 69 draw calls (the test asserts the 60-call target), because the renderer pays about four
draw calls per chunk whatever it holds. Task 15 (performance pass) can revisit a bigger downtown.

## ASCII renders

```text
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

   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
 0 . . . . . . . . . . . . . . . .
 1 . ┌───────────┬─────────────┐ .
 2 . │ B B B B B │ o o o B B B │ .
 3 . │ B B B B B │ o o o B B B │ .
 4 . │ B B B B B │ B B B B B B │ .
 5 . │ B B B B B │ B B B B B B │ .
 6 . ├───>───────┼───────┬─────┤ .
 7 . │ B B B B B │ B B B │ B B │ .
 8 . │ B B B B B │ B o o │ p p │ .
 9 . │ B B B B B │ B o o │ p p │ .
10 . │ B B B B B │ B o o │ p p │ .
11 . │ B B B B B │ B B B │ B B │ .
12 . └─────┬─────┴───────┴─────┘ .
13 . . . . ╵ . . . . . . . . . . .

district-2 16x14 tile=20m
road: ┼┬┤┴├ T/cross, │─ straight, └┌┐┘ corner, ╵╶╷╴ road-end; B building, p park, o plaza, . empty; ^>v< spawn

   0 1 2 3 4 5 6 7 8 9 0 1
 0 B B B B B B B B B B B B
 1 B ┌─>───┬─────┬─────┐ B
 2 B │ B B │ B B │ B B │ B
 3 B │ B B │ B B │ B B │ B
 4 B ├─────┼─────┼─────┤ B
 5 B │ B B │ o o │ B B │ B
 6 B │ B B │ o o │ B B │ B
 7 B ├─────┼─────┼─────┤ B
 8 B │ B B │ B B │ p p │ B
 9 B │ B B │ B B │ p p │ B
10 B └─────┘ B B └─────┘ B
11 B B B B B B B B B B B B

district-3 12x12 tile=20m
road: ┼┬┤┴├ T/cross, │─ straight, └┌┐┘ corner, ╵╶╷╴ road-end; B building, p park, o plaza, . empty; ^>v< spawn
```

## Mission table

Columns: difficulty from `missionDifficulty()`; route and junctions measured on the A* route through
every stop; limit is the mission time limit; autopilot is the test autopilot's time and stars with the
district's traffic on (fixed seed 1); the last three columns are the time by which each star level is
still earned (delivery and taxi: limit minus `min_time_left_s`; trial and parking: `max_time_s`).
Delivery and taxi also need their damage or comfort tier; parking its touches.

| id | type | title | difficulty | route m | junctions | limit s | autopilot s | autopilot stars | 1 star by s | 2 stars by s | 3 stars by s |
|---|---|---|---|---|---|---|---|---|---|---|---|
| d1-m01 | delivery | Parcel Hop | 0.205 | 140 | 2 | 80 | 15.883 | 3 | 80 | 21 | 17.5 |
| d1-m02 | taxi | Market Morning | 0.241 | 240.4 | 3 | 110 | 47.05 | 3 | 110 | 61.5 | 51 |
| d1-m03 | parking | Kerbside Park | 0.268 | 90 | 1 | 45 | 17.017 | 3 | 45 | 22.5 | 18.5 |
| d1-m04 | time_trial | Round the Block | 0.283 | 263.9 | 4 | 95 | 41.95 | 2 | 95 | 55 | 39 |
| d1-m05 | delivery | Two Stops Before Tea | 0.333 | 373.7 | 6 | 125 | 61.65 | 2 | 125 | 80.5 | 57 |
| d1-m06 | parking | Squeeze at Number Nine | 0.349 | 190.4 | 2 | 70 | 27.967 | 2 | 70 | 36.5 | 26 |
| d1-m07 | taxi | Cautious Cabbie | 0.398 | 433.3 | 6 | 90 | 49.2 | 2 | 90 | 64 | 45.5 |
| d1-m08 | time_trial | Old Town Sprint | 0.432 | 572.5 | 8 | 125 | 77.05 | 2 | 125 | 100.5 | 71.5 |
| d2-m01 | delivery | Harbour Hello | 0.276 | 160 | 1 | 55 | 17.717 | 3 | 55 | 23.5 | 19.5 |
| d2-m02 | taxi | Seagull Shuttle | 0.312 | 200 | 2 | 60 | 21.333 | 3 | 60 | 28 | 23.5 |
| d2-m03 | time_trial | Breakwater Blast | 0.312 | 441.9 | 3 | 160 | 70.65 | 2 | 160 | 92 | 65.5 |
| d2-m04 | parking | Between the Crates | 0.348 | 110 | 1 | 50 | 18.833 | 3 | 50 | 24.5 | 20.5 |
| d2-m05 | delivery | Fish Market Rush | 0.361 | 460.8 | 5 | 155 | 62.633 | 2 | 155 | 81.5 | 58 |
| d2-m06 | taxi | Captain's Car | 0.363 | 573.3 | 5 | 190 | 93.167 | 2 | 190 | 121.5 | 86.5 |
| d2-m07 | time_trial | Container Circuit | 0.428 | 573.3 | 6 | 135 | 83.8 | 2 | 135 | 109 | 77.5 |
| d2-m08 | parking | Dock Door Squeeze | 0.474 | 370.8 | 3 | 95 | 51.633 | 2 | 95 | 67.5 | 48 |
| d3-m01 | delivery | Lobby Pick-Up | 0.338 | 120 | 2 | 45 | 14.1 | 3 | 45 | 18.5 | 15.5 |
| d3-m02 | taxi | Elevator Music | 0.338 | 120.4 | 2 | 45 | 14.517 | 3 | 45 | 19 | 16 |
| d3-m03 | time_trial | Rooftop Rush | 0.353 | 292.9 | 2 | 95 | 34.8 | 2 | 95 | 45.5 | 32 |
| d3-m04 | taxi | Penthouse Pickup | 0.376 | 333.7 | 4 | 130 | 58.417 | 2 | 130 | 76 | 54 |
| d3-m05 | delivery | Rush Hour Special | 0.382 | 364.3 | 6 | 230 | 103.783 | 2 | 230 | 135 | 96.5 |
| d3-m06 | parking | Valet Practice | 0.406 | 121 | 1 | 50 | 20.717 | 3 | 50 | 27 | 22.5 |
| d3-m07 | time_trial | Downtown Derby | 0.439 | 524.3 | 6 | 165 | 89.217 | 2 | 165 | 116 | 82.5 |
| d3-m08 | parking | Rush-hour Parallel | 0.468 | 161 | 3 | 80 | 39.2 | 2 | 80 | 51 | 36 |

## Checks that hold (all in `apps-games/city-drive-core/test/content/` and `test/missions/`)

- 24 missions, 8 per district, 2 per type per district; ids contiguous; titles unique and original.
- Autopilot proof: every mission completes with at least 1 star (all 24 earn it with 0 damage). Stored
  metrics equal a fresh run (vitest on Node V8 reproduces what the Bun tool wrote: same numbers on two
  engines).
- Strictness: 15 of 24 missions give the autopilot only 2 stars (3-star time is 93% of the autopilot's
  time, rounded down to half a second), the rest give it 3 stars (their 3-star time is at least 108% of its time). The 3-star time
  is never below 85% of the autopilot's time: the lowest is 91.8% (`d3-m08`).
- Ramp: difficulty never drops inside a district (0 inversions, 1 allowed), and `d2-m01` (0.276) is
  easier than `d1-m08` (0.432), `d3-m01` (0.338) is easier than `d2-m08` (0.474).
- Progression: district 2 at 10 stars, district 3 at 24. With a 2-star average every district opens
  (district 1 alone gives 16 stars; with district 2 that is 32). Unlocks never lock a single mission.
- Determinism: the tool run twice gives byte-identical files (`rewrote 0 file(s)`); `--check` fails
  with a non-zero exit when one stored number is changed.

## Budget (task 06/09 test, now over all three districts)

Per district, at its own traffic density, with the player car and the free-roam or mission overlay:

| District | Cars | Worst draw calls (9 poses) | Worst with overlays | Sweep worst | Worst triangles |
|---|---|---|---|---|---|
| district-1 | 8 | 54 | 57 | 57 draws | 137k |
| district-2 | 12 | 56 | 59 | 59 draws | 128k |
| district-3 | 16 | 45 | 48 | 48 draws | 128k |

Targets: below 60 draw calls and at most 150k triangles (hard cap 100 draw calls). Districts 2 and 3
originally went over: 186k and 204k triangles with the first layouts. The fix was content only: an empty
outer ring (empty tiles cost nothing), a palette of the lighter commercial models, and the models rotated
inside each 4x4 render chunk so no model repeats three times (three or more would become a separate
thin-instance host and add draw calls).

## How the autopilot handles traffic (test support, not shipped code)

`test/support/autopilot.ts` stays blind by default. With `watch: TrafficWatch`
(`test/support/traffic-watch.ts`), which `driveMission` sets whenever the rig has traffic, it follows a
slower car in its lane with a gap and does not enter a junction tile while another car is inside it or
is moving towards it (within 10 m plus 3 s of its travel). That is what a careful human does, and it
removed the collisions the first blind version had at junctions (the traffic does not yield to the
player there). It makes the autopilot slower at busy junctions, so the stored times include the waits.

## Decisions worth knowing

- **Difficulty terms.** route/time ratio = route length / (time limit x 11.11 m/s), capped at 1
  (11.11 m/s is the 40 km/h autopilot cruise: "normalised against 1.0" is a time budget that needs the
  reference speed all the way). Intersections are passes through tiles with three or more open sides,
  against 12. Traffic is the district's agent count, against 16. Parking tightness uses the bay margin,
  the smaller of (width/2 - car half width) and (length/2 - car half length): 0.2 m gives 1, 1.5 m gives
  0. Weights 0.4, 0.25, 0.2, 0.15 live in `progression.json`.
- **Ids by difficulty.** Missions were authored, measured, then numbered by their difficulty, so the
  ramp holds by construction; the test still checks it.
- **The 4 task-10 samples** moved to `apps-games/city-drive-core/test/fixtures/missions/` and stay the
  fixtures of the engine tests (they are not shipped content any more).
- **Per-district start markers** are at least 45 m apart; the harness fails if a briefing for a
  different mission opens (it caught four overlapping markers while authoring).

## Not run

No browser, device or emulator: the look of the three districts and the feel of the missions belong to
the human checkpoint (task 16).
