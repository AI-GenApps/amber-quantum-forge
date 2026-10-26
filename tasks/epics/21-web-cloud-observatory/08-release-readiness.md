---
epic: 21-web-cloud-observatory
task: 08-release-readiness
status: in-progress
commit_scope: cloud-observatory
depends_on: [21-web-cloud-observatory/07-capacitor-packaging]
estimate: M
owner: agent
---

# Release readiness, budgets, knowledge base, owner QA checklist

## Goal

Close the epic with machine-checked release gates and a complete hand-over: every budget enforced
by a test, the no-network and no-data claims audited, the knowledge base and store answers
verified against the code, and a browser QA checklist the owner can follow end to end. Agents do not
run a browser, so everything visual and tactile goes on the checklist.

## Context / Decisions

- Budgets (all from the knowledge base): JS bundle at most 300 KB gzip excluding art (all
  `dist/assets/*.js` summed, gzip level 9), woff2 total at most 400 KB, audio at most 2.5 MB, art at
  most 8 MB (no file over 600 KB), first-load HTML under 5 KB. The bundle is measured by running
  Vite's JavaScript `build()` API from a test into
  `apps-games/cloud-observatory/node_modules/.cache/bundle-check` (inside the package, ignored by
  git; never `/tmp`), so the check does not depend on a prior `vite build` run.
- Privacy claims in `store-listing.md` ("no data collected") must be backed by a source audit, not
  by assertion.
- The owner checklist path is fixed:
  `.agents/resources/2026-10-23/web-games/cloud-observatory/qa-checklist.md`.
- Pre-existing failures: prove any failure that is not caused by this epic by running the same
  command in a throwaway worktree of `origin/main` under
  `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/` (remove it afterwards) and record it as
  pre-existing in the evidence README.

## Implementation Checklist

- [x] `test/release/bundle.test.ts`: programmatic Vite build into the package cache directory,
      sums gzip sizes of emitted `.js` files, asserts at most 300 × 1024 bytes, prints the numbers,
      asserts every referenced font/audio/art file exists in the output, asserts no source maps
      are emitted and `index.html` is under 5 KB. Timeout 120 s.
- [x] `test/release/budgets.test.ts`: kit `assertAssetBudget` over `public/fonts` (woff2 at most
      400,000), `public/audio` (at most 2,500,000) and `public/art` (at most 8,000,000, 600,000
      per file); every font has an `OFL.txt`; every audio file has a `LICENSES.md` row with a source
      URL and CC0.
- [x] `test/release/no-network.test.ts`: scans `src/**` of the app and core for `fetch(`,
      `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `navigator.sendBeacon`,
      `importScripts`, remote `http://` or `https://` URLs (except an explicit allowlist in the test, for example the
      SVG namespace), analytics or ad SDK names (`gtag`,
      `firebase`, `adsbygoogle`, `admob`, `appsflyer`), and checks `package.json` has no such
      dependency. Output is the "no data collected" evidence.
- [x] `test/release/content-contract.test.ts`: asserts the contract counts one more time against the
      real catalog (12/86, 8, 24, 10/105, 30/6, 20) and that `README.md`'s quick-facts table in the
      knowledge base still states the same counts (parsed).
- [x] `test/release/store-listing.test.ts`: reads the fenced `text` blocks in
      `.agents/games/cloud-observatory/store-listing.md` and asserts name at most 30, short
      description at most 80, full description at most 4,000 and non-empty, no emoji, no claims of
      features that do not exist (a keyword denylist: "multiplayer", "leaderboard", "ads", "in-app
      purchase" appear only in negated sentences from an allowlist), and the app id equals
      `capacitor.config.ts`.
- [x] `test/release/save-roundtrip.test.ts`: a long scripted session through the real
      `GameSession` (hours of simulated ticks, Eclipses, offline resume, Comet across date
      boundaries) saves, reloads and resumes with identical state; save size under 20 KB.
- [x] `test/release/accessibility-audit.test.tsx`: aggregates the task 04 checks into one release
      gate (contrast table, hit areas, accessible names on every screen at three progress points,
      no `NaN`/`undefined`/`Infinity` text rendered anywhere in a late-game profile).
- [x] Performance guards (headless): a simulated 8 hours at 10 ticks per second through the core
      runs in under 2 seconds; `formatNumber` over 100,000 values under 200 ms; rendering the Build
      tab with all rows 200 times does not grow the DOM node count
      (`test/release/performance.test.tsx` and core `test/performance.test.ts`).
- [x] Final full run of the four verification commands; paste the real summary counts (tests,
      files, bundle bytes gzip, font/audio/art bytes) into
      `.agents/resources/2026-10-23/web-games/cloud-observatory/08/README.md`, with any proven
      pre-existing failure.
- [x] Write the owner browser QA checklist (below).
- [x] Knowledge base pass: `README.md` quick facts (counts, status, budgets with measured
      numbers), `economy.md` (final simulator numbers), `content-plan.md` (any renamed item),
      `assets-index.md` (final art status table and provenance), `store-listing.md` (permissions),
      `decisions-log.md` (release decisions), `open-questions.md` (closed items struck through
      with the resolving task, remaining items listed).
- [x] Tick every task in `STATUS.md` and set the epic status to "done, awaiting owner QA".

### Owner browser QA checklist (content of `qa-checklist.md`)

Written as numbered steps with expected results, grouped as follows (each item names the screen and
the exact expected behaviour):

1. Setup: how to run (`cd apps-games/cloud-observatory && bun run dev`, port 4013), browsers
   (Chrome desktop with a 390×844 device frame, Safari iOS if available), clearing the save.
2. First launch and Title: fonts are Cormorant Garamond and Manrope (no system font visible),
   key art or placeholder, Continue/New Journey.
3. Onboarding: the four coach marks in order, Skip, Replay from How to Play.
4. Observe and Gather: tap feedback, starlight and per-second readout, number formatting at
   1K, 1M, 1B.
5. Build: buy ×1/×10/×Max, locked rows, upgrade chips at 10/25/50, long-press repeat.
6. Charting: the Lyre end to end, wrong-tap shake, numbered ring, 44 px comfort of star targets on
   a small phone frame (320 px wide), all 12 constellations drawn correctly and readable.
7. Atlas, Journal and lore: all 6 chapter cards, 30 entries, locked hints, reading view, chapter art.
8. Eclipse: enable at 5 shards, confirm modal wording, sequence (also with reduced motion),
   boons grid, purchases, the next cycle starts with the boon effects.
9. Pacing feel: first chart under 3 minutes, no stretch over 6 minutes without something to buy,
   first Eclipse roughly 2.5 to 4 hours (use the dev-build-only fast-forward `?devspeed=60`
   added in task 04; production builds ignore it).
10. Offline: close the tab, change the clock or wait, reopen: Welcome Back values for 5 minutes,
    3 hours and more than 8 hours; efficiency with Night Watch/Long Vigil.
11. Daily Comet: one claim per date, streak, next day, gap, clock rollback behaviour.
12. Achievements and statistics: toasts, +1% each, counts, values sane.
13. Settings: sound, music, haptics (Android device only), reduced motion, high contrast, reset.
14. Audio: each cue audible and appropriate, music loop (or its documented absence), mute works,
    nothing plays before the first tap.
15. Accessibility: keyboard focus order, screen-reader labels (VoiceOver/TalkBack spot check),
    zoom to 130% text, contrast in high-contrast mode, no flashing.
16. Art: every slot looks like the same artist; placeholders (listed in `assets-index.md`) look
    deliberate; emblem alignment in the atlas; lore vignettes not cropped badly on 19.5:9 screens.
17. Save and recovery: refresh persists, corrupt the save key in devtools and reload (recovery
    notice), new journey.
18. Performance: no jank on a mid-range phone frame with CPU 4x throttling; memory stable over
    10 minutes; no console errors or warnings.
19. Native (owner, later): Android Studio/Xcode open, run on device, back button, status bar,
    portrait lock, icon and splash, haptics.
20. Sign-off table: pass/fail column per section, notes, owner initials.

## Files Touched

- `apps-games/cloud-observatory/test/release/*.test.{ts,tsx}` and small supporting helpers (`paths.ts`, `bot.ts`)
- `apps-games/cloud-observatory-core/test/performance.test.ts`
- `.agents/resources/2026-10-23/web-games/cloud-observatory/{qa-checklist.md,08/README.md}`
- `.agents/games/cloud-observatory/*.md` (final pass)
- `tasks/epics/21-web-cloud-observatory/STATUS.md` (tick all, set final status)

## Acceptance Criteria

- All four verification commands are green, with the real counts recorded in the evidence README.
- The JS bundle is at most 300 KB gzip excluding art, measured by a test; the other budgets pass.
- The no-network audit passes and the store-listing data-safety answers are backed by it.
- The knowledge base is complete and consistent with the code (content contract test and
  store-listing test green); every open question is closed or explicitly deferred with a reason.
- `qa-checklist.md` exists at the fixed path and covers all 20 sections above.
- No task in the epic required a browser, device, emulator or screenshot.

## Verification Commands

- `bun run --filter '@web-games/cloud-observatory*' typecheck`
- `bun run --filter '@web-games/cloud-observatory*' test`
- `bun run --filter '@web-games/cloud-observatory' build`
- `bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core`

## Out of Scope

- Browser, device or emulator testing (the owner does it from the checklist).
- Store submission, privacy policy hosting, signing, screenshots.
- New features, new content or retuning, unless a gate fails and needs a documented fix.
- Changing the kit, dependencies, other games or files outside the scope fence.

## Commit message

`chore(cloud-observatory): add release gates, audits and owner QA checklist [21-web-cloud-observatory/08]`
