# The Last Window - economy

One soft currency, coins, plus friendship points (FP) as a per-regular counter. No real-money
purchases, no ads, no energy, no timers between sessions. Numbers are identical in `product.md` and
the task files; the economy tests in task 03 assert this file row by row.

## Currencies and counters

| Name | Kind | Start | Cap | Notes |
|---|---|---|---|---|
| Coins | currency | 30 | none (display caps at 99,999) | Earned in shifts and scenes, spent on stock and decor |
| Friendship points (FP) | per-regular counter | 0 | 8 per regular | Levels from thresholds `[1, 2, 4, 6, 8]`; never spent |
| Stars (closing grade) | per-shift record | 0 | 3 per day | Cosmetic and share text; never gates content |
| Late Shift streak | counter | 0 | none (bonus capped at 7) | Consecutive local dates with a Late Shift |

## Sources of coins

| Source | Amount | Frequency |
|---|---|---|
| Starting grant | 30 | once |
| Item payment | item price (substitute half rounded down, minimum 1; wrong-mood book 1) | each delivered requested item |
| Tip | 40 percent (delighted) or 15 percent (satisfied) of the order payment, rounded up; +10 points with Brass Gramophone | each served order |
| Closing bonus | 5 / 10 / 20 for 1 / 2 / 3 stars | each completed shift, campaign or Late |
| Scene gift | 5 for scenes 1 to 4, 15 for scene 5 | each scene, first time only (replays pay 0) |
| Lamp Bonus | 15 | first Late Shift of each local date |
| Streak bonus | 2 x min(streak, 7) | first Late Shift of each local date, streak counted after step |

Item prices: drinks 4, 5, 4, 5, 5, 6 (sum 29); pastries 3, 4, 5, 4, 5 (sum 21); books 6, 6, 7, 7, 7
(sum 33). Decor can raise them: Potted Rosemary +1 per drink, Brass Reading Lamp +2 per book.

Fixed (non-shift) campaign income: scene gifts `8 x (4 x 5 + 15) = 280`; maximum closing bonuses
`14 x 20 = 280`; starting grant 30.

## Sinks of coins

| Sink | Price | Notes |
|---|---|---|
| Pastry stock | per portion: Salted Butter Roll 1, Cinnamon Knot 1, Pear Tart 2, Lemon Cream Bun 1, Ginger Loaf 2; 5 portions per kind per day | bought up front in Stock plan; leftovers lost |
| Decor | 8 items, total 1,200 | table below; permanent |

Books and drinks cost nothing to stock. There is no repair, rent or mandatory fee. Coins never go
below 0: the stock plan screen disables pastry kinds the player cannot afford, and an empty pastry
shelf is legal (orders then carry no pastry component at all, see `product.md`). The maximum daily stock bill is
`5 x (2 + 2 + 1 + 1) = 30` coins with four kinds (cake stand) and `5 x (2 + 2 + 1) = 25` with three.

## Decor (8)

| Id | Item | Price | Unlock day | Effect (exactly one) | Slot id |
|---|---|---|---|---|---|
| `decor-1` | Window Seat Cushions | 80 | 2 | +4 s patience for every customer | `decor-1` |
| `decor-2` | Brass Reading Lamp | 110 | 3 | +2 coins on every book sold | `decor-2` |
| `decor-3` | Potted Rosemary | 90 | 4 | +1 coin on every drink sold | `decor-3` |
| `decor-4` | Glass Cake Stand | 180 | 4 | +1 pastry shelf kind (3 to 4) | `decor-4` |
| `decor-5` | Rolling Library Ladder | 200 | 5 | +1 book shelf slot (3 to 4) | `decor-5` |
| `decor-6` | Harbour Chart Frame | 140 | 6 | +1 FP when a serve is delighted (max 3 per serve) | `decor-6` |
| `decor-7` | Rain Chime | 150 | 7 | +8 s patience in rain shifts only | `decor-7` |
| `decor-8` | Brass Gramophone | 250 | 9 | +10 points on tip percentages (50 / 25) | `decor-8` |

Total 1,200. Unlock day means the item appears in the Shop at the start of that day; buying any time
after is allowed. Late Shifts show all items.

## Friendship

| Serve outcome | FP |
|---|---|
| delighted | +2 (+1 with Harbour Chart Frame, max 3) |
| satisfied | +1 |
| disappointed or left | 0 |

Thresholds `[1, 2, 4, 6, 8]` give levels 1 to 5; level k unlocks scene k (see `product.md`). Regulars
appear on a fixed calendar of 5 campaign visits on Days 1 to 13 plus the Day 14 finale (`content-plan.md`).

## Unlock schedule (recipes and stock, start of day)

| Day | New |
|---|---|
| 1 | Harbour Black, Fog Tea, Salted Butter Roll, The Lamplighter's Almanac |
| 2 | Cinnamon Knot, Salt and Sparrows |
| 3 | Tide Latte |
| 4 | The Cartographer's Daughter |
| 5 | Honey Chamomile, Pear Tart |
| 6 | Seven Ways to Lose an Umbrella |
| 7 | Lamplight Cocoa |
| 8 | Lemon Cream Bun |
| 9 | The Gull Who Wanted a Hat |
| 10 | Midnight Mocha |
| 11 | Ginger Loaf |
| 12 to 14 | nothing new (story focus) |

## Balance targets (measured by a scripted bot in tasks 01 and 03)

Task 03 plays the real 14 days with the task 01 bot (`test/balance-report.test.ts`, numbers copied to
`.agents/resources/2026-10-23/web-games/the-last-window/03/README.md`). "Net" is start grant plus
shift coins (payments, tips, closing bonus) plus scene gifts minus pastry stock, with no decor bought.

| Player | Served share | Net campaign coins (after stock) | Decor | Scenes by Day 14 |
|---|---|---|---|---|
| Casual (reacts every 2.5 s, 20 percent wrong taps, presses Suggest stock every day) | 71 percent | 1,100 to 1,200 (bot 1,148) | 7 of 8 affordable from the net; buying as it goes, all 8 owned on Day 13 | 29 of 40 |
| Strong (reacts every 0.3 s, no mistakes, plans stock with foresight) | 100 percent | 1,900 to 2,050 (bot 1,980) | all 8 affordable; buying as it goes, all 8 owned on Day 10 | 40 of 40 |

Shift coins alone (without the start grant, scene gifts and stock) are 1,900 for the strong bot, so a
served customer is worth about 12.5 coins including tips and closing bonuses.

The first estimate for this table (casual 700 to 900, strong 1,300 to 1,700, with all 8 decor around
Day 11 to 13) assumed 9 coins per customer plus 2.5 tip and did not add the fixed income (closing bonuses
up to 280, scene gifts 280). The bot proves the estimate was about 25 percent low. The decor total stays
1,200 (it is asserted in several places), so the targets moved to the measured values. A casual player
therefore finishes the campaign with the whole shop bought and little left to spend; that is accepted for
v1 (Q9 in `open-questions.md`) and the owner judges the pace at browser QA.

## IAP room (not in v1)

Possible later without redesign: a coin pack, a "Regulars' favourites" cosmetic bundle (cup skins), an
ad-free tip jar. v1 has none of it. Premium currency, if ever added, would be a second field next to
`coins` in the profile; the profile is versioned with migrations so this is a migration, not a rewrite.

## Anti-cheat stance

Offline single-player. The save is local and editable by the user; no integrity checks beyond type
sanitising (clamps coins, FP, scene counts). No server, so nothing to protect.
