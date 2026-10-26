---
epic: 21-web-cloud-observatory
task: 02-content
status: in-progress
commit_scope: cloud-observatory
depends_on: [21-web-cloud-observatory/01-core-rules]
estimate: L
owner: agent
---

# Full v1 content + validators

## Goal

Ship the complete v1 content volume as typed data in `cloud-observatory-core`, prove it with
validator tests, and prove the pacing targets with a headless balance simulator test. After this
task the real `CATALOG` replaces the fixture catalog and the numbers in `economy.md` are the
simulator-verified ones.

## Context / Decisions

- The single list of names, ids, triggers and numbers is
  `.agents/games/cloud-observatory/content-plan.md` and `economy.md`. Copy ids and names exactly.
- Contract counts: 12 constellations (86 stars), 8 instruments, 24 upgrades, 10 boons (105
  shards), 30 lore entries in 6 chapters, 20 achievement definitions, 6 chapters.
- This game has no customers, cases or levels; do not invent any.
- Lore is short original prose (40 to 90 words per entry), second person, quiet and warm. It must
  not contain the tokens `window` or `document` (the core purity test scans `src/**`); write
  "pane", "skylight", "records" instead. No real brands. No text copied from other works.
- Star coordinates: hand-authored on the 1000×1400 map (see `content-plan.md` for each shape).
  Rules enforced by tests: every star inside the 100-unit margin, every pair at least 140 apart,
  straight runs are allowed (the Key's shaft, the Harp's pillar), the path does not cross itself
  except where the plan declares a closing edge, the bounding box is at least 500 units on its
  longer side and 250 on its shorter side (readable on a 320 px screen), and the shape fits the 1000×1400 map.
- The balance simulator is a pure function in `src/simulator.ts` (not a test-only helper) so the
  app's dev tools and the owner QA can reuse it. It uses the reference player in `economy.md`.

## Implementation Checklist

Files under `apps-games/cloud-observatory-core/src/content/` (split by topic, each under 800
lines):

- [x] `instruments.ts`: the 8 `InstrumentDef` rows with the economy.md numbers.
- [x] `upgrades.ts`: 24 `UpgradeDef` rows generated from a table of names (ids `u-<instrument>-<tier>`).
- [x] `constellations.ts`: 12 `ConstellationDef` rows with all 86 star coordinates, `closed`,
      cost and prerequisite from economy.md; atlas order fixed.
- [x] `boons.ts`: 10 `BoonDef` rows with their typed `BoonEffect`.
- [x] `lore.ts`: 6 chapters and 30 `LoreEntry { id, chapter, title, trigger, body }` where
      `trigger` is `{ kind: "instrument" | "constellation" | "boon", id }`, in chapter order.
- [x] `achievements.ts`: 20 `AchievementDef { id, name, description, condition }` with a typed
      `AchievementCondition` union (`owned`, `charted`, `flawless`, `lifetime`, `eclipses`,
      `comet-days`, `comet-streak`, `lore`, `offline-full`); evaluation arrives in task 03.
- [x] `catalog.ts`: assembles and freezes `CATALOG` (type `Catalog` from task 01) and exports
      lookup maps (`instrumentById`, ...).
- [x] `simulator.ts`: `simulate(catalog, options)` stepping one second at a time with the
      reference player (taps twice a second for the first 600 s then once per 2 s; decides every
      5 s; buys the affordable item with the best output per cost; charts as soon as possible;
      buys boons by ascending cost between cycles). Returns a report: first chart time, time to 5
      pending shards, longest purchase gap, charted count at the first Eclipse, and the same for
      cycles 2 and 3 with the boons bought so far.
- [x] Update `index.ts` exports. Remove nothing from task 01.

Tests under `apps-games/cloud-observatory-core/test/content/`:

- [x] `counts.test.ts`: exact counts (12/86, 8, 24, 10/105, 30 in 6 chapters of 5, 20, 6).
- [x] `ids.test.ts`: all ids unique and kebab-case within their type; every name non-empty,
      trimmed, and unique within its type; every upgrade references an existing instrument with
      tiers 1 to 3 exactly once per instrument; every prerequisite references an existing
      instrument; every boon effect references existing instruments.
- [x] `lore.test.ts`: every lore entry has a trigger that resolves; each instrument, constellation
      and boon is the trigger of exactly one entry (8 + 12 + 10); chapters have 5 entries each in
      order; body length 40 to 90 words; no `window`/`document` tokens; no entry is a
      duplicate of another (normalised text); titles match `content-plan.md` (the test parses the
      table rows of the markdown file and compares ids and titles).
- [x] `stars.test.ts`: star counts per constellation match the plan (5,6,6,6,7,7,7,7,8,8,9,10);
      margin, minimum spacing 140, minimum bounding box 500×250, no self-crossing path; the first and last
      star distance is under 700 for `closed` shapes.
- [x] `economy-table.test.ts`: reads `economy.md` and asserts every instrument, constellation and
      boon number equals the code (so docs and code cannot drift); upgrade cost factors; achievement
      names equal `content-plan.md`.
- [x] `catalog.test.ts`: `CATALOG` is deeply frozen, round-trips through `JSON.stringify`, and the
      fixture-based task 01 tests still pass against it for the generic rules.
- [x] `simulator.test.ts` (the balance proof; allowed up to 20 s of test time):
      - first constellation charted in under 180 s;
      - first cycle reaches 5 pending shards between 2.5 and 4 hours;
      - no gap longer than 360 s between two consecutive purchases (instruments, upgrades or
        charts) before the first Eclipse, and also in cycle 2;
      - at least 11 of 12 constellations charted by the first Eclipse;
      - cycle 2 (with the boons the player could afford after cycle 1) reaches 5 shards in at most
        85% of cycle 1's time; a cycle with Dark-Adapted, Brass Polish, Clear Glass, Apprentice,
        Atlas Ink and Corona in at most 55%;
      - the report is deterministic (two runs equal) and never contains `NaN`.
- [x] If a target fails, retune within the allowed levers (Eclipse divisor, growth, tier ratios,
      chart costs) and copy the new numbers into `economy.md`, `content-plan.md`,
      `decisions-log.md` and `.agents/resources/2026-10-23/web-games/cloud-observatory/00/README.md`
      history note in this commit. Keep the first-Eclipse window and the six-minute gap rule.

## Files Touched

- `apps-games/cloud-observatory-core/src/content/*.ts`, `src/simulator.ts`, `src/index.ts`
- `apps-games/cloud-observatory-core/test/content/*.test.ts`
- `.agents/games/cloud-observatory/{economy,content-plan,decisions-log}.md` (numbers synced)
- `.agents/resources/2026-10-23/web-games/cloud-observatory/02/README.md` (simulator output record)
- `tasks/epics/21-web-cloud-observatory/STATUS.md` (tick task 02)

## Acceptance Criteria

- All content counts in `content-plan.md` section 9 hold exactly, and the validators fail when any
  one is changed (demonstrate by mutating a copy in a test).
- Every lore trigger is satisfiable and unique; the Journal can show 30 entries.
- The simulator test proves every pacing target with the real catalog and its output is recorded
  in the evidence README.
- `economy.md` and the code agree (docs-drift test is green).
- No lore text contains `window` or `document`; the architecture test is green.
- No file exceeds 800 lines; content is split by topic.

## Verification Commands

- `bun run --filter '@web-games/cloud-observatory*' typecheck`
- `bun run --filter '@web-games/cloud-observatory*' test`
- `bun run --filter '@web-games/cloud-observatory' build`
- `bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core`

## Out of Scope

- Progression state, achievement evaluation, the Comet, save format (task 03).
- Any UI, fonts, audio or art; images are referenced by slot name only.
- Changing the kit, dependencies or other games.

## Commit message

`feat(cloud-observatory): add full v1 content, validators and balance simulator [21-web-cloud-observatory/02]`
