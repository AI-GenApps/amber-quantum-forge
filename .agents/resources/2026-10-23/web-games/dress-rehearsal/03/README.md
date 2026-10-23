# Task 03 evidence - progression, economy, daily mode, versioned save

Date: 2026-10-24. No visual QA, no browser, no device. Everything was computed headlessly with
Vitest (node for the core, happy-dom for the app), `tsc`, `vite build` and Biome.

## What was done

- Core `progress/`: `Profile` (v1), `sanitizeProfile`, unlock rules, economy reducers (campaign
  coins, hints, freezes, frames), affinity, daily results and streaks, gallery, records and share
  text. All reducers are pure and return a new profile plus a typed event list.
- Core `daily/`: tier ladder, candidate rules, brief builder, `generateDaily` (12 attempts, forked
  PRNG per attempt, seed look with harmony >= 70, 20 percent non-triviality filter over 300 sampled
  looks, at most 10 percent sampled three-star share, tier rule counts, Thursday and Sunday
  extras) and 7 committed fallback templates.
- App `state/`: `saveStores.ts` (kit save store, schema v1, empty migrations), `game.ts`
  (subscribable store, actions, `useGame`), `boot.ts` (pause flush wiring used by `main.tsx`).

## 365-date proof (test/daily-365.test.ts)

Dates 2026-01-01 to 2026-12-31, seed `hashString("dress-rehearsal|daily|<date>")`, each of the five
closet levels. Every stored reference look is re-scored with `scoreLook` (three stars, complete);
every challenge passes `validateChallenge` (with the 120 character daily brief cap); an independent
400-look sample confirms each rule fails at least 10 percent of random looks and at most 20
percent of random looks reach three stars.

| Closet level | Pieces | Fallbacks | Fallback share | Attempts min | median | max | mean | Longest brief |
|---|---|---|---|---|---|---|---|---|
| 1 | 16 | 10 | 2.7% | 1 | 1 | 12 | 2.10 | 120 |
| 2 | 24 | 0 | 0.0% | 1 | 1 | 11 | 1.38 | 120 |
| 3 | 32 | 0 | 0.0% | 1 | 1 | 3 | 1.06 | 120 |
| 4 | 40 | 0 | 0.0% | 1 | 1 | 5 | 1.09 | 120 |
| 5 | 48 | 0 | 0.0% | 1 | 1 | 3 | 1.05 | 120 |

Attempts are counted over generated dates only. The limit is 18 fallbacks per level; the maximum
used is 10. At level 1 the 10 fallbacks are 9 Mondays (two rules are hard to keep rare in a
16-piece closet) and 1 Thursday. The numbers equal the task 00 prototype
(`../00/prototype/daily.mjs`).

## Fallback templates

Seven templates, one per weekday, built from the 16-piece starting closet (so valid for every
closet). They were found by running the generator on the starting closet over many seeds, keeping
a solution with 4 to 5 three-star looks (2.8 to 3.1 percent of all complete looks), distinct
clients and a readable rule mix, and then committing the result as data in
`src/daily/fallbacks.ts`. `proveChallenge` counts below are exhaustive over the 16-piece closet.

| Weekday | Id | Set | Client | Rules | Looks | Three-star looks | Harmony | Spend |
|---|---|---|---|---|---|---|---|---|
| Mon | `daily-fallback-mon` | C | edie | `era-min:now; include-piece:item-riviera-6` | 144 | 4 (2.78%) | 75 | 444 |
| Tue | `daily-fallback-tue` | C | mireille | `warmth-min:5; include-colour:mint; include-piece:item-riviera-4` | 144 | 4 (2.78%) | 70 | 560 |
| Wed | `daily-fallback-wed` | F | jun | `include-piece:item-riviera-4; min-spend:460; palette-warm` | 160 | 5 (3.13%) | 70 | 468 |
| Thu | `daily-fallback-thu` | F | tobias | `formality-max:3; avoid-colour:sky; max-spend:360` | 160 | 5 (3.13%) | 89 | 354 |
| Fri | `daily-fallback-fri` | G | ottoline | `palette-warm; avoid-piece:item-rainy-city-8; max-spend:440` | 160 | 5 (3.13%) | 70 | 432 |
| Sat | `daily-fallback-sat` | G | priya | `max-spend:450; warmth-min:4; include-piece:item-rainy-city-3; avoid-colour:mint` | 160 | 5 (3.13%) | 78 | 442 |
| Sun | `daily-fallback-sun` | G | edie | `avoid-piece:item-riviera-2; warmth-min:7; max-hues:1; max-spend:510` | 160 | 5 (3.13%) | 70 | 498 |

Thursday has a formality rule (era or formality extra), Sunday has a budget rule, slot counts are
6, 6, 7, 7, 8, 8, 8 and rule counts 2, 3, 3, 3, 3, 4, 4.

## Economy checks

`test/economy.test.ts` and `test/daily-rewards.test.ts` read `economy.md` and compare the source
and sink tables with the constants (40 grant, 10 first clear, 5 per star, 40 chapter bonus, 10 per
affinity level, 8 / 12 / 16 daily, streak bonus 2 x min(streak, 7), hints 20 / 30, freeze 25,
frames 30 / 40 / 60). A perfect campaign replay (every challenge at three stars, in order) ends
with exactly 1460 coins, 120 stars, 6 chapter bonuses and affinity level 3 for all six clients;
upgrading 1 to 2 to 3 stars in three passes also ends at 1460.

## Save checks

`apps-games/dress-rehearsal/test/save.test.ts` runs on the kit memory adapter: fresh profile with
40 coins, round trip, persistence across stores, committed fixture `test/fixtures/profile-v1.json`
loads as `loaded` and is a fixed point of `sanitizeProfile`, corrupt JSON and a future-version
envelope give `recovered` with the backup key written, unknown fields are stripped, and a local
version 2 schema with a stub migration proves the chain runs through the same `parse`. Settings
persist under `dress-rehearsal.settings` and survive `resetProgress`.
