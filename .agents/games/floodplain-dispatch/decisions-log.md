# Floodplain Dispatch - decisions log

Dated entries. All dates 2026-10-23 (planning day, task 00 of epic 20).

## 2026-10-23 - Owner decisions (final, from `.claude/workflows/web-games-v1-args.json`)

1. Full v1 for all six web games (complete loop, full content, progression, local save, reviewed
   art, custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android and iOS projects). No
   store submission.
   Rationale: ship a finished product per game and decide store steps later.
2. Wave 1 with Lantern Loops and Cloud Observatory; Floodplain Dispatch is epic 20.
3. No monetization: soft currency and unlocks only, no ads, no IAP, no accounts, no network.
4. QA is browser-only and done by the owner at the end. Agents run no browser, device or emulator,
   build no APK, install no JDK. Verification is Vitest (happy-dom), tsc, vite build and Biome.
5. Stack: TypeScript, Vite, Preact, Vitest, Capacitor 8. DOM, SVG and Canvas 2D. No engines.
6. Structure: `apps-games/floodplain-dispatch` (app) and `apps-games/floodplain-dispatch-core`
   (headless rules); shared code in `apps-games/web-kit`.
7. Portrait, offline-first, local save only, versioned with migrations; daily seeded from the
   local date and generated on device.
8. Graphics only from the MobileGamesDesigner thread after strict review; fonts OFL; audio CC0 only.
9. The working title is the public name for v1.
10. Every game ships on its own branch and PR, merged by the orchestrator.

## 2026-10-23 - Design decisions

### Region to mechanic mapping
Valley adds rain surges, Delta sluice-gate timing, Highland reservoirs (with droughts), Estuary
tides. The spec lists the four mechanics without a mapping; this order matches the setting (rivers
first, gates where channels split, storage in the hills, tides at the sea) and spreads piece
introductions: canal v01, barrier v03, pump v06, gate d01, reservoir h01.

### One tick unit: "week"
A season is 20 to 30 turns, shown to the player as weeks; each week runs 4 fixed steps. Keeps the
"turns" wording of the spec while giving the lore a clock.

### Integer, snapshot-based water model
Depths are integers; flow is `floor(diff / 2)` capped by edge capacity (4 canal-type, 2 otherwise)
and by the source depth, applied simultaneously from a snapshot. Integers keep the simulation
exactly reproducible across engines and make golden tests trivial; `floor(diff/2)` avoids the
one-unit sloshing that `ceil` causes.

### Goal rules count steps, not end state
Supply needs 6 supplied steps and irrigation 6 wet steps over the season; flooding is zero
tolerance (one step with depth >= 2). Counting steps prevents "drain it at the last second"
exploits and makes the result badges explainable.

### Stars are cumulative
1 = supply, 2 = plus zero flooded houses, 3 = plus spend within par. A map is cleared at 1 star so
players are never blocked by perfectionism, and the three spec goals (supply, zero flood, under
budget) map one to one.

### Par and budget
Par equals the cost of the committed reference solution (validator-checked, and every piece of it
must be necessary: removing any single piece must lose the third star). Budget is par plus 3
points on every map (par runs from 6 in v01 to 34 in e10). The spec's "budget left" goal is
the third star.

### Soft currency design
One currency (coins) with two sinks (hints, streak freezes). Themes unlock with stars per the
spec, so coins never gate content, keeping the game fair and leaving room for a later coin-pack IAP.
Totals are fixed in `economy.md` (1250 campaign coins).

### Stars from the daily do not count
Keeps the 120-star ceiling and the unlock thresholds stable; the daily feeds coins and streak only.

### Daily difficulty by weekday
A seven-step ladder (8 x 12 plain up to 12 x 16 with every mechanic) is predictable for players and
simple to test. The generator validates with a bounded solver and rerolls up to 12 attempts, then
uses fallback templates; the 365-date test limits fallbacks to 5 percent.

### Hints reveal one piece at a time
Cheaper to build than a full solution view and keeps the puzzle intact; never removes stars.

### Board interaction and accessibility
Cells are 26 to 30 px at fit zoom, below the 44 px hit-area target, so the board offers zoom steps
(fit, 1.5x, 2x), drag-to-paint canals, a keyboard cursor and a text board summary. All other
controls are at least 44 x 44. This is documented rather than hidden.

### Scenery uses unbuildable cells
Trees, the windmill and rocks occupy `scenery` cells, so art never overlaps a buildable cell and the
solver never has to reason about decor.

### Palette and contrast
The 14-token palette keeps water readable on every theme; because water vs meadow is only 1.31:1,
water edges always get a 2 px ink shoreline. Contrast ratios are recorded in `product.md`.

### Fonts
Bricolage Grotesque variable (`ofl/bricolagegrotesque`, file
`BricolageGrotesque[opsz,wdth,wght].ttf`) for display and Atkinson Hyperlegible (`ofl/atkinsonhyperlegible`,
Regular and Bold static files) for body, both confirmed present in `github.com/google/fonts` on
2026-10-23. Atkinson Hyperlegible Next exists but the spec names the original family.

### Mechanic cards and tutorial
Tutorial only on v01 (five steps); every other mechanic has a single dismissible card on first
appearance, so there is no mandatory long onboarding.

### Content counts
40 maps, 193 houses, 133 fields, 7 themes, 7 mechanic cards, 40 dispatcher briefs. Customers, cases,
evidence and constellations from the generic template do not apply to this game.

### Task structure
Eight tasks (01 core, 02 content, 03 progression and save, 04 screens, 05 audio and onboarding,
06 art, 07 Capacitor, 08 release). Task 00 is this knowledge base and has no task file.

### Core carries its own PRNG and takes dates as plain values
The core package has no dependencies and the skeleton dependency set may not change, so the core
cannot import the kit. It ships a small seeded PRNG and accepts a numeric seed, a date key string,
a weekday number and the kit's streak step as arguments. The app computes those with the kit
(`dailySeed`, `localDateKey`, `streakStep`). Rules stay pure and testable in Node.

### Board drawn through a Draw2D interface
happy-dom has no canvas, so renderers are pure functions over a small drawing interface; tests use
a recording fake. This keeps the no-visual-QA rule intact while still testing what is drawn.

### Content plan is machine-checked
Task 02 parses `content-plan.md` in a test and compares it with the shipped map data, and task 08
cross-checks shared numbers between the knowledge base and code, so documents cannot drift.

### Android INTERNET permission
Left at the Capacitor default until a device can confirm the offline WebView loader works without
it (open question Q9). The app makes no network requests either way.

## 2026-10-23 - Task 01 engine interpretations (no constant changed)

Rules the spec left open, fixed by the core engine and pinned by tests. None changes a number in
`product.md` or `economy.md`.

- **Events apply to every inlet.** A surge or drought changes the rate of all inlets; the map has
  one forecast, not one per inlet.
- **Storm tide needs a tide.** With no tide spec the sea level is always 0 and storm-tide events are
  ignored.
- **Tide integer formula.** `floor(2 * amp * span / period)` with `span = phase` when
  `2 * phase <= period`, else `period - phase`. Identical to the spec for even periods (6, 8, 10).
- **Sea starts at the week 0 level** and is reset to the current level at the end of every step.
- **Reservoir partners.** A reservoir exchanges water by flow only with canal, open gate and pump
  cells; a pump that faces the reservoir is not a flow partner (it delivers by pumping only). Sea,
  inlet, bare land, barriers and other reservoirs are walls. The capacity clip (10) uses the start of
  step depth plus inflow accepted so far in row-major order.
- **Pump transfer is partial.** A pump moves `min(4, own depth, room in target)`; a full target (10
  for a reservoir, 99 otherwise) or a closed gate stalls it. A pump facing the board edge idles.
- **Closed gates hold their water.** Water already in a gate cell stays there until it reopens.
- **Equal-surface ties** are served N, E, S, W, so a cell with too little water for all lower
  neighbours favours the earlier direction; mirror symmetry therefore holds only while the source
  has enough water (tested with deep sources).
- **Illegal placements are ignored by the simulator** (out of bounds, not on land, second piece on a
  cell); legality is the job of `checkPlacement`.
- **Gate weeks.** `opensWeek` defaults to 0 and `closesWeek` to the season length; `checkPlacement`
  requires `0 <= opens < closes <= weeks`. Only gates may carry weeks and only pumps a direction.
