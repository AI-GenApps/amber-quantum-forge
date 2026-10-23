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
simple to test. The generator proves every map by simulation (task 03 refined how, see below) and
rerolls up to 12 attempts, then uses fallback templates; the 365-date test limits fallbacks to 5
percent.

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

## 2026-10-23 - Task 02 content (40 maps, validators)

No binding number moved. Names, sizes, weeks, inlet rates, house kinds, fields, inlets, pieces, par,
budget, tide, forecast events, briefs, chapter texts, mechanic cards, theme thresholds and region
unlock stars are exactly the rows of `content-plan.md`; `test/content-plan.test.ts` parses that file
and fails on any drift. `product.md` and `economy.md` are unchanged.

### Map data model
`MapDef` gained an optional `reference` (the committed solution). Shipped maps are `CampaignMap`
(`MapDef` plus `id`, `name`, `region`, `brief`, and a required `reference`). One data file per
region under `src/content/`, built with a tiny constructor DSL (`c`, `b`, `p`, `g`, `r`, `surge`,
`drought`, `stormTide`). House kinds are listed in row-major order of the `H` cells; which kind sits on
which house is decided by a seeded shuffle and is cosmetic (all kinds behave the same).

### How the maps were authored (repeatable, simulation-checked)
Maps are authored reference-first, then the terrain is solved, never hand-tuned by eye:

1. A river layout: each inlet gets a short drain (a sea cell two to three cells away, reached over
   falling ground), so overland water stays local instead of flooding the whole board; Estuary
   maps add a tidal bay at the bottom edge. Ground follows a cone that falls away from the inlets.
2. Houses and fields are scattered, and a Steiner tree of canal cells from the inlets to a cell beside
   every target is built. Special pieces (barrier, pump, gate, reservoir) are placed per map recipe so
   the total cost is exactly par (tree cells + the extra cost of each special piece).
3. Terrain heights are found by simulated annealing against the real engine until: the reference earns
   three stars, removing any single piece loses a star, and replacing a gate, pump or reservoir by a
   plain canal also loses a star (so those pieces are needed, not decorative). A polishing pass pulls
   the heights back toward the smooth cone so the board reads as a landscape.
4. Scenery (trees) is then added. Scenery is physically identical to land and only removes buildable
   cells, so it can never break a proof. Cells within two steps of every house and field that the
   reference does not use are sealed with trees, and any cell used by a cheaper solution found by a
   separate stochastic placement search is blocked, until that search finds nothing cheaper than par
   (a tolerance of 1 is allowed). Remaining empty land is decorated.

The authoring tools and logs are kept under
`.agents/resources/2026-10-23/web-games/floodplain-dispatch/02/` (not shipped, not imported by `src/`).

### What "par is honest" means
Par is the cost of the committed reference and every piece is needed (tests re-run each map with each
piece removed). Par is not claimed to be the global minimum: the authoring pipeline blocked every
cheaper placement its stochastic search found, but a final re-check with three fresh seeds still
finds cheaper placements on 27 of the 40 maps (largest gaps: e04 13, d09 12, h06 12, d07 10, d08 10).
The per-map search minimum is recorded in the resources README. Such a placement still earns three
stars (cost at most par), so the effect is a looser par, not a broken map. Task 03's exact solver is
the tool to measure and, if the owner asks, tighten this.

Map d10 uses a single gate in its reference (a two-gate recipe found no design); the `Pieces`
column is the set the player may use and did not change.

### Scenery and the unbuildable cells
Because trees block canals, the sealed ring around houses and fields is part of the puzzle: the
reference cells are the only buildable cells touching a house. Task 04 should draw reference-free
scenery as woods or hedges rather than as obstacles with their own meaning.

## 2026-10-23 - Task 03 progression, economy, daily mode and save (no economy number changed)

### Profile is plain data and the core never sees the kit
`Profile` (version 1, key `floodplain-dispatch.profile`) lives in the core with pure reducers
(`applyCampaignResult`, `applyDailyResult`, `buyHint`, `buyFreeze`). The app injects what needs the
kit: the date key, the streak step (`first`, `same-day`, `next-day`, `gap`, `clock-went-back`) and
the number of missed days. `dailySeedOf(dateKey)` and `weekdayOfDateKey` exist in the core and are
tested to equal the kit's `dailySeed` and `dayNumber`.

### Clock going back and zero-star dailies are neutral
Setting the clock back must not farm coins or break a streak; a 0-star daily attempt pays and counts
nothing. Daily results are kept for 60 days, so a date older than that cannot be replayed for coins
through a back-dated clock either (the step is `clock-went-back`).

### A failed freeze cover keeps the freezes
If the held freezes do not cover every missed day the streak restarts and no freeze is spent.
Player-friendly and simpler to explain; the economy numbers are unaffected.

### `sanitizeProfile` rejects wrong types and forgives unknown content
Wrong types on known top-level fields reject the whole profile (the kit then keeps a backup and starts
fresh); missing fields use defaults; unknown map ids, regions, flags and keys are dropped; values are
clamped (coins >= 0, stars 0 to 3, freezes 0 to 2, history 50, daily results 60). Future work adds
migrations as `migrations[1]` when the schema changes; the chain through the same parse is tested
with a local version 2 schema.

### Daily maps are made reference-first, par is the generated reference
A random terrain plus a bounded solver solved too few maps: the water model lets overland water
pool in any canal, so flat or lumpy random terrain often has no flood-free supply solution within
the simulation cap. The generator therefore builds a canal tree first, shapes the terrain around it
and anneals single heights against the real engine until the tree earns three stars (same method the
campaign authoring used), then trims unneeded leaves; par is the trimmed tree's cost, budget par + 3.
The bounded solver stays in the loop as a repair step and as the hint engine for arbitrary maps.
Measured over 365 dates from 2026-01-01: 0 fallbacks, all 365 re-verified at three stars (evidence in
`.agents/resources/2026-10-23/web-games/floodplain-dispatch/03/README.md`).

### Daily piece sets and events follow the tier table in `product.md`
Monday and Tuesday offer canals and barriers (Monday has no events), Wednesday adds pumps, Thursday
gates, Friday to Sunday all five pieces. The earlier planning text left Monday's set open.

### The solver is a heuristic, not an exact search
`solveMap(def, { maxSims, maxCost, seed, starts })` is a best-first search over placements with
at most 20000 simulated seasons (default). It solves 35 of the 40 campaign maps (Valley 9, Delta 9,
Highland 9, Estuary 8) and reports `null` for the rest. Because it is not exact it does not prove that
par is minimal; it does find cheaper three-star placements on many maps, which quantifies the
known "par is a reference, not a minimum" gap (resources README, table). No par was changed.

### Simulation hot loops use local constant aliases
Vitest reads imported bindings through a module object, which made the engine about three times
slower under test. `simulate.ts` now copies the imported constants into module-level consts. The
engine output is unchanged (golden hashes, determinism and property tests pass).

### Floating point in generation is kept to + - * / and comparisons
Annealing acceptance uses a truncated series instead of `Math.exp` and the temperature falls
linearly, so the same date gives the same map on V8 and JavaScriptCore.

## 2026-10-23 - Task 04 decisions (screens, tokens, fonts, accessibility)

### The board is drawn by pure functions against a small `Draw2D` interface
happy-dom has no canvas, so `src/board/draw*.ts` take a `Draw2D` (the subset of
`CanvasRenderingContext2D` used) and the browser passes the real 2D context. Tests inject a
recording fake and assert the draw calls for a small fixture board; there is no pixel or screenshot
test. The same shape lists (`src/art/shapes.ts`) draw the code-drawn art fallbacks on the canvas
and as inline SVG in `<Sprite>`, so one drawing serves the board, the tray and the menus.

### Art slots resolve through an empty manifest
`src/art/slots.ts` lists the 20 slots, `src/art/manifest.ts` lists which have a file in
`public/art/` (empty), and `<Sprite slot=... />` and the board draw the image when listed and the
code-drawn fallback otherwise. Task 06 only adds manifest entries.

### Fonts: pinned axes, one variable display file, two static body files
Bricolage Grotesque is pinned at `opsz` 36 and `wdth` 100 with `wght` kept variable (400 to 800);
Atkinson Hyperlegible ships Regular and Bold. All three are subset to the characters the game
uses and converted with `fonttools` through `uvx` (no project dependency). 73,364 bytes in total.
Because the subset is small, every UI icon is an SVG path (`src/ui/Glyph.tsx`) rather than a text
glyph, and a test fails if a source file contains a character outside the subset.

### Two surface contexts: night chrome and paper cards
The kit has one text token for screens and sheets. The app background is `night` with `paper` text;
sheets, cards, tiles and panels are `paper` with `ink` text through a scoped token override
(`PAPER_SELECTOR`, injected by `installTheme`). Three derived colours exist only to pass contrast:
`BORDER_ON_NIGHT`, `MUTED_ON_PAPER` and the two dark surface shades. The danger button text and the
toggle thumb are overridden in `styles.css` because the kit values failed 4.5 and 3.

### Map themes recolour the board and the page background only
The seven themes (`src/theme/mapThemes.ts`, keyed by core `ThemeDef.id`) swap terrain, field,
scenery, water ramp, shoreline and haze colours; UI chrome keeps one palette so text contrast is
shared. Night Lantern uses a paper shoreline (the ink shoreline fails on dark land); Paper Blueprint
uses a blue-ink shoreline. Contrast is asserted for ten board pairs per theme and 29 chrome pairs.

### Hints, results and recording
The hint is the next reference piece the plan does not yet hold (kind, cell and, for pumps and
gates, direction and weeks); pressing Hint when the plan already matches costs nothing. The season
result is recorded in the profile when Run is pressed (the outcome is deterministic), and the result
sheet opens when playback ends or the player scrubs or skips to the end. Retry clears the plan; Edit
keeps it.

### Playback timing
Smooth playback advances one simulation step per tick (160 ms at 1x, 80 ms at 2x, 40 ms at 4x, so
a 20-week season takes about 13 seconds at 1x). With reduced motion on (system or in-app) playback
jumps one whole week per tick (700 ms at 1x) and the sea waves and spring ripples are not animated.
The season timeline is built once per Run by stepping the engine and snapshotting depths and the
cumulative house and field metrics, and is tested to end exactly where `runSeason` ends.

### Navigation and back button
Routes are typed through the kit router (`boot`, `home`, `regions`, `levels`, `board`, `daily`,
`themes`, `records`, `settings`, `howto`, `credits`). Sheets are not routes; each registers a back
interceptor while open. The board registers two more: during playback Back returns to planning, and
planning with pieces placed asks for confirmation. Order: sheet, playback, exit confirm, pop; at the
root a quit confirmation opens.

### Input
Pointer: tap places or inspects, a drag with a piece tool paints an edge-connected path (one undo
step per stroke), leaving the board cancels the stroke, a long press erases. With the Select tool a
drag pans when zoomed. Keyboard: arrows, Enter, Backspace or Delete, R, Space, `1`..`n` for tools,
E for the eraser, S for select, H for hint, `+` for zoom, Ctrl or Cmd Z / Shift Z / Y. Pinch zoom is
not implemented; the zoom button cycles fit, 1.5x and 2x.

### Screens added beyond the task list
`Boot` shows the icon fallback and a progress bar; the credits screen reads
`src/data/credits.ts` (fonts now; tasks 05 and 06 append audio and art entries); the how-to screen
reads `src/data/howto.ts` (six real pages that task 05 may enrich).

## 2026-10-23 - Task 05: audio, haptics, motion polish, onboarding, how to play

### Audio sources and processing
Every one of the 25 sound slots and 2 music loops has a CC0 file, so no slot ships silent. UI,
placement, badge and result sounds are Kenney files (Interface Sounds, Impact Sounds, Digital
Audio, RPG Audio, Music Jingles). Kenney has no looping music or water, so the water loop is a
10 second excerpt of the CC0 Vistula river recording by Snabisch on OpenGameArt, and the two music
loops are 45 second excerpts of "Calm Ambient 3 (Lifewave 2k)" and "Another August" by The Cynic
Project (both CC0 on OpenGameArt). Excerpts are cut from CC0 recordings with an equal-power
crossfade of the tail into the head so they loop; this is editing, not synthesis. OpenGameArt entries
that show `OGA-BY 3.0` were rejected. Candidates and the Kenney original name per slot are in
`.agents/resources/2026-10-23/web-games/floodplain-dispatch/05/README.md`. Sound effects are mono Ogg;
stereo Kenney originals were downmixed with ffmpeg, mono ones are byte-identical to the pack.
Total 962,201 bytes (budget 2 MB). Nobody has listened to the result; the owner does at QA (Q22).

### One table from events to sound and haptic
`src/audio/events.ts` is the only mapping. Haptic map as in the task: light impact on placing and
rotating, `warning` on an illegal placement, medium impact on Run, `error` when a house floods,
`success` on each earned star, on a region unlock and on a theme unlock; nothing on plain button
taps, removal, surge weeks, supplied or irrigated badges, streaks or a failed season.
- Stars: one sound for the final star count (`star-1`, `star-2` or `star-3`, played when the last
  star appears) and one `success` haptic per star, 120 ms apart; zero stars plays `result-fail`.
- Surge warning: plays once when playback moves forward onto the first week of a surge or a storm tide.
- Badge sounds: at most one sound per badge kind per playback tick; only natural forward ticks make
  sound, scrubbing and the skip button stay quiet.
- Dragging a stroke across cells plays at most one place or remove cue per 60 ms and one illegal cue
  per stroke, so a long canal drag does not machine-gun.
- UI sounds come from one delegated click handler (tap, back, toggle); Run has its own sound; sheets
  play `ui-open-sheet` when the inspector, pause, hint or exit sheet opens.

### Engine
The sound effects and both music loops run on one kit `AudioManager`; the first user gesture unlocks
it and starts the preload (27 files, progress 0 to 1). The water loop needs a looping voice that the
kit manager only offers for music, so it runs on a second manager (second AudioContext) whose level
follows the share of wet cells on the board (0 at a dry board, full at a quarter wet) and fades out
when playback pauses or ends. Music crossfades menu to play over 1.2 s when the screen changes to or
from a board. The Sound switch mutes effects and the water; the Music switch mutes the loops. The app
lifecycle suspends both contexts on pause and resumes them. Audio is Ogg Vorbis (Q21 records the iOS risk).

### Motion
Kit `createMotion` helpers: placement pop (a ring pulsing out of the new cell, spring), badge pop on
the count chips, sheet slide on every sheet, star reveal staggered 120 ms, week pulse on the forecast
bar marker. With reduced motion (system or the in-app switch) every helper applies its final frame
and never calls `animate`; the pop ring's final frame is invisible so nothing is left on screen.

### Onboarding
- Tutorial: five steps on v01, advanced only by the real action: acknowledging the glowing inlet,
  choosing the canal tool in the tray, a canal chain from the inlet to a cell beside the cottage,
  Run, and seeing the result sheet's star explainer. Skippable at any step. The flag `tutorial` is
  saved when it is finished or skipped; leaving v01 mid-way restarts it next time.
- Mechanic cards: the seven cards from `content-plan.md` open as a sheet before planning on their
  own map (v01, v03, v04, v06, d01, h01, e01) and set `card-<id>`; the daily map shows none. On
  v01 the canal card comes first, then the tutorial. Eight flags of the 64 allowed.
- How to play: six pages (Goal, Pieces, Reading the water, Forecast and weeks, Stars and scoring,
  Daily Dispatch). Piece costs, hint and freeze prices, step counts and score weights are read from the
  core constants in `src/data/howto.ts`.
- Credits: one row per audio file in `src/data/credits.ts`, kept equal to `public/audio/LICENSES.md`
  by a test.
