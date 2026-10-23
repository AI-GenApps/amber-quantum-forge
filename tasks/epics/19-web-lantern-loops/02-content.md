---
epic: 19-web-lantern-loops
task: 02-content
status: pending
commit_scope: lantern-loops
depends_on: [19-web-lantern-loops/01-core-rules]
estimate: XL
owner: agent
---

# Full v1 content + validators

## Goal

Ship the complete campaign: 4 chapters, 120 puzzles with the titles and sizes in
`.agents/games/lantern-loops/content-plan.md`, plus the 2 tutorial boards. Puzzles come from an
offline, seeded generator that uses the task 01 solver to prove each one has exactly one solution;
the results are committed as data. Validator tests re-prove everything on every run and cross-check
the data against the content plan, so the plan and the code cannot drift.

## Context / Decisions

- Volume is fixed by the plan: Harbor 10/10/10 (5x5/6x6/7x7), Garden 5/10/10/5 (5x5 to 8x8), Bridge
  4/8/8/6/4 (5x5 to 9x9), Sky 4/8/10/8 (6x6 to 9x9). Do not reduce it.
- Clue ranges per size are in `content-plan.md` section 2. Mechanics gate by chapter: Harbor lanterns
  only (all amber); Garden adds stones; Bridge adds mirrors; Sky adds gates and colours (rose in Sky 01,
  jade Sky 03, violet Sky 04, azure Sky 05; Sky 27 uses all five).
- Fixed tiles (anchors) are the uniqueness tool: aim for <= 35% of solution tiles (median per chapter),
  hard limit 50%. If Harbor cannot reach the limit, raise the limit to the smallest value that works
  (never above 60%), and record the real numbers and the new limit in `decisions-log.md`,
  `content-plan.md` and `open-questions.md` (Q9) in the same commit.
- The core cannot import the kit, so the generator owns a tiny integer PRNG (mulberry32 style) taking
  a numeric seed; nothing may call `Math.random` or read time. Output is identical on every machine.
- Generator version string `ll-gen-1`; campaign seeds are `hash(ll-gen-1|<puzzle id>)` computed with a
  local integer hash in the generator, committed in the data so a puzzle can be re-derived.
- Difficulty rating 1 to 5 comes from solver statistics (guess depth and nodes with propagation),
  computed once at generation and re-computed by the validator. Ratings are non-decreasing across
  the five bands of six puzzles per chapter.
- The generator must always terminate: bounded attempts, then pin tiles until the solver proves a
  single solution. The same function is reused by the daily mode in task 03.

## Implementation Checklist

- [ ] `src/gen/rng.ts`: `createRng(seed)` with `int(n)`, `pick`, `shuffle`, `chance(p as integer percent)`;
      unit-tested for determinism and uniform spread (chi-square sanity on 10,000 draws).
- [ ] `src/gen/solution.ts`: random solution generator for N x N: random set of disjoint closed loops
      (loop grow by random walk closure and 2x2 ring seeds), loop count and coverage targets per size,
      deterministic for a seed.
- [ ] `src/gen/place.ts`: choose lanterns (count in range; colours per `GenParams.colours`), stones
      (only on cells empty in the solution; number = true lit-neighbour count), mirrors on loop corners,
      gates on loop straights, ensuring clue ranges and colour rules hold for the solution.
- [ ] `src/gen/minimise.ts`: add anchors until `isUnique`, then greedily remove anchors and redundant
      clues in a seeded order while uniqueness holds; keep clue counts within range.
- [ ] `src/gen/difficulty.ts`: `rate(puzzle)` returns 1..5 and raw stats.
- [ ] `src/gen/generate.ts`: `generatePuzzle(params, seed)` returning `{ puzzle, solution, rating, stats }`;
      `GenParams = { size, mechanics: { stones, mirrors, gates }, colours, lanterns: [min,max], ... }`;
      bounded retries then guaranteed fallback by pinning.
- [ ] `scripts/generate-campaign.ts` (run with `bun run scripts/generate-campaign.ts` from the core dir;
      add the `generate` and `verify` scripts to `apps-games/lantern-loops-core/package.json`; add
      `scripts` to the core `tsconfig.json` include): writes the data files deterministically, supports
      `--only <id>` and `--verify` (re-prove all data, exit 1 on any failure) and prints a report.
- [ ] `src/content/types.ts`: `PuzzleRecord { id, chapter, index, title, size, code, solution, rating, seed }`.
- [ ] `src/content/campaign/{harbor,garden,bridge,sky}.ts`: the 120 records (compact codes keep each file
      far below 800 lines). Titles and sizes exactly as in `content-plan.md`.
- [ ] `src/content/chapters.ts`: `CHAPTERS` (id, title, blurb, mechanic, unlockStars 0/45/120/210, backdrop
      slot id) and `CAMPAIGN` helpers `getPuzzle(id)`, `chapterPuzzles(chapterId)`, `nextPuzzle(id)`,
      `PUZZLE_COUNT = 120`, `MAX_STARS = 360`.
- [ ] `src/content/tutorials.ts`: `tutorial-1` and `tutorial-2` (4x4, unique), outside `CAMPAIGN`.
- [ ] `src/content/validate.ts`: `validateCampaign()` returning a list of issues (empty = valid), used by
      tests and by the script's `--verify`.
- [ ] Run the generator, commit the data, write the evidence
      `.agents/resources/2026-10-23/web-games/lantern-loops/02/campaign-report.json` (per puzzle: id,
      size, rating, lanterns, stones, mirrors, gates, colours, anchors, anchor share, solver nodes) and
      `02/README.md` (command, seed scheme, summary statistics, medians per chapter).
- [ ] Update `README.md` quick facts, `content-plan.md` and `decisions-log.md` with the real anchor
      shares and any limit change.

## Files Touched

- `apps-games/lantern-loops-core/src/gen/*.ts`, `src/content/**`, `src/index.ts` (exports)
- `apps-games/lantern-loops-core/scripts/generate-campaign.ts`, `package.json` (scripts only),
  `tsconfig.json` (include `scripts`)
- `apps-games/lantern-loops-core/test/{rng,gen,difficulty,campaign,tutorials,content-plan-sync}.test.ts`
- `.agents/resources/2026-10-23/web-games/lantern-loops/02/**`
- `.agents/games/lantern-loops/{README,content-plan,decisions-log,open-questions}.md`

## Acceptance Criteria

- [ ] `CAMPAIGN` has exactly 120 puzzles, 30 per chapter, ids `harbor-01` to `sky-30`, titles unique and
      at most 24 characters; sizes per chapter match the table in `content-plan.md`.
- [ ] A test parses the puzzle tables in `.agents/games/lantern-loops/content-plan.md` and asserts that
      every id/title/size in the data equals the plan (and the reverse), and that the chapter blurbs,
      unlock thresholds and size bands match.
- [ ] Every puzzle: decodes and re-encodes to the same code; `validatePuzzleShape` passes; `solve` finds
      exactly 1 solution (all 120 re-proven in the test run) and it equals the stored `solution`;
      `evaluate(solution).solved`; the initial board is not already solved; every loop in the solution has
      a lantern.
- [ ] Mechanic gating holds: no stones in Harbor, no mirrors before Bridge, no gates or non-amber
      lanterns before Sky; each chapter's puzzle 1 uses its new mechanic; colour introduction order as in
      the plan; Sky 27 uses five colours; finale puzzles (30) use every mechanic of their chapter.
- [ ] Clue counts per size are inside the ranges in `content-plan.md`; anchors <= the hard limit for every
      puzzle and the per-chapter median <= 35% (or the recorded raised limit).
- [ ] Ratings are integers 1 to 5, stored equals recomputed, non-decreasing across the five bands per chapter.
- [ ] The two tutorial boards are unique and 4x4.
- [ ] Generator: the same seed gives the same puzzle; 200 seeded generations across all sizes and
      mechanic sets (including all five colours) each prove unique and solved; the fallback path is
      exercised by a test that forces `attempts = 0`; no `Math.random` or clock use (architecture test).
- [ ] `bun run generate -- --verify` (script) exits 0 and the report file exists.
- [ ] All verification commands below pass; the full test run stays under about 120 seconds.

## Verification Commands

```
bun run --filter '@web-games/lantern-loops*' typecheck
bun run --filter '@web-games/lantern-loops*' test
bun run --filter '@web-games/lantern-loops' build
bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core
```

## Out of Scope

Daily puzzle tiers and daily generation entry point, stars, tokens, streaks and saves (task 03);
UI, audio, art, Capacitor; hand-editing generated puzzle data (regenerate instead); localization.

## Commit message

`feat(lantern-loops): 120 proven-unique campaign puzzles and validators [19-web-lantern-loops/02]`
