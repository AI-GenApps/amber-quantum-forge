# The Last Window - owner browser QA checklist

Owner only. Agents never run this list: every automated check for the game is headless (Vitest with
happy-dom, `tsc`, `vite build`, Biome), so nothing below has been seen on a screen yet. Tick each box,
write what you saw in the Notes column or in the defect log at the end, and attach screenshots there.

Numbers quoted here are the shipped rules from `.agents/games/the-last-window/` (`product.md`,
`economy.md`, `content-plan.md`); a mismatch is a defect either in the game or in the knowledge base.

## 0. Setup

- [ ] From the repo root run `bun run --filter '@web-games/the-last-window' dev`. It serves on
      `http://localhost:4014` (host exposed, so a phone on the same Wi-Fi can open it too).
- [ ] Use a desktop Chromium-based browser first and open the device toolbar at each size in turn:
      360 x 640, 390 x 844 and 430 x 932 (portrait). Reload after each size change. Repeat the
      sections marked **(all sizes)** at all three.
- [ ] Open DevTools, Application, Local Storage. The key `the-last-window.profile` holds the save;
      `the-last-window.settings` (kit key) holds sound, music, haptics, reduced motion, high contrast.
- [ ] Optional shortcuts. Three ready-made saves sit next to this file in `qa-saves/`:
      `day10-shopping.json` (Day 10, 700 coins, three decor items owned, scenes partly read),
      `day13-scene-backlog.json` (Day 13 next, every regular has scene 4 waiting, 8 scenes over the cap),
      `day14-ready.json` (Day 14 next, all 8 decor owned, scenes 1 to 3 of every regular read),
      `campaign-complete.json` (Day 14 finished, all 40 scenes read, Late Shifts open). To load one:
      open the file, copy its whole text, then in the DevTools console run
      `localStorage.setItem("the-last-window.profile", "<paste>")` (wrap the pasted text in single
      quotes) and reload. To start again: `localStorage.clear()` and reload.
- [ ] Note the browser name and version here: ______________________

## 1. First launch and the Day 1 tutorial **(all sizes)**

Start with an empty save (`localStorage.clear()`, reload).

- [ ] Title screen: key art fills the screen, "Tap to begin" is readable over it, a loading line
      ("Lighting the lamp: N percent") appears while assets load and then goes away.
- [ ] Tapping begin goes to Home with "Continue: Day 1". No sound plays before the first tap.
- [ ] Day intro for Day 1 shows the title "The Sign in the Window", morning weather, the expected
      regulars (Odile, Tobias, Priya), what is new, and a 180 second shift.
- [ ] The stock plan opens with a first-time card, pastry shelf and book shelf, "Suggest stock" fills
      them, and "Open shop" starts the shift.
- [ ] The Day 1 shift is the guided one. All 7 coach steps appear in order and each asks for one action:
  - [ ] 1. Shop note from Marit ("Keep the lamp lit") with an "Open the shop" action; the shift is paused behind it.
  - [ ] 2. Tobias sits down; tap his seat to make his ticket active.
  - [ ] 3. Make Harbour Black step by step (cup, brew, pour); the brew timer locks the next tap.
  - [ ] 4. Serve and see a tip.
  - [ ] 5. A pastry with the oven timer while a second customer waits (Priya, Fog Tea and Salted Butter Roll).
  - [ ] 6. A book mood request from Odile (comforting); pick a matching book.
  - [ ] 7. Read the patience bar and the closing grade.
- [ ] Six customers arrive in total; the first two do not lose patience.
- [ ] "Skip tutorial" is visible on every step. Test it once on a fresh save (the coach disappears and
      the shift continues unguided) and once finishing all steps.
- [ ] After either route the tutorial does not return on a replay of Day 1.
- [ ] How to play, "Replay the guided shift" clears the flag and the next Day 1 shift shows the coach again.

## 2. Every screen **(all sizes)**

For each screen check: nothing is cut off or overlapping, nothing needs sideways scrolling, text is
readable, the Back button works, and the screen looks finished.

- [ ] Title
- [ ] Home (Continue, Evening scenes when queued, Journal, Decor shop, Recipe book, Settings, How to
      play, Credits; "Late Shift" only after Day 14)
- [ ] Day intro
- [ ] Stock plan
- [ ] Shift (with the pause sheet, quit confirm and serve-empty confirm)
- [ ] Shift result
- [ ] Story scene (with a choice and with an ending)
- [ ] Lantern Night finale cards
- [ ] Decor shop (with the purchase confirm sheet)
- [ ] Journal (Stories tab and Shop Diary tab)
- [ ] Recipe book
- [ ] Late Shift lobby
- [ ] Settings (with the reset confirm sheet)
- [ ] How to play (6 pages: Your shop, Making drinks, Pastries and the oven, Books and moods, Friends and
      stories, Stock and decor; Previous and Next work and the last page has no Next)
- [ ] Credits (Fonts, Audio and Art groups; Young Serif and Nunito Sans, the Kenney and OpenGameArt
      audio rows, the art group rows; every row has an author, a licence and a source)

## 3. Drinks and pastries

Use `day14-ready.json` (all recipes unlocked) or play forward. Steps are tapped in order from the
active ticket; with the recipe guide on, the next step glows.

Drinks (6): make each one for a customer who ordered it and serve it.

- [ ] Harbour Black: cup, brew (8 ticks), pour
- [ ] Tide Latte: cup, brew (8), steam (6), pour
- [ ] Fog Tea: cup, leaves, water (5); ready when the water timer ends
- [ ] Honey Chamomile: cup, leaves, water (5), honey
- [ ] Lamplight Cocoa: cup, cocoa, steam (6), pour
- [ ] Midnight Mocha: cup, brew (8), cocoa, steam (6), pour
- [ ] A wrong step empties the cup and restarts the recipe (message "Wrong step. The cup is emptied.",
      a wrong-step sound). Try it on a two-step and a five-step recipe.
- [ ] While a timer runs the next tap is locked and a progress ring shows.

Pastries (5): two plates, one oven (12 ticks for `warm`).

- [ ] Salted Butter Roll: plate, warm
- [ ] Cinnamon Knot: plate, warm, dust
- [ ] Pear Tart: plate, warm, glaze
- [ ] Lemon Cream Bun: plate, cream, dust (no oven)
- [ ] Ginger Loaf: plate, warm, glaze, dust
- [ ] A wrong pastry step is a mistake but the plate keeps its progress.
- [ ] Oven timer while another order is made: start a pastry's `warm` step, then make a drink for another
      seat while the oven runs; the plate flashes when ready and the next pastry step unlocks.
- [ ] Both plates in use at once (two pastries for two seats); a third pastry cannot start until a plate frees.
- [ ] Tapping the tray item discards it (it is lost, and a discarded plate loses its portion).

## 4. Books and moods

- [ ] Open the book shelf; only stocked books show, each with two mood tags as icon plus word.
- [ ] Moods: comforting, adventurous, wistful, funny, curious. Every ticket that wants a book shows a mood chip.
- [ ] Right mood: deliver a book that carries the mood (The Lamplighter's Almanac: comforting, curious;
      Salt and Sparrows: wistful, comforting; The Cartographer's Daughter: adventurous, curious; Seven
      Ways to Lose an Umbrella: funny, wistful; The Gull Who Wanted a Hat: funny, adventurous).
- [ ] Wrong mood: deliver a book without the mood. It scores less and pays 1 coin.
- [ ] Substitute: every mood has two books, so with both on the shelf either works.
- [ ] A book request can always be answered by a stocked book (the shelf never makes it impossible).
- [ ] Closing the shelf and tapping a book put it on the active ticket only.

## 5. Seats, patience and outcomes **(all sizes)**

- [ ] Seat selection: tap each of the three seats; the selected seat is marked and its ticket shows.
      Keys 1, 2, 3 select seats, Space serves, Escape pauses, on a desktop keyboard.
- [ ] Three seats at once: seat three customers and make orders for each.
- [ ] Door wait: with all three seats taken a fourth customer waits at the door for about 5 seconds, then
      leaves ("could not find a seat"), counts as left and pays nothing. If a seat frees in time they sit.
- [ ] Patience bar drains; under 10 seconds it shows a number badge and a warning sound plays once.
- [ ] A customer leaves when patience reaches zero: sad face, leaving sound, whatever was started for them is dropped.
- [ ] Delighted: complete order, at least 35 percent patience left. Happy face, 40 percent tip, fanfare.
- [ ] Satisfied: at least 60 percent of the order scored. 15 percent tip.
- [ ] Disappointed: served below 60 percent (e.g. drink only for a drink + book order, or a wrong-mood book
      plus a missing pastry). Sad face, no tip.
- [ ] Serve an empty tray: the confirm sheet "Serve an empty tray?" appears; "Go back" returns, "Serve anyway" serves.
- [ ] Tips and payment show as coins; the coin sound plays.
- [ ] Pause: the pause sheet stops the clock; Resume continues; the recipe book can be shown and hidden;
      Quit shift asks first and, if confirmed, gives no rewards and the day can be retried.

## 6. Stock plan

- [ ] The plan shows tomorrow's weather, the regulars due, and their favourite pastry and moods.
- [ ] Pastry shelf starts at 3 kinds; each kind costs 5 portions at 1 or 2 coins per portion
      (Salted Butter Roll 1, Cinnamon Knot 1, Pear Tart 2, Lemon Cream Bun 1, Ginger Loaf 2).
- [ ] Choosing a fourth kind is refused with the "shelf is full" text until Glass Cake Stand is owned (then 4 allowed).
- [ ] Book shelf starts at 3 books; a fourth needs Rolling Library Ladder. At least one book is required.
- [ ] With fewer unlocked books than slots, all unlocked books are on the shelf automatically.
- [ ] A plan that costs more than the coins you have is refused ("Not enough coins for this plan").
- [ ] "Suggest stock" prefills a sensible plan for free.
- [ ] An empty pastry shelf is legal: orders then carry no pastry.
- [ ] Sold-out pastry substitute: let a stocked kind run out (5 portions) or have a regular ask for a kind
      you did not stock; serve another stocked pastry and confirm it scores as a substitute (half price,
      minimum 1) instead of blocking the order.

## 7. Weather shifts **(all sizes)**

Weather is Day mod 3: 1 morning, 2 evening, 0 rain.

- [ ] One morning shift (Day 1, 4, 7, 10 or 13): morning interior art and light, few books requested.
- [ ] One evening shift (Day 2, 5, 8, 11 or 14): evening interior art and lamp light.
- [ ] One rain shift (Day 3, 6, 9 or 12): rain interior, rain streaks, ambient rain sound, one extra
      customer (Day 3: 8 customers), +6 seconds patience (Day 3: 56 seconds). The first rain shift shows its first-time card.
- [ ] Rain streaks and bobbing stop with Reduce motion on, and the rain sound still plays.

## 8. Decor

`day10-shopping.json` has 700 coins and decor-1 to decor-3 owned. For each item buy it, check the
confirm sheet text and price, and check the effect in a shift.

- [ ] Window Seat Cushions (80, Day 2): +4 s patience for everyone
- [ ] Brass Reading Lamp (110, Day 3): +2 coins on every right-mood book
- [ ] Potted Rosemary (90, Day 4): +1 coin on every drink
- [ ] Glass Cake Stand (180, Day 4): fourth pastry shelf kind
- [ ] Rolling Library Ladder (200, Day 5): fourth book slot
- [ ] Harbour Chart Frame (140, Day 6): +1 friendship on a delighted serve
- [ ] Rain Chime (150, Day 7): +8 s patience in rain only
- [ ] Brass Gramophone (250, Day 9): tips become 50 and 25 percent
- [ ] Locked items show "Unlocks on Day N" and cannot be bought.
- [ ] Buying with too few coins shows how many more are needed and does not buy.
- [ ] Owned items appear in the shop preview and in the shift interior, and the preview follows the weather.
- [ ] Total of all eight is 1,200 coins.

## 9. Regulars: friendships, scenes, choices and endings

Friendship levels come from 1, 2, 4, 6 and 8 friendship points (cap 8); scene k needs level k and k
visits. Delighted gives +2, satisfied +1. Hearts show on the result screen and in the Journal.

Play at least two regulars end to end, taking every choice combination across the playthroughs. Suggested:
Tobias Venn (two choices, four combinations) and Odile Marsh (one choice, two options), plus Sunniva Roe
or Juno Okafor if time allows. Use `day14-ready.json` and the Journal replay to see the other branches.

Choices and endings (option a leans A, option b leans B; with two choices that disagree the last wins):

| Regular | Story | Choice ids and options | Ending A | Ending B |
|---|---|---|---|---|
| 1 Odile Marsh | The Light on Skerry Point | r1-c1 (scene 3): light it / offer the lens | Lit One More Night | The Lens on the Shelf |
| 2 Tobias Venn | The Marigold | r2-c1 (scene 2), r2-c2 (scene 4) | The Last Crossing | Postcards on the Corkboard |
| 3 Priya Anand | The Tide Pool Guide | r3-c1 (scene 3) | The Touch Table | The Letter From Away |
| 4 Juno Okafor | Draft Nine | r4-c1 (scene 2), r4-c2 (scene 4) | Out Loud | The Zine |
| 5 Henrik Ahlgren | Two Stalls, One Quay | r5-c1 (scene 3) | One Stall, Two Chairs | A Bench Between |
| 6 Leona Castellane | House Call Hours | r6-c1 (scene 2), r6-c2 (scene 4) | A Week at the Shore | The Open Door |
| 7 Abel Quill | The Book That Came Home | r7-c1 (scene 3) | The Reply | The Shelf Where It Waits |
| 8 Sunniva Roe | The Window Mural | r8-c1 (scene 2), r8-c2 (scene 4) | Everyone's Wall | One Long Sunrise |

- [ ] Scene 1 of the first regular plays after the visit that earns level 1; the speaker name, bust and
      mood (neutral, happy, sad per beat) change with the lines.
- [ ] Tap or Enter advances; each scene takes about 40 seconds and has 6 to 9 beats.
- [ ] Scene gift: 5 coins for scenes 1 to 4, 15 for scene 5, only the first time; replays pay nothing.
- [ ] A choice appears with two option buttons and the following lines react to the pick.
- [ ] Guarded lines: replay a scene in the Journal after choosing the other option earlier and confirm
      the later lines differ.
- [ ] Odile: both endings (two playthroughs, or the Journal after loading both saves).
- [ ] Tobias: all four combinations aa, ab, ba, bb give the ending of the last choice.
- [ ] A second regular's full five-scene arc, both endings.
- [ ] Ending text is shown inside scene 5, the title ("Ending: ...") is saved in the Journal, and the
      Journal "Stories" entry shows the ending title.
- [ ] Journal replay: every finished scene can be replayed ("Replay: no rewards"), no coins or friendship change.
- [ ] Journal Shop Diary has one entry per finished day (14 titles), empty state before Day 1 is done.
- [ ] Day 14 Lantern Night finale: after the Day 14 shift and its scenes, a card per regular shows one
      of three lines (ending A, ending B or story unfinished) and a closing caption from Marit's notebook.
- [ ] Unfinished stories can be finished in Late Shifts.

## 10. Evening queue and closing grade

- [ ] After a shift, pending scenes play from the result screen in regular order, at most 4 per evening
      (8 after the Day 14 shift). Load `day13-scene-backlog.json`, play Day 13, and confirm 4 scenes play,
      the other 4 are carried to the next evening and Home shows "Evening scenes (4)" until they are read.
      After the Day 14 shift up to 8 scenes may play before the finale cards.
- [ ] Closing grade: 3 stars needs at least 80 percent smiling and nobody leaving (bonus 20 coins), 2 stars at
      least 60 percent (10), 1 star for finishing (5). Check one of each if you can.
- [ ] Earnings table adds up: Sales, Tips, Closing bonus, Total earned.
- [ ] Unlocks for the next day are listed ("New: ...") and match the schedule in `economy.md`.

## 11. Late Shifts

Load `campaign-complete.json`, or finish Day 14.

- [ ] "Late Shift" appears on Home only after Day 14 is complete; the lobby shows today's count, streak,
      Lamp Bonus state and records.
- [ ] A Late Shift is 240 seconds with every recipe and book unlocked, 12 customers (plus 1 every 5 shifts,
      max 14), three regulars due, patience 40 seconds (down 1 every 5 shifts, floor 34).
- [ ] On today's date: the first shift pays the Lamp Bonus (15) plus the streak bonus (2 x streak) and
      the result shows both lines. A second shift the same day pays neither ("already collected today").
- [ ] Move the computer's clock forward one day (turn off automatic date and time), reload, play a Late
      Shift: the streak becomes 2 and the Lamp Bonus is paid again once (15 + 4).
- [ ] Move the clock forward two days from the last played date: the streak restarts at 1.
- [ ] Move the clock backwards to an earlier date than the last played one: no Lamp or streak bonus, the
      streak is unchanged, the shift itself still pays and counts.
- [ ] Set the clock back to automatic afterwards.
- [ ] Records update: best shift, longest run of delighted customers, Late Shifts finished.

## 12. Share

- [ ] On a result screen "Share": in a desktop browser without the share sheet the text is copied to the
      clipboard ("Copied to the clipboard."). Paste it somewhere and compare with the format:
      `The Last Window, Day N: S/3 stars, H of C customers smiling, N coins earned.`
- [ ] After a Late Shift the text reads `The Last Window, Late Shift DATE: S/3 stars, N coins, R delighted in a row.`
- [ ] The text contains no link.

## 13. Settings and accessibility **(all sizes)**

- [ ] Sound effects toggle: off silences taps and shift sounds; on restores them.
- [ ] Music toggle: menu, shift and story music differ and loop without a hard cut; off silences them.
- [ ] Vibration toggle (haptics are device only; on desktop the toggle just saves).
- [ ] Reduce motion: bobbing, rain streaks and tweens stop, every state change is still visible.
- [ ] High contrast: darker night, ink text, no paperDark fills; everything still readable.
- [ ] Large text (125 percent): all screens still fit with no clipped text at all three sizes.
- [ ] Relaxed mode: customers wait 50 percent longer; no loss in coins or story.
- [ ] Recipe guide off: no step glows; the recipe book (pause sheet, Recipes screen) still shows the steps.
- [ ] Each setting survives a reload.
- [ ] With a screen reader (VoiceOver or NVDA) if you have one: new customers, warnings and tips are
      announced and step buttons have names like "Tide Latte step 2 of 4: steam". Skip if not available.
- [ ] Keyboard only: Tab reaches every control, focus ring visible, Enter activates.

## 14. Fonts, legibility and hit areas **(all sizes)**

- [ ] All headings are Young Serif and all body text, numbers and buttons are Nunito Sans. No text looks
      like Times, Arial, Helvetica or the system font, including toasts, sheets, the loading line and
      the Credits screen. In DevTools, Rendered Fonts on a few elements should list only the two bundled fonts.
- [ ] Text is readable on busy backgrounds (key art, interiors, rain) at 360 x 640.
- [ ] Every button and seat is easy to hit with a thumb (44 x 44 CSS px minimum): try the step buttons,
      seats, plates and the Pause button on a real phone if possible.
- [ ] Nothing is only distinguishable by colour: patience has a fill plus a number under 10 s, mood tags have
      icons and words, stars and hearts have numbers.
- [ ] No text overflows its container in any language-neutral string on any screen.

## 15. Offline, persistence and reset

- [ ] Offline during play: load the game and reach Home, then switch DevTools Network to Offline without
      reloading. Play a full shift, buy something and read a scene. Everything still works and the Network
      tab shows no request after the first load (the game never calls a server).
- [ ] Offline reload: with Network on Offline, reload the page. The web build has no service worker, so a
      browser reload without the dev or preview server is expected to fail; the offline-first shell is the
      Capacitor app, which bundles every file (open question Q14). Record what you see; this is not a defect
      unless you decide a browser service worker is wanted.
- [ ] Save persistence: play part of a day, finish a shift, reload; coins, day, owned decor, friendships and
      the Journal are as left. Quitting mid-shift loses only that shift.
- [ ] Reset progress (Settings): confirm sheet, "Erase progress" returns to Day 1 and 30 coins, keeps the
      accessibility settings, and the tutorial returns on Day 1.
- [ ] A corrupt save: set `the-last-window.profile` to `not json`, reload. The game starts a new profile
      and keeps a `.corrupt` backup key.

## 16. Not covered here

- Android back button, Capacitor shells, real haptics, the launcher icon, adaptive icon mask and splash
  (these need a device; open question Q13).
- Store screenshots and submission (not part of v1).
- Real sound mix on a phone speaker.

## 17. Performance feel

- [ ] With three customers seated and an oven timer running the UI stays smooth: no stutter when tapping
      steps, no delay between tap and response.
- [ ] Opening and closing sheets and the book shelf feels instant.
- [ ] Scene transitions and the title load are comfortable.
- [ ] Switching tabs back after a minute does not leave a stuck timer or sound.

## 18. Defect log

Add a row per issue and attach screenshots here (drop them under
`.agents/resources/2026-10-23/web-games/the-last-window/qa-screenshots/`).

| # | Screen and size | What happened | Expected | Screenshot |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## 19. Sign-off

- [ ] Every box above is ticked or has a defect row.
- [ ] Q1, Q2, Q8, Q11, Q12 and Q13 in `.agents/games/the-last-window/open-questions.md` answered.
- Result: pass / pass with notes / fail. Date: ____________ Tester: ____________
