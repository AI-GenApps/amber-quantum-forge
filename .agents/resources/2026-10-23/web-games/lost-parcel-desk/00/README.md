# Task 00 - planning evidence

Task 00 changed no code. The logic of the 12 cases in `.agents/games/lost-parcel-desk/content-plan.md` was
checked during planning with two throwaway Node scripts (kept outside the repo in the scratch directory and
deleted afterwards). The checks are the specification for the shipped validator in task 02.

## Check 1 - case logic (all 12 cases pass)

For each case the script used the same cast table that is printed in `content-plan.md` (four facets, six values, every value held
by exactly two people) and the case's three candidates and deductions, then verified:

- exactly one candidate satisfies every deduction and it is the owner;
- removing any single deduction leaves at least two candidates (every deduction is necessary);
- a `pair` deduction has two clues, a `direct` or `rule-out` deduction has one, and a rule-out has polarity `isnot`;
- no two clues share an object face and every object carries at least one clue;
- object counts are 4 (cases 01 to 11) and 5 (case 12).

Totals produced by the script and used throughout the knowledge base: 49 objects, 70 clues (33 lead, 37
flavour), 24 deductions (12 direct, 9 pair, 3 rule-out). Candidate appearances per townsperson: 2 to 4.

| Case | Objects | Lead clues | Flavour clues | Candidates |
|---|---|---|---|---|
| 01 The Seaside Postcard | 4 | 2 | 3 | Odalie, Ambrose, Tobias |
| 02 The Biscuit Tin Hymnal | 4 | 2 | 3 | Barnaby, Priya, Dennis |
| 03 The Barometer in a Hat Box | 4 | 2 | 3 | Winifred, Priya, Tobias |
| 04 Small Print and Smaller Batteries | 4 | 2 | 3 | Cosmo, Iggy, Ambrose |
| 05 The Pressed Wren | 4 | 3 | 3 | Marguerite, Barnaby, Hettie |
| 06 Cinders in the Cake Box | 4 | 2 | 3 | Dennis, Marguerite, Iggy |
| 07 A Note from the Back Row | 4 | 3 | 3 | Priya, Barnaby, Winifred |
| 08 The Cane Tip and the Cat | 4 | 3 | 3 | Hettie, Rosalind, Odalie |
| 09 Domes and Door Keys | 4 | 4 | 3 | Iggy, Dennis, Cosmo |
| 10 The Knight Without a Board | 4 | 3 | 3 | Tobias, Ambrose, Rosalind |
| 11 The Lamp That Wasn't Lit | 4 | 3 | 3 | Rosalind, Hettie, Cosmo |
| 12 The Piano Tuner's Key | 5 | 4 | 4 | Ambrose, Odalie, Priya |

Script verdict: `ALL OK`.

## Check 2 - flavour hygiene (0 issues)

For every flavour clue tag and every object name that carries no lead clue, the script searched for almanac
keywords (street, pastime, look and pet vocabulary) of any value held by one or two, but not all three, of the
case's candidates. Two near misses were rewritten during planning ("left drawer" to "top drawer" in case 09,
"copperplate hand" to "looping hand" in case 12). Script verdict: `hygiene issues 0`.

## Tool facts recorded for later tasks

- Google Fonts paths verified with HTTP HEAD on 2026-10-23: `ofl/courierprime/CourierPrime-Regular.ttf`,
  `CourierPrime-Bold.ttf`, `ofl/courierprime/OFL.txt` and `ofl/ibmplexsans/OFL.txt` exist (HTTP 200);
  IBM Plex Sans ships only as the variable fonts `IBMPlexSans[wdth,wght].ttf` and
  `IBMPlexSans-Italic[wdth,wght].ttf` (there is no static `IBMPlexSans-Regular.ttf`).
- Contrast ratios in `product.md` were computed with the WCAG relative-luminance formula for the 13 palette tokens.
