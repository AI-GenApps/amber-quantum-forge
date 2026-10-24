# Task 08 evidence: release readiness, budgets, audits and owner QA checklist

Headless only: Vitest (happy-dom), `tsc`, `vite build` and Biome. No browser, Playwright, simulator,
emulator, device, screenshot, APK or JDK was used. The owner QA checklist is
[`../qa-checklist.md`](../qa-checklist.md).

## The four verification commands (real results, 2026-10-24)

| Command (from the worktree root) | Result |
|---|---|
| `bun run --filter '@web-games/cloud-observatory*' typecheck` | pass: core and app `tsc --noEmit` both exit 0 |
| `bun run --filter '@web-games/cloud-observatory*' test` | pass: core 26 files, 471 tests; app 45 files, 492 tests (963 tests in 71 files) |
| `bun run --filter '@web-games/cloud-observatory' build` | pass: 168 modules, `dist/assets/index-DelbJy6N.js` 189.19 kB (61.83 kB gzip at the build default level), `index.html` 0.69 kB |
| `bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core` | pass: 181 files, no fixes, no diagnostics |

Before task 08 the app had 37 files and 447 tests; task 08 added 8 app files (45 tests:
`test/release/{bundle,budgets,no-network,content-contract,store-listing,save-roundtrip,accessibility-audit,performance}`)
and 1 core file (`test/performance.test.ts`, 2 tests).

Pre-existing failures: none. Every command is green, so no throwaway `origin/main` worktree was needed.

## Measured budgets

| Budget | Limit | Measured |
|---|---|---|
| JavaScript, gzip level 9, `dist/assets/*.js` summed | 307,200 bytes (300 KB) | 63,346 bytes in 6 files (193,552 bytes raw; main chunk 61,348 gzip) |
| woff2 fonts | 400,000 bytes | 76,792 bytes, 4 files |
| Audio | 2,500,000 bytes | 1,920,489 bytes, 14 files (13 cues and 1 loop) |
| Art | 8,000,000 bytes, 600,000 per file | 683,760 bytes, 31 files (largest 81,154; updated in the task 06 update pass) |
| First-load `index.html` | under 5,120 bytes | 694 bytes |
| Source maps emitted | none | none |
| Saved game | under 20 KB | 1,673 to 2,002 bytes across a 30-hour scripted session |

The bundle number comes from `test/release/bundle.test.ts`, which runs Vite's JavaScript `build()` API
with `NODE_ENV=production` into `apps-games/cloud-observatory/node_modules/.cache/bundle-check`
(git-ignored). Its output is byte-identical to `vite build` (same `index-DelbJy6N.js` hash), so it does
not depend on a previous build.

## What each release test proves

| Test | Proves |
|---|---|
| `bundle.test.ts` (6 tests) | JS budget; every font, MP3 and art file the code references exists in the output; no source maps; `index.html` under 5 KB and its scripts exist; output holds only art, assets, audio, fonts and index.html; no remote URL other than 3 XML namespace identifiers and no network API except 3 known `fetch(` sites |
| `budgets.test.ts` (5) | Kit `assertAssetBudget` on fonts, audio, art; an `OFL.txt` per font family; a `LICENSES.md` row with a source URL and `CC0` per audio file |
| `no-network.test.ts` (6) | Scans 77 app and 26 core source files for 13 forbidden patterns: 0 hits. Also the pattern self-check, no tracker package in either `package.json`, the exact six Capacitor plugins, relative audio base |
| `content-contract.test.ts` (6) | 12 constellations (86 stars), 8 instruments, 24 upgrades, 10 boons (105 shards), 30 lore in 6 chapters, 20 achievements, 33 art slots, 2 fonts; README quick facts parsed and equal |
| `store-listing.test.ts` (12) | Name at most 30, short at most 80, full at most 4,000, what's new, no emoji, feature denylist with one allowed negated sentence, claims equal the code (names, counts, 8 hours), app id equals `capacitor.config.ts`, no permissions, no Share feature |
| `save-roundtrip.test.ts` (2) | 30 hours of scripted play in six legs through the real `GameSession`, 17 Eclipses, 12 charts, 10 boons, 3 Comet claims over dates 23, 24, 26 October (the 25th skipped, streak restarts), offline gaps of 5 min, 3 h, 12 h, 26 h, 1 min and 9 h; every checkpoint reloads equal to what was saved; a profile at the number ceiling stays under 20 KB |
| `accessibility-audit.test.tsx` (6) | 38 contrast pairs at least 4.5:1 in both variants; 44 px rules, rem font sizes of at least 0.875; 109, 122 and 141 named controls over 11 screens at fresh, mid and late progress; no `NaN`, `undefined`, `Infinity` or `[object` in text or labels, including a 1e280 profile |
| `performance.test.tsx` (2) | The Build tab with all 8 rows stays at 316 DOM nodes over 200 renders |
| core `performance.test.ts` (2) | 288,000 ticks (8 hours at 10 per second) in about 1.05 s (limit 2 s); 100,000 `formatNumber` calls in about 18 ms (limit 200 ms) |

## No-network and no-data audit (backs the store answers)

- Source: no `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `importScripts`,
  `CapacitorHttp`, remote URL, `gtag`, `firebase`, `adsbygoogle`, `admob` or `appsflyer` in the `src/`
  of the app (77 files) or the core (26 files).
- Dependencies: no firebase, analytics, ads, sentry, posthog, revenuecat or similar package in either
  `package.json`; the only Capacitor packages are core, android, ios and the six plugins.
- Bundle: the only `http://` strings are the MathML, XHTML and SVG namespaces. Three `fetch(` call
  sites remain and are not game code: Vite's same-origin modulepreload polyfill, the kit audio loader
  (it fetches the bundled `/audio/*.mp3`) and Capacitor core's built-in web HTTP plugin, which nothing
  calls. The test fails on a fourth.
- Android manifest declares no permissions; iOS Info.plist has no usage-description keys (task 07 tests).
- Conclusion: "no data collected, no data shared" in `store-listing.md` is backed by the source.

## Fixed during the audit

- `store-listing.md` described a Share feature (a system share sheet). No source file uses the share
  plugin, so v1 has none. The row now says "None in v1" and a test keeps it true.
- `public/.gitkeep` was copied into every build; removed.
- README quick facts now state the 105 shards (so the contract test can parse them) and the measured
  budgets.

## Art evidence (designer review loop result: `status=ok`, updated in the task 06 update pass)

All 33 slots were accepted and integrated (31 bundled, `icon` and `feature-graphic` as masters only);
see `assets-index.md` for the provenance table. `art/` here holds the art bible,
`accepted-manifest.json`, `build-report.json`, the 33 masters and `review/` with the verdict
(`<batch>-round-<n>.md`) and brief (`<batch>-round-<n>-brief.md`) of every round of batches b1 to b5
and retry. The art bible and each review file are copies of the designer inbox
(`aqf-art-inbox/cloud-observatory`) files. No image outside the accepted folder is used anywhere.

## Simulator re-run

`bun report.ts` in `../02` printed output byte-identical to `../02/simulator-output.txt`: first
constellation 90 s, 5 shards at 10,293 s (2.86 h), cycle 2 at 83.6% and cycle 3 at 80.8% of cycle 1,
longest purchase gap 30 s. No number moved.

## Left for the owner

Everything in `../qa-checklist.md`. The items most likely to need a decision: the mix of painted and
code-drawn art (open questions 15 to 21), the music seam and cue choices (12 to 14), and whether the
Android app boots without `INTERNET` on a device (23).
