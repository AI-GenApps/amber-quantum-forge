# Task 02 - full v1 content and validators (evidence)

Date: 2026-10-24. Everything below is produced from the data in
`apps-games/the-last-window-core/src/content/` and checked by the tests in
`apps-games/the-last-window-core/test/`. No browser, device or emulator was used.

## Counts

| Item | Count | Where checked |
|---|---|---|
| Campaign days | 14 | `validateContent` (`DAY_TABLE`), `content-plan.test.ts` |
| Customers over 14 days | 130 (48 regular visits, 82 walk-ins) | `DAY_TABLE`, `VISIT_COUNT` |
| Regulars | 8 | `CALENDAR`, `scenes.test.ts` |
| Scenes | 40 (8 x 5), all gifts 5 / 5 / 5 / 5 / 15 | `SCENE_COUNT`, `scenes.test.ts` |
| Choices / options / option reaction beats | 12 / 24 / 48 | `BAD_CHOICE_COUNT` |
| Endings | 16 blocks, 8 x 2, 3 to 4 beats each (64 ending beats) | `BAD_ENDING` |
| Main scene beats | 347 (6 to 9 per scene; 9 beats in 32 scenes) | `BEAT_COUNT` |
| Words in all scenes (main + reactions + endings) | 6,754 | `readability` table below |
| Finale lines | 24 (longest 17 words) plus a 21-word caption | `BEAT_LENGTH` |
| Diary entries / day cards | 14 / 14 (longest 31 / 25 words) | `BEAT_LENGTH` |
| Item flavour lines | 6 drinks, 5 pastries, 5 books, 5 moods, 8 decor | `text-hygiene.test.ts` |
| Tutorial | 7 coach steps, 6 scripted Day 1 orders | `campaign-smoke.test.ts` |
| Art slots | 54, equal to `assets-index.md` | `content-plan.test.ts` |

The mean Flesch-Kincaid grade over the 40 scenes is 1.54 (limit 7.0); no scene is above 2.8 and no single
beat above 8.1 (limit 10). The helper is a syllable heuristic, so grades are estimates; the writing is
deliberately plain. Very short fragments score high (one three-syllable word is grade 24), which is why
the beat limit is checked on whole beats only.

## Per-scene table

Columns: main beats, reaction beats (both options), ending beats (both endings), total words, longest beat
in words, scene reading grade, hardest single beat grade.

| Scene | Title | Main | React | Ending | Words | Longest | Grade | Worst beat |
|---|---|---|---|---|---|---|---|---|
| scene-1-1 | The Chair by the Glass | 9 | 0 | 0 | 131 | 22 | 1.24 | 3.8 |
| scene-1-2 | Forty Years of Weather | 9 | 0 | 0 | 125 | 18 | 0.63 | 2.3 |
| scene-1-3 | A Brass Letter | 9 | 4 | 0 | 184 | 21 | 1.28 | 5.2 |
| scene-1-4 | Storm Glass | 9 | 0 | 0 | 155 | 23 | 0.53 | 1.9 |
| scene-1-5 | The Light on Skerry Point | 6 | 0 | 8 | 182 | 19 | 1.83 | 6.1 |
| scene-2-1 | Grease on the Page | 9 | 0 | 0 | 139 | 21 | 1.17 | 7.2 |
| scene-2-2 | The Cargo Line Letter | 9 | 4 | 0 | 176 | 16 | 1.64 | 5.9 |
| scene-2-3 | A Spare Part | 9 | 0 | 0 | 128 | 19 | 2.43 | 7.6 |
| scene-2-4 | Night Shift on the Quay | 9 | 4 | 0 | 214 | 22 | 1.02 | 3.7 |
| scene-2-5 | The Marigold | 8 | 0 | 8 | 227 | 19 | 2.15 | 7.7 |
| scene-3-1 | Notes in the Margin | 9 | 0 | 0 | 120 | 20 | 1.81 | 8.1 |
| scene-3-2 | The Sea Hare | 9 | 0 | 0 | 128 | 19 | 1.51 | 7.0 |
| scene-3-3 | Low Tide, Muddy Boots | 9 | 4 | 0 | 193 | 21 | 1.53 | 4.8 |
| scene-3-4 | Cold Hands, Warm Cup | 9 | 0 | 0 | 119 | 18 | 2.72 | 6.5 |
| scene-3-5 | The Tide Pool Guide | 8 | 0 | 8 | 235 | 20 | 1.80 | 5.8 |
| scene-4-1 | Flour on the Pages | 9 | 0 | 0 | 125 | 21 | 1.64 | 5.4 |
| scene-4-2 | The Open Mic Poster | 9 | 4 | 0 | 191 | 23 | 1.71 | 6.3 |
| scene-4-3 | The Girl in the Fog | 9 | 0 | 0 | 141 | 23 | 0.94 | 4.0 |
| scene-4-4 | Stage Fright | 9 | 4 | 0 | 194 | 20 | 1.87 | 5.9 |
| scene-4-5 | Draft Nine | 8 | 0 | 8 | 241 | 20 | 1.41 | 6.8 |
| scene-5-1 | The Smell of Mornings | 9 | 0 | 0 | 125 | 21 | 0.60 | 4.9 |
| scene-5-2 | Twenty Years of Feud | 9 | 0 | 0 | 111 | 19 | 2.37 | 5.4 |
| scene-5-3 | A Cracked Crate | 9 | 4 | 0 | 196 | 19 | 0.50 | 4.9 |
| scene-5-4 | Karin's Side | 9 | 0 | 0 | 138 | 23 | 1.27 | 5.4 |
| scene-5-5 | Two Stalls, One Quay | 8 | 0 | 8 | 217 | 18 | 1.64 | 6.9 |
| scene-6-1 | A Quiet Ten Minutes | 9 | 0 | 0 | 133 | 22 | 2.22 | 5.8 |
| scene-6-2 | The Brochure | 9 | 4 | 0 | 195 | 21 | 2.46 | 6.3 |
| scene-6-3 | The Missed Lunch | 9 | 0 | 0 | 122 | 19 | 2.05 | 7.8 |
| scene-6-4 | A Knock After Closing | 9 | 4 | 0 | 204 | 21 | 0.39 | 4.7 |
| scene-6-5 | House Call Hours | 7 | 0 | 8 | 220 | 21 | 2.38 | 6.4 |
| scene-7-1 | The Name on the Flyleaf | 9 | 0 | 0 | 142 | 22 | 0.45 | 2.3 |
| scene-7-2 | Who Was Ines | 9 | 0 | 0 | 153 | 25 | 1.52 | 4.9 |
| scene-7-3 | Postmarks | 9 | 4 | 0 | 204 | 22 | 1.35 | 3.6 |
| scene-7-4 | A Reply, or Not | 9 | 0 | 0 | 141 | 21 | 1.70 | 5.0 |
| scene-7-5 | The Book That Came Home | 7 | 0 | 8 | 210 | 20 | 2.39 | 7.6 |
| scene-8-1 | Wet Paint | 9 | 0 | 0 | 135 | 21 | 1.30 | 4.8 |
| scene-8-2 | The Blank Wall | 9 | 4 | 0 | 192 | 22 | 1.07 | 4.4 |
| scene-8-3 | Seven Shades of Grey | 9 | 0 | 0 | 143 | 20 | 2.03 | 6.9 |
| scene-8-4 | A Child's Drawing | 9 | 4 | 0 | 196 | 20 | 0.96 | 4.0 |
| scene-8-5 | The Window Mural | 7 | 0 | 8 | 229 | 20 | 2.23 | 6.7 |

## Casual-play report (reported, not asserted)

`test/campaign-smoke.test.ts` plays the 14 real days with the task 01 `casual` bot (reacts every 2.5 s,
20 percent wrong taps, unordered seats) using the "Suggest stock" plan and plays every scene as soon as it is
eligible. Result: 29 of 40 scenes are played by Day 14 (scenes per regular: Odile 5, Tobias 3, Priya 5,
Juno 2, Henrik 2, Leona 3, Abel 5, Sunniva 4); five regulars still have an open story and finish it in Late
Shifts. The bot loses 8 of 12 customers on Days 13 and 14, which is the pace issue already recorded as Q1;
a human who is slower than `perfect` but faster than this bot lands between the two. Under `perfect` play
(foresight stock: the shelf holds the pastries and books the regulars will ask for) all 40 scenes are
played, scene k becoming eligible exactly on the regular's k-th visit day.

## Decisions taken in this task

See `.agents/games/the-last-window/decisions-log.md`, entry "2026-10-24 - Task 02 content".
