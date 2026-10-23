# Task 05 evidence: CC0 audio, haptics, motion, onboarding, how to play

Date: 2026-10-23. Nothing here was listened to (agents do no device or browser QA): files were chosen
from the pack catalogues by name, category and duration, and checked for format with `ffprobe`.
Whether they sound right is an owner browser check (QA checklist, task 08).

## Licence confirmation (per source page)

| Source | Page | What the page and the shipped file state | Retrieved |
|---|---|---|---|
| Kenney UI Audio | https://kenney.nl/assets/ui-audio | Page badge "CC0 licensed!" and "Creative Commons CC0"; pack `License.txt`: "License (Creative Commons Zero, CC0) http://creativecommons.org/publicdomain/zero/1.0/" | 2026-10-23 |
| Kenney Interface Sounds | https://kenney.nl/assets/interface-sounds | Same badge; `License.txt`: "License: (Creative Commons Zero, CC0)" | 2026-10-23 |
| Kenney Impact Sounds | https://kenney.nl/assets/impact-sounds | Same badge; `License.txt`: "License: (Creative Commons Zero, CC0)" | 2026-10-23 |
| Kenney Music Jingles | https://kenney.nl/assets/music-jingles | Same badge; `License.txt`: "License (Creative Commons Zero, CC0)" | 2026-10-23 |
| OpenGameArt "Calm Loop" by wipics | https://opengameart.org/content/calm-loop | "License(s): CC0", "Copyright/Attribution Notice: Public Domain", tags "relaxing loop chill Ambient calm synths percussion", file `Relaxing.mp3` (served as `Relaxing_0.mp3`, 314.2 Kb) | 2026-10-23 |

The Kenney pack zips were downloaded from the `kenney.nl/media/pages/assets/...` links on each page.
The four `License.txt` files and the OpenGameArt excerpt are shipped next to the audio in
`apps-games/lantern-loops/public/audio/LICENSES/`.

## What was considered and rejected

| Candidate | Verdict | Why |
|---|---|---|
| Kenney Interface Sounds (100 OGG files) | Used for 10 events | UI clicks, confirmations, glass, errors, questions; all short |
| Kenney UI Audio (54 files) | Used for `ui-tap` | Plain click; the rest of the pack is mouse and switch noises |
| Kenney Impact Sounds (133 files) | Used for `tile-place` | `impactWood_light_001`: a soft wooden tap that suits paper tiles; metal, plate, punch and glass impacts are too harsh |
| Kenney Music Jingles (85 files) | Used for the 5 win and event jingles | Steel and pizzicato jingles are bell-like and warm; sax, 8-bit and hit jingles were rejected as off-tone for a calm game |
| Kenney packs as a music loop | Rejected | Jingles last 0.3 to 1.6 s, not loops |
| OpenGameArt "Contemplation" | Rejected | CC0, but tagged "melancholy sad", wrong mood for a calm-but-warm puzzle |
| OpenGameArt "Lonely Night" | Rejected | CC0 8-bit chiptune, wrong style |
| OpenGameArt "Winter Wind" | Rejected | Ambience, not music |
| OpenGameArt "Happy Lullaby (song17)" | Rejected | The page text also talks about CC-BY, so the licence is not unambiguous |
| OpenGameArt "Calm Loop" | Used for `calm-loop` | Page explicitly states CC0, tagged "loop", 19.4 s, 314 KB (budget 1 MB), calm and relaxing |

Music decision: it ships (open question Q2 answered). The Music toggle controls it; with the toggle
off or without WebAudio nothing plays. One owner check is listed for QA: the 19.4 s MP3 loops through
`AudioBufferSourceNode.loop`; if a gap is audible at the seam, swap the file or trim it (the file ships
unmodified so its hash equals the source hash).

## Format decision

Packs are OGG; `ffmpeg` (with `libmp3lame`) is installed, so every effect was converted:

```
ffmpeg -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k -map_metadata -1 <source>.ogg <event-id>.mp3
```

MP3 decodes in Chromium, Android WebView and iOS WKWebView, Ogg Vorbis is not reliable in WKWebView
on iOS 17. Mono 64 kbit/s keeps every effect between 1.1 and 12.7 KB (budget 60 KB). Metadata is
stripped. `ffprobe` of the shipped files:

| File | Codec, rate, channels | Duration (s) | Bytes |
|---|---|---|---|
| `ui-tap` | mp3, 44100, 1 | 0.104 | 1,087 |
| `ui-back` | mp3, 44100, 1 | 0.104 | 1,087 |
| `sheet-open` | mp3, 44100, 1 | 0.366 | 3,177 |
| `tile-place` | mp3, 44100, 1 | 0.313 | 2,759 |
| `tile-rotate` | mp3, 44100, 1 | 0.183 | 1,714 |
| `tile-erase` | mp3, 44100, 1 | 0.183 | 1,714 |
| `loop-close` | mp3, 44100, 1 | 0.575 | 4,849 |
| `lantern-lit` | mp3, 44100, 1 | 0.313 | 2,759 |
| `conflict` | mp3, 44100, 1 | 0.209 | 1,923 |
| `hint` | mp3, 44100, 1 | 0.366 | 3,177 |
| `undo` | mp3, 44100, 1 | 0.183 | 1,714 |
| `win-1` | mp3, 44100, 1 | 0.836 | 6,939 |
| `win-2` | mp3, 44100, 1 | 1.306 | 10,700 |
| `win-3` | mp3, 44100, 1 | 1.593 | 12,999 |
| `daily-done` | mp3, 44100, 1 | 1.358 | 11,118 |
| `chapter-unlock` | mp3, 44100, 1 | 1.411 | 11,536 |
| `freeze-used` | mp3, 44100, 1 | 0.157 | 1,505 |
| `calm-loop` | mp3, 44100, 2 (128 kbit/s, original) | 19.383 | 314,222 |

Total 385.7 KB (budget 1.5 MB).

## Final mapping

The id to source file mapping with both SHA-256 values is the audio table in
`.agents/games/lantern-loops/assets-index.md`; the machine-readable records are
`apps-games/lantern-loops/src/audio/sources.ts`. The test `test/audio/files.test.ts` recomputes
every hash, fails on an unrecorded, missing or altered file, checks the budgets and scans `src` for
any synthesis API.

## Haptics map (kit `createHaptics`, honours the Haptics setting)

| Event | Haptic | Throttle |
|---|---|---|
| `tile-place`, `tile-rotate` | light impact | one per 40 ms, shared |
| `loop-close` | medium impact | none |
| `win-1`, `win-2`, `win-3` | success notification | none |
| `conflict` | warning notification | one per 800 ms |
| `hint`, `undo` | light impact | none |
| all other events | none | |

## Verification (headless)

Run from the worktree root; results are in the task report and the epic STATUS file.

```
bun run --filter '@web-games/lantern-loops*' typecheck
bun run --filter '@web-games/lantern-loops*' test
bun run --filter '@web-games/lantern-loops' build
bunx biome check apps-games/lantern-loops apps-games/lantern-loops-core
```

Throwaway downloads lived in `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/lantern-loops/` and were deleted.
