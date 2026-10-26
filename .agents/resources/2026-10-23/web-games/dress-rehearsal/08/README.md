# Task 08 evidence - release readiness, budgets, knowledge base, owner QA checklist

No browser, Playwright, simulator, emulator, device, APK build or JDK was used, and no image was looked at.
Everything below was checked with Vitest (happy-dom), `tsc`, `vite build` and Biome. The owner runs
`../qa-checklist.md` in a browser at the end.

## Command results (real runs in the worktree, `feat/web-dress-rehearsal`)

| Command | Result |
|---|---|
| `bun run --filter '@web-games/dress-rehearsal*' typecheck` | pass: `dress-rehearsal-core` and `dress-rehearsal` both exit 0 |
| `bun run --filter '@web-games/dress-rehearsal*' test` | pass: core 24 files, 457 tests; app 25 files, 400 tests |
| `bun run --filter '@web-games/dress-rehearsal' build` | pass: 195 modules, `dist/assets/index-*.js` 220.90 kB (71.38 kB gzip), CSS 16.49 kB (3.51 kB gzip) |
| `bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core` | pass: 182 files, no fixes needed |
| `bun run web-games:typecheck` | pass (all web-games packages) |
| `bun run web-games:test` | pass (kit 243 tests, the other games and both Dress Rehearsal packages green) |
| `bun run web-games:build` | pass (all web-games packages) |

Nothing outside this game failed, so no throwaway `origin/main` worktree was needed.

## Budgets (measured by `test/budgets.test.ts`, printed by `bun run scripts/check-bundle.ts`)

| Budget | Limit | Shipped |
|---|---|---|
| JS bundle, gzip (excluding art, fonts, audio) | 300 KB | 73,399 B in 6 files (main chunk 220.9 KB raw, 71.4 KB gzip) |
| Runtime art | 8 MB total, any file at most 400 KB (pieces 60 KB, clients 100 KB) | 754,078 B in 58 WebP files; largest `client-6.webp` 42,024 B |
| Fonts | 300 KB total (each at most 120 KB) | 120,408 B in 3 woff2 files |
| Audio | 2 MB total | 1,000,013 B in 26 Ogg files |

The budget test calls the Vite JS API `build()` with `outDir` `node_modules/.cache/bundle-check` (gitignored),
`publicDir: false` and `logLevel: "silent"`, gzips every emitted `.js` file with `node:zlib` and sums them, so it
never depends on an earlier build. Shared logic lives in `scripts/budgets.ts`; `scripts/check-bundle.ts` prints
the table and exits 1 when over budget.

## Tests added or changed

| File | Tests | What it pins |
|---|---|---|
| `test/budgets.test.ts` | 7 | the budgets above, 58 art files (46 pieces, 6 clients, 6 backdrops), 3 fonts, 26 audio files, violation detection |
| `test/kb-consistency.test.ts` | 20 | the numbers shared by the knowledge base and the code: 6 chapters, 40 challenges (7, 7, 7, 7, 6, 6), 120 stars, 48 pieces (8, 7, 5, 6, 6, 6, 4, 6), closet sizes 16 / 16 / 24 / 32 / 40 / 48, 6 clients, 16 rule kinds, 7 daily fallbacks, unlocks 0 / 0 / 12 / 27 / 45 / 66, affinity 3 / 9 / 15, harmony 40 / 10 / 20 / 15 / 15 and the bar 70, coins (40 grant, 1460 campaign total, hints 20 / 30, freeze 25, frames 30 / 40 / 60), gallery 24, 63 art slots, 24 sounds and 2 loops, port 4015, app id |
| `test/network-audit.test.ts` | 13 | no `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`, `http://`, https literal outside `data/credits.ts` (only github.com, kenney.nl, opengameart.org), remote `index.html` resources, `Math.random`, `Date.now` or `console.log` in `src/` or the core |
| `test/source-audit.test.ts` | 5 | source hygiene only (the network block moved to `network-audit.test.ts`) |
| `test/sources.ts` | helper | shared source-tree walker |

## Knowledge base pass (`.agents/games/dress-rehearsal/`)

README status "v1 complete, pending owner QA" with final quick facts and shipped budgets; `assets-index.md` release
totals and the three placeholder slots; `store-listing.md` final draft (assets table with status, screenshots and
privacy URL left to the owner); `decisions-log.md` D34; `open-questions.md` Q7 closed, Q14 and Q15 added, task 08
notes with owners. `product.md`, `economy.md` and `content-plan.md` needed no change: `kb-consistency.test.ts`
confirms their numbers equal the code.

## Art evidence (from the designer review loop)

`art/art-bible.md`, `art/reviews/<batch>/round-<n>.md` (every `review/review.md`, byte-identical to the inbox) and
`art/accepted-manifest.json` were already copied in task 06 and re-verified identical to
`/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/dress-rehearsal/` in this task; the 60 masters are unchanged. Only
files from the orchestrator's `accepted/` set are used. Not used (code-drawn placeholder kept, listed in
`assets-index.md` and `open-questions.md` Q13 and Q14): `key-art` (no file delivered, cover attempts failed),
`item-rainy-city-5` (no file delivered, all four candidates failed the designer's self-review) and `item-studio-3`
(rejected: flat vector-sticker style, ruler-straight cone skirt, unreadable wrap band, airbrushed grey ribbons, thin
outline at small sizes).

## Known gaps

- Owner browser QA has not been run (`../qa-checklist.md`); drag with a real pointer and touch, the exported PNGs,
  the Web Share sheet, font rendering, audio balance, art crops and layout at 360 x 640 are unchecked by any agent.
- Device-only items are not covered: Android back button, native haptics, native image share (Q4), the icon and
  splash on a phone, the Capacitor builds (no JDK, Xcode or device).
- Three art slots keep code-drawn placeholders (Q13, Q14).
- Kit follow-ups K1, K3, K4, K5 are open for the kit owner (none blocks v1).
- The decisions log has two entries numbered D12; both keep their number because `open-questions.md` cites one.
- No store submission, signing, store screenshots or privacy policy hosting (out of scope by owner decision).
