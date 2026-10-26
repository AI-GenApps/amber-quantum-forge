# Task 05 evidence - CC0 audio, haptics, motion, onboarding

No audio was listened to and no browser, device or emulator was used. Choices are by licence,
duration and slot fit; the owner reviews sound in browser QA. Nothing is synthesised.

## Sources checked (all downloaded 2026-10-23 into the scratch folder, treated as untrusted data,
never executed, deleted afterwards)

Kenney packs (licence file in each zip: "License: (Creative Commons Zero, CC0)"; copied to
`apps-games/dress-rehearsal/public/audio/licenses/`):

| Pack | URL | Used |
|---|---|---|
| Interface Sounds | https://kenney.nl/assets/interface-sounds | 13 slots |
| RPG Audio | https://kenney.nl/assets/rpg-audio | 3 slots (cloth x2, coins) |
| Impact Sounds | https://kenney.nl/assets/impact-sounds | 1 slot (soft impact) |
| Digital Audio | https://kenney.nl/assets/digital-audio | 2 slots (rule met / broken) |
| Music Jingles | https://kenney.nl/assets/music-jingles | 5 slots (stars, unlock, streak) |
| UI Audio | https://kenney.nl/assets/ui-audio | none; Interface Sounds fitted every UI slot |

OpenGameArt entries that show `License(s): CC0` on the page (page excerpts in `licenses/`):

| Entry | Decision |
|---|---|
| Camera (themightyglider) https://opengameart.org/content/camera | used for `export-shutter` |
| Mocha Frapp (Pro Sensory) https://opengameart.org/content/mocha-frapp | used for `music-menu` |
| One Step at a time (Pro Sensory) https://opengameart.org/content/one-step-at-a-time | used for `music-style` |
| Bossa Nova, Coffee House Bump, jazz chromatic, Jazz Slower, Just you and me Guitar, Midnight Cruiser, Shop Theme, Taken Lightly | considered for the menu loop, not chosen (too busy, too short to loop, or too long for the 600 KB budget) |

Every shipped file has a row (slot, file, author, source URL, licence, date, SHA-256, original
file name and processing) in `apps-games/dress-rehearsal/public/audio/LICENSES.md`.

## Processing (ffmpeg, libvorbis)

- Mono sources (Kenney Interface Sounds and Digital Audio) are copied unchanged.
- Stereo sources are downmixed to mono: `ffmpeg -ac 1 -c:a libvorbis -q:a 4`.
- Music: an excerpt of 45 s from the CC0 track, with the following 4 s cross-faded
  (equal power) into the head so the loop has no click, mono, 80 kbps. Menu: 0:20 to 1:09 of
  `mocha_frapp_2.mp3`; style: 0:10 to 0:59 of `OneStepAtATIme.wav`.

## Result

26 files, no silent slot. Largest sfx 17,099 bytes (`item-remove`), music 339,602 and 430,565
bytes, total in `assets-index.md` (budget 2 MB; sfx 60 KB; music 600 KB each). Q6 is answered:
every slot has a CC0 source.

## Tests (all headless)

- `test/audio-assets.test.ts`: slot table, files exist and are Ogg within budgets, one licence row
  per file with URL, CC0 and a SHA-256 computed from the file, credits data equals `LICENSES.md`.
- `test/audio-engine.test.ts`: kit fake `AudioContext`; nothing plays before unlock, load once with
  progress, music crossfade menu/style, mute and volume follow settings, suspend on pause.
- `test/feedback.test.ts`: event to sound and haptic table (exact haptic map), star stagger,
  progress cues, rule transitions, fake haptics driver (silent when disabled, follows the switch).
- `test/feedback-flow.test.tsx`: a full riv-01 look fires place, rule, complete, finish, stars, coins.
- `test/motion.test.ts`: every helper animates with motion on, applies the final frame and never
  calls `animate` when reduced.
- `test/onboarding.test.tsx`: tutorial machine, nine rule cards once and only on their challenge,
  the riv-01 walk-through, skip, how-to pages with constants, reduced-motion board reaches the result.

## Kit follow-ups

None from this task.
