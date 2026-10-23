# The Last Window - decisions log

Dated entries. All dates 2026-10-23 (planning day, task 00 of epic 22).

## 2026-10-23 - Owner decisions (final, from `.claude/workflows/web-games-v1-args.json`)

1. Full v1 for all six web games (complete loop, full content, progression, local save, reviewed art,
   custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android and iOS projects). No store
   submission.
   Rationale: ship a finished product per game and decide store steps later.
2. Wave 2 after the kit, with Dress Rehearsal and Lost Parcel Desk; The Last Window is epic 22.
3. No monetization: soft currency and unlocks only, no ads, no IAP, no accounts, no network.
4. QA is browser-only and done by the owner at the end. Agents run no browser, device or emulator, build
   no APK, install no JDK. Verification is Vitest (happy-dom), tsc, vite build and Biome.
5. Stack: TypeScript, Vite, Preact, Vitest, Capacitor 8. DOM, SVG and Canvas 2D. No engines.
6. Structure: `apps-games/the-last-window` (app) and `apps-games/the-last-window-core` (headless rules);
   shared code in `apps-games/web-kit`.
7. Portrait, offline-first, local save only (Preferences on device, localStorage on web), versioned with
   migrations; date-seeded modes are generated on device from the local date.
8. Graphics only from the MobileGamesDesigner thread after strict review; fonts OFL (Young Serif, Nunito
   Sans); audio CC0 only.
9. The working title is the public name for v1.
10. Every game ships on its own branch and PR, merged by the orchestrator.

## 2026-10-23 - Game-spec decisions (from the game spec, final)

- Pitch and loop: cosy cafe-bookshop at a harbour town, shifts of 3 to 4 minutes, orders of drink +
  pastry + book recommendation, tips and satisfaction feed coins and friendship, between shifts stock
  choices (limited shelf space), decor and a story scene with a regular.
- Content volume: 14-day campaign; 8 regulars with a 5-scene arc each (40 scenes), 1 to 2 choices per arc,
  2 endings per regular; 6 drinks, 5 pastries, 5 books, 8 decor items; weather variants morning, evening,
  rain; endless mode after Day 14; typed content file with a validator.
- Progression: coins, friendship levels, decor unlocks, recipe unlocks per day, journal of finished
  stories.
- Fonts Young Serif + Nunito Sans; art style warm painterly gouache with a consistent warm key light.

## 2026-10-23 - Design decisions

### Premise and calendar
Port Merrow, Marit's lamp and Lantern Night on Day 14 give the two weeks a shared horizon: every arc
resolves around the festival, and the finale (Day 14) can gather all eight regulars. The title "The
Last Window" is the last lit window on the quay.

### Real-time shift on a fixed tick
`TICK_MS = 100`; shift lengths 180 s (Days 1 to 4), 210 s (Days 5 to 9), 240 s (Days 10 to 14, Late
Shifts). Rationale: the spec asks for 3 to 4 minutes; a fixed tick keeps the core deterministic and
testable with no clock, and lengthening shifts with the day paces the difficulty.

### Seats and the active ticket
3 counter seats; the player selects a seat to make its ticket active and the stations build for that
ticket. Rationale: one-handed phone play, no drag, clear target for "serve", and a simple model for
tests and screen readers.

### Recipes as short step sequences with timers
Drinks 3 to 5 steps, pastries 2 to 4; brew 8, steam 6, water 5 and warm 12 ticks; a wrong step empties the
cup and restarts. The oven runs while the player works elsewhere. Rationale: "simple tap sequences" from
the spec, with just enough timing for multitasking and no loss other than time. The Recipe guide setting
(default on) makes the next step glow for newcomers and accessibility.

### Books as mood matching
5 moods, 5 books, two tags per book, each mood on exactly two books. Rationale: the spec asks to
"match book recommendations to customer moods"; the symmetric table makes stock choice interesting
(3 of 5 books on the shelf cannot cover everything) and is easy to validate.

### Satisfaction and tips
Outcome tiers delighted / satisfied / disappointed / left from the match percentage and the patience
fraction (`>= 0.35` for delighted); tips 40 / 15 percent. Rationale: a clear, explainable reward for being
right and quick; few numbers to learn; all thresholds in `constants.ts` and tested.

### Stock plan
Pastry shelf 3 kinds (4 with Glass Cake Stand), 5 portions per kind bought up front (1 or 2 coins each);
book shelf 3 books (4 with the ladder), free; drinks need no stock. Order generation ignores the stock.
Rationale: "limited shelf space" needs a real trade-off; regulars ask for favourites 70 percent of the
time so the preview of due regulars makes planning meaningful; pastry costs make coins matter without
punishing (nothing is mandatory).

### Friendship and scenes
FP cap 8, thresholds `[1, 2, 4, 6, 8]` (levels 0 to 5); delighted +2, satisfied +1. Scene k needs level
k and k served visits. Rationale: a casual player (satisfied each time) reaches scene 4 by Day 14 and the
rest in Late Shifts, a good player sees all 40 scenes; the validator proves the maximum (2 FP per serve x
5 visits = 10 >= 8) is enough.

### Visit calendar
Each regular has 5 visits on Days 1 to 13 (40 visits, 3 or 4 regulars per day) plus the Day 14 finale.
Rationale: spreads 40 scenes at about 3 per evening, gives each story a beat every 2 to 3 days, and keeps
the Day 14 shift for the celebration. At most 4 scenes per evening (8 on Day 14) so no night is a wall of
text.

### Choices and endings
12 choices (regulars 2, 4, 6, 8 have two; 1, 3, 5, 7 have one). Each option leans a or b; the majority
decides the ending and with two disagreeing choices the last choice wins. Guarded lines let later scenes
react to earlier choices. Rationale: satisfies "1 to 2 choices per arc, 2 endings per customer" without a
branching scene graph: still exactly 5 scenes per regular, so the validator, journal and scene count stay
simple.

### Weather
`day mod 3`: 1 morning, 2 evening, 0 rain, so Day 14 is an evening (Lantern Night) and rain falls on
Days 3, 6, 9, 12. Rain adds a customer and 6 s patience; morning favours pastries, evening favours books.
Rationale: three backgrounds, a predictable rhythm, and weather that gives small but visible gameplay
variety.

### Difficulty table
Customers 6, 6, 8, 7, 8, 9, 9, 9, 11, 10, 11, 12, 12, 12 (130 in total, rain days include +1); patience
60, 50, 50, 45 ... 40 s. Rationale: a gentle Day 1 tutorial, and pressure that grows without cliffs.

### Unlock schedule
Recipes and books unlock by Day 11, nothing new on Days 12 to 14. Rationale: the "recipe unlocks per day"
progression in the spec, finishing early enough that the last days focus on the story.

### Decor
8 items with exactly one effect each and total price 1,200; two are shelf upgrades. Rationale: the
spec gives only a count; effects tie decor to the stock and patience systems rather than being pure
cosmetics, and each effect is a single number that is easy to test.

### Endless mode is Late Shifts
After Day 14 the game offers Late Shifts seeded from the local date (index of the shift today), with
growing customers and shrinking patience, three regulars due each time, and a first-of-the-day Lamp
Bonus and streak. Rationale: the epic's task list includes a "daily mode"; tying the endless mode to the
local date reuses the kit's `daily` helpers and gives a reason to return without any server.

### Walk-ins are code-drawn
Six silhouette types with three expressions each, in palette tokens, no art slots. Rationale: the spec's
art list covers only the eight regulars; walk-ins need only to read as "someone"; this keeps the art
budget small.

### Accessibility options
Recipe guide (default on), Relaxed mode (patience x 1.5, no penalty), Text size (100 or 125 percent),
plus the kit's sound, music, haptics, reduced motion and high contrast. Rationale: time pressure is the
main accessibility risk in a cosy game, so it is optional to soften without changing rewards.

### Art slots and sizes
54 slots from the spec (B1 4, B2 9, B3 16, B4 25). Runtime: backdrops and key art 800 x 1200, customer
busts 480 x 640, items 192 x 192, decor 256 x 256, all WebP at 2x display size. Rationale: busts show
at about 120 x 160 CSS px in a shift and 240 x 320 in scenes; 2x covers both.

### Audio slots
33 sounds and 3 music loops (menu, shift, story), chosen to cover every game event and every screen;
all CC0 (task 05 selects). Haptics map in `assets-index.md`. Rationale: cover the loop without
silent actions while staying under the 2 MB budget.

### Scene writing format
A scene is 6 to 9 beats of at most 25 words, speakers `you`, the regular or `narration`; lines can be
guarded by an earlier choice; scene 5 holds the two ending blocks. Reading level: average
Flesch-Kincaid grade at most 7.0 per scene (spec: "reading level plain"), validated by a syllable
counter in the core. Rationale: easy to author, easy to validate, and short enough for a 40-second
evening scene.

### Core carries its own PRNG
The core package cannot import the kit (it has no dependencies), so it holds a small sfc32 PRNG seeded
from a 32-bit integer; the app converts kit seeds. Same pattern as the other web games.

### Task split
Task 01 holds all rules including the scene player and ending resolver; task 02 holds all data plus
validators; task 03 holds profile, economy, Late Shifts and the save; task 04 all screens. Rationale:
rules before content, content before UI, so each task has a testable target.

### Ports and ids
Dev server port 4014 (already in `vite.config.ts`), app id `app.w3dev.thelastwindow`, save key
`the-last-window.profile`.

## 2026-10-24 - Task 01 rule clarifications (core rules engine)

Rules the spec left open, fixed while implementing the headless engine. Numbers did not change.

- **Drinks follow the ticket.** The `cup` tap binds the cup to the active ticket's drink and the next
  step is that recipe's next token, so a finished cup always matches the order. A drink on a tray is
  therefore exact or missing; a wrong drink only exists at the scoring-function level (scores 0, pays 0).
  Rationale: matches "the next needed step glows" and the screen-reader label "Tide Latte step 2 of 4".
- **Portion at the plate step.** Starting a pastry takes the portion (the task's `pastryPick`), so a
  discarded plate loses it. Product text said "finishing"; the engine API fixes it at the start.
- **Wrong pastry step** is a counted mistake with no other penalty (the plate keeps its progress); only
  the cup is emptied by a wrong step. Rationale: portions are paid for up front, so ruining them on a
  mis-tap would feel harsh.
- **Substitute pay** is half of the delivered pastry's price (floor, minimum 1). Decor price bonuses
  (+1 drink, +2 book) apply to the exact drink and to a right-mood book only; a wrong-mood book pays 1.
- **Moods are always answerable.** A regular's book request uses a favourite mood that some unlocked
  book covers, else any covered mood. Rationale: avoids unanswerable requests on Day 1 (only
  The Lamplighter's Almanac is unlocked) without changing the 50/50 split when both moods are covered.
- **Tick order.** Each tick: station timers, patience (seated customers only), arrivals join the door
  queue, door customers take free seats in arrival order, then door customers waiting 50 ticks are
  turned away. A customer seated on a tick starts draining on the next tick.
- **Cut-off and closing.** Arrivals at or after `length - 200` are dropped by `createShift`; the shift
  enters `closing` at the clock and is `closed` once no customer is seated or waiting. Anything started
  for a seat is dropped when the customer leaves or is served.
- **Scripted Day 1.** `ShiftDef.patienceFreeArrivals` freezes patience for the first N arrivals (the
  tutorial's "first two do not lose patience").
- **Scenes one at a time.** `eligibleScenes` returns only the next unfinished scene per regular;
  the app asks again after each scene. `eveningQueue` orders by regular then scene index.
- **Arrival ticks** are stratified over the open part of the shift (first arrival from tick 10, spacing
  at least 30, none in the final 200), so customers spread across the whole clock.
- **`buildArrivals` takes an order context** (`{unlocked, weather, shelfEmpty}`) as a fifth argument, because
  orders depend on them. `createShift` also strips the pastry from every order when the stock has no
  pastry kind, so a `ShiftDef` built before the stock plan stays legal.
- **Late Shift weather** comes from `weatherForSeed(seed)` (a fork of the shift seed).
- **Bot.** `test/helpers/bot.ts` plays any `ShiftDef` through the public engine API. `perfect` reacts
  every 3 ticks with no wrong taps; `casual` every 25 ticks with 20 percent wrong taps and no
  urgency ordering. On a Day 14 sized shift (14 customers, cake stand, ladder, cushions, chart frame)
  perfect earns 226 coins (3 stars, nobody left) and casual 104 coins (1 star, 7 left); task 03 reports
  the campaign balance against `economy.md`.
