---
epic: 24-web-lost-parcel-desk
task: 08-release-readiness
status: done
commit_scope: lost-parcel-desk
depends_on: [24-web-lost-parcel-desk/07-capacitor-packaging]
estimate: M
owner: agent
---

# Release readiness, budgets, knowledge base, owner QA checklist

## Goal

Make the game releasable: enforce the bundle, art, font and audio budgets by tests, audit the code for network and nondeterminism, prove the knowledge base matches the code, finalise the store listing draft and write the owner browser QA checklist.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/lost-parcel-desk/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** All of `.agents/games/lost-parcel-desk/`, `assets-index.md` "Release totals and budgets" and the epic `STATUS.md`.
- **Budgets:** JS bundle at most 300 KB gzip (excluding art, fonts and audio), runtime art at most 8 MB, fonts at most 300 KB, audio at most 2 MB, any single art file at most 400 KB.
- **Budget test without relying on prior builds:** `test/budgets.test.ts` calls the Vite JS API `build()` with `outDir` set to `node_modules/.cache/bundle-check` inside the app (gitignored), `logLevel: "silent"`, then gzips the emitted `.js` files with `node:zlib` and sums them. It runs inside the normal `test` command (timeout 60 s).
- **Knowledge base audit:** `test/kb-consistency.test.ts` reads the knowledge base files and asserts the numbers shared between them and the code: 12 cases, 3 chapters, 36 stamps, 49 objects, 70 clues (33 lead, 37 flavour), 24 deductions (12 direct, 9 pair, 3 rule-out), 12 townsfolk, 24 almanac entries, unlock stamps 7 and 18, theme thresholds 0, 6, 14, 24, 33, postage sources and sinks (450 from the campaign, hints 20 and 15, freeze 30), 12 achievements, 67 art slots, 27 sounds and 2 music loops, port 4016, app id.
- **Owner QA checklist** at `.agents/resources/2026-10-23/web-games/lost-parcel-desk/qa-checklist.md`: the owner opens the dev server (`bun run --filter '@web-games/lost-parcel-desk' dev`, port 4016) in a browser at 360 x 640, 390 x 844 and 430 x 932 and ticks each item. Agents never perform it.
- **No store submission** (owner decision): `store-listing.md` is finalised as a draft and screenshots are left to the owner.

## Implementation Checklist

- [x] Write `test/budgets.test.ts`, `test/kb-consistency.test.ts` and `test/network-audit.test.ts` as described; add `scripts/check-bundle.ts` (same logic, printable table) for humans.
- [x] Run the four verification commands plus `bun run web-games:typecheck`, `web-games:test` and `web-games:build` from the repo root; if anything outside this game fails, prove it pre-existing in a throwaway worktree of `origin/main` and record it.
- [x] Grep audit written as a test: no `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `http://` or `https://` URL literal in `src/` except the licence and credits source URLs listed in an allowlist; no `Math.random`, `Date.now` in the core; no `console.log`.
- [x] Finish the knowledge base: `README.md` status set to "v1 complete, pending owner QA" with the final quick-facts numbers; `product.md` and `economy.md` match shipped behaviour; `content-plan.md` matches data; `store-listing.md` final draft; `assets-index.md` provenance complete (art, fonts, audio with sizes); `decisions-log.md` has the epic's final entries; `open-questions.md` resolved or carried with owners.
- [x] Write the owner QA checklist `qa-checklist.md` covering: first launch and the case 01 tutorial; every screen (home, case files, intro, table, viewer, board, reveal, town map, almanac, ledger, daily, achievements, records, themes, settings, how-to, credits); one case per mechanic (direct clues: case 01 to 04; key-and-lock pairs: cases 05, 07, 08, 09, 12; rule-outs: cases 06, 10, 11; the five-object finale); the 3-stamp, 2-stamp, 1-stamp and elimination paths; the two-witness rule at 0 and 1 links; flip, magnifier and hotspots on an object with a zoom clue; pin, unpin, link, rule-out and remove-link; hints spending postage (20 and 15) and streak freezes (30); the chapter 2 and chapter 3 unlocks at 7 and 18 stamps; replaying a case to raise stamps; the Daily Parcel on today's date, then with the device date moved forward one day and two days (streak, freeze, gap) and backwards; the Almanac and Townsfolk Book; the ledger and town map filling in; desk themes unlocking; achievements; share (clipboard fallback in a desktop browser); sound, music and haptics toggles; reduced motion and high contrast; text legibility and fonts (no fallback look); offline (network disabled, reload); save persistence across reload, resuming a case in progress, and the reset flow; Android back behaviour is device-only and listed as not covered; any visual defects with a place to attach screenshots.
- [x] Write `.agents/resources/2026-10-23/web-games/lost-parcel-desk/08/README.md`: command results (real output summaries), budget numbers (bundle KB gzip, art MB, fonts KB, audio KB), test counts, known gaps.
- [x] Tick task 08 and the epic status in `tasks/epics/24-web-lost-parcel-desk/STATUS.md` (status: done, pending owner browser QA).

## Files Touched

- `apps-games/lost-parcel-desk/test/{budgets,kb-consistency,network-audit}.test.ts`, `scripts/check-bundle.ts`
- `.agents/games/lost-parcel-desk/*.md` (final pass)
- `.agents/resources/2026-10-23/web-games/lost-parcel-desk/qa-checklist.md`, `.agents/resources/2026-10-23/web-games/lost-parcel-desk/08/README.md`
- `tasks/epics/24-web-lost-parcel-desk/STATUS.md`

## Acceptance Criteria

- All budgets hold and are enforced by tests that run in the normal `test` command.
- The knowledge base is complete and its shared numbers equal the code and the tests (checked by `kb-consistency.test.ts`).
- The owner QA checklist exists and covers every screen and every mechanic listed above.
- The four verification commands pass; any failure outside the game is proven pre-existing.
- The epic status shows tasks 00 to 08 done and says owner browser QA is pending.

## Verification Commands

- `bun run --filter '@web-games/lost-parcel-desk*' typecheck`
- `bun run --filter '@web-games/lost-parcel-desk*' test`
- `bun run --filter '@web-games/lost-parcel-desk' build`
- `bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core`

## Out of Scope

- Running the QA checklist (owner only).
- Store submission, signing, screenshots for stores, privacy policy hosting.
- New features or content changes (open a follow-up task instead).

## Commit message

`chore(lost-parcel-desk): add budget tests, final knowledge base and owner QA checklist [24-web-lost-parcel-desk/08]`
