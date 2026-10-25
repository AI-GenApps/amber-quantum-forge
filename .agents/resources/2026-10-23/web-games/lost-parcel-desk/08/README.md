# Task 08 - release readiness evidence

Date: 2026-10-23. Nothing here was seen in a browser, on a device or in an emulator (owner decision); every result comes from
Vitest (happy-dom), `tsc`, `vite build` and Biome. The owner's browser pass is `../qa-checklist.md`.

## Added

- `apps-games/lost-parcel-desk/test/budgets.test.ts` - 4 tests. Calls the Vite JS API `build()` into
  `node_modules/.cache/bundle-check` (gitignored, `logLevel: "silent"`, no public dir), gzips the emitted `.js` files with
  `node:zlib` and checks 300 KB; then art (61 files, 8 MB, any file 400 KB), fonts (3 files, 300 KB) and audio (29 files, 2 MB).
- `apps-games/lost-parcel-desk/scripts/bundle-lib.ts` and `scripts/check-bundle.ts` - the same measurement as a printable table
  (`bun scripts/check-bundle.ts`, exit 1 when over budget).
- `apps-games/lost-parcel-desk/test/network-audit.test.ts` - 15 tests (the task 04 `audit.test.ts`, renamed and extended): no
  `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`; no `http(s)://` literal outside `data/credits.ts`; the
  credits links are https and only on kenney.nl, opengameart.org and github.com; no remote CSS or HTML resource; no `Math.random`
  or `Date.now` in the core; no `Math.random` in the app; no `console.log`; files under 800 lines; no `any`; no service worker
  or analytics.
- `apps-games/lost-parcel-desk/test/kb-consistency.test.ts` - 25 tests tying the knowledge base to the code and to `public/`
  (counts, unlock stamps, theme thresholds, postage 450 = 30 + 120 + 180 + 120, hint and freeze prices, 67 art slots, 27 sounds and
  2 music loops, port 4016, app id, every case index row, the four rejected slots, measured art / font / audio bytes, store field
  limits, open-question owners, QA checklist coverage).
- `../qa-checklist.md` - owner QA checklist (18 screens, 12 cases, stamp paths, two-witness rule, hints, unlocks, Daily Parcel date
  moves, share, audio, accessibility, offline, persistence, reset, not-covered list, defect table).
- Knowledge base final pass: `README.md` status "v1 complete, pending owner QA", `assets-index.md` release totals, `store-listing.md`
  final draft, `decisions-log.md` task 08 entry, `open-questions.md` (Q22 added, header updated).
- Art evidence: the art bible, 27 review notes and the designer manifest already sit in `../art/` (`art-bible.md`, `review/`,
  `designer-manifest.json`); a byte comparison with the inbox (`aqf-art-inbox/lost-parcel-desk/`) found all 27 review notes, the
  bible and `accepted/manifest.json` identical. The accepted list for this run equals the 63 slots integrated in task 06; the
  four rejected slots (`key-art`, `evidence-04-3`, `evidence-08-1`, `townsfolk-9`) keep code-drawn placeholders and are listed
  in `assets-index.md` and `open-questions.md` (Q19).

## Budget numbers (`bun scripts/check-bundle.ts`)

| Budget | Measured | Limit |
|---|---|---|
| JS bundle (gzip) | 75.0 KB (6 files, 217.8 KB raw) | 300 KB |
| Runtime art | 61 files, 1,848,678 bytes (1805.3 KB); largest 44,542 bytes | 8 MB; 400 KB per file |
| Fonts | 3 woff2 files, 79,884 bytes (78.0 KB) | 300 KB |
| Audio | 29 Ogg files, 913,216 bytes (891.8 KB) | 2 MB |

## Command results

| Command | Result |
|---|---|
| `bun run --filter '@web-games/lost-parcel-desk*' typecheck` | pass, both packages exit 0 |
| `bun run --filter '@web-games/lost-parcel-desk*' test` | pass: core 25 files / 496 tests, app 33 files / 433 tests |
| `bun run --filter '@web-games/lost-parcel-desk' build` | pass, 218 modules, `dist/assets/index-*.js` 218.67 kB (74.75 kB gzip) |
| `bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core` | pass, 204 files, no fixes |
| `bun run web-games:typecheck` | pass, 13 packages exit 0 |
| `bun run web-games:build` | pass, 13 packages exit 0 |
| `bun run web-games:test` | pass, every package exit 0 (kit 243 tests, floodplain-dispatch 461 + 665, lost-parcel-desk 433 + 496, the skeleton games 3 + 8 each) |

No failure occurred, so no throwaway `origin/main` worktree was needed.

## Known gaps

- Four art slots are placeholders (Q19); the title screen has no key art, and the splash and icon differ in style (Q21).
- Sound and music were chosen without listening, and no art was looked at (Q16, Q17, Q18); the owner judges them.
- Ogg decoding in Safari and iOS WKWebView is unverified (Q15); hardware Back, haptics and the native shell are device-only (Q22).
- `bun run build:art` hangs under Bun 1.4.3 with sharp (Q20, tooling); it was not needed in this task.
- Store submission, screenshots, privacy policy hosting and signing are out of scope.
