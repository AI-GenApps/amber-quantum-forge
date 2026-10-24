# The Last Window - open questions

None of these block v1; each has a stated default. After task 08 the open items are owned by the owner
(browser QA or a later step).

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q1 | Are the balance numbers fun in practice (patience 60 to 40 s, 12 customers in 240 s, tip percentages, recipe durations)? Task 01 bot check: a bot acting every 3 ticks never loses a customer on Days 5 to 14, while a bot acting every 2.5 s with 20 percent wrong taps loses 3 to 5 customers on Days 9, 12 and 14 (11 to 12 customers). | Values in `product.md` and `economy.md`. Tasks 01 and 03 may adjust them if a scripted bot shows the targets in `economy.md` are missed, logging the change in `decisions-log.md`. | tasks 01, 03, owner at QA |
| Q2 | Do 3 seats, 8 step buttons and a book shelf fit a 360 x 640 phone with 44 px hit areas? | Task 04 stacks HUD, seats, ticket and the three stations in one column that scrolls; hit areas are asserted at 44 px but nothing was looked at in a browser. Owner judges at 360 x 640. | owner at QA |
| Q3 | Privacy policy URL for store submission | Not needed in v1 (no submission); a one-page "no data collected" policy is needed later. | owner |
| Q4 | Public name beyond the working title | The Last Window stays the public name in v1. | owner, later step |
| Q5 | Which CC0 sources exist for the 36 audio slots (door bell, oven ding, rain loop, three warm music loops)? | Answered in task 05: all 36 slots have a CC0 file (32 Kenney sounds, an OpenGameArt rain recording and three OpenGameArt music tracks), none ships silent. The doorbell is Kenney `glass_004` (the closest CC0 chime; the pack has no door bell), the oven ding is an `impactMetal_light`, steam is a cloth-belt hiss, brewing a pot clank: stand-ins chosen by file name and spectrum, not by ear. The owner judges every sound and the three loops in browser QA; any slot can be swapped by replacing the ogg and its `LICENSES.md` row. | owner at QA |
| Q6 | Does the iOS Capacitor 8 project need CocoaPods for `cap sync`? | Answered in task 07: no. `cap add ios` and `cap sync` completed with Swift Package Manager only (`ios/App/CapApp-SPM`); CocoaPods and Xcode were not used. `cap add android` ran its own "Syncing Gradle" step with the Java runtime already on the machine (no `gradlew` run by hand, no build, no JDK installed). Closed. | task 07 |
| Q7 | Designer art delivery timing and rejects | Placeholders are code-drawn; task 06 integrates whatever passed review and keeps placeholders elsewhere. | orchestrator |
| Q8 | Is a casual player's pace right (scenes 1 to 4 by Day 14, scene 5 in Late Shifts)? Task 02 and task 03 reports: the casual bot plays 29 of 40 scenes by Day 14, `perfect` plays all 40; the bot loses 8 of 12 customers on Days 13 and 14, so the real answer needs a human. | Thresholds `[1, 2, 4, 6, 8]` stay; the scripted bot in task 03 reports scene counts for a casual and a strong player, and the owner judges at QA. | task 03, owner |
| Q9 | After all 8 decor items are bought coins have little use besides pastry stock. Is that acceptable for v1? | Yes. Task 03 measured it: a casual bot owns all 8 items on Day 13 and a strong bot on Day 10 (`economy.md` "Balance targets"), so the shop is finished well before the campaign ends. A later pass could add cosmetic cups or signs. Late Shifts keep their records and streak as goals. | owner, later step |
| Q10 | Remove the default Android `INTERNET` permission since the game is fully offline? | Keep Capacitor's default (WebView loader not verified without a device); data safety stays "no data collected". Owner decides after device QA. Task 07 kept `INTERNET` as the only permission (pinned by `test/native.test.ts`) and `allowBackup="true"` (saves are small and local; backup keeps progress across a phone change). | owner |
| Q11 | Are 3 to 4 scenes in one evening too much reading right after a shift? | Cap of 4 per evening (8 on Day 14), tap to advance, each scene about 40 seconds; the owner judges at QA. | owner at QA |
| Q12 | Walk-ins are code-drawn silhouettes. Do they read as people next to painted regulars? | Keep; a later art pass can add painted walk-ins. | owner at QA |
| Q13 | Do the launcher icon, adaptive mask, splash and launch storyboard look right? | Built from the accepted `icon` and `key-art` masters and checked only as files (sizes, opacity, safe-box maths); never seen on a device, in Android Studio or in Xcode. The splash is a soft-edged cottage panel on `night`. Owner judges on a device later. | owner at QA |

## Kit follow-ups

Found in task 04 (the kit is read-only for this epic; each has a workaround inside the game):

- `Button` and `IconButton` forward few props (no `aria-pressed`, `data-*` or `aria-label` on `Button`), so
  stateful controls (seats, step keys, plates, pick tiles) are plain `button` elements with game classes.
- `.wg-btn--danger` uses `colorAccentText` for its text, which is ink on a brick fill in this palette
  (about 2:1). The game CSS sets paper text on danger buttons.
- The toggle thumb uses `colorText` on both the off and the on track (paper on rain 2.2:1, paper on lamp
  1.9:1). The game CSS paints the thumb night when off and ink when on.
- `.wg-tab` sets `min-height` but no `min-width`; the game CSS adds `min-width: var(--wg-hit-min)`.
- `Sheet` has a single text token, so the paper look of sheets and cards is a generated override rule
  (`PAPER_SELECTOR`) written by `installTheme`.
- `Screen` takes only `name` and `class`, so per-screen data attributes (weather) are not possible.
- `createRouter` with an `interface` route map loses param types; the game uses a `type` alias.
- Success and danger toast borders have no contrast-safe token on a dark palette; the game CSS uses mixed
  `tealLight` and `brickLight`.

Still unverified for this game: nothing in the kit blocked task 04.

Found in task 05 (workarounds inside the game):

- `createAudioManager` holds one music track per manager, so the rain loop runs on a second manager (two
  `AudioContext`s). A kit "ambience layer" next to the music track would remove the second context.
- The audio manager has volume buses but `Settings` has only on/off switches, so there is no volume slider
  in v1; the music bus is fixed at 0.5 and the rain at 0.45.
- `Sheet` has no open callback or ref, so the sheet sound and slide are driven by an effect that looks up the
  newest `.wg-sheet` in the document.
- `StarRating` and the hearts expose no per-star refs; the reveal and heart fill query the rendered SVGs.

Found in task 06:

- Rejected or missing art slots: none. All 54 slots were accepted by the designer loop. The code-drawn
  placeholders remain in code as the fallback for any future rejected slot.
- Delivered resolutions are below the planned masters for interiors, key art and busts (1024 x 1536 instead
  of 1600 x 2400, 1020 x 1360 instead of 1536 x 2048); objects are 1024 x 1024, above the planned 768.
  Runtime sizes are unaffected and nothing is upscaled. Task 07 must plan its 2732 x 2732 splash around the
  1024 x 1536 key art.
- The object occupancy rule of the task (25 to 90 percent and an 85 percent safe area) was replaced by
  longest side 50 to 90 percent, coverage at least 10 percent and margin at least 3 percent; the owner may
  want to ask the designer for slightly more air above the Brass Reading Lamp and Glass Cake Stand (3.9
  percent top margin) in a later art pass.
- Kit follow-up: `preloadImages` has no concurrency or priority option, so all 52 runtime images load at
  boot; fine at 1.05 MB, but a lazy tier for the busts would help if the art grows.

Found in task 07:

- `cap add android` runs a "Syncing Gradle" step inside the Capacitor CLI itself (6 s, existing Java 17
  runtime); it is not a build and left `android/.gradle` and `android/local.properties`, both gitignored and
  deleted afterwards. The Capacitor template's instrumented and unit test stubs keep the package
  `com.getcapacitor.myapp`; they are never built here.
- The key art (1024 x 1536) is upscaled 1.17x to fit the 1200 px safe box of the splash; a 1600 x 2400 key art
  would remove that, but the delivered resolution is fine for a splash that Android and iOS scale anyway.
