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

## Task 04 notes

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q17 | While zoomed, a drag with a piece tool paints, so panning needs the Select tool (or the keyboard cursor, which scrolls the board to follow it). Is that discoverable enough, or should a two-finger drag pan? | Keep; the owner judges in browser QA. Pinch zoom is not built; the zoom button cycles fit, 1.5x, 2x. | owner at QA |
| Q18 | Board cells are 26 to 30 px at fit zoom on 8 x 12 to 12 x 16 boards (Q2). The renderer sizes cells from the board area, so a short phone gives smaller cells. | Zoom steps plus keyboard cursor. | owner at QA |
| Q19 | The code-drawn art (houses, trees, pump, gate, sandbags, tank, rocks) is functional placeholder drawing. Task 06 replaces it only where designer art passes review. | Keep placeholders. | task 06 |
| Q20 | The how-to pages are short real text, not the guided tutorial; mechanic cards and the v01 tutorial are task 05. | As described. | task 05 |

### Kit follow-ups found in task 04 (kit stays read-only; worked around in this game)

- `Button` does not forward `aria-label`, `data-*` or `class`-only props other than `class`;
  icon buttons use `IconButton`, and the zoom control is a plain `button` with the kit classes.
- The danger button text (`--wg-color-accent-text` on `--wg-color-danger`) and the toggle thumb
  (`--wg-color-text` on the accent track) cannot meet contrast with a dark-background palette, so
  this game overrides both in `src/styles.css`. A kit option for separate danger text and thumb
  tokens would remove the override.
- `createRouter<R>` with `interface Routes extends Record<string, unknown>` widens `keyof R` to
  `string` and loses the per-route param types; a `type` alias avoids it. Worth noting in the kit
  README example.
- `Sheet` has one text colour token for the screen and the sheet; games with a dark screen and
  light sheets must scope a token override (done with `PAPER_SELECTOR`).
