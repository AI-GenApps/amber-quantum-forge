# Dress Rehearsal - owner browser QA checklist

Run by the owner only. No agent opened a browser, device or emulator for this game: every claim in the
epic is a headless check (Vitest with happy-dom, `tsc`, `vite build`, Biome). Tick each box, write what you
saw under "Notes" and attach screenshots under "Defects".

## 0. Setup

- [ ] `cd` to the repo and run `bun run --filter '@web-games/dress-rehearsal' dev` (port 4015), open `http://localhost:4015`.
- [ ] Use Chromium DevTools device mode and repeat the sections marked (all sizes) at **360 x 640**, **390 x 844** and **430 x 932**.
- [ ] Start from a clean profile: DevTools > Application > Local Storage > clear `localhost:4015`. The save key is `dress-rehearsal.profile` (versioned JSON); settings use the key for game id `dress-rehearsal`.
- [ ] Shortcut for later sections: edit `dress-rehearsal.profile` (coins, per-challenge best stars) and reload; remember the app clamps and sanitises it on load.
- [ ] Console shows no errors and no network requests happen after the first load (Network tab: only the app files, fonts, art and audio from `localhost`).

Challenge ids used below (name in brackets): `riv-01` (Harbour Lunch), `rai-03` (Umbrella Weather),
`gal-02` (Opening Night), `mtn-04` (Hut Supper), `stu-03` (Runway Rehearsal), `vin-01` (Jumble Sale).

## 1. First launch and the `riv-01` tutorial (all sizes)

- [ ] Boot screen shows the badge and title, then Home. Fonts are Playfair Display on titles and DM Sans on body text.
- [ ] First launch starts the guided tutorial on `riv-01`: five steps (client acknowledged, Tops tab opened, first placement, look complete, Finish look). Each step advances only by the real action.
- [ ] Skipping the tutorial works and it does not return after a reload; finishing it does not return either.
- [ ] Coins start at 40. Only Riviera Summer and Rainy City are open; Gala Night, Mountain Weekend, Studio Avant-garde and Vintage 70s are locked and show the stars needed.
- [ ] How to play (from Home or Settings) opens six pages; every number in its text matches the rest of the game.
- [ ] Rule cards appear once on their challenge before the Brief sheet (nine cards in total) and not again after a reload.

## 2. Every screen

- [ ] Home: hero, Play, Daily Fitting, Closet, Clients, Gallery, How to play, Settings, Credits; coins, streak, "N of 120 stars" and the next-unlock line visible.
- [ ] Chapters: six chapters, accent colours, star counts, locked state with stars needed.
- [ ] Challenges: seven or six rows per chapter, stars per row, later rows locked until the previous one is cleared once.
- [ ] Brief sheet: client portrait, brief line, 2 to 4 rule chips, Start; closing returns to Challenges.
- [ ] Styling: board, tray tabs, rule chips, harmony meter with the 70 mark, Hint, Undo, Redo, Clear, Finish look.
- [ ] Result sheet: stars, rules passed or missed with reasons, harmony breakdown, client line, Retry, Edit look, Next challenge, Save to gallery, Export image.
- [ ] Export sheet: frame picker (Plain, Paper Border, Polaroid, Magazine Cover), preview, Share, Save to device.
- [ ] Daily: today's brief, streak, freezes, Buy freeze, Play.
- [ ] Closet: all 48 pieces by theme; locked themes are grey silhouettes with the stars needed and no names.
- [ ] Clients: six portraits, affinity bars at 3 / 9 / 15 stars, lines unlock per level, payment coins shown.
- [ ] Gallery: saved boards then dashed empty slots numbered up to 24; open and delete work.
- [ ] Settings: Sound effects, Music, Haptics, Reduce motion, High contrast, Credits and licences, Reset progress.
- [ ] How to play (six pages) and Credits: every font and audio file has a source link and licence; the designer art is credited.
- [ ] The Paused sheet on Styling offers Resume, Read the brief again, Start this look over and Leave the board (with a confirmation).

## 3. One challenge per chapter

- [ ] Riviera Summer `riv-01`: complete and finish.
- [ ] Rainy City `rai-03`: a dress-capable set (set B) is playable.
- [ ] Gala Night `gal-02`: needs 12 stars to open (see section 9).
- [ ] Mountain Weekend `mtn-04`: needs 27 stars.
- [ ] Studio Avant-garde `stu-03`: needs 45 stars.
- [ ] Vintage 70s `vin-01`: needs 66 stars.
- [ ] After the last challenge of a chapter is cleared the chapter outro shows and the 40-coin bonus is paid once.

## 4. Every rule family (chip text, met and unmet states, detail line)

Use the challenge named; place pieces until the chip flips both ways.

- [ ] Palette: `palette-warm` and `palette-cool` (`riv-03`, `riv-06`), `max-hues` (`riv-02`), `include-colour` (`riv-06`), `avoid-colour` (`riv-06`, `gal-04`).
- [ ] Era: `era-min` (`gal-05`, `stu-01`) and `era-max` (`vin-01`).
- [ ] Formality: `formality-min` (`riv-05`, `gal-01`) and `formality-max` (`rai-01`, `mtn-01`).
- [ ] Warmth (weather): `warmth-min` (`rai-01`, `rai-03`) and `warmth-max` (`riv-01`, `riv-03`); the total warmth number is shown.
- [ ] Features: `needs-feature` (`riv-01`, `rai-01`); a feature icon or label is visible on the pieces.
- [ ] Budget: `max-spend` (`riv-02`, `rai-05`) and `min-spend` (`gal-02`, `stu-06`); the running total is shown.
- [ ] Must-have piece `include-piece` (`riv-07`, `gal-01`) and must-not piece `avoid-piece` (`rai-07`, `gal-07`); the chip names the piece.
- [ ] Chips read "Not checked yet" until the first piece is placed, then flip live.
- [ ] One-piece rule on a dress (`riv-03` set E, `rai-03` set B): placing a dress clears top and bottom; placing a top or bottom clears the dress.
- [ ] A look with a dress plus a top or bottom is never counted complete.

## 5. Star paths

- [ ] 3 stars: all rules met and harmony 70 or more (use a hint or the chip detail lines to find the polished look) - three filled stars, three-star jingle once, client line for 3 stars.
- [ ] 2 stars: all rules met, harmony below 70 - "on brief" wording.
- [ ] 1 star: a complete look that meets at least half the rules (at least ceil(C / 2) of C) but not all - "presentable" wording.
- [ ] 0 stars: a complete look that meets fewer than half the rules (an empty board never finishes) - no coins, miss sound, client line for 0 stars, no failure screen.
- [ ] Coins: first clear pays 10 plus 5 per star above the previous best; replays at the same or lower stars pay 0 (check the coin counter before and after).
- [ ] Finish look is disabled until every open slot is filled (a line says how many are left).

## 6. Placement: drag, tap and keyboard (all sizes)

- [ ] Drag a tray card to its slot with the mouse; the matching slot shows a solid highlight and other slots a dashed refusal outline.
- [ ] Touch emulation: dragging a card works; swiping on the gaps between cards scrolls the tray.
- [ ] Tap a card, then tap its slot; tap a slot to open its tab.
- [ ] Keyboard: Tab to a card, Enter places it; Enter on a slot selects it or opens its tab; Backspace or Delete clears a focused slot.
- [ ] Wrong-slot drop snaps back with the invalid sound and a toast naming the right slot.
- [ ] Swap: drop a second piece on an occupied slot; the first returns to the tray.
- [ ] Remove, Undo, Redo and Clear all behave and are unlimited; pieces already on the board show "On board" in the tray.
- [ ] Tray tabs for categories the brief does not open are shown disabled.
- [ ] Board layout of an 8-slot challenge (`riv-07`, set G) at 360 x 640: all slots reachable, 88 px slots do not overlap, Finish look stays visible (Q2).

## 7. Hints, coins and streak freezes

- [ ] Hint: opens a confirmation with the price (20 in the campaign, 30 in the Daily), spends coins, makes one piece of a polished look glow and pulses its slot, never places it, never changes the star result.
- [ ] A hint with too few coins is refused with a toast and the coin count unchanged.
- [ ] When the board already matches a polished look the hint says no hint is needed and charges nothing.
- [ ] Streak freeze: Buy a freeze for 25 coins on the Daily screen; "Streak freezes N of 2"; a third purchase is refused.

## 8. Daily Fitting and the device date

Change the date with the OS clock or by overriding the browser date in DevTools (Sensors or a clock extension); reload after each change.

- [ ] Today: the daily brief is generated, can be played, pays 8 / 12 / 16 coins by tier plus 2 x streak days (maximum 14); improving the tier pays only the difference; stars never count toward chapters.
- [ ] Clear the daily, then move the date forward **1 day**: a new brief, streak continues to 2.
- [ ] Move forward **2 days** with no freeze: the streak restarts at 1.
- [ ] Move forward 2 days with 1 freeze held: the freeze is consumed and the streak continues; with a gap of N days N freezes are needed.
- [ ] Move the date **backwards**: no coins, no streak change, no result stored; no error.
- [ ] The same date shows the same brief after a reload (deterministic).

## 9. Unlocks at 12 / 27 / 45 / 66 stars

- [ ] Edit the profile (or play) to 11 stars: Gala Night locked ("1 more star opens Gala Night" on Home); at 12 it opens and 8 new pieces join the closet (24 in total).
- [ ] 27 stars open Mountain Weekend (32 pieces), 45 open Studio Avant-garde (40), 66 open Vintage 70s (48).
- [ ] The Result sheet announces newly unlocked pieces and chapters once, with one chime.
- [ ] The Closet shows locked themes as silhouettes before and the named pieces after.

## 10. Clients and affinity

- [ ] Each client's intro line shows on the Brief; stars lines match the result (3, 2, 1, 0).
- [ ] Affinity levels reach 1, 2 and 3 at 3, 9 and 15 stars on that client's challenges; each level shows a new line and pays 10 coins once.
- [ ] Mireille, Tobias, Dame Ottoline, Priya, Jun and Edie portraits are legible and the name plate has enough contrast.

## 11. Gallery

- [ ] Save a board from the Result sheet: it appears in the Gallery with its stars and challenge name; "N of 24 boards saved".
- [ ] Save 24 boards (edit the profile or repeat): the 25th is refused with a message, nothing is lost.
- [ ] Delete asks for confirmation, removes the board and frees the slot.
- [ ] A 0-star board cannot be saved.
- [ ] Gallery entries survive a reload and open or share correctly.

## 12. Export, frames and share (all sizes)

- [ ] Export image from the Result sheet and from the Gallery: the preview shows the chapter backdrop and the pieces in the selected frame.
- [ ] Plain is free. Paper Border (30), Polaroid (40) and Magazine Cover (60) can be previewed but not shared or saved until bought; buying spends coins and selects the frame; an unaffordable frame is refused.
- [ ] Each of the four frames exports a 1080 x 1350 PNG (save to device, open the file and check text and pieces are crisp and not clipped).
- [ ] Share in desktop Chromium without Web Share files support: the image downloads and the text is copied to the clipboard ("Image saved to your device. Share text sent."), no crash.
- [ ] Share where Web Share with files exists (Chrome on Android or Safari): the system sheet opens with the image.
- [ ] Cancelling the share sheet shows "Sharing cancelled."

## 13. Sound, music, haptics

- [ ] Sound effects toggle: UI taps, pick, place, swap, remove, invalid drop, rule met or broken, look complete, finish, stars, coins, unlock and streak sounds play; off silences them. Judge the balance of volumes (Task 05 note).
- [ ] Music toggle: menu loop on every screen except Styling, style loop on the board, crossfade between them, starts after the first tap, pauses when the tab is hidden.
- [ ] Haptics toggle: desktop browsers do nothing; it must not error. On a phone browser nothing vibrates because the web driver is a no-op; device haptics are covered only on device.
- [ ] Toggles persist across a reload.

## 14. Accessibility and legibility

- [ ] Reduce motion: decorative motion (board, sheets, stars) is removed or shortened; the OS "prefers-reduced-motion" setting has the same effect.
- [ ] High contrast: higher contrast text, thicker outlines, hatching on colour swatches (Q10); all rule chips remain readable.
- [ ] Text legibility at the three sizes: no clipped, overlapping or truncated text on any screen or sheet; touch targets feel at least 44 px.
- [ ] Fonts: no text falls back to a platform font (Playfair Display headings, italic client lines, DM Sans body). DevTools > Network shows the three woff2 files loading; Rendered Fonts in the Elements panel lists only those families.
- [ ] Keyboard only: every screen can be used; focus is visible; sheets move focus inside (the kit does not yet trap Tab, K5).
- [ ] Colour is never the only signal for a rule chip (icon and text as well).

## 15. Offline

- [ ] Load the game once, then DevTools > Network > Offline and reload (if the browser has no service worker the reload may fail; then stop the dev server after load and keep playing in the open tab): play a full challenge, save to the gallery and export - nothing needs the network.
- [ ] The Network tab never shows a request to another origin.

## 16. Save persistence and reset

- [ ] Play, reload, close the tab and reopen: coins, stars, unlocked chapters, closet, gallery, frames, flags (tutorial, rule cards, how to), settings and the daily streak are all kept.
- [ ] Corrupt `dress-rehearsal.profile` (type garbage) and reload: the game starts with defaults and the raw text is kept in the backup key; no crash.
- [ ] Settings > Reset progress asks for confirmation; after confirming the profile is back to 40 coins, no stars, the tutorial returns.

## 17. Layout and visual defects

- [ ] Backdrop crop behind the board at 360 x 640, 390 x 844 and 430 x 932, and inside the four export frames.
- [ ] Piece art at 56 px in the tray and 64 / 88 px on the board; painted pieces next to the code-drawn placeholders (`item-rainy-city-5` Black Rubber Boots, `item-studio-3` White Drape Dress, Q14) look acceptable.
- [ ] Client portrait crop and name-plate contrast on Clients, Brief and Result.
- [ ] Home hero and Boot use the code-drawn drawing (no `key-art`, Q13); decide whether to commission a painted splash.
- [ ] Open questions to judge: Q1 (three stars feel fair), Q2 (8 slots fit), Q8 (two chapters open at the start), Q10 (colour-vision help), Q13 (splash).

## Not covered by this checklist (device only)

- Android hardware back button behaviour, status bar, safe areas and the splash and icon on a real phone.
- Native haptics, native share of an image (Q4), the Capacitor Android and iOS builds (no JDK, Xcode or device was used).
- Q9: whether to drop the `INTERNET` permission.

## Defects (attach screenshots)

| # | Screen and size | What is wrong | Screenshot path | Severity |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## Notes

Date, browser and version, who ran it, anything unexpected:
