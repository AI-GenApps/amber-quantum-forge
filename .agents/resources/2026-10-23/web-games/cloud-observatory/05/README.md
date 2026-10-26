# Task 05 evidence: CC0 audio, haptics, motion polish, onboarding, How to Play

Headless verification only (Vitest with happy-dom and fake audio contexts and haptics drivers, `tsc`,
`vite build`, Biome). No browser, speaker, device or emulator was used, so nobody has listened to the
files yet: the owner judges sound and feel in the browser (checklist below).

## Audio sources (all CC0, downloaded 2026-10-23)

Downloads and the conversion script lived in `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/cloud-observatory/`
(deleted afterwards). The per-file table, pack licence copies and conversion commands are shipped in
`apps-games/cloud-observatory/public/audio/LICENSES.md` and `public/audio/licenses/`.

| Source | URL | Licence evidence |
|---|---|---|
| Kenney Interface Sounds 1.0 | https://kenney.nl/assets/interface-sounds | zip `License.txt`: "License: (Creative Commons Zero, CC0)" |
| Kenney Music Jingles | https://kenney.nl/assets/music-jingles | zip `License.txt`: "License (Creative Commons Zero, CC0)" |
| Kenney Sci-fi Sounds | https://kenney.nl/assets/sci-fi-sounds | zip `License.txt`: "License: (Creative Commons Zero, CC0)" |
| Cosmic Navigation, Synth-thetic | https://opengameart.org/content/cosmic-navigation | licence field "CC0" (link to creativecommons.org/publicdomain/zero/1.0/); notice "CC0 / Public Domain. No Rights Reserved." Description: "A drifting voyage through starlight and silence", 100 BPM, "2m 56s, 2m 33s 600ms if looping manually. Looping file provided." |

The loop used is the provided `cosmic_navigation_loop.flac` (48 kHz stereo, 153.6 s, 23.4 MB). Kenney
Digital Audio, UI Audio and Impact Sounds were also downloaded and inspected (CC0) but nothing shipped
from them.

## Conversion

Short cues: `aresample=44100`, downmix to mono, silence trimmed at both ends (`silenceremove`, -55 dB),
gain chosen from a `volumedetect` pass so the peak is -3 dBFS before encoding, `libmp3lame` 64 kbps.
Measured peaks after encoding are between -3.7 and -2.9 dB. The Eclipse cue is the first 2.4 s of
`spaceEngineLow_002` with 0.8 s fades in and out. The loop: `aresample=44100`, gain to -3 dBFS,
stereo, `libmp3lame` 96 kbps (measured peak -3.4 dB).

| File | Bytes | Seconds |
|---|---|---|
| gather | 1,505 | 0.16 |
| buy | 3,177 | 0.37 |
| upgrade | 4,640 | 0.55 |
| star-ok | 1,505 | 0.16 |
| star-miss | 1,714 | 0.18 |
| chart-done | 12,999 | 1.59 |
| lore | 4,849 | 0.57 |
| achievement | 10,700 | 1.31 |
| eclipse | 19,687 | 2.43 |
| comet | 9,656 | 1.18 |
| click | 669 | 0.05 |
| back | 1,087 | 0.10 |
| welcome | 4,431 | 0.52 |
| observatory-night (loop) | 1,843,870 | 153.63 |
| Total | 1,920,489 | |

Budget 2,500,000 bytes, enforced by `test/audio/assets.test.ts` with the kit `assertAssetBudget`.

## Bundle growth

| Output | Task 04 | Task 05 | Growth |
|---|---|---|---|
| `dist/assets/index-*.js` raw | 172.00 kB | 187.97 kB | +15.97 kB |
| same, gzip | 55.91 kB | 61.35 kB | +5.44 kB |

Audio files are not in the JS bundle; they are fetched after the first gesture.

## Verification (real runs, 2026-10-23)

| Command | Result |
|---|---|
| `bun run --filter '@web-games/cloud-observatory*' typecheck` | both packages exit 0 |
| `bun run --filter '@web-games/cloud-observatory*' test` | core 25 files, 469 tests pass; app 26 files, 349 tests pass (63 new in task 05) |
| `bun run --filter '@web-games/cloud-observatory' build` | exit 0 |
| `bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core` | no findings |

New tests: `test/audio/cues.test.ts`, `test/audio/assets.test.ts`, `test/audio/feedback.test.tsx`,
`test/onboarding/steps.test.ts`, `test/ui/onboarding.test.tsx` (hints, Eclipse intro, full first
session, count-up), `test/ui/howto.test.tsx`, `test/ui/motion.test.tsx`.

## Owner listening and feel checklist (browser, task 08 carries it forward)

1. Open the game; nothing plays until the first tap. After it, the night loop fades in over about 0.6 s.
2. Gather taps sound soft and never machine-gun when tapped fast (at most 8 per second).
3. Buy, upgrade, correct star, wrong star, chart complete, lore, achievement, Eclipse, Comet, back and
   Welcome Back each have a distinct cue; none is harsh. Tell the agent which to swap.
4. Settings: Sound off silences cues at once, Music off fades the loop, Haptics off silences impacts
   (Android device only), Reduced motion stops twinkle, pulses and the Eclipse animation.
5. The loop seam: listen at the 2 min 33 s mark for a gap or click (open question 12).
6. First run: the hint order is Observe, Build, Atlas, Chart; Skip works; How to Play, "Show the tips
   again" brings them back; the Eclipse sheet appears once at 5 pending shards.
