# Dress Rehearsal - open questions

None of these block v1; each has a stated default. Tasks append their own notes under "Task NN
notes" as they work.

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q1 | Are the harmony weights and the three-star bar of 70 fun in practice? (Prototype: three stars is rare in late chapters, 0.01 to 1.4 percent of complete looks.) | Values in `product.md`; hints (20 / 30 coins) and the live harmony meter guide the player. Tasks 01 and 02 may adjust a weight if a challenge cannot be proven, logging it. | tasks 01, 02, owner at QA |
| Q2 | Do 8 slots plus a 6-to-12-piece tray tab fit a 360 x 640 screen with 88 px slots and 44 px targets? | Tray tabs scroll horizontally, the board scales; the owner judges in browser QA at 360 x 640, 390 x 844 and 430 x 932. | owner |
| Q3 | Privacy policy URL for store submission | Not needed in v1 (no submission); a one-page "no data collected" policy is needed later. | owner |
| Q4 | Native image share: sharing a PNG from the Capacitor WebView needs `@capacitor/filesystem` (write a cache file, pass its URI to `@capacitor/share`), which is not in the frozen dependency set. | v1 shares text through the kit and the image through the Web Share API with files, or a download link, in a browser; on device it falls back to text. | owner / orchestrator (dependency decision) |
| Q5 | Public name beyond the working title | Dress Rehearsal stays the public name in v1. | owner, later step |
| Q6 | Which CC0 sources exist for `export-shutter` and the two music loops? | Task 05 searches Kenney first, then OpenGameArt pages that state CC0; a slot with none ships silent and is recorded here. | task 05 |
| Q7 | Designer art delivery timing (63 slots in six batches) | Placeholders are code-drawn; task 06 integrates whatever passed review and keeps placeholders elsewhere. | orchestrator |
| Q8 | Rainy City is open from the first launch (the starting closet is 16 pieces). Is a free choice between chapters 1 and 2 acceptable? | Yes (`decisions-log.md` D5); both are gentle. Revisit if the owner prefers a strict chapter order with a bigger first closet. | owner at QA |
| Q9 | Remove the default Android `INTERNET` permission since the game is fully offline? | Keep Capacitor's default (WebView loader not verified without a device); data safety stays "no data collected". Owner decides after device QA. | owner |
| Q10 | Colour-vision: is the high-contrast mode enough, or does the colour wheel need patterns on swatches beyond the planned hatching? | Swatch plus name everywhere and hatching in high contrast. | owner at QA |
| Q11 | Hats are scarce (4 of 48 pieces) and the starting closet has one. Is that acceptable for 6-slot challenges that open the hat slot? | Yes: the tutorial challenges that use hats have one hat and tune the other slots; the Daily ladder only opens hats when a hat exists. | task 02 |
| Q12 | Prices in dollars for a global audience | Dollar sign kept (in-fiction, not a currency). Could become plain numbers later. | owner |

## Kit follow-ups

The kit stays read-only for this epic. Known at planning time:

- K1. `shareContent` has no `files` support. Image sharing is done inside the game with the Web
  Share API (see Q4); a kit helper `shareFile(blob, ...)` would let every game reuse it.
- K2. `registerFonts` supports `style: "italic"` (confirmed in `fonts.ts`); nothing needed.

## Task 00 notes

- The prototype in `.agents/resources/2026-10-23/web-games/dress-rehearsal/00/prototype/` is
  JavaScript and not part of the build; tasks 01 and 02 port its rules and data to TypeScript and
  must reproduce its numbers (the `content-plan.test.ts` and `proof` tests compare them).

## Task 01 notes

- No constant or rule changed; `product.md`, `economy.md`, `content-plan.md` and `decisions-log.md`
  are untouched. The core reproduces the prototype: riv-01 24 of 72, riv-02 9 of 72, rai-03 4 of 16,
  and all 14 starting-closet proof rows of `content-plan.md`.
- API choices the spec left open (tests pin them): `SLOT_SETS` keeps the `content-plan.md` listing
  order while `openSlots` returns board order; `missingSlots` on a dress-capable set with an empty
  base reports `top` and `bottom`; a dress together with a top or bottom is a conflict, not a
  complete look; `livePreview` is honest on a partial board (rules that hold vacuously, such as
  "Nothing navy", show as met on an empty board, so the UI may want to hide chips until the first
  piece is placed); `ruleDetail` takes an optional third argument with the piece name for
  `include-piece` and `avoid-piece`; the solver counts one visit per complete look it scores.
- Hint solver speed: about 0.8 microseconds per complete look in Node, so the 400,000 cap costs
  roughly a third of a second there; expect several times that on a phone.

## Task 02 notes

- No binding number changed; `content-plan.md` is the contract and `test/content-plan.test.ts`
  parses it, so the data and the document cannot drift apart silently.
- All 40 challenges reproduce the prototype's proof counts (looks and three-star looks) exactly in
  the TypeScript engine; the whole exhaustive proof runs in about 2 seconds in Node (limit 60).
- The committed reference look per challenge is the prototype's choice (most pieces from the
  chapter's own theme, then highest harmony, then lowest price); the list is in
  `.agents/resources/2026-10-23/web-games/dress-rehearsal/02/README.md`.
- Q11 stays as decided: hats are scarce, so the six-slot sets that open the hat slot (A, B) only
  appear where the starting closet's single hat (the sun hat) is enough; the proofs confirm it.
- Task 03 (daily fallbacks) and task 04 (UI) can import everything through
  `@web-games/dress-rehearsal-core` (`CHALLENGES`, `PIECES`, `closetFor`, `CLIENTS`, `CHAPTERS`,
  `RULE_CARDS`, `TUTORIAL_STEPS`, `validateContent`, `proveChallenge`).

## Task 03 notes

- No number in `economy.md` changed; `test/economy.test.ts` and `test/daily-rewards.test.ts` read
  the source and sink tables from the document and compare them with the constants, and a perfect
  campaign replay pays exactly 1460 coins including the 40 grant.
- Wording changed (not a number): the Daily brief frame is "{Client}: {rule}, ..." (D12 in
  `decisions-log.md`, `product.md` updated).
- API choices the spec left open (tests pin them): `applyCampaignResult` ignores unknown challenge
  ids and does not enforce challenge unlocks (the UI gates play with `challengeUnlocked`);
  `applyDailyResult` takes the kit `StreakStep` as a plain string plus `missedDays` (the app
  computes both with `streakStep` and `daysBetween`) and ignores the step on the very first
  clear; purchases and frame selection return `{ ok: false, reason }` instead of throwing, as
  does `saveToGallery` (`GALLERY_FULL`, `NO_STARS`, `BAD_ENTRY`); `sanitizeProfile` returns null
  when a top-level field has the wrong type (the kit then recovers with defaults and writes the
  raw text to the backup key) and drops bad entries inside collections.
- Core change outside the task list: `validateChallenge` takes an optional `briefMax` so generated
  Daily briefs (120 characters) pass the same structural checks as campaign briefs (90).
- Kit follow-ups: none needed. `createSaveStore.update` re-reads storage on every call, so the app
  game store treats storage as the source of truth and keeps the in-memory state in sync after
  each awaited write; if a write fails the in-memory result is kept and `saveFailed` is set.
- Q11 still holds: the Daily generator skips attempts whose slot set needs a category the closet
  lacks (a closet without hats uses the committed fallback for that day).

