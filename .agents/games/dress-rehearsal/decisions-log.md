# Dress Rehearsal - decisions log

Dated entries. All dates 2026-10-23 (planning day, task 00 of epic 23).

## 2026-10-23 - Owner decisions (final, from `.claude/workflows/web-games-v1-args.json`)

1. Full v1 for all six web games (complete loop, full content, progression, local save, reviewed
   art, custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android and iOS projects). No
   store submission.
   Rationale: ship a finished product per game and decide store steps later.
2. Two waves after the kit; Dress Rehearsal is in wave 2 with The Last Window and Lost Parcel Desk
   (epic 23).
3. No monetization: soft currency and unlocks only, no ads, no IAP, no accounts, no network.
   The economy leaves room for IAP later.
4. QA is browser-only and done by the owner at the end. Agents run no browser, device or emulator,
   build no APK, install no JDK. Verification is Vitest (happy-dom), tsc, vite build and Biome.
5. Stack: TypeScript, Vite, Preact, Vitest, Capacitor 8. DOM, SVG and Canvas 2D. No engines.
6. Structure: `apps-games/dress-rehearsal` (app) and `apps-games/dress-rehearsal-core` (headless
   rules); shared code in `apps-games/web-kit`.
7. Portrait, offline-first, local save only (Preferences on device, localStorage on web),
   versioned with migrations; daily seeded from the local date and generated on device.
8. Graphics only from the MobileGamesDesigner thread after strict review; fonts OFL (Playfair
   Display, DM Sans); audio CC0 only.
9. The working title is the public name for v1.
10. Every game ships on its own branch and PR (`feat/web-dress-rehearsal`), merged by the
    orchestrator.

## 2026-10-23 - Design decisions

### D1. Flat-lay board with eight slot kinds and a one-piece rule

The spec says 6 to 8 slots on a flat-lay board with no body or mannequin (which removes layer
alignment). Eight slot kinds: top, bottom, dress, outer, shoes, bag, hat, accessory. A challenge
opens 6 to 8 of them (seven slot sets A to G). A dress replaces top and bottom when both options
are open.
Rationale: one item per slot keeps the board legible at 360 px width and makes every constraint a
pure function of at most 8 pieces, so exhaustive proofs are cheap.

### D2. Stars: presentable, on brief, polished

0 = incomplete or fewer than half the rules met, 1 = complete with at least ceil(C / 2) rules met,
2 = every rule met, 3 = every rule met and harmony >= 70. An empty board therefore scores 0.
Rationale: the spec asks for "1 to 3 stars with clear feedback" and "no trivially full-marks empty
board"; completeness is the guard, and each star has a one-line meaning the player can read.

### D3. Sixteen rule kinds

Palette (warm, cool, hue limit, include colour, avoid colour), era (min, max), formality (min,
max), weather (warmth min, max, needs feature), budget (max, min spend) and pieces (include,
avoid). Features are waterproof, shade, sparkle and sturdy (a small extra tag beyond the
spec's colour, era, formality, warmth, price, category so that weather and terrain briefs can name
a real garment property).
Rationale: covers every constraint family in the spec (palette, era, formality, weather, budget,
must and must-not pieces) with rules that are explainable in one chip and checkable by value.

### D4. Harmony formula and the three-star bar at 70

Colour scheme 40 + neutral anchor 10 + dress code 20 + era match 15 + season sense 15 = 100. The
first draft used steeper steps (awkward pair 16, busy trio 12, analogous trio 34, more than three
colours 0, dress-code spread 2 / 3 giving 10 / 0, era span 2 / 3 giving 7 / 0, warmth spread 2 / 3
giving 8 / 0) and a bar of 80. The prototype over the 48 pieces showed that with that bar only 4 of
72 complete six-slot looks in the starting closet could reach it, and none of the 160 eight-slot
looks. The shipped steps are the ones in `product.md` (awkward pair 20, busy 16, analogous trio 36,
more than three colours 4, spread 3 giving 6, 4 and 4) and the bar is 70.
Rationale: the score must be generous enough that three stars is reachable by careful play in
every chapter, and strict enough that colour clashes, mixed eras and mixed dress codes cost real
points, each shown with its own reason.

### D5. Starting closet of 16 pieces (two chapters open at the start)

Riviera Summer and Rainy City are both open from the first launch, so the starting closet has 16
pieces: top 3, bottom 3, dress 1, outer 2, shoes 2, bag 2, hat 1, accessory 2. The spec's "theme
unlocks by stars" applies to the other four chapters.
Rationale: 8 pieces (one theme) with 6 open slots allow at most 4 distinct looks (the maximum
product of slot choices for 8 pieces over 6 slots), which is not a puzzle. With 16 pieces the
six-slot sets have 72 looks and the first challenges can be solved several ways.

### D6. Chapter unlocks at 12, 27, 45 and 66 stars

Gala Night 12, Mountain Weekend 27, Studio Avant-garde 45, Vintage 70s 66.
Rationale: the share of already-available stars needed is 29 percent (12 of 42), 43 percent
(27 of 63), 54 percent (45 of 84) and 65 percent (66 of 102): a ramp that a player averaging
two stars per challenge clears without grinding, while three-star play is rewarded early.

### D7. Every challenge is proven inside the closet that exists when its chapter unlocks

The prototype enumerates all complete looks for each challenge with the closet of its own chapter
and earlier ones (16, 16, 24, 32, 40, 48 pieces). Larger closets only add options, so the proof
holds for every player. Tightness caps per chapter (share of complete looks that earn three
stars): 35 percent in chapters 1 and 2, 5 percent in chapter 3, 2 percent in chapters 4 to 6, and
at least 2 three-star looks everywhere (prototype maximum shares: 33.33, 25.69, 4.09, 0.36, 1.41
and 0.01 percent).
Rationale: the spec demands a validator proving at least one three-star solution per challenge and
no trivially full-marks board; the caps stop a challenge from being solved by chance, and the
minimum of 2 keeps hints from revealing a single forced answer.

### D8. Clients and affinity

Six clients: Mireille Vasseur (travel writer), Tobias Okafor (storm photographer), Dame Ottoline
Frost (opera patron), Priya Raman (mountain guide), Jun Aoki (gallery curator), Edie Lindqvist
(vintage shop owner). They have 7, 7, 7, 7, 6 and 6 challenges and appear across chapters (every
chapter has at least three different clients). Affinity levels at 3, 9 and 15 stars pay 10 coins
each and unlock a line; each client has 8 original lines (`content-plan.md`).
Rationale: "client affinity" in the spec needs a visible effect without a new currency; thresholds
stay below each client's 18 or 21 available stars.

### D9. Economy numbers

Starting grant 40; first clear 10; 5 per new best star; chapter bonus 40; affinity 10 per level;
Daily 8 / 12 / 16 plus a streak bonus of 2 x min(streak, 7); campaign total 1460. Hints 20
(campaign) and 30 (daily); streak freeze 25 (max 2); frames Paper Border 30, Polaroid 40, Magazine
Cover 60.
Rationale: same shape as the sibling web games (clear pays once, stars pay the improvement, daily
is small and streak-capped) so the economy can be tuned together; frames give coins a cosmetic
sink tied to the share feature in the spec. Garment prices in dollars are fiction numbers for
budget rules, not a currency.

### D10. Daily Fitting is generated from a seed look

The generator draws a random complete look with harmony >= 70, derives candidate rules that look
satisfies, filters rules that are not trivial (at least 20 percent of 300 random looks fail each),
and keeps the combination if at most 10 percent of the sample reaches three stars. The seed look is
the reference solution, so a three-star look exists by construction and is re-checked with the
real scoring function. Prototype over 365 dates from 2026-01-01 for each of the five closet levels
(16, 24, 32, 40, 48 pieces): 10 fallbacks for the 16-piece closet (2.7 percent) and none for the
larger ones, average 1.0 to 2.2 attempts. The shipped test allows at most 18 fallbacks (5 percent)
per closet level and uses 7 committed fallback templates (one per weekday).
Rationale: no search over up to 316,224 looks is needed per date, the test runs quickly, and
solvability does not depend on a lucky seed.
Task 03 result: the TypeScript generator (core PRNG with one fork per attempt) reproduces the
prototype counts exactly: 10 fallbacks at 16 pieces (9 Mondays, 1 Thursday), 0 at 24, 32, 40 and
48 pieces; attempts per generated date: median 1, maximum 12 / 11 / 3 / 5 / 3 by closet level.

### D12. Daily brief wording

The daily brief is "{Client}: {rule}, {rule} and {rule}." instead of "{Client} needs ..." because
chips such as "Wear the Camel Trench Coat" or "Spend at most $330" do not read after "needs".
It is capped at 120 characters with two shorter variants (short client name, compact phrases);
campaign briefs stay hand written with the 90 character cap.

### D11. Hints use a bounded solver

A hint looks for a three-star look that contains every piece already on the board (at most 400,000
visited looks), and falls back to the stored reference. It only reveals one piece and never places
it.
Rationale: a hint that contradicts the player's progress is a bad hint; the bound keeps it fast.

### D12. Gallery of 24 boards, stored as data

Entries are the slot-to-piece map plus metadata, not pixels; images are re-rendered by the export
code. Cap 24, oldest not auto-deleted (the player chooses).
Rationale: keeps the save small (about 24 x 200 bytes) and makes the export frames free to
improve.

### D13. Export and share

Export is a Canvas 2D render at 1080 x 1350 px with four frames. Share uses Web Share with files
where available, a download link otherwise, and always the kit `shareContent` for the text. Native
file sharing from the Capacitor WebView needs `@capacitor/filesystem`, which is not in the frozen
dependency set; recorded as `open-questions.md` Q4 and a kit follow-up (K1).
Rationale: the spec says "export the finished board as an image via canvas and share it"; this
delivers it in the browser and degrades cleanly on device without a dependency change.

### D14. Fonts: Playfair Display and DM Sans (OFL)

Playfair Display variable roman for headings and an italic for client lines; DM Sans variable for
body. Both confirmed in `github.com/google/fonts/ofl/` on 2026-10-23. Subset to Latin plus the
punctuation used, `opsz` of DM Sans pinned at 14.
Rationale: spec fonts; an editorial serif and a clean sans match the fashion-illustration
direction and read well at the 14 and 16 px minimums.

### D15. Palette and contrast

14 palette tokens plus six chapter accents (`product.md`). The hairline token was darkened from
`#8c7b64` (2.82 on linen, below the 3:1 non-text bar) to `#78674f` (3.76 on linen). Star gold only
appears with an ink outline because it is 2.62 on paper. Accents are used on paper or linen only,
never on night.
Rationale: all text pairs >= 4.5:1 and UI pairs >= 3:1 as required by the accessibility rules.

### D16. Art plan: 63 slots, 256 px pieces

B1 four anchors (icon, key-art, item-riviera-1, backdrop-studio); B2 to B5 the other 47 pieces
(12, 12, 12, 11); B6 six client portraits, five backdrops and the feature graphic. Pieces are
1024 x 1024 masters shown at 128 CSS px, so the runtime WebP is 256 x 256; clients 3:4 masters
1536 x 2048 shown at 180 x 240 CSS px, runtime 360 x 480; backdrops and key art 2:3 masters
1600 x 2400, runtime 800 x 1200. Same scale rules for every category (`assets-index.md`).
Rationale: spec batches; sizes keep the runtime art well under the 8 MB budget (expected under
2 MB).

### D17. Audio plan: 24 sounds and 2 loops

Slots chosen so every game event has a sound (pick, place, swap, remove, invalid, rule met, rule
broken, complete, finish, three star sounds, miss, hint, coin, unlock, streak, shutter, frame,
UI). Sources are Kenney packs first and explicit-CC0 pages second; any slot with no CC0 source
ships silent.
Rationale: spec rule (CC0 only, never synthesised).

### D18. Identity and ports

App id `app.w3dev.dressrehearsal`, dev and preview port 4015 (already in the skeleton), save key
`dress-rehearsal.profile`, settings game id `dress-rehearsal`.

### D19. Prototype kept as evidence

The rules prototype, the 48 pieces, the 40 challenges, the proof counts, the reference looks and
the daily-generator experiment are archived in
`.agents/resources/2026-10-23/web-games/dress-rehearsal/00/prototype/` so tasks 01 to 03 port
proven numbers instead of rediscovering them. It is throwaway JavaScript, not shipped code.

### D20. Task order and verification

Tasks 01 to 08 run in order (core rules, content, progression, screens, audio and onboarding,
art, packaging, release readiness). Every code task passes the four verification commands; no
task needs a browser, device or emulator.

## 2026-10-24 - Task 04 (screens, tokens, fonts, accessibility)

### D21. Fonts as shipped

Playfair Display keeps its whole `wght` axis (400 to 900) in a regular and an italic file; DM Sans
is instanced with `opsz` pinned at 14 and `wght` limited to 400 to 700. Subset to the planned
range, converted to woff2 with an ephemeral `uvx` fonttools run (no project dependency). Sizes
48,444, 48,120 and 23,844 bytes (120,408 in total, limits 120 KB each and 300 KB). Commands and
hashes: `.agents/resources/2026-10-23/web-games/dress-rehearsal/04/README.md`.
Rationale: the planned files, and the smallest set that covers display, italic client lines and body.

### D22. Dark chrome, paper surfaces, three derived tokens

Screens sit on `night`; every card, panel, sheet, tray, meter, rule chip and the board are paper or
linen surfaces that re-declare the kit text, border and focus tokens (`paperTokens`). Primary
buttons are star gold with ink text and an ink border (ink on star 5.56). Chapter accents appear on
paper and linen only (band of a chapter card, hint outline, drop target, client badge), never on
night. Three tokens outside the 14 art-bible tokens exist only for the dark chrome and are checked
in the contrast test: `#26201d` and `#322a26` for dark surfaces and `#a08c6e` for borders on night
(4.33 to 5.43). The focus ring is star gold on night and `focus` blue on paper because `focus` is
2.73 on night. The 18 garment fill colours (one per colour tag) are swatches, not UI tokens.
Rationale: meets the 4.5 and 3 contrast bars for every pair without changing the palette.

### D23. Board layout: three columns, dense placement, tall dress cell

The open slots flow onto a three-column grid in the order hat, accessory, bag, outer, top, dress,
shoes, bottom (`src/board/layout.ts`). The dress cell is two rows tall, so in the full set it sits
next to the top and bottom cells and spans their two rows (sets E to G); in the dress-only set B
it is simply a tall cell. Empty grid cells are left empty. The export image uses the same cells.
Tray tabs of categories the brief does not open are shown but disabled.
Rationale: slots stay at least 88 x 88 px at 360 px width (3 x 88 + 16 gap fits the 328 px
content width) and one layout function serves the screen, the thumbnails and the export.

### D24. Rule chips wait for the first piece

While the board is empty the chips show a neutral "Not checked yet" state (dashed border, document
icon) instead of met, because rules that hold vacuously (for example "Nothing navy") would read as
met before any piece is placed (task 01 note). From the first piece on, chips show met or unmet
with a check or cross, the rule text and the detail line. The harmony meter shows 0 of 100 on an
empty board; with one piece it is the core's live preview (a single neutral piece scores 94).

### D25. Hints are checked before they are bought

The solver runs first; if nothing is left to reveal (the board already matches a polished look)
no coins are spent and a toast says so. Otherwise the price is paid, the tab switches to the hint
category, the piece card and its slot get a pulsing outline and the live region announces it.

### D26. Finish look keeps its name; Brief lives in the styling screen

The Finish look button always reads "Finish look" (disabled until complete) with a line under it
("5 slots left to fill" or "Every slot is filled."). The Brief sheet opens when the styling screen
opens and can be reopened from the header or the pause sheet; leaving from it never asks to
confirm. Retry empties the board; Edit look closes the result and keeps the pieces; leaving a look
that was already finished does not ask for confirmation.

### D27. Export and share flow

The export sheet previews any frame, but only owned frames can be shared or saved: a locked frame
shows "Buy this frame for N coins" and selecting an owned frame persists the choice. Frames are
buttons with `aria-pressed` inside a fieldset. Share order: Web Share API with the PNG and the
share text when `canShare({ files })` allows; otherwise the PNG is saved as a download and the
share text goes through the kit `shareContent` (clipboard or share sheet); a cancelled file share
stops without a download. "Save to device" only downloads. Every failure ends in a message in the
sheet, never an exception, and an export is counted (stat) only when an image was shared or saved.
Daily boards store no client, so their gallery export uses the headline "Daily Fitting" and the
date.
Rationale: product.md D13 asks for the text through the kit in every case; a successful file share
already carries the text in the same share.

### D28. Garment drawings are one shape list per category

Each of the eight categories is a list of path and circle shapes in a 100 x 100 box with paint roles
(main, shade, light, ink); the SVG components and the canvas export both read the same list (a
small M, L, Q, C, Z path parser feeds the canvas). Accessories are drawn as one necklace-style
piece whatever their name. Bounding boxes follow the scale rules in `assets-index.md` within a few
units (tested).

### D29. Navigation and sheets

Routes: `boot`, `home`, `chapters`, `challenges {chapter}`, `styling {challengeId | daily}`,
`daily`, `closet`, `clients`, `gallery`, `settings`, `howto`, `credits`. Sheets (brief, result,
export, pause, hint, confirm) are kit sheets that push a back interceptor while open. Back order:
open sheet, then "Leave this look?" if pieces are on an unfinished board, then pop. At the root the
kit exit hook asks "Leave Dress Rehearsal?".
