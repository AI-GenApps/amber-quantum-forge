# Task 08 - release readiness (evidence)

Run on 2026-10-23/24 in the worktree `aqf-wt/web-floodplain-dispatch` (branch
`feat/web-floodplain-dispatch`). No browser, device or emulator was used.

## New files

- `apps-games/floodplain-dispatch/scripts/bundle-lib.ts` - shared budget logic (Vite JS API build,
  gzip sum, asset sizes).
- `apps-games/floodplain-dispatch/scripts/check-bundle.ts` - prints the budget table (`bun scripts/check-bundle.ts`).
- `apps-games/floodplain-dispatch/test/budgets.test.ts` - 4 tests, builds into `node_modules/.cache/bundle-check`.
- `apps-games/floodplain-dispatch/test/kb-consistency.test.ts` - 15 tests, knowledge base against code.
- `apps-games/floodplain-dispatch/test/network-audit.test.ts` - 12 tests, source grep audit.
- Knowledge base final pass in `.agents/games/floodplain-dispatch/` and the owner checklist
  `../qa-checklist.md`.

## Command results

| Command | Result |
|---|---|
| `bun run --filter '@web-games/floodplain-dispatch*' typecheck` | pass (core and app exit 0) |
| `bun run --filter '@web-games/floodplain-dispatch*' test` | pass: core 34 files / 665 tests, app 27 files / 461 tests |
| `bun run --filter '@web-games/floodplain-dispatch' build` | pass: 192 modules, main chunk 239.70 kB (78.48 kB gzip), CSS 9.48 kB |
| `bunx biome check apps-games/floodplain-dispatch apps-games/floodplain-dispatch-core` | pass: 196 files, no fixes needed |
| `bun run web-games:typecheck` | pass, all 13 packages |
| `bun run web-games:build` | pass, all 13 packages |
| `bun run web-games:test` | pass: kit 21 files / 243 tests, the five other games 2 files each (3 app tests, 8 core tests), Floodplain Dispatch as above |

No failure occurred outside this game, so no throwaway `origin/main` worktree was needed.

## Budget numbers

| Budget | Limit | Shipped |
|---|---|---|
| JS bundle (gzip, six `.js` files, art/fonts/audio excluded) | 300 KB | 78.6 KB (raw 238.3 KB) |
| Runtime art (17 WebP) | 8 MB; any file 400 KB | 153,586 bytes (150.0 KB); largest file 24.0 KB |
| Fonts (3 woff2) | 300 KB | 73,364 bytes (71.6 KB) |
| Audio (27 Ogg) | 2 MB | 962,201 bytes (939.7 KB) |

Source: `bun scripts/check-bundle.ts` and `test/budgets.test.ts`.

## Test counts

Floodplain Dispatch: 1,126 tests (core 665, app 461) in 61 files. The three new files add 31 tests.

## Art evidence

The art bible, the designer manifest, the accepted masters and the review notes of every round
(b1 rounds 1 to 4, b2 round 1, b3 rounds 1 to 3, retry rounds 1 to 3) are already in
`../art/` (copied in task 06; the review notes and the art bible were byte-compared with the
designer inbox again in this task and are identical). 19 of 20 slots are accepted. `key-art` was
rejected in the final round and keeps its code-drawn placeholder; the reasons are quoted in
`open-questions.md` (Q25) and `assets-index.md`.

## Known gaps

- Nothing was seen in a browser or on a device. The owner runs `../qa-checklist.md`.
- Android back behaviour, real haptics, iOS audio decoding of Ogg (Q21), app icon and launch screen
  on device (Q31, Q32) are device-only.
- Cheaper placements than par exist on 27 of 40 campaign maps (Q10) and on daily maps (Q13); the
  bounded solver fails on 5 campaign maps (Q14, never used in play).
- `key-art` placeholder (Q25).
- Store submission, screenshots, signing and the privacy policy URL are out of scope for v1.
