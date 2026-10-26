# Task 02 evidence - full v1 content and validators

Date: 2026-10-24. No visual QA, no browser, no device. Everything was computed headlessly with
Vitest (node environment), `tsc` and Biome.

## What was done

- Ported the 48 pieces, 6 chapters, 6 clients (48 lines), 40 challenges, 9 rule cards, 5 tutorial
  steps and the string tables from `.agents/games/dress-rehearsal/content-plan.md` into
  `apps-games/dress-rehearsal-core/src/content/`. The data files were generated once from the plan
  tables (throwaway script, not committed) and are now hand-maintained.
- `test/content-plan.test.ts` parses the same tables back from `content-plan.md` and compares them
  with the data, so a change on either side fails the test.
- `test/proof.test.ts` enumerates every challenge once in its unlock closet (about 2.1 million
  looks) and compares looks and three-star counts with the proof table (identical to the task 00
  prototype), the minimum of 2 three-star looks, the per-chapter share caps (35 / 35 / 5 / 2 / 2 /
  2 percent), the committed reference look (three stars) and the empty board (zero stars). The
  whole proof takes about 2 seconds in Node.
- No binding number moved: `content-plan.md`, `economy.md`, `product.md` and `decisions-log.md`
  are unchanged.

## Choices the spec left open

- `ChallengeDef.rules` is parsed from the plan's rule-code strings with `parseRuleCode` (helper
  `challenge()` in `content/define.ts`); each rule card carries the rule kinds it introduces.
- `validateChallenge(def, closet, { slotSets?, proof? })` always runs the cheap checks (including
  the reference look and the empty board) and adds the proof checks only when a `ProofResult` from
  `proveChallenge` is passed. `validateContent({ proofs })` does the same for the whole set; with
  no argument it skips the exhaustive part. The rule-before-card check lives in `validateCards`.
- The tutorial steps keep the plan's wording as `title` and `description` and add `targets` and
  `advance` hints for the onboarding task.

## Reference looks (stored hint fallback solutions)

Each is a three-star look inside the unlock closet; the table is the committed `reference` of the
challenge. Harmony is the engine's total, spend is the sum of prices.

| Id | Look (engine slot order) | Harmony | Spend |
|---|---|---|---|
| `riv-01` | hat=item-riviera-7, accessory=item-riviera-8, top=item-riviera-1, bag=item-riviera-6, bottom=item-riviera-4, shoes=item-riviera-5 | 83 | 308 |
| `riv-02` | hat=item-riviera-7, accessory=item-riviera-8, top=item-riviera-1, bag=item-riviera-6, bottom=item-riviera-4, shoes=item-riviera-5 | 83 | 308 |
| `riv-03` | hat=item-riviera-7, accessory=item-riviera-8, top=item-riviera-1, bag=item-riviera-6, bottom=item-riviera-4, shoes=item-riviera-5 | 83 | 308 |
| `riv-04` | accessory=item-riviera-8, outer=item-rainy-city-1, top=item-riviera-1, bag=item-riviera-6, bottom=item-riviera-3, shoes=item-riviera-5 | 78 | 370 |
| `riv-05` | hat=item-riviera-7, accessory=item-riviera-8, outer=item-rainy-city-2, top=item-riviera-1, bag=item-rainy-city-6, bottom=item-riviera-3, shoes=item-riviera-5 | 78 | 526 |
| `riv-06` | hat=item-riviera-7, accessory=item-riviera-8, top=item-riviera-2, bag=item-riviera-6, bottom=item-riviera-3, shoes=item-riviera-5 | 83 | 336 |
| `riv-07` | hat=item-riviera-7, accessory=item-riviera-8, outer=item-rainy-city-1, top=item-riviera-1, bag=item-riviera-6, bottom=item-riviera-4, shoes=item-riviera-5 | 78 | 404 |
| `rai-01` | accessory=item-rainy-city-8, outer=item-rainy-city-2, top=item-rainy-city-3, bag=item-rainy-city-6, bottom=item-rainy-city-4, shoes=item-rainy-city-5 | 89 | 562 |
| `rai-02` | hat=item-riviera-7, accessory=item-rainy-city-8, outer=item-rainy-city-2, top=item-rainy-city-3, bag=item-rainy-city-6, bottom=item-rainy-city-4, shoes=item-rainy-city-5 | 78 | 608 |
| `rai-03` | hat=item-riviera-7, accessory=item-rainy-city-8, outer=item-rainy-city-2, dress=item-rainy-city-7, bag=item-rainy-city-6, shoes=item-rainy-city-5 | 78 | 576 |
| `rai-04` | accessory=item-rainy-city-8, outer=item-rainy-city-2, top=item-rainy-city-3, bag=item-riviera-6, bottom=item-rainy-city-4, shoes=item-rainy-city-5 | 75 | 536 |
| `rai-05` | hat=item-riviera-7, accessory=item-rainy-city-8, outer=item-rainy-city-1, top=item-rainy-city-3, bag=item-riviera-6, bottom=item-rainy-city-4, shoes=item-rainy-city-5 | 70 | 498 |
| `rai-06` | accessory=item-rainy-city-8, outer=item-rainy-city-2, top=item-rainy-city-3, bag=item-rainy-city-6, bottom=item-rainy-city-4, shoes=item-riviera-5 | 89 | 496 |
| `rai-07` | hat=item-riviera-7, accessory=item-rainy-city-8, outer=item-rainy-city-2, top=item-rainy-city-3, bag=item-rainy-city-6, bottom=item-rainy-city-4, shoes=item-rainy-city-5 | 78 | 608 |
| `gal-01` | accessory=item-gala-8, outer=item-gala-5, top=item-gala-3, bag=item-gala-7, bottom=item-gala-4, shoes=item-gala-6 | 78 | 930 |
| `gal-02` | accessory=item-gala-8, outer=item-gala-5, dress=item-gala-1, bag=item-gala-7, shoes=item-gala-6 | 78 | 990 |
| `gal-03` | accessory=item-gala-8, outer=item-gala-5, top=item-gala-3, bag=item-gala-7, bottom=item-gala-4, shoes=item-gala-6 | 78 | 930 |
| `gal-04` | accessory=item-gala-8, outer=item-gala-5, top=item-gala-3, bag=item-gala-7, bottom=item-rainy-city-4, shoes=item-gala-6 | 78 | 868 |
| `gal-05` | accessory=item-rainy-city-8, outer=item-rainy-city-2, dress=item-gala-2, bag=item-gala-7, shoes=item-gala-6 | 89 | 712 |
| `gal-06` | hat=item-riviera-7, accessory=item-gala-8, top=item-gala-3, bag=item-gala-7, bottom=item-gala-4, shoes=item-gala-6 | 83 | 696 |
| `gal-07` | hat=item-riviera-7, accessory=item-gala-8, outer=item-gala-5, dress=item-gala-2, bag=item-gala-7, shoes=item-gala-6 | 72 | 906 |
| `mtn-01` | hat=item-mountain-7, accessory=item-mountain-8, outer=item-rainy-city-1, top=item-mountain-2, bag=item-riviera-6, bottom=item-mountain-3, shoes=item-mountain-5 | 84 | 532 |
| `mtn-02` | hat=item-mountain-7, accessory=item-mountain-8, outer=item-rainy-city-1, top=item-mountain-2, bag=item-riviera-6, bottom=item-mountain-3, shoes=item-mountain-5 | 84 | 532 |
| `mtn-03` | hat=item-mountain-7, accessory=item-rainy-city-8, outer=item-rainy-city-1, top=item-mountain-2, bag=item-mountain-6, bottom=item-mountain-3, shoes=item-riviera-5 | 78 | 478 |
| `mtn-04` | hat=item-mountain-7, accessory=item-mountain-8, outer=item-rainy-city-1, top=item-mountain-2, bag=item-riviera-6, bottom=item-mountain-3, shoes=item-mountain-5 | 84 | 532 |
| `mtn-05` | hat=item-mountain-7, accessory=item-rainy-city-8, outer=item-mountain-4, top=item-mountain-2, bag=item-riviera-6, bottom=item-mountain-3, shoes=item-mountain-5 | 78 | 632 |
| `mtn-06` | hat=item-mountain-7, accessory=item-mountain-8, outer=item-rainy-city-1, top=item-riviera-1, bag=item-riviera-6, bottom=item-mountain-3, shoes=item-mountain-5 | 90 | 474 |
| `mtn-07` | hat=item-mountain-7, accessory=item-rainy-city-8, outer=item-mountain-4, top=item-mountain-1, bag=item-riviera-6, bottom=item-mountain-3, shoes=item-mountain-5 | 83 | 594 |
| `stu-01` | accessory=item-studio-8, outer=item-studio-4, dress=item-studio-3, bag=item-studio-6, shoes=item-studio-5 | 95 | 805 |
| `stu-02` | hat=item-studio-7, accessory=item-studio-8, outer=item-rainy-city-2, top=item-studio-1, bag=item-gala-7, bottom=item-studio-2, shoes=item-studio-5 | 89 | 835 |
| `stu-03` | accessory=item-studio-8, outer=item-studio-4, top=item-riviera-1, bag=item-studio-6, bottom=item-studio-2, shoes=item-studio-5 | 89 | 717 |
| `stu-04` | hat=item-studio-7, accessory=item-studio-8, outer=item-rainy-city-2, dress=item-studio-3, bag=item-gala-7, shoes=item-studio-5 | 89 | 841 |
| `stu-05` | hat=item-studio-7, accessory=item-studio-8, outer=item-rainy-city-2, top=item-studio-1, bag=item-studio-6, bottom=item-studio-2, shoes=item-studio-5 | 91 | 845 |
| `stu-06` | hat=item-riviera-7, accessory=item-studio-8, outer=item-studio-4, top=item-gala-3, bag=item-studio-6, bottom=item-gala-4, shoes=item-studio-5 | 78 | 901 |
| `vin-01` | hat=item-vintage-7, accessory=item-riviera-8, outer=item-vintage-4, dress=item-vintage-3, bag=item-vintage-6, shoes=item-vintage-5 | 91 | 538 |
| `vin-02` | hat=item-vintage-7, accessory=item-riviera-8, outer=item-vintage-4, top=item-vintage-1, bag=item-vintage-6, bottom=item-vintage-2, shoes=item-vintage-5 | 91 | 572 |
| `vin-03` | hat=item-vintage-7, accessory=item-riviera-8, outer=item-vintage-4, top=item-vintage-1, bag=item-vintage-6, bottom=item-vintage-2, shoes=item-vintage-5 | 91 | 572 |
| `vin-04` | accessory=item-riviera-8, outer=item-vintage-4, dress=item-vintage-3, bag=item-vintage-6, shoes=item-vintage-5 | 91 | 480 |
| `vin-05` | hat=item-vintage-7, accessory=item-riviera-8, outer=item-vintage-4, dress=item-vintage-3, bag=item-vintage-6, shoes=item-vintage-5 | 91 | 538 |
| `vin-06` | hat=item-vintage-7, accessory=item-riviera-8, outer=item-vintage-4, top=item-vintage-1, bag=item-vintage-6, bottom=item-vintage-2, shoes=item-vintage-5 | 91 | 572 |
