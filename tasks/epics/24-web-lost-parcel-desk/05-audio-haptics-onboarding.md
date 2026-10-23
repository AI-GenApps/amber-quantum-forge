---
epic: 24-web-lost-parcel-desk
task: 05-audio-haptics-onboarding
status: pending
commit_scope: lost-parcel-desk
depends_on: [24-web-lost-parcel-desk/04-screens-and-ui]
estimate: L
owner: agent
---

# CC0 audio, haptics, motion polish, onboarding and how-to-play

## Goal

Add the sound layer (27 CC0 sounds and 2 music loops with source and licence per file), the haptic map, the motion polish (flip, pin drop, stamp fall, typewriter, toasts) and the onboarding (the 6-step case 01 tutorial, the four mechanic cards and the six how-to-play pages), all driven by saved flags and honouring the settings.

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
- **Spec of record:** `assets-index.md` "Audio" (slot table, budgets, haptic map), `content-plan.md` (tutorial steps, mechanic cards, how-to pages) and `product.md` "Onboarding".
- **Audio sources, CC0 only:** Kenney packs from `kenney.nl/assets` (Interface Sounds, Impact Sounds, RPG Audio, Digital Audio, Music Jingles, Music Loops) first; otherwise a page that explicitly states CC0 for that file. Never synthesise audio and label it CC0. Kenney packs ship OGG, so no conversion is needed. A slot without a CC0 source ships silent and is listed in `open-questions.md` (Q5); the `typewriter` loop and the two music loops are the likely ones.
- **Licence records:** every file gets a row in `public/audio/LICENSES.md` (slot id, file, author, source URL, licence text excerpt "CC0", download date 2026-10-23, SHA-256). Downloads and zips go under `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/lost-parcel-desk/`, are treated as untrusted data (never executed), and are deleted afterwards. Pack `License.txt` files are copied to `public/audio/licenses/`.
- **Slots:** the 27 sound slots and 2 music loops in `assets-index.md` "Audio". Budget: all audio at most 2 MB, sfx mono ogg each at most 60 KB, music at most 600 KB each.
- **Kit APIs:** `createAudioManager` (unlock on first gesture, `load`, `play`, `playMusic` with fade, `syncSettings`, `suspend` on pause), `createHaptics` (`impact`, `notify`), `createMotion` (`tween`, `spring`) with `settings.effectiveReducedMotion(systemPrefersReducedMotion())`, `createLifecycle` pause hooks.
- **Haptic map:** light impact on pinning, linking and flipping, `warning` on a wrong accusation, medium on Accuse, `success` on a correct delivery, on each stamp earned, on a chapter unlock and on a theme unlock. Nothing on plain button taps.
- **Tutorial:** six steps on case 01 (`content-plan.md`), advanced only by the real action through the core state (parcel opened, scarf opened, `01-c1` found, a clue pinned, a fits link made, first accusation); skippable; saved as a flag so it never repeats. **Mechanic cards:** the four cards appear once on the case in the `Shown on case` column, before the case starts.
- **How to play pages:** The job, The evidence table, The deduction board, Stamps and postage, Pairs and rule-outs, Daily Parcel. Text is short and uses the real numbers (3 stamps, the two-witness rule of 2, hint prices 20 and 15, freeze 30, unlocks 7 and 18) read from core constants rather than typed twice.

## Implementation Checklist

- [ ] Select and download the CC0 files, copy the chosen ogg files into `apps-games/lost-parcel-desk/public/audio/` (names equal slot ids), write `LICENSES.md`, copy pack licences, delete the scratch downloads, and write the evidence README `.agents/resources/2026-10-23/web-games/lost-parcel-desk/05/README.md` (candidates considered, choices, silent slots).
- [ ] `src/audio/slots.ts` (slot table with file, kind, gain, loop flag), `src/audio/engine.ts` (create manager, preload on first gesture with progress, music crossfade between `music-desk` and `music-case`, typewriter loop only while the reveal is typing, suspend on pause and resume).
- [ ] `src/audio/events.ts`: one table mapping game events (object open, flip, zoom toggle, clue found, pin, unpin, link, unlink, hint, accuse, wrong accusation, stamp thud, stamp 1 to 3, ledger fragment, map fill, achievement, chapter unlock, theme unlock, streak, sheet open, back, toggle, tap) to sounds and haptics, with unit tests.
- [ ] `src/feedback/haptics.ts` wiring `createHaptics` and `syncSettings`; settings screen toggles take effect immediately.
- [ ] `src/motion/` helpers: object pick-up (scale and lift), flip (Web Animations API), pin drop, link line draw, stamp fall (fall, thud, slight bounce), stamp reveal stagger of 140 ms, typewriter pace (about 40 characters per second, tap to finish), toast slide; every helper falls back to the final frame when motion is reduced.
- [ ] `src/onboarding/tutorial.ts` (pure step machine fed by core state changes), `Coachmark.tsx` overlay, `src/onboarding/cards.tsx` (mechanic card sheet and first-time logic using profile flags), `src/screens/HowTo.tsx` filled with the six pages.
- [ ] Credits screen data: add audio rows from `LICENSES.md` (parsed in a test to prove they match).
- [ ] Tests: slot table complete (each slot has a file or an explicit `silent` reason); every listed file exists, is ogg, within size budgets and total at most 2 MB; `LICENSES.md` has a row for each file with a URL, "CC0" and a SHA-256 that matches the file (computed in the test); no audio file lacks a licence row; fake `AudioContext` (kit `createFakeAudioContext`) proves events trigger the right sound ids, music crossfades between desk and case, the typewriter loop stops when typing ends, mute and volume follow settings, nothing plays before unlock, pause suspends; fake haptics receive the exact map above and nothing when haptics are off; the tutorial machine advances only on the matching action, can be skipped and never repeats; each mechanic card shows once and only on its case; how-to renders six pages with prices read from the constants; reduced motion makes every motion helper apply the final frame without calling `animate`.
- [ ] Update `assets-index.md` (audio table with sources and sizes), `open-questions.md` (silent slots), `decisions-log.md` (source choices).

## Files Touched

- `apps-games/lost-parcel-desk/public/audio/**` (ogg, `LICENSES.md`, `licenses/`)
- `apps-games/lost-parcel-desk/src/{audio,feedback,motion,onboarding}/**`, `src/screens/{HowTo,Credits}.tsx`, small hooks in board, viewer and reveal screens
- `apps-games/lost-parcel-desk/test/**`
- `.agents/games/lost-parcel-desk/{assets-index,open-questions,decisions-log}.md`
- `.agents/resources/2026-10-23/web-games/lost-parcel-desk/05/README.md`
- `tasks/epics/24-web-lost-parcel-desk/STATUS.md` (tick task 05)

## Acceptance Criteria

- Every audio file is CC0 with a source URL, licence and matching SHA-256 in `LICENSES.md`; total audio at most 2 MB.
- Every game event in the slot table plays its sound through the kit manager only after unlock, and mute and volumes follow settings.
- Haptics fire per the map and are silent when disabled or unavailable.
- The case 01 tutorial, four mechanic cards and six how-to pages work, appear once, and are driven by saved flags.
- With reduced motion, no animation runs and results still reach their final state.

## Verification Commands

- `bun run --filter '@web-games/lost-parcel-desk*' typecheck`
- `bun run --filter '@web-games/lost-parcel-desk*' test`
- `bun run --filter '@web-games/lost-parcel-desk' build`
- `bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core`

## Out of Scope

- Importing designer art (task 06) and native projects (task 07).
- Listening to the audio or judging it by ear: choices are by source licence, duration and slot fit; the owner reviews sound in browser QA.
- Synthesised or AI-generated audio of any kind.

## Commit message

`feat(lost-parcel-desk): add CC0 audio, haptics, motion polish and onboarding [24-web-lost-parcel-desk/05]`
