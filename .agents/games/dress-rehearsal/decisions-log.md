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
