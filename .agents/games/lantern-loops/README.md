# Lantern Loops — knowledge base

Daily logic puzzles: route light from lanterns through a grid so every lantern is lit, every path closes into loops, and board constraints are satisfied. Calm, clever, shareable.

Single source of truth for the game (working title, slug `lantern-loops`, epic 19). Keep it current:
every decision or number change is updated here in the same commit as the code. Evidence lives under
`.agents/resources/2026-10-23/web-games/lantern-loops/`.

| File | Use it to answer |
|---|---|
| [`product.md`](product.md) | The exact v1 rules, controls, screens, onboarding, accessibility |
| [`economy.md`](economy.md) | Every currency, source, sink, cap and streak number |
| [`content-plan.md`](content-plan.md) | The complete named content list (4 chapters, 120 puzzles, clue objects, colours, medallions) that drives the art briefs |
| [`store-listing.md`](store-listing.md) | Draft store answers (descriptions, category, content rating, data safety) |
| [`assets-index.md`](assets-index.md) | Art slots, fonts, audio, code and evidence locations |
| [`decisions-log.md`](decisions-log.md) | Dated owner and design decisions with rationale |
| [`open-questions.md`](open-questions.md) | Unresolved items and kit follow-ups |

## Quick facts

| | |
|---|---|
| Working title / slug | Lantern Loops / `lantern-loops` (public name = working title in v1) |
| Package ids | app `@web-games/lantern-loops` (`apps-games/lantern-loops`), rules `@web-games/lantern-loops-core` (`apps-games/lantern-loops-core`), kit `@web-games/kit` |
| Capacitor | appId `app.w3dev.lanternloops`, appName `Lantern Loops`, webDir `dist`, portrait, dev port 4011 |
| Stack | TypeScript 5.9.3, Preact 11.0.1, Vite 8.3.4, Vitest 5.0.5 (happy-dom), Capacitor 8.5.3, DOM/SVG rendering |
| Platforms | Android and iOS (Capacitor projects, no store submission in v1), web build for owner QA |
| Board | N x N grid, N = 5 to 9, tiles = straight or corner paths (bitmask N=1, E=2, S=4, W=8) |
| Mechanics | Lanterns and loops (Harbor), numbered stones (Garden), mirrors (Bridge), colour gates and five lantern colours (Sky) |
| Campaign | 120 puzzles, 4 chapters of 30: Harbor, Garden, Bridge, Sky; every puzzle proven to have exactly one solution |
| Chapter sizes | Harbor 10 x 5x5 + 10 x 6x6 + 10 x 7x7; Garden 5/10/10/5 on 5x5/6x6/7x7/8x8; Bridge 4/8/8/6/4 on 5x5 to 9x9; Sky 4/8/10/8 on 6x6 to 9x9 |
| Chapter unlocks | Harbor open; Garden at 45 total stars, Bridge at 120, Sky at 210 (maximum 360) |
| Stars | 0 hints = 3 stars, 1 hint = 2, 2 or more hints = 1 |
| Daily | Generated on device from the local date; Mon 5x5 (easy) to Sun 9x9 (hardest); 30-day archive; unique and solvable for 365 consecutive dates (test) |
| Hint tokens | Start 3, cap 20, cost 1 per hint; earned from dailies, streak milestones, archive, chapter clears; never sold |
| Streak freeze | 1 per ISO week (cap 1), spent automatically on exactly one missed day |
| Fonts | Fraunces (display) + Nunito (body), OFL, bundled woff2 |
| Art | 15 slots (icon, key art, 6 lanterns, 4 backdrops, daily medallion, empty archive, feature graphic); budget <= 8 MB WebP; code-drawn fallbacks for every slot |
| Audio | CC0 only: Kenney packs for 17 effects (mono MP3, 1 to 13 KB each) and one OpenGameArt music loop (`calm-loop`, 307 KB); 386 KB in total, budget 1.5 MB (effects <= 60 KB, music <= 1 MB); source URL, licence and SHA-256 recorded per file in `assets-index.md` |
| Budgets | JS bundle <= 300 KB gzip (art, fonts, audio excluded), art <= 8 MB, audio <= 1.5 MB, each woff2 <= 120 KB |
| Monetization | None in v1: no ads, no IAP, no accounts, no network calls |
| Save | Versioned local save (Capacitor Preferences on device, `localStorage` on web) with migrations |
| QA | Agents run headless checks only; the owner does browser QA from `.agents/resources/2026-10-23/web-games/lantern-loops/qa-checklist.md` |
| Epic | [`tasks/epics/19-web-lantern-loops`](../../../tasks/epics/19-web-lantern-loops/STATUS.md) |
| Shared kit | [`.agents/games/web-games-kit/`](../web-games-kit/README.md) |
| Fixed tiles (anchors) | Real shares of solution tiles, median per chapter: Harbor 31.3%, Garden 19%, Bridge 16.3%, Sky 12.5%; maximum 33.3% (limits: median <= 35%, hard limit 50%, unchanged) |
| Generator | `ll-gen-1`, seeded integer PRNG (mulberry32), campaign seed = FNV-1a of `ll-gen-1\|<puzzle id>`; the whole campaign regenerates in about 2 s with `bun run generate` in `apps-games/lantern-loops-core` |
| Difficulty rating | 1 to 5 from solver statistics (guesses, undecided cells after propagation, board size); non-decreasing over the five bands of six puzzles |
| Status (2026-10-23) | Tasks 00 to 04 done (knowledge base, rules, solver, 120 proven-unique puzzles, progression, economy, daily mode, save, all screens, SVG board, tokens, fonts, accessibility). Task 05 in progress: CC0 audio, haptics, motion polish, onboarding machine, how-to diagrams |
