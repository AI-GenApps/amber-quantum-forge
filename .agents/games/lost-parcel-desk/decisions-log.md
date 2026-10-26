# Lost Parcel Desk - decisions log

Dated entries. All dates 2026-10-23 (planning day, task 00 of epic 24).

## 2026-10-23 - Owner decisions (final, from `.claude/workflows/web-games-v1-args.json`)

1. Full v1 for all six web games (complete loop, full content, progression, local save, reviewed art, custom
   OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android and iOS projects). No store submission.
   Rationale: ship a finished product per game and decide store steps later.
2. Wave 2 after the kit (with The Last Window and Dress Rehearsal); Lost Parcel Desk is epic 24.
3. No monetization: soft currency and unlocks only, no ads, no IAP, no accounts, no network.
4. QA is browser-only and done by the owner at the end. Agents run no browser, device or emulator, build no
   APK, install no JDK. Verification is Vitest (happy-dom), tsc, vite build and Biome.
5. Stack: TypeScript, Vite, Preact, Vitest, Capacitor 8. DOM, SVG and Canvas 2D. No engines.
6. Structure: `apps-games/lost-parcel-desk` (app) and `apps-games/lost-parcel-desk-core` (headless rules);
   shared code in `apps-games/web-kit`.
7. Portrait, offline-first, local save only, versioned with migrations; daily modes seeded from the local
   date and generated on device.
8. Graphics only from the MobileGamesDesigner thread after strict review; fonts OFL (Courier Prime, IBM Plex
   Sans); audio CC0 only.
9. The working title is the public name for v1.
10. Every game ships on its own branch and PR, merged by the orchestrator.

## 2026-10-23 - Design decisions

### The logic model: facets, candidates, deductions
Twelve townsfolk each have four logic facets (street, pastime, look, pet), six values per facet, every value
held by exactly two people. A case shows three candidates. A **deduction** is a fact about the owner (`is` or
`is not` a value) backed by one clue or by a key-and-lock pair of clues. Rationale: the spec demands "exactly
one owner consistent with the clues" and "every clue is necessary or flavour"; with three candidates at most two
deductions can be necessary (each must be the sole reason one decoy is out), so the model is built around two
necessary deductions per case, each of which can be made of one or two clues. That gives 2 to 4 lead clues per
case and lets difficulty grow through pairs and rule-outs instead of through more candidates.

### Trade is identity, not a facet
Every person has a unique trade, which would rule out both decoys at once and make every other clue
redundant. Trade is therefore shown on the profile card and in the reveal text but never used in a
deduction, and no object points at a trade (a film can for the projectionist is avoided).

### Pairing structure that guarantees necessity
For owner O the decoy B shares a fact with O that the second deduction rules out in C, and C shares a fact
with O that the first deduction rules out in B. Each decoy matches one decisive fact and fails the other,
which is exactly the condition that makes both deductions necessary. All 12 cases were checked by script
during planning (unique owner, both deductions necessary, flavour clean).

### Flavour clues are real flavour
A flavour clue has no logic effect and, by validator rule, never uses an almanac keyword of a value that
some but not all of the three candidates hold (so no flavour clue secretly separates the candidates). They
carry atmosphere, the flood-night story and the cosiness. 37 of 70 clues are flavour.

### Key-and-lock pairs and rule-outs
Three deduction kinds: direct (one clue, 12), key-and-lock pair (two clues on two objects that only mean
something together, 9) and rule-out (a clue that says who the owner is not, 3). Chapter 1 uses only direct
clues; chapter 2 introduces pairs (case 05) and rule-outs (case 06); chapter 3 mixes them, with case 09 and
case 12 made entirely of pairs. This gives a real difficulty ramp inside a short case format.

### Deduction board: link, not guess
The player pins clues and links each one to a candidate as "fits" or "rules out". Links are private notes: the
game never validates them live, otherwise trying every link would solve the case. Accusing requires two "fits"
links on the accused card (the two-witness rule) so blind guessing is slower than reading, and the wrong
accusation feedback names a found clue that does not fit the person.

### Stamps = 3 minus wrong accusations; no failure state
Spec: "wrong guesses cost a stamp". With three candidates at most two accusations can be wrong, so stamps are
3, 2 or 1 and the last candidate is delivered by elimination. A case always ends with the truth; the
satisfying reveal is never withheld. Hints do not cost stamps (they cost postage), consistent with the other
web games.

### Hint = reveal a clue link
Spec: "hints reveal a clue link". A hint takes the first unresolved deduction, finds and pins its clues and
draws the correct fits / rules-out links with a one-line explanation. At most 2 per case. Prices 20 (campaign)
and 15 (daily) postage.

### One currency: postage
Postage is earned by closing cases (10 first close + 5 per stamp gained, max 25 per case), a 40 chapter bonus
and the daily; it is spent on hints and streak freezes. Campaign total 450 including a 30 grant. Rationale:
the same shape as the sibling games (one soft currency, two sinks, nothing farmable), with room for a later
postage-pack IAP.

### Chapter unlocks by stamps: 7 and 18
Case n+1 opens when case n is closed; chapters also need 7 (chapter 2) and 18 (chapter 3) total stamps. 7 of
12 asks for about 1.75 stamps per case; 18 of 24 asks for 2.25. This encourages replaying early cases to
raise the stamp count, which uses the spec's "replay with best score".

### Daily Parcel (generated mini-case)
The spec lists no daily mode, but the owner decision says daily modes are generated from the local date and
task 03 is "progression, economy, daily mode, versioned save". The daily is a short generated case (3 to 5
objects, direct and rule-out deductions only, under 3 minutes) built from a template bank and the same 12
townsfolk, proven by the validator over 365 dates. Daily objects use code-drawn pictograms, so the daily needs
no new art slots. Daily stamps never count towards campaign unlocks.

### Evidence count 49 and the art batches
The spec says B2 to B5 are the "remaining" evidence objects, 12 per batch, after B1's single postcard: so
there are 49 evidence objects. Cases 01 to 11 have 4 objects and the finale (case 12) has 5, which also lets
the finale carry Mr. Hobb's desk key. The B1 postcard is object 01-1. Zoom hotspots are an overlay in the
object viewer and are not required to match a drawn detail (see open question Q8).

### Meta-story: the flood-night ledger
One light thread: the March 1974 flood scrambled the labels, the old clerk Mr. Hobb saved the mail and wrote a
ledger, and the player is the new clerk. Twelve ledger fragments (lore titles) unlock one per closed case; the
last one hands over the desk. Each person owns exactly one parcel, so the cast fills the town map one place at a
time.

### Achievements pay nothing
Twelve achievements are badges only. Rationale: keeps the economy sums exact (450) and avoids rewards for
daily-only milestones that a campaign player cannot reach.

### Five desk themes (0, 6, 14, 24, 33 stamps)
Cosmetic desk palettes instead of unlocking content, mirroring the other web games. 33 rather than 36 for the
last theme so a near-perfect run is enough.

### No timers
Spec: cases are cosy and short. The only time value is an informational "fastest solve" record, never a rule or
a penalty.

### Palette and fonts
Riso palette of mustard, teal, brick, cream and ink, plus deep, light and night variants (13 tokens). Teal on
cream measures 4.22 and ink on teal 3.09, so teal is used for fills only and teal-deep carries text. Fonts per
spec: Courier Prime (typewriter clue text and stamps) and IBM Plex Sans (readable body); Plex ships as one
variable woff2.

### Audio plan: 27 sounds and 2 loops
Paper, flip, pin, link, stamp and typewriter sounds suit the desk. The typewriter and music loops are the slots
most likely to have no Kenney source; fallbacks are CC0 OpenGameArt pages, otherwise the slot ships silent
(open question Q5, answered in task 05: every slot has a CC0 file).

### Task files follow the sibling epics
Structure, file names, verification commands and commit format copy epic 20 (Floodplain Dispatch) so the
orchestrator can run the same workflow. Game-specific content is in each task's checklist.

### Core engine details settled in task 01
Refinements that keep every number unchanged: a back clue is found by flipping an object that is already open
(picked up); repeating an inspect, flip, pin or identical link is a harmless no-op that returns the same state;
a hint on a deduction that is already resolved is refused as NOTHING_TO_HINT before the 2-hint limit is checked,
so HINT_LIMIT only appears when the player has undone a hinted deduction; a pair deduction is only "proved" by
the wrong-accusation feedback once both of its clues are found; the analyser runs in stages (candidates, then
structure, then logic) so each defect reports its own code, and an unmarked clue that no deduction uses is
reported as FLAVOUR_CLUE_IN_DEDUCTION. The core carries its own sfc32 PRNG (seeded from a 32-bit integer or an
FNV-1a string hash) because it cannot import the kit.

### Content details settled in task 02
No binding number moved (12 cases, 49 objects, 70 clues = 33 lead + 37 flavour, 24 deductions = 12 direct + 9
pair + 3 rule-out, 12 townsfolk, 24 almanac entries). Refinements: the one-line reveal drafts in
`content-plan.md` were under the 200 character minimum, so the plan now carries the shipped 200 to 420
character reveal texts and `test/content-plan.test.ts` keeps plan and code identical; ids are `p01` to `p12`
for townsfolk, `NN` for cases, `NN-k` for objects, `NN-cK` for clues and `NN-D1` / `NN-D2` for deductions;
the almanac keeps the plan keywords verbatim and adds a short `avoid` list per value (stems such as "alto" or
"soot") that only the validator reads; the keyword-hygiene rule covers flavour clue text and tags, and the
names and captions of objects that carry no lead clue, because an object that carries a lead clue may name what
the clue is about (case 09 "Matchbox of foam domes"); since every value is held by exactly two people, a value
is never shared by all three candidates, so every candidate value counts as separating; trade and townsperson
names are barred from clue text, tags, captions and labels but object names keep the plan's wording
("Ferry timetable", "Tailor's ticket"); texts are printable ASCII only so every glyph exists in Courier Prime and
IBM Plex Sans.

### Progression, economy, daily and save details settled in task 03
No number moved (30 grant; 10 first close; 5 per stamp; 40 chapter bonus; daily 5 / 7 / 10; streak bonus
2 x min(streak, 7); hints 20 / 15; freeze 30; 450 campaign total; unlocks 7 / 18 and themes 0 / 6 / 14 / 24 /
33). Refinements: the profile is `lost-parcel-desk.profile` version 1 with no migrations, and
`sanitizeProfile` is the only parse (clamps, strips unknown keys, rejects wrong top-level types, drops a stale
session instead of the whole save, and falls back to the default theme if the stamps do not unlock the saved
one); `ledgerSeen` only keeps closed cases; stats are added when a case closes except `hintsUsed`, which counts
at purchase; history appends on every counted run (campaign replays and every daily result) and keeps the last
50; best time is the fastest of any close, `hintsOnBest` follows the best run (more stamps, then fewer hints).
The core owns the date helpers it needs (`dailySeedOf`, `weekdayOf`, `isDateKey`) so `sanitizeProfile` can
regenerate a saved daily session; a test proves they equal the kit `dailySeed` and a weekday derived from the
kit `dayNumber`. Achievements: Clean Sheet, Unaided and Sharp Eyes can fire on a daily as well as on a
campaign case; Second Look is campaign only. A daily clear is attributed to the date of the puzzle that was
played, so a clock that went back (`clock-went-back`) makes the close neutral but still ends the session.
The game store updates its in-memory model first and saves in the background, so taps never wait for storage;
a failed save sets `saveFailed` and the next good write clears it. Over 365 dates from 2026-01-01 the
generator never needed a fallback (attempts: 316 first try, max 5 tries); the 14 fallback plans are still
tested on their own and for every date with attempts forced to zero.

### Screens, tokens, fonts and accessibility settled in task 04
No binding number moved. Refinements, all recorded because they change what the player sees or what tests pin:

- **Navigation.** Typed routes `boot home files intro table viewer board reveal map almanac ledger daily achievements
  records themes settings howto credits`; a case route carries `{ caseId } | { daily: true }`. Intro replaces itself
  with the table so Back from the table returns to the case files. A correct accusation (or delivery by
  elimination) pops the intro, table, viewer and board and pushes the reveal on whatever lies beneath (Back from
  the reveal lands on the case files, Daily Parcel or Home). Replay starts the case fresh and goes straight to the
  table; Next opens the intro of the next case when it is unlocked.
- **Board interaction.** Tapping a pinned clue selects it; tapping a card always selects the card and, when a clue is
  selected, opens the link menu (Fits, Rules out, Remove link) as a sheet; Accuse works on the selected card. Accuse
  is never disabled: pressing it with 0 or 1 fits writes the two-witness rule and the missing count in a status
  line, and a card that was not chosen asks for one. A wrong accusation opens the Return to sender note (the
  `explainWrong` result written as one sentence, for example "The river-mud grit on the cuff does not fit Ambrose:
  Ambrose is tall.") and returns the card; the accusation that closes the case (right or by elimination) goes
  straight to the reveal. A key-and-lock pair is bracketed in a card's link list once both clues carry the same
  link kind there. The hint (button on the table and on the board) always shows the price and the postage left
  first.
- **Drag and drop is not built.** `product.md` lists dragging a chip onto a card as an alternative; v1 ships the
  complete tap and keyboard path only ("everything needs only taps"). It can be added without touching the core.
- **Keyboard.** F flips, M toggles the magnifier, P pins or unpins, L opens the link menu, A accuses, H asks for a
  hint, left and right move between objects in the viewer, and the arrow keys move focus between objects, tray
  chips, pinned clues and cards (`data-nav`). Shortcuts are ignored inside dialogs and with modifier keys.
- **Almanac links.** Every clue (lead and flavour alike, so the presence of a link tells nothing) has a small book
  button that opens the Almanac clue list. The entry that is highlighted comes from the clue tag: whole vocabulary
  phrases first, then the best weighted word overlap, plus five authored pointers (`02-c2`, `09-c3`, `10-c3`, `12-c2`, `12-c4`, see
  `src/data/almanacOverrides.ts`) for lead clues whose tag shares no word with their entry. `test/almanac-link.test.ts`
  proves all 33 lead clues highlight the entry of their own deduction. Flavour clues highlight whatever matches
  best, or nothing.
- **Townsfolk Book.** A townsperson is met when they were a candidate of a delivered case or of the case in
  progress (including a Daily Parcel in progress).
- **Palette and desk themes.** The 13 art-bible tokens are unchanged. Four derived neutrals were needed to meet the
  contrast rules: muted text `#3d4658` on light desks and `#d6cdb4` on dark desks, a raised dark surface `#252e3d`
  and a functional border `#6e6040` (the art-bible `line` is 2.92 on cream-2 and stays a decorative hairline). The
  five desk themes are keyed by the core ids; the three light desks keep cream-2 as the app background with cream
  paper and take their accent from mustard-deep, teal-deep or brick-deep (cream text), the two dark desks use night
  with an ink surface and a mustard or mustard-light accent (ink text). Blotter colours (mustard, teal, brick, ink)
  are fills behind the evidence objects only; every object stands on its own cream paper label.
- **Contrast is enforced by data.** `themePairs(themeId)` lists the 21 pairs a desk theme puts on screen and
  `PAPER_PAIRS` the 19 paper pairs; `test/theme.test.ts` fails on any pair under 4.5 (text) or 3 (UI). It caught
  the brick stamp icon on the night desk (2.72), which is mustard there now.
- **Hit areas.** One shared rule gives every custom control `min-width` and `min-height` of `--wg-hit-min`
  (44 px); kit buttons, toggles and tabs keep 48 px; hotspots are 48 px with inline sizes. `test/a11y.test.tsx`
  measures the stylesheets.
- **Motion.** Reduced motion (system or in-app) removes the flip animation, the falling stamp and the typewriter
  (the full reveal text is on screen at once); the full text is always in the DOM for screen readers.
- **Fonts.** One variable Plex file and two Courier Prime files, 79,884 bytes in total; see `assets-index.md`.
- **How to play** ships six short pages written from the product rules so the screen is useful today; task 05
  replaced the copy and added the tutorial. Credits lists the two font families and, since task 05, the 29 audio
  files; the art list is an empty data file that task 06 extends.
- **Map.** The town is one SVG (six streets, 12 place markers filled when the case is delivered, dashed when locked)
  with a list of 12 real buttons under it for keyboards and screen readers; tapping a marker or a button opens the
  case intro, or says the case is locked.

### Audio, haptics, motion and onboarding settled in task 05

- **Sources.** 26 sounds are Kenney (CC0) files from Interface Sounds, Impact Sounds, RPG Audio, Digital Audio and
  Music Jingles; stereo originals were downmixed to mono Ogg Vorbis (q4), mono ones copied byte for byte. Kenney has no
  Music Loops pack page (404), so `music-desk` (Calm Piano 1 "Vaporware") and `music-case` ("Another August"), both by The
  Cynic Project, and the `typewriter` loop (a keyboard recording from Keyboard Soundpack #1 by unicaegames) come from
  OpenGameArt pages that state CC0. The loops are 45 s and 2.5 s excerpts with a crossfaded tail, not synthesis. No slot is
  silent, so Q5 is closed.
- **Two audio managers.** The sound-effect manager also carries the two music tracks (cross-fade 1.2 s, desk music on every
  screen except the board); a second manager carries the typewriter loop so it can run over the music. The loop runs only
  while a Typewriter is typing and stops on a tap, on completion and on unmount. Both follow the Sound and Music switches
  (the loop follows Sound).
- **One event table.** `src/audio/events.ts` maps 21 game events to a sound and a haptic. Pins, unpins, links, unlinks,
  clue finds, hints and wrong accusations are detected by comparing the open case before and after every store change
  (`boardFeedback`), so pointer, keyboard and hint paths sound the same. Picking up an object, flipping, the magnifier,
  Accuse, the parcel and the reveal are fired by the screens. A hint plays only the hint sound. Buttons with their own sound
  carry the class `lp-own-sfx` (or are chips, objects, hotspots, pin buttons, the magnifier and Accuse) and skip the
  generic tap; sheets play the sheet sound when they open.
- **Haptics.** Exactly the spec: light on pin, link and flip; warning on a wrong accusation; medium on Accuse; success
  on a correct delivery (when the stamp lands), on each earned stamp, on a chapter unlock and on a theme unlock; nothing
  on plain taps, unpins or unlinks. The Haptics switch applies immediately.
- **Reveal timing.** The stamp lands 520 ms after the screen opens (0 under reduced motion), then each earned stamp follows
  140 ms apart (only the last plays the 1, 2 or 3 stamp jingle), then the ledger fragment and map fill, chapter and
  theme unlocks and the streak, 520 ms apart. The achievement toast plays its own sound when it slides in.
- **Motion.** The flip, stamp fall and typewriter moved from CSS keyframes to kit motion helpers (`src/motion/game.ts`):
  pick-up (scale and lift), flip (420 ms), pin drop, link line draw, stamp fall (520 ms with a slight bounce), stamp
  reveal (140 ms stagger), toast slide. Under reduced motion every helper applies its final frame and never calls
  `animate`. The `lp-face--flipping` and `lp-rstamp--fall` classes stay as state markers. The typewriter types at 40
  characters per second (25 ms each) and a tap finishes it.
- **Tutorial.** A pure step machine (`src/onboarding/tutorial.ts`) reads only the open case: step n advances when the
  trigger of step n holds, so a later action never advances an earlier step; steps whose action already happened are
  passed in order. It shows on the case 01 intro, table, viewer and board while the flag `tutorial-done` is unset and case
  01 is not delivered, in a coachmark under the screen (Skip tutorial included), with a glow on the Open button, the scarf,
  the magnifier, the Pin buttons and Accuse. Finishing (a first accusation, wrong or right) or skipping saves
  `tutorial-done`; erasing progress clears it and the tutorial starts again.
- **Mechanic cards.** Shown when the player taps Open parcel on the case listed in `content-plan.md`, one sheet after the
  other, before the case starts; each saves `card-<id>` when "Got it" is tapped, so a card shows once. Look closer and
  The deduction board on case 01, Key and lock on 05, Rule-outs on 06.
- **How to play.** Six pages (The job, The evidence table, The deduction board, Stamps and postage, Pairs and rule-outs,
  Daily Parcel) whose numbers (3 stamps, 2 fits, hints 20 and 15, freeze 30, up to 2 freezes, chapters at 7 and 18, 2
  hints per case) are read from the core constants.
- **Flags used.** `tutorial-done`, `card-look-closer`, `card-the-board`, `card-key-and-lock`, `card-rule-outs` (5 of the
  64 flag slots, alongside the 6 chapter flags).


## 2026-10-23 - Task 06: art integration

- **What shipped.** 63 of the 67 art slots passed the designer review loop and are integrated: 61 runtime WebP files in
  `public/art/` (1,848,678 bytes, 22 percent of the 8 MB budget; the largest is 44,542 bytes) and the `icon` and
  `feature-graphic` as masters only. `key-art`, `evidence-04-3`, `evidence-08-1` and `townsfolk-9` were rejected in the
  final designer round and keep their code-drawn placeholders (open question Q19). Nothing from a rejected delivery is
  committed.
- **Verdict rule.** A slot is integrated only when a quoted line of the copied review note (`art/review/`) says ACCEPT, the
  designer manifest batch and round agree, and the file sits in the inbox `accepted/` folder. One slot, `evidence-09-4`,
  is integrated on the orchestrator's accepted list because its review note has no line for it (Q17).
- **Sizes and quality.** Evidence objects and parcels 560 x 560, busts 360 x 480, scenes 800 x 1200, WebP quality 82 with
  full alpha quality; masters at original size, WebP q90. These numbers are unchanged from `assets-index.md`.
- **Automated checks stand in for visual QA.** Per-slot size and exact aspect, alpha channel, corner and 3 percent border
  alpha 0, opaque coverage 25 to 90 percent, bounding box inside the 90 percent safe area, no animation, no EXIF, caps of
  250,000 bytes (sprites and busts) and 400,000 bytes (scenes), 8,000,000 bytes in total. Two measured exceptions are named in
  `scripts/art-lib.ts`: ten slim objects (13 to 25 percent coverage; minimum 10 percent) and the two tall busts
  `townsfolk-7` and `townsfolk-12` (90.1 percent tall, limit 91 percent, as the art bible puts the head high in the frame).
- **Backdrop.** `desk-backdrop` sits behind the table, viewer and board and `key-art` behind the title and boot screens, as an
  absolutely positioned layer behind the screens, so the layout cannot move when a slot is missing. A scrim of the desk colour
  at 85 percent covers it (80 percent failed muted-text contrast 4.5 on the mustard desk over the darkest backdrop pixel;
  tested for all five desk themes), and high contrast covers it fully. Without art the layer is empty and the screen colour
  shows, which is how the title looks while `key-art` is rejected.
- **Credits.** Two grouped rows: in-game illustrations and icon with the store graphic; author MobileGamesDesigner thread,
  licence owned by the project.

## 2026-10-23 - Task 07: Capacitor Android and iOS projects, icons and splash

- **Projects.** `android/` and `ios/` were generated with `bunx cap add android` and `bunx cap add ios` (Capacitor 8.5.3, iOS
  through Swift Package Manager) and are committed as source files only; build outputs and the synced web copies are ignored by
  the app `.gitignore`. App id `app.w3dev.lostparceldesk`, name Lost Parcel Desk, six plugins (`app`, `haptics`, `preferences`,
  `screen-orientation`, `share`, `status-bar`) and nothing else, equal to the `package.json` dependency list.
- **Icon path.** The launcher icon is the accepted `icon` master (opaque 1024 RGB). The adaptive background is the flat field
  colour `#015f64` measured from the master. The splash is the code-drawn stamp-and-envelope badge on `#141a22` because `key-art`
  is rejected (Q19); `splash.png` and `splash-dark.png` are identical. The style mismatch between icon and splash is Q21.
- **Portrait only.** Android activity `android:screenOrientation="portrait"`; iOS `UISupportedInterfaceOrientations` and the iPad
  variant contain only `UIInterfaceOrientationPortrait`. The kit lifecycle also locks portrait at runtime.
- **Night colour everywhere.** `capacitor.config.ts` sets `backgroundColor` and the status bar (`DARK` style, `#141a22`); the iOS
  launch storyboard background and `UIStatusBarStyle` (light content) follow, and `index.html` already carries `viewport-fit=cover`
  and the `#141a22` theme colour.
- **`android:allowBackup="true"` kept.** The Capacitor default stays: the save is small, local and holds no personal data, so
  restoring it after a reinstall helps the player and exposes nothing. Revisit only if the owner wants a clean install every time.
- **`INTERNET` kept (Q9).** The game makes no network calls but Capacitor's WebView loader is not verified without a device, so the
  default permission stays as the only permission; there is no cleartext flag and no `server.url`.
- **Q6 closed.** `cap add ios` and `cap sync` needed no CocoaPods; nothing was built natively.

## 2026-10-23 - Task 08: release readiness

- **Budgets as tests.** `test/budgets.test.ts` calls the Vite JS API (`build()` into `node_modules/.cache/bundle-check`, silent, no
  public dir), gzips the emitted `.js` files with `node:zlib` and checks the JS total against 300 KB, then walks `public/` for art
  (61 files, 8 MB, any file 400 KB), fonts (3 files, 300 KB) and audio (29 files, 2 MB). It runs in the normal `test` command
  (timeout 60 s); `scripts/check-bundle.ts` prints the same numbers as a table for humans. Release numbers: JS 75.0 KB gzip, art
  1,848,678 bytes, fonts 79,884 bytes, audio 913,216 bytes (all in `assets-index.md`).
- **Audits as tests.** `test/network-audit.test.ts` (the earlier `audit.test.ts`, extended) scans `src/` of the app and the core:
  no `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket` or `EventSource`; no `http(s)://` literal except `data/credits.ts`, whose
  links are only https licence sources on kenney.nl, opengameart.org and github.com; no `Math.random` or `Date.now` in the core, no
  `Math.random` in the app, no `console.log`, no service worker or analytics, no file of 800 lines or more, no `any`.
- **Knowledge base proven against the code.** `test/kb-consistency.test.ts` reads the documents and the code: 12 cases, 3 chapters, 36
  stamps, 49 objects, 70 clues (33 lead, 37 flavour), 24 deductions (12 direct, 9 pair, 3 rule-out), 12 townsfolk, 24 almanac
  entries, 12 achievements, unlock stamps 7 and 18, theme thresholds 0 / 6 / 14 / 24 / 33, postage 450 (30 + 120 + 180 + 120),
  hints 20 and 15, freeze 30, 67 art slots, 27 sounds and 2 music loops, port 4016, app id, the four rejected slots, the measured
  art / font / audio totals and every case index row. No number moved in this task.
- **Open items.** Everything left is a judgement the owner makes in browser or device QA (Q1, Q2, Q8, Q10 to Q18, Q22), a later
  step (Q3, Q4, Q19, Q21), or an orchestrator tooling note (Q20). The four rejected art slots keep their placeholders.
- **No store step, no browser.** Nothing in this task opened a browser, device or emulator. The owner checklist is
  `.agents/resources/2026-10-23/web-games/lost-parcel-desk/qa-checklist.md`.
