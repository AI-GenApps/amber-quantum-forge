---
epic: 20-web-floodplain-dispatch
task: 05-audio-haptics-onboarding
status: in-progress
commit_scope: floodplain-dispatch
depends_on: [20-web-floodplain-dispatch/04-screens-and-ui]
estimate: L
owner: agent
---

# CC0 audio, haptics, motion polish, onboarding and how-to-play

## Goal

Make the game feel finished: CC0 sound effects and two music loops wired to game events through the kit audio manager, haptics through the kit wrapper, motion polish that respects reduced motion, the v01 guided tutorial, the one-time mechanic cards, and the six-page how-to-play.

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
- **Audio sources, CC0 only:** Kenney packs from `kenney.nl/assets` (Interface Sounds, UI Audio, Impact Sounds, Digital Audio, Music Jingles) first; otherwise a page that explicitly states CC0 for that file. Never synthesise audio and label it CC0. Kenney packs ship OGG, so no conversion is needed. A slot without a CC0 source ships silent and is listed in `open-questions.md` (Q5).
- **Licence records:** every file gets a row in `public/audio/LICENSES.md` (slot id, file, author, source URL, licence text excerpt "CC0", download date 2026-10-23, SHA-256). Downloads and zips go under `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/floodplain-dispatch/`, are treated as untrusted data (never executed), and are deleted afterwards. Pack `License.txt` files are copied to `public/audio/licenses/`.
- **Slots:** the 25 sound slots and 2 music loops in `assets-index.md` "Audio plan". Budget: all audio at most 2 MB, sfx mono ogg each at most 60 KB, music at most 600 KB each.
- **Kit APIs:** `createAudioManager` (unlock on first gesture, `load`, `play`, `playMusic` with fade, `syncSettings`, `suspend` on pause), `createHaptics` (`impact`, `notify`), `createMotion` (`tween`, `spring`) with `settings.effectiveReducedMotion(systemPrefersReducedMotion())`, `createLifecycle` pause hooks.
- **Haptic map:** light impact on placing or rotating a piece, `warning` on an illegal placement, medium on Run, `error` when a house floods, `success` on each star earned, on a region unlock and on a theme unlock. Nothing on plain button taps.
- **Tutorial:** five steps on v01 (`content-plan.md`), advanced only by the real action (inlet highlighted, canal tool chosen, a connected canal drawn, Run pressed, result sheet seen); skippable; saved as a flag so it never repeats. **Mechanic cards:** the seven cards appear once, on the map in the `Shown on` column, before planning starts.
- **How to play pages:** Goal, Pieces, Reading the water, Forecast and weeks, Stars and scoring, Daily Dispatch. Text is short, uses the real numbers (costs 1, 1, 2, 3, 4; stars; hint prices) read from core constants rather than typed twice.

## Implementation Checklist

- [x] Select and download the CC0 files, copy the chosen ogg files into `apps-games/floodplain-dispatch/public/audio/` (names equal slot ids), write `LICENSES.md`, copy pack licences, delete the scratch downloads, and write the evidence README `.agents/resources/2026-10-23/web-games/floodplain-dispatch/05/README.md` (candidates considered, choices, silent slots).
- [x] `src/audio/slots.ts` (slot table with file, kind, gain, loop flag), `src/audio/engine.ts` (create manager, preload on first gesture with progress, music crossfade menu to play, water loop gain from playback flow, suspend on pause and resume).
- [x] `src/audio/events.ts`: mapping from game events (placement, removal, rotation, invalid, run start, surge week reached, badge changes during playback, result stars, unlocks, streak) to sounds and haptics, one table with unit tests.
- [x] `src/feedback/haptics.ts` wiring `createHaptics` and `syncSettings`; settings screen toggles take effect immediately.
- [x] `src/motion/` helpers: piece placement pop (spring), badge pop, sheet slide, star reveal stagger of 120 ms, week-tick pulse on the forecast bar; every helper falls back to the final frame when motion is reduced.
- [x] `src/onboarding/tutorial.ts` (pure step machine), `Coachmark.tsx` overlay, `src/onboarding/cards.tsx` (mechanic card sheet and first-time logic using profile flags), `src/screens/HowTo.tsx` filled with the six pages.
- [x] Credits screen data: add audio rows from `LICENSES.md` (parsed in a test to prove they match).
- [x] Tests: slot table complete (each slot has a file or an explicit `silent` reason); every listed file exists, is ogg, within size budgets and total at most 2 MB; `LICENSES.md` has a row for each file with a URL, "CC0" and a SHA-256 that matches the file (computed in the test); no audio file lacks a licence row; fake `AudioContext` (kit `createFakeAudioContext`) proves events trigger the right sound ids, music crossfades between menu and play, mute and volume follow settings, nothing plays before unlock, pause suspends; fake haptics receive the exact map above and nothing when haptics are off; tutorial machine advances only on the matching action, can be skipped and never repeats; each mechanic card shows once and only on its map; how-to renders six pages with prices from the constants; reduced motion makes every motion helper apply the final frame without calling `animate`.
- [x] Update `assets-index.md` (audio table with sources and sizes), `open-questions.md` (silent slots), `decisions-log.md` (source choices).

## Files Touched

- `apps-games/floodplain-dispatch/public/audio/**` (ogg, `LICENSES.md`, `licenses/`)
- `apps-games/floodplain-dispatch/src/{audio,feedback,motion,onboarding}/**`, `src/screens/{HowTo,Credits}.tsx`, small hooks in board and sheet screens
- `apps-games/floodplain-dispatch/test/**`
- `.agents/games/floodplain-dispatch/{assets-index,open-questions,decisions-log}.md`
- `.agents/resources/2026-10-23/web-games/floodplain-dispatch/05/README.md`
- `tasks/epics/20-web-floodplain-dispatch/STATUS.md` (tick task 05)

## Acceptance Criteria

- Every audio file is CC0 with a source URL, licence and matching SHA-256 in `LICENSES.md`; total audio at most 2 MB.
- Every game event in the slot table plays its sound through the kit manager only after unlock, and mute and volumes follow settings.
- Haptics fire per the map and are silent when disabled or unavailable.
- The v01 tutorial, seven mechanic cards and six how-to pages work, appear once, and are driven by saved flags.
- With reduced motion, no animation runs and results still reach their final state.

## Verification Commands

- `bun run --filter '@web-games/floodplain-dispatch*' typecheck`
- `bun run --filter '@web-games/floodplain-dispatch*' test`
- `bun run --filter '@web-games/floodplain-dispatch' build`
- `bunx biome check apps-games/floodplain-dispatch apps-games/floodplain-dispatch-core`

## Out of Scope

- Importing designer art (task 06) and native projects (task 07).
- Listening to the audio or judging it by ear: choices are by source licence, duration and slot fit; the owner reviews sound in browser QA.
- Synthesised or AI-generated audio of any kind.

## Commit message

`feat(floodplain-dispatch): add CC0 audio, haptics, motion polish and onboarding [20-web-floodplain-dispatch/05]`
