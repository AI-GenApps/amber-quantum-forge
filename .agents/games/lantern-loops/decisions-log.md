# Lantern Loops — decisions log

Owner decisions are final (source: `.claude/workflows/web-games-v1-args.json`, copied into
`tasks/epics/18-web-games-kit/STATUS.md` and `tasks/epics/19-web-lantern-loops/STATUS.md`). Design
decisions are mine to refine; change them only with a new dated row and a reason.

## Owner decisions (2026-10-23)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-10-23 | Build all six web games as FULL v1: complete loop, full v1 content, progression, local save, reviewed art, custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android/iOS projects. No store submission | Owner wants shippable-quality games, not demos |
| 2026-10-23 | Two waves after the shared kit; Lantern Loops is wave 1 with Floodplain Dispatch and Cloud Observatory | Parallelism with isolated worktrees |
| 2026-10-23 | No monetization in v1: soft currency and unlocks only, no ads, no IAP, no accounts, no network calls; economy leaves room for IAP later | Hint tokens are earned only, so a later purchase can be added without redesign |
| 2026-10-23 | QA is browser-only and done by the owner at the end; agents do no visual QA (no browsers, Playwright, screenshots, devices, emulators, APK builds, JDK installs) | Agents verify with Vitest (happy-dom), tsc, vite build, Biome |
| 2026-10-23 | Stack: TypeScript, Vite, Preact, Vitest (happy-dom), Capacitor 8; rendering DOM/SVG/Canvas 2D; no game engines | Fits a flat puzzle board; small bundle |
| 2026-10-23 | Layout: `apps-games/lantern-loops` (app) + `apps-games/lantern-loops-core` (pure headless TS) + shared `apps-games/web-kit` | Core stays DOM-free and testable (architecture test forbids window, document, Date.now, Math.random) |
| 2026-10-23 | Portrait, offline-first, local save only, versioned with migrations; daily mode seeded from the local date and generated on device | No server, so no network |
| 2026-10-23 | All graphics come from the MobileGamesDesigner thread and pass a strict art review; no AI slop is integrated. Fonts are OFL (Google Fonts repo); audio is CC0 only | Quality and licence hygiene |
| 2026-10-23 | Working titles are the public names in v1; naming research is a later step | Avoids blocking on naming |
| 2026-10-23 | One branch, worktree and PR per game (`feat/web-lantern-loops`); the orchestrator reviews and merges | Isolation |

## Game spec decisions (2026-10-23, from the spec)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-10-23 | Core loop: tap/drag to place and rotate path tiles on an N x N grid (5x5 to 9x9); lanterns, numbered stones, mirrors, colour gates; undo, restart, hints; solved when all constraints hold | Spec |
| 2026-10-23 | The solver proves every shipped puzzle has exactly one solution | Spec; removes guessing and unfair boards |
| 2026-10-23 | 120 campaign puzzles in 4 chapters of 30 (Harbor, Garden, Bridge, Sky), one mechanic each, generated offline and committed as data with a validator test | Spec |
| 2026-10-23 | Daily puzzle generated on device from the date seed, weekday difficulty Monday easy to Sunday hardest, solvable and unique over 365 consecutive dates (tests); 30-day archive | Spec |
| 2026-10-23 | Progression: stars (0 hints = 3), chapters unlock by stars, hint tokens from dailies and streaks (no purchase), daily streak with a gentle freeze (1 per week), statistics screen, share as an emoji grid via the kit share helper | Spec |
| 2026-10-23 | Fonts: Fraunces (display) + Nunito (body), OFL | Spec |
| 2026-10-23 | Art: paper-cut lantern festival at dusk; the board itself is drawn in SVG by code in the same palette; 15 art slots in two batches | Spec |

## Design decisions (2026-10-23)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-10-23 | Rules are tile-based: six tiles as bitmasks (N=1, E=2, S=4, W=8); loops are disjoint cycles because every tile has degree 2 and no tile crosses | Simple to validate, serialise, hash and test; maps to "path tiles" in the spec |
| 2026-10-23 | Several loops allowed per board; every loop must carry at least one lantern | Lantern-less loops would add unbounded ambiguity and break uniqueness; the rule is also easy to explain |
| 2026-10-23 | Stone number = count of orthogonal neighbours holding a tile (edge neighbours outside the board ignored) | The spec's "adjacent lit edges" made concrete; simple to check at a glance |
| 2026-10-23 | Mirror = a cell that must hold a corner on one of two diagonals; Colour gate = a cell that must hold a straight tile on a loop of the gate's colour; a loop holds one colour | Both are checkpoint cells the loop must pass, which keeps uniqueness provable; one mechanic per chapter |
| 2026-10-23 | Fixed tiles (anchors) are the generator's tool for uniqueness; target <= 35% of solution tiles, hard limit 50% | Lantern-only boards need extra pinning; the generator minimises them while the solver still proves uniqueness. Real numbers are recorded in task 02 |
| 2026-10-23 | Core ships its own tiny seeded PRNG (mulberry32-style) and takes a numeric seed; the app computes seeds with the kit `dailySeed` | Core has no dependency on the kit and must not use Math.random; determinism is integer-only so every device generates the same daily |
| 2026-10-23 | Generator version string `ll-gen-1` is part of the seed text | Any generator change would silently change every future daily; bumping needs a new decision row |
| 2026-10-23 | The generator always terminates: after a bounded number of failed attempts it pins tiles until the solver reports exactly one solution | Guarantees a daily exists for every date |
| 2026-10-23 | Campaign sizes per chapter: Harbor 10/10/10 (5x5/6x6/7x7), Garden 5/10/10/5 (5x5 to 8x8), Bridge 4/8/8/6/4 (5x5 to 9x9), Sky 4/8/10/8 (6x6 to 9x9) | Gentle ramp; Sky is the only chapter that needs 9x9 for five colours |
| 2026-10-23 | Inside an unlocked chapter all puzzles are open (no linear lock); chapters unlock at 45 / 120 / 210 total stars | Calm and non-blocking; thresholds need 15 / 40 / 70 flawless solves |
| 2026-10-23 | Stars: 0 hints = 3, 1 hint = 2, 2 or more hints = 1; restart keeps the hint count of the attempt | Spec says 0 hints = 3; the rest is a smooth ladder with no failure state |
| 2026-10-23 | Hint tokens: start 3, cap 20, cost 1; sources daily +1 (+1 with no hints), streak milestones 3/7/14/30/60/100 days = +1/+2/+2/+4/+5/+8, archive +1 once per date, chapter cleared +5 | Earned only; the numbers keep hints scarce but never required |
| 2026-10-23 | Streak freeze: 1 per ISO week, cap 1, spent automatically on exactly one missed day | The spec's "gentle freeze (1 per week)" |
| 2026-10-23 | Daily weekday tiers: Mon 5x5, Tue 6x6, Wed 7x7, Thu 7x7 + mirrors, Fri 8x8, Sat 8x8 + gates, Sun 9x9 | Monday easy to Sunday hardest; mechanics ramp like the campaign |
| 2026-10-23 | The daily is open to everyone from day one; the screen names the mechanics used and links to how-to-play | A daily must not depend on campaign progress |
| 2026-10-23 | Archive: 30 previous dates, regenerated on demand; solves give stars for stats and a one-time token, never touch the streak | Replay value without devaluing the streak |
| 2026-10-23 | Share text: header, stars, time and an emoji grid; the path is hidden by default (setting) | Sharing a daily must not spoil it for friends |
| 2026-10-23 | Input: brush (Straight / Corner / Erase) tap-to-place-and-rotate plus drag-to-draw; unlimited undo and redo; long-press erases | Satisfies "tap/drag to place and rotate"; drag is fast on phones, tap is precise |
| 2026-10-23 | Hit areas: every control >= 44 css px; board cells as large as fit with a floor of 36 px | A 9x9 board must fit a 340 px viewport; drag-drawing and undo make smaller cells safe |
| 2026-10-23 | Five lantern colours each have a glyph (circle, diamond, triangle, square, star); colour is never the only cue | Colour-blind safety |
| 2026-10-23 | The board is code-drawn SVG; images are used only on surfaces around it (home, lists, sheets, backdrops) | Spec; crisp board at any size, small art budget (<= 8 MB) |
| 2026-10-23 | Save: one profile store with `version` and migrations, one runs store for in-progress boards, settings via the kit; a development-preview v0 shape is migrated in tests | Proves the migration machinery before a real v2 is needed |
| 2026-10-23 | Onboarding: two guided 4x4 boards outside the campaign; one-time coach cards for mirrors (Bridge 01) and gates (Sky 01) | Teach by doing, once |
| 2026-10-23 | Timer hidden by default (setting to show); time is recorded for best times and stats | Calm tone; no pressure |
| 2026-10-23 | Music is optional: if no CC0 loop fits, v1 ships without it | CC0 rule is stricter than the feature wish |
| 2026-10-23 | Budgets: JS bundle <= 300 KB gzip (art, fonts and audio excluded), art <= 8 MB, audio <= 1.5 MB (effects <= 60 KB each), each woff2 <= 120 KB | Fast cold start on low-end Android WebView |

## Core engine decisions (task 01, 2026-10-23)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-10-23 | Puzzle text code: rows joined by `\|`, one token per cell: `.` open, `L<c>` lantern, `G<c>` gate, `S<0-4>` stone, `M/` or `M\` mirror, optional `=<hex digit>` fixed tile; colour letters `a` amber, `r` rose, `j` jade, `b` azure, `v` violet. Boards and solutions are one hex digit per cell | Compact, human-checkable, typed errors instead of exceptions |
| 2026-10-23 | `isLegalTile(0)` is true (a cell value); `isTileMask` is true only for the six tiles | The edit model stores 0 for empty |
| 2026-10-23 | Violation severity `conflict` means adding tiles cannot repair it; `conflicts()` (live feedback) returns conflicts except loose ends, because loose ends are drawn as open ribbon ends. Open chains with two lantern colours, or a gate whose chain holds another colour, are conflicts too (a solved board has no chains, so they can never be repaired) | Earlier feedback than waiting for the loop to close |
| 2026-10-23 | Two extra violation kinds beyond the task list: `invalid-tile` (a tile on a stone or an illegal mask value) | Defensive; the edit model never produces it |
| 2026-10-23 | The solver keeps row-major semantics for the API but searches smallest-domain-first (ties in row-major order) with arc consistency and stone bounds at every node, and union-find loop tracking over forced edges | Pure row-major search thrashed on sparse 9x9 boards (millions of nodes); smallest-domain-first needs about 100 to 100,000 nodes. Dense 9x9 uniqueness proof: about 1 ms in Node |
| 2026-10-23 | `exhausted` is true only when the node budget stopped the search; `count` is then a lower bound and `isUnique` is false | Never claim uniqueness without a finished search |
| 2026-10-23 | Hint with a wrong tile on a cell whose solution is empty clears and locks that cell as empty | The rule says "among cells whose tile differs from the solution"; the UI shows the lock on an empty cell |
| 2026-10-23 | Drag: stones break the path, a drag that backs up shortens it, a drag that returns to its start closes the ring, fixed and locked cells keep their tile | Predictable drawing on small cells |


## Content decisions (task 02, 2026-10-23)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-10-23 | Generator `ll-gen-1`: seeded mulberry32 PRNG (integer arithmetic only), FNV-1a text hash, campaign seed = `hashText("ll-gen-1\|<puzzle id>")`, per-attempt seed = `hashText("<seed>:<attempt>")`. Nothing reads time or `Math.random` (architecture test scans `src`) | Same puzzle on every machine; a puzzle can always be re-derived from its id |
| 2026-10-23 | Solution loops are boundaries of random simply-connected regions of unit faces (no pinches, no holes), several disjoint loops per board with coverage targets per size | Always closed, always disjoint, varied shapes, cheap to generate |
| 2026-10-23 | Clues are placed on the solution (lanterns at least one per loop, stones on empty cells with true counts, mirrors on corners, gates on straights with the loop colour), then anchors are added until the solver proves uniqueness, then removed greedily, then clues above the range minimum are removed greedily | Anchors are the uniqueness tool but kept as few as possible |
| 2026-10-23 | Pin-everything fallback: with `attempts = 0` (or when no attempt places) the board is built with top-of-range clues and pinned only until unique, with no removal pass; a board with every loop pinned is always unique, so the path always ends | Bounded generation; the daily mode (task 03) reuses it |
| 2026-10-23 | Difficulty rating: effort = log2(1 + solver guesses) + 4 x (free cells undecided by propagation / free cells) + 0.5 x (size - 5); rating steps at 3.5, 6, 8.5, 11. "Guess depth" is approximated by the guess count (nodes), because the solver reports nodes, not depth | Cheap, deterministic, recomputed by the validator |
| 2026-10-23 | Rating ladder per chapter band (see `content-plan.md`): the accepted range of a band ends where the next band begins, and the generator retries (up to 120 derived seeds) until the rating is in the band range | Guarantees non-decreasing ratings across bands without hand-editing data; Sky starts at 2 to 3 because gates plus colours are never trivial |
| 2026-10-23 | Stones in Bridge and Sky: low end of the Garden range x 0.6 (rounded, at least 1), same high end | The plan said "60 to 100% of the Garden range"; this is the literal reading and keeps stones present in every board |
| 2026-10-23 | Every board uses every mechanic of its chapter and the earlier ones (clue range low ends are at least 1) | Finale and intro rules then hold for all puzzles |
| 2026-10-23 | Sky colour plan: see `content-plan.md`; Sky 27 and 30 use all five colours | Introduction order from the plan, variety afterwards |
| 2026-10-23 | Real anchor shares: median 31.3% Harbor, 19% Garden, 16.3% Bridge, 12.5% Sky; max 33.3%. Limits unchanged (35% median target, 50% hard limit) | Harbor did not need a raised limit |
| 2026-10-23 | Tutorial boards are generated (seeds 3 and 23 of the 4x4 search), pasted as data and proven by `validateTutorials`; tutorial-1 has one lantern and two anchors, tutorial-2 has one lantern, a stone 2 and a stone 1 | Same solver proof as the campaign |
| 2026-10-23 | `nextPuzzle(id)` follows play order across chapters (Harbor 30 to Garden 01); locking is decided by the progression code (task 03) | Keeps content free of save state |
| 2026-10-23 | Campaign data files are generated by `bun run generate` (never edited by hand); `bun run generate -- --verify` re-proves all data and checks the committed report | Data and plan cannot drift: tests parse `content-plan.md` and compare titles, sizes, blurbs, unlocks and size bands |

## Progression, economy and save decisions (task 03, 2026-10-23)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-10-23 | Weekdays are ISO numbers in the core (`Weekday` 1 = Monday to 7 = Sunday); the calendar helpers (`weekdayOf`, `isoWeekKey`, `shiftDate`, `archiveKeys`) use integer day arithmetic and are tested against `Date` for every day of 2024 to 2030 | The core must not touch `Date`; Monday-first matches the ISO week used by the freeze |
| 2026-10-23 | Daily seed: the app passes kit `dailySeed("lantern-loops", dateKey)` and the ISO weekday; the core generator seed is `hashText("ll-gen-1\|daily\|<seed>")`; puzzle id `daily-YYYY-MM-DD`. Saturday picks 2 or 3 colours and Sunday 3 to 5 from the seed (a seeded shuffle of the five colours); other days are amber only | Same board for everyone on a date; version string mixed into the seed |
| 2026-10-23 | Daily generator params: 8 attempts, anchor-share goal 40%, rating ranges Mon 1, Tue 1-2, Wed 2-3, Thu 2-3, Fri 3-4, Sat 3-4, Sun 3-5, Thu to Sun stones relaxed like Bridge and Sky. All 365 dates from 2026-10-23 were unique and reproducible; mean 7 ms, slowest about 90 ms in Node | Retuning any value changes every future daily, so it needs a new generator version |
| 2026-10-23 | Streak: `daysSinceLast` null (first ever solve) starts at 1; a gap of exactly 2 with a freeze spends it; every other gap resets to 1; clock-went-back and same-day change nothing. Milestones are paid when the streak equals the milestone day and is not in `milestonesGranted`; a reset clears that list | Matches `economy.md`; `liveStreak` shows 0 once a missed day can no longer be saved |
| 2026-10-23 | Freeze refill compares ISO week keys as strings: only a later week refills, a stored week in the future (clock went back) refills nothing. A new profile has 1 freeze and an empty `freezeWeek`, so its first open only records the week | Stops clock-rewind from refilling a spent freeze |
| 2026-10-23 | Daily and archive solves share one `dailiesSolved` map (date to best stars and fastest seconds). The daily reward and the streak apply only to the first solve of today's date; replays only improve stars and time. Archive: +1 only for the first solve of that date with 0 hints (a first solve with hints forfeits it); `archiveRewarded` keeps the paid dates for 40 days | One source for statistics and the Completed tab |
| 2026-10-23 | Daily token reward and a milestone reward are granted in one call, so `tokensCapped` is true when any part was dropped. A chapter-cleared reward is granted in the same call as the solve that cleared it | One toast per solve |
| 2026-10-23 | Hint tokens spent are counted in `hintsUsed` (statistics) only when the spend succeeded | Refused hints are not hints |
| 2026-10-23 | Statistics "best times" are the fastest campaign solve per board size (5 to 9) plus the fastest daily | Time is recorded per puzzle (`bestTimes`) so the screen can show either |
| 2026-10-23 | Share text: stars line is `<n> star(s)  <m:ss or h:mm:ss>` (two spaces); with the path visible every lit tile, lantern cells included, is its loop's colour square, so no lantern emoji is shown; stones stay white squares and empty cells black | Literal reading of "shows lit tiles as the lantern's colour square" |
| 2026-10-23 | Defaults for the game settings: `showTimer` off, `showConflicts` on, `hidePathInShare` on, brush straight | The timer is optional; time is always recorded and shown on the win sheet |
| 2026-10-23 | Profile `parse`: a missing field takes its default, a field with the wrong type rejects the whole save (the kit keeps a `.corrupt` backup), out-of-range numbers are repaired (tokens capped at 20, freezes at 1, best streak at least the streak) | Never lose a save over a missing field, never trust a wrong type |
| 2026-10-23 | v0 development-preview profile (`{ solvedIds, hintsLeft }`): every solved id becomes a 3-star solve, `hintsLeft` becomes the token balance (clamped to 20), cleared chapters are recorded without paying +5 retroactively, onboarding counts as done. The kit rejects envelope version 0, so a thin adapter wrapper (`withLegacyProfile`) rewrites a v0 envelope or a bare preview object into a v1 envelope before the kit reads it and keeps the original under `lantern-loops.profile.v0` | Makes the migration path real and tested without touching the kit |
| 2026-10-23 | In-progress runs: one `lantern-loops.runs` store keyed by puzzle id or `daily-YYYY-MM-DD`; a run is removed when its puzzle is solved; over 160 entries the oldest daily and archive runs go first, the oldest campaign runs last | Bounded storage |

## UI, theme and screens decisions (task 04, 2026-10-23)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-10-23 | Fonts: Fraunces and Nunito variable fonts from `google/fonts` commit `e7db6ca`, subset to Basic Latin, Latin-1 and eleven punctuation code points with `pyftsubset --flavor=woff2`, all four variation axes of Fraunces kept (109,868 bytes, under 120 KB). Registered by `registerFonts`; CSS stacks are `"Fraunces", serif` and `"Nunito", sans-serif` | The kit font-fallback helper passes on every screen; no star or arrow glyph is typeset (stars are SVG) |
| 2026-10-23 | Unlit lantern hex changed from `#5C6385` to `#6E76A6` and the UI border to `#7C83C4`; `content-plan.md` section 7 holds the final token table | Contrast test: graphics must reach 3:1 on the board plate and on the raised surface |
| 2026-10-23 | Board geometry: cell = min((viewport width - 16) / n, (viewport height - 300) / n, 72) rounded down, floor 36; a 9 x 9 board is 324 px wide at 36 px cells and fits a 340 px viewport | `layoutBoard` is pure; happy-dom has no layout, so tests assert the function and the stylesheet |
| 2026-10-23 | Tile ribbons are drawn as one quadratic curve through the cell centre between the two openings (a straight tile is the degenerate case); lit loops take their lantern colour, other tiles are paper cream, closed loops without a lantern are dimmed to 45% | One path function for all six tiles; matches the feedback rules in `product.md` |
| 2026-10-23 | Live feedback: stone, mirror, gate and colour conflicts get a rose ring; every loose opening gets an open ribbon end (cream while it only faces an empty cell, rose when it faces an edge, a stone or a mismatch); all of it hides when "Show conflicts" is off | Pending versus conflict severity comes from the core evaluation |
| 2026-10-23 | A drag previews live on the board but commits as one history step on pointer up; a cancelled drag restores the board; a 500 ms hold without movement erases the cell and the pointer up that follows does nothing | `product.md` "one drag = one undo step" |
| 2026-10-23 | Undo and redo skip steps that only differ by a hint tile (hint tiles are re-applied after every history move); restart keeps hints locked and the timer running; restart is undoable | A hint can never be undone, because it was paid for |
| 2026-10-23 | A hint is only charged when a hint exists: the board is checked first, then the token is spent, then the tile is placed and locked | "Refused when the board is already correct" costs nothing |
| 2026-10-23 | Win flow: the win sequence plays while the solve is recorded; a chapter unlock shows the celebration first and the win sheet after "Continue"; the token-cap and freeze-used events show as a toast | One screen of news at a time |
| 2026-10-23 | Coach cards (Bridge 1, Sky 1) remember "seen" in their own save key `lantern-loops.ui` (not the profile), cleared by Reset progress | Keeps the versioned profile schema of task 03 unchanged |
| 2026-10-23 | Onboarding shell: Boot sends a profile with `onboardingDone = false` to a welcome card; "Start practice" opens the two tutorial boards through the normal Puzzle screen (highlighted target, one sentence, Skip always visible, no hints, no stars, no save); finishing or skipping sets the flag. Task 05 owns the final copy and flow | Playable end to end now, replaceable later |
| 2026-10-23 | How to play is a six-page pager (Previous, Next, "Page n of 6") with one paragraph per page; diagrams and final copy are task 05 | Shell only |
| 2026-10-23 | Navigation: kit router with a `Routes` type alias (not an interface that extends `Record<string, unknown>`, which erases the route params type); sheets register a stable back interceptor; Home asks before exiting | See the kit follow-up in `open-questions.md` |
| 2026-10-23 | Reduced motion: screen transitions and the win sequence call the kit motion helper, which applies the final frame without `Element.animate`; the root also gets `data-reduced-motion` so CSS transitions stop | Tested by counting `animate` calls |
| 2026-10-23 | Image slots resolve `src/art/files/<slot-id>.webp` through `import.meta.glob`; no file ships in task 04, every slot has a code-drawn fallback, `feature-graphic` is store-only (never loaded in the app) | Task 06 only drops files in |

## Audio, haptics, motion, onboarding and how-to decisions (task 05, 2026-10-23)

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-10-23 | Audio sources: Kenney UI Audio, Interface Sounds, Impact Sounds, Music Jingles (each page and `License.txt` say CC0) and OpenGameArt "Calm Loop" by wipics for the music (page states CC0). Per-file records (pack, page URL, original name, licence, date, source and shipped SHA-256) live in `src/audio/sources.ts`, the licence texts in `public/audio/LICENSES/`, the table in `assets-index.md` | The audio test recomputes every hash and fails on an unrecorded or altered file |
| 2026-10-23 | Effects are mono 44.1 kHz MP3 at 64 kbit/s, converted from the Kenney OGG sources with ffmpeg; the music ships as the original 128 kbit/s stereo MP3, unmodified. Sizes: effects 1.1 to 12.7 KB, music 306.9 KB, all audio 385.7 KB | MP3 decodes in Chromium, Android WebView and iOS WKWebView; Ogg Vorbis is not reliable in WKWebView on iOS 17 |
| 2026-10-23 | Music ships (open question Q2 answered): one `calm-loop` at music bus gain 0.35, faded in over 1.2 s after the first gesture, plays on every screen, obeys the Music toggle | A CC0 page-stated loop exists; owner QA checks the loop seam |
| 2026-10-23 | One event vocabulary: the 17 sound ids are the feedback events (`ui-tap` ... `freeze-used`), carrying optional cells and loops. Screens emit events on a bus (`src/feedback`); one subscriber turns them into sound (`audio.play(id, volume)`), haptics and board motion, so no screen calls audio directly | Matches "board and services emit typed events" |
| 2026-10-23 | The session reports why it changed (`cause`: tap, drag, drag-end, cancel, undo, redo, restart, hint, brush). `deriveEvents` maps a change to events: tap and drag give place, rotate or erase (place wins over rotate over erase), then `loop-close` for newly closed loops that hold a lantern and `lantern-lit` for newly lit lanterns (core `diffLoops`), then `conflict` when a new unrepairable violation appears and Show conflicts is on; undo and redo are `undo`; restart is `tile-erase`; a hint is `hint` plus any loop events; a drag end, a cancel and a brush change are silent | Drag updates already announced their cells, so drag end must not repeat them; conflicts follow the setting so the sound never leaks what the display hides |
| 2026-10-23 | `diffLoops(puzzle, before, after)` identifies a loop by its cell set. A merge or a split therefore reports the old loops as `broken` and the new ones as `closed`; a lantern counts as lit when it sits on any closed loop (colour is not checked, `computeMarks` stays the display rule) | Pure, no events for a no-op edit |
| 2026-10-23 | Win sounds: `win-3` with 0 hints, `win-2` with 1, `win-1` with 2 or more (same rule as the stars; practice boards use `win-3`), played the moment the board is solved. After the solve is recorded: `daily-done` for the daily only (not the archive), `freeze-used` when the streak freeze was spent, `chapter-unlock` when a chapter opened | One sound per piece of news; archive solves are not "daily done" |
| 2026-10-23 | Generic UI sounds: a delegated click listener on the app root plays `ui-tap` for any enabled button except the toolbar tools, the hint button and the header back arrow; the header back arrow plays `ui-back`; every sheet plays `sheet-open` (emitted from `useSheetBack`, which all sheets use) | Controls with their own feedback do not double up |
| 2026-10-23 | Haptics: light impact for place and rotate (one per 40 ms, shared), medium impact for `loop-close`, success notification for the three wins, warning notification for a new conflict (one per 800 ms), light impact for hint and undo; erase and the rest are silent. Throttles use `performance.now` through an injectable clock. Sound is not throttled (the kit caps simultaneous voices at 16) | As the task specified |
| 2026-10-23 | Motion presets (`src/motion/presets.ts`, all through the kit `createMotion`, so reduced motion applies the last frame at once and starts nothing): tile pop (spring), loop glow (brightness sweep in path order, 28 ms per cell), lantern bloom (spring), win cascade (the task 04 win timeline), screen entrance, sheet entrance (from `useSheetBack`), star pop (140 ms apart in the win sheet), streak flame flicker on Home (one tween every 3.2 s, none when reduced) | Every preset's last keyframe is neutral (scale 1, no filter), so a final frame left on an element is harmless |
| 2026-10-23 | Onboarding is a pure state machine (`src/onboarding/machine.ts`): welcome, tutorial-1, tutorial-2, done; actions start, solved, skip, replay. Skip works at every step and completes the walk; replay always restarts at board one; a returning profile starts in `done`. The Puzzle screen, the welcome card and Settings "Replay tutorial" all go through the machine. `onboardingDone` is saved when the walk completes by solving board two or by Skip | Testable without the UI |
| 2026-10-23 | "Remembered per card in the profile" is implemented as the player's save: coach cards keep using the separate `lantern-loops.ui` save key chosen in task 04 (cleared by Reset progress), not a new field in the versioned profile | Avoids a profile schema bump for a UI hint; behaviour is identical (once per card, persisted) |
| 2026-10-23 | How to play keeps the six-page pager with the final copy (each body at most 60 words, counted by a test) and a static SVG diagram per page built from the real board cell components on a 3 x 3 fixture (`src/howto/fixtures.ts`; a test checks every fixture is a solved board). The daily page adds a seven-dot week, the hints page adds a three-star rating | "Built from the board components and a tiny fixture" |
| 2026-10-23 | About lists each font (family, role, licence, source URL) from `FONT_CREDITS` and each audio pack (name, URL, licence, event ids) from `AUDIO_RECORDS`; a test requires every font face and every record to appear | Credits cannot drift from the shipped files |
