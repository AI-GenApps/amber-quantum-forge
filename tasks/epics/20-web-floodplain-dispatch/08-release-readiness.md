---
epic: 20-web-floodplain-dispatch
task: 08-release-readiness
status: todo
commit_scope: floodplain-dispatch
depends_on: [20-web-floodplain-dispatch/07-capacitor-packaging]
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
- The game design lives in `.agents/games/floodplain-dispatch/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Budgets:** JS bundle at most 300 KB gzip (excluding art, fonts and audio), runtime art at most 8 MB, fonts at most 300 KB, audio at most 2 MB, any single art file at most 400 KB.
- **Budget test without relying on prior builds:** `test/budgets.test.ts` calls the Vite JS API `build()` with `outDir` set to `node_modules/.cache/bundle-check` inside the app (gitignored), `logLevel: "silent"`, then gzips the emitted `.js` files with `node:zlib` and sums them. It runs inside the normal `test` command (timeout 60 s).
- **Knowledge base audit:** a test `test/kb-consistency.test.ts` reads the knowledge base files and asserts the numbers shared between them and the code: 40 maps, 120 stars, 193 houses, 133 fields, unlock stars 12 / 33 / 60, theme thresholds, coin sources and sinks (1250 campaign coins), art slots (20), audio slots (25 sounds, 2 music), costs.
- **Owner QA checklist** at `.agents/resources/2026-10-23/web-games/floodplain-dispatch/qa-checklist.md`: the owner opens the dev server (`bun run --filter '@web-games/floodplain-dispatch' dev`, port 4012) in a browser at 360 x 640, 390 x 844 and 430 x 932 and ticks each item. Agents never perform it.
- **No store submission** (owner decision): `store-listing.md` is finalised as a draft and screenshots are left to the owner.

## Implementation Checklist

- [ ] Write `test/budgets.test.ts` and `test/kb-consistency.test.ts` as described; add `scripts/check-bundle.ts` (same logic, printable table) for humans.
- [ ] Run the four verification commands plus `bun run web-games:typecheck`, `web-games:test` and `web-games:build` from the repo root; if anything outside this game fails, prove it pre-existing in a throwaway worktree of `origin/main` and record it.
- [ ] Grep audit written as a test: no `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `http://` or `https://` URL literal in `src/` except the licence/credits source URLs listed in an allowlist; no `Math.random`, `Date.now` in the core; no `console.log`.
- [ ] Finish the knowledge base: `README.md` status set to "v1 complete, pending owner QA" with the final quick-facts numbers; `product.md` and `economy.md` match shipped behaviour; `content-plan.md` matches data; `store-listing.md` final draft; `assets-index.md` provenance complete (art, fonts, audio with sizes); `decisions-log.md` has the epic's final entries; `open-questions.md` resolved or carried with owners.
- [ ] Write the owner QA checklist `.agents/resources/2026-10-23/web-games/floodplain-dispatch/qa-checklist.md` covering: first launch and tutorial on v01; every screen (home, regions, levels, board, playback, result, inspector, daily, themes, records, settings, how-to, credits); one map per region and every mechanic (barrier, surge, pump, gate timing, reservoir with drought, tide and storm tide); 3-star and fail paths; undo, redo, clear, zoom, drag-to-paint, keyboard play; hints and streak freezes spending coins; daily on today's date, then with the device date moved forward one day and two days (streak, freeze, gap), and backwards; theme unlocks; share (clipboard fallback in a desktop browser); sound, music and haptics toggles; reduced motion and high contrast; text legibility and fonts (no fallback look); offline (network disabled, reload); save persistence across reload and the reset flow; Android back behaviour is device-only and listed as not covered; performance feel on the 12 x 16 map; any visual defects with a place to attach screenshots.
- [ ] Write `.agents/resources/2026-10-23/web-games/floodplain-dispatch/08/README.md`: command results (real output summaries), budget numbers (bundle KB gzip, art MB, fonts KB, audio KB), test counts, known gaps.
- [ ] Tick task 08 and the epic status in `tasks/epics/20-web-floodplain-dispatch/STATUS.md` (status: done, pending owner browser QA).

## Files Touched

- `apps-games/floodplain-dispatch/test/{budgets,kb-consistency,network-audit}.test.ts`, `scripts/check-bundle.ts`
- `.agents/games/floodplain-dispatch/*.md` (final pass)
- `.agents/resources/2026-10-23/web-games/floodplain-dispatch/qa-checklist.md`, `.agents/resources/2026-10-23/web-games/floodplain-dispatch/08/README.md`
- `tasks/epics/20-web-floodplain-dispatch/STATUS.md`

## Acceptance Criteria

- All budgets hold and are enforced by tests that run in the normal `test` command.
- The knowledge base is complete and its shared numbers equal the code and the tests (checked by `kb-consistency.test.ts`).
- The owner QA checklist exists and covers every screen and every mechanic listed above.
- The four verification commands pass; any failure outside the game is proven pre-existing.
- The epic status shows tasks 00 to 08 done and says owner browser QA is pending.

## Verification Commands

- `bun run --filter '@web-games/floodplain-dispatch*' typecheck`
- `bun run --filter '@web-games/floodplain-dispatch*' test`
- `bun run --filter '@web-games/floodplain-dispatch' build`
- `bunx biome check apps-games/floodplain-dispatch apps-games/floodplain-dispatch-core`

## Out of Scope

- Running the QA checklist (owner only).
- Store submission, signing, screenshots for stores, privacy policy hosting.
- New features or content changes (open a follow-up task instead).

## Commit message

`chore(floodplain-dispatch): add budget tests, final knowledge base and owner QA checklist [20-web-floodplain-dispatch/08]`
