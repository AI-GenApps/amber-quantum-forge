# Lantern Loops — open questions

Update this file when a question is answered (move it to the decisions log with the date) or when a
task finds a new one. Kit follow-ups are listed separately because this game never edits
`apps-games/web-kit`.

## Open

| # | Question | Needed by | Who | Notes |
|---|---|---|---|---|
| Q1 | Public name, trademark clearance and store listing name | Before any submission | Owner | Working title is the public name in v1 (owner decision) |
| Q3 | Is 9x9 daily generation fast enough on a low-end Android WebView? | Owner browser QA | Owner | Core budget is measured in Node (task 01: a dense 9x9 uniqueness proof takes about 1 ms, `propagate` 0.3 ms; the sparsest random 9x9 boards tried needed up to 120,000 nodes, about 70 ms); if the device feels slow, add chunked async generation or cap Sunday at 8x8. Task 08: the 365-date daily test and the 40-day simulation run in Vitest in well under a second per date; checklist section 6 asks the owner to time Sunday on a real phone |
| Q4 | Does "path hidden by default" feel right for shared grids? | Owner QA | Owner | Setting exists either way |
| Q5 | Do the weekday tiers feel right (Thu and Sat jump in mechanics)? | Owner QA | Owner | Tier table lives in one core constant so retuning is cheap, but it changes dailies (bump `ll-gen-1`) |
| Q6 | Strip `android.permission.INTERNET` from the Capacitor manifest? | Task 07 note, store submission | Owner | The app makes no requests; the default Capacitor template declares it. Task 08, 2026-10-23: the no-data audit (`08/no-data-audit.txt`) confirms zero network API uses in the source and public files, so removing the permission is safe for the game itself; the manifest is outside the scope fence of the agents and stays as the template wrote it. Decide at submission |
| Q7 | Cell floor of 36 px: acceptable for 9x9 on 340 px wide phones? | Owner QA | Owner | Alternative: pinch-zoom on 9x9 boards (not in v1) |
| Q8 | Developer account, contact email, privacy policy URL | Store submission (out of v1) | Owner | See `store-listing.md` |
| Q10 | Do the sounds, haptics and motion feel right, and is the `calm-loop` seam inaudible? | Owner browser/device QA (task 08 checklist) | Owner | Nothing was listened to by agents. Mapping lives in `src/audio/sounds.ts` (file, volume) and `src/feedback/subscriber.ts` (haptics, throttles); swapping a file also needs its record in `src/audio/sources.ts` and the assets index |
| Q11 | 13 of 15 art slots have no reviewed art and keep their code-drawn placeholder: `key-art`, `backdrop-harbor`, `lantern-rose`, `lantern-jade`, `lantern-azure`, `lantern-violet`, `lantern-unlit`, `backdrop-garden`, `backdrop-bridge`, `backdrop-sky`, `daily-medallion`, `empty-archive`, `feature-graphic`. Run another designer batch, or ship v1 with the placeholders? | Owner browser QA, before any store submission | Owner | The designer review loop ended `style_anchor_failed`. Only `lantern-amber` (b1 round 3) and `icon` (b1 round 4) were accepted. `key-art` was never delivered in round 4. `backdrop-harbor` failed all four rounds; round 4: cream-tan rims on the bottom-corner mooring posts (max about RGB 211,188,167, not dimmed) and the posts read as a stacked game piece (Hanoi tower style), the brightest items in the bottom band; the posts-without-coils fallback was not taken; the rest is calm (board zone about 12% luminance) but very sparse. The other 11 slots were not requested because the style anchor failed. The game is complete either way; the `feature-graphic` is needed for any store listing. In lists the accepted amber lantern sits next to the code-drawn grey `lantern-unlit` placeholder, so owner QA should judge whether that pair looks consistent. To integrate later art: drop the accepted PNGs in the accepted folder with a manifest entry and run `bun scripts/convert-art.ts` |
| Q12 | Does the launcher icon and splash look right on a device (icon from the accepted `icon`, splash from the accepted `lantern-amber` on indigo because `key-art` was never delivered)? Should the splash move to a key-art scene once a reviewed one exists? | Owner device QA, before any store submission | Owner | Task 07, 2026-10-23: no emulator or device was used, so only file structure and PNG headers are tested. The splash lantern is posterised (32 colours) to keep the committed splash copies small; a later key-art splash can replace `resources/splash*.png` and re-run `bun run brand:sources` then `bun run brand:assets` |
| Q13 | Is the dev-only `?qa=` helper enough to reach every state the checklist needs, and is it acceptable that it writes to the real save (use `reset:1` to wipe)? | Owner browser QA | Owner | Task 08: `src/qa/devParams.ts`, loaded only when `import.meta.env.DEV` is true; a test proves the production bundle does not contain it. A production preview (`vite preview`) has no helper, so use the dev server for progression checks |

## Answered

| # | Question | Answer |
|---|---|---|
| Q2 | Is there a CC0 calm music loop that fits? | Task 05, 2026-10-23: yes, OpenGameArt "Calm Loop" by wipics (page states CC0, 19.4 s, 314 KB), shipped unmodified as `calm-loop.mp3`. Owner QA checks that the loop seam is not audible |
| Q9 | Real fixed-tile shares per chapter | Task 02, 2026-10-23: median 31.3% (Harbor), 19% (Garden), 16.3% (Bridge), 12.5% (Sky); highest single puzzle 33.3%. The limits stay at 35% median and 50% hard; Harbor did not need a raised limit |

## Kit follow-ups (record here, do not edit the kit)

None found yet. Task authors append `YYYY-MM-DD, task NN: description, workaround used` below when a
kit issue blocks or bends their work.
- 2026-10-23, task 03: the kit save store rejects an envelope with `v: 0` (version must be an integer >= 1), so a version-0 migration source cannot be registered in `SaveSchema.migrations`. Workaround inside this game: `withLegacyProfile` in `apps-games/lantern-loops/src/save/profile.ts` upgrades a v0 envelope or a bare preview object to a v1 envelope before the kit reads it. Follow-up for the kit: allow `v: 0` and `migrations[0]`, or document that legacy shapes need an adapter shim.
- 2026-10-23, task 04: the kit README documents `interface Routes extends Record<string, unknown>`, but with that form `keyof Routes` is `string`, so `ScreenEntry<Routes>.params` is `unknown` and a `switch (screen.name)` cannot narrow it. Workaround inside this game: `Routes` is declared as a `type` alias of an object literal (`src/app/routes.ts`). Follow-up for the kit: change the README example to a type alias or make `RouteMap` accept interfaces.
- 2026-10-23, task 04: kit `Button` forwards no `aria-*` or `data-*` attributes (only `IconButton` takes an accessible name). Workaround: icon-style controls use `IconButton`; buttons that need extra attributes are plain `<button class="wg-btn ...">` elements. Follow-up for the kit: let `Button` pass through `aria-label` and `data-*`.
- 2026-10-23, task 04: kit `Tabs` gives every tab equal width, so six long labels do not fit a 340 px screen. Workaround: the How to play pages use a Previous and Next pager. Follow-up for the kit: allow a scrollable tab list.
- 2026-10-23, task 05: the kit audio manager has no "unlocked" callback (`installUnlock` returns only a remover), so the preload-after-unlock and music start use a small game helper (`src/audio/unlock.ts`) that calls `audio.unlock()` itself on the first gesture. Follow-up for the kit: accept an `onUnlocked` callback in `installUnlock`.
- 2026-10-23, task 05: kit `createMotion` has no iteration count, so the streak flame flicker on Home is one short tween repeated by a timer every 3.2 s (none when motion is reduced). Follow-up for the kit: add `iterations` to `MotionOptions`.
- 2026-10-23, task 05: kit `Screen` forwards no `data-*` attributes, so the onboarding step is exposed on the tutorial banner (`data-step`) instead of the screen root.
