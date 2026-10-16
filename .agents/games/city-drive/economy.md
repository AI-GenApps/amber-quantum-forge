# City Drive — economy

## v1 decision (2026-10-15, user)

**Coins and car unlocks only. No real money.** No ads (no rewarded, no
interstitial, no banner), no in-app purchases, no accounts, no network. Coins
are a soft currency earned from missions and spent on unlocking cars. Nothing
can be bought with real money and nothing has to be watched.

## v1 loop

| Step | Detail |
|---|---|
| Earn | Completing a mission pays coins. The payout scales with the stars earned (1 to 3). Exact payouts: see *Payout rules* and the table below (task 12) |
| Spend | Coins unlock cars from a fixed roster. Prices and roster: see *Car roster* below (task 12) |
| Gate | Districts unlock by total stars, not by coins. Star thresholds: 0, 10 and 24 stars (`progression.json`, task 11) |
| Save | Local only, versioned with migrations (task 12). Uninstalling deletes it. |

Numbers in this file are final for v1 as of task 12. Change `cars.json` or a mission's
`reward_coins` and the economy tests tell you which table here to refresh
(`bun run --filter @city-drive/core economy:report` prints them).

## Payout rules (task 12)

All logic is pure TypeScript in `@city-drive/core/src/economy/`.

| Situation | Coins |
|---|---|
| First clear | `reward_coins[stars]` for the stars earned |
| Replay, better stars than the best so far | `reward_coins[new] - reward_coins[best]`, plus the replay bonus |
| Replay, same or fewer stars | the replay bonus only |
| Failed or quit mission | 0 |
| Free-roam driving | 0 (no grinding) |

The replay bonus is 10% of the mission's 1-star reward, rounded. Coins are paid the moment a
mission ends (not when the results screen closes), so leaving the app on the results screen loses
nothing. A balance can never go below zero, a car cannot be bought twice, and only owned cars can be
selected.

## Car roster (task 12)

The starter `sedan` is free. Prices rise with the unlock order; handling differences come only from
`content/cars.json` overrides of the baseline `CarSpec` (mass, engine, brakes, steering and grip; the
wheel layout is shared so every Kenney model fits). Every car passes the task 03 handling sanity
suite (`test/physics/roster-handling.test.ts`).

| id | model | name | price | mass kg | engine N | top km/h | brake N | steer rad | grip |
|---|---|---|---|---|---|---|---|---|---|
| `sedan` | `car-sedan` | City Sedan | 0 | 1200 | 6000 | 115 | 12000 | 0.5 | 2.6 |
| `hatch` | `car-hatchback-sports` | Sprint Hatch | 400 | 1050 | 6000 | 112 | 12000 | 0.55 | 2.8 |
| `suv` | `car-suv` | Trail SUV | 700 | 1500 | 7600 | 108 | 14500 | 0.46 | 3 |
| `patrol` | `car-police` | Patrol | 900 | 1300 | 7000 | 118 | 14000 | 0.5 | 2.8 |
| `cab` | `car-taxi` | City Cab | 1000 | 1250 | 7200 | 114 | 13500 | 0.5 | 3 |
| `racer` | `car-race` | Apex Racer | 1200 | 1000 | 6200 | 119 | 12800 | 0.55 | 3.2 |

### Mission payouts

| mission | type | 1 star | 2 stars | 3 stars | replay bonus |
|---|---|---|---|---|---|
| `d1-m01` | delivery | 40 | 64 | 96 | 4 |
| `d1-m02` | taxi | 44 | 70 | 106 | 4 |
| `d1-m03` | parking | 48 | 77 | 115 | 5 |
| `d1-m04` | time_trial | 52 | 83 | 125 | 5 |
| `d1-m05` | delivery | 56 | 90 | 134 | 6 |
| `d1-m06` | parking | 60 | 96 | 144 | 6 |
| `d1-m07` | taxi | 64 | 102 | 154 | 6 |
| `d1-m08` | time_trial | 68 | 109 | 163 | 7 |
| `d2-m01` | delivery | 72 | 115 | 173 | 7 |
| `d2-m02` | taxi | 76 | 122 | 182 | 8 |
| `d2-m03` | time_trial | 80 | 128 | 192 | 8 |
| `d2-m04` | parking | 84 | 134 | 202 | 8 |
| `d2-m05` | delivery | 88 | 141 | 211 | 9 |
| `d2-m06` | taxi | 92 | 147 | 221 | 9 |
| `d2-m07` | time_trial | 96 | 154 | 230 | 10 |
| `d2-m08` | parking | 100 | 160 | 240 | 10 |
| `d3-m01` | delivery | 104 | 166 | 250 | 10 |
| `d3-m02` | taxi | 108 | 173 | 259 | 11 |
| `d3-m03` | time_trial | 112 | 179 | 269 | 11 |
| `d3-m04` | taxi | 116 | 186 | 278 | 12 |
| `d3-m05` | delivery | 120 | 192 | 288 | 12 |
| `d3-m06` | parking | 124 | 198 | 298 | 12 |
| `d3-m07` | time_trial | 128 | 205 | 307 | 13 |
| `d3-m08` | parking | 132 | 211 | 317 | 13 |

### Totals

| district | 1 star | 2 stars | 3 stars |
|---|---|---|---|
| district-1 | 432 | 691 | 1037 |
| district-2 | 688 | 1101 | 1651 |
| district-3 | 944 | 1510 | 2266 |
| all | 2064 | 3302 | 4954 |

Total car prices: 4200. 3-star total / prices = 1.180 (needs >= 1.150).

### Simulation: every mission at 1 star(s), once, buying the cheapest cars after each district

| district | earned | bought | coins left | cars owned (paid) | total stars |
|---|---|---|---|---|---|
| district-1 | 432 | hatch | 32 | 1 | 8 |
| district-2 | 688 | suv | 20 | 2 | 16 |
| district-3 | 944 | patrol | 64 | 3 | 24 |

### Simulation: every mission at 2 star(s), once, buying the cheapest cars after each district

| district | earned | bought | coins left | cars owned (paid) | total stars |
|---|---|---|---|---|---|
| district-1 | 691 | hatch | 291 | 1 | 16 |
| district-2 | 1101 | suv | 692 | 2 | 32 |
| district-3 | 1510 | patrol, cab | 302 | 4 | 48 |

### Simulation: every mission at 3 star(s), once, buying the cheapest cars after each district

| district | earned | bought | coins left | cars owned (paid) | total stars |
|---|---|---|---|---|---|
| district-1 | 1037 | hatch | 637 | 1 | 24 |
| district-2 | 1651 | suv, patrol | 688 | 3 | 48 |
| district-3 | 2266 | cab, racer | 754 | 5 | 72 |

### Affordability (proven by `test/economy/affordability.test.ts`)

- 3-starring everything pays 4954 coins against 4200 coins of car prices: an 18.0% surplus (rule: at
  least 15%).
- A player averaging 2 stars buys about one new car per district (1, 2, then 4 cars after districts
  1, 2, 3) and cannot afford the whole roster without 3-star replays.
- A player averaging 1 star reaches 8, 16 and 24 stars after the three districts; the 10-star gate
  of district 2 needs a few replays at higher stars (they pay the upgrade difference).

## Save (task 12)

Local only. Capacitor Preferences on a device, browser local storage on the web (`Capacitor.isNativePlatform()`
decides). `SaveData v1` holds coins, owned cars, the selected car, best stars and best time per
mission, settings (audio, haptics, control layout, graphics quality), onboarding flags and
`schema_version`. Writes are debounced (500 ms) and atomic: the new copy goes to a pending key, the
last good copy to a backup key, then the main key is replaced and the pending key removed. Loading
tries main, then pending, then backup, then defaults; a damaged main file is kept under a `.corrupt`
key, and the player sees a non-blocking notice. `migrations[n]` turns version n into n+1.

## Anti-tamper (task 12 decision)

**None in v1.** The game is offline, has no real money, no leaderboards and no server. A player who
edits their own save only changes their own game. Revisit if cloud save, leaderboards or any paid
item is ever added.

## Deferred (v1.1+), explicitly out of scope for this epic

| Idea | Why it is out of scope |
|---|---|
| Rewarded ads for payout multipliers | Needs an ad SDK (AdMob), consent flow, and data-safety changes. The epic ships a clean offline game first. |
| One-time ad-free IAP | Pointless until ads exist. Needs RevenueCat or native billing and store provisioning. |
| Daily challenges, login streaks | Retention levers, but they need a clock/anti-cheat story. Candidates for v1.1. |
| Car customization (paint, wheels) | Retention lever; needs more art and UI. v1.1 candidate. |

**Rationale (CrazyGames driving-genre guidance, 2026-10-15):** the driving genre
averages about 8.7 minutes of playtime and about 5.7% day-1 retention, and the
guidance ties monetization to rewarded placements after the player has
invested time. With that short session length, v1 spends its effort on the
retention drivers that need no ad stack (missions/career and car unlocks)
and keeps ads and IAP for later. Source:
docs.crazygames.com/resources/monetizing-driving/. Competitors all ship ads and
IAP (see `decisions-log.md`), so "no ads, no IAP, offline" is also the
store-listing differentiator.
