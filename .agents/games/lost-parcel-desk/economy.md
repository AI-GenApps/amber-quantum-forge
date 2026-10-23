# Lost Parcel Desk - economy

No monetization in v1 (owner decision 2026-10-23): no ads, no IAP, no accounts, no network. The economy
is one soft currency, **postage**, plus stamp-gated unlocks, stored in the local save. It is shaped so
a postage pack or a "free hints" pass could be added later without rebalancing.

## Currencies and counters

| Name | Type | Spendable | Range | Notes |
|---|---|---|---|---|
| Stamps | progress meter | no | 0 to 36 (campaign only) | Best stamps per case summed (1 to 3 per closed case); gates chapters and desk themes. Daily stamps never count. |
| Postage | soft currency | yes | 0 to unbounded (realistically below 600) | Earned by closing cases and improving; spent on hints and streak freezes. |
| Streak freezes | consumable | yes | 0 to 2 held | Cover missed daily days. |

## Sources of postage

| Source | Amount | Frequency |
|---|---|---|
| Starting grant | 30 | once, on first launch |
| First close of a campaign case (0 to at least 1 stamp) | 10 | once per case (12 cases, 120 total) |
| Each stamp above the previous best on a case (stamps 1, 2, 3) | 5 per stamp | once per stamp per case (36 stamps, 180 total) |
| Chapter bonus (all 4 cases of a chapter closed) | 40 | once per chapter (3 chapters, 120 total) |
| Daily Parcel, best tier of the day | 5 (1 stamp), 7 (2 stamps), 10 (3 stamps) | per day; upgrading the tier pays the difference only |
| Daily streak bonus | 2 x min(streak, 7) = 2 to 14 | once per day, on the first daily clear that day |

Campaign total available: 30 + 120 + 180 + 120 = **450 postage**. Worked example: first close at 3
stamps pays 10 + 15 = 25; a later 3-stamp replay pays 0. Maximum per case 25, so 12 x 25 = 300 from
cases. Maximum daily income: 10 + 14 = 24 postage per day. Replays never pay again, so there is nothing
to farm. Achievements pay nothing (badges only).

## Sinks of postage

| Sink | Price | Rules |
|---|---|---|
| Hint (campaign case) | 20 | Reveals the next unresolved deduction as correct links (a "clue link"); at most 2 per case; no stamp penalty. |
| Hint (daily case) | 15 | Same, using the generated case's deductions. |
| Streak freeze | 30 | Held up to 2. One freeze covers exactly one missed day and is consumed automatically on the next daily clear; a gap of N missed days needs N freezes or the streak resets. |

Desk themes are unlocked by stamps, not postage, so there are no postage cosmetics in v1.

## Rules (spec for task 03, core `progress/`)

- Campaign: a result pays `10` only when a case goes from 0 to at least 1 stamp, plus `5` for every
  stamp above the previous best (first close at 3 stamps: 10 + 15 = 25; 1 to 3 stamps later: 10; repeats
  and lower results: 0). The chapter bonus (40) is paid in the same update that closes the fourth
  case of a chapter, once, and is stored in `chapterBonusClaimed`. A perfect campaign played in order
  pays exactly 450 postage including the grant (tested).
- Daily: a result changes nothing unless it has at least 1 stamp. The first clear of a date pays the
  tier (5 / 7 / 10) and the streak bonus `2 x min(streak, 7)` using the streak after that day's update;
  a better tier on the same date pays only the difference and no second bonus. A device clock that
  moved back (`clock-went-back`) is neutral: no postage, no streak change, no result stored.
- Streak freezes: bought one at a time up to 2. On a gap the app passes the number of missed days; if
  the held freezes cover every missed day they are consumed (one per day) and the streak continues;
  otherwise the streak restarts at 1 and no freeze is consumed.
- Hints and freezes are rejected (profile unchanged) when postage is short; a hint never touches
  stamps. A hint on a deduction that is already resolved is rejected without charge.
  A hint request is validated before it is priced: a closed case, nothing left to hint or the 2-hint
  limit are refused first, then a short purse (`INSUFFICIENT_POSTAGE`); a third freeze is refused
  (`FREEZES_FULL`) before the price is checked. Rejections never change the profile.
- Stamp accounting is campaign only: daily stamps are stored in `daily.results` and never reach
  `cases`, the 36 total, chapter unlocks or desk themes.
- Achievements pay nothing. Clean Sheet, Unaided and Sharp Eyes can also be earned on a Daily Parcel;
  Second Look needs a campaign replay that raises the best stamps.
- Save: the profile is clamped and stripped on every load (`sanitizeProfile`). A selected theme the
  stamps have not unlocked falls back to the default theme.

## Unlock thresholds (stamps)

| Unlock | Stamps |
|---|---|
| Chapter 2: Rain on the Sorting Room | 7 (and case 04 closed) |
| Chapter 3: The Last Sack | 18 (and case 08 closed) |
| Desk themes 2 to 5 | 6, 14, 24, 33 |

Star accounting: 12 cases x 3 stamps = 36. Chapter 2 needs 7 of the 12 stamps available in chapter 1
(58 percent); chapter 3 needs 18 of the 24 in chapters 1 and 2 (75 percent), which pushes players to
replay early cases for a third stamp.

## Balance targets

- A first playthrough of the 12 cases is about 70 to 90 minutes; reaching 36 stamps with replays about
  2 to 3 hours.
- A player who takes 2 stamps on every case has 16 stamps after chapter 2 and needs two more (one or
  two replays) for chapter 3; a player who takes 1 stamp on every case has 8 and must raise 10 stamps
  by replaying (at least five cases). Chapter 2 needs 7 of the first 8 stamps a 2-stamp player earns.
- The 30 starting postage buys one hint; closing case 01 once pays 15 to 25, so a second hint is
  affordable after the first case.
- Daily income at a 3-stamp clear (10 + streak bonus) funds roughly one hint every two days.

## IAP room (not in v1)

Postage packs, a hint bundle and extra desk themes would hook into the same `postage` field and a new
`purchases` array in the next save version. Nothing in v1 reads or writes a store SDK.

## Anti-cheat stance

Local save only, no server. Editing the save only affects the player's own game; the save store
validates shape and clamps (postage >= 0, stamps 0 to 3 per case, freezes 0 to 2) and recovers corrupt
data into a backup key.
