---
title: Ludo Vortex economy
description: Approved v1 economy design for the Ludo (Vortex) client — currencies, progression, coin tables, store, IAP, ads, and the server-authoritative wallet policy.
---

Approved by the user on 2026-09-25. Research/provenance:
`.agents/resources/2026-09-25/ludo-vortex-economy/research.md` section 6.
Summary tracker (kept in sync with this doc): `.agents/games/ludo-vortex/economy.md`.
Implementing tasks: 15-ludo-launch/26a–26i.

Every number below lives in exactly one place in code:
`packages/api/src/games/ludo/economy-config.ts`
(`LUDO_ECONOMY_CONFIG_V1`, `version: 1`). No later task hardcodes a number
independently — it reads `getEconomyConfig(version?)`.

## Policy: coins and diamonds are never cashable

Coins and diamonds are virtual currency only. There is no withdrawal,
cash-out, or peer-to-peer transfer path for either currency, and none is
ever added. This mirrors Ludo King's own stated policy ("Coins and diamonds
in the games are virtual currency and they cannot be converted into real
money by any means" — ludoking.com/faq) and keeps Ludo Vortex out of
real-money-gaming territory. Task 26i expands this into the store
compliance docs; this section is the one-sentence policy statement that no
code path may contradict.

## Currencies

| Currency | Type | Earned via | Spent on |
|---|---|---|---|
| Coins | Soft | Online match wins, coin-table free-play wins, daily login, rewarded ads, level-ups, one-time starter grant | Coin-table entries, standard dice/token theme purchases |
| Diamonds | Premium | IAP, day-7 daily login bonus, rewarded ads (rarer unit), every-5th-level bonus | Premium dice/token theme purchases, board themes (diamond-only), Vortex Pass |

**Coins are online-only.** No coins are ever granted for offline play
(vs-computer or pass-and-play), including on a win. This differs from XP —
see Progression below.

### Starting balance

One-time, server-granted, idempotent (`reason: starter_grant`), on first
login: **5,000 coins, 20 diamonds**, plus the free "Default" item already
unlocked in each of the three theme categories (no grant needed — Default
items have no price and are always owned).

## Sources & sinks

| Source | Amount | Cap |
|---|---|---|
| Starter grant (one-time) | 5,000 coins + 20 diamonds | once ever |
| Daily login, day 1–6 | 200 / 250 / 300 / 350 / 400 / 500 coins | once/day |
| Daily login, day 7 (streak reset) | 750 coins + 5 diamonds | once/week |
| Rewarded ad (coins) | 100 coins | 5/day |
| Rewarded ad (diamonds) | 5 diamonds | 2/day |
| Online coin-stake match win | see Coin tables below | per match |
| Online free-play match win (no stake) | 50 coins flat | 10/day (anti-farm) |
| Level-up bonus | `100 × new level` coins | per level |
| Level-up diamond bonus | 10 diamonds | every 5th level |
| Level-up free theme | 1 item from a rotating pool | every 10th level |
| Vortex Pass daily-reward bonus | +50% of the daily reward above | while subscribed |
| XP, any mode (vs-computer, pass-and-play, online) | see Progression | daily-capped offline |

| Sink | Cost |
|---|---|
| Coin-stake match entry (Low) | 500 coins |
| Coin-stake match entry (Mid) | 2,000 coins |
| Coin-stake match entry (High) | 10,000 coins |
| Dice theme (standard, 6 total, 5 paid) | 1,500 coins or 30 diamonds each |
| Token theme (standard, 4 total, 3 paid) | 2,500 coins or 50 diamonds each |
| Board theme (premium, 3 total, 2 paid) | 80 diamonds each (diamond-only, no coin price) |

## Progression (XP and levels)

**XP is earned in every mode** — vs-computer, pass-and-play, and online —
unlike coins, which are online-only. This is a deliberate correction to
research.md section 4's "no offline rewards" recommendation, scoped to XP
only (see "What changed" below).

- **Online XP** is credited immediately, server-side, on match completion —
  the server already authored the match result, so no replay check is
  needed.
- **Offline XP** (vs-computer, pass-and-play) is accumulated locally by the
  client as a pending-XP count per session, then claimed through a server
  endpoint (task 26b). The claim endpoint applies:
  1. A **daily cap** — `offlineDailyXpCap` = 2,000 XP/day (≈14 match-wins'
     worth at the base win rate below; generous enough not to frustrate a
     genuine heavy offline player, tight enough that a client bug or
     tampering cannot mint unbounded XP).
  2. A **replay-sanity check** — offline XP claimed cannot exceed what a
     plausible number of completed matches in the elapsed wall-clock time
     since the last claim could produce (a Ludo match takes meaningfully
     more than a few seconds; the server rejects a claim that implies an
     impossible match-completion rate).
- **Per-match XP**: 100 XP for a win, 40 XP for a loss, in any mode.

### XP curve

Formula: **`xp_required(level) = 100 * level^1.6`, rounded to the nearest
10.** Implemented as a function (`xpRequiredForLevel`), not a lookup table,
so it can be verified against the formula directly.

| Level | XP to next |
|---|---|
| 1 | 100 |
| 2 | 300 |
| 3 | 580 |
| 4 | 920 |
| 5 | 1,310 |
| 6 | 1,760 |
| 7 | 2,250 |
| 8 | 2,790 |
| 9 | 3,360 |
| 10 | 3,980 |
| 15 | 7,620 |
| 20 | 12,070 |
| 25 | 17,250 |
| 30 | 23,090 |
| 40 | 36,580 |
| 50 | 52,280 |

Level-up rewards: `100 × new level` coins every level; +10 diamonds every
5th level; one free theme item from a rotating pool every 10th level.

> **Note on level 40**: task 26a's own reference list states 36,590 for
> level 40. The formula itself (`100 * 40^1.6 = 36,584.40...`) rounds to
> **36,580**, not 36,590 — every other reference value in the task,
> including the immediate neighbors at levels 30 and 50, matches the
> formula exactly, so this one value is a transcription typo in the task
> file. `economy-config.test.ts` trusts the formula (per the acceptance
> criteria, "matches the formula... for every reference level") and
> documents the discrepancy rather than hand-fitting the table to a value
> the formula itself doesn't produce.

## Daily reward calendar

7-day streak, resets to day 1 when broken (a claim gap of more than one
UTC day resets `streakDay`).

| Day | Coins | Diamonds |
|---|---|---|
| 1 | 200 | — |
| 2 | 250 | — |
| 3 | 300 | — |
| 4 | 350 | — |
| 5 | 400 | — |
| 6 | 500 | — |
| 7 | 750 | 5 |

Vortex Pass subscribers get +50% on every day's coin/diamond amount above.

## Rewarded ads

AdMob, Google UMP consent, server-side verification (SSV) required before
any grant — never trust a client-reported ad completion.

| Reward | Amount | Daily cap |
|---|---|---|
| Coins | 100 | 5 ads/day (500 coins/day max) |
| Diamonds | 5 | 2 ads/day (10 diamonds/day max) |

No interstitial or banner ads anywhere — rewarded-only, opt-in.

## Online coin-stake tables

5% rake on every tier. Percentages below apply to the **gross pot**
(`entryFee × playerCount`), with the rake netted out separately — not to
the pot remaining after rake. Field names in
`economy-config.ts`'s `LudoCoinTableTierConfig` say so explicitly
(`rakePercentOfGrossPot`, `twoPlayerWinnerPercentOfGrossPot`,
`fourPlayerFirstPlacePercentOfGrossPot`,
`fourPlayerSecondPlacePercentOfGrossPot`) so a later task cannot
misinterpret which base the percentages are taken from. For every tier and
player count, the relevant percentages plus the rake sum to exactly 100.

| Tier | Entry fee | 2p: winner gets | 4p: 1st / 2nd get | Gross pot (4p) |
|---|---|---|---|---|
| Low | 500 | 950 | 1,400 / 500 | 2,000 |
| Mid | 2,000 | 3,800 | 5,600 / 2,000 | 8,000 |
| High | 10,000 | 19,000 | 28,000 / 10,000 | 40,000 |

Entry fees are escrowed (`ludo_coin_table_escrow`) at match start and
refunded in full if the match aborts before completion (task 26c). No
coins ever move directly between players' balances outside this
escrow-then-settle flow.

## Store — cosmetics

| Type | Items | Price (non-Default) |
|---|---|---|
| Dice themes (6 total) | Default (free), Classic Wood, Neon Vortex, Marble, Galaxy, Gold | 1,500 coins or 30 diamonds |
| Token themes (4 total) | Default (free), Gem Tokens, Robot Tokens, Animal Tokens | 2,500 coins or 50 diamonds |
| Board themes (3 total) | Default (free), Cosmic Board, Royal Board | 80 diamonds (diamond-only, no coin price) |

## In-app purchases (RevenueCat → Google Play Billing now, StoreKit later)

**No Apple Pay for digital goods** — iOS uses Apple In-App Purchase
(StoreKit) exclusively when that platform ships.

| Product | Contents | INR | USD |
|---|---|---|---|
| Starter Pack (one-time) | 3,000 coins + 30 diamonds | ₹49 | $0.99 |
| Coins — Small | 5,500 coins | ₹99 | $1.99 |
| Coins — Medium | 30,000 coins | ₹399 | $4.99 |
| Coins — Large | 110,000 coins | ₹1,499 | $17.99 |
| Diamonds — Small | 100 diamonds | ₹149 | $2.99 |
| Diamonds — Medium | 600 diamonds | ₹699 | $8.99 |
| Diamonds — Large | 1,600 diamonds | ₹1,699 | $19.99 |
| Vortex Pass (monthly subscription) | +50% daily reward, 1 free theme/month, exclusive dice skin | ₹199/mo | $3.99/mo |

**There is no "Remove Ads" product.** Ludo Vortex is rewarded-ads-only
already (no interstitials/banners to begin with), so there is nothing to
remove — this product is dropped from the catalog entirely, not merely
priced at zero. Final product IDs are recorded in task 26i.

## Vortex Pass (monthly subscription)

- +50% on every daily-reward-calendar payout.
- 1 free theme item per month, from the rotating pool.
- An exclusive dice skin, available only while subscribed.
- ₹199/mo / $3.99/mo.

## Anti-abuse

Idempotency keys on every grant (ledger `idempotencyKey`, ad claims'
`adTransactionId`), per-day caps (offline XP, rewarded ads, daily login),
server timestamps for every date/streak computation (never client clock),
and RevenueCat-webhook-driven revocation for refunded/charged-back IAPs
(task 26d).

## Config versioning

Every number above lives in `LUDO_ECONOMY_CONFIG_V1` (`version: 1`) in
`packages/api/src/games/ludo/economy-config.ts`, read through
`getEconomyConfig(version?)` — defaulting to latest, but able to return a
specific historical version. A match pins the config version it started
under in `ludo_matches.economy_config_version` (and a coin-stake match's
escrow row separately records the `tier`/`pot`/`rake` it was created
with), so bumping the config mid-flight cannot change the stakes or
payouts of a match already in progress.

## What changed vs. research.md section 6

Corrections made in task 26a to research.md section 6's proposed numbers
(binding, per the task's own Context/Decisions):

1. **XP in every mode, daily-capped.** research.md section 4 recommended no
   offline rewards at all; that recommendation is overridden for XP only —
   coins remain online-only. Offline XP is capped at 2,000/day and goes
   through a server claim endpoint with a replay-sanity check (task 26b).
2. **Coins strictly online-only.** research.md's sources/sinks table
   already implied this ("Offline vs-computer win: none in v1") but did not
   state it as a hard rule; this doc makes it explicit and the config has
   no code path that could grant coins for an offline match.
3. **4-player coin-table split is 70%/25%(/5% rake) of the gross pot**,
   not research.md's "winner-take-most" placeholder (research.md section 6
   explicitly flagged the 4-player split as "a product decision to
   finalize"). The percentages are defined against the gross pot with the
   rake netted out separately, and the config's field names say so.
4. **No "Remove Ads" product.** research.md section 6 listed a ₹149/$2.99
   one-time "Remove Ads" IAP; it is dropped entirely, since this repo
   already ships rewarded-ads-only with no interstitials to remove.
5. **XP curve recomputed from the stated formula.** research.md section
   6's XP table ("1→2: 100, 2→3: 240, 5→6: 660, 10→11: 1,590, 20→21:
   4,830, 50→51: 21,000") lists **per-level deltas** from an uncredited
   curve that does not match `100 * level^1.6` rounded to the nearest 10 —
   it was not recomputed from the stated formula. This doc's table above
   instead gives **cumulative XP required to reach each level**, computed
   directly from the formula and verified in
   `economy-config.test.ts` (see also the level-40 rounding note above,
   which is a typo in task 26a's own reference list, not in research.md).
6. **Theme catalog counts pinned exactly**: 6 dice / 4 token / 3 board,
   as research.md section 6 already specified — reaffirmed here since nothing
   in this doc may drift from those counts without a task update.
