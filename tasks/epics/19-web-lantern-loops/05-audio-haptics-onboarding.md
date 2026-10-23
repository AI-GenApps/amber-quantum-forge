---
epic: 19-web-lantern-loops
task: 05-audio-haptics-onboarding
status: pending
commit_scope: lantern-loops
depends_on: [19-web-lantern-loops/04-screens-and-ui]
estimate: L
owner: agent
---

# CC0 audio, haptics, motion polish, onboarding and how-to-play

## Goal

Make the game feel finished: CC0 sound effects (and an optional calm music loop) with verified
licences, haptics tied to board events, motion polish that respects reduced motion, the first-run
onboarding with two guided 4x4 boards and one-time coach cards, and the six how-to-play pages with
code-drawn diagrams. All of it is verified headlessly; "does it sound or feel right" is an owner
browser/device check recorded in the QA checklist (task 08).

## Context / Decisions

- Audio is CC0 only. Candidate packs (confirm each on its page): Kenney "Interface Sounds", "UI Audio",
  "Impact Sounds", "Music Jingles" (kenney.nl/assets, licence Creative Commons CC0). Never synthesize audio
  and label it CC0. Download into `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/lantern-loops/05/` and
  delete when done. Per file record: pack, original file name, page URL, licence text excerpt, date,
  SHA-256, in `assets-index.md` and under `public/audio/LICENSES/`.
- Event ids (`content-plan.md` section 10): `ui-tap`, `ui-back`, `sheet-open`, `tile-place`, `tile-rotate`,
  `tile-erase`, `loop-close`, `lantern-lit`, `conflict`, `hint`, `undo`, `win-1`, `win-2`, `win-3`,
  `daily-done`, `chapter-unlock`, `freeze-used`, optional music `calm-loop`.
- Format: files must decode in Chromium, Android WebView and iOS WKWebView. Prefer MP3 or AAC (M4A); if a
  pack only offers OGG/WAV and `ffmpeg` is installed, convert; otherwise ship short mono WAV. Record the
  choice and why. Budgets: each effect <= 60 KB, music <= 1 MB, all audio <= 1.5 MB (test).
- Music: needs a CC0 loop whose page states the licence. If none fits, ship without music: the Music
  toggle stays, plays nothing, and the decision goes to `decisions-log.md` and `open-questions.md` (Q2).
- Audio manager from the kit: unlock on first gesture, one music loop with fade, master/sfx/music volume,
  settings-driven mute, pause on lifecycle pause, no-op when `AudioContext` is missing.
- Haptics map (kit `createHaptics`, honours the setting): light impact on placing or rotating a tile
  (throttled to one per 40 ms during a drag), medium impact on `loop-close`, success notification on win,
  warning notification on a new conflict (throttled to one per 800 ms), light on hint and undo.
- New core helper (in scope, tested): `diffLoops(puzzle, before, after)` returning loops newly closed or
  broken and lanterns newly lit, used for `loop-close` and `lantern-lit` events.
- Motion polish (kit `createMotion`, reduced-motion aware): tile place pop, loop-close glow sweep along the
  loop, lantern bloom when lit, win cascade over all loops, sheet and screen transitions, star pop in the
  win sheet, streak flame flicker on Home; every one has a reduced-motion variant (final frame at once).
- Onboarding (state machine in `src/onboarding/`): first launch shows a welcome card, then `tutorial-1`
  ("Light one lantern") and `tutorial-2` ("Count the stones") with a highlighted target and one sentence per
  step, a persistent Skip, and sets `onboardingDone` in the profile; replay from Settings. One-time coach
  cards on Bridge 01 (mirrors) and Sky 01 (gates and colours), remembered per card in the profile.
- How to play: six pages (Basics, Stones, Mirrors, Gates and colours, Daily and streak, Hints and stars),
  each at most 60 words with a static SVG diagram built from the board components and a tiny fixture.

## Implementation Checklist

- [ ] Research and download the CC0 sounds; confirm the licence on each pack page; write the per-file
      records and `.agents/resources/2026-10-23/web-games/lantern-loops/05/README.md` (what was considered,
      what was rejected and why, final mapping).
- [ ] `public/audio/*` (final files), `public/audio/LICENSES/*.txt`, `src/audio/sounds.ts` (id to file
      manifest), `src/audio/AudioProvider.tsx` (creates the manager, preloads effects after unlock, music
      start/stop, settings sync, lifecycle pause/resume).
- [ ] Core `src/loops.ts` addition: `diffLoops` plus tests in `test/diff-loops.test.ts`.
- [ ] `src/feedback/` event bus: board and services emit typed events; a subscriber maps events to sounds,
      haptics and motion so screens never call audio directly.
- [ ] Wire all 17 sound ids and the haptics map; throttles as specified; no sound when the setting is off.
- [ ] Motion polish list above with reduced-motion variants; `src/motion/presets.ts`.
- [ ] `src/onboarding/{machine.ts,Onboarding.tsx,CoachCards.tsx}` and Settings "Replay tutorial".
- [ ] `src/screens/HowTo.tsx` pages and `src/howto/diagrams.tsx`; strings added to the table.
- [ ] About screen lists fonts (OFL) and audio (CC0) with sources, generated from the manifest.
- [ ] Update `assets-index.md` audio table, `README.md` quick facts (audio budget), `decisions-log.md`.

## Files Touched

- `apps-games/lantern-loops/src/{audio,feedback,motion,onboarding,howto}/**`, `src/screens/{HowTo,About,Settings,Puzzle}.tsx`,
  `src/strings.ts`, `public/audio/**`
- `apps-games/lantern-loops-core/src/loops.ts`, `test/diff-loops.test.ts`
- `apps-games/lantern-loops/test/{audio,feedback,onboarding,howto,motion}/**`
- `.agents/games/lantern-loops/{assets-index,decisions-log,open-questions,README}.md`,
  `.agents/resources/2026-10-23/web-games/lantern-loops/05/**`

## Acceptance Criteria

- [ ] Every audio file in `public/audio` has a record (URL, pack, licence CC0, SHA-256) and the test
      recomputes the hashes and fails on an unrecorded or mismatched file; no file is generated by code;
      audio total <= 1.5 MB, effects <= 60 KB each.
- [ ] A manifest test: all 17 event ids map to an existing file (music optional); `AudioProvider` with the
      kit fake `AudioContext` loads, plays by id, respects sound/music/master settings, unlocks on the first
      gesture, and is a safe no-op without `AudioContext`.
- [ ] Event mapping tests: placing, rotating, erasing, closing a loop, lighting a lantern, conflicts,
      hints, undo, wins with 1/2/3 stars, daily done, chapter unlock and freeze used each trigger the
      right sound id and haptic; throttles hold (fake timers); haptics off silences all haptics.
- [ ] `diffLoops` tests: closing, breaking, merging and splitting loops; lantern newly lit and un-lit;
      no events for a no-op edit.
- [ ] Reduced motion: every motion preset applies its final frame immediately and starts no animation.
- [ ] Onboarding machine tests: fresh profile starts it; Skip at every step sets `onboardingDone`; the two
      tutorial boards can be solved by the scripted moves; a returning profile never sees it; replay works;
      coach cards show once each and persist.
- [ ] How-to pages: exactly 6, each <= 60 words, diagrams render, navigation between pages works, reachable
      from Home and the pause sheet.
- [ ] About screen lists every font and audio source from the manifests.
- [ ] All verification commands below pass.

## Verification Commands

```
bun run --filter '@web-games/lantern-loops*' typecheck
bun run --filter '@web-games/lantern-loops*' test
bun run --filter '@web-games/lantern-loops' build
bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core
```

## Out of Scope

Judging how the sounds or haptics feel (owner QA), any listening test, image art (task 06),
Capacitor projects (07), non-CC0 audio, text-to-speech, adding any dependency.

## Commit message

`feat(lantern-loops): CC0 audio, haptics, motion and onboarding [19-web-lantern-loops/05]`
