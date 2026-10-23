---
epic: 21-web-cloud-observatory
task: 05-audio-haptics-onboarding
status: todo
commit_scope: cloud-observatory
depends_on: [21-web-cloud-observatory/04-screens-and-ui]
estimate: L
owner: agent
---

# CC0 audio, haptics, motion polish, onboarding and how-to-play

## Goal

Make the game feel alive and teach it: licensed CC0 sound effects and one ambient music loop wired
to every interaction through the kit audio manager, haptics through the kit wrapper, reduced-motion
aware polish (twinkle, ink-draw, Eclipse sequence), and the first-run onboarding plus the
How to Play guide. Everything is verified headlessly with fake audio contexts and fake haptics
drivers; the owner judges the sound and feel at the end.

## Context / Decisions

- Audio is CC0 only. Sources: Kenney asset packs (kenney.nl, CC0 1.0) such as Interface Sounds,
  Digital Audio, UI Audio, Music Jingles, Sci-fi Sounds and Impact Sounds, or a page that
  explicitly states CC0 (for example an OpenGameArt entry whose licence field says CC0). Never
  synthesize audio and call it CC0; never use a file whose licence is not stated. Download into
  `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/cloud-observatory/` (delete afterwards), keep the
  pack's licence text, and record per file in `assets-index.md`: id, original file name, source
  URL, licence, conversion command, date.
- Cue list (ids final): `gather`, `buy`, `upgrade`, `star-ok`, `star-miss`, `chart-done`, `lore`,
  `achievement`, `eclipse`, `comet`, `click`, `back`, `welcome`, plus the music id
  `observatory-night`. See `assets-index.md`.
- Container: default MP3 (WebView-safe), encoded with the locally installed `ffmpeg`/`lame`
  (both present on the build machine). Short cues mono 44.1 kHz around 64 kbps, the loop stereo
  96 kbps and loopable. Total audio at most 2.5 MB.
- Music loop: Kenney publishes jingles, not long ambient tracks. If no explicitly CC0 ambient loop
  of 60 to 180 seconds can be found, ship sfx and jingles only, keep the music slot wired and
  silent, and record that in `open-questions.md` (row 3). Do not substitute an unlicensed track.
- Haptics map: correct star light impact, wrong star warning notification, chart complete success,
  Eclipse medium impact, buy light impact, achievement success. All behind the haptics setting;
  silent on web.
- Settings come from the kit settings store; audio and haptics subscribe to it. Audio unlocks on
  the first user gesture via the kit helper and suspends on lifecycle pause.
- Onboarding uses the beats in `product.md`: Observe (3 taps), Build (buy a Brass Telescope), Atlas
  (first constellation ready), Chart (tap the numbered stars), and a one-time Eclipse explainer
  when pending shards first reach 5.

## Implementation Checklist

- [ ] Choose and download the CC0 files for the 13 cues (and the loop if one qualifies); trim
      silence; normalise peaks to about -3 dBFS; convert to MP3; place under
      `apps-games/cloud-observatory/public/audio/` with `LICENSES.md` listing source URL and licence
      for every file and a copy of each pack's licence text.
- [ ] `src/audio/cues.ts`: typed cue table (id to file, default volume, rate jitter range);
      `createGameAudio(manager)` that loads cues lazily after unlock, plays by id, throttles
      `gather` to at most 8 plays per second, and starts/stops the music loop with a 600 ms fade.
- [ ] `src/audio/feedback.ts`: the real `Feedback` implementation (replaces the null one from task
      04) combining audio and haptics; a single `feedback.sfx/haptic` call site per interaction.
- [ ] Wire feedback into: Gather, buy, upgrade, star correct/wrong, chart complete, lore unlock,
      achievement toast, Eclipse, Comet complete, buttons (click/back), Welcome Back.
- [ ] Settings: sound and music toggles mute immediately; haptics toggle silences impacts; reduced
      motion removes the animations below.
- [ ] Motion polish with the kit `createMotion` (all skipped when reduced): star twinkle (slow,
      at most 1.5 Hz), ink-draw of constellation lines on correct taps, wrong-tap shake (80 ms),
      starlight number count-up, purchase pulse, chart-complete gold wash, Eclipse sequence (dim,
      ring of light, return; 2.4 s; static card when reduced), chapter card fade.
- [ ] Onboarding: `src/onboarding/steps.ts` (pure step machine driven by profile flags and game
      events, persisted in `profile.tutorial`), `OnboardingHint.tsx` (non-blocking coach mark with
      Skip), `EclipseIntro` sheet; skippable and replayable from How to Play.
- [ ] `HowToPlay` screen: four pages (Gather and Build, Chart the Sky, The Eclipse, The Comet and
      the Journal) with small code-drawn diagrams; reachable from Title and Settings; plain,
      short sentences; reading level suitable for age 8 and up.
- [ ] Update `assets-index.md` (audio provenance table, sizes), `open-questions.md` (loop
      outcome) and `decisions-log.md` (audio container, final cue list).

Tests:

- [ ] `audio/cues.test.ts`: with the kit `createFakeAudioContext`, every cue loads and plays;
      unknown ids are ignored; throttling of `gather`; settings mute; music fades in/out; a
      missing `AudioContext` is a silent no-op.
- [ ] `audio/assets.test.ts`: every cue file exists, non-empty, MP3 header present; total audio
      bytes at most 2,500,000 (kit `assertAssetBudget`); `LICENSES.md` has a row with a source URL
      and the licence text `CC0` for every audio file and no file without a row.
- [ ] `feedback.test.ts`: each interaction triggers the expected sfx id and haptic kind exactly
      once (fake driver and fake manager), nothing fires when settings disable them.
- [ ] `onboarding/steps.test.ts`: step order, each step completes on its event, skip works, replay
      resets, flags persist across a save/load, the Eclipse intro shows once.
- [ ] `HowToPlay` renders four pages and navigates; reduced-motion tests: no animation classes or
      `Element.animate` calls when reduced; the Eclipse sequence becomes a static card.
- [ ] Full-session test: scripted run through onboarding to the first chart completes with the
      expected feedback calls and no unhandled promise rejections.

## Files Touched

- `apps-games/cloud-observatory/public/audio/*.mp3`, `public/audio/LICENSES.md`
- `apps-games/cloud-observatory/src/{audio,onboarding,motion}/**`, `src/screens/HowToPlay.tsx`,
  small wiring edits in screens and `App.tsx`
- `apps-games/cloud-observatory/test/**`
- `.agents/games/cloud-observatory/{assets-index,open-questions,decisions-log,product}.md`
- `tasks/epics/21-web-cloud-observatory/STATUS.md` (tick task 05)

## Acceptance Criteria

- Every shipped audio file has a recorded CC0 source URL and licence; none is synthesized or from
  an unlicensed page; the licence test enforces it.
- Total audio at most 2.5 MB; the app still builds; the JS bundle growth is reported.
- Every interaction in the wiring list emits the expected cue and haptic (tests).
- Sound, music, haptics and reduced-motion settings take effect immediately and persist.
- Onboarding teaches Gather, Build, the first chart and the Eclipse, is skippable, replayable and
  never blocks input.
- No audio plays before the first user gesture; a missing AudioContext never throws.
- No browser, speaker or device was used by the agent to judge sound; the owner checklist covers it.

## Verification Commands

- `bun run --filter '@web-games/cloud-observatory*' typecheck`
- `bun run --filter '@web-games/cloud-observatory*' test`
- `bun run --filter '@web-games/cloud-observatory' build`
- `bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core`

## Out of Scope

- Art integration (task 06), Capacitor projects (task 07), release gates (task 08).
- Voice, speech or localisation; English only.
- Synthesized or generated audio of any kind, and any non-CC0 source.
- Changing the kit or dependencies.

## Commit message

`feat(cloud-observatory): add CC0 audio, haptics, motion polish and onboarding [21-web-cloud-observatory/05]`
