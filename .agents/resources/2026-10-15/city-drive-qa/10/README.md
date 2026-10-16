# Task 10: Mission engine, QA evidence

Nothing here was produced in a browser. Logic is checked with Vitest (the real Rapier simulation, a
scripted-sample unit layer, and a pure-pursuit autopilot); rendering is checked headlessly with Babylon
`NullEngine`. Commands: `MISSION_REPORT=1 BUDGET_REPORT=1 bun run city-drive:test`.

## autopilot-report.json

The test autopilot (`apps-games/city-drive-core/test/support/autopilot.ts`, default settings) drives the
real core simulation (Rapier car, city colliders, parked cars) along the A* route the `MissionSystem`
exposes, for each sample mission on `district-1`. Each mission starts with the car on its start marker;
the briefing opens by itself (car below 15 km/h inside the marker radius), the test accepts it, and the
autopilot drives to the end.

| Mission | Type | Result | Stars | Time (s) | Damage | Comfort |
|---|---|---|---|---|---|---|
| d1-m01 | delivery | success | 3 | 31.1 | 0 | n/a |
| d1-m02 | taxi | success | 3 | 27.8 | 0 | 97.0 |
| d1-m03 | time trial | success | 3 | 29.8 | 0 | n/a |
| d1-m04 | parking | success | 3 | 15.2 | 0 | n/a |

`carHash` is the Rapier state hash at the end of the run; running each mission twice gives the same hash,
the same result and the same step count (asserted by `integration.test.ts`).

Other integration assertions: a slower driver (12 km/h cruise) earns fewer stars on the delivery; an idle
car fails with `time_out`; driving into a building counts as damage; steering into a parked car counts as
a parking touch.

## budget-report.json

The task 09 budget scene (player car plus 16 traffic cars at 9 poses), now with every mission visual in
view: free-roam (4 start-marker beams) and mission (40 route arrows, objective beam, bay pad, two parked
cars). Hard budgets: 100 draw calls, 150 000 triangles; target below 60 draw calls.

| | Task 09 | With mission visuals |
|---|---|---|
| Worst draw calls | 54 | 57 |
| Worst triangles | 140 995 | 142 983 |

Method note: NullEngine reports no GPU draw calls; the cost model is the one from task 09
(`src/render/stats.ts`).

## Not covered here

Visual quality of the markers, beam, ribbon and panel, and how missions feel to drive, belong to the
human checkpoints (tasks 16 and 22). Task 11 authors the final missions; task 12 consumes
`MissionResult`.
