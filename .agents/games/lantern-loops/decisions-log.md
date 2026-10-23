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

