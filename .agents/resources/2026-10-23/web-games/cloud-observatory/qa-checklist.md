# Cloud Observatory: owner browser QA checklist

Everything visual, audible and tactile is on this list, because agents never open a browser. Every
step names the screen and the expected result. Mark each section Pass or Fail in the sign-off table
at the end (section 20) and write what you saw in Notes. Known placeholders, deliberate gaps and
risks are listed in `.agents/games/cloud-observatory/assets-index.md` and `open-questions.md`; a
step that names one of them says so.

Machine-checked already (do not re-test by eye): the gzip JavaScript budget (63,346 bytes against
307,200), font, audio and art byte budgets, contrast of every text pair, 44 px hit rules in the
stylesheet, accessible names on every screen at three progress points, no `NaN` or `undefined` text,
the no-network source audit, save round trip, 8 hours of simulation in about a second. See
`08/README.md` in this folder for the numbers.

## 1. Setup

1. From the repo root run `bun install` (once), then
   `cd apps-games/cloud-observatory && bun run dev`. The dev server uses port 4013 and fails
   loudly if the port is taken (`strictPort`). Open `http://localhost:4013`.
2. Use Chrome on desktop with DevTools open, device toolbar on, a custom device of 390 x 844
   (portrait). Also try 320 x 640 for the small-phone checks and 412 x 915 for a large phone.
3. If you have an iPhone, also open the dev URL in Safari on it (same Wi-Fi, the server listens on
   all interfaces). Safari on desktop is a fair substitute.
4. Clearing the save: DevTools > Application > Local Storage > the dev origin > delete the key
   `cloud-observatory.profile` (and any other key that starts with `cloud-observatory`), then reload.
   Expect: the Title shows only "New Journey" (no Continue button).
5. Production-like check: `bun run build && bun run preview` (also port 4013) and repeat sections
   2 and 18 there. The `?devspeed=60` flag below only works on the dev server.

Expected: no red errors in the console on load. Record any yellow warnings in Notes.

## 2. First launch and Title

1. Fresh profile, reload. Expect a navy page with the key art (the keeper's house under a night
   sky), the title "Cloud Observatory" and a single "New Journey" button.
2. Every visible letter is in Cormorant Garamond (titles, big numbers) or Manrope (everything else).
   Select a few words and check DevTools > Computed > Rendered Fonts. No Times, Arial, Helvetica,
   system-ui or San Francisco anywhere. Watch the first second for a flash of another font.
3. The key art is crisp, the lower buttons sit on the quiet dark band and stay readable.
4. Tap New Journey. Expect the Observe tab. Reload: the Title now shows Continue and New Journey.
5. Continue returns to your game. New Journey asks before erasing anything.

## 3. Onboarding

1. Reset the save (section 1 step 4). Start a new journey. Expect coach mark 1: "Tap the sky to
   gather starlight." with a Skip tips control.
2. Tap the sky 3 times. Expect coach mark 2 once you hold at least 15 starlight: "Open the Build tab
   and buy a Brass Telescope."
3. Buy the telescope. Once a constellation is affordable, coach mark 3 points to the Atlas. Open a
   constellation: coach mark 4, "Tap the numbered stars in order." Four marks, in that order, each
   disappearing when its action is done and never returning on reload.
4. Reset again, and press Skip tips on the first mark. No more marks appear in this journey.
5. How to Play > "Show the tips again": the marks run again from mark 1.
6. How to Play has 4 pages (Gather and Build, Chart the Sky, The Eclipse, The Comet and the
   Journal), Previous/Next/Done work, each diagram looks like its caption.

## 4. Observe and Gather

1. Tap the sky. Expect an immediate small reward pop, a soft sound and the starlight counter
   rising by the per-tap value. Holding the pointer does not auto-repeat.
2. Hammer the sky for 5 seconds. Sound stays pleasant (it is limited to 8 per second); the page
   stays responsive.
3. The header shows starlight and a per-second readout. After buying a telescope the readout
   rises. Numbers read as: 999, 1.00K, 12.3K, 1.00M, 1.00B and so on (3 significant figures).
   Use `?devspeed=60` or a late-game save to reach thousands, millions and billions and check the
   suffixes never overlap their neighbours at 320 px width.
4. The next-goal hint under the sky names a real goal and updates when you reach it.
5. The Comet button appears only after the first constellation is charted.

## 5. Build

1. Open the Build tab. Expect a list of instruments, locked ones obviously locked (not hidden
   behind a blank card) and showing what unlocks them.
2. Quantity selector: buy x1, x10 and Max. Costs and the affordable state update; Max buys the
   most you can afford; a row you cannot afford is visibly disabled.
3. Long-press a buy button: after about half a second it repeats about 4 times a second until you
   release; a normal tap buys exactly once.
4. Upgrade chips appear at 10, 25 and 50 owned of an instrument. Buying one doubles (x2, x2, x3)
   that instrument's output; the per-second readout confirms it.
5. Rows read well at 320 px: no clipped names, prices or chips. Instrument pictures are code-drawn
   placeholders (all 8, see assets-index.md); they should look intentional and consistent.

## 6. Charting

1. Atlas tab: charting the Lyre needs 2 telescopes and 60 starlight. Tap the Lyre card action.
2. A star map opens with 5 numbered stars. The next star has a ring and a number; tap them in
   order. Each correct tap makes a line and a soft sound; the last star completes it with the
   jingle, a summary and a lore toast.
3. Wrong tap: tap star 3 first. Expect a small shake of the map, a miss sound and no progress.
   After a clean run you get the flawless note and achievement.
4. At 320 x 640 every star target is at least 44 px (24 px radius) and comfortable for a thumb.
   Tap just beside a star: it still counts within about 24 px, further away it does not.
5. Chart all 12 constellations over time (use `?devspeed=60`) and look at each drawing: Lyre,
   Crown, Key, Lantern, Whale, Harp, Fox, Archer, Serpent, Ship, Tower, Owl. Each reads like its
   name, lines do not cross awkwardly, no star sits on an edge.
6. Leave a chart half done with Back or close: nothing is charged and nothing breaks.

## 7. Atlas, Journal and lore

1. Atlas shows 12 constellation cards in a grid: charted, ready and locked states differ clearly.
   All 12 emblems are painted art (one shared frame); check they read as a consistent set.
2. Journal tab: 6 chapter cards and 30 entries in all. Locked entries show a hint about what
   unlocks them (an instrument, a constellation or a boon), never a blank.
3. Open an unlocked entry: the reading view is comfortable at 130% zoom, the text is in Manrope
   or Cormorant, the Back control returns to the list. Entries read as a quiet story: check for
   typos, odd line breaks and any word that sounds wrong.
4. Chapter art is painted for all 6 chapters. Judge whether the six vignettes feel like one set
   and whether the caption band at the bottom stays readable. New entries show a "new" marker until read.

## 8. Eclipse

1. Eclipse tab on a fresh game: the Begin button is disabled and says how many more pending shards
   are needed ("Eclipse: need N more pending shards"). It enables at 5 pending shards (about
   5 x 10^9 starlight earned this cycle; use `?devspeed=60`).
2. First time: an introduction explains what resets and what stays. Tap the Begin button: a
   confirmation modal "Begin the Eclipse?" states how many shards you will bank, lists "What
   resets" (starlight, instruments and upgrades, cycle counter) and "What stays" (atlas, journal,
   achievements, comet streak, shards, boons). Cancel changes nothing.
3. Confirm. Expect a dark-disc sequence of about 2.4 seconds with its sound, then the Observe tab
   with starlight, instruments and upgrades reset and the atlas intact.
4. Turn on Reduced motion (Settings) and repeat: the sequence is a still card, no animation, and it
   still ends by itself.
5. Boons grid: 10 boons, costs 1 to 40 shards (105 in all). A boon you cannot afford shows how many
   shards you are missing. Buy one: shards drop, the card shows Owned, and it cannot be bought twice.
6. Start the next cycle and verify effects: Dark-Adapted Eyes starts you with starlight, Brass
   Polish doubles telescopes, Clear Glass lowers costs by 5%, Corona and Totality multiply
   everything. The per-second readout and prices should match what each card promises.

## 9. Pacing feel

Dev builds only: add `?devspeed=60` to the URL to run game time at 60 times real time (production
builds ignore it). Use 1x for the first two checks.

1. First chart: from a fresh start with real-time play, the Lyre should be chartable and charted in
   under 3 minutes (the simulator says 90 seconds). Note your time.
2. Play 20 minutes at normal speed. There should never be a stretch of more than about 6 minutes
   where nothing is worth buying or charting. Note any dead zone and where.
3. At `?devspeed=60`, the first Eclipse (5 pending shards) should appear after about 2.5 to 4 hours
   of game time (the simulator says 2.86 h), which is roughly 3 real minutes at 60x. Note the time.
4. After the first Eclipse and two boons, the second cycle should be clearly faster than the first
   (the simulator says 83.6% of cycle 1). Does it feel better, or just the same?
5. Does the middle (instruments 4 to 8, constellations 5 to 12) feel like a steady climb or a grind?

## 10. Offline

1. Play until you own a few instruments. Close the tab. Reopen after about 5 minutes (or change
   the system clock forward 5 minutes before reopening). Expect a Welcome back sheet: time away,
   "+N starlight", "Your instruments worked at 50% efficiency while you were gone." Away for under
   60 seconds shows no sheet.
2. Repeat with about 3 hours: the gain is about 3 hours x per-second x 0.5.
3. Repeat with more than 8 hours: the sheet adds "Offline progress stops after 8 hours." and the
   gain is capped at exactly 8 hours.
4. After buying Night Watch (75%) or Long Vigil (100%) the sheet reports that efficiency and the
   gain scales with it.
5. The sheet's Continue closes it and the starlight total already includes the gain. Reopening
   immediately shows no second sheet.

## 11. Daily Comet

1. Chart the Lyre. On Observe, the Comet button shows Ready. Open it: "Tap the six stars of
   tonight's comet in order." Trace all six. Expect the reward, the streak and a jingle.
2. The button now says Traced today; opening the screen says "Already traced today".
3. Change the system date to tomorrow and reload: a new pattern, claim again, streak 2, reward
   about 10% higher. Skip a day: the streak restarts at 1. On the 7th consecutive day you receive 1
   bonus Eclipse shard.
4. Move the clock back to an earlier date than your last claim: the screen says "The clock moved
   back" and there is no second claim; the streak is kept.
5. The same date shows the same pattern after a reload (it is seeded by the local date).
6. Restore the real date and time afterwards.

## 12. Achievements and statistics

1. Menu > Achievements: 20 achievements, a count such as "3 of 20 unlocked", locked ones show how to
   earn them. A toast appears when one unlocks, once only.
2. Each achievement adds 1% to production: confirm the per-second readout rises slightly.
3. Menu > Statistics: lifetime starlight, starlight this cycle, time this cycle, best starlight per
   second, sky taps, time observing, constellations charted, flawless charts, Eclipses, pending shards,
   shards earned and spent, comets traced, longest comet streak, offline time and journal entries. Values are plausible and never show NaN or undefined.

## 13. Settings

1. Menu > Settings. Toggles: Sound, Music, Haptics, Reduced motion, High contrast. Each takes
   effect immediately and survives a reload.
2. Sound off: no cue plays. Music off: the loop stops. Both off: silence.
3. Haptics: only testable on an Android phone (the web build does nothing). Expect a short tick on
   buys and stars and a longer pattern on completing a chart.
4. High contrast: all text is parchment on solid navy, borders stronger. Reduced motion also
   follows the device setting ("Reduced motion also follows your device setting").
5. Reset progress: two confirmations ("Reset all progress?" then "Are you sure?"). Only the final
   "Yes, erase everything" erases; the app returns to the Title with no Continue button.

## 14. Audio

1. Nothing plays before your first tap or click anywhere on the page.
2. Cues, one by one: gather (glass tick), buy, upgrade, correct star, wrong star (error buzz),
   chart complete (jingle), lore unlocked, achievement (jingle), Eclipse (low engine rumble about
   2.4 s), comet (pizzicato), UI click, back, welcome back. Each is audible, appropriate and not
   harsh at normal volume. The files were chosen by name and level, never by listening, so swap any
   you dislike (see `src/audio/cues.ts` and `public/audio/LICENSES.md`, open question 13).
3. Music: "Observatory Night", one 153-second ambient loop with 0.6 s fades. Check it starts after
   the first tap, loops, and the seam is not audibly clicky (open question 12).
4. The first tap that unlocks audio is silent by design (open question 14); every later tap sounds.
5. Mute (Sound and Music off) works instantly; switching tabs pauses audio and returning resumes it.

## 15. Accessibility

1. Keyboard: Tab through the Title, each tab, each screen and a chart. Focus order follows the
   visual order, focus is always visible, Enter or Space activates, and the on-screen Back or
   Close control closes sheets (the kit Sheet has no focus trap, a recorded kit follow-up, so note
   anything odd). Stars in a chart are reachable and operable from the keyboard.
2. Screen reader spot check (VoiceOver on iOS or macOS, TalkBack on Android): the tab bar, buy
   buttons, star targets ("Star 3 of 7, next") and big numbers ("1.2 million starlight") are
   spoken sensibly. The starlight live region announces at most every 5 seconds.
3. Browser text zoom 130% (and 200% as a stress): nothing is clipped or overlaps, controls stay
   tappable, lore stays readable.
4. High contrast mode (section 13): every label stays readable on every screen.
5. Motion and flashing: nothing flashes more than 3 times per second at any point; Reduced motion
   removes twinkle, pulse, shake and the Eclipse animation.

## 16. Art

1. All 31 bundled slots are painted art: key art, sky, nebula, hills, building, 12 emblems, 8
   instruments and 6 chapter vignettes. Do they look like one artist's hand? The reviewer noted the
   key art and building are cel-inked and a little crisper than the soft sky (open question 21):
   decide whether the mix is acceptable.
2. The hills layer is bottom-anchored under the Observe tab: no bare sky shows at the sides or bottom
   (taller and wider screens), and the building does not look like it floats away from the ridge. If the shelf and the building do not line up, note the viewport (open question 25).
3. Atlas emblem alignment: the 12 emblems sit on the same grid, same size and baseline, and read
   at 144 px. Instrument icons (112 px) are distinguishable from each other in the Build list.
4. Chapter art and the key art are not badly cropped on tall screens (19.5:9, for example 390 x 844
   and 360 x 800) or short ones (320 x 568).
5. The launcher icon is the accepted painted `icon` (open question 15, closed). The Android adaptive
   foreground is the whole painting at 66% with a feathered edge over a blurred copy: check the dome and
   star read inside round and squircle masks; if too small, ask for a foreground-only variant.

## 17. Save and recovery

1. Play for a minute, hard-refresh: progress is kept (the game also saves every 10 seconds of play, on every
   purchase or chart, and when the tab is hidden).
2. DevTools > Application > Local Storage: edit `cloud-observatory.profile` to invalid JSON, reload.
   Expect a recovery notice ("Your save was damaged, so Cloud Observatory restored what it could.") and a fresh or partly restored game, no blank
   screen and no crash. Dismiss the notice.
3. Edit the value so a number is `"abc"` or negative: the game recovers or sanitises, never shows NaN.
4. New Journey from the Title erases the save after confirmation; the next reload starts fresh.
5. Open the game in two tabs: the later write wins; nothing crashes.

## 18. Performance

1. DevTools > Performance > CPU 4x slowdown, device 390 x 844. Tap the sky quickly, switch tabs,
   open a chart and complete it. No visible jank or dropped frames beyond the occasional blip.
2. Leave the Observe tab running for 10 minutes: memory (DevTools > Memory) stays flat within a few
   MB, no growth trend, CPU near idle between ticks.
3. The console shows no errors or warnings during all of the above.
4. Production check: `bun run build && bun run preview` and load once with the cache disabled.
   The page is interactive within about a second on a fast connection (the bundle is 63 KB gzip).

## 19. Native (owner, later)

Not done by agents: no Gradle, Xcode, emulator or device was ever used. See
`07/README.md` in this folder for the exact commands.

1. `cd apps-games/cloud-observatory && bun run cap:sync`, then `bunx cap open android` (Android Studio
   with JDK 21) and run on a phone. Expect the game to boot past the splash. If it is blank, restore
   the `INTERNET` permission (evidence `07/README.md`, open question 11).
2. Android back button: closes an open sheet or the journal reader first, then pops the screen; from
   another tab it returns to Observe; on Observe it asks whether to leave (Stay keeps the game open);
   from the Title it exits; leaving a chart with Back abandons it without charge.
3. Status bar is light text on the navy background; the app is portrait only; rotating does nothing.
4. The launcher icon (round and adaptive) and the splash (light and dark) look right.
5. Haptics fire (section 13). Share is not offered (no Share feature in v1).
6. iOS: `bunx cap open ios`, set your team, run on a device or simulator. Same checks apart from the
   Android back button.

## 20. Sign-off

| # | Section | Pass / Fail | Notes |
|---|---|---|---|
| 1 | Setup | | |
| 2 | First launch and Title | | |
| 3 | Onboarding | | |
| 4 | Observe and Gather | | |
| 5 | Build | | |
| 6 | Charting | | |
| 7 | Atlas, Journal and lore | | |
| 8 | Eclipse | | |
| 9 | Pacing feel | | |
| 10 | Offline | | |
| 11 | Daily Comet | | |
| 12 | Achievements and statistics | | |
| 13 | Settings | | |
| 14 | Audio | | |
| 15 | Accessibility | | |
| 16 | Art | | |
| 17 | Save and recovery | | |
| 18 | Performance | | |
| 19 | Native (later) | | |

Owner initials: ______   Date: ______   Build (git commit): ______
