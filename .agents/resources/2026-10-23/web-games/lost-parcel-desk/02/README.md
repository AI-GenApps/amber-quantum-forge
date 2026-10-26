# Task 02 - full v1 content and validators (evidence)

Content lives in `apps-games/lost-parcel-desk-core/src/content/`; the spec of record is
`.agents/games/lost-parcel-desk/content-plan.md` and `test/content-plan.test.ts` keeps the two identical.

## Per-case table

Kinds: D = direct, K = key-and-lock pair, R = rule-out. Reveal and label lengths are in characters
(limits 200 to 420 and 60).

| Case | Title | Chapter | Objects | Lead clues | Flavour clues | Deductions | Zoom clues | Difficulty | Par min | Reveal chars | Label chars |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | The Seaside Postcard | 1 | 4 | 2 | 3 | D+D | 1 | 1 | 5 | 275 | 47 |
| 02 | The Biscuit Tin Hymnal | 1 | 4 | 2 | 3 | D+D | 1 | 1 | 5 | 290 | 52 |
| 03 | The Barometer in a Hat Box | 1 | 4 | 2 | 3 | D+D | 1 | 2 | 5 | 312 | 56 |
| 04 | Small Print and Smaller Batteries | 1 | 4 | 2 | 3 | D+D | 1 | 2 | 6 | 312 | 53 |
| 05 | The Pressed Wren | 2 | 4 | 3 | 3 | K+D | 1 | 3 | 6 | 309 | 53 |
| 06 | Cinders in the Cake Box | 2 | 4 | 2 | 3 | D+R | 1 | 3 | 6 | 267 | 53 |
| 07 | A Note from the Back Row | 2 | 4 | 3 | 3 | D+K | 0 | 3 | 7 | 263 | 57 |
| 08 | The Cane Tip and the Cat | 2 | 4 | 3 | 3 | D+K | 1 | 4 | 7 | 299 | 51 |
| 09 | Domes and Door Keys | 3 | 4 | 4 | 3 | K+K | 1 | 4 | 8 | 284 | 49 |
| 10 | The Knight Without a Board | 3 | 4 | 3 | 3 | K+R | 0 | 4 | 8 | 303 | 55 |
| 11 | The Lamp That Wasn't Lit | 3 | 4 | 3 | 3 | K+R | 0 | 5 | 8 | 311 | 54 |
| 12 | The Piano Tuner's Key | 3 | 5 | 4 | 4 | K+K | 0 | 5 | 8 | 295 | 54 |

Totals: 12 cases, 49 objects, 70 clues (33 lead, 37 flavour), 24 deductions (12 direct, 9 pair, 3 rule-out), 12 townsfolk, 24 almanac entries, 36 stamps.

## Validator output summary

- `validateContent()` on the shipped data: 0 issues (0 from per-case validation).
- Every case passes `analyseCase`: the owner is the only consistent candidate, each deduction is necessary
  (removing it leaves two candidates), every other clue is flavour. A scripted perfect solution earns 3 stamps
  on all 12 cases.
- Keyword hygiene: no flavour clue text or tag, and no flavour-only object name or caption, uses an almanac
  keyword (or one of the extra `avoid` terms in `almanac.ts`) of a value held by some but not all of the case's
  three candidates. No clue text, tag or caption names a trade, and none names a townsperson.
- Broken fixtures in `test/content-validators.test.ts` produce the expected issue codes: FLAVOUR_KEYWORD_LEAK,
  OBJECT_KEYWORD_LEAK, TRADE_WORD, HOTSPOT_BOUNDS, HOTSPOT_MISSING, HOTSPOT_UNEXPECTED, HOTSPOT_CLOSE,
  OBJECT_COUNT, DUPLICATE_TITLE, DUPLICATE_SLUG, DUPLICATE_CLUE_TEXT, REVEAL_LENGTH, REVEAL_MISSING_OWNER,
  MECHANIC_GATING, ART_SLOT, GLYPH_INVALID, VALUE_HOLDERS, PERSON_APPEARANCES and the set-level mismatches.

## Deviations recorded

- Reveal texts in `content-plan.md` were one-line drafts under 200 characters; the plan now carries the shipped
  200 to 420 character texts (see `decisions-log.md`).
- The neutral-name rule applies to objects that carry no lead clue; an object that carries a lead clue may
  name what the clue is about (case 09 object "Matchbox of foam domes").
