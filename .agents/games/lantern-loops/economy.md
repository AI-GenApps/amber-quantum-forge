# Lantern Loops — economy

Owner decision 2026-10-23: no monetization in v1. No ads, no in-app purchases, no accounts, no
network calls. Everything below is earned by playing and lives in the local save. Hint tokens can
never be bought, which keeps room to add a purchase later without redesigning the loop.

## Currencies and counters

| Name | Kind | Start | Cap | Spendable |
|---|---|---|---|---|
| Stars | Progress (per puzzle best, 0 to 3) | 0 | 360 campaign maximum | No, they only unlock chapters |
| Hint tokens | Soft currency | 3 | 20 | Yes, 1 per hint |
| Streak freeze | Consumable | 1 in the first week | 1 | Auto-spent, see below |
| Daily streak | Counter | 0 | none | No |

## Stars

- A puzzle's stars come from hints used in the attempt that solved it: 0 hints = 3, 1 hint = 2,
  2 or more hints = 1. The best result per puzzle is kept. Restart keeps the hint count of the
  attempt (revealed tiles stay locked), so restarting cannot launder a star.
- Campaign maximum: 120 puzzles x 3 = 360.
- Daily and archive solves record stars the same way for statistics but do not count toward chapter
  unlocks (chapters stay a campaign-only measure).

### Chapter unlocks (total campaign stars)

| Chapter | Unlock at | Cumulative max before it |
|---|---|---|
| Harbor | open | 0 |
| Garden | 45 | 90 (Harbor) |
| Bridge | 120 | 180 (Harbor + Garden) |
| Sky | 210 | 270 (Harbor + Garden + Bridge) |

With no hints a player earns 3 stars per solve, so Garden needs 15 Harbor solves, Bridge needs 40
solves in total, Sky needs 70. Unlocks are one way: stars never drop, so a chapter never relocks.

## Hint tokens

### Sources

| Source | Tokens | Rule |
|---|---|---|
| Starting balance | 3 | Granted once on the first launch |
| Daily solved | +1 | Solving today's daily (once per date) |
| Daily solved with 0 hints | +1 more | Bonus on top of the +1, so at most 2 per daily |
| Streak milestone | +1 / +2 / +2 / +4 / +5 / +8 | At streak 3 / 7 / 14 / 30 / 60 / 100 days, once per streak run (a broken streak can earn them again) |
| Archive solve | +1 | First solve of an archived date with 0 hints; never repeated for that date |
| Chapter cleared | +5 | First time all 30 puzzles of a chapter are solved (any stars); 4 chapters = 20 total |

### Sink

| Sink | Tokens | Effect |
|---|---|---|
| Hint | 1 | Places and locks one correct tile (see `product.md`), costs one star tier |

Tokens above the cap of 20 are not granted; a toast says "Token jar is full". The balance never goes
below 0 and a hint with 0 tokens is refused (no negative balance, no debt).

### Balance sanity (design check)

A player who plays only the daily every day earns about 14 tokens a week plus milestones, far more
than a casual hint habit uses; the cap of 20 stops hoarding. A player who never plays the daily
keeps the starting 3 and earns 5 per cleared chapter, so hints are scarce but 3 stars never need
them. Hints exist to unstick the player, not to be required.

## Daily streak and freeze

- The streak counts consecutive local dates on which the daily was solved. Opening the app does not
  count; the solve does.
- Using the kit `streakStep(lastSolvedDate, today)` plus `daysBetween`:
  - same day: no change.
  - next day: streak + 1 on solve.
  - exactly one missed day (gap of 2 days): if a freeze is held it is spent automatically, the
    streak continues and goes + 1 on solve; the UI says "Freeze saved your streak".
  - any longer gap, or a missed day with no freeze: streak resets to 0 and goes to 1 on the next solve.
  - clock went back: ignore the change (no gain, no loss).
- **Freeze supply**: 1 per ISO week (Monday start, device time zone), cap 1. The profile stores the
  ISO week key of the last grant; on the first launch of a new week the freeze count becomes 1. An
  unused freeze does not stack. New installs start with 1 freeze.
- Best streak is stored for statistics. Streak medallion tiers (art slot `daily-medallion`, number
  drawn by code): 3, 7, 14, 30, 60, 100 days.

## What the economy deliberately avoids

No timers that gate play, no energy or lives, no loss states, no purchasable tokens, no ads for
tokens, no random rewards, no leaderboards, no FOMO beyond the soft streak (and the freeze
softens it).

## Save fields that hold these numbers

`stars` (map puzzleId to 0..3), `tokens`, `freezes`, `freezeWeek`, `streak`, `bestStreak`,
`lastDailyDate`, `milestonesGranted` (for the current run), `archiveRewarded` (date keys),
`chaptersCleared`. Defined in task 03 (`apps-games/lantern-loops/src/save/profile.ts`); mirrored here.
Also stored: `bestTimes` (seconds per puzzle), `dailiesSolved` (date key to best stars and fastest
seconds, daily and archive), `hintsUsed`, `playSeconds`, `onboardingDone`, and the game settings
`showTimer`, `showConflicts`, `hidePathInShare`, `brush`. Every number above is one exported constant
in `apps-games/lantern-loops-core/src/progress/` (`TOKEN_CONFIG`, `MILESTONES`, `STAR_UNLOCKS`,
`STARS_BY_HINTS`) and `test/progress/economy-sync.test.ts` reads the tables of this file and compares.
