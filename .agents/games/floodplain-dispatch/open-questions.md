# Floodplain Dispatch - open questions

None of these block v1; each has a stated default. After task 08 the open items are owned by the owner (browser QA or a later step); nothing is left for an agent task in this epic.

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q1 | Are the balance constants (flow caps, 6-step thresholds, tide formula) fun in practice? | Values in `product.md`. Task 01 and 02 may adjust them if a reference map cannot be solved, logging the change. | tasks 01, 02, owner at QA |
| Q2 | Do 12 x 16 boards feel playable at 26 to 30 px cells? | Zoom steps plus keyboard cursor; owner judges in browser QA. | owner |
| Q3 | Privacy policy URL for store submission | Not needed in v1 (no submission); a one-page "no data collected" policy is needed later. | owner |
| Q4 | Public name beyond the working title | Floodplain Dispatch stays the public name in v1. | owner, later step |
| Q5 | Which CC0 water and ambience sources exist for the sound slots? | Answered in task 05: every slot has a CC0 file (Kenney packs, plus three OpenGameArt CC0 pages for the water loop and the two music loops). No slot ships silent. See Task 05 notes. | closed |
| Q6 | Does the iOS Capacitor 8 project need CocoaPods for `cap sync`? | Answered in task 07: no. `cap add ios` and `cap sync` ran with Swift Package Manager only and finished without errors; Xcode was never run. | closed |
| Q7 | Designer art delivery timing | Placeholders are code-drawn; task 06 integrates whatever passed review and keeps placeholders elsewhere. | orchestrator |
| Q8 | Daily fallback templates: how many are needed? | 14 templates (2 per weekday tier); task 03 sizes it from the 365-date test. | task 03 |
| Q9 | Remove the default Android `INTERNET` permission since the game is fully offline? | Keep Capacitor's default (WebView loader not verified without a device); data safety stays "no data collected". Owner decides after device QA. Task 07 kept it and added a test that it is the only permission. | owner |

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
| Q14 | The bounded solver fails on 5 campaign maps (v10, d09, h10, e01, e02; table in the resources README). It never affects shipped play because campaign hints use the committed references. | Keep; improving the solver is optional polish. | owner, later step (carried past v1) |
| Q15 | Q8 answered: 14 fallback templates (2 per weekday). Observed use over 365 dates: 0. | Keep the 14 templates as a safety net. | closed |
| Q16 | Kit: `SaveStore.update` always writes, even when the callback returns the same profile (a rejected purchase). Harmless. | Left as is. | kit follow-up, optional |

## Task 04 notes

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q17 | While zoomed, a drag with a piece tool paints, so panning needs the Select tool (or the keyboard cursor, which scrolls the board to follow it). Is that discoverable enough, or should a two-finger drag pan? | Keep; the owner judges in browser QA. Pinch zoom is not built; the zoom button cycles fit, 1.5x, 2x. | owner at QA |
| Q18 | Board cells are 26 to 30 px at fit zoom on 8 x 12 to 12 x 16 boards (Q2). The renderer sizes cells from the board area, so a short phone gives smaller cells. | Zoom steps plus keyboard cursor. | owner at QA |
| Q19 | The code-drawn art (houses, trees, pump, gate, sandbags, tank, rocks) is functional placeholder drawing. Task 06 replaces it only where designer art passes review. | Keep placeholders. | task 06 |
| Q20 | The how-to pages are short real text, not the guided tutorial; mechanic cards and the v01 tutorial are task 05. | Answered in task 05: six how-to pages, the v01 tutorial and the seven cards are built. | closed |

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

## Task 05 notes

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q21 | Audio ships as Ogg Vorbis (Kenney's format, no conversion). Does the iOS WKWebView in the target Capacitor 8 build decode Ogg through WebAudio? If not, the game is silent on iOS (the kit manager's `load` fails quietly). | Keep Ogg; owner checks sound on iOS and in Safari during QA. A fix is AAC or MP3 twins of each file (the kit `load` takes any URL), which would need a decision on lossy re-encoding of CC0 files. | owner at QA |
| Q22 | Nobody has listened to the audio (no browser or player in agent runs). Slot fit is by file name, pack and duration only. The star stingers are Kenney Music Jingles chosen by duration (1 s, 1.4 s, 1.7 s). Do the choices sound right, and are the 45 second music loops seamless? | Ship as chosen; the owner swaps any file by editing one row in `public/audio/LICENSES.md`, `src/data/credits.ts` and the assets index (a test keeps them equal). | owner at QA |
| Q23 | The water loop is a 10 second excerpt of a river recording and the music loops are 45 second excerpts, each with a crossfade built so the end leads into the start. Audible repetition after a few minutes is possible. | Keep; budget (600 KB per loop, 2 MB total) leaves room for longer loops if the owner wants them. | owner at QA |
| Q24 | The mechanic cards and the v01 tutorial need `profile.flags` (one flag for the tutorial, one per card, 8 of the 64 allowed). A "Reset progress" clears them, so the tutorial and cards replay after a reset. | Intended. | none |

### Kit follow-ups found in task 05 (kit stays read-only; worked around in this game)

- `AudioManager.play` cannot loop a sound effect; only `playMusic` loops. The water loop therefore
  runs on a second `AudioManager` (a second `AudioContext`, driven with `playMusic` and `setVolume("music")`
  for its level). A looping `play` option would allow one context.
- `AudioManager` exposes no per-load progress; the game counts finished `load` calls itself.
- `createFakeAudioContext` plus `createAudioManager({ createContext, fetchBuffer })` was enough to test
  the whole engine without a browser; no kit change needed.

## Task 06 notes

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q25 | `key-art` was rejected in the final round (canal feeders end in blunt caps at the plot edge, the fork reads as a pitchfork, flat field stickers, mismatched river ends, dashed slab edge, slab flat against the 3/4 sprites). Do we commission another round later, or ship the title screen with the code-drawn gradient and river? | Keep the placeholder; the accepted `feature-graphic` covers store promo use. | owner, later step |
| Q26 | How much of the region backdrop should show behind the board? The scrim is 72 percent of the theme background and the canvas margin is 60 percent (`BACKDROP_SCRIM` in `src/art/Backdrop.tsx`, `BACKDROP_MARGIN_ALPHA` in `src/board/draw.ts`). Nobody has seen it (no browser in agent runs). | Keep; owner tunes the two constants at QA. | owner at QA |
| Q27 | Designer sprites came at 1024 px (above the planned 768) and backdrops at 1024 x 1536 (below the planned 1600 x 2400). Runtime sizes are unaffected (192 and 800 x 1200); 800 x 1200 is a 22 percent downscale. | Masters stay at the delivered resolution. | none |
| Q28 | The designer inbox manifest has no thread message id per image. Provenance uses batch and round plus the quoted verdict. | Keep. | none |
| Q29 | Backdrop edges: the designer noted scenery only at the top and bottom corner fragments and a flat centre, so the board area shows mostly flat colour. | Keep; owner judges at QA. | owner at QA |

## Task 07 notes

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q30 | `android:allowBackup` is `true` so progress survives a device change (local save, no personal data). Keep it? | Keep; set `false` in `AndroidManifest.xml` (test `test/native.test.ts` pins the value) if the owner prefers a clean slate on reinstall. | owner |
| Q31 | Splash is the code-drawn badge, not key-art (rejected). Is the badge acceptable as launch image, or should the splash wait for a new key-art round? | Keep the badge; re-run `scripts/build-icons.ts` and `bunx capacitor-assets generate --android --ios` if a key-art is accepted later. | owner, later step |
| Q32 | No icon, splash, adaptive-icon mask or launch screen was seen on a device or in Xcode or Android Studio. | Files validated by tests only; owner checks on a device when one is available. | owner |

## Task 08 notes

| # | Question | Default used until answered | Owner |
|---|---|---|---|
| Q33 | Nobody has run the game in a browser, on Android or on iOS; every check in this epic is headless (Vitest with happy-dom, `tsc`, `vite build`, Biome). Layout, motion, sound, fonts and touch feel are unverified. | The owner works through `.agents/resources/2026-10-23/web-games/floodplain-dispatch/qa-checklist.md` in a desktop browser at 360 x 640, 390 x 844 and 430 x 932; Android back behaviour is device-only and listed as not covered. | owner at QA |
| Q34 | Final status of art: 19 of 20 slots accepted; `key-art` rejected (Q25) and kept as the code-drawn placeholder. No slot is "not generated". | See Q25. | owner, later step |
| Q35 | The budget test builds with `publicDir: false` so art, fonts and audio are measured separately from the JS; CSS is not counted in the 300 KB JS figure. | Keep; CSS is small and listed in the `vite build` output. | none |
| Q36 | Store submission (screenshots, privacy policy URL, signing) is out of scope for v1. `store-listing.md` is a final draft only. | Owner decides when to submit (Q3, Q9, Q30 to Q32 apply). | owner, later step |

### Kit follow-ups found in task 08

None. The budget and audit tests needed no kit change.
