# Floodplain Dispatch - owner browser QA checklist

Owner only. Agents never perform this (owner decision 2026-10-23: no browser, device or emulator in
agent runs). Every check in the epic so far was headless (Vitest with happy-dom, `tsc`, `vite build`,
Biome), so nothing below has been seen by anyone yet.

## Setup

1. `cd` to the repo and run `bun run --filter '@web-games/floodplain-dispatch' dev` (port 4012).
2. Open `http://localhost:4012` in a desktop browser with the device toolbar or a resized window.
3. Run the whole list at each of the three sizes: **360 x 640**, **390 x 844**, **430 x 932**.
   Tick the first column for each size you completed, and note defects in the last section.
4. Keep the browser console open: any error or warning during play is a defect.
5. Start from a clean save: DevTools, Application, Local Storage, clear the site, reload.

Sizes: A = 360 x 640, B = 390 x 844, C = 430 x 932.

## 1. First launch and tutorial on v01

- [ ] A [ ] B [ ] C - The boot screen shows the progress bar, then Home appears with no flash of
  unstyled or fallback-font text.
- [ ] A [ ] B [ ] C - Home shows Play, Daily Dispatch, Themes, Records, How to play, Settings,
  Credits; coins read 50 and stars read 0 of 120.
- [ ] A [ ] B [ ] C - Play, Valley, v01 First Trickle opens a board with the five-step tutorial
  coachmarks ("Step 1 of 5").
- [ ] A [ ] B [ ] C - Each coach hint points at the right thing (river square, canal tray, drag,
  Run season, stars) and the highlighted target is visible.
- [ ] A [ ] B [ ] C - "Skip tutorial" works and the tutorial does not return on reload.
- [ ] A [ ] B [ ] C - Finishing v01 shows the "How stars work" panel in the result sheet once.
- [ ] A [ ] B [ ] C - The first card for a mechanic (surge on v04, gate on d01, reservoir and
  drought on h01, tide on e01, storm tide on e08) appears once, is dismissible with "Got it" and
  does not return on reload.

## 2. Every screen

For each screen: nothing is clipped or overlapping, text is readable, the back control works, and
the layout fits without horizontal scroll.

- [ ] A [ ] B [ ] C - Home.
- [ ] A [ ] B [ ] C - Regions: four cards; Delta shows "Needs 12 stars", Highland 33, Estuary 60
  while locked; the locked cards cannot be opened.
- [ ] A [ ] B [ ] C - Levels: ten tiles per region with number, name, stars, par and best; locked
  tiles say Locked.
- [ ] A [ ] B [ ] C - Board (planning): tray, budget meter, forecast bar, undo, redo, clear, zoom,
  hint, Run season, pause menu.
- [ ] A [ ] B [ ] C - Playback: play and pause, 1x, 2x and 4x speed, scrub bar, week counter, skip
  to result, houses and fields badge as supplied, dry, flooded or irrigated.
- [ ] A [ ] B [ ] C - Result sheet: stars, score, spent against par and budget, house and field
  counts, coins gained, Next map, Retry, Edit plan, Share, Levels.
- [ ] A [ ] B [ ] C - Inspector sheet (Select tool on a piece): rotate pump, gate open and close
  weeks, remove piece with refund.
- [ ] A [ ] B [ ] C - Daily Dispatch: date, tier, details, streak, freezes, last 14 days, play
  button.
- [ ] A [ ] B [ ] C - Themes: seven swatches, locked ones show the stars needed, Apply works.
- [ ] A [ ] B [ ] C - Records: totals, best scores, recent seasons (empty message before any run).
- [ ] A [ ] B [ ] C - Settings: sound effects, music, haptics, reduce motion, high contrast, reset
  progress, credits and licences.
- [ ] A [ ] B [ ] C - How to play: six pages, next and previous.
- [ ] A [ ] B [ ] C - Credits and licences: fonts, audio (27 files with licence and source) and art
  rows are listed.

## 3. Maps and mechanics

Playing the whole campaign is long. To reach later regions fast, edit the saved profile in DevTools
(Application, Local Storage) so that stars per map are high enough (12, 33 and 60 stars open Delta,
Highland and Estuary), or play through. Note which method you used.

- [ ] A [ ] B [ ] C - Valley v01 (plain canal), v03 (sandbag barrier), v04 (surge forecast shown and
  visible during playback), v06 (pump: rotate with R, lifts water uphill).
- [ ] A [ ] B [ ] C - Delta d01 (sluice gate: set opens and closes weeks in the inspector; closed
  gate stops water, open gate passes it) and d04 (two surges, gate timing matters).
- [ ] A [ ] B [ ] C - Highland h01 (reservoir stores water; the drought weeks show the river rate
  dropping and the reservoir feeding the fields) and h03 (long drought).
- [ ] A [ ] B [ ] C - Estuary e01 (tide strip rises and falls with the sea cells) and e08 (storm
  tide cloud on the forecast, sea level jumps in weeks 18 to 20).
- [ ] A [ ] B [ ] C - A 12 x 16 map (e07 to e10): the board fits, cells are tappable, and zoom
  (fit, 1.5x, 2x) works; see also section 9.
- [ ] A [ ] B [ ] C - Every piece can be placed, removed (Eraser refunds its cost) and cannot be
  placed on a house, field, tree, inlet or sea cell; illegal placement shows the red message and
  plays the "invalid" sound.
- [ ] A [ ] B [ ] C - Over-budget placement is refused ("Not enough budget left").

## 4. Three-star and fail paths

- [ ] A [ ] B [ ] C - A 3-star result (spend at most par, no flooded house): three stars, star-3
  jingle, coins gained (first clear 10 plus 5 per star), Next map unlocked.
- [ ] A [ ] B [ ] C - A 2-star result (everything supplied, over par): two stars, no flood.
- [ ] A [ ] B [ ] C - A 1-star result (supplied but a house floods): one star, flooded badge shown.
- [ ] A [ ] B [ ] C - A fail (do nothing, press Run): 0 stars, the fail jingle, partial progress
  listed ("0 of N houses supplied"), Retry and Edit plan work and keep the pieces.
- [ ] A [ ] B [ ] C - Rerunning a cleared map pays no second coins; a better star pays only the
  difference (check the coin counter on Home).

## 5. Editing: undo, redo, clear, zoom, drag, keyboard

- [ ] A [ ] B [ ] C - Undo and redo walk back and forward through placements and removals; both
  disable at the ends.
- [ ] A [ ] B [ ] C - Clear (the Clear button, or "Clear the plan" in the pause menu) empties the
  board and can be undone.
- [ ] A [ ] B [ ] C - Zoom cycles fit, 1.5x, 2x; while zoomed, the Select tool pans (Q17) and the
  keyboard cursor scrolls the board.
- [ ] A [ ] B [ ] C - Drag-to-paint canals draws an unbroken chain across several cells with a
  mouse and with touch emulation; each cell costs 1 and the budget meter follows.
- [ ] A [ ] B [ ] C - Keyboard: arrows move the cursor, Enter places, Backspace removes, 1 to 5
  pick pieces, E eraser, S select, R rotate a pump, + zoom, Ctrl or Cmd Z undo, Shift plus that or
  Ctrl or Cmd Y redo, H hint, Space runs the season.
- [ ] A [ ] B [ ] C - The text board summary is announced (screen reader or the accessibility tree).

## 6. Hints, freezes and coins

- [ ] A [ ] B [ ] C - With 50 coins, Hint on a campaign map asks for confirmation ("Costs 25 coins"),
  spends 25 and shows a ghost piece on the right cell; a second hint leaves 0 and a third says
  there are not enough coins.
- [ ] A [ ] B [ ] C - A daily hint costs 40 coins.
- [ ] A [ ] B [ ] C - Buying a streak freeze on Daily costs 30, holds at most 2, and the button
  disables ("Freezes are full") at 2.
- [ ] A [ ] B [ ] C - Hints cannot be bought while a season is playing back.
- [ ] A [ ] B [ ] C - Using hints never removes stars on the result.

## 7. Daily Dispatch and the device date

Change the computer date for each step (system settings), reload the page after each change.

- [ ] A [ ] B [ ] C - Today: the map generates ("Preparing today's map"), plays, the result pays 10,
  15 or 20 coins plus the streak bonus (2 x streak up to 7), the streak becomes 1.
- [ ] A [ ] B [ ] C - Same day again: replaying with a better tier pays only the difference and no
  second streak bonus.
- [ ] A [ ] B [ ] C - Date plus one day: a new map for the new date; the streak continues to 2.
- [ ] A [ ] B [ ] C - Skip one day or more with no freeze: the streak resets to 1.
- [ ] A [ ] B [ ] C - With one freeze bought: skip exactly one day, then clear the daily; the freeze
  is consumed and the streak continues. Skip two days with only one freeze: the streak resets to 1
  and the freeze is kept.
- [ ] A [ ] B [ ] C - Date moved backwards: no coins, no streak change, no crash; the daily is
  neutral (clock went back).
- [ ] A [ ] B [ ] C - Last 14 days strip marks played days and missed days correctly.
- [ ] A [ ] B [ ] C - Restore the real date at the end.

## 8. Themes

- [ ] A [ ] B [ ] C - Themes unlock at 0, 9, 27, 48, 75, 100 and 120 stars; the unlock jingle and a
  result line appear when a theme unlocks.
- [ ] A [ ] B [ ] C - Applying a theme changes board colours immediately and persists after reload.
- [ ] A [ ] B [ ] C - Water stays readable on every theme (blue against meadow, with the dark
  shoreline).
- [ ] A [ ] B [ ] C - The region backdrops (Valley, Delta, Highland, Estuary) are visible behind the
  board; tune `BACKDROP_SCRIM` and `BACKDROP_MARGIN_ALPHA` if too faint or too strong (Q26, Q29).

## 9. Share, sound, music, haptics

- [ ] A [ ] B [ ] C - Share on a result copies the text to the clipboard in a desktop browser
  (no Web Share) and the sheet says "Copied or shared"; pasting shows the season text.
- [ ] A [ ] B [ ] C - Sound effects: tap, back, toggle, sheet, placing each piece, erase, rotate,
  invalid, run, surge warning, supplied, irrigated, flooded, stars 1 to 3, fail, region unlock,
  theme unlock, streak up. Note any that sound wrong (Q22).
- [ ] A [ ] B [ ] C - Water loop plays during playback and its volume follows the wet area.
- [ ] A [ ] B [ ] C - Music: menu loop on menus, map loop on a board, both loop without an audible
  click (Q23); the first sound starts only after the first tap (browser autoplay rule).
- [ ] A [ ] B [ ] C - Sound and music toggles silence them immediately and persist.
- [ ] A [ ] B [ ] C - Haptics toggle exists; the browser has no vibration, so only that it persists
  is checked (device-only otherwise).

## 10. Accessibility and display

- [ ] A [ ] B [ ] C - Reduce motion: playback, sheets and the tutorial stop animating (or use a
  simple fade); the OS "prefers reduced motion" setting does the same.
- [ ] A [ ] B [ ] C - High contrast: backdrop art is hidden, borders and text strengthen, every
  control stays readable.
- [ ] A [ ] B [ ] C - Text legibility: body text is Atkinson Hyperlegible, headings Bricolage
  Grotesque; no text looks like the platform default (Arial, Helvetica, Roboto, system-ui).
  Check Home, a result sheet, Settings and Credits. DevTools, Rendered Fonts must list only the two
  families.
- [ ] A [ ] B [ ] C - Tab order is logical, focus rings are visible, Escape closes a sheet.
- [ ] A [ ] B [ ] C - Touch targets other than board cells are at least 44 x 44 (board cells are
  26 to 30 px by design; zoom and keyboard compensate).

## 11. Offline and persistence

- [ ] A [ ] B [ ] C - DevTools, Network, Offline, then reload: the game still loads from cache or
  the dev server is unavailable. (Dev server reload needs the network; use `bun run
  --filter '@web-games/floodplain-dispatch' build` then `preview` on port 4012 and test offline
  there. A hard offline reload of the built app is the real check.)
- [ ] A [ ] B [ ] C - The Network tab shows no request to any other host at any time.
- [ ] A [ ] B [ ] C - Stars, coins, records, theme, settings and streak survive a reload.
- [ ] A [ ] B [ ] C - Settings, Reset progress asks for confirmation, then erases everything;
  coins return to 50, stars to 0, the tutorial and cards replay.
- [ ] A [ ] B [ ] C - Corrupt the save (edit the Local Storage value to invalid JSON) and reload:
  the game recovers with a fresh profile and does not crash.

## 12. Performance feel

- [ ] A [ ] B [ ] C - On a 12 x 16 map (e10) at 4x playback, animation stays smooth (no visible
  stutter on a normal laptop); with CPU throttling x4 it stays usable.
- [ ] A [ ] B [ ] C - Dragging canals across the board follows the pointer with no lag.
- [ ] A [ ] B [ ] C - The first load is quick; the JS download is about 79 KB gzip in the Network
  tab.

## 13. Not covered here (device only)

- Android hardware back button and predictive back behaviour: needs a device.
- Real haptic feedback, status bar colour, safe areas, iOS Safari audio (Ogg decoding, Q21).
- App icon, adaptive icon mask and launch screen (Q31, Q32).
- Install, backup and restore behaviour (Q30).

## 14. Defects

Use one row per defect. Attach screenshots under
`.agents/resources/2026-10-23/web-games/floodplain-dispatch/qa/` (create the folder) and link them.

| # | Size | Screen | What is wrong | Severity (blocker, major, minor) | Screenshot |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
