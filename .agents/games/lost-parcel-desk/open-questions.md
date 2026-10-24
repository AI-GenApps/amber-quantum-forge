# Lost Parcel Desk - open questions

None of these block v1; each has a stated default. After task 08 the open items are owned by the owner
(browser QA or a later step); nothing is left for an agent task in this epic.

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q1 | Is the "two necessary deductions per case" structure deep enough, or do 3-candidate cases feel too small at 5 to 8 minutes? | Keep: difficulty grows with key-and-lock pairs and rule-outs (cases 05 to 12). The owner judges in browser QA; adding a fourth candidate would change the validator, content and art and would be a new task. | owner at QA |
| Q2 | Is the two-witness accusation rule (2 "fits" links) friction or a useful nudge? | Keep as in `product.md`; it is one constant in the core. | owner at QA |
| Q3 | Privacy policy URL for store submission | Not needed in v1 (no submission); a one-page "no data collected" policy is needed later. | owner |
| Q4 | Public name beyond the working title | Lost Parcel Desk stays the public name in v1. | owner, later step |
| Q5 | Are there CC0 sources for the `typewriter` loop and the two music loops? | Answered in task 05: yes. Kenney has no Music Loops page, so all three come from CC0 OpenGameArt pages (Cynic Project piano and ambient tracks, unicaegames keyboard pack); no slot ships silent. Listening is left to the owner at QA. | closed |
| Q6 | Does the iOS Capacitor 8 project need CocoaPods for `cap sync`? | The sibling games ran `cap add ios` and `cap sync` with Swift Package Manager only. Task 07 repeats and records. | task 07 |
| Q7 | Designer art delivery timing | Placeholders are code-drawn; task 06 integrates whatever passed review and keeps placeholders elsewhere. | orchestrator |
| Q8 | Zoom hotspots are authored in code before the art exists. Will a hotspot sit on the right place of the delivered object? | The magnifier shows a code-drawn lens with the clue's detail pictogram and a hotspot disc at a fixed per-object position; the art is not required to depict the detail. If the owner wants hotspots on drawn details, the art briefs and hotspot coordinates are revisited in a follow-up. | owner at QA |
| Q9 | Remove the default Android `INTERNET` permission since the game is fully offline? | Keep Capacitor's default (WebView loader not verified without a device); data safety stays "no data collected". Owner decides after device QA. | owner |
| Q10 | Daily Parcel variety: generated cases are valid but may feel samey (4 facets, 24 templates). | Ship as generated; the owner judges the daily in browser QA. More template objects can be added without touching the rules. | owner at QA |
| Q11 | Do players find the Almanac when a clue seems unfair? | The board and the viewer link to the matching Almanac entry from every clue tag. Owner judges whether it needs a stronger prompt. | owner at QA |
| Q12 | The IBM Plex Sans `OFL.txt` declares the Reserved Font Name "Plex". The shipped woff2 is a subset with the `wdth` axis pinned, whose name table keeps the upstream family name. Is that acceptable, or should the font be renamed or shipped whole? | Keep as shipped (subsetting and woff2 conversion are ordinary web-font practice, and the glyph outlines are unchanged); the whole variable file is 537 KB, far over the 120 KB budget. The licence text ships beside the files and the family is credited. A rename would be a name-table edit plus one CSS family name. | owner, before any store step |
| Q13 | Dragging a clue chip onto a profile card (listed as an alternative in `product.md`) is not built. | The tap flow and the keyboard flow are complete; drag adds nothing the tests require. The owner decides at QA whether a drag gesture is missed. | owner at QA |
| Q14 | Do the Almanac links feel found? Every clue has a book button, and the entry highlighted comes from the tag wording (33 of 33 lead clues are checked by a test). | Ship as built; flavour clues highlight their best word match or nothing. | owner at QA |
| Q15 | Ogg Vorbis is decoded with WebAudio `decodeAudioData`. Chromium, Firefox and Android WebView decode it; Safari and iOS WKWebView depend on the OS version and this was not verified here. | When a build cannot decode it the kit manager's `load` returns false and the game stays silent without error. Shipping AAC or MP3 twins would break the "Kenney packs ship OGG, no conversion" instruction of task 05, so the owner decides after iOS QA. | owner at QA |
| Q16 | The `typewriter` slot is a computer keyboard recording (Cherry KC 1000), not a mechanical typewriter, and the music and every effect were chosen without listening. | Ship as built; the owner reviews sound, loop seams and levels in browser QA and any slot can be swapped by replacing the file and its `LICENSES.md` row. | owner at QA |

## Kit follow-ups

Found while building task 03 (the kit is read-only for this epic; the workaround lives in this game):

- `SaveStore.update` re-reads and re-parses the stored value on every call, which is wasteful for a save per
  tap. Workaround: the game store keeps the profile in memory, publishes at once and writes the whole
  profile through `update(() => profile)`. A `save`-only fast path or a cached read would help every game.
- The kit has no weekday helper and `streakStep` has no state for "no previous day". Workaround: the game
  derives the weekday from `dayNumber` (the epoch 2026-01-01 is a Thursday, tested against `Date`) and
  passes `first` itself when `daily.lastKey` is null.

Found while building task 04 (worked around inside the game; the kit stays read-only):

- `injectKitStyles()` appends the kit stylesheet at runtime, after the game's bundled CSS, so a game rule with the
  same specificity as a kit rule loses. The game raises specificity (`.wg-btn.wg-btn--danger`) or avoids the clash.
  Loading the kit CSS first, or putting it in a cascade layer, would remove the trap.
- `.wg-btn--danger` and `.wg-btn--primary` both use `--wg-color-accent-text` as the text colour, which cannot be
  correct for a danger fill when the accent is a dark ink-on-gold pair (ink on brick is 2.45). A
  `--wg-color-danger-text` token would help; the game sets the colour itself.
- The toggle thumb uses `--wg-color-text`, which has no contrast guarantee against the accent track. The game
  overrides the thumb with two desk-theme custom properties.
- `.wg-tab` declares `min-height: 48px` but no `min-width` (it relies on `flex: 1`), so a stylesheet audit cannot
  prove the hit width; the game adds `min-width: var(--wg-hit-min)`.
- `mount()` in `ui/testing.ts` is not exported from the kit index; the game tests use `render` and `act` directly.
- `Sheet` has no portal and no back-button hook; the game wraps it (`AppSheet`) with a router back interceptor.

Found while building task 05 (worked around inside the game; the kit stays read-only):

- `applyFinalFrame` writes the last keyframe as inline style and keeps it after a full-motion animation ends. A
  transform frame therefore replaces any transform the element already had (the rubber stamp's tilt, the toast's
  `translateX(-50%)`). The game puts the tilt inside its keyframes and animates the toast with the independent
  `translate` property. A kit option to skip the inline write after a finished animation would help.
- `Button` accepts only `class`, `onClick`, `disabled` and a few props, not arbitrary attributes, so the game marks buttons
  with their own sound through a class (`lp-own-sfx`). Spreading `data-*` attributes would be cleaner.
- `AudioManager` has one music slot, so a loop that must run over the music (the typewriter) needs a second manager.
  The game owns two; a second named music channel in the kit would remove that.

