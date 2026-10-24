# The Last Window release readiness evidence (task 08)

Date: 2026-10-25. Produced headlessly: no browser, simulator, emulator, device, APK or screenshot. Every
number below comes from a command run in the worktree `feat/web-the-last-window`.

## What was added

| File | Purpose |
|---|---|
| `apps-games/the-last-window/scripts/budget-lib.ts` | Shared measuring code: Vite JS API `build()` into `node_modules/.cache/bundle-check`, gzip of the emitted `.js`, sizes of art, fonts and audio, per-file art limits |
| `apps-games/the-last-window/scripts/check-bundle.ts` | Prints the same numbers as a table for humans (`bun scripts/check-bundle.ts`); exits 1 when a budget is broken |
| `apps-games/the-last-window/test/budgets.test.ts` | 7 tests: JS gzip, raw JS, art total and per-file, fonts, audio, no remote origin in `index.html` |
| `apps-games/the-last-window/test/kb-consistency.test.ts` (+ `test/kbDocs.ts`) | 23 tests: shared numbers between the knowledge base and the code, measured sizes, store listing lengths, open-question table |
| `apps-games/the-last-window/test/network-audit.test.ts` | 7 tests: no network API, URL allowlist, no `Math.random` or clock in the core, no `console.log` |
| `apps-games/the-last-window/scripts/qa-saves.ts`, `make-qa-saves.ts`, `test/qa-saves.test.ts` | Four ready-made saves for the owner QA, checked against the game's own `sanitizeProfile` (4 tests) |
| `qa-checklist.md`, `qa-saves/*.json` | Owner browser checklist and the four saves |
| `.agents/games/the-last-window/*.md` | Final pass (see below) |

Knowledge base changes: README status "v1 complete, pending owner QA" and a measured-numbers row;
`assets-index.md` header, release totals table with shipped numbers and the corrected "shipped 1.05 MB" art
note; `content-plan.md` decor total line; `product.md` onboarding step 1 wording (the shop note is the modal first
card of the Day 1 shift); `store-listing.md` final draft; `open-questions.md` Q14 and task 08 findings;
`decisions-log.md` task 08 section. Art evidence: the two missing review notes (`b1-round-2.md`,
`b6-round-4.md`) were added to `art/review/`, which now holds all 19 designer review notes next to
`art/art-bible.md` and `art/accepted-manifest.json` (identical to the inbox copies).

## Verification commands (real results)

| Command | Result |
|---|---|
| `bun run --filter '@web-games/the-last-window*' typecheck` | pass, both packages exit 0 |
| `bun run --filter '@web-games/the-last-window*' test` | pass: core 37 files, 604 tests; app 28 files, 412 tests (was 24 files, 371 tests before this task: +4 files, +41 tests) |
| `bun run --filter '@web-games/the-last-window' build` | pass, 227 modules, `dist/assets/index-*.js` 266.23 kB (87.40 kB gzip by Vite's default level) |
| `bunx biome check apps-games/the-last-window apps-games/the-last-window-core` | pass, 227 files, no fixes needed |
| `bun run web-games:typecheck` (repo root) | pass, all 13 packages |
| `bun run web-games:test` (repo root) | pass: kit 243 tests, the other games and The Last Window all green |
| `bun run web-games:build` (repo root) | pass, exit 0 |

No failure occurred outside this game, so no throwaway worktree of `origin/main` was needed and nothing is
recorded as pre-existing.

## Budget numbers (`bun scripts/check-bundle.ts`)

| Group | Used | Limit |
|---|---|---|
| JS bundle (gzip, level 9, 6 files) | 86.7 KiB (raw 264.2 KiB; main chunk 84.7 KiB gzip) | 300 KiB |
| Runtime art (52 webp) | 1.05 MiB (1,101,464 bytes) | 8 MiB |
| Fonts (2 woff2) | 50.7 KiB (51,876 bytes) | 300 KiB |
| Audio (36 ogg) | 1.15 MiB (1,202,588 bytes) | 2 MiB |
| Art files over their per-file limit | 0 (800 x 1200: 400 KB, busts 120 KB, objects 60 KB) | 0 |

## Test counts

| Package | Files | Tests |
|---|---|---|
| `@web-games/the-last-window-core` | 37 | 604 |
| `@web-games/the-last-window` | 28 | 412 |

## Art track

Accepted by the designer review loop: 54 of 54 slots; rejected or not generated: none. Provenance per slot
is in `assets-index.md`; the art bible, the accepted manifest and the review notes are under `art/`.

## Findings worth the orchestrator's attention

- The web build has no service worker, so a browser reload with no network and no server fails; only the
  Capacitor shells are offline on reload. Recorded as Q14 (no kit or dependency change was allowed).
- The checklist item "device date moved forward / backwards" needs the owner's computer clock changed
  (the game reads the local date); there is no in-game debug date.
- The owner can load `qa-saves/*.json` through the DevTools console instead of playing about an hour to
  reach Day 14 and the Late Shift lobby.

## Known gaps

- Nothing has been looked at in a browser, on a device or in Android Studio or Xcode: layout at 360 x 640,
  390 x 844 and 430 x 932, sound quality and balance (Q1, Q8, Q9, Q11), walk-in silhouettes (Q12), the icon
  and splash (Q13) are all judged by the owner in `qa-checklist.md`.
- Store submission, store screenshots and the privacy policy URL (Q3) are out of scope for v1.
- Android `INTERNET` permission kept (Q10).
