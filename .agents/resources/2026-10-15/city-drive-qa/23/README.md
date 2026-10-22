# Task 23 evidence: daily challenge and car upgrades economy

Numbers are produced by the shipped content (`content/cars.json`, the 24 mission files,
`content/progression.json`) and asserted by:

- `apps-games/city-drive-core/test/economy/affordability.test.ts` (task 12 rules, unchanged)
- `apps-games/city-drive-core/test/economy/affordability-upgrades.test.ts` (this task)
- `apps-games/city-drive-core/test/economy/daily.test.ts`, `upgrades.test.ts`

The suggested numbers in the task file were kept; the simulation did not require changing them.

## Unlock path (upgrades excluded)

- 3-star total over all 24 missions: 4954 coins. Car prices: 4200 coins. Ratio 1.180 (rule: at least 1.15).
- A 2-star player owns 1, 2 and 4 paid cars after districts 1, 2 and 3 (about one per district).
- A 3-star player can afford the whole roster. Unchanged from task 12.

## Daily earnings (same stars every day, streak never broken)

| Day | 1 star | 2 stars | 3 stars | cumulative 1 star | cumulative 2 stars | cumulative 3 stars |
|---|---|---|---|---|---|---|
| 1 | 40 | 80 | 150 | 40 | 80 | 150 |
| 2 | 44 | 88 | 165 | 84 | 168 | 315 |
| 3 | 48 | 96 | 180 | 132 | 264 | 495 |
| 4 | 52 | 104 | 195 | 184 | 368 | 690 |
| 5 | 56 | 112 | 210 | 240 | 480 | 900 |
| 6 | 60 | 120 | 225 | 300 | 600 | 1125 |
| 7 | 60 | 120 | 225 | 360 | 720 | 1350 |
| 8 | 60 | 120 | 225 | 420 | 840 | 1575 |
| 9 | 60 | 120 | 225 | 480 | 960 | 1800 |
| 10 | 60 | 120 | 225 | 540 | 1080 | 2025 |
| 11 | 60 | 120 | 225 | 600 | 1200 | 2250 |
| 12 | 60 | 120 | 225 | 660 | 1320 | 2475 |
| 13 | 60 | 120 | 225 | 720 | 1440 | 2700 |
| 14 | 60 | 120 | 225 | 780 | 1560 | 2925 |

The streak bonus is +10% per streak day after the first, capped at +50% (day 6).

## Upgrade costs and effect at level 3 on every track

Cost per level is 15%, 25% and 40% of the car's price, rounded to 5 coins. The free starter is priced as
if it cost 400. A track that cannot improve a car is not sold (Apex Racer power and brakes).

| car | price | cost L1 / L2 / L3 (one track) | full bill (useful tracks) | engine N | top km/h | friction slip | side stiffness | brake N |
|---|---|---|---|---|---|---|---|---|
| `sedan` | 0 | 60 / 100 / 160 | 960 | 6000 -> 7080 | 115 -> 119 | 2.6 -> 3.068 | 1 -> 1.06 | 12000 -> 14160 |
| `hatch` | 400 | 60 / 100 / 160 | 960 | 6000 -> 6510 | 112 -> 119 | 2.8 -> 3.3 | 1 -> 1.06 | 12000 -> 13440 |
| `suv` | 700 | 105 / 175 / 280 | 1680 | 7600 -> 8968 | 108 -> 117.7 | 3 -> 3.3 | 1 -> 1.06 | 14500 -> 17110 |
| `patrol` | 900 | 135 / 225 / 360 | 2160 | 7000 -> 8060 | 118 -> 119 | 2.8 -> 3.3 | 1 -> 1.06 | 14000 -> 16520 |
| `cab` | 1000 | 150 / 250 / 400 | 2400 | 7200 -> 7750 | 114 -> 119 | 3 -> 3.3 | 1 -> 1.06 | 13500 -> 15930 |
| `racer` | 1200 | 180 / 300 / 480 | 960 (grip only) | 6200 -> 6200 | 119 -> 119 | 3.2 -> 3.3 | 1 -> 1.06 | 12800 -> 12800 |

Full upgrade bill for the whole roster: 9120 coins (11040 if the racer's two dead tracks were sold).

## Long-term goal checks

| Check | Result |
|---|---|
| Upgrade bill (9120) vs 14 perfect dailies (2925) | bill is 3.1 times larger, asserted at 3x |
| Upgrade bill vs 3-star mission surplus over car prices (754) | bill is far larger, so upgrades do not compete with the unlock path |
| Cheapest first step | 60 coins, about one 1-star daily and a half |

## Ceilings (why the Racer cannot improve power or brakes)

Ceilings are the largest values any stock roster car already passes the task 03 handling sanity suite
with: top speed 119 km/h, engine force 6.2 N per kg, brake force 12.8 N per kg, friction slip 3.3, side
stiffness 1.06 (the only value above the stock range, kept to a 6% total). A stock value above a ceiling
is never lowered.

## NOT RUN in this environment

- **The handling sanity suite at max upgrades** (`test/physics/roster-handling.test.ts`, now 108 tests: 6
  cars, stock and `+max`, 9 checks each) needs `@dimforge/rapier3d-compat`, which is not installed in the
  authoring environment, and `bun install` was not allowed. The ceilings above are chosen from values the
  stock roster already passes with, so a pass is expected, but it has not been observed. Pure tests prove
  the ceilings and that only overridable fields change.
- The session-level daily tests in `apps-games/city-drive/test/game/economy.test.ts` (autopilot on a real
  physics world) need Rapier and Babylon for the same reason.
- Component tests with happy-dom (`test/ui/dailyScreens.test.tsx`, the updated `screens.test.tsx`) need
  `preact` and `happy-dom`, also not installed here.
- Feel and balance on a phone: human checkpoint, see open question 21.
