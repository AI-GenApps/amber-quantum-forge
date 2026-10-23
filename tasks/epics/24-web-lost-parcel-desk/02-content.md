---
epic: 24-web-lost-parcel-desk
task: 02-content
status: in-progress
commit_scope: lost-parcel-desk
depends_on: [24-web-lost-parcel-desk/01-core-rules]
estimate: XL
owner: agent
---

# Full v1 content + validators

## Goal

Ship the complete v1 content in `apps-games/lost-parcel-desk-core`: the 12 townsfolk, the 12 cases with their 49 evidence objects, 70 clues and 24 deductions exactly as named in `content-plan.md`, plus chapter texts, reveal texts, ledger fragments, the Almanac, town places, achievements, desk themes, mechanic cards, the tutorial and result headlines, with a content validator and tests that fail on any drift.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/lost-parcel-desk/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** `content-plan.md` is the contract: it lists every case, object, clue (tag, face, role), deduction, townsperson and text, and its counts are binding (12 cases, 49 objects, 70 clues = 33 lead + 37 flavour, 24 deductions = 12 direct + 9 pair + 3 rule-out, 12 townsfolk, 24 almanac entries). A row that cannot be met after honest effort is fixed by changing the row, `decisions-log.md` and the tests in the same commit, never by silently diverging.
- **Data format:** one file per chapter under `src/content/cases/` (`chapter1.ts`, `chapter2.ts`, `chapter3.ts`), each holding four `CaseDef` objects extended with presentation fields; `src/content/cast.ts` for the 12 `Person` records; each file stays under 800 lines. Facet value strings in code are the `content-plan.md` values (street `Quay Road`, ...; pastime `angling`, ...; look `red hair`, ...; pet `none`, ...), with the plan's "Pastime" and "Look" columns mapped to the core facet ids `pastime` and `look`.
- **Presentation fields per case:** `title`, `slug`, `chapter`, `foundAt`, `labelText` (the torn label, at most 60 characters, no address), `place` (town map place), `difficulty`, `parMinutes`, `reveal` (200 to 420 characters, names the owner and states the deduction in plain words, typewriter-friendly), `ledgerTitle`. Per object: `name`, `caption` (front description, at most 80 characters), `glyph` (one of the 14 fallback glyph kinds: `tin cloth paper card key glove bag box metal wood lens lamp ticket hat`), `artSlot` (`evidence-postcard` for 01-1, else `evidence-NN-k`). Per clue: `tag` (verbatim from the plan), `text` (one sentence, 20 to 120 characters, readable on a paper note), `face`, and for `zoom` clues a `hotspot` (`x`, `y` in 0 to 1000, inside the 150 to 850 safe box, at least 200 apart from any other hotspot on the same object).
- **Text rules:** English only; no emoji; no placeholder text; apostrophes allowed; no clue or caption names a trade (the validator keeps a trade word list: ferry, baker, barber, projectionist, librarian, mechanic, teacher, florist, signaller, tailor, ironmonger, piano tuner and their obvious tools); flavour clue text and object names never use an almanac keyword of a value held by some but not all of the case's three candidates (keyword table from `content-plan.md` "Clerk's Almanac" and the clue vocabulary in `src/content/almanac.ts`).
- **Cast integrity:** every facet value is held by exactly two people (24 values, 48 holdings); every person owns exactly one case and appears as a candidate in 2 to 4 cases; the owner of case N is townsperson N.
- **Mechanic gating:** pairs first appear in case 05 and rule-outs in case 06; chapter 1 (cases 01 to 04) has only direct deductions.

## Implementation Checklist

- [x] `src/content/cast.ts` (12 people, bios verbatim from `content-plan.md`), `src/content/almanac.ts` (24 entries with the keyword lists used by the validator and the Almanac screen), `src/content/places.ts` (12 town places and the 6 streets), `src/content/chapters.ts` (3 chapters with titles, stamp unlocks 0, 7, 18, intro and outro texts verbatim), `src/content/ledger.ts` (12 fragments, titles and text verbatim), `src/content/achievements.ts` (12 with ids, titles and conditions as data), `src/content/themes.ts` (5 themes: ids, names, stamps 0, 6, 14, 24, 33; palettes belong to task 04), `src/content/cards.ts` (4 mechanic cards and their case ids), `src/content/tutorial.ts` (6 steps with their advance conditions as data), `src/content/headlines.ts` (3, 2 and 1 stamp headlines, the "Return to sender" line, tagline and title strings).
- [x] `src/content/cases/chapter1.ts` to `chapter3.ts`: all 12 cases with the exact titles, slugs, found-at lines, places, owners, candidates, objects, clues (tag, face, role), deductions (facet, polarity, value, kind), difficulty and par minutes from `content-plan.md`; write the 70 clue texts, 49 object captions, 12 labels and 12 reveal texts (original writing, 1974 cosy-noir voice, no repeated sentences across cases).
- [x] `src/content/index.ts`: `PEOPLE`, `PEOPLE_BY_ID`, `CASES` (12, ordered), `CASE_BY_ID`, `CHAPTERS`, `getCase(id)`, `nextCaseId(id)`, `chapterOf(caseId)`, `TOTAL_STAMPS = 36`, `TOTAL_OBJECTS = 49`, `TOTAL_CLUES = 70`.
- [x] `src/content/validate.ts`: `validateCase(def, people)` (runs `analyseCase` from task 01 plus: exactly 4 objects, or 5 for case 12; clue text length; caption length; reveal length; label length; hotspot rules; art slot names; glyph in the list; keyword hygiene for flavour clues and neutral object names; no trade words; mechanic gating by case number) and `validateContent()` for the whole set (unique ids, titles and slugs; ids in order; 4 cases per chapter; cast integrity; totals 49 / 70 / 33 / 37 / 24 and the 12 / 9 / 3 split; 12 ledger fragments, 12 achievements, 5 themes, 4 cards, 6 tutorial steps). Both return typed issues with codes.
- [x] `test/content-plan.test.ts`: read `.agents/games/lost-parcel-desk/content-plan.md` with `node:fs`, parse its tables (chapters, town map, townsfolk, almanac, case index, and for each case the object, clue and deduction tables, plus ledger, achievements, themes, cards and tutorial) and assert every row equals the data (ids, titles, owners, candidates, tags, faces, roles, facets, values, kinds, counts). This keeps documentation and code identical.
- [x] `test/case-logic.test.ts`: for each of the 12 cases run `analyseCase` (no issues), assert the owner is the only consistent candidate, assert each deduction is necessary by removing it, and assert the canonical links and the hint sequence for D1 then D2; replay a scripted perfect solution (inspect everything, pin the lead clues, link them, accuse the owner) and assert `stamps === 3` and the closed state for all 12.
- [x] `test/content-validators.test.ts`: build deliberately broken copies (a flavour clue using a keyword that separates the candidates, a trade word in a caption, a hotspot out of bounds, a case with three objects, a duplicate title, a reveal too short, a pair in case 03, a missing art slot, a person with a value held by three) and expect the exact issue codes; `validateContent()` returns no issues for the shipped data.
- [x] `test/content-text.test.ts`: no empty strings anywhere, no duplicate clue texts or captions, each reveal names the owner and uses at least one almanac keyword of one of its deductions' values, the 12 ledger fragments are in order, mechanic cards reference existing case ids, tutorial steps ordered.
- [x] Update `content-plan.md`, `decisions-log.md` and `economy.md` only if a binding number moved; add `.agents/resources/2026-10-23/web-games/lost-parcel-desk/02/README.md` with the final per-case table (objects, lead and flavour clue counts, difficulty, par minutes, reveal length) and the validator output summary.

## Files Touched

- `apps-games/lost-parcel-desk-core/src/content/{cast,almanac,places,chapters,ledger,achievements,themes,cards,tutorial,headlines,validate,index}.ts` and `src/content/cases/chapter{1,2,3}.ts`, `src/index.ts` (exports)
- `apps-games/lost-parcel-desk-core/test/{content-plan,case-logic,content-validators,content-text}.test.ts`
- `.agents/games/lost-parcel-desk/content-plan.md`, `decisions-log.md`, `economy.md` (only if numbers moved)
- `.agents/resources/2026-10-23/web-games/lost-parcel-desk/02/README.md`
- `tasks/epics/24-web-lost-parcel-desk/STATUS.md` (tick task 02)

## Acceptance Criteria

- `CASES.length === 12`, 4 per chapter, `TOTAL_STAMPS === 36`, 49 objects, 70 clues (33 lead, 37 flavour), 24 deductions (12 direct, 9 pair, 3 rule-out), 12 townsfolk each owning exactly one case.
- Every case matches its `content-plan.md` rows exactly (enforced by `content-plan.test.ts`).
- All 12 cases pass `analyseCase`: exactly one consistent owner, every deduction necessary, every other clue flavour; a scripted perfect solution earns 3 stamps on each.
- `validateContent()` returns no issues for the shipped data and the expected code for each broken fixture; no flavour text separates the candidates; no caption names a trade.
- Chapter data files are each under 800 lines; no `any`; the architecture test still passes.

## Verification Commands

- `bun run --filter '@web-games/lost-parcel-desk*' typecheck`
- `bun run --filter '@web-games/lost-parcel-desk*' test`
- `bun run --filter '@web-games/lost-parcel-desk' build`
- `bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core`

## Out of Scope

- Progression, postage, the daily generator and the save (task 03).
- Rendering, UI, palettes and the glyph drawings (task 04).
- Audio, onboarding UI, art.

## Commit message

`feat(lost-parcel-desk): add 12 cases with 49 evidence objects, cast, lore and validators [24-web-lost-parcel-desk/02]`
