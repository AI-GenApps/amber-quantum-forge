# Dress Rehearsal - economy

No monetization in v1 (owner decision 2026-10-23): no ads, no IAP, no accounts, no network. The
economy is one soft currency plus star-gated chapters, stored in the local save. It is shaped so a
coin pack or a "no hints needed" pass could be added later without rebalancing. The dollar prices
on garments are in-fiction budget numbers for the `max-spend` and `min-spend` rules; they are not
a currency and nothing is ever bought with them.

## Currencies and counters

| Name | Type | Spendable | Range | Notes |
|---|---|---|---|---|
| Stars | progress meter | no | 0 to 120 (campaign only) | Best stars per challenge summed; gates chapters (and with them the closet). Daily stars never count. |
| Coins | soft currency | yes | 0 to unbounded (realistically below 1700) | Earned by clearing, improving, chapter completion and client affinity; spent on hints, streak freezes and export frames. |
| Streak freezes | consumable | yes | 0 to 2 held | Cover missed Daily Fitting days. |
| Affinity | per-client meter | no | levels 0 to 3 per client | Stars on that client's challenges; thresholds 3, 9, 15; each level pays coins and shows a new line. |
| Closet pieces | collection | no | 16 at start, 48 at the end | A chapter's 8 pieces join the closet when the chapter unlocks. |
| Frames | cosmetic unlock | one-time buy | 1 free, 3 bought | Export frames: Plain (free), Paper Border, Polaroid, Magazine Cover. |

## Sources of coins

| Source | Amount | Frequency |
|---|---|---|
| Starting grant | 40 | once, on first launch |
| First clear of a campaign challenge (star 1) | 10 | once per challenge (40 challenges, 400 total) |
| Each additional best star on a challenge (stars 1, 2, 3) | 5 per star | once per star per challenge (120 stars, 600 total) |
| Chapter completion bonus (all challenges of the chapter cleared) | 40 | once per chapter (6 chapters, 240 total) |
| Client affinity level reached (levels 1, 2, 3) | 10 per level | once per level per client (6 clients x 3 levels = 18 levels, 180 total) |
| Daily clear, best tier of the day | 8 (1 star), 12 (2 stars), 16 (3 stars) | per day; upgrading the tier pays the difference only |
| Daily streak bonus | 2 x min(streak, 7) = 2 to 14 | once per day, on the first Daily clear that day |

Campaign total available: 40 + 400 + 600 + 240 + 180 = 1460 coins. Worked example: first clear at
3 stars pays 10 + 15 = 25; a later 3-star replay pays 0. Maximum daily income: 16 + 14 = 30 coins
per day. Replays never pay again, so there is nothing to farm.

Affinity thresholds are reachable: the client with the fewest challenges has 6 (18 stars), and
level 3 needs 15 stars. Challenges per client: Mireille Vasseur 7, Tobias Okafor 7, Dame Ottoline
Frost 7, Priya Raman 7, Jun Aoki 6, Edie Lindqvist 6 (40 in total).

## Sinks of coins

| Sink | Price | Rules |
|---|---|---|
| Hint (campaign challenge) | 20 | Reveals one piece of a three-star look (closet item glows, slot pulses); not placed for you; no star penalty. |
| Hint (Daily Fitting) | 30 | Same, using the solver and the stored reference look. |
| Streak freeze | 25 | Held up to 2. One freeze covers exactly one missed day and is consumed automatically on the next Daily clear; a gap of N missed days needs N freezes or the streak resets. |
| Frame: Paper Border | 30 | One-time unlock for the export image. |
| Frame: Polaroid | 40 | One-time unlock. |
| Frame: Magazine Cover | 60 | One-time unlock. |

Frames total 130 coins. Chapters are unlocked by stars, not coins (spec), so there is no coin
shortcut to content. Plain is always available.

## Rules to implement (task 03, core `progress/`)

- Campaign: a result pays `10` only when the challenge goes from 0 to at least 1 star, plus `5`
  for every star above the previous best (first clear at 3 stars: 10 + 15 = 25; 1 to 3 stars
  later: 10; repeats and lower results: 0). The chapter bonus (40) is paid in the same update that
  clears the last challenge of a chapter, once, and is stored in `chapterBonusClaimed`.
- Affinity: levels are derived from the best stars per client. When a result raises a client over a
  threshold, each newly reached level pays 10 once (stored in `affinityPaid[clientId]`, the highest
  level paid), and the new line unlocks.
- Daily: a result with 0 stars changes nothing. The first clear of a date pays the tier (8 / 12 /
  16) and the streak bonus `2 x min(streak, 7)` using the streak after that day's update; a
  better tier on the same date pays only the difference and no second bonus. A device clock that
  moved back (`clock-went-back`) is neutral: no coins, no streak change, no result stored.
- Streak freezes: bought one at a time up to 2. On a gap the app passes the number of missed days;
  if the held freezes cover every missed day they are consumed (one per day) and the streak
  continues; otherwise the streak restarts at 1 and no freeze is consumed.
- Hints, freezes and frames are rejected (profile unchanged) when coins are short. The "no hint on
  the result sheet" rule is a screen rule (task 04).
- Chapter unlock thresholds: Gala Night 12, Mountain Weekend 27, Studio Avant-garde 45, Vintage 70s
  66 stars; Riviera Summer and Rainy City are open from the start.
- Save: the profile is clamped and stripped on every load (`sanitizeProfile`). A selected frame the
  player does not own falls back to Plain. A perfect campaign replay in order pays exactly 1460
  coins including the grant (tested).

## Future (not v1)

A coin pack or an unlimited-hints pass would fit the same counters without rebalancing: the campaign
pays 1460 coins, and the fixed sinks are 130 in frames plus hints and freezes by choice.
