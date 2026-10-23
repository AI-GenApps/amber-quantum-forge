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
