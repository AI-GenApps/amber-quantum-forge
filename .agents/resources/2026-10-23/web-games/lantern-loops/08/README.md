# Lantern Loops release readiness evidence (task 08)

Date: 2026-10-23. Everything below was verified headlessly with Vitest (happy-dom), `tsc`, `vite build`
and Biome. No browser, simulator, emulator, device, screenshot or APK was used; the owner does the
browser QA from [`../qa-checklist.md`](../qa-checklist.md).

## Files

| File | What |
|---|---|
| `budgets.json` | Written by `test/release/budgets.test.ts` on every run: per JS chunk raw and gzip bytes, art files, audio totals, font sizes and the budgets |
| `no-data-audit.txt` | Written by `scripts/no-data-audit.ts` (run by `test/release/noData.test.ts`): zero network API uses, zero non-allowlisted URLs, dependencies equal the skeleton |
| `../qa-checklist.md` | The 13 section owner browser checklist |
| `../art/` | Art bible, accepted manifest, review notes of batch b1 rounds 1 to 4 and the b2 brief (task 06 evidence, unchanged by this task) |

## What the new tests verify (`apps-games/lantern-loops/test/release/`)

| Test file | Verifies |
|---|---|
| `playthrough.test.ts` | Fresh profile, in-memory adapter, real services: all 120 stored solutions are decoded, checked with `evaluate` and passed to `completePuzzle` with zero hints. 360 stars; unlocks fire exactly at `harbor-15` (45 stars), `garden-10` (120) and `bridge-10` (210), each puzzle played inside an open chapter; chapter clears pay +5 at `harbor-30`, `garden-30`, `bridge-30` and 2 of 5 at `sky-30` (balance 3, 8, 13, 18, 20, the last capped); save and reopen gives an equal profile; `computeStats` and the Statistics screen show 120 / 120, 360 / 360 and 90 stars per chapter; a replay never lowers stars or pays a chapter twice |
| `daily.test.ts` | 40 consecutive days from Monday 2026-10-19 with a fake clock: hint days, a freeze save (day 6), the weekly refill (day 7), a reset after two missed days (day 10), milestones 3, 7 (twice), 14 and 30, final streak 30 and 1 freeze; tokens compared with an independent model including the cap of 20; the share text with and without the path; the 30-day archive (pays +1 once, refuses a date outside the window, leaves the streak alone) |
| `budgets.test.ts` | In-memory production `build()`: JS gzip, art, audio and each woff2 against the budgets; writes `budgets.json` |
| `noData.test.ts` | Runs the audit, compares the written file, pins the dependency set |
| `devParams.test.ts` | `?qa=` parsing, clamping, star totals, profile changes; the production bundle does not contain the helper marker while a development build does (positive control) |
| `knowledgeBase.test.ts` | README quick facts equal the code constants; all eight KB files exist without `TODO`; no art slot is `planned`; every font and audio file has a path, SHA-256, source URL and licence in `assets-index.md`; a 2026-10-23 decision row exists for every area of the epic decision table |
| `storeListing.test.ts` | Fenced `text` blocks of `store-listing.md`: subtitle 30, short 80, long 4000, keywords 100, what's new 500, name 30; claims match the campaign count |
| `accessibility.test.tsx` | 20 routes x 3 profiles: accessible names, headings, board grid and live region, 44 px CSS hit areas, Fraunces and Nunito only (also in high contrast), no animation with reduced motion, all contrast pairs |

## Numbers (final run)

| Budget | Actual | Limit |
|---|---|---|
| JS bundle (gzip, sum of 6 chunks) | 78,848 bytes (77.0 KB) | 307,200 bytes (300 KB) |
| JS raw | 232,087 bytes | n/a |
| Art (shipped WebP) | 162,934 bytes (12 files; task 06 update pass, was 2,832 bytes with `lantern-amber` only) | 8 MB |
| Audio (18 MP3 files, largest 314,222 bytes) | 394,979 bytes (385.7 KB) | 1.5 MB |
| Fraunces woff2 | 109,868 bytes | 122,880 bytes |
| Nunito woff2 | 32,776 bytes | 122,880 bytes |

## Changes found by the sweep

- The onboarding welcome card had no top-level heading (the kit `Card` title is an `h3`). It now holds an `h1`
  (`src/onboarding/Onboarding.tsx`).
- Vitest sets `NODE_ENV=test`, which makes Vite treat an API build as development (the dev helper is
  bundled and the code is not minified). The release tests force `NODE_ENV=production` around the call
  (`test/release/paths.ts`); the in-memory build then has the same hashes as `vite build`.

## Dev-only QA helper

`src/qa/devParams.ts`, hooked in `src/main.tsx` behind `import.meta.env.DEV` with a dynamic import after
the normal boot. Example: `http://localhost:4011/?qa=stars:210,tokens:5,streak:6,onboarded:1,reset:1`.
It writes to the real save. The production build contains no trace of it (test).

## Commands and results

Run from `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/web-lantern-loops`.

| Command | Result |
|---|---|
| `bun run --filter '@web-games/lantern-loops*' typecheck` | pass (core and app) |
| `bun run --filter '@web-games/lantern-loops*' test` | pass: core 29 files, 397 tests; app 45 files, 467 tests |
| `bun run --filter '@web-games/lantern-loops' build` | pass: 188 modules, main chunk 227.73 kB (77.58 kB gzip) |
| `bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core` | pass, 209 files, no fixes |

No result was red, so no pre-existing-failure comparison against `origin/main` was needed.

Note for whoever runs the app tests: `test/capacitor/sync.test.ts` compares `dist/index.html` with the
ignored, locally synced copies in `android/` and `ios/`. After any source change run
`bunx vite build && bunx cap sync` in `apps-games/lantern-loops` so the copies match; in a fresh
checkout (no `dist/`, no sync) the test skips itself.

## Unresolved items carried to the owner

See `.agents/games/lantern-loops/open-questions.md`: Q1 name, Q3 Sunday 9x9 speed on a phone, Q4 to Q7
feel and layout, Q6 Android INTERNET permission, Q8 store account data, Q10 audio feel, Q11 the 13
placeholder art slots (style anchor failed), Q12 icon and splash on a device, Q13 the `?qa=` helper.
