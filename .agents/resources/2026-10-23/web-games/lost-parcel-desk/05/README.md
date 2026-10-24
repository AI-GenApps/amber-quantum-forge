# Task 05 - CC0 audio evidence

Date: 2026-10-23. Nothing was listened to (no browser, device or player was opened); choices are by licence, pack,
name, duration and slot fit. The owner reviews the sound in browser QA. Nothing is synthesised: every shipped file is a
Kenney file or an excerpt of a CC0 recording.

## Where files came from

All downloads went to `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/lost-parcel-desk/`, were treated as untrusted
data (unzipped and read, never executed) and were deleted after the files below were produced.

Kenney packs (zip URLs resolved from the pack page; each pack ships `License.txt` saying
`License: (Creative Commons Zero, CC0)`). The zip hashes equal those recorded by the sibling game's task 05 for the
same packs, which is a cross-check that the downloads are the published packs.

| Pack | Page | Zip SHA-256 | Zip bytes |
|---|---|---|---|
| Interface Sounds | https://kenney.nl/assets/interface-sounds | `f2193d072726d6758a5f7871b2dcc54dcce0d5c35c6f0a62f92549b327c81232` | 834,536 |
| Impact Sounds | https://kenney.nl/assets/impact-sounds | `029d734af1582474edf3a694d1b0cebc97c1c152f2f39fa34d4c2bafc5de77f8` | 800,850 |
| Digital Audio | https://kenney.nl/assets/digital-audio | `24e6ce28b76a6d8c89cff4d331e0965ff5c3de8a73c612028e9d363cc64e4f06` | 990,367 |
| RPG Audio | https://kenney.nl/assets/rpg-audio | `6dbeaf8544da958d8f2adcb4a4a4b76c1ade34a05f8ab9edccd327da7375f38b` | 964,837 |
| Music Jingles | https://kenney.nl/assets/music-jingles | `b729ba57959bd58793d2c5cafa348aaf2655d354f3da35ec4729e03ec77197b8` | 1,239,525 |

OpenGameArt pages (each shows `License(s): CC0` in the page header; checked by fetching the page, records in
`public/audio/licenses/opengameart-*.txt`):

| Page | Author | Used for | Source file SHA-256 |
|---|---|---|---|
| https://opengameart.org/content/calm-piano-1-vaporware | The Cynic Project (cynicmusic) | `music-desk` | `003_Vaporware_2.mp3` (6,604,773 bytes) `1697fa1b7ed6f3fe1eca4daa4f9d1a2eb3db8fe40a0f3c283529ab47e57b5b38` |
| https://opengameart.org/content/another-august | The Cynic Project (cynicmusic) | `music-case` | `013_Another_August_0.mp3` (8,269,313 bytes) `6de6e4f770cda4d34db433e4df982deccb6877a8fcc5e32b48eeb57f770dec3b` |
| https://opengameart.org/content/keyboard-soundpack-1-typing-and-single-keystrokes | unicaegames | `typewriter` | `unicae_games_keyboard_soundpack_1_0.zip` (8,515,609 bytes) `935eae2fa5c3742eacdd38c4ea0e9047f3887faa0701996498492c256db1b351`; file `Generated Typing/generated-006_faster.wav` `f2c3ddec03ab075e17823d2453e5ef3fabddf92ef229c19cf33857b8b609cdd5` |

## Candidates considered and rejected

| Candidate | Why not |
|---|---|
| Kenney "Music Loops" pack | `https://kenney.nl/assets/music-loops` returns 404; Kenney has no such page. Music Jingles are 1 to 1.4 second stingers, not loops, so they are used for the stamp, ledger, achievement, unlock and streak stingers. |
| Kenney typewriter sound | None in Interface, Impact, RPG, Digital or Jingles packs. |
| OpenGameArt "Typing soundeffect" (johndekale, CC0) | One 167 KB laptop-typing file, not shaped as a loop; the keyboard pack has seven "generated" sequences at different speeds that suit a typewriter loop better. |
| OpenGameArt "Single Key Press Sounds" (eklee) | Page shows CC-BY 3.0, not CC0. |
| Cyberwave Orchestra typewriter pack (itch.io) | Paid, not CC0. |
| Cynic Project "Lifewave 2k" and "Another August" for both loops | Valid CC0 (used by the sibling game); a calm piano track was preferred for the desk so the two loops differ in character from the sibling's. |

## Slot choices

Sound effects that were already mono were copied byte for byte. Stereo originals were downmixed:
`ffmpeg -v error -y -i SRC -ac 1 -c:a libvorbis -q:a 4 OUT.ogg` (ffmpeg 7.1).

| Slot | Original file |
|---|---|
| `ui-tap` | `Audio/click_002.ogg` |
| `ui-back` | `Audio/back_002.ogg` |
| `ui-toggle` | `Audio/toggle_002.ogg` |
| `ui-open-sheet` | `Audio/open_002.ogg` |
| `parcel-open` | `Audio/cloth2.ogg` |
| `object-open` | `Audio/bookFlip1.ogg` |
| `object-flip` | `Audio/bookFlip2.ogg` |
| `zoom-toggle` | `Audio/switch_003.ogg` |
| `clue-found` | `Audio/confirmation_001.ogg` |
| `clue-pin` | `Audio/impactPlank_medium_000.ogg` |
| `clue-unpin` | `Audio/impactWood_light_001.ogg` |
| `clue-link` | `Audio/pluck_001.ogg` |
| `clue-unlink` | `Audio/scratch_001.ogg` |
| `hint-use` | `Audio/bong_001.ogg` |
| `accuse` | `Audio/impactWood_heavy_000.ogg` |
| `wrong-guess` | `Audio/lowRandom.ogg` |
| `stamp-thud` | `Audio/impactSoft_heavy_001.ogg` |
| `typewriter` | `Generated Typing/generated-006_faster.wav` |
| `stamp-1` | `Audio/Pizzicato jingles/jingles_PIZZI05.ogg` |
| `stamp-2` | `Audio/Pizzicato jingles/jingles_PIZZI09.ogg` |
| `stamp-3` | `Audio/Pizzicato jingles/jingles_PIZZI14.ogg` |
| `ledger-found` | `Audio/Steel jingles/jingles_STEEL01.ogg` |
| `map-fill` | `Audio/select_005.ogg` |
| `achievement` | `Audio/Sax jingles/jingles_SAX03.ogg` |
| `chapter-unlock` | `Audio/Steel jingles/jingles_STEEL05.ogg` |
| `theme-unlock` | `Audio/Hit jingles/jingles_HIT10.ogg` |
| `streak-up` | `Audio/Pizzicato jingles/jingles_PIZZI01.ogg` |
| `music-desk` | `003_Vaporware_2.mp3` |
| `music-case` | `013_Another_August_0.mp3` |

Loop recipe (`loop.sh SRC START LENGTH XFADE BITRATE OUT`, kept in the scratch folder and deleted with it): take
`LENGTH + XFADE` seconds from `START`, mix the extra `XFADE` seconds (fading out, `qsin`) over the first `XFADE` seconds
(fading in, `qsin`) and keep `LENGTH` seconds, so the last sample leads into the first. Mono, libvorbis. Commands used:
`loop.sh generated-006_faster.wav 2 2.5 0.25 48k`, `loop.sh 003_Vaporware_2.mp3 20 45 4 80k`,
`loop.sh 013_Another_August_0.mp3 70 45 4 80k`. `volumedetect` on the three loops gave mean volumes of -31.1 dB
(typewriter), -18.3 dB (desk) and -21.8 dB (case), so none is silent.

Silent slots: none. All 27 sound slots and both music loops have a CC0 file.

## Shipped files

| Slot | File | Bytes | SHA-256 (start) |
|---|---|---|---|
| `ui-tap` | `ui-tap.ogg` | 4,275 | ``adcd1f4adc35f1b...` |
| `ui-back` | `ui-back.ogg` | 7,029 | ``61581c58194e3f1...` |
| `ui-toggle` | `ui-toggle.ogg` | 8,056 | ``1f564f5520cfa07...` |
| `ui-open-sheet` | `ui-open-sheet.ogg` | 14,975 | ``24ff224fe2c09c6...` |
| `parcel-open` | `parcel-open.ogg` | 7,346 | ``e34541c2058cb41...` |
| `object-open` | `object-open.ogg` | 10,701 | ``c9eb436a3b1b04d...` |
| `object-flip` | `object-flip.ogg` | 7,813 | ``e6048203c23cbcd...` |
| `zoom-toggle` | `zoom-toggle.ogg` | 5,629 | ``eaea5ca640ad543...` |
| `clue-found` | `clue-found.ogg` | 8,968 | ``063564703b6094d...` |
| `clue-pin` | `clue-pin.ogg` | 9,196 | ``53b51f9879a3669...` |
| `clue-unpin` | `clue-unpin.ogg` | 5,048 | ``ee89c04c8a9ba89...` |
| `clue-link` | `clue-link.ogg` | 4,679 | ``717d8e7bc6b5f9b...` |
| `clue-unlink` | `clue-unlink.ogg` | 8,989 | ``5c294d2e1a6b6d0...` |
| `hint-use` | `hint-use.ogg` | 4,848 | ``d21d0f0b782445d...` |
| `accuse` | `accuse.ogg` | 4,547 | ``a6112be59bdc113...` |
| `wrong-guess` | `wrong-guess.ogg` | 5,416 | ``ceefeeeb6982838...` |
| `stamp-thud` | `stamp-thud.ogg` | 4,997 | ``9e92c9e05c370c6...` |
| `typewriter` | `typewriter.ogg` | 22,540 | ``01cf339d1b49197...` |
| `stamp-1` | `stamp-1.ogg` | 7,359 | ``274a73bbbe9cc44...` |
| `stamp-2` | `stamp-2.ogg` | 8,002 | ``099de0fafa99d32...` |
| `stamp-3` | `stamp-3.ogg` | 10,630 | ``340653ff5008fa5...` |
| `ledger-found` | `ledger-found.ogg` | 13,565 | ``377bdef903bce09...` |
| `map-fill` | `map-fill.ogg` | 6,767 | ``ad09146e4ea33b9...` |
| `achievement` | `achievement.ogg` | 11,066 | ``b4ca2666398f38b...` |
| `chapter-unlock` | `chapter-unlock.ogg` | 10,658 | ``301893abc08f110...` |
| `theme-unlock` | `theme-unlock.ogg` | 9,116 | ``1ad9be1c2d1db5a...` |
| `streak-up` | `streak-up.ogg` | 11,253 | ``af5eb6d9fa20b50...` |
| `music-desk` | `music-desk.ogg` | 298,776 | ``96b4790a3bae6ea...` |
| `music-case` | `music-case.ogg` | 380,972 | ``796136dbf83ac12...` |

Total 913,216 bytes against the 2 MB budget. Checked by `test/audio-assets.test.ts` (Ogg magic bytes, mono Vorbis
header, per-file and total budgets, a licence row per file with URL, CC0 and a matching SHA-256, licence records
copied, credits data equal to the rows).

## Known risk for the owner

Ogg Vorbis is decoded through WebAudio `decodeAudioData`: Chromium, Firefox and Android WebView decode it; Safari and
iOS WKWebView depend on the OS version and were not verified here. When a build cannot decode it the kit manager's
`load` returns false and the game stays silent without error. Recorded as Q15 in
`.agents/games/lost-parcel-desk/open-questions.md`.
