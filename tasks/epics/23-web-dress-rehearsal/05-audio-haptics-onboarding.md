---
epic: 23-web-dress-rehearsal
task: 05-audio-haptics-onboarding
status: in-progress
commit_scope: dress-rehearsal
depends_on: [23-web-dress-rehearsal/04-screens-and-ui]
estimate: L
owner: agent
---

# CC0 audio, haptics, motion polish, onboarding and how-to-play

## Goal

Add the CC0 sound set (24 sounds and 2 music loops), the haptic map, reduced-motion-aware motion polish, the riv-01 tutorial, the nine one-time rule cards and the six-page How to play, all driven by saved flags and the kit managers.

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
- **Audio sources, CC0 only:** Kenney packs from `kenney.nl/assets` (Interface Sounds, UI Audio, Impact Sounds, Digital Audio, RPG Audio, Music Jingles) first; otherwise a page that explicitly states CC0 for that file (for example an OpenGameArt entry that shows `License(s): CC0`). Never synthesise audio and label it CC0. Kenney packs ship OGG, so no conversion is needed. A slot without a CC0 source ships silent and is listed in `open-questions.md` (Q6).
- **Licence records:** every file gets a row in `public/audio/LICENSES.md` (slot id, file, author, source URL, licence text excerpt "CC0", download date 2026-10-23, SHA-256). Downloads and zips go under `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/dress-rehearsal/`, are treated as untrusted data (never executed), and are deleted afterwards. Pack `License.txt` files are copied to `public/audio/licenses/`.
- **Slots:** the 24 sounds and 2 music loops in `assets-index.md` "Audio (CC0 only, delivered in task 05)". Budget: all audio at most 2 MB, sfx mono ogg each at most 60 KB, music at most 600 KB each.
- **Kit APIs:** `createAudioManager` (unlock on first gesture, `load`, `play`, `playMusic` with fade, `syncSettings`, `suspend` on pause), `createHaptics` (`impact`, `notify`), `createMotion` (`tween`, `spring`) with `settings.effectiveReducedMotion(systemPrefersReducedMotion())`, `createLifecycle` pause hooks.
- **Haptic map:** light impact when a piece lands in a slot or is swapped, `warning` on a refused drop, medium on Finish look, `success` on each star earned, on a chapter unlock, a frame purchase and an affinity level, `success` on the Daily streak increase. Nothing on plain button taps or tray scrolling.
- **Tutorial:** five steps on `riv-01` (`content-plan.md`), advanced only by the real action (client card seen, Tops tab opened, first piece placed by any input, look completed, Finish look pressed); skippable; saved as a flag so it never repeats. **Rule cards:** the nine cards appear once, on the challenge in the `Shown on` column, before styling starts (the Brief sheet shows them in order if two apply).
- **How to play pages:** The brief, Pieces and slots, Rules, Harmony, Stars and scoring, Daily Fitting and Gallery. Text is short and uses the real numbers (harmony weights 40, 10, 20, 15, 15, the 70 bar, hint prices 20 and 30, freeze price 25, gallery cap 24) read from core constants rather than typed twice.

## Implementation Checklist

- [x] Select and download the CC0 files, copy the chosen ogg files into `apps-games/dress-rehearsal/public/audio/` (names equal slot ids), write `LICENSES.md`, copy pack licences, delete the scratch downloads, and write the evidence README `.agents/resources/2026-10-23/web-games/dress-rehearsal/05/README.md` (candidates considered, choices, silent slots).
- [x] `src/audio/slots.ts` (slot table with file, kind, gain, loop flag), `src/audio/engine.ts` (create manager, preload on first gesture with progress, music crossfade between `music-menu` and `music-style`, suspend on pause and resume).
- [x] `src/audio/events.ts`: mapping from game events (tab change, pick, place, swap, remove, invalid drop, rule met, rule broken, look complete, finish, star reveals, miss, hint, coins, unlock, streak, export, frame change) to sounds and haptics, one table with unit tests.
- [x] `src/feedback/haptics.ts` wiring `createHaptics` and `syncSettings`; settings screen toggles take effect immediately.
- [x] `src/motion/` helpers: piece landing pop (spring), rule chip flip, harmony meter ease, sheet slide, star reveal stagger of 120 ms, frame switch fade; every helper falls back to the final frame when motion is reduced.
- [x] `src/onboarding/tutorial.ts` (pure step machine), `Coachmark.tsx` overlay, `src/onboarding/cards.tsx` (rule card sheet and first-time logic using profile flags), `src/screens/HowTo.tsx` filled with the six pages.
- [x] Credits screen data: add audio rows from `LICENSES.md` (parsed in a test to prove they match).
- [x] Tests: slot table complete (each slot has a file or an explicit `silent` reason); every listed file exists, is ogg, within size budgets and total at most 2 MB; `LICENSES.md` has a row for each file with a URL, "CC0" and a SHA-256 that matches the file (computed in the test); no audio file lacks a licence row; fake `AudioContext` (kit `createFakeAudioContext`) proves events trigger the right sound ids, music crossfades between menu and styling, mute and volume follow settings, nothing plays before unlock, pause suspends; fake haptics receive the exact map above and nothing when haptics are off; tutorial machine advances only on the matching action, can be skipped and never repeats; each rule card shows once and only on its challenge; how-to renders six pages with numbers from the constants; reduced motion makes every motion helper apply the final frame without calling `animate`.
- [x] Update `assets-index.md` (audio table with files, authors, sources and bytes), `open-questions.md` (silent slots, Q6), `decisions-log.md` (source choices).

## Files Touched

- `apps-games/dress-rehearsal/public/audio/**` (ogg, `LICENSES.md`, `licenses/`)
- `apps-games/dress-rehearsal/src/{audio,feedback,motion,onboarding}/**`, `src/screens/{HowTo,Credits}.tsx`, small hooks in board and sheet screens
- `apps-games/dress-rehearsal/test/**`
- `.agents/games/dress-rehearsal/{assets-index,open-questions,decisions-log}.md`
- `.agents/resources/2026-10-23/web-games/dress-rehearsal/05/README.md`
- `tasks/epics/23-web-dress-rehearsal/STATUS.md` (tick task 05)

## Acceptance Criteria

- Every audio file is CC0 with a source URL, licence and matching SHA-256 in `LICENSES.md`; total audio at most 2 MB.
- Every game event in the slot table plays its sound through the kit manager only after unlock, and mute and volumes follow settings.
- Haptics fire per the map and are silent when disabled or unavailable.
- The `riv-01` tutorial, nine rule cards and six how-to pages work, appear once, and are driven by saved flags.
- With reduced motion, no animation runs and results still reach their final state.

## Verification Commands

- `bun run --filter '@web-games/dress-rehearsal*' typecheck`
- `bun run --filter '@web-games/dress-rehearsal*' test`
- `bun run --filter '@web-games/dress-rehearsal' build`
- `bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core`

## Out of Scope

- Importing designer art (task 06) and native projects (task 07).
- Listening to the audio or judging it by ear: choices are by source licence, duration and slot fit; the owner reviews sound in browser QA.
- Synthesised or AI-generated audio of any kind.

## Commit message

`feat(dress-rehearsal): add CC0 audio, haptics, motion polish and onboarding [23-web-dress-rehearsal/05]`
