# Lost Parcel Desk - open questions

None of these block v1; each has a stated default. After task 08 the open items are owned by the owner
(browser QA or a later step); nothing is left for an agent task in this epic.

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q1 | Is the "two necessary deductions per case" structure deep enough, or do 3-candidate cases feel too small at 5 to 8 minutes? | Keep: difficulty grows with key-and-lock pairs and rule-outs (cases 05 to 12). The owner judges in browser QA; adding a fourth candidate would change the validator, content and art and would be a new task. | owner at QA |
| Q2 | Is the two-witness accusation rule (2 "fits" links) friction or a useful nudge? | Keep as in `product.md`; it is one constant in the core. | owner at QA |
| Q3 | Privacy policy URL for store submission | Not needed in v1 (no submission); a one-page "no data collected" policy is needed later. | owner |
| Q4 | Public name beyond the working title | Lost Parcel Desk stays the public name in v1. | owner, later step |
| Q5 | Are there CC0 sources for the `typewriter` loop and the two music loops? | Task 05 tries Kenney first, then CC0 OpenGameArt pages; if none, the slot ships silent and the answer is recorded here. | task 05 |
| Q6 | Does the iOS Capacitor 8 project need CocoaPods for `cap sync`? | The sibling games ran `cap add ios` and `cap sync` with Swift Package Manager only. Task 07 repeats and records. | task 07 |
| Q7 | Designer art delivery timing | Placeholders are code-drawn; task 06 integrates whatever passed review and keeps placeholders elsewhere. | orchestrator |
| Q8 | Zoom hotspots are authored in code before the art exists. Will a hotspot sit on the right place of the delivered object? | The magnifier shows a code-drawn lens with the clue's detail pictogram and a hotspot disc at a fixed per-object position; the art is not required to depict the detail. If the owner wants hotspots on drawn details, the art briefs and hotspot coordinates are revisited in a follow-up. | owner at QA |
| Q9 | Remove the default Android `INTERNET` permission since the game is fully offline? | Keep Capacitor's default (WebView loader not verified without a device); data safety stays "no data collected". Owner decides after device QA. | owner |
| Q10 | Daily Parcel variety: generated cases are valid but may feel samey (4 facets, 24 templates). | Ship as generated; the owner judges the daily in browser QA. More template objects can be added without touching the rules. | owner at QA |
| Q11 | Do players find the Almanac when a clue seems unfair? | The board and the viewer link to the matching Almanac entry from every clue tag. Owner judges whether it needs a stronger prompt. | owner at QA |

## Kit follow-ups

Found while building task 03 (the kit is read-only for this epic; the workaround lives in this game):

- `SaveStore.update` re-reads and re-parses the stored value on every call, which is wasteful for a save per
  tap. Workaround: the game store keeps the profile in memory, publishes at once and writes the whole
  profile through `update(() => profile)`. A `save`-only fast path or a cached read would help every game.
- The kit has no weekday helper and `streakStep` has no state for "no previous day". Workaround: the game
  derives the weekday from `dayNumber` (the epoch 2026-01-01 is a Thursday, tested against `Date`) and
  passes `first` itself when `daily.lastKey` is null.
