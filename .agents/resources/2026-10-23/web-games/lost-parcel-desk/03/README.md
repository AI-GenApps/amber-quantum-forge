# Task 03 evidence - Daily Parcel over 365 dates

Command (headless, no browser): `bun run --filter '@web-games/lost-parcel-desk-core' test -- test/daily-365.test.ts`.
The test generates a Daily Parcel for each of the 365 dates from 2026-01-01 to 2026-12-31 with
`generateDaily(dailySeedOf(dateKey), weekdayOf(dateKey))`, validates it with `analyseCase` and the flavour
hygiene (`dailyIssues`), replays a scripted perfect solution through the real reducers and asserts 3 stamps.
The numbers below are asserted exactly by the test ("matches the summary committed in the task 03 evidence"),
so this file and the code cannot drift apart silently.

| Measure | Result |
|---|---|
| Dates generated and validated | 365 of 365 |
| Dates reaching 3 stamps by the scripted solution | 365 of 365 |
| Dates that used a committed fallback | 0 (limit 18, 5 percent) |
| Attempts per date (0 = first try): min / median / max | 0 / 0 / 4 |
| Attempt histogram (attempt: dates) | 0: 316, 1: 39, 2: 7, 3: 2, 4: 1 |
| Distinct owners | 12 of 12 (21 to 42 dates each) |
| Distinct owner + deduction combinations (facet, polarity, value) | 230 |
| Distinct ordered facet pairs | 12 of 12 |
| Distinct candidate triples | 140 |
| Dates per weekday | 52 or 53 (Mon 52, Tue 52, Wed 52, Thu 53, Fri 52, Sat 52, Sun 52) |

Fallback coverage: the 14 committed fallback plans (2 per weekday, `seed mod 2`) are tested on their own
(`test/daily-generator.test.ts`): each validates, follows the weekday ladder (objects, deduction kinds,
flavour count) and is solved to 3 stamps. A throwaway run with the attempt limit forced to 0 also produced a
valid fallback case for all 365 dates.

Cross-checks in the app tests (`apps-games/lost-parcel-desk/test/save.test.ts`): the core `dailySeedOf` equals
the kit `dailySeed("lost-parcel-desk", dateKey)` and the core `weekdayOf` equals the weekday derived from the
kit `dayNumber` and from `Date`, for 366 consecutive dates, and the app and the core build the same case.

Perfect campaign: playing the 12 real cases in order through the real reducers pays exactly 450 postage and
36 stamps (`test/economy.test.ts`, `test/achievements.test.ts` in the core; `test/game-store.test.ts` through
the game store with the memory adapter).
