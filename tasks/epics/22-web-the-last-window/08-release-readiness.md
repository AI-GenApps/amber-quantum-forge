---
epic: 22-web-the-last-window
task: 08-release-readiness
status: done
commit_scope: the-last-window
depends_on: [22-web-the-last-window/07-capacitor-packaging]
estimate: M
owner: agent
---

# Release readiness, budgets, knowledge base, owner QA checklist

## Goal

Close the epic: enforce the budgets with tests, run every check, finish and cross-check the knowledge base, and write the owner browser QA checklist. After this task the branch is ready for the orchestrator to open the PR; the owner does the browser QA at the end.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/the-last-window/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Budgets:** JS bundle at most 300 KB gzip (excluding art, fonts and audio), runtime art at most 8 MB, fonts at most 300 KB, audio at most 2 MB, any single 800 x 1200 art file at most 400 KB, busts 120 KB, objects 60 KB.
- **Budget test without relying on prior builds:** `test/budgets.test.ts` calls the Vite JS API `build()` with `outDir` set to `node_modules/.cache/bundle-check` inside the app (gitignored), `logLevel: "silent"`, then gzips the emitted `.js` files with `node:zlib` and sums them. It runs inside the normal `test` command (timeout 60 s).
- **Knowledge base audit:** `test/kb-consistency.test.ts` reads the knowledge base files and asserts the numbers shared between them and the code: 14 days, 130 customers (48 regular visits, 82 walk-ins), 8 regulars, 40 scenes, 12 choices, 16 endings, 24 finale lines, 14 diary entries, 6 drinks, 5 pastries, 5 books, 5 moods, 8 decor items totalling 1,200, starting coins 30, scene gifts 280, FP thresholds `[1, 2, 4, 6, 8]` and cap 8, shift lengths 180, 210, 240 s, 3 seats, art slots 54 (4, 9, 16, 25), audio slots (33 sounds, 3 music), price and stock-cost tables, shelf slots, tip percentages, closing bonuses, Late Shift caps.
- **Owner QA checklist** at `.agents/resources/2026-10-23/web-games/the-last-window/qa-checklist.md`: the owner opens the dev server (`bun run --filter '@web-games/the-last-window' dev`, port 4014) in a browser at 360 x 640, 390 x 844 and 430 x 932 and ticks each item. Agents never perform it.
- **No store submission** (owner decision): `store-listing.md` is finalised as a draft and screenshots are left to the owner.

## Implementation Checklist

- [x] Write `test/budgets.test.ts` and `test/kb-consistency.test.ts` as described; add `scripts/check-bundle.ts` (same logic, printable table) for humans.
- [x] Run the four verification commands plus `bun run web-games:typecheck`, `web-games:test` and `web-games:build` from the repo root; if anything outside this game fails, prove it pre-existing in a throwaway worktree of `origin/main` under the scratch directory and record it.
- [x] Grep audit written as a test: no `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `http://` or `https://` URL literal in `src/` except the licence and credits source URLs listed in an allowlist; no `Math.random`, `Date.now` in the core; no `console.log`.
- [x] Finish the knowledge base: `README.md` status set to "v1 complete, pending owner QA" with the final quick-facts numbers; `product.md` and `economy.md` match shipped behaviour; `content-plan.md` matches data; `store-listing.md` final draft; `assets-index.md` provenance complete (art, fonts, audio with sizes); `decisions-log.md` has the epic's final entries; `open-questions.md` resolved or carried with owners.
- [x] Write the owner QA checklist covering: first launch and the Day 1 tutorial (all 7 coach steps, skip, replay from How to play); every screen (title, home, day intro, stock plan, shift, result, scene, shop, journal, recipes, Late Shift lobby, settings, how to play, credits); every drink and pastry recipe including a wrong step and the oven timer while another order is made; book moods and substitutes; seat selection, three seats, door wait and turn-away; patience bar, warning at 10 s and a customer leaving; delighted, satisfied, disappointed outcomes with tips; stock plan limits, cake stand and ladder slot upgrades, sold-out pastry substitute; one morning, one evening and one rain shift (art, light, ambient rain, +1 customer); every decor purchase and effect; at least two regulars' full arcs with each choice combination and both endings, guarded lines, the Journal replay and the Day 14 Lantern Night finale; scenes queued over the cap carried to the next evening; closing grade and bonuses; Late Shifts on today's date, then with the device date moved forward one day (streak, Lamp Bonus once), two days (gap resets) and backwards; share (clipboard fallback in a desktop browser); sound, music and haptics toggles; reduced motion, high contrast, text size 125 percent, relaxed mode, recipe guide off; fonts (no fallback look) and legibility at all three sizes; hit areas; offline (network disabled, reload); save persistence across reload and the reset flow; Android back is device-only and listed as not covered; performance feel with 3 seated customers; any visual defects with a place to attach screenshots.
- [x] Write `.agents/resources/2026-10-23/web-games/the-last-window/08/README.md`: command results (real output summaries), budget numbers (bundle KB gzip, art MB, fonts KB, audio KB), test counts, known gaps.
- [x] Tick task 08 and set the epic status in `tasks/epics/22-web-the-last-window/STATUS.md` to done, pending owner browser QA.

## Files Touched

- `apps-games/the-last-window/test/{budgets,kb-consistency,network-audit}.test.ts`, `scripts/check-bundle.ts`
- `.agents/games/the-last-window/*.md` (final pass)
- `.agents/resources/2026-10-23/web-games/the-last-window/qa-checklist.md`, `.agents/resources/2026-10-23/web-games/the-last-window/08/README.md`
- `tasks/epics/22-web-the-last-window/STATUS.md`

## Acceptance Criteria

- All budgets hold and are enforced by tests that run in the normal `test` command.
- The knowledge base is complete and its shared numbers equal the code and the tests (checked by `kb-consistency.test.ts`).
- The owner QA checklist exists and covers every screen and every mechanic listed above.
- The four verification commands pass; any failure outside the game is proven pre-existing.
- The epic status shows tasks 00 to 08 done and says owner browser QA is pending.

## Verification Commands

- `bun run --filter '@web-games/the-last-window*' typecheck`
- `bun run --filter '@web-games/the-last-window*' test`
- `bun run --filter '@web-games/the-last-window' build`
- `bunx biome check apps-games/the-last-window apps-games/the-last-window-core`

## Out of Scope

- Running the QA checklist (owner only).
- Store submission, signing, screenshots for stores, privacy policy hosting.
- New features or content changes (open a follow-up task instead).

## Commit message

`chore(the-last-window): add budget tests, final knowledge base and owner QA checklist [22-web-the-last-window/08]`
