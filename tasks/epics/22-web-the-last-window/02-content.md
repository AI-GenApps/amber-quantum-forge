---
epic: 22-web-the-last-window
task: 02-content
status: todo
commit_scope: the-last-window
depends_on: [22-web-the-last-window/01-core-rules]
estimate: XL
owner: agent
---

# Full v1 content + validators

## Goal

Ship the complete v1 content as typed data in `apps-games/the-last-window-core`: the 14 campaign days, the visit calendar, the 8 regulars, all 40 scenes of original writing with 12 choices and 16 endings, the 24 finale lines, the 14 diary entries and day cards, item and decor texts, the tutorial script, the 54-slot art list and the content validators with tests (no dangling scene references, every arc reachable, plain reading level).

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/the-last-window/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Contract:** `.agents/games/the-last-window/content-plan.md` is binding: the "Campaign days" table, the "Regular visit calendar", the eight regular sections (look, likes, moods, visit days, scene titles and summaries, choices, endings), the item tables, the finale and journal titles. Counts there are binding (14 days, 130 customers, 8 regulars, 40 scenes, 12 choices, 16 endings, 24 finale lines, 14 diary entries, 5 moods). A scene that cannot follow its summary after honest effort is fixed by changing the plan row, `decisions-log.md` and the tests in the same commit, never by silently diverging.
- **Rules reuse:** item and decor rule tables, scene types, thresholds and the scene player already exist from task 01 (`src/rules`, `src/story`). This task adds data and validators only and must not duplicate a number: it imports the constants.
- **File layout:** `src/content/days.ts`, `calendar.ts`, `regulars.ts`, `scenes/{odile,tobias,priya,juno,henrik,leona,abel,sunniva}.ts` (five scenes each, every file under 800 lines), `finale.ts`, `diary.ts`, `dayCards.ts`, `itemText.ts`, `tutorial.ts`, `artSlots.ts`, `strings.ts`, `index.ts`, `validate.ts`, `readability.ts`.
- **Writing rules:** English only, plain language (average Flesch-Kincaid grade at most 7.0 per scene and no single beat above grade 10), 6 to 9 beats per scene, each beat at most 25 words, speakers are the regular's id, `you` or `narration`; warm, small-stakes, kind humour; no villains, no violence, no romance beyond friendship, no real brands or people; typographic punctuation limited to the font subset (apostrophes, quotes, dashes, ellipsis); no placeholder text; no emoji. Each scene opens in the setting its summary names and closes on a beat that makes the next visit feel wanted. Scenes 1 to 4 pay 5 coins (data field `gift`), scene 5 pays 15.
- **Choices:** the choice scene shows 2 options with a label of at most 8 words and a lean, plus 2 reaction beats per option; later scenes carry guarded beats (`guard: {choice, option}`) so at least one beat in scene 4 or scene 5 of every regular reacts to the player's choice. Scene 5 holds the two ending blocks (3 to 4 beats each) and the ending titles from the plan.
- **Reading-level helper:** `src/content/readability.ts` exports `countSyllables(word)`, `sentences(text)` and `fleschKincaidGrade(text)`; it is pure, has unit tests with known sentences, and is used only by validators and tests.
- **Art slot list:** `artSlots.ts` lists the 54 slot ids of `assets-index.md` with batch, kind and runtime size; a test parses the table in `assets-index.md` and asserts it equals the list.

## Implementation Checklist

- [ ] `src/content/types.ts`: `DayDef`, `RegularDef` (id, name, art slot prefix, likes, moods, visit days, story title, ending titles), `FinaleLine`, `DiaryEntry`, `DayCard`, `TutorialStep`, `ScriptedOrder`, `ArtSlotDef`.
- [ ] `src/content/days.ts`: the 14 days (title, weather, shift ticks, customers, patience seconds, regulars due, unlocks) exactly as in the plan; `src/content/calendar.ts` derives visit numbers per regular and per day and the Day 14 finale list.
- [ ] `src/content/regulars.ts`: the 8 regulars with favourite drink and pastry ids, two moods, visit days and titles.
- [ ] Eight scene files with all 40 scenes, 12 choices and 16 ending blocks.
- [ ] `src/content/finale.ts`: 24 lines (8 regulars x ending A, ending B, unfinished; at most 20 words each) plus the closing caption from Marit's notebook (at most 30 words).
- [ ] `src/content/diary.ts` (14 entries, title from the day table, text at most 40 words) and `dayCards.ts` (14 intro cards, at most 30 words, each mentions the weather or a regular due).
- [ ] `src/content/itemText.ts`: flavour lines for 6 drinks, 5 pastries and 5 books (at most 12 words), 5 mood descriptions, 8 decor descriptions that state the effect in plain words using the effect numbers from the decor table.
- [ ] `src/content/tutorial.ts`: the 7 coach steps of the Day 1 plan and the 6 scripted Day 1 orders (ids, customers, components) so the app and tests share them; Day 1 uses regulars 1, 2, 3 and three walk-ins.
- [ ] `src/content/strings.ts`: game title, tagline, Marit's opening note, button and section labels the screens need that are content rather than UI chrome (Journal tab names, mood names, outcome words); task 04 adds the rest through the kit string table.
- [ ] `src/content/index.ts`: `DAYS`, `REGULARS`, `SCENES` (40, ordered), `SCENE_BY_ID`, `getDay(n)`, `regularsDue(day)`, `sceneFor(regularId, index)`, `ENDING_TITLES`, `FINALE`, `DIARY`, `ART_SLOTS`.
- [ ] `src/content/validate.ts`: `validateContent()` returning typed issues with codes `DAY_TABLE`, `CALENDAR`, `VISIT_COUNT`, `SCENE_COUNT`, `DANGLING_SCENE`, `DANGLING_GUARD`, `BAD_CHOICE_COUNT`, `BAD_ENDING`, `UNREACHABLE_ARC`, `BEAT_LENGTH`, `BEAT_COUNT`, `READING_LEVEL`, `BAD_SPEAKER`, `UNKNOWN_ART_SLOT`, `UNKNOWN_ITEM`, `BAD_CHARACTER`, covering every rule listed in `content-plan.md` "Content counts the validators enforce".
- [ ] Reachability check: for each regular, simulate the best case (2 FP per serve, no decor) and the calendar; scene k must be eligible at visit k, and both endings must be reachable by at least one choice combination (including the tie-break rule).
- [ ] `test/content-plan.test.ts`: parse the tables of `.agents/games/the-last-window/content-plan.md` (days, calendar, decor, endings) and `economy.md` (unlock schedule) with `node:fs` and assert they equal the data, so documentation and code stay identical.
- [ ] `test/scenes.test.ts`: 8 regulars x 5 scenes, one chain each, ids unique, beat counts 6 to 9, beat length at most 25 words, speakers valid, 12 choices with the 4 regulars that have two, 24 option reactions, 16 ending blocks, guards resolve, scene 4 or 5 reacts to a choice for every regular, gifts 5 and 15.
- [ ] `test/readability.test.ts`: unit tests for the helper and a per-scene grade table assertion (at most 7.0 average, no beat above 10).
- [ ] `test/validators.test.ts`: deliberately broken copies (dangling next scene, bad guard, third choice, missing ending, 10-beat scene, unknown speaker, unknown art slot, wrong visit count, unreachable arc) produce exactly the expected issue codes; the real content produces none.
- [ ] `test/campaign-smoke.test.ts`: with the task 01 bot, play all 14 real days with `perfect` and check each shift closes, Day 1 follows the scripted orders, the regulars served on each day match the calendar, and each regular's scene k becomes eligible at visit k under `perfect` play; with `casual` play, report (not assert) how many scenes are eligible by Day 14.
- [ ] `test/text-hygiene.test.ts`: no empty strings, no duplicate scene titles, no `TODO` or placeholder tokens, every character inside Latin-1 plus the font subset punctuation.
- [ ] Update `content-plan.md` and `decisions-log.md` if any binding number moved; write `.agents/resources/2026-10-23/web-games/the-last-window/02/README.md` with counts (beats, words), the per-scene reading-grade table, and the casual-play scene report.

## Files Touched

- `apps-games/the-last-window-core/src/content/**`, `src/index.ts` (exports)
- `apps-games/the-last-window-core/test/{content-plan,scenes,readability,validators,campaign-smoke,text-hygiene}.test.ts`
- `.agents/games/the-last-window/{content-plan,decisions-log}.md` (only if numbers moved)
- `.agents/resources/2026-10-23/web-games/the-last-window/02/README.md`
- `tasks/epics/22-web-the-last-window/STATUS.md` (tick task 02)

## Acceptance Criteria

- All 40 scenes, 12 choices, 16 endings, 24 finale lines, 14 diary entries and 14 day cards exist, equal the plan, and pass `validateContent()` with zero issues.
- No dangling scene, choice, option or guard reference; every arc is reachable at visit k under the thresholds; both endings of every regular are reachable.
- Every scene reads at grade 7.0 or lower on average and no beat exceeds 25 words.
- The plan tables and the data are checked equal by tests; the 54 art slot ids equal `assets-index.md`.
- A `perfect` bot plays the 14 real days to completion.
- The four verification commands pass; no source file exceeds 800 lines.

## Verification Commands

- `bun run --filter '@web-games/the-last-window*' typecheck`
- `bun run --filter '@web-games/the-last-window*' test`
- `bun run --filter '@web-games/the-last-window' build`
- `bunx biome check apps-games/the-last-window apps-games/the-last-window-core`

## Out of Scope

- Progression, coins accounting, Late Shift generation and saving (task 03).
- Any UI, fonts, audio or art files.
- Rewriting the arcs: summaries in `content-plan.md` are the brief, not open for redesign.

## Commit message

`feat(the-last-window): add full v1 content, scenes and validators [22-web-the-last-window/02]`
