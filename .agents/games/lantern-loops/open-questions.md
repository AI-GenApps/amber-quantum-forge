# Lantern Loops — open questions

Update this file when a question is answered (move it to the decisions log with the date) or when a
task finds a new one. Kit follow-ups are listed separately because this game never edits
`apps-games/web-kit`.

## Open

| # | Question | Needed by | Who | Notes |
|---|---|---|---|---|
| Q1 | Public name, trademark clearance and store listing name | Before any submission | Owner | Working title is the public name in v1 (owner decision) |
| Q2 | Is there a CC0 calm music loop that fits? | Task 05 | Agent, then owner | If none, ship without music and log the decision |
| Q3 | Is 9x9 daily generation fast enough on a low-end Android WebView? | Owner browser QA | Owner | Core budget is measured in Node (task 01: a dense 9x9 uniqueness proof takes about 1 ms, `propagate` 0.3 ms; the sparsest random 9x9 boards tried needed up to 120,000 nodes, about 70 ms); if the device feels slow, add chunked async generation or cap Sunday at 8x8 |
| Q4 | Does "path hidden by default" feel right for shared grids? | Owner QA | Owner | Setting exists either way |
| Q5 | Do the weekday tiers feel right (Thu and Sat jump in mechanics)? | Owner QA | Owner | Tier table lives in one core constant so retuning is cheap, but it changes dailies (bump `ll-gen-1`) |
| Q6 | Strip `android.permission.INTERNET` from the Capacitor manifest? | Task 07 note, store submission | Owner | The app makes no requests; the default Capacitor template declares it. Verify offline-only claims in the no-data audit |
| Q7 | Cell floor of 36 px: acceptable for 9x9 on 340 px wide phones? | Owner QA | Owner | Alternative: pinch-zoom on 9x9 boards (not in v1) |
| Q8 | Developer account, contact email, privacy policy URL | Store submission (out of v1) | Owner | See `store-listing.md` |
| Q9 | Real fixed-tile shares per chapter | Task 02 | Agent | Target <= 35%, hard limit 50%; record real numbers and revise the validator if Harbor needs more |

## Kit follow-ups (record here, do not edit the kit)

None found yet. Task authors append `YYYY-MM-DD, task NN: description, workaround used` below when a
kit issue blocks or bends their work.
