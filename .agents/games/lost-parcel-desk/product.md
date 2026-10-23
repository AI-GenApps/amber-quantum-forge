# Lost Parcel Desk - product

Bite-sized detective stories at a small-town post office. Each lost parcel holds a handful of objects;
read them, pin the clues that matter, and decide which of three townsfolk the parcel belongs to.
Portrait, offline, no accounts, no ads, no purchases, English only, no timers.

## The loop in one minute

1. **Pick a case** from the case files (12 cases in 3 chapters) or open today's Daily Parcel.
2. **Open the parcel**: the case intro shows the torn label and where the parcel was found. Tap to open it.
3. **Inspect** 4 or 5 evidence objects on the desk: tap one to pick it up, flip it to read the back (notes,
   stamps), switch on the magnifier to find small details. Every clue found goes into the clue tray.
4. **Pin and link**: on the deduction board, pin the clues that matter, then link each pinned clue to
   the townsperson it fits, or rule a person out. The board shows three profile cards.
5. **Accuse**: pick the owner. A wrong accusation costs a stamp and returns that person to the sender; the
   case always ends with the true owner and at least 1 stamp.
6. **Reveal**: a short typed reveal explains the deduction, the stamp falls, a ledger fragment of the
   old clerk's flood-night story is unlocked and a place on the town map fills in.

A case takes 5 to 8 minutes. There is no failure state and no time pressure.

## Rules (the spec of record for the core, task 01)

### Cast and logic model

- The cast is 12 townsfolk. Each has an identity (name, trade) and four logic facets: **street**,
  **pastime**, **look**, **pet**. Each facet has 6 values and every value is held by exactly two
  townsfolk, so no single fact names one person. Trade is identity only and is never a deduction.
- A case has exactly three **candidates** (one owner and two decoys), 4 or 5 **evidence objects**,
  a list of **clues** and a list of **deductions**.
- A **deduction** is a logic fact about the owner: `facet is value` (polarity `is`) or `facet is not
  value` (polarity `isnot`, shown to the player as a rule-out). It is supported by one clue
  (`direct`, `rule-out`) or by two clues that only work together (`pair`: a key clue and a lock clue).
- **Case validity (enforced by the content validator and by tests):** exactly one candidate satisfies
  every deduction and it is the owner; every deduction is necessary (removing any one leaves at least
  two candidates satisfying the rest); every lead clue belongs to a deduction; every other clue is
  marked flavour and has no logic effect; every object carries at least one clue; flavour clues and
  object names never use an almanac keyword of a value held by some but not all of the three candidates.

### Evidence, faces and finding clues

- Each object has a **front** and a **back**. A clue sits on one face: `front`, `back` or `zoom` (a
  hotspot on the front, found with the magnifier). Up to three clues per object, at most one per face.
- A `front` clue is found when the object is picked up; a `back` clue when the (already picked-up) object is flipped; a `zoom`
  clue when its hotspot is tapped with the magnifier on. Found clues are listed in the clue tray with
  their tag and a one-sentence text. Nothing is ever lost or hidden twice.
- Clue text on objects is code-drawn (paper note, stamp, label), never baked into art.

### Pins and links

- A found clue can be **pinned** to the board (and unpinned). The board holds every clue of the case.
- A pinned clue can be **linked** to a candidate as `fits` or as `rules out`. A clue has at most one
  link of one kind per candidate and may be linked to all three. Links are the player's notes: the
  game never tells the player whether a link is right, except through the hint and the accusation
  feedback below.
- A key-and-lock pair is linked by linking both of its clues to the same candidate with the same kind;
  the board draws a bracket between them when both are linked.

### Accusation, stamps and score

- **Accuse** needs at least 2 `fits` links on the chosen candidate (the "two-witness rule"). Otherwise
  the button explains how many more are needed.
- Right accusation: the case closes. Wrong accusation: that candidate is stamped "Return to sender"
  and cannot be accused again, one stamp is lost and a feedback line names a found clue that does not
  fit them ("The tannery smell does not fit Priya: she lives on Orchard Close."), or says that an unseen
  clue still rules them out. With two candidates returned, the last one is delivered by elimination.
- **Stamps** for a case = 3 minus the number of wrong accusations (0 wrong = 3, 1 wrong = 2, 2 wrong
  = 1). Stamps are the score; the campaign maximum is 36. Hints never change stamps.
- **Records** per case: best stamps, fastest solve time (informational, paused when the app is in the
  background, never a rule) and hints used on the best run. A replay only raises records. Replaying a
  closed case starts it fresh (clues found, pins and links cleared).

### Hints

- A hint costs postage (campaign 20, daily 15) and reveals a **clue link**: it takes the first
  unresolved deduction (D1 before D2), finds and pins its clues and places the correct links to all
  three candidates (`fits` for each candidate that satisfies the deduction, `rules out` for the
  candidate it excludes), with a one-line explanation. At most 2 hints per case, one per deduction.
- Hints are rejected (nothing charged) when postage is short or both deductions are already resolved.

### Chapters and unlocks

- Case n+1 unlocks when case n is closed. Chapter 2 unlocks at 7 total stamps and chapter 3 at 18
  (a chapter opens when both its stamp threshold is met and the previous case is closed). A closed
  case can be replayed at any time to raise its stamps.
- Closing the fourth case of a chapter shows the chapter outro and pays the chapter bonus
  (`economy.md`). Closing case n unlocks ledger fragment n and fills the place on the town map.
- Total stamps also unlock the 5 desk themes (0, 6, 14, 24, 33) and feed achievements.

## Daily Parcel

- One generated mini-case per local calendar day, seed `dailySeed("lost-parcel-desk", dateKey)` from
  the kit, generated on the device. Same date, same case, on every device and run.
- It uses the same logic model (3 candidates from the 12 townsfolk, 2 necessary deductions) with the
  template bank in `content-plan.md`. A weekday ladder sets the object count, the deduction kinds and
  the flavour count: Mon and Tue 3 objects direct + direct; Wed 4 objects; Thu and Fri 4 objects with a
  rule-out; Sat 5 objects with a rule-out; Sun 5 objects with two rule-outs.
- Same rules as a campaign case (accusation, stamps, hints at 15 postage). Daily stamps never count
  towards the 36 campaign stamps or unlocks.
- Streak: +1 per day with a daily clear; missing a day resets it unless a streak freeze is used. A
  device clock that moves backwards never advances or breaks the streak (kit `streakStep`). Rewards:
  `economy.md`.
- The generator is proven over 365 dates by test: every date validates with the shipped validator.
- Generation (task 03): `generateDaily(seed, weekday)` draws a plan (owner, the two decoys, two facets, which
  template side each clue uses, the neutral flavour lines, object order and faces) with the core PRNG. The
  decoys are chosen by construction so that deduction 1 rules out exactly one decoy and deduction 2 the other
  (a direct deduction needs the other decoy to be the owner's partner on that facet; a rule-out takes the
  target decoy's own value). Every attempt is checked with `analyseCase` and the flavour hygiene; up to 12
  attempts (`fork("attempt-N")`), then one of 14 committed fallback plans (2 per weekday, picked by
  `seed mod 2`). Daily clues sit on the front or back of an object (no magnifier hotspots), one clue per
  object. Object glyphs for the task 04 pictograms: street bag / cloth, pastime tin / card, look glove /
  paper, pet box / ticket, rule-out notes paper, flavour per line (`FLAVOUR_POOL`).
- Saving: one in-progress case at a time (`profile.session`, campaign case id or daily date key). Starting
  another case replaces it. Closing a case clears the session; the reveal screen reads the closed state
  the game store keeps in memory.

## Screens

1. **Boot** (fonts and listed art with progress; the audio preload starts on the first user gesture).
2. **Home, "The Desk"**: Continue / Case files, Daily Parcel (with streak), Town map, Almanac,
   Achievements, Settings; a desk scene with the postage and stamp counters.
3. **Case files**: the 12 case folders by chapter, with lock state, best stamps and records.
4. **Case intro**: parcel closed, torn label, found-at line, Open parcel.
5. **Evidence table**: the 4 or 5 objects laid out on the desk, a clue-tray count, Board button.
6. **Object viewer**: flip, magnifier with hotspots, clue list for this object, previous and next object.
7. **Deduction board**: pinned clues, 3 profile cards, link menu (fits / rules out), hint, accuse.
8. **Reveal**: accusation result, typed reveal, falling stamp, ledger fragment, Next, Replay, Share.
9. **Town map**: 12 places that fill in as cases close.
10. **Almanac**: clue vocabulary (24 entries) and the Townsfolk Book (12 profiles, unlocked when met).
11. **Ledger**: the 12 fragments of the flood-night story.
12. **Daily Parcel**: today's case, streak, freezes with a buy button, last 14 days.
13. **Achievements**: 12 badges.
14. **Records**: best stamps, fastest time and hints per case; totals.
15. **Desk themes**: 5 themes with stamps needed; apply.
16. **Settings**: sound, music, haptics, reduced motion, high contrast, reset progress with confirm.
17. **How to play** (6 pages) and the mechanic cards.
18. **Credits and licences**.

Sheets and overlays: accuse confirm, hint confirm, wrong-accusation note, pause, exit confirm, reset
confirm, chapter intro and outro, mechanic card, achievement toast.

## Controls

- Tap an object to pick it up; the flip button (or a horizontal swipe) turns it; the magnifier button
  toggles hotspot mode, where small glowing discs (visible outline, 48 px hit area) can be tapped.
  There is no pinch requirement: everything needs only taps.
- Clue tray: tap a clue to pin or unpin it. Board: tap a pinned clue, then tap a profile card to open
  the link menu (Fits, Rules out, Remove link). Dragging a clue chip onto a card does the same.
- Accuse: select a profile card, press Accuse, confirm.
- Keyboard: Tab order follows the visual order; arrow keys move between objects, chips and cards; Enter
  activates; F flips, M toggles the magnifier, P pins, L opens the link menu, H asks for a hint, A
  accuses. Every action also has a visible button. This is required for the happy-dom tests.
- Android back: closes sheets, then leaves the viewer, then the board, then climbs the router stack.

## Onboarding

First launch plays the 6-step guided tutorial on case 01 (`content-plan.md`). The four mechanic cards
(Look closer, The deduction board on case 01; Key and lock on case 05; Rule-outs on case 06) show once,
before the case starts. How to play can be reopened from Home. Flags are saved so nothing repeats.

## Accessibility

- Body text 16 px minimum, labels 14 px minimum; text contrast 4.5:1 and non-text UI 3:1 (token table
  below, verified by a unit test in task 04).
- Every button, tray chip, hotspot and toggle has a hit area of at least 44 x 44 CSS px
  (`--wg-hit-min: 44px`; hotspots 48 px).
- Colour is never the only signal: link states show a tick or a cross and the words "Fits" and "Rules
  out"; returned candidates show text and a stamp; hotspots show an outline and a number in magnifier mode.
- Every evidence face has a text equivalent (caption and clue text) in the DOM and an ARIA live
  summary of the board ("Odalie: 2 clues fit, 0 rule out"), so the case is playable without seeing the art.
- Reduced motion (system and in-app) removes the flip, the stamp fall, the typewriter and parallax;
  faces swap instantly and the reveal text appears at once.
- High contrast thickens outlines and hatches linked cards (a pattern as well as a colour).
- Fonts: Courier Prime (display and clue text) and IBM Plex Sans (body), both OFL, bundled.

## Art-bible palette (design tokens)

1970s post-office cosy-noir, risograph print: limited palette, visible grain and slight misregistration.

| Token | Hex | Use |
|---|---|---|
| ink | #1c2330 | text on light, outlines, rubber-stamp ink |
| night | #141a22 | app background, night desk |
| cream | #f3e9d2 | paper, cards, text on dark |
| cream-2 | #e4d6b4 | secondary paper, label |
| mustard | #d9a21b | blotter, highlights, accent on dark |
| mustard-deep | #7a5200 | warning text on cream |
| mustard-light | #f0cf7a | pins, hotspot glow, lamp light |
| teal | #1f7a7a | fills only (never carries text) |
| teal-deep | #135a5c | fits links, confirm buttons, text surfaces |
| teal-light | #8fd0c8 | highlights on dark |
| brick | #a8382a | rules-out links, "Return to sender" stamp |
| brick-deep | #7d2519 | error text, pressed brick |
| line | #8a7a52 | hairlines and card borders (non-text) |

Measured contrast: ink on cream 13.06, ink on cream-2 10.94, cream on night 14.49, cream on teal-deep
6.58, cream on brick 5.33, cream on brick-deep 8.09, cream on mustard-deep 5.73, ink on mustard 6.86,
ink on teal-light 9.02, ink on mustard-light 10.44, mustard on night 7.61, teal-light on night 10.02,
mustard-light on night 11.59, line on cream 3.49 (non-text only). Teal on cream is 4.22 and ink on teal
is 3.09, so teal is used for fills and large decoration only.

## Share text

Campaign: `Lost Parcel Desk - Case 04 "Small Print and Smaller Batteries": 3/3 stamps, no hints.`
(with hints: `2/3 stamps, 1 hint.`). Daily: `Lost Parcel Desk Daily 2026-10-23: 2/3 stamps. Streak 5.`
Shared through the kit `shareContent` (no URL in v1).

## Non-goals for v1

Ads, purchases, accounts, leaderboards, multiplayer, user-made cases, localisation, landscape,
cloud save, notifications, voice acting, a timer or any time-based penalty.
