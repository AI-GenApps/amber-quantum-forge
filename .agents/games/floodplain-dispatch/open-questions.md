# Floodplain Dispatch - open questions

None of these block v1 tasks 01 to 08; each has a stated default.

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q1 | Are the balance constants (flow caps, 6-step thresholds, tide formula) fun in practice? | Values in `product.md`. Task 01 and 02 may adjust them if a reference map cannot be solved, logging the change. | tasks 01, 02, owner at QA |
| Q2 | Do 12 x 16 boards feel playable at 26 to 30 px cells? | Zoom steps plus keyboard cursor; owner judges in browser QA. | owner |
| Q3 | Privacy policy URL for store submission | Not needed in v1 (no submission); a one-page "no data collected" policy is needed later. | owner |
| Q4 | Public name beyond the working title | Floodplain Dispatch stays the public name in v1. | owner, later step |
| Q5 | Which CC0 water and ambience sources exist for the sound slots? | Task 05 searches Kenney first, then CC0-stated pages; slots without a CC0 source ship silent and are listed here. | task 05 |
| Q6 | Does the iOS Capacitor 8 project need CocoaPods for `cap sync`? | Capacitor 8 uses Swift Package Manager; if `cap sync` insists on CocoaPods, record and skip. | task 07 |
| Q7 | Designer art delivery timing | Placeholders are code-drawn; task 06 integrates whatever passed review and keeps placeholders elsewhere. | orchestrator |
| Q8 | Daily fallback templates: how many are needed? | 14 templates (2 per weekday tier); task 03 sizes it from the 365-date test. | task 03 |
| Q9 | Remove the default Android `INTERNET` permission since the game is fully offline? | Keep Capacitor's default (WebView loader not verified without a device); data safety stays "no data collected". Owner decides after device QA. | task 07, owner |

## Kit follow-ups

None known at planning time. Any kit limitation found while building is recorded here with the
workaround used inside this game; the kit itself is read-only for this epic.

## Task 02 notes

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q10 | The integer snapshot flow model lets water creep overland and puddle into any canal cell dug beside it, so cheap "tap" solutions exist on open ground. The shipped maps were hardened against the cheaper placements the authoring search found, but a final three-seed re-check still finds cheaper placements on 27 of 40 maps (table in `.agents/resources/2026-10-23/web-games/floodplain-dispatch/02/README.md`). Is par tight enough in play? | Ship as authored (a cheaper placement still earns three stars); the owner judges in browser QA. Task 03's exact solver can measure par gaps and, if wanted, par can be lowered per map with the content-plan row, decisions log and tests changed together. | owner at QA, task 03 |
| Q11 | Several maps carry a small sea cell near the inlet (the river outfall that keeps overland water local). Does it read as a river mouth in the art, or should the renderer draw it as a drain? | Draw sea cells as water everywhere; revisit after the owner sees the board. | task 04, owner |
| Q12 | Houses sit inside rings of trees (sealed cells). Is the amount of scenery acceptable visually? | Keep; task 04 draws trees as light woods and hedges. | task 04, owner |

## Task 03 notes

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q13 | Daily maps are valid and proven, but their par is the generator's own reference (a connected canal tree). Cheaper "sump" placements can exist, as on the campaign (Q10). The terrain is also less landscape-like than the hand-authored campaign (lower half is mostly flat plain with woods). Good enough for v1? | Ship as generated; the owner judges the daily in browser QA. A later pass can add a cheaper-solution search and scenery hardening. | owner at QA |
| Q14 | The bounded solver fails on 5 campaign maps (v10, d09, h10, e01, e02; table in the resources README). It never affects shipped play because campaign hints use the committed references. | Keep; improving the solver is optional polish. | task 08 or later |
| Q15 | Q8 answered: 14 fallback templates (2 per weekday). Observed use over 365 dates: 0. | Keep the 14 templates as a safety net. | closed |
| Q16 | Kit: `SaveStore.update` always writes, even when the callback returns the same profile (a rejected purchase). Harmless. | Left as is. | kit follow-up, optional |
