# Merge Relay audio provenance

Every file in this directory is **CC0 1.0 Universal** (public domain
dedication — free to use, modify and redistribute without attribution,
though credit is appreciated). No paid or attribution-required asset is
used anywhere in this game, per task
`tasks/epics/16-games-portfolio-wave2/10-mr-audio.md`.

Kenney `.ogg` source files were downsampled to mono (`libvorbis`, `-q:a 4`)
to fit the task's 1.5 MB size budget; CC0 permits derivative works freely,
so this is not a license concern. `music_loop.ogg` was additionally
trimmed to a 24s loop-friendly excerpt with a 50ms fade-in and 400ms
fade-out (to remove the click at the loop seam) and transcoded from the
source `.wav` to mono `.ogg` (`libvorbis`, `-q:a 3`).

| File | Source pack / file | Author | Source URL | License | Retrieved |
|---|---|---|---|---|---|
| `sfx_slide.ogg` | Interface Sounds — `drop_001.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/interface-sounds | CC0 1.0 | 2026-09-26 |
| `sfx_merge.ogg` | Interface Sounds — `pluck_001.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/interface-sounds | CC0 1.0 | 2026-09-26 |
| `sfx_spawn.ogg` | Interface Sounds — `open_001.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/interface-sounds | CC0 1.0 | 2026-09-26 |
| `sfx_best_tile.ogg` | Music Jingles — `Pizzicato jingles/jingles_PIZZI00.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/music-jingles | CC0 1.0 | 2026-09-26 |
| `sfx_board_cleared.ogg` | Music Jingles — `Steel jingles/jingles_STEEL00.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/music-jingles | CC0 1.0 | 2026-09-26 |
| `sfx_out_of_moves.ogg` | Interface Sounds — `error_003.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/interface-sounds | CC0 1.0 | 2026-09-26 |
| `sfx_button.ogg` | Interface Sounds — `click_001.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/interface-sounds | CC0 1.0 | 2026-09-26 |
| `music_loop.ogg` | "Menu Music" (`awesomeness.wav`), trimmed to 24s and transcoded to `.ogg` | mrpoly | https://opengameart.org/content/menu-music | CC0 1.0 | 2026-09-26 |

## Pack-level license text (as distributed)

Kenney's Interface Sounds and Music Jingles pack pages both display, next
to the Download button:

```
Interface Sounds
License: Creative Commons CC0 (https://creativecommons.org/publicdomain/zero/1.0/)
This content is free to use in personal, educational and commercial
projects. Support us by crediting Kenney or www.kenney.nl (this is not
mandatory).
```

The bundled `License.txt` inside each pack's zip reads (verbatim, both
packs identical apart from the pack name):

```
License (Creative Commons Zero, CC0)
http://creativecommons.org/publicdomain/zero/1.0/

You may use these assets in personal and commercial projects.
Credit (Kenney or www.kenney.nl) would be nice but is not mandatory.
```

OpenGameArt.org's "Menu Music" submission page
(https://opengameart.org/content/menu-music) lists its license as **CC0**,
linking to http://creativecommons.org/publicdomain/zero/1.0/, with no
attribution requirement. This is the same track already used (in full,
unmodified length) as Ludo's `music_loop.ogg`
(`apps-native/games/ludo/assets/audio/LICENSES.md`); Merge Relay uses a
shorter, faded excerpt of the same CC0 source — reusing a CC0 asset across
two apps in this monorepo is licence-compliant.

## Why these files

- **Interface Sounds** (Kenney) supplies every discrete UI/gameplay cue:
  a short `drop` for a tile settling into its slid position, a plucked
  `pluck` chime for a merge (pitched up per tile tier by playback rate —
  see `lib/src/audio/merge_relay_audio.dart`), a soft `open` pop for a
  freshly spawned tile, an `error` tone for the "no lanes left" out-of-
  moves ending, and a plain `click` for generic button taps.
- **Music Jingles**' Pizzicato and Steel families are short, warm,
  acoustic-feeling stings that fit Merge Relay's Threes!-style hand-made
  palette better than the pack's 8-bit/Sax/Hit families: Pizzicato for the
  new-best-tile celebration, Steel (a bright steel-drum flourish) for
  "Path cleared" when a rescue is completed.
- No Kenney pack ships a long, ambient, loop-friendly background bed
  (their music packs are short stingers/jingles, not beds), so the single
  required music loop is sourced from OpenGameArt.org's CC0-licensed
  "Menu Music" track instead, the same source Ludo's audio task used for
  the same reason.
