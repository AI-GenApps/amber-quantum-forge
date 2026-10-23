# Task 00 evidence - Dress Rehearsal planning prototype

Date: 2026-10-23. No visual QA, no browser, no device. Everything here was computed with Bun
scripts; nothing shipped is generated from it automatically.

## What was done

- Designed the rule engine (slots, 16 rule kinds, harmony, stars) and wrote it as a throwaway
  JavaScript prototype (`prototype/engine.mjs`).
- Authored the 48 closet pieces (`prototype/items.mjs`) and the 40 challenges
  (`prototype/challenges.mjs`, slot sets A to G, rules per challenge), then enumerated every
  complete look for each challenge in the closet that exists when its chapter unlocks
  (`prototype/report.mjs`, output `prototype/report.json`). Tables below.
- Tried a Daily Fitting generator (`prototype/daily.mjs`, helpers in `prototype/gen.mjs`) over 365
  dates from 2026-01-01 for each closet level.
- Wrote the briefs, client lines, chapter texts and per-piece art notes
  (`prototype/docs-data.mjs`); `.agents/games/dress-rehearsal/content-plan.md` was generated from
  these files, and the contrast numbers in `product.md` were computed with the WCAG formula.

Run it again: `cd prototype && bun report.mjs` (writes `report.txt`, `report.json`), `bun daily.mjs`.
Bun 1.4.3 was used.

## Results

- Closet levels used for proofs: Riviera Summer and Rainy City 16 pieces, Gala Night 24, Mountain
  Weekend 32, Studio Avant-garde 40, Vintage 70s 48.
- All 40 challenges have at least 2 three-star looks (minimum 2 on `gal-04` and `gal-05`), the empty
  board scores 0 stars for all 40, and the three-star share stays inside the caps (35 / 35 / 5 /
  2 / 2 / 2 percent for chapters 1 to 6; maximum per chapter 33.33, 25.69, 4.09, 0.36, 1.41,
  0.01).
- Complete-look counts by closet and slot set (for sizing): 16 pieces: set A 72, B 16, C 144, D 144,
  E 80, F 160, G 160; 48 pieces: set G 316,224.
- Harmony calibration: with the first draft weights and a bar of 80, 4 of 72 six-slot looks in the
  16-piece closet reached the bar and 0 of 160 eight-slot looks. The shipped weights with a bar of
  70 give the ranges in the table.
- Daily generator (12 attempts, seed look with harmony >= 70, rules filtered by 300 random
  samples, at most 10 percent of samples earning three stars): closet of 16 pieces 10 fallbacks in
  365 dates (average 2.23 attempts), 24 pieces 0 (1.35), 32 pieces 0 (1.05), 40 pieces 0 (1.08),
  48 pieces 0 (1.08).

## Proof counts

| Id | Slots | Rules | Looks | 3-star | Share |
|---|---|---|---|---|---|
| `riv-01` | 6 | 2 | 72 | 24 | 33.33% |
| `riv-02` | 6 | 2 | 72 | 9 | 12.50% |
| `riv-03` | 7 | 2 | 80 | 18 | 22.50% |
| `riv-04` | 6 | 3 | 144 | 41 | 28.47% |
| `riv-05` | 7 | 3 | 144 | 14 | 9.72% |
| `riv-06` | 6 | 3 | 72 | 8 | 11.11% |
| `riv-07` | 8 | 3 | 160 | 5 | 3.13% |
| `rai-01` | 6 | 3 | 144 | 37 | 25.69% |
| `rai-02` | 7 | 3 | 144 | 16 | 11.11% |
| `rai-03` | 6 | 3 | 16 | 4 | 25.00% |
| `rai-04` | 6 | 3 | 144 | 5 | 3.47% |
| `rai-05` | 7 | 3 | 144 | 23 | 15.97% |
| `rai-06` | 7 | 3 | 160 | 36 | 22.50% |
| `rai-07` | 8 | 4 | 160 | 6 | 3.75% |
| `gal-01` | 7 | 3 | 1,539 | 4 | 0.26% |
| `gal-02` | 7 | 3 | 1,539 | 21 | 1.36% |
| `gal-03` | 7 | 4 | 1,539 | 42 | 2.73% |
| `gal-04` | 6 | 3 | 1,296 | 2 | 0.15% |
| `gal-05` | 7 | 3 | 1,539 | 2 | 0.13% |
| `gal-06` | 7 | 3 | 513 | 21 | 4.09% |
| `gal-07` | 8 | 4 | 1,539 | 3 | 0.19% |
| `mtn-01` | 7 | 2 | 15,360 | 18 | 0.12% |
| `mtn-02` | 7 | 3 | 15,360 | 6 | 0.04% |
| `mtn-03` | 7 | 4 | 15,360 | 5 | 0.03% |
| `mtn-04` | 8 | 3 | 16,896 | 60 | 0.36% |
| `mtn-05` | 8 | 4 | 16,896 | 8 | 0.05% |
| `mtn-06` | 7 | 3 | 15,360 | 10 | 0.07% |
| `mtn-07` | 8 | 4 | 16,896 | 22 | 0.13% |
| `stu-01` | 7 | 3 | 28,750 | 14 | 0.05% |
| `stu-02` | 8 | 3 | 86,250 | 116 | 0.13% |
| `stu-03` | 7 | 4 | 28,750 | 405 | 1.41% |
| `stu-04` | 8 | 4 | 86,250 | 220 | 0.26% |
| `stu-05` | 8 | 4 | 86,250 | 42 | 0.05% |
| `stu-06` | 8 | 4 | 86,250 | 8 | 0.01% |
| `vin-01` | 8 | 2 | 316,224 | 6 | 0.00% |
| `vin-02` | 8 | 3 | 316,224 | 8 | 0.00% |
| `vin-03` | 8 | 4 | 316,224 | 15 | 0.00% |
| `vin-04` | 7 | 3 | 79,056 | 4 | 0.01% |
| `vin-05` | 8 | 4 | 316,224 | 19 | 0.01% |
| `vin-06` | 7 | 4 | 290,304 | 24 | 0.01% |

## Reference looks (hint fallback solutions)

Chosen as the three-star look with the most pieces from the challenge's own theme, then highest
harmony, then lowest price. Task 02 stores one reference per challenge (it may pick a different
three-star look as long as the validator proves it).

| Id | Look | Harmony | Spend |
|---|---|---|---|
| `riv-01` | top=riviera-1, bottom=riviera-4, shoes=riviera-5, bag=riviera-6, hat=riviera-7, accessory=riviera-8 | 83 | 308 |
| `riv-02` | top=riviera-1, bottom=riviera-4, shoes=riviera-5, bag=riviera-6, hat=riviera-7, accessory=riviera-8 | 83 | 308 |
| `riv-03` | top=riviera-1, bottom=riviera-4, shoes=riviera-5, bag=riviera-6, hat=riviera-7, accessory=riviera-8 | 83 | 308 |
| `riv-04` | top=riviera-1, bottom=riviera-3, outer=rainy-city-1, shoes=riviera-5, bag=riviera-6, accessory=riviera-8 | 78 | 370 |
| `riv-05` | top=riviera-1, bottom=riviera-3, outer=rainy-city-2, shoes=riviera-5, bag=rainy-city-6, hat=riviera-7, accessory=riviera-8 | 78 | 526 |
| `riv-06` | top=riviera-2, bottom=riviera-3, shoes=riviera-5, bag=riviera-6, hat=riviera-7, accessory=riviera-8 | 83 | 336 |
| `riv-07` | top=riviera-1, bottom=riviera-4, outer=rainy-city-1, shoes=riviera-5, bag=riviera-6, hat=riviera-7, accessory=riviera-8 | 78 | 404 |
| `rai-01` | top=rainy-city-3, bottom=rainy-city-4, outer=rainy-city-2, shoes=rainy-city-5, bag=rainy-city-6, accessory=rainy-city-8 | 89 | 562 |
| `rai-02` | top=rainy-city-3, bottom=rainy-city-4, outer=rainy-city-2, shoes=rainy-city-5, bag=rainy-city-6, hat=riviera-7, accessory=rainy-city-8 | 78 | 608 |
| `rai-03` | dress=rainy-city-7, outer=rainy-city-2, shoes=rainy-city-5, bag=rainy-city-6, hat=riviera-7, accessory=rainy-city-8 | 78 | 576 |
| `rai-04` | top=rainy-city-3, bottom=rainy-city-4, outer=rainy-city-2, shoes=rainy-city-5, bag=riviera-6, accessory=rainy-city-8 | 75 | 536 |
| `rai-05` | top=rainy-city-3, bottom=rainy-city-4, outer=rainy-city-1, shoes=rainy-city-5, bag=riviera-6, hat=riviera-7, accessory=rainy-city-8 | 70 | 498 |
| `rai-06` | top=rainy-city-3, bottom=rainy-city-4, outer=rainy-city-2, shoes=riviera-5, bag=rainy-city-6, accessory=rainy-city-8 | 89 | 496 |
| `rai-07` | top=rainy-city-3, bottom=rainy-city-4, outer=rainy-city-2, shoes=rainy-city-5, bag=rainy-city-6, hat=riviera-7, accessory=rainy-city-8 | 78 | 608 |
| `gal-01` | top=gala-3, bottom=gala-4, outer=gala-5, shoes=gala-6, bag=gala-7, accessory=gala-8 | 78 | 930 |
| `gal-02` | dress=gala-1, outer=gala-5, shoes=gala-6, bag=gala-7, accessory=gala-8 | 78 | 990 |
| `gal-03` | top=gala-3, bottom=gala-4, outer=gala-5, shoes=gala-6, bag=gala-7, accessory=gala-8 | 78 | 930 |
| `gal-04` | top=gala-3, bottom=rainy-city-4, outer=gala-5, shoes=gala-6, bag=gala-7, accessory=gala-8 | 78 | 868 |
| `gal-05` | dress=gala-2, outer=rainy-city-2, shoes=gala-6, bag=gala-7, accessory=rainy-city-8 | 89 | 712 |
| `gal-06` | top=gala-3, bottom=gala-4, shoes=gala-6, bag=gala-7, hat=riviera-7, accessory=gala-8 | 83 | 696 |
| `gal-07` | dress=gala-2, outer=gala-5, shoes=gala-6, bag=gala-7, hat=riviera-7, accessory=gala-8 | 72 | 906 |
| `mtn-01` | top=mountain-2, bottom=mountain-3, outer=rainy-city-1, shoes=mountain-5, bag=riviera-6, hat=mountain-7, accessory=mountain-8 | 84 | 532 |
| `mtn-02` | top=mountain-2, bottom=mountain-3, outer=rainy-city-1, shoes=mountain-5, bag=riviera-6, hat=mountain-7, accessory=mountain-8 | 84 | 532 |
| `mtn-03` | top=mountain-2, bottom=mountain-3, outer=rainy-city-1, shoes=riviera-5, bag=mountain-6, hat=mountain-7, accessory=rainy-city-8 | 78 | 478 |
| `mtn-04` | top=mountain-2, bottom=mountain-3, outer=rainy-city-1, shoes=mountain-5, bag=riviera-6, hat=mountain-7, accessory=mountain-8 | 84 | 532 |
| `mtn-05` | top=mountain-2, bottom=mountain-3, outer=mountain-4, shoes=mountain-5, bag=riviera-6, hat=mountain-7, accessory=rainy-city-8 | 78 | 632 |
| `mtn-06` | top=riviera-1, bottom=mountain-3, outer=rainy-city-1, shoes=mountain-5, bag=riviera-6, hat=mountain-7, accessory=mountain-8 | 90 | 474 |
| `mtn-07` | top=mountain-1, bottom=mountain-3, outer=mountain-4, shoes=mountain-5, bag=riviera-6, hat=mountain-7, accessory=rainy-city-8 | 83 | 594 |
| `stu-01` | dress=studio-3, outer=studio-4, shoes=studio-5, bag=studio-6, accessory=studio-8 | 95 | 805 |
| `stu-02` | top=studio-1, bottom=studio-2, outer=rainy-city-2, shoes=studio-5, bag=gala-7, hat=studio-7, accessory=studio-8 | 89 | 835 |
| `stu-03` | top=riviera-1, bottom=studio-2, outer=studio-4, shoes=studio-5, bag=studio-6, accessory=studio-8 | 89 | 717 |
| `stu-04` | dress=studio-3, outer=rainy-city-2, shoes=studio-5, bag=gala-7, hat=studio-7, accessory=studio-8 | 89 | 841 |
| `stu-05` | top=studio-1, bottom=studio-2, outer=rainy-city-2, shoes=studio-5, bag=studio-6, hat=studio-7, accessory=studio-8 | 91 | 845 |
| `stu-06` | top=gala-3, bottom=gala-4, outer=studio-4, shoes=studio-5, bag=studio-6, hat=riviera-7, accessory=studio-8 | 78 | 901 |
| `vin-01` | dress=vintage-3, outer=vintage-4, shoes=vintage-5, bag=vintage-6, hat=vintage-7, accessory=riviera-8 | 91 | 538 |
| `vin-02` | top=vintage-1, bottom=vintage-2, outer=vintage-4, shoes=vintage-5, bag=vintage-6, hat=vintage-7, accessory=riviera-8 | 91 | 572 |
| `vin-03` | top=vintage-1, bottom=vintage-2, outer=vintage-4, shoes=vintage-5, bag=vintage-6, hat=vintage-7, accessory=riviera-8 | 91 | 572 |
| `vin-04` | dress=vintage-3, outer=vintage-4, shoes=vintage-5, bag=vintage-6, accessory=riviera-8 | 91 | 480 |
| `vin-05` | dress=vintage-3, outer=vintage-4, shoes=vintage-5, bag=vintage-6, hat=vintage-7, accessory=riviera-8 | 91 | 538 |
| `vin-06` | top=vintage-1, bottom=vintage-2, outer=vintage-4, shoes=vintage-5, bag=vintage-6, hat=vintage-7, accessory=riviera-8 | 91 | 572 |
