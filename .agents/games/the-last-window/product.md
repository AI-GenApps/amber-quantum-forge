# The Last Window - product spec (v1)

Spec of record for the rules, screens and tone. Numbers here are identical in `economy.md`,
`content-plan.md` and the task files; if a number changes, change it everywhere in the same commit.
Working title is the public name for v1.

## The loop in one minute

You keep The Last Window, a cafe-bookshop in the last building on Quay Lane in the harbour town of
Port Merrow, inherited from your great-aunt Marit. Each day is one shift of 3 to 4 minutes. Customers
sit at the counter with an order: a drink, often a pastry, sometimes a book recommendation described
as a mood. You tap short recipe steps to make the items, pick a book whose mood matches, and hand
the tray over before the customer's patience runs out. Happy customers pay, tip and grow fond of you.
After the shift you plan tomorrow's pastry and book shelves, spend coins on decor, and watch the
story scenes the regulars have earned. Two weeks later, on Day 14 (Lantern Night), the harbour
floats paper lanterns and every regular's story reaches an ending.

After Day 14, Late Shifts (the endless mode) are open every evening, seeded from the local date.

## Day, shift and clock

- A campaign day is one shift. 14 days, fixed table in `content-plan.md` (weather, length, customers).
- The core runs on a fixed tick: `TICK_MS = 100` (10 ticks per second). The app advances time with
  an accumulator; the core never reads a clock.
- Shift length: Days 1 to 4 = 180 s (1800 ticks), Days 5 to 9 = 210 s (2100 ticks), Days 10 to 14 and
  every Late Shift = 240 s (2400 ticks).
- Customers arrive on a schedule built from the day's seed. The shift ends when the clock reaches
  zero and the last seated customer is served or has left; no new customer arrives in the final 20 s.
- Pause is available at any time (sheet: resume, recipe book, settings, quit shift). Quitting abandons
  the shift: no rewards, no friendship, the day can be retried. Nothing is lost except the stock bought.
- Closing grade (1 to 3 stars) is shown on the shift result; it never gates progress.

## Weather variants

Each day uses one of three variants, which also pick the interior background and ambient sound.
`weather(day) = day mod 3: 1 morning, 2 evening, 0 rain`. Late Shifts pick one from the seed.

| Variant | Background | Pastry in order | Book in order | Other effect |
|---|---|---|---|---|
| morning | `interior-morning` | 70 percent | 20 percent | none |
| evening | `interior-evening` | 45 percent | 45 percent | none |
| rain | `interior-rain` | 55 percent | 30 percent | +1 customer, +6 s patience |

"Pastry in order" and "book in order" are the chance an order includes that component, if at least
one pastry or book is unlocked. Drinks are in every order.

## Seats, customers and orders

- The counter has 3 seats. Arrivals take a free seat. A customer who arrives with all seats taken waits
  at the door for up to 5 s (`DOOR_WAIT_TICKS = 50`); if no seat frees, they leave ("turned away"), count
  as left, and pay nothing.
- A customer is a regular (one of 8 named people) or a walk-in (unnamed, drawn in code). Regulars
  appear on their scheduled visit days (`content-plan.md` calendar); walk-ins fill the rest.
- Order components: drink (always), pastry (optional), book (optional, a requested mood).
- Regular's order: drink is their favourite with 70 percent if that drink is unlocked, else random
  among unlocked drinks; pastry likewise (favourite 70 percent if unlocked); book mood is one of their
  two favourite moods (50/50). Customers whose favourites unlock later simply order other things first.
  Walk-in: random unlocked drink and pastry, random mood among moods that some unlocked book covers.
  A regular only asks for a favourite mood that some unlocked book covers (if neither is covered, any
  covered mood), so a book request can always be met by some unlocked book.
- Mood-to-book: 5 moods (comforting, adventurous, wistful, funny, curious); each book carries exactly
  two mood tags and each mood is carried by exactly two books (table in `content-plan.md`).
- Patience (seconds): Day 1 = 60; Days 2 and 3 = 50; Days 4 to 8 = 45; Days 9 to 14 = 40; plus rain
  +6, plus decor (cushions +4, rain chime +8 only in rain). Relaxed mode (setting) multiplies the total
  by 1.5, rounded down to a tick. Patience drains one tick per tick from the tick after the customer takes a
  seat; the door wait is separate and does not drain it. A warning event fires at 100 ticks left. When a
  customer leaves or is served, anything started for their seat (cup, plates, tray) is dropped.
- Customer mood faces (art states): neutral while waiting, happy after a delighted or satisfied serve,
  sad after a disappointed serve or when leaving.

## Making things (stations)

The player first taps a seat to make that customer's ticket active. The three stations then build items
for the active ticket.

### Drinks (6)

A cup is built by tapping step buttons in order, following the recipe of the active ticket's drink (the
`cup` tap fixes the drink for that seat, so a finished cup always matches the order). A wrong step tap is
a mistake: the cup is emptied and the recipe restarts (no other penalty). Steps with a duration lock the
next tap until the timer ends and show a progress ring; a recipe whose last step has a duration (Fog Tea)
is ready when that timer ends. A seat holds one drink at a time.

| Id | Drink | Steps | Duration ticks | Price |
|---|---|---|---|---|
| `drink-1` | Harbour Black | cup, brew, pour | brew 8 | 4 |
| `drink-2` | Tide Latte | cup, brew, steam, pour | brew 8, steam 6 | 5 |
| `drink-3` | Fog Tea | cup, leaves, water | water 5 | 4 |
| `drink-4` | Honey Chamomile | cup, leaves, water, honey | water 5 | 5 |
| `drink-5` | Lamplight Cocoa | cup, cocoa, steam, pour | steam 6 | 5 |
| `drink-6` | Midnight Mocha | cup, brew, cocoa, steam, pour | brew 8, steam 6 | 6 |

Step tokens (8): `cup`, `brew`, `steam`, `pour`, `leaves`, `water`, `honey`, `cocoa`. The drink station has
one cup at a time.

### Pastries (5)

Pastries are built on 2 plates. `warm` puts the pastry in the oven for 12 ticks; the player may work
elsewhere meanwhile; when done the plate flashes and the next step becomes available.

| Id | Pastry | Steps | Price | Stock cost per portion |
|---|---|---|---|---|
| `pastry-1` | Salted Butter Roll | plate, warm | 3 | 1 |
| `pastry-2` | Cinnamon Knot | plate, warm, dust | 4 | 1 |
| `pastry-3` | Pear Tart | plate, warm, glaze | 5 | 2 |
| `pastry-4` | Lemon Cream Bun | plate, cream, dust | 4 | 1 |
| `pastry-5` | Ginger Loaf | plate, warm, glaze, dust | 5 | 2 |

Step tokens (5): `plate`, `warm`, `glaze`, `dust`, `cream`. Starting a pastry (the `plate` step) takes a
free plate and uses one portion of that kind from the day's stock; a discarded plate loses its portion.
A pastry that is out of stock cannot be started. A wrong pastry step is a mistake with no other penalty
(the plate keeps its progress). A seat holds one pastry at a time (on a plate or on its tray).

### Books (5)

Books need no steps: tap the shelf, tap a book on the shelf (only stocked books show), the book goes on
the active ticket. The shelf shows each book's two mood tags as icon plus word.

| Id | Book | Mood tags | Price |
|---|---|---|---|
| `book-1` | The Lamplighter's Almanac | comforting, curious | 6 |
| `book-2` | Salt and Sparrows | wistful, comforting | 6 |
| `book-3` | The Cartographer's Daughter | adventurous, curious | 7 |
| `book-4` | Seven Ways to Lose an Umbrella | funny, wistful | 7 |
| `book-5` | The Gull Who Wanted a Hat | funny, adventurous | 7 |

### Recipe guide

Setting `Recipe guide` (default on): the next needed step glows. Off: the player works from memory or
the recipe book (pause sheet and Journal tab), still unlimited and free to look at.

## Stock (limited shelf space)

Planned in the evening for the next day (and before Day 1).

- Pastry shelf: 3 kinds (4 with Glass Cake Stand). Each stocked kind holds 5 portions
  (`PORTIONS_PER_KIND = 5`) bought up front at the stock cost per portion. Leftovers are discarded.
- Book shelf: 3 books (4 with Rolling Library Ladder), at least 1 once any book is unlocked. Books are
  on loan from the back room: free, unlimited recommendations. Only unlocked books can be chosen; with
  fewer unlocked books than slots, all unlocked books are on the shelf automatically.
- Drinks need no stock; every unlocked drink is always available.
- Plan screen shows tomorrow's weather and which regulars are due, with their favourite pastry and moods.
  "Suggest stock" prefills the plan from those favourites (free, optional).
- The order generator does not look at which kinds are stocked, so a regular may ask for a pastry you
  did not bake. If that pastry is not stocked or is sold out, the player may serve any other pastry that
  is in stock as a substitute, or serve without one. Exception: if the pastry shelf is empty, orders carry
  no pastry component.

## Serving and satisfaction

Tapping the active customer ("Serve") hands over whatever is on the ticket's tray (partial trays allowed).
Each requested component is scored 0 to 10:

| Component | Exact | Substitute | Missing |
|---|---|---|---|
| Drink | 10 | none (drinks never substitute) | 0 |
| Pastry (if requested) | 10 | 5 (another stocked pastry) | 0 |
| Book (if requested) | 10 if it carries the requested mood | 3 (any other book) | 0 |

`pct = sum / (10 x requested components)`. `f` = patience ticks left / total patience ticks at serve.

| Outcome | Condition |
|---|---|
| delighted | `pct = 1` and `f >= 0.35` |
| satisfied | `pct >= 0.6` (and not delighted) |
| disappointed | served but `pct < 0.6` |
| left | patience reached 0, or turned away |

Items not requested but placed on the tray are ignored (not paid, not scored).

Payment: each delivered requested item pays its price (a substitute pastry pays half of the delivered
pastry's price, rounded down, minimum 1; a book with the wrong mood pays 1; a wrong drink pays 0). Tip, rounded up, on the payment: delighted 40 percent, satisfied
15 percent, disappointed 0, left 0 (nothing was delivered). Gramophone adds +10 percentage points.
Decor price effects apply to the item prices before the tip, to the exact drink and to a right-mood
book only (a wrong-mood book stays at 1).

Friendship points (regulars only): delighted +2, satisfied +1, disappointed 0, left 0; with Harbour
Chart Frame a delighted serve gives +1 more (maximum 3 per serve).

## Closing grade

At shift end, `good = (delighted + satisfied) / customers that arrived`; any customer who left counts
against 3 stars.

| Stars | Rule | Shift bonus coins |
|---|---|---|
| 3 | `good >= 0.8` and nobody left | 20 |
| 2 | `good >= 0.6` | 10 |
| 1 | shift completed | 5 |

## Friendship and story scenes

- Each regular has friendship points (FP), capped at 8 (`FP_CAP = 8`). Friendship level = number of
  thresholds reached from `[1, 2, 4, 6, 8]` (levels 0 to 5, hearts in the UI).
- Each regular has 5 scenes. Scene k becomes available when level >= k and the regular has had at
  least k visits served (campaign visit k, or any later served shift) and scene k-1 is finished.
- The core offers one scene per regular at a time (the next unfinished one); after a scene is finished
  the app asks again, so scene k+1 can follow in the same evening if it is already eligible.
- After a shift, pending scenes play on the evening screen in calendar order, at most 4 per evening
  (`MAX_SCENES_PER_EVENING = 4`); on Day 14 the limit is 8. Extra scenes wait for the next evening.
- A scene is 6 to 9 beats of dialogue with the regular's bust (neutral, happy or sad per beat), a speaker
  name, and sometimes a choice. Scene gifts: scenes 1 to 4 give 5 coins, scene 5 gives 15.
- Choices: each regular has 1 or 2 choice scenes. Each option "leans" a or b. Ending = lean of the
  majority; with two choices that disagree, the last choice decides. The ending shows inside scene 5
  (two ending text blocks) and is recorded in the Journal. Lines may be guarded by an earlier choice so
  later beats react to what the player said.
- Day 14 Lantern Night: after the shift, a finale card per regular (8 short lines, 3 variants each:
  ending A, ending B, story unfinished) closes the campaign. Unfinished stories can finish in Late Shifts.
- Journal: Stories (8 entries; finished ones show the ending title and can replay every scene without
  rewards) and Shop Diary (one entry per finished campaign day, 14 titles).

## Decor

8 items in the Shop screen, each with a coin price, an unlock day and exactly one effect
(`economy.md`). Owned items appear in the interior. The Shop shows a preview of the interior with the
chosen weather variant. Decor never needs placement choices (one fixed spot per item).

## Late Shifts (endless mode)

- Opens when Day 14's shift has been completed.
- A Late Shift is a 240 s shift with all recipes and books unlocked. Seed: `dailySeed("the-last-window",
  dateKey)` forked by the index of today's Late Shift (0, 1, 2, ...). Weather comes from the seed.
- With `n` = Late Shifts completed so far: customers = `12 + floor(n / 5)` capped at 14; patience
  = `40 - floor(n / 5)` seconds with a floor of 34 (plus rain and decor as usual).
- 3 distinct regulars (from the seed) are due each time; their orders use their favourites, they gain
  friendship, and pending scenes play afterwards.
- The first Late Shift of each local date pays the Lamp Bonus and the streak bonus (`economy.md`).
  A clock that went back pays no bonus and leaves the streak unchanged; a gap of two or more days restarts the streak at 1.
- Records: best shift earnings, longest run of delighted serves, Late Shifts completed, streak.

## Screens

| Route | Screen | Purpose |
|---|---|---|
| `title` | Title | Key art, title, Tap to begin (loads save) |
| `home` | Home | Continue (Day N) or Late Shift, Journal, Shop, Recipes, Settings, How to play, Credits |
| `day` | Day intro | Day title, weather art, expected regulars, Start prep |
| `prep` | Stock plan | Pastry shelf and book shelf selection, cost, Suggest, Open shop |
| `shift` | Shift | Interior, seats, stations, tray, clock, coins, pause |
| `result` | Shift result | Earnings table, stars, friendship hearts, Continue |
| `scene` | Story scene | Dialogue, choices, ending |
| `shop` | Decor shop | Buy and preview decor |
| `journal` | Journal | Tabs: Stories, Shop Diary |
| `recipes` | Recipe book | Drinks, pastries, books, mood tags |
| `late` | Late Shift lobby | Today's shifts, streak, records, Start |
| `settings` | Settings | Sound, music, haptics, reduced motion, high contrast, recipe guide, relaxed mode, text size, reset |
| `howto` | How to play | 6 pages |
| `credits` | Credits | Art, fonts, audio licences |

Sheets (5): pause, quit confirm, serve-empty confirm (tray empty), purchase confirm, reset confirm. The
stock-over-budget notice is inline on the stock plan and the day-complete message is a kit toast.

Evening flow after a shift: Result -> scenes (0 to 4) -> Home with "Plan tomorrow" (prep) and Shop.

## Controls

- Touch: tap a seat to select the ticket, tap station step buttons, tap the book shelf then a book, tap
  the customer (or the Serve button) to hand over. Tap the tray item to discard it (it is lost).
- Every control is a real `button` with an accessible name, a hit area of at least 44 x 44 CSS px and a
  visible focus ring.
- Keyboard: `1` `2` `3` select seats, `Space` serves, `Escape` pauses or closes a sheet, `Tab` moves
  through stations and step buttons, `Enter` taps. Story scenes advance with `Enter` or `Space`.
- No drag, pinch or timing-by-swipe input anywhere; no gesture is the only way to do something.
- Android back (device only): closes an open sheet, pauses the shift, or goes to the previous screen;
  on Home it asks to exit (kit `lifecycle.onBack`).

## Onboarding

- Day 1 is a guided shift (flag `tutorial` in the profile): six scripted customers, patience 60 s and
  the first two do not lose patience. Steps: (1) shop note from Marit on the title-to-home hand-off;
  (2) tap a seat; (3) make Harbour Black step by step; (4) serve and see a tip; (5) a pastry with the
  oven timer while a second customer waits; (6) a book mood request from Odile; (7) read the patience
  bar and the closing grade. Each step is a coach card with one action; a Skip tutorial button is always
  visible and the tutorial can be replayed from How to play.
- First-time cards (flags): first stock plan, first rain shift, first story scene, first choice, first
  decor purchase, first Late Shift.
- How to play has 6 pages: Your shop, Making drinks, Pastries and the oven, Books and moods, Friends and
  stories, Stock and decor.

## Accessibility

- Contrast: body text at least 4.5:1, large text and UI parts at least 3:1, checked by a palette test
  for every text/background token pair used (including high-contrast mode, which raises all text to
  at least 7:1). Information is never colour-only: patience uses a fill length plus a numeric badge when
  under 10 s; mood tags are icon plus word; stars and hearts have numbers in labels.
- Fonts: Young Serif for headings and titles, Nunito Sans for all body text, numerals and buttons;
  minimum body size 16 px; Text size setting (normal 100 percent, large 125 percent) scales both.
- Reduced motion: system preference or the setting removes bobbing, rain streaks and tweens; state
  changes remain visible.
- Screen readers: new customers, patience warnings, tips and scene lines are announced in an
  `aria-live=polite` region; buttons carry labels such as "Tide Latte step 2 of 4: steam".
- Relaxed mode setting (patience x 1.5) and the Recipe guide setting are accessibility aids and carry no
  penalty in coins or story.
- No time pressure outside a shift: scenes, plans, shop and journal have no timers.

## Art-bible palette (design tokens)

Warm gouache, lamp-lit, one consistent warm key light from the window side. All code-drawn visuals use
only these tokens; contrast of the pairs below was computed on 2026-10-23.

| Token | Hex | Used for |
|---|---|---|
| `paper` | `#FBF1DC` | Cards, sheets, text on dark |
| `paperDark` | `#EAD9B8` | Card edges, disabled fills |
| `ink` | `#3A2A1E` | Text on paper (12.23:1 on `paper`) |
| `inkSoft` | `#5E4A3A` | Secondary text on paper (7.44:1 on `paper`, 6.01:1 on `paperDark`) |
| `night` | `#1F2F45` | Screen background, counter (12.07:1 with `paper`) |
| `nightMid` | `#2D4560` | Raised panels on `night` (8.78:1 with `paper`) |
| `lamp` | `#E8A33D` | Accent, primary button fill (6.28:1 on `night`, 6.36:1 with `ink` text) |
| `lampDeep` | `#9A5F0E` | Accent text on paper (4.66:1) |
| `brick` | `#A03F30` | Danger, disappointed, patience low (5.76:1 with `paper`) |
| `teal` | `#1F6F6C` | Delighted, success (5.27:1 with `paper`) |
| `sage` | `#4F6B47` | Calm, owned or done (5.31:1 with `paper`) |
| `rain` | `#8FA9BC` | Rain streaks, locked items (5.53:1 on `night`) |

High-contrast mode swaps `ink` to `#1B1209`, `night` to `#0F1826` and removes `paperDark` fills.

## Share text

- Campaign: `The Last Window, Day {n}: {stars}/3 stars, {happy} of {customers} customers smiling, {coins} coins earned.`
- Late Shift: `The Last Window, Late Shift {date}: {stars}/3 stars, {coins} coins, {delightedRun} delighted in a row.`

No URL, no store link, no network: shared through the kit (`@capacitor/share`, `navigator.share`, clipboard).

## Non-goals for v1

No multiplayer, no ads, no IAP, no accounts, no network calls, no voice acting, no animation beyond tweens
and CSS, no cloud save, no localisation (English only), no landscape, no store submission, no extra
characters beyond the 8 regulars, no free-form decor placement, no in-game text input.
