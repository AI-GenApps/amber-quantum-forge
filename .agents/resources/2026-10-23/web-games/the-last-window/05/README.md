# Task 05 - CC0 audio, haptics, motion, onboarding (evidence)

Date: 2026-10-24. Everything was produced and checked headlessly (Vitest with happy-dom, `tsc`, `vite build`,
Biome). No browser, device or emulator was used and no sound was played or judged by ear; the owner does that in
browser QA. Downloads were fetched with `curl` into `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/the-last-window/`,
treated as untrusted data (only unzipped, decoded by ffmpeg and hashed, never executed) and deleted afterwards.

## Sources

| Source | Page | Licence evidence |
|---|---|---|
| Kenney Interface Sounds, Impact Sounds, Digital Audio, RPG Audio, Music Jingles | `https://kenney.nl/assets/<pack>` (zip linked from the page) | pack `License.txt`: "License: (Creative Commons Zero, CC0)", copied to `public/audio/licenses/kenney-<pack>.txt` |
| haruta, "Light rain and heavy rain" | `https://opengameart.org/content/light-rain-and-heavy-rain` | page shows `License(s): CC0` |
| OatCog, "Coffee House Bump" | `https://opengameart.org/content/coffee-house-bump` | page shows `License(s): CC0` |
| Pro Sensory (Alex McCulloch), "Jazz Slower" | `https://opengameart.org/content/jazz-slower` | page shows `License(s): CC0` |
| Pro Sensory (Alex McCulloch), "Just you and me Guitar" | `https://opengameart.org/content/just-you-and-me-guitar` | page shows `License(s): CC0` |

Per-page records are in `apps-games/the-last-window/public/audio/licenses/opengameart-*.txt`; every file has a
row (author, URL, licence, date, SHA-256, treatment) in `public/audio/LICENSES.md`. The Kenney "UI Audio" pack was
downloaded and looked at but nothing from it is used, so it has no licence file.

## Candidates considered

| Slot group | Considered | Chosen |
|---|---|---|
| Door bell (`customer-arrive`) | Impact Sounds `impactBell_heavy` (too low, 230 to 380 Hz), `impactGlass_light`, Interface `glass_001` to `glass_006` | `glass_004` (0.69 s, high bright tinkle, centroid 7 kHz) |
| Oven ding (`oven-ready`) | Interface `bong_001`, `confirmation_*`, Impact `impactMetal_light_000` to `002` | `impactMetal_light_000` (tonal at 2.6 kHz, 0.37 s) |
| Steam / brew / pour | RPG `clothBelt` (noisy hiss), `metalPot1` to `3`, Interface `drop_001` to `004`, `scroll_*` | steam `clothBelt`, brew `metalPot3`, pour `drop_004` |
| Page turn, book, coin, doors | RPG `bookFlip1` to `3`, `bookPlace1` to `3`, `handleCoins`, `doorClose_1` to `4` | `bookFlip1`, `bookPlace1`, `handleCoins`, `doorClose_1` |
| Closing bell | Impact `impactBell_heavy_000` to `004` | `impactBell_heavy_002` (0.7 s) |
| Star, friendship, ending, unlock jingles | Music Jingles Sax, Pizzicato and Steel sets (lengths 0.3 to 1.7 s) | star 1 to 3 `SAX10`, `SAX03`, `SAX07` (rising length); delighted `PIZZI06`; friendship `PIZZI07`; streak `PIZZI01`; shift start `STEEL09`; ending `STEEL06`; unlock `STEEL13` |
| Rain | OpenGameArt "Heavy Rain" (music), "Light rain and heavy rain" (CC0), "Rain Drops" (CC-BY, rejected), "rain and thunders" (CC0, dark thunder ambience) | Light rain: RMS 0.05 for the first 15 s, then it swells to a downpour, so only 0:01 to 0:13 is used |
| Music | Coffee House Bump, Jazz Slower, Taken Lightly, Just you and me Guitar, Bossa Nova, Jazz Chromatic (all CC0) | menu Coffee House Bump; shift Jazz Slower; story Just you and me Guitar. The sibling web games use the Cynic Project tracks and Pro Sensory "Mocha Frapp" / "One Step at a time", so these three are not shared |

Choices were made from file names, durations, peak levels, spectral centroid and flatness measured with ffmpeg and
numpy (`-I` isolated), not by listening. Sounds the owner dislikes can be swapped one file at a time.

## Treatment (commands)

```bash
# sound effects: stereo originals downmixed, mono originals copied unchanged
ffmpeg -i SRC.ogg -ac 1 -c:a libvorbis -q:a 4 public/audio/<slot>.ogg
# loops: START LENGTH XFADE BITRATE LUFS
# head = first XFADE seconds fading in, tail = the XFADE seconds after LENGTH fading out, mixed, then the rest
ffmpeg -ss START -t LENGTH+XFADE -i SRC -ac 1 -ar 44100 -filter_complex "...qsin crossfade..." tmp.wav
ffmpeg -i tmp.wav -af loudnorm=I=LUFS:TP=-2:LRA=7 -ar 44100 -ac 1 -c:a libvorbis -b:a BITRATE <slot>.ogg
```

| Loop | Source file | Start | Length | Crossfade | Bitrate | LUFS | Bytes |
|---|---|---|---|---|---|---|---|
| `rain-loop` | `light_rain_and_heavy_rain.mp3` | 1 s | 12 s | 1.5 s | 48k | -26 | 61,271 |
| `music-menu` | `little_cafe_jazz.mp3` | 19.2 s | 38.4 s (two 19.2 s source bars) | 2 s | 72k | -23 | 326,323 |
| `music-shift` | `Jazz Take 2.mp3` | 40 s | 35.3 s (ten 3.53 s bars) | 2 s | 72k | -23 | 233,916 |
| `music-story` | `Just you and me.mp3` | 6 s | 36 s (six 6 s bars) | 2 s | 72k | -23 | 291,999 |

The bar lengths came from autocorrelation of the source (correlation 0.84 at 19.2 s for Coffee House Bump, a
steady 3.53 s for Jazz Slower and 6.0 s at 0.67 for Just you and me), so the tail meets the head on the same beat.

## Totals

36 files, 1,202,588 bytes (1.15 MB; budget 2 MB). Largest sound effect 15,046 bytes (budget 60 KB), rain loop
61,271 (budget 150 KB), largest music 326,323 (budget 500 KB). No slot ships silent.

## Not verified

Nothing was heard. The doorbell, oven ding, steam, brew and the three loops are stand-ins selected by name and
spectrum; they are listed in `open-questions.md` (Q5) for the owner's ear. Haptics are asserted against a fake
driver only (no device). The seams of the loops are untested by ear.
