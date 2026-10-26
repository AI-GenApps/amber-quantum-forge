# Audio licences

Every file in this folder is released under CC0 1.0 (public domain dedication,
https://creativecommons.org/publicdomain/zero/1.0/). Nothing here is synthesized by this project: each
file is a trimmed, peak-normalised (about -3 dBFS) MP3 conversion of an original CC0 recording. Pack
licence texts are copied under `licenses/`. Downloaded 2026-10-23.

Conversion for the short cues: `ffmpeg -i <src> -af "aresample=44100,pan=mono|c0=0.5*c0+0.5*c1,<silence trim at both ends>,volume=<gain>dB" -ac 1 -ar 44100 -codec:a libmp3lame -b:a 64k <id>.mp3`.
The eclipse cue also uses `atrim=0:2.4,afade=in 0.8 s,afade=out 0.8 s`. The music loop: `ffmpeg -i <src> -af "aresample=44100,volume=<gain>dB" -ac 2 -ar 44100 -codec:a libmp3lame -b:a 96k observatory-night.mp3`.

| File | Source URL | Licence | Original file | Pack licence copy |
|---|---|---|---|---|
| `gather.mp3` | https://kenney.nl/assets/interface-sounds | CC0 | `Audio/glass_003.ogg` | `licenses/kenney-interface-sounds-License.txt` |
| `buy.mp3` | https://kenney.nl/assets/interface-sounds | CC0 | `Audio/confirmation_003.ogg` | `licenses/kenney-interface-sounds-License.txt` |
| `upgrade.mp3` | https://kenney.nl/assets/interface-sounds | CC0 | `Audio/confirmation_002.ogg` | `licenses/kenney-interface-sounds-License.txt` |
| `star-ok.mp3` | https://kenney.nl/assets/interface-sounds | CC0 | `Audio/pluck_002.ogg` | `licenses/kenney-interface-sounds-License.txt` |
| `star-miss.mp3` | https://kenney.nl/assets/interface-sounds | CC0 | `Audio/error_008.ogg` | `licenses/kenney-interface-sounds-License.txt` |
| `chart-done.mp3` | https://kenney.nl/assets/music-jingles | CC0 | `Audio/Steel jingles/jingles_STEEL07.ogg` | `licenses/kenney-music-jingles-License.txt` |
| `lore.mp3` | https://kenney.nl/assets/interface-sounds | CC0 | `Audio/glass_004.ogg` | `licenses/kenney-interface-sounds-License.txt` |
| `achievement.mp3` | https://kenney.nl/assets/music-jingles | CC0 | `Audio/Steel jingles/jingles_STEEL12.ogg` | `licenses/kenney-music-jingles-License.txt` |
| `eclipse.mp3` | https://kenney.nl/assets/sci-fi-sounds | CC0 | `Audio/spaceEngineLow_002.ogg` (first 2.4 s) | `licenses/kenney-sci-fi-sounds-License.txt` |
| `comet.mp3` | https://kenney.nl/assets/music-jingles | CC0 | `Audio/Pizzicato jingles/jingles_PIZZI03.ogg` | `licenses/kenney-music-jingles-License.txt` |
| `click.mp3` | https://kenney.nl/assets/interface-sounds | CC0 | `Audio/click_002.ogg` | `licenses/kenney-interface-sounds-License.txt` |
| `back.mp3` | https://kenney.nl/assets/interface-sounds | CC0 | `Audio/back_001.ogg` | `licenses/kenney-interface-sounds-License.txt` |
| `welcome.mp3` | https://kenney.nl/assets/interface-sounds | CC0 | `Audio/confirmation_004.ogg` | `licenses/kenney-interface-sounds-License.txt` |
| `observatory-night.mp3` | https://opengameart.org/content/cosmic-navigation | CC0 | `cosmic_navigation_loop.flac` by Synth-thetic | `licenses/opengameart-cosmic-navigation-NOTICE.txt` |
