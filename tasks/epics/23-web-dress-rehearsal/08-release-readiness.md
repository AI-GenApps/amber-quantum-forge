---
epic: 23-web-dress-rehearsal
task: 08-release-readiness
status: done
commit_scope: dress-rehearsal
depends_on: [23-web-dress-rehearsal/07-capacitor-packaging]
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
- The game design lives in `.agents/games/dress-rehearsal/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Budgets:** JS bundle at most 300 KB gzip (excluding art, fonts and audio), runtime art at most 8 MB, fonts at most 300 KB, audio at most 2 MB, any single art file at most 400 KB (pieces 60 KB, clients 100 KB).
- **Budget test without relying on prior builds:** `test/budgets.test.ts` calls the Vite JS API `build()` with `outDir` set to `node_modules/.cache/bundle-check` inside the app (gitignored), `logLevel: "silent"`, then gzips the emitted `.js` files with `node:zlib` and sums them. It runs inside the normal `test` command (timeout 60 s).
- **Knowledge base audit:** a test `test/kb-consistency.test.ts` reads the knowledge base files and asserts the numbers shared between them and the code: 6 chapters, 40 challenges, 120 stars, 48 pieces (category counts 8, 7, 5, 6, 6, 6, 4, 6), 6 clients with 7, 7, 7, 7, 6, 6 challenges, 16 rule kinds, unlock stars 0 / 0 / 12 / 27 / 45 / 66, affinity thresholds 3 / 9 / 15, harmony weights 40 / 10 / 20 / 15 / 15 and the bar 70, coin sources and sinks (1460 campaign coins, hints 20 / 30, freeze 25, frames 30 / 40 / 60), gallery cap 24, art slots (63), audio slots (24 sounds, 2 music), port 4015 and the app id.
- **Owner QA checklist** at `.agents/resources/2026-10-23/web-games/dress-rehearsal/qa-checklist.md`: the owner opens the dev server (`bun run --filter '@web-games/dress-rehearsal' dev`, port 4015) in a browser at 360 x 640, 390 x 844 and 430 x 932 and ticks each item. Agents never perform it.
- **No store submission** (owner decision): `store-listing.md` is finalised as a draft and screenshots are left to the owner.

## Implementation Checklist

- [x] Write `test/budgets.test.ts` and `test/kb-consistency.test.ts` as described; add `scripts/check-bundle.ts` (same logic, printable table) for humans.
- [x] Run the four verification commands plus `bun run web-games:typecheck`, `web-games:test` and `web-games:build` from the repo root; if anything outside this game fails, prove it pre-existing in a throwaway worktree of `origin/main` and record it.
- [x] Grep audit written as a test: no `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `http://` or `https://` URL literal in `src/` except the licence and credits source URLs listed in an allowlist; no `Math.random`, `Date.now` in the core; no `console.log`.
- [x] Finish the knowledge base: `README.md` status set to "v1 complete, pending owner QA" with the final quick-facts numbers; `product.md` and `economy.md` match shipped behaviour; `content-plan.md` matches data; `store-listing.md` final draft; `assets-index.md` provenance complete (art, fonts, audio with sizes); `decisions-log.md` has the epic's final entries; `open-questions.md` resolved or carried with owners.
- [x] Write the owner QA checklist `.agents/resources/2026-10-23/web-games/dress-rehearsal/qa-checklist.md` covering: first launch and the `riv-01` tutorial; every screen (home, chapters, challenges, brief, styling, result, export, daily, closet, clients, gallery, settings, how-to, credits); one challenge per chapter and every rule family (palette, era, formality, warmth, features, budget, must and must-not pieces) and the one-piece rule on a dress; 3-star, 2-star, 1-star and 0-star paths; drag, tap and keyboard placement, wrong-slot drops, swap, remove, undo, redo, clear; hints and streak freezes spending coins; daily on today's date, then with the device date moved forward one day and two days (streak, freeze, gap), and backwards; chapter and closet unlocks at 12 / 27 / 45 / 66 stars; client affinity lines and coin payments; gallery save, full gallery and delete; export in all four frames and frame purchases; share (Web Share files, download link and clipboard fallback in a desktop browser); sound, music and haptics toggles; reduced motion and high contrast; text legibility and fonts (no fallback look); offline (network disabled, reload); save persistence across reload and the reset flow; Android back behaviour is device-only and listed as not covered; layout of 8-slot boards on 360 x 640; any visual defects with a place to attach screenshots.
- [x] Write `.agents/resources/2026-10-23/web-games/dress-rehearsal/08/README.md`: command results (real output summaries), budget numbers (bundle KB gzip, art MB, fonts KB, audio KB), test counts, known gaps.
- [x] Tick task 08 and the epic status in `tasks/epics/23-web-dress-rehearsal/STATUS.md` (status: done, pending owner browser QA).

## Files Touched

- `apps-games/dress-rehearsal/test/{budgets,kb-consistency,network-audit}.test.ts`, `scripts/check-bundle.ts`
- `.agents/games/dress-rehearsal/*.md` (final pass)
- `.agents/resources/2026-10-23/web-games/dress-rehearsal/qa-checklist.md`, `.agents/resources/2026-10-23/web-games/dress-rehearsal/08/README.md`
- `tasks/epics/23-web-dress-rehearsal/STATUS.md`

## Acceptance Criteria

- All budgets hold and are enforced by tests that run in the normal `test` command.
- The knowledge base is complete and its shared numbers equal the code and the tests (checked by `kb-consistency.test.ts`).
- The owner QA checklist exists and covers every screen and every rule family listed above.
- The four verification commands pass; any failure outside the game is proven pre-existing.
- The epic status shows tasks 00 to 08 done and says owner browser QA is pending.

## Verification Commands

- `bun run --filter '@web-games/dress-rehearsal*' typecheck`
- `bun run --filter '@web-games/dress-rehearsal*' test`
- `bun run --filter '@web-games/dress-rehearsal' build`
- `bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core`

## Out of Scope

- Running the QA checklist (owner only).
- Store submission, signing, screenshots for stores, privacy policy hosting.
- New features or content changes (open a follow-up task instead).

## Commit message

`chore(dress-rehearsal): add budget tests, final knowledge base and owner QA checklist [23-web-dress-rehearsal/08]`
