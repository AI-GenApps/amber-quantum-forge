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
(open question Q5).

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
