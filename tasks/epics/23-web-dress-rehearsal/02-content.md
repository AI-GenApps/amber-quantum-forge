---
epic: 23-web-dress-rehearsal
task: 02-content
status: todo
commit_scope: dress-rehearsal
depends_on: [23-web-dress-rehearsal/01-core-rules]
estimate: XL
owner: agent
---

# Full v1 content + validators

## Goal

Ship the complete v1 content in `apps-games/dress-rehearsal-core`: all 48 closet pieces, 6 chapters, 40 challenges with committed reference looks, 6 clients with their 48 lines, the 9 rule cards, the tutorial steps and every string in `content-plan.md`, plus validators and tests that fail on any drift from the knowledge base.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/dress-rehearsal/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Contract:** `.agents/games/dress-rehearsal/content-plan.md` lists every piece (id, name, category, colour, era, formality, warmth, price, feature), chapter, client (and lines), challenge (id, name, client, slot set, rule codes, brief), rule card and tutorial step. Counts there are binding (6 chapters, 40 challenges, 48 pieces, 6 clients, 120 stars). A row that cannot be met after honest effort is fixed by changing the row, `decisions-log.md` and the tests in the same commit, never by silently diverging.
- **Prototype:** `.agents/resources/2026-10-23/web-games/dress-rehearsal/00/` holds the proof counts (looks and three-star looks per challenge) and a reference look per challenge. The TypeScript port must reproduce those counts exactly (the engine is the task 01 port of the same formulas).
- **Layout of data:** one file per kind under `src/content/` (`pieces.ts`, `clients.ts`, `chapters.ts`, `challenges-riviera.ts`, `challenges-rainy-city.ts`, `challenges-gala.ts`, `challenges-mountain.ts`, `challenges-studio.ts`, `challenges-vintage.ts`, `cards.ts`, `strings.ts`), each under 800 lines. Biome ignores `content` folders, but the files must still type-check and stay readable.
- **Reference looks:** each `ChallengeDef` carries `reference: Look`, a committed three-star look inside the closet that exists when the chapter unlocks. Use the prototype's reference table or any other look that the validator proves.
- **Closet rule:** `closetFor(chapterIndex)` = all pieces of the themes with index <= max(1, chapterIndex) (Riviera Summer and Rainy City share the 16-piece starting closet). Proofs use it.
- **Text rules:** English only; briefs at most 90 characters; client lines at most 80; no placeholder text; apostrophes allowed, no emoji; characters must stay inside the font subset (Basic Latin, Latin-1, U+2013, U+2014, U+2018 to U+201D, U+2022, U+2026).
- **Validation speed:** exhaustive enumeration of all 40 challenges is about 2.1 million looks in total (up to 316,224 for one challenge); the proof test must finish in under 60 seconds (`it(..., 60_000)`), so enumerate each challenge once and reuse the result for all assertions.

## Implementation Checklist

- [ ] `src/content/types.ts` additions: `ChapterDef`, `ClientDef`, `ClientLines`, `ChallengeDef` (id, name, chapterIndex, clientId, slotSet, rules, brief, reference), `RuleCard`, `TutorialStep`, `ResultHeadline`.
- [ ] `src/content/pieces.ts`: the 48 pieces with exactly the ids, names, tags and prices in `content-plan.md` (art notes stay in the document); export `PIECES`, `PIECE_BY_ID`, `piecesOfTheme`, `closetFor(chapterIndex)`.
- [ ] `src/content/chapters.ts`: the six chapters with theme id, title, chapter title, accent hex, unlock stars (0, 0, 12, 27, 45, 66), intro and outro texts.
- [ ] `src/content/clients.ts`: six clients with name, role, bio and the eight lines each; affinity thresholds `[3, 9, 15]`.
- [ ] The six `challenges-*.ts` files with all 40 challenges (ids `riv-01..07`, `rai-01..07`, `gal-01..07`, `mtn-01..07`, `stu-01..06`, `vin-01..06`) with the exact names, clients, slot sets, rule codes (parsed with `parseRuleCode`), briefs and a reference look each.
- [ ] `src/content/cards.ts`: the nine rule cards (title, shown-on challenge id, text) and the five tutorial steps as data; `src/content/strings.ts`: game title, tagline, tray tab labels, result headlines for 3, 2, 1 and 0 stars, star names, harmony part and scheme names, how-to page titles, frame names.
- [ ] `src/content/index.ts`: `CHAPTERS`, `CHALLENGES` (40, ordered), `CHALLENGE_BY_ID`, `getChallenge(id)`, `nextChallengeId(id)`, `chapterOf(id)`, `clientOf(id)`, `TOTAL_STARS = 120`, `TOTAL_PIECES = 48`.
- [ ] `src/content/validate.ts`: `validateChallenge(def, closet)` returning typed issues (unknown slot set, slot count outside 6 to 8, rule count outside 2 to 4, bad rule argument, unknown piece id, brief longer than 90 or empty, reference illegal or incomplete or not three stars, empty board not 0 stars, fewer than 2 three-star looks, three-star share above the chapter cap, rule first used before its card), `validatePieces`, `validateClients` and `validateContent()` for the whole set (unique ids and names, id order, per-theme and per-category counts, client challenge counts 7, 7, 7, 7, 6, 6, totals).
- [ ] `test/content-plan.test.ts`: parse the tables of `.agents/games/dress-rehearsal/content-plan.md` (read with `node:fs`) and assert every piece row, chapter row, client row and line, challenge row (id, name, client, set, rule codes, brief), the rule cards and the proof-count table equal the data. This keeps documentation and code identical.
- [ ] `test/proof.test.ts`: enumerate every challenge in its unlock closet once; assert looks and three-star counts equal the proof table, at least 2 three-star looks, the share caps (35, 35, 5, 2, 2, 2 percent by chapter), the reference scores three stars, and the empty board scores 0.
- [ ] `test/content-validators.test.ts`: validator unit tests that build deliberately broken copies (bad rule code, 5 rules, 9 slots, unknown piece in a rule, reference missing a slot, reference with two stars, over-long brief, duplicate id, wrong client count) and expect the exact issue codes.
- [ ] `test/content-text.test.ts`: lengths, no duplicate names, headlines present, cards reference existing challenge ids and sit on or before the first use of the rule family, tutorial steps ordered, every character inside the font subset.
- [ ] Update `content-plan.md` and `decisions-log.md` if any binding number moved; record the final reference look per challenge in `.agents/resources/2026-10-23/web-games/dress-rehearsal/02/README.md`.

## Files Touched

- `apps-games/dress-rehearsal-core/src/content/*.ts`, `src/index.ts` (exports)
- `apps-games/dress-rehearsal-core/test/{content-plan,proof,content-validators,content-text}.test.ts`
- `.agents/games/dress-rehearsal/content-plan.md`, `decisions-log.md` (only if numbers moved)
- `.agents/resources/2026-10-23/web-games/dress-rehearsal/02/README.md`
- `tasks/epics/23-web-dress-rehearsal/STATUS.md` (tick task 02)

## Acceptance Criteria

- `CHALLENGES.length === 40` (7, 7, 7, 7, 6, 6), `PIECES.length === 48`, 6 clients with 7, 7, 7, 7, 6, 6 challenges, `TOTAL_STARS === 120`.
- Every row of `content-plan.md` matches the data exactly (enforced by `content-plan.test.ts`).
- All 40 challenges have a validated three-star reference look, at least 2 three-star looks, the empty board scores 0 stars, and the proof counts equal the prototype's.
- `validateContent()` returns no issues for the shipped data and the expected issue for each broken fixture.
- Content files are each under 800 lines; no `any`; the architecture test still passes; the proof test runs in under 60 seconds.

## Verification Commands

- `bun run --filter '@web-games/dress-rehearsal*' typecheck`
- `bun run --filter '@web-games/dress-rehearsal*' test`
- `bun run --filter '@web-games/dress-rehearsal' build`
- `bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core`

## Out of Scope

- Progression, coins, the daily generator and saves (task 03).
- Rendering, UI and palettes (task 04).
- Audio, onboarding UI, art.

## Commit message

`feat(dress-rehearsal): add 40 challenges, 48 pieces, 6 clients and validators [23-web-dress-rehearsal/02]`
