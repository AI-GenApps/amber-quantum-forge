---
epic: 20-web-floodplain-dispatch
task: 02-content
status: in-progress
commit_scope: floodplain-dispatch
depends_on: [20-web-floodplain-dispatch/01-core-rules]
estimate: XL
owner: agent
---

# Full v1 content + validators

## Goal

Ship the complete v1 content in `apps-games/floodplain-dispatch-core`: all 40 campaign maps (Valley, Delta, Highland, Estuary) exactly as named in `content-plan.md`, each with a committed reference solution that the engine proves earns three stars at par, plus chapter texts, dispatcher briefs, mechanic cards, themes, result headlines and validators that fail on any drift.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/floodplain-dispatch/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Contract:** `.agents/games/floodplain-dispatch/content-plan.md` lists every map with id, name, size, weeks, inlet rate, houses by kind, fields, inlets, pieces, par, budget, tide, forecast events and brief. Counts there are binding (40 maps, 193 houses, 133 fields, 120 stars, budget = par + 3). A map that cannot meet its row after honest effort is fixed by changing the row, `decisions-log.md` and the tests in the same commit, never by silently diverging.
- **Layout and data format:** use the task 01 layout strings; one file per region under `src/content/` (`valley.ts`, `delta.ts`, `highland.ts`, `estuary.ts`), each holding ten `MapDef` objects with `reference: Placement[]` (the committed solution). Each region file stays under 800 lines.
- **Authoring method:** write the terrain with a descending river corridor (inlet height 4 to 7, sea at height 0), place houses and fields so more than one design is tempting, run `runSeason`, iterate until the reference earns three stars at exactly par and every piece is needed. An optional dev script `scripts/report-map.ts` in the core prints the board, depths per week and badges as ASCII; it is not shipped and not imported by `src/`.
- **Mechanic gating:** surges only from v04, barriers only from v03, pumps from v06, gates from d01, reservoirs and droughts from h01, tides and storm tides from e01 (`content-plan.md`). Pieces per map are the `Pieces` column.
- **Irredundant par:** removing any single piece of the reference must lose the third star (or the first star), so par is honest. The empty placement must never clear a map.
- **Text rules:** English only; briefs at most 90 characters; no placeholder text; apostrophes allowed, no emoji.
- **Themes in the core:** only data (id, name, stars needed). Palettes are task 04.

## Implementation Checklist

- [x] `src/content/types.ts` additions: `RegionDef`, `ChapterText`, `MechanicCard`, `ThemeDef`, `ResultHeadline`; `MapDef.reference`.
- [x] `src/content/valley.ts` v01 to v10, `delta.ts` d01 to d10, `highland.ts` h01 to h10, `estuary.ts` e01 to e10 with the exact names, sizes, weeks, rates, house kinds, fields, inlets, pieces, par, budget, tide and events from `content-plan.md`, and the briefs verbatim.
- [x] A reference solution for each of the 40 maps, committed in the map data; gate maps set `opensWeek` and `closesWeek`; reservoir maps (h08 needs two reservoirs) and tide maps are solved the way the brief implies.
- [x] `src/content/chapters.ts`: four chapter titles with intro and outro texts verbatim from `content-plan.md`.
- [x] `src/content/cards.ts`: the seven mechanic cards (titles, shown-on map ids, text) and the five tutorial steps as data.
- [x] `src/content/themes.ts`: the seven themes with star thresholds 0, 9, 27, 48, 75, 100, 120.
- [x] `src/content/headlines.ts`: result headlines for 3, 2, 1 and 0 stars, tagline and game title strings.
- [x] `src/content/index.ts`: `REGIONS`, `MAPS` (40, ordered), `MAP_BY_ID`, `getMap(id)`, `nextMapId(id)`, `regionOf(id)`, `TOTAL_STARS = 120`, `TOTAL_HOUSES`, `TOTAL_FIELDS`.
- [x] `src/content/validate.ts`: `validateMap(def)` returning a list of typed issues (layout parse, size bounds 8 x 12 to 12 x 16, weeks 20 to 30, at least one inlet, at least one sea, inlet rates count, house kinds count equals `H` tokens, pieces allowed by region gating, events allowed by region gating, tide only in Estuary, budget = par + 3, reference legality through `checkPlacement`, reference result three stars at cost = par, irredundancy, empty placement not cleared) and `validateContent()` for the whole set (unique ids and names, ids in order, 10 per region, totals).
- [x] `test/content-plan.test.ts`: parse the tables of `.agents/games/floodplain-dispatch/content-plan.md` (read with `node:fs`) and assert every map row (id, name, size, weeks, rate, houses by kind, fields, inlets, pieces, par, budget, tide, events, brief) equals the data, plus region unlock stars, theme thresholds and mechanic cards. This keeps documentation and code identical.
- [x] `test/reference-solutions.test.ts`: for each of the 40 maps, run the reference and assert 3 stars, cost = par, 0 flooded houses, all fields irrigated, irredundancy (40 x pieces re-runs), and that the empty placement is not cleared.
- [x] `test/content-validators.test.ts`: validator unit tests that build deliberately broken copies of a map (bad token, wrong size, extra event, missing reference, over budget, forbidden piece, par off) and expect the exact issue codes.
- [x] `test/content-text.test.ts`: brief length at most 90, no empty strings anywhere, no duplicate names, headlines present, cards reference existing map ids, tutorial steps ordered.
- [x] Update `content-plan.md` and `decisions-log.md` if any binding number moved; record the final per-map reference cost table in `.agents/resources/2026-10-23/web-games/floodplain-dispatch/02/README.md`.

## Files Touched

- `apps-games/floodplain-dispatch-core/src/content/*.ts`, `src/index.ts` (exports)
- `apps-games/floodplain-dispatch-core/scripts/report-map.ts` (optional dev helper)
- `apps-games/floodplain-dispatch-core/test/{content-plan,reference-solutions,content-validators,content-text}.test.ts`
- `.agents/games/floodplain-dispatch/content-plan.md`, `decisions-log.md` (only if numbers moved)
- `.agents/resources/2026-10-23/web-games/floodplain-dispatch/02/README.md`
- `tasks/epics/20-web-floodplain-dispatch/STATUS.md` (tick task 02)

## Acceptance Criteria

- `MAPS.length === 40`, 10 per region, `TOTAL_STARS === 120`, `TOTAL_HOUSES === 193`, `TOTAL_FIELDS === 133`.
- Every map matches its `content-plan.md` row exactly (enforced by `content-plan.test.ts`).
- All 40 reference solutions earn 3 stars at exactly par, are irredundant, and the empty placement clears none.
- `validateContent()` returns no issues for the shipped data and the expected issue for each broken fixture.
- Region data files are each under 800 lines; no `any`; the architecture test still passes.

## Verification Commands

- `bun run --filter '@web-games/floodplain-dispatch*' typecheck`
- `bun run --filter '@web-games/floodplain-dispatch*' test`
- `bun run --filter '@web-games/floodplain-dispatch' build`
- `bunx biome check apps-games/floodplain-dispatch apps-games/floodplain-dispatch-core`

## Out of Scope

- Progression, coins, the daily generator and the solver (task 03).
- Rendering, UI and palettes (task 04).
- Audio, onboarding UI, art.

## Commit message

`feat(floodplain-dispatch): add 40 campaign maps with proven solutions and validators [20-web-floodplain-dispatch/02]`
