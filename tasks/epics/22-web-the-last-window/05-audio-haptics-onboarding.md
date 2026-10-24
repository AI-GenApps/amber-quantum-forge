---
epic: 22-web-the-last-window
task: 05-audio-haptics-onboarding
status: done
commit_scope: the-last-window
depends_on: [22-web-the-last-window/04-screens-and-ui]
estimate: L
owner: agent
---

# CC0 audio, haptics, motion polish, onboarding and how-to-play

## Goal

Add the CC0 sound effects and three music loops, wire sounds and haptics to every game event through the kit managers, add reduced-motion-aware motion polish, and build the Day 1 guided shift, the first-time cards and the six how-to pages.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/the-last-window/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Audio sources, CC0 only:** Kenney packs from `kenney.nl/assets` (Interface Sounds, UI Audio, Impact Sounds, Digital Audio, RPG Audio, Music Jingles) first; otherwise a page that explicitly states CC0 for that file (for example OpenGameArt entries showing `License(s): CC0`). Never synthesise audio and label it CC0. Kenney packs ship OGG, so no conversion is needed except mono downmix and loop crossfades with ffmpeg. A slot without a CC0 source ships silent and is listed in `open-questions.md` (Q5).
- **Licence records:** every file gets a row in `public/audio/LICENSES.md` (slot id, file, author, source URL, licence text excerpt "CC0", download date, SHA-256). Downloads and zips go under `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/the-last-window/`, are treated as untrusted data (never executed), and are deleted afterwards. Pack `License.txt` files are copied to `public/audio/licenses/`.
- **Slots:** the 33 sound slots and 3 music loops in `assets-index.md` "Audio". Budget: all audio at most 2 MB, sound effects mono ogg each at most 60 KB, `rain-loop` at most 150 KB, music at most 500 KB each. Prefer a different music source from the sibling web games where an equally good CC0 track exists.
- **Kit APIs:** `createAudioManager` (unlock on first gesture, `load`, `play`, `playMusic` with fade, `syncSettings`, `suspend` on pause), `createHaptics` (`impact`, `notify`), the motion helpers with `settings.effectiveReducedMotion(systemPrefersReducedMotion())`, `createLifecycle` pause hooks.
- **Event map:** one table in `src/audio/events.ts` maps engine events to sounds and haptics: `customer-seated` to `customer-arrive`; `selectSeat` to `seat-select`; `step-ok` to `step-tap` (plus `step-brew`, `step-steam`, `step-pour` on those tokens); `step-wrong` to `step-wrong` and a warning haptic; `warm` to `oven-start`; `oven-ready` to `oven-ready`; `pickBook` to `book-pick`; `served` to `serve`, then `coin`, then `delighted` or `disappointed`; `customer-left` and `customer-turned-away` to `customer-left`; `patience-warning` to `patience-warning`; shift start and close; result stars to `star-1` to `star-3`; scene open, choice, friendship level, ending, decor purchase, unlock and streak to their slots. Music: `music-menu` on non-shift routes, `music-shift` during a shift, `music-story` in scenes; `rain-loop` while the weather is rain (shift and shop preview).
- **Haptic map:** light impact on step taps and book picks, medium on serve, `success` on delighted and on each earned star and friendship level, `warning` on a wrong step and when a customer leaves, light on a choice. Nothing on plain navigation taps.
- **Tutorial:** the 7 coach steps in `content-plan.md` on Day 1 with the 6 scripted orders from task 02, advanced only by the real action, skippable, saved as a profile flag so it never repeats, replayable from How to play. **First-time cards** (flags): first stock plan, first rain shift, first story scene, first choice, first decor purchase, first Late Shift.
- **How to play pages:** Your shop, Making drinks, Pastries and the oven, Books and moods, Friends and stories, Stock and decor. Text is short and uses real numbers (patience, prices, thresholds) read from core constants rather than typed twice.

## Implementation Checklist

- [x] Select and download the CC0 files, copy the chosen ogg files into `apps-games/the-last-window/public/audio/` (names equal slot ids), write `LICENSES.md`, copy pack licences, delete the scratch downloads, and write the evidence README `.agents/resources/2026-10-23/web-games/the-last-window/05/README.md` (candidates considered, choices, silent slots).
- [x] `src/audio/slots.ts` (slot table with file, kind, gain, loop flag), `src/audio/engine.ts` (create manager, preload on first gesture with progress, music crossfade by route, rain loop by weather, suspend on pause and resume).
- [x] `src/audio/events.ts` as described, with unit tests of the table.
- [x] `src/feedback/haptics.ts` wiring `createHaptics` and `syncSettings`; settings toggles take effect immediately.
- [x] `src/motion/` helpers: customer arrival slide-in, patience bar pulse under 10 s, steam rising on the cup, coin pop on payment, heart fill on friendship, page-turn between scenes, star reveal stagger of 120 ms, sheet slide; every helper applies the final frame when motion is reduced.
- [x] `src/onboarding/tutorial.ts` (pure step machine fed by engine events), `Coachmark.tsx` overlay, `src/onboarding/cards.tsx` (first-time card sheets and flags), `src/screens/HowTo.tsx` filled with the six pages.
- [x] Credits data: add audio rows from `LICENSES.md` (parsed in a test to prove they match).
- [x] Tests: slot table complete (each slot has a file or an explicit `silent` reason); every listed file exists, is ogg, within size budgets and total at most 2 MB; `LICENSES.md` has a row for each file with a URL, "CC0" and a SHA-256 that matches the file (computed in the test); no audio file lacks a licence row; the fake `AudioContext` (kit `createFakeAudioContext`) proves events trigger the right sound ids, music switches between menu, shift and story, rain loop follows weather, mute and volumes follow settings, nothing plays before unlock, pause suspends; fake haptics receive the exact map above and nothing when haptics are off; the tutorial machine advances only on the matching action, can be skipped and never repeats; each first-time card shows once; how-to renders six pages with numbers from the constants; reduced motion makes every motion helper apply the final frame without calling `animate`.
- [x] Update `assets-index.md` (audio table with sources and sizes), `open-questions.md` (silent slots, Q5 outcome) and `decisions-log.md` (source choices).

## Files Touched

- `apps-games/the-last-window/public/audio/**` (ogg, `LICENSES.md`, `licenses/`)
- `apps-games/the-last-window/src/{audio,feedback,motion,onboarding}/**`, `src/screens/{HowTo,Credits}.tsx`, small hooks in shift and scene screens
- `apps-games/the-last-window/test/**`
- `.agents/games/the-last-window/{assets-index,open-questions,decisions-log}.md`
- `.agents/resources/2026-10-23/web-games/the-last-window/05/README.md`
- `tasks/epics/22-web-the-last-window/STATUS.md` (tick task 05)

## Acceptance Criteria

- Every audio file is CC0 with a source URL, licence and matching SHA-256 in `LICENSES.md`; total audio at most 2 MB.
- Every game event in the event map plays its sound through the kit manager only after unlock, and mute and volumes follow settings.
- Haptics fire per the map and are silent when disabled or unavailable.
- The Day 1 tutorial, the first-time cards and the six how-to pages work, appear once, and are driven by saved flags.
- With reduced motion, no animation runs and results still reach their final state.

## Verification Commands

- `bun run --filter '@web-games/the-last-window*' typecheck`
- `bun run --filter '@web-games/the-last-window*' test`
- `bun run --filter '@web-games/the-last-window' build`
- `bunx biome check apps-games/the-last-window apps-games/the-last-window-core`

## Out of Scope

- Voice acting or any non-CC0 audio.
- New screens beyond the coach overlay and card sheets.
- Playing the audio or judging it by ear (the owner does that in browser QA).

## Commit message

`feat(the-last-window): add CC0 audio, haptics, motion and onboarding [22-web-the-last-window/05]`
