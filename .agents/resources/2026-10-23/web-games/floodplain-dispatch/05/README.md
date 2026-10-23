# Task 05 - CC0 audio evidence

Date: 2026-10-23. Nothing was listened to (no browser, device or player was opened); choices are by
licence, pack, name, duration and slot fit. The owner reviews the sound in browser QA. Nothing is
synthesised: every shipped file is a Kenney file or an excerpt of a CC0 recording.

## Where files came from

All downloads went to `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/floodplain-dispatch/`, were treated
as untrusted data (unzipped and read, never executed) and were deleted after the files below were produced.

Kenney packs (zip URLs resolved from the pack page on 2026-10-23; each pack ships `License.txt` saying
`License: (Creative Commons Zero, CC0)`):

| Pack | Page | Zip SHA-256 | Zip bytes |
|---|---|---|---|
| Interface Sounds | https://kenney.nl/assets/interface-sounds | `f2193d072726d6758a5f7871b2dcc54dcce0d5c35c6f0a62f92549b327c81232` | 834,536 |
| Impact Sounds | https://kenney.nl/assets/impact-sounds | `029d734af1582474edf3a694d1b0cebc97c1c152f2f39fa34d4c2bafc5de77f8` | 800,850 |
| Digital Audio | https://kenney.nl/assets/digital-audio | `24e6ce28b76a6d8c89cff4d331e0965ff5c3de8a73c612028e9d363cc64e4f06` | 990,367 |
| RPG Audio | https://kenney.nl/assets/rpg-audio | `6dbeaf8544da958d8f2adcb4a4a4b76c1ade34a05f8ab9edccd327da7375f38b` | 964,837 |
| Music Jingles | https://kenney.nl/assets/music-jingles | `b729ba57959bd58793d2c5cafa348aaf2655d354f3da35ec4729e03ec77197b8` | 1,239,525 |
| UI Audio (inspected, nothing used) | https://kenney.nl/assets/ui-audio | `946fc23a63d535d693eb31b2eabb80c8c28d6351e2186b344ceb71b2cb1d5eb6` | 411,949 |

OpenGameArt pages (each shows `License(s): CC0` in the page header; checked by fetching the page):

| Page | Author | Used for | Source file SHA-256 |
|---|---|---|---|
| https://opengameart.org/content/sea-and-river-wave-sounds | Snabisch (Vistula river recording) | `water-loop` | `VistulaShort.mp3` `8c24607e41edd6f018ec3582a07e5a8dbc57347276339cb68440951a0fb4cfb1` |
| https://opengameart.org/content/calm-ambient-3-lifewave-2k | The Cynic Project (cynicmusic) | `music-menu` | `006_lifeWave2k.mp3` `f6a796483aee743d72fd9abd44002694246bb3a7977239abbace2a56a0d344ce` |
| https://opengameart.org/content/another-august | The Cynic Project (cynicmusic) | `music-play` | `013_Another_August.mp3` `6de6e4f770cda4d34db433e4df982deccb6877a8fcc5e32b48eeb57f770dec3b` |

## Candidates considered and rejected

| Candidate | Why not |
|---|---|
| Kenney Music Jingles as the two music loops | 1 to 1.8 second jingles, not loops. Used instead for the star, unlock and streak stingers. |
| Kenney UI Audio | Overlaps Interface Sounds; nothing from it needed. |
| OpenGameArt `lost-in-the-meadows` and `feel-good-island` (HaelDB) | Page shows `OGA-BY 3.0`, not CC0. |
| OpenGameArt `calm-piano-1-vaporware`, `calm-ambient-2-synthwave-15k` (Cynic Project, CC0) | Valid CC0 alternatives kept in reserve. The Synthwave piece has a plucked lead its author calls annoying (page text), so Lifewave and Another August (pads and piano, described as calm and serene) were used. |
| OpenGameArt `balance-0` (Komiku, CC0) | Valid CC0 alternative, from an adventure album; not used. Its source is an 8 MB track. |
| OpenGameArt `water-waves` (transitking, CC0 flac), `beach-ocean-waves`, `rain-loopable`, `dripping-water-loop` | Sea surf, rain and drips rather than flowing river water. |

## Slot choices

Sound effects that were already mono were copied byte for byte. Stereo originals were downmixed:
`ffmpeg -v error -y -i SRC -ac 1 -c:a libvorbis -q:a 4 OUT.ogg` (ffmpeg 7.1).

| Slot | Original file (pack) |
|---|---|
| `ui-tap` | `click_001.ogg` (Interface Sounds) |
| `ui-back` | `back_001.ogg` (Interface Sounds) |
| `ui-toggle` | `toggle_001.ogg` (Interface Sounds) |
| `ui-open-sheet` | `open_001.ogg` (Interface Sounds) |
| `place-canal` | `impactMining_000.ogg` (Impact Sounds) |
| `place-barrier` | `impactSoft_heavy_000.ogg` (Impact Sounds) |
| `place-pump` | `impactMetal_medium_000.ogg` (Impact Sounds) |
| `place-gate` | `impactWood_medium_000.ogg` (Impact Sounds) |
| `place-reservoir` | `impactPlate_heavy_000.ogg` (Impact Sounds) |
| `remove-piece` | `minimize_003.ogg` (Interface Sounds) |
| `rotate-pump` | `metalLatch.ogg` (RPG Audio) |
| `invalid` | `error_004.ogg` (Interface Sounds) |
| `run-start` | `maximize_006.ogg` (Interface Sounds) |
| `surge-warning` | `impactBell_heavy_000.ogg` (Impact Sounds) |
| `house-supplied` | `confirmation_002.ogg` (Interface Sounds) |
| `field-irrigated` | `drop_001.ogg` (Interface Sounds) |
| `house-flooded` | `lowDown.ogg` (Digital Audio) |
| `star-1` | `jingles_PIZZI12.ogg` (Music Jingles, 0.99 s) |
| `star-2` | `jingles_STEEL03.ogg` (Music Jingles, 1.39 s) |
| `star-3` | `jingles_SAX07.ogg` (Music Jingles, 1.74 s) |
| `result-fail` | `lowThreeTone.ogg` (Digital Audio) |
| `region-unlock` | `jingles_STEEL07.ogg` (Music Jingles, 1.55 s) |
| `theme-unlock` | `jingles_HIT15.ogg` (Music Jingles, 1.16 s) |
| `streak-up` | `jingles_PIZZI03.ogg` (Music Jingles, 1.15 s) |
| `water-loop` | `VistulaShort.mp3` 0:05 to 0:15 plus a 1.5 s crossfade |
| `music-menu` | `006_lifeWave2k.mp3` 0:30 to 1:15 plus a 4 s crossfade |
| `music-play` | `013_Another_August.mp3` 0:40 to 1:25 plus a 4 s crossfade |

Loop recipe (`loop.sh SRC START LENGTH XFADE BITRATE OUT`): take `LENGTH + XFADE` seconds from `START`,
mix the extra `XFADE` seconds (fading out, `qsin`) over the first `XFADE` seconds (fading in, `qsin`),
and keep `LENGTH` seconds, so the last sample leads into the first. Mono, libvorbis. Commands used:
`loop.sh VistulaShort.mp3 5 10 1.5 40k`, `loop.sh 006_lifeWave2k.mp3 30 45 4 80k`,
`loop.sh 013_Another_August.mp3 40 45 4 80k`.

Silent slots: none. All 25 sound slots and both music loops have a CC0 file.

## Shipped files

| Slot | File | Bytes | SHA-256 (start) |
|---|---|---|---|
| `ui-tap` | `ui-tap.ogg` | 4,876 | `ccfb7fa0cccdd9fa...` |
| `ui-back` | `ui-back.ogg` | 6,997 | `07db973f79f6ae0f...` |
| `ui-toggle` | `ui-toggle.ogg` | 7,369 | `ca1d2dde5f0b286a...` |
| `ui-open-sheet` | `ui-open-sheet.ogg` | 9,834 | `a27c6bb0df7da1e6...` |
| `place-canal` | `place-canal.ogg` | 8,361 | `84b0113f4b29201b...` |
| `place-barrier` | `place-barrier.ogg` | 4,790 | `d8e49387e27d49e2...` |
| `place-pump` | `place-pump.ogg` | 5,488 | `7c016c8038c0dcef...` |
| `place-gate` | `place-gate.ogg` | 5,172 | `53f20e7531484991...` |
| `place-reservoir` | `place-reservoir.ogg` | 7,288 | `dd8582b033548529...` |
| `remove-piece` | `remove-piece.ogg` | 11,739 | `400e1041499de85e...` |
| `rotate-pump` | `rotate-pump.ogg` | 6,481 | `2eb8bf6961c1421a...` |
| `invalid` | `invalid.ogg` | 5,013 | `997387d3fcb65fb5...` |
| `run-start` | `run-start.ogg` | 11,618 | `f050b3bb77cb0b90...` |
| `water-loop` | `water-loop.ogg` | 54,591 | `f67e2207e02fd151...` |
| `surge-warning` | `surge-warning.ogg` | 9,270 | `ef016ee9054700fa...` |
| `house-supplied` | `house-supplied.ogg` | 14,169 | `33b17a9a9a2397c6...` |
| `field-irrigated` | `field-irrigated.ogg` | 4,759 | `7e7d9da6564e9dba...` |
| `house-flooded` | `house-flooded.ogg` | 5,956 | `e0215fcfd8b9d787...` |
| `star-1` | `star-1.ogg` | 11,051 | `83880d3fa3ed751e...` |
| `star-2` | `star-2.ogg` | 12,270 | `50ed39d6a318ef87...` |
| `star-3` | `star-3.ogg` | 14,977 | `d321d10b338e2553...` |
| `result-fail` | `result-fail.ogg` | 7,035 | `b4b3bc7420e71bfb...` |
| `region-unlock` | `region-unlock.ogg` | 15,086 | `bc6e131e1483d897...` |
| `theme-unlock` | `theme-unlock.ogg` | 12,229 | `73848d8842ce08d5...` |
| `streak-up` | `streak-up.ogg` | 11,651 | `f6c5d44ae4d014d6...` |
| `music-menu` | `music-menu.ogg` | 309,909 | `866fbecb6b963066...` |
| `music-play` | `music-play.ogg` | 384,222 | `631252bfd2deb4cf...` |

Total 962,201 bytes against the 2 MB budget. Checked by `test/audio-assets.test.ts`
(Ogg magic bytes, per-file and total budgets, a licence row per file with URL, CC0 and a matching SHA-256).

## Known risk for the owner

Ogg Vorbis is decoded through WebAudio `decodeAudioData`. Chromium, Firefox and Android WebView decode
it. Support in Safari and iOS WKWebView depends on the OS version and was not verified here; on a build
that cannot decode it the kit manager's `load` returns false, so the game stays silent without error. Recorded as Q21 in
`.agents/games/floodplain-dispatch/open-questions.md`; a fix (ship AAC or MP3 twins) is outside the
"no conversion" instruction of this task, so the owner decides after iOS QA.
