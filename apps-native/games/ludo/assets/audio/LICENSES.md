# Ludo audio provenance

Every file in this directory is **CC0 1.0 Universal** (public domain
dedication — free to use, modify and redistribute without attribution,
though credit is appreciated). No paid or attribution-required asset is
used anywhere in this game, per task
`tasks/epics/15-ludo-launch/06-audio-haptics.md`.

Kenney `.ogg` source files are used unmodified. `music_loop.ogg` was
transcoded from the source pack's `.wav` to `.ogg` (Vorbis, `libvorbis`
`-q:a 4`) to reduce bundle size; CC0 permits derivative works freely, so
this is not a license concern.

| File | Source pack / track | Author | Source URL | License |
|---|---|---|---|---|
| `sfx_dice_roll.ogg` | Casino Audio — `dice-throw-1.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/casino-audio | CC0 1.0 |
| `sfx_token_step.ogg` | Interface Sounds — `select_001.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| `sfx_capture.ogg` | Interface Sounds — `glass_002.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| `sfx_home_arrival.ogg` | Interface Sounds — `confirmation_002.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| `sfx_win.ogg` | Music Jingles — `8-Bit jingles/jingles_NES00.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/music-jingles | CC0 1.0 |
| `sfx_button_tap.ogg` | Interface Sounds — `click_001.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| `sfx_turn_alert.ogg` | Interface Sounds — `bong_001.ogg` | Kenney (kenney.nl) | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| `music_loop.ogg` | "Menu Music" (`awesomeness.wav`), transcoded to `.ogg` | mrpoly | https://opengameart.org/content/menu-music | CC0 1.0 |

## Pack-level license text (as distributed)

Kenney packs each ship a `License.txt` reading (verbatim, Casino Audio /
Interface Sounds / Music Jingles all identical apart from the pack name):

```
License (Creative Commons Zero, CC0)
http://creativecommons.org/publicdomain/zero/1.0/

You may use these assets in personal and commercial projects.
Credit (Kenney or www.kenney.nl) would be nice but is not mandatory.
```

OpenGameArt.org's "Menu Music" submission page lists its license as CC0,
linking to http://creativecommons.org/publicdomain/zero/1.0/, with no
attribution requirement.

## Why these packs

- **Casino Audio** and **Interface Sounds** (Kenney) cover the SFX event
  set with sounds that already read as a tabletop/board-game UI: dice
  throw, a soft "select" click for a token's hop, a "glass" shatter-style
  hit for a capture, a "confirmation" chime for reaching home, a plain
  "click" for a generic button tap, and a "bong" bell for a turn alert.
- **Music Jingles**' `jingles_NES00.ogg` (an 8-bit ascending fanfare) is
  used as the one-shot win stinger rather than the album's `music_loop`
  slot — a short fanfare is what actually happens at a *win* — see
  `sfx_win.ogg` in the table above.
- No Kenney pack ships a long, ambient, loop-friendly background music
  track (their music packs are short stingers/jingles, not beds), so the
  single required music loop (`music_loop.ogg`) is sourced from
  OpenGameArt.org's CC0-licensed "Menu Music" track instead — the same
  network-sourcing requirement and CC0-only rule from this task's
  Context/Decisions applies to it as much as to the Kenney files above.
