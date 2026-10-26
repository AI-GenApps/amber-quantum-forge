# Lost Parcel Desk - owner browser QA checklist

Written in task 08 of epic 24. Agents never run this list: no agent opened a browser, device or emulator while building
the game. Everything below was verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome); what a human
sees is unverified until you tick it.

## How to run

```
cd /Users/ashutosh/Dev/W3DevMobile/amber-quantum-forge   # or the merged checkout
bun install
bun run --filter '@web-games/lost-parcel-desk' dev       # http://localhost:4016
```

Open the page in a desktop browser with the device toolbar (or a resized window) at each of these viewports and repeat the
"every screen" section at least once per size:

- [ ] 360 x 640 (small Android)
- [ ] 390 x 844 (iPhone 14)
- [ ] 430 x 932 (large iPhone)

Fresh state: DevTools > Application > Local storage > clear the origin (or use Settings > Reset progress). Tick an item
only when it behaves as written. Put every defect in the table at the end.

## 1. First launch and the case 01 tutorial

- [ ] The boot screen shows "Sorting the mail..." with a progress indicator, then the Home screen. No flash of unstyled text.
- [ ] Home shows 0 of 36 stamps and postage 30.
- [ ] Music starts only after the first tap or key press (browser autoplay rules) and plays softly.
- [ ] Case files: only chapter 1 is open; chapters 2 and 3 are locked with a sentence naming the stamps needed (7 and 18).
- [ ] Open case 01 "The Seaside Postcard": the torn parcel label and "Found at: Ferry Landing" show; "Open parcel" starts it.
- [ ] The mechanic card "Look closer" appears first (once), then "The deduction board" card; "Got it" dismisses each.
- [ ] Coachmark step 1 of 6: "Tap the parcel to open it", with a glow on the parcel; it advances only when you do it.
- [ ] Step 2 scarf (glow on the knitted scarf), step 3 magnifier and the glowing spot, step 4 pin, step 5 link as "Fits", step 6 link one more clue then accuse.
- [ ] Tapping something other than the highlighted target does not advance a later step.
- [ ] "Skip tutorial" ends it for good; after reload it does not return. Reset progress brings it back.

## 2. Every screen

Visit each screen at all three viewports. For each: nothing is cut off, nothing overlaps, the Back button works, touch
targets are comfortable, and the text is readable (see section 14).

- [ ] Boot
- [ ] Home (menu entries: Case files, Daily Parcel, Town map, Almanac, Ledger, Achievements, Records, Desk themes, How to play, Settings, Credits and licences; Continue appears while a case is in progress)
- [ ] Case files (3 chapters, lock states, best stamps, "Read the chapter story")
- [ ] Case intro (label, found-at line, best stamps, Open parcel or Resume parcel, locked case message)
- [ ] Evidence table (4 or 5 objects, clue tray count, Deduction board button, pause)
- [ ] Object viewer (front and back, magnifier, clues on this object, previous and next object, "Object n of N")
- [ ] Deduction board (pinned clues, 3 townsfolk cards, link menu, Hint, Accuse)
- [ ] Reveal (rubber stamp animation, headline, returned-to-sender line, postage, share)
- [ ] Town map (12 places around the post office, filled and locked states)
- [ ] Almanac (Clues tab and Townsfolk tab, "Townsfolk (n of 12)")
- [ ] Ledger (Mr. Hobb's ledger, sealed and found fragments)
- [ ] Daily Parcel (today's bag, streak, freezes, last 14 days)
- [ ] Achievements (12 badges)
- [ ] Records (totals and per-case table)
- [ ] Desk themes (5 themes, Apply)
- [ ] Settings (Sound, Music, Haptics, Reduce motion, High contrast, How to play, Credits and licences, Reset progress)
- [ ] How to play (6 pages, Previous and Next)
- [ ] Credits and licences (fonts, audio rows with sources, art)
- [ ] Pause sheet ("Paused": Resume, Settings, Leave the case) and the "Leave this case?" confirmation

## 3. One case per mechanic

Use the case numbers; play each to its reveal. A case is closed once delivered (at least 1 stamp).

Direct clues (one clue says the owner has a trait):
- [ ] Case 01 The Seaside Postcard (owner Odalie Fenn)
- [ ] Case 02 The Biscuit Tin Hymnal (owner Barnaby Crumb)
- [ ] Case 03 The Barometer in a Hat Box (owner Winifred Pike)
- [ ] Case 04 Small Print and Smaller Batteries (owner Cosmo Vane)

Key-and-lock pairs (two clues only work together; the "Key and lock" card shows on case 05; a bracket joins the pair on the board):
- [ ] Case 05 The Pressed Wren (Marguerite Oake)
- [ ] Case 07 A Note from the Back Row (Priya Lowell)
- [ ] Case 08 The Cane Tip and the Cat (Hettie Bloom)
- [ ] Case 09 Domes and Door Keys (Iggy Marsh)
- [ ] Case 12 The Piano Tuner's Key (Ambrose Quill)

Rule-outs (a clue says who it is not; the "Rule-outs" card shows on case 06):
- [ ] Case 06 Cinders in the Cake Box (Dennis Gault)
- [ ] Case 10 The Knight Without a Board (Tobias Thimble)
- [ ] Case 11 The Lamp That Wasn't Lit (Rosalind Kettle)

The five-object finale:
- [ ] Case 12 shows five evidence objects (every other case shows four) and all five can be opened, flipped and magnified.

Check in every case: each case can be solved with the clues shown; no clue text contradicts the picture; every flavour clue
is harmless (no accusation depends on it); the reveal names the right owner; the ledger fragment and the town place unlock.

## 4. Stamp paths

- [ ] 3 stamps: accuse the right person first time. Reveal says "3 of 3 stamps", headline "Delivered with a flourish".
- [ ] 2 stamps: accuse a wrong person once, then the right one. The wrong note says "{name} is not the owner" and shows "Stamps left on this case: 2". Reveal says 2 of 3, "Delivered, after a second look".
- [ ] 1 stamp: two wrong accusations, then the right one. Reveal says 1 of 3, "Delivered, eventually".
- [ ] Elimination: after the second wrong accusation the last candidate is delivered by elimination; the reveal says the other two were returned to sender. 1 stamp.
- [ ] A person already returned to sender cannot be accused again ("has already been returned to sender").
- [ ] The accuse confirmation warns "A wrong accusation costs a stamp".

## 5. The two-witness rule

- [ ] With 0 "Fits" links on a person, Accuse is refused with "Two clues must fit {name} before you can accuse. 2 more needed (now 0)."
- [ ] With 1 "Fits" link the message says 1 more is needed (now 1).
- [ ] With 2 "Fits" links the accusation confirmation opens.
- [ ] A "Rules out" link does not count toward the two.

## 6. Flip, magnifier and hotspots

Use case 01, the knitted scarf (it has a zoom clue):

- [ ] Tapping an object on the table picks it up into the viewer; "Turn over" shows the back (notes, stamps) and "Turn back" returns.
- [ ] The magnifier toggle shows the glowing spots ("Magnifier is on: n places to look"); tapping a spot finds a clue and adds it to the tray with a sound.
- [ ] A found clue shows under "Clues on this object"; an object with nothing found says so.
- [ ] Previous and next object buttons move through the objects; "Object n of N" is right.
- [ ] Keyboard: Tab reaches every control, Enter and Space activate hotspots, Escape or Back leaves the viewer.

## 7. Pin, unpin, link, rule-out, remove link

- [ ] Pin a clue from the viewer or the tray; it appears on the board under "Pinned clues". Unpin removes it (and its links).
- [ ] On the board, tap a pinned clue, then tap a person: the link menu "Link {tag} to {name}" offers Fits, Rules out and Remove link.
- [ ] Fits and Rules out each show on the card summary ("1 fit, 0 rule out").
- [ ] Choosing the other kind on the same link changes it; Remove link deletes it.
- [ ] Trying to link with nothing selected gives a short hint ("Select a pinned clue first" or "Select a person first") and never a crash.
- [ ] The Almanac button on a clue tag opens the matching Almanac entry.

## 8. Hints and postage

- [ ] Hint button on the board: "Buy a hint?" shows the price (20 postage in a campaign case, 15 in the Daily Parcel) and your balance.
- [ ] Buying pins the clues of one deduction and draws the correct links; postage drops by exactly 20 (or 15); no stamp is lost.
- [ ] At most 2 hints per case; the third shows "No hints left on this case".
- [ ] With too little postage the sheet says how much more is needed and does not charge.
- [ ] A hint on a deduction that is already worked out is refused without charging.
- [ ] Streak freeze: the Daily Parcel screen sells one for 30 postage, up to 2 held; a third says you already hold 2.
- [ ] Postage totals: 30 at the start; closing case 01 with 3 stamps pays 25 (10 + 15); replaying it with 3 stamps pays 0; the fourth case of a chapter adds a 40 bonus once.

## 9. Chapter unlocks and replay

- [ ] Chapter 2 stays locked until you hold 7 stamps and case 04 is delivered; the Files screen says how many stamps you have.
- [ ] Chapter 3 stays locked until 18 stamps and case 08 is delivered.
- [ ] "Read the chapter story" opens the chapter intro sheet; completing a chapter shows its outro and the 40 postage bonus on the reveal.
- [ ] Replay a 1- or 2-stamp case from the reveal ("Replay for more stamps") or the files screen and raise it; the stamp total and the "Second Look" achievement update.
- [ ] A replay that does not beat the best leaves stamps and postage unchanged.

## 10. The Daily Parcel

On today's date:
- [ ] The Daily Parcel screen shows today's bag ("n items in today's bag", 3 to 5 depending on the weekday) and "Open today's parcel".
- [ ] The daily plays like a case; its objects are code-drawn pictograms; it can be solved.
- [ ] Delivering pays postage (5, 7 or 10 plus the streak bonus), the streak becomes 1 and the history strip shows today with its stamps.
- [ ] "Play again" earns no postage and does not change the streak.
- [ ] Reloading the page the same day shows the same parcel.

Device date moved forward (change the system clock, then reload; undo it afterwards):
- [ ] +1 day: a new parcel is offered; delivering it makes the streak 2 and pays a larger streak bonus.
- [ ] +2 days after a delivery (one missed day) with no streak freeze: delivering restarts the streak at 1.
- [ ] Repeat with one streak freeze held: the streak continues and the freeze count drops by one.
- [ ] A gap of two missed days with one freeze resets the streak; with two freezes it continues and both are used.

Device date moved backwards:
- [ ] Setting the clock to yesterday after a delivery changes nothing: no postage, no streak change, no crash.
- [ ] Returning the clock to today restores normal behaviour.

## 11. Almanac, Townsfolk Book, ledger, town map, themes, achievements

- [ ] Almanac Clues tab: 24 entries in four groups (street, pastime, look, pet), each with a "Look for" line.
- [ ] Townsfolk tab: people you have met show portrait, trade and four facts; others read "Not met yet". The count "n of 12" matches.
- [ ] Ledger: a fragment unlocks with each first delivery (the "New" badge shows once); sealed fragments name the case that opens them.
- [ ] Town map fills in one place per delivered case; locked places say so; tapping a filled place shows its case.
- [ ] Desk themes: Mustard Riso is open; Teal Blotter at 6 stamps, Brick Ledger at 14, Midnight Sorting Room at 24, Gold Rubber Stamp at 33. Apply recolours every screen and survives reload. A locked theme cannot be applied.
- [ ] Achievements: 12 badges; earning one shows a toast once. First Delivery, Clean Sheet, Unaided, Sharp Eyes, Stamp Collector (12 stamps), Daily Habit (streak 3) and A Week at the Desk (streak 7) are the easiest to trigger.
- [ ] Records: totals and the per-case table agree with what you played.

## 12. Share

- [ ] On the reveal, Share in a desktop browser (no native share sheet) copies the result text to the clipboard and shows "Shared." or a clear fallback message; it never throws.
- [ ] The text names the case and the stamps ("Lost Parcel Desk - Case 04 ...: 3/3 stamps, no hints.") and carries no URL.

## 13. Sound, music, haptics

- [ ] Sound off silences every effect; on restores them. Taps, pins, links, flips and the stamp thud each have a sound.
- [ ] Music off stops the loop; on resumes it. Music changes (cross-fades) between the desk screens and the deduction board.
- [ ] The typewriter loop runs only while the reveal text types.
- [ ] No audio plays before the first user gesture and none keeps playing after leaving the page.
- [ ] Listen for clipping, harsh levels, loop seams and any slot that sounds wrong (all sounds were chosen without listening; open question Q16).
- [ ] Haptics toggle exists; in a desktop browser it has no visible effect and nothing breaks (device vibration is a device-only check).

## 14. Reduced motion, high contrast, legibility, fonts

- [ ] Reduce motion (Settings, or the OS setting): the rubber stamp, flips and sheets appear without travelling animation; nothing is required to be seen moving.
- [ ] High contrast: backdrop images disappear, text and controls are crisp, focus outlines are obvious on every screen.
- [ ] All text is Courier Prime (display, clue text, stamps, labels) or IBM Plex Sans (body, buttons); none looks like Times, Arial or a platform default. Check the Boot screen before fonts settle and after a hard reload.
- [ ] Body text is at least comfortable to read at 360 x 640; clue text, tags and prices never truncate without a way to read them.
- [ ] Focus order and visible focus work with the keyboard on Home, Files, Table, Viewer and Board.
- [ ] Text zoom to 150 percent (browser zoom) keeps the layout usable.

## 15. Offline, persistence, resume and reset

- [ ] Build and preview (`bun run --filter '@web-games/lost-parcel-desk' build`, then `... preview`, also port 4016), open it once, then DevTools > Network > Offline and reload: the page loads and plays. No request leaves the page for any other host (check the Network tab on a fresh load).
- [ ] Progress (stamps, postage, themes, ledger, daily results) survives a reload.
- [ ] Leave a case half done (pins and links placed, a hint bought) and reload: Home shows Continue; Resume parcel restores found clues, pins and links, hints used and the timer position.
- [ ] Settings > Reset progress asks "Reset all progress?"; "Erase everything" returns the game to the fresh state (stamps 0, postage 30, tutorial returns); Cancel changes nothing.
- [ ] Corrupt the saved value by hand in Local storage: the game starts clean without a blank screen (the broken value is kept in a backup key).

## 16. Not covered by this browser pass

- Android hardware Back button and the system back gesture (device only, open question Q22). The in-game exit confirmation "Close the game?" is built but only a device shows it.
- Haptic feedback, the status bar colour, the splash and the launcher icon (Q21), the iOS safe areas and Ogg playback in Safari or iOS WKWebView (Q15).
- Store screenshots, signing and submission (out of scope for v1).

## 17. Defects

Attach screenshots under `.agents/resources/2026-10-23/web-games/lost-parcel-desk/qa/` (file name = the row id).

| # | Screen / case | Viewport | What happened | Expected | Screenshot |
|---|---|---|---|---|---|
| D1 | | | | | |
| D2 | | | | | |
| D3 | | | | | |
| D4 | | | | | |
| D5 | | | | | |

Verdict: [ ] ship as is  [ ] ship after the fixes above  [ ] needs another design pass
