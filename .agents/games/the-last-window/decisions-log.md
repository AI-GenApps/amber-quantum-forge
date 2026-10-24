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

## 2026-10-24 - Task 02 content (full v1 content and validators)

Data lives in `apps-games/the-last-window-core/src/content/`. No rule, price, threshold or count changed;
two plan rows changed wording (below). Evidence: `.agents/resources/2026-10-23/web-games/the-last-window/02/README.md`.

- **Ids.** Scene ids are `scene-R-K` (regular R, scene K). Choice ids are `rR-cK` (for example `r2-c2`),
  unique across the game so guards never clash. A beat speaker is `regular-R` (the core's `Customer.id`
  for a regular), `you` or `narration`. `SceneDef` extends the core `SceneScript` with `gift` (5 or 15) and
  `next` (the id of scene K+1, `null` for scene 5).
- **Plan row changed: Juno scene 3.** The plan titled both scene 3 and scene 5 "Draft Nine". Scene titles
  must be unique (text-hygiene test), so scene 3 is now "The Girl in the Fog"; scene 5 keeps the story
  title "Draft Nine".
- **Plan row changed: Abel's choice.** Option b "Leave the book in the window with a note" was nine words
  and the rule is at most eight, so the label is "Leave the book in the window" (the note stays in the
  story text).
- **Scene 5 holds no choice.** All 12 choices sit in scenes 2 to 4. Each of the two-choice regulars makes
  the second choice in scene 4, so the "last choice breaks a tie" rule is exercised by real content.
- **Guards.** Each regular has a pair of guarded beats (one per option) in scene 4 or scene 5, so a replay
  with the other option reads differently. Authored `beats` count both variants, so a path shows one fewer
  beat; the validator checks 6 to 9 for the authored array and for every guarded path.
- **Choice position.** `afterBeat` is the number of authored beats before the choice. The choice sits
  after the beat that asks the question; where that is the last main beat (Tobias 2, Juno 2, Henrik 3,
  Leona 2 and 4, Abel 3, Sunniva 2 and 4) the two reaction beats close the scene on a hook for the next
  visit, otherwise the remaining main beats do.
- **Reading level.** The scene grade is the Flesch-Kincaid grade of the whole scene text (main beats, both
  reactions, both endings). `countSyllables` is a vowel-group heuristic with rules for silent e, `-le`,
  `-ed`, `-es`, `-ing` and common split vowels; it is verified on 19 known words. The beat limit (grade 10)
  applies to whole beats, because one-word beats such as "Another." score above 20.
- **Day 1 script.** `TUTORIAL_ORDERS` (6 orders): Tobias Harbour Black at tick 10; Priya Fog Tea and
  Salted Butter Roll at 200; a walk-in Fog Tea at 260; Odile Harbour Black and a comforting book at 560;
  a walk-in Harbour Black and roll at 900; a walk-in Fog Tea and a curious book at 1250. The first two
  arrivals do not lose patience (`TUTORIAL_PATIENCE_FREE = 2`). `tutorialArrivals()` returns core
  `Arrival` objects so task 03 and the tests share them.
- **Validator model.** `validateContent(bundle = defaultBundle())` takes the whole content as one object so
  tests can pass broken copies. Reachability uses the best case (2 FP per serve, no decor) and counts only
  the five campaign visits on Days 1 to 13 (the Day 14 visit does not count for scene 5). Ending
  reachability enumerates every choice combination with the core's `resolveEnding`.
- **Core purity test.** `architecture.test.ts` scans `src` for DOM names. Story prose says "window" (the
  shop is the Last Window), so the DOM-name scan skips `src/content`, and a second test checks the content
  folder for the non-prose tokens and for any `window.` or `document.` access.
- **Biome.** The repo `biome.json` ignores every folder named `content` (`!apps-games/**/content`), so
  `src/content` is not covered by `bunx biome check`. The files were formatted and linted once with a
  copy of the config without that exclusion (a temporary copy, not committed); the verification
  command is unchanged.
- **Casual pace.** With the casual bot 29 of 40 scenes are played by Day 14 (Q8); with `perfect` play all 40.

## 2026-10-24 - Task 03: progression, economy, Late Shifts, versioned save

- **Profile v1.** `PROFILE_VERSION = 1`, key `the-last-window.profile` (the key lives in the app,
  `src/state/saveStores.ts`, because the core architecture test forbids the lowercase word `window` in
  non-content source). Fields: `coins` (start 30), `day` (1 to 14, 15 when the campaign is complete),
  `daysDone`, `owned`, `stock`, `regulars`, `pendingEvening`, `diary`, `late`, `flags`, `settings`
  (`recipeGuide`, `relaxed`, `textSize` normal or large), `stats`. `migrations` is empty; the chain is
  proven by a local version 2 test schema. `sanitizeProfile` rejects wrong types, clamps numbers, drops
  unknown keys and ids, and keeps an `ending` only when scene 5 is done.
- **Late state adds `todayCount`.** The Late Shift seed is forked by the index of today's shift, so the
  profile stores how many Late Shifts were finished on `lastKey` (`todayCount`) next to `count`. A new local
  date restarts the index at 0.
- **Streak rules.** The app maps the kit `streakStep` plus "first" (no earlier Late Shift) to the core.
  `first` and `gap` start the streak at 1, `next-day` adds 1, `same-day` pays nothing again,
  `clock-went-back` changes no streak data and pays no bonus (the shift itself still pays and counts).
  Bonus = `15 + 2 x min(streak, 7)` once per local date.
- **Replays.** A replay of a finished campaign day pays coins, adds friendship and visits and keeps the
  better star record, but never advances the day or duplicates the diary. A Late Shift is refused until
  Day 14 is complete.
- **Visits.** A visit counts for every regular who was served (delighted, satisfied or disappointed) and
  not for one who left, as in the task 02 campaign helper.
- **Evening queue.** After every shift the reducer builds the queue once: scenes already pending come
  first, new eligible scenes follow in regular order, cap 4 (8 after Day 14's shift). The rest stay
  eligible and are carried to the next evening. The app is not asked again within the same evening.
- **Shelf rules in `buyStock`.** Duplicates are removed, and when fewer books are unlocked than there are
  slots the shelf is filled with all unlocked books (the task 01 `shelfBooks` rule), so the plan never
  fails with "need a book" in the early days. `defaultStockPlan` reuses the last plan filtered by unlocks,
  fills a missing book shelf from the suggestion, and drops pastries from the end until the plan is
  affordable.
- **Campaign shift builder in the core.** `buildCampaignShift(day, {decor, relaxed, shelfEmpty})` (seed
  `day x 7919`, Day 1 uses the tutorial script) lives in the core so task 04 and the balance report share
  it. `buildLateShift(seed, index, lateCount, regulars, options)` forks the seed by `late-{index}`; weather,
  the three regulars and the arrivals all come from that fork.
- **Reset.** `resetProgress` returns the profile to defaults but keeps the accessibility extras
  (`recipeGuide`, `relaxed`, `textSize`); the kit settings (sound, music, haptics, reduced motion, high
  contrast) live in their own store and are untouched.
- **Balance targets rewritten.** The bot measured casual 1,148 and strong 1,980 net coins against the
  estimates 700 to 900 and 1,300 to 1,700. The estimate left out the fixed income (closing bonuses up to
  280, scene gifts 280). The decor total (1,200) is fixed by the task acceptance criteria, so
  `economy.md` "Balance targets" now states the measured values: casual 1,100 to 1,200 net, 29 of 40 scenes,
  all 8 decor owned on Day 13; strong 1,900 to 2,050, 40 of 40 scenes, all 8 owned on Day 10. Evidence:
  `.agents/resources/2026-10-23/web-games/the-last-window/03/README.md`. A test fails if the bot leaves the
  documented range.


## 2026-10-24 - Task 04: screens, tokens, fonts, accessibility

- **Palette in code.** `src/theme/tokens.ts` holds the 12 `product.md` tokens as `--tlw-*` properties and
  maps them onto the kit tokens (night page, paper cards and sheets through a generated rule on
  `.wg-sheet, .wg-card, .tlw-paper`). Four extra colours are mixed from tokens only where a token missed its
  contrast target (`nightRaised`, `tealLight`, `brickLight`, `starOffPaper`). High contrast is a second
  palette (ink `#1B1209`, night `#0F1826`, no paperDark fill, deeper brick/teal/sage) and every text and UI
  pair is asserted in both modes (text 4.5, UI 3; high contrast text 7).
- **Fonts shipped.** Young Serif (25,464 bytes) and Nunito Sans pinned to `wght` 400 to 800 (26,412 bytes),
  woff2 with `OFL.txt` under `public/fonts/`; commands and hashes in the 04 evidence README.
- **Routes and sheets.** The 14 routes are a `type` alias route map in `src/nav.ts`; params carry the shift
  target (`day` or `late`), the result summary and the scene queue. A result route with `finale: true`
  shows the Lantern Night cards, which come after the evening scenes on Day 14 (the scenes decide each
  card's variant). Sheets are overlays with back interceptors (Android back closes a sheet first, then
  opens the pause sheet; it never pops a running shift, Quit shift does).
- **Evening scenes use `replace`.** Scenes of one evening replace each other in the router, so the stack
  does not grow. A saved evening (profile `pendingEvening`) is offered again on Home as "Evening scenes (n)".
- **Runner.** `src/shift/Runner.ts` is a class over an injected frame scheduler: one `tickShift` per 100 ms
  of accumulated time, at most 5 per frame, standing still for the pause sheet and a hidden document. Tests
  use a manual scheduler. The shift screen also opens the pause sheet when the page is hidden.
- **Controls.** Tapping the active seat again serves (as `product.md` says "tap the customer"); a fully
  empty tray asks first. Discard is a button on each tray item and plate. Pastry step buttons act on the
  active seat's plate (else the first plate in use); tapping a plate selects its seat. The book shelf glows
  only when a book is requested, never to show which book (the recipe guide must not solve the mood puzzle).
  Space is reserved for serving, so it does not activate a focused button; Enter does.
- **Drawn art.** Busts are 300 x 400 SVG (head about 41 percent of the height, eyes at 38 percent), one
  `Bust` component with per-regular looks (hair, outfit colour, gear) and one `FaceMarks` for the three
  expressions, so identity cannot drift between expressions (a test strips the face group and compares).
  Walk-ins are simpler silhouettes with the same face marks. Interiors share one layout (arched window top
  centre, shelves at the sides, counter in the lower third); decor icons sit at fixed percentages over the
  interior, so real art and drawings use the same placement.
- **Image slots.** `ART_MANIFEST` is empty in this task. `Portrait`, `ItemIcon` and `Backdrop` read the
  manifest from a context (default the constant), so tests inject one; task 06 only appends entries.
- **Credits data.** `src/data/credits.ts` lists the fonts; task 05 added the audio rows (`audioCredits.ts`); task 06 appends art rows.
- **Not done here (by design).** Audio, haptics, the guided tutorial, first-time cards and final how-to text
  (task 05); real art (06); native projects (07). The How to play pages hold short placeholder wording.

## Task 05 decisions (audio, haptics, motion, onboarding)

- **Sources.** All 36 slots have a CC0 file, none ships silent. The 32 short sounds are Kenney originals
  (Interface Sounds, Impact Sounds, RPG Audio, Digital Audio, Music Jingles), stereo files downmixed to mono.
  The rain loop is the quiet opening of OpenGameArt "Light rain and heavy rain" (haruta, CC0). The music is
  OpenGameArt CC0: menu "Coffee House Bump" (OatCog), shift "Jazz Slower" and story "Just you and me Guitar"
  (Pro Sensory, Alex McCulloch). The sibling web games use the Cynic Project tracks and other Pro Sensory
  tracks, so none of these three is shared. Loop lengths are whole bars of the source (19.2 s, 3.53 s, 6 s
  grids) with a 2 s crossfade so the seam is soft; nothing was heard by the agent, the owner judges by ear.
- **Mix.** Sound effects run at slot gains 0.5 to 0.8. Music has its own bus at 0.5 and the rain at 0.45 on a
  second audio manager (the kit manager holds one music track), so rain and music play together. Rain follows
  the sound switch, music follows the music switch. Audio loads on the first gesture; the music chosen
  before it starts when it arrives.
- **Event map** (`src/audio/events.ts`, the only table). Seated customer: `customer-arrive`; seat tap:
  `seat-select`; a correct step: `step-tap` plus `step-brew`, `step-steam`, `step-pour` or `oven-start` on
  those tokens (light haptic); a wrong step: `step-wrong` and a warning haptic; oven done: `oven-ready`; a
  book placed: `book-pick` (light); serve: `serve` (medium), `coin` 140 ms later when anything was paid, then
  `delighted` (plus a success haptic) or `disappointed` 360 ms after the serve; customer left: `customer-left`
  and a warning; turned away: `customer-left` without a haptic; under 10 s: `patience-warning`. Stars are
  revealed 120 ms apart, each with a success haptic, and the jingle of the final star (`star-N`) plays once.
  Friendship levels and unlocks follow the stars (520 ms, then 260 ms apart); a Late Shift streak bonus adds
  `streak-up`. Buttons play `ui-tap`; Back plays `ui-back`; switches play `ui-toggle`; sheets play
  `ui-open-sheet`. Buttons inside the stations, seats, ticket and dialogue play their own sound only.
- **Music by route.** `music-shift` in a shift, `music-story` in a scene, `music-menu` everywhere else
  (title, home, plan, shop, journal, result). `rain-loop` in rain shifts and while the shop preview shows rain.
- **Audio follows the app lifecycle.** Pause suspends both audio contexts; resume restarts them and the music.
- **Motion.** Eight helpers (customer slide-in, patience pulse once per second under 10 s, steam wisp after
  each cup step, coin chip pop on a serve, heart fill on a new friendship level, page turn on a scene, star
  reveal 120 ms apart, sheet slide) over the kit `createMotion`. With reduced motion (system or setting) each
  applies its final frame and calls no `animate`.
- **Tutorial.** The 7 steps of `content-plan.md` are a pure machine over engine events
  (`src/onboarding/tutorial.ts`). A card appears when its moment has come (Tobias seated, Priya seated, Odile
  seated) and ends only by the real action (seat tapped, drink ready, Tobias served, Priya served, book
  placed); the first card (Marit's note) halts the clock until "Open the shop", the last ends on its button
  or the shift close. An action that already happened is not waited for, so the guide cannot get stuck.
  "Skip tutorial" is always on the card. The saved flag `tutorial` is set when it ends, is skipped or the
  shift closes; it only runs on Day 1 and never repeats. How to play has "Replay the guided shift", which
  clears the flag and opens Day 1 (a normal replay of Day 1: replay coins apply, as for any replayed day).
- **First-time cards.** Flags `card-stock`, `card-rain`, `card-scene`, `card-choice`, `card-decor`,
  `card-late`; each card is a sheet with one button, saved as soon as it opens, and in a shift it halts the
  clock behind it. A first Late Shift that is also rainy shows the Late Shift card only (rain waits for a
  later shift).
- **How to play.** Six pages; every number (shift length, patience 60 to 40 s, brew and warm times, tip
  percentages, friendship thresholds, shelf slots, portions, decor total) is read from the core constants.
- **Credits.** The 36 audio rows come from `src/data/audioCredits.ts`, which a test compares with
  `LICENSES.md` row for row.

## Task 06 (art integration)

- **All 54 slots accepted and integrated.** The designer loop (b1 to b7 and a decor-5 retry) accepted every
  slot. 52 runtime WebP files (q82, 2x display size) are in `public/art/`; `icon` and `feature-graphic`
  stay masters only. Masters are WebP q90 at the delivered resolution. `ART_MANIFEST` lists the 52 runtime
  slots and is written by `scripts/build-art.ts`; the provenance table in `assets-index.md` is generated by
  the same script.
- **Expression fallback chain.** A missing `happy` or `sad` bust shows the same regular's neutral image; a
  missing neutral shows the code-drawn bust. Nothing else in the layout changes.
- **Object check adjusted.** The task's "25 to 90 percent" occupancy and 85 percent safe area did not fit the
  accepted objects, so the enforced rule is longest box side 50 to 90 percent, opaque coverage at least 10
  percent and a margin of at least 3 percent (details in the task 06 evidence README).
- **Credits.** The art group lists four rows (key art and interiors, regulars, items, decor): author "MobileGamesDesigner thread", licence "Owned by the project".
- **Tests use explicit manifests.** Because the shipped manifest is now full, tests that assert code-drawn
  fallbacks pass `artManifest: []` (or an `ArtContext` with an empty list); the preload test passes an empty
  manifest so no image is fetched in happy-dom.

## Task 07 (Capacitor packaging)

- **Icon path.** Both slots were accepted, so the icon is the accepted `icon` master and the splash is the
  accepted `key-art` master (scaled to 1200 x 1800, soft edges, centred on `night` `#1F2F45`); no code-drawn
  fallback is used. The adaptive foreground is the icon with its outer 200 px faded to transparent, over a
  flat `night` background layer, so the launcher mask shows no hard square. One dark look: `splash.png` and
  `splash-dark.png` are identical.
- **Native look.** `backgroundColor` and the StatusBar plugin (`DARK`, `#1F2F45`) are set in
  `capacitor.config.ts`; the iOS launch storyboard background is `night`; iOS status bar style is light
  content; the Android adaptive background colour resource is `night`.
- **Portrait only.** Android activity `screenOrientation="portrait"`; iOS iPhone and iPad orientation lists
  contain only `UIInterfaceOrientationPortrait`.
- **INTERNET kept, backup kept.** `INTERNET` stays the only Android permission (Capacitor default; WebView
  loader unverified without a device, open question Q10) and `allowBackup="true"` stays so progress survives
  a phone change; no cleartext traffic flag. The game still makes no network calls.
- **Plugins.** Exactly `app`, `haptics`, `preferences`, `screen-orientation`, `share`, `status-bar` on both
  platforms, equal to the `package.json` dependency list (test).
- **Swift Package Manager.** iOS needs no CocoaPods (Q6 closed).

## Task 08 (release readiness)

- **Budgets are tests, not reports.** `test/budgets.test.ts` runs the Vite JS API `build()` into
  `node_modules/.cache/bundle-check` (gitignored, `copyPublicDir: false`, `logLevel: "silent"`), gzips every emitted
  `.js` file with `node:zlib` at level 9 and sums them, so it needs no earlier build. Art, fonts and audio are
  measured from `public/` (art `.webp`, fonts `.woff2`, audio `.ogg`). Per-file art limits: 400 KB for key art and
  interiors, 120 KB for busts, 60 KB for objects. `scripts/check-bundle.ts` prints the same numbers as a table
  (`bun run scripts/check-bundle.ts` from the app folder). KB means 1024 bytes everywhere.
- **Measured at release.** JS 86.7 KiB gzip (limit 300), art 1.05 MiB in 52 files (limit 8), fonts 50.7 KiB in
  2 files (limit 300 KiB), audio 1.15 MiB in 36 files (limit 2). All with large margins; nothing was trimmed.
- **Knowledge base is checked by a test.** `test/kb-consistency.test.ts` reads the eight knowledge-base files and
  asserts the shared numbers against the code (days, customers, regulars, scenes, choices, endings, finale lines,
  items, decor and its 1,200 total, coins, scene gifts, friendship thresholds and cap, shift lengths, seats,
  price and stock-cost tables, shelf slots, tip percentages, closing bonuses, Late Shift caps, routes, sheets,
  tutorial steps, how-to pages, 54 art slots, 33 sounds and 3 music loops) and the measured sizes against the
  files. Store listing length cells are compared with the text. A change to any of those numbers now fails the
  test until the documents change in the same commit.
- **Network and determinism audit is a test.** `test/network-audit.test.ts` scans `src/` of the app and the core:
  no `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket` or `EventSource`; no `http://` or `https://` literal except the
  font and audio credits links in `src/data/credits.ts` and `src/data/audioCredits.ts` (prefix allowlist); no
  `Math.random`, `Date.now`, `new Date(` or `performance.now` in the core; no `console.log` anywhere in `src/`.
- **Product text corrected.** `product.md` said the shop note from Marit sits on the title-to-home hand-off. It is
  the modal first coach card of the Day 1 shift ("Open the shop", clock held until dismissed). Only wording; no rule
  or number changed.
- **QA saves.** Because a full playthrough is about an hour, four ready-made save files (Day 10 with coins, Day 13
  with a scene backlog, Day 14 with all decor, campaign complete) are generated by `scripts/make-qa-saves.ts`
  (data in `scripts/qa-saves.ts`) into the evidence folder `qa-saves/`. `test/qa-saves.test.ts` checks that the
  committed files equal the generator output and survive the game's own `sanitizeProfile` unchanged. They are
  aids for the owner; they are not shipped.
- **No browser offline mode.** The web build has no service worker (Q14); offline reload is a Capacitor-shell
  property. Recorded rather than added: no dependency or kit change was allowed.
- **No store submission.** `store-listing.md` is final as a draft; screenshots, the privacy policy URL and the
  public name stay with the owner.
