# Floodplain Dispatch - economy

No monetization in v1 (owner decision 2026-10-23): no ads, no IAP, no accounts, no network. The
economy is a single soft currency plus star-gated unlocks, stored in the local save. It is shaped
so a coin pack or a "no hints needed" pass could be added later without rebalancing.

## Currencies and counters

| Name | Type | Spendable | Range | Notes |
|---|---|---|---|---|
| Stars | progress meter | no | 0 to 120 (campaign only) | Best stars per map summed; gates regions and themes. Daily stars never count. |
| Coins | soft currency | yes | 0 to unbounded (realistically below 1500) | Earned by clearing and improving; spent on hints and streak freezes. |
| Streak freezes | consumable | yes | 0 to 2 held | Cover missed daily days. |
| Piece budget | per-map allowance | n/a | per map | Not a currency: resets every attempt; see `content-plan.md` for par and budget per map. |

## Sources of coins

| Source | Amount | Frequency |
|---|---|---|
| Starting grant | 50 | once, on first launch |
| First clear of a campaign map (star 1) | 10 | once per map (40 maps, 400 total) |
| Each additional best star on a map (stars 1, 2, 3) | 5 per star | once per star per map (120 stars, 600 total) |
| Region completion bonus (all 10 maps cleared) | 50 | once per region (4 regions, 200 total) |
| Daily clear, best tier of the day | 10 (1 star), 15 (2 stars), 20 (3 stars) | per day; upgrading the tier pays the difference only |
| Daily streak bonus | 2 x min(streak, 7) = 2 to 14 | once per day, on the first daily clear that day |

Campaign total available: 50 + 400 + 600 + 200 = 1250 coins. Worked example: first clear at 3 stars
pays 10 + 15 = 25; a later 3-star rerun pays 0. Maximum daily income: 20 + 14 = 34 coins per day.
Replays never pay again, so there is nothing to farm.

## Sinks of coins

| Sink | Price | Rules |
|---|---|---|
| Hint (campaign map) | 25 | Reveals the next unplaced piece of the reference solution as a ghost; cannot be bought while a season is running; no star penalty. |
| Hint (daily map) | 40 | Same, using the solver's solution. |
| Streak freeze | 30 | Held up to 2. One freeze covers exactly one missed day and is consumed automatically on the next daily clear; a gap of N missed days needs N freezes or the streak resets. |

Themes are unlocked by stars, not coins (spec), so there are no coin cosmetics in v1.

## Unlock thresholds (stars)

| Unlock | Stars |
|---|---|
| Region: Delta | 12 |
| Region: Highland | 33 |
| Region: Estuary | 60 |
| Themes 2 to 7 | 9, 27, 48, 75, 100, 120 |

Star accounting: 40 maps x 3 stars = 120. Stars needed for the Estuary (60) are 67 percent of the
90 stars in the first three regions, which is intended to push players to improve on early maps.

## Balance targets

- A first-time player who 1-stars everything reaches Highland (33 stars) only after a few 2-star
  or 3-star improvements in Valley and Delta; a typical full campaign takes about 4 to 6 hours.
- Hints are affordable but not free: the starting 50 coins buy 2 campaign hints; clearing Valley
  once yields about 100 more coins.
- Daily income funds roughly one hint per two days at a 3-star clear.

## IAP room (not in v1)

Coin packs, a hint bundle and a themes pack would hook into the same `coins` field and a new
`purchases` array in the next save version. Nothing in v1 reads or writes a store SDK.

## Anti-cheat stance

Local save only, no server. Editing the save only affects the player's own game; the save store
validates shape and clamps (coins >= 0, stars 0 to 3, freezes 0 to 2) and recovers corrupt data
into a backup key.
