# Task 10 — Merge Relay: CC0 audio + music

Evidence for `tasks/epics/16-games-portfolio-wave2/10-mr-audio.md`.

## What shipped

- `apps-native/games/merge_relay/assets/audio/*.ogg` — 7 SFX cues + 1 music
  loop, all CC0, mono, converted with `ffmpeg`/`libvorbis`. Total size
  **276 KB** (`du -ch assets/audio/*.ogg`), well under the 1.5 MB budget.
- `apps-native/games/merge_relay/assets/audio/LICENSES.md` — full
  provenance table (copied below).
- `lib/src/audio/merge_relay_audio.dart` + `merge_relay_audio_service.dart`
  — the `MergeRelayAudioPlayer` interface, the real `audioplayers`-backed
  implementation (every call wrapped so a missing file/lost focus/unmocked
  platform channel can never throw), and `MergeRelayAudioService`, gated by
  the game's existing `MergeRelayPreferences` (`audioEnabled` for SFX,
  new `musicEnabled` for music).
- Wired into the move-trace/lifecycle events from task 09
  (`merge_relay_game_actions.dart`, `merge_relay_lifecycle.dart`,
  `merge_relay_game_persistence.dart`): slide on every move, a
  tier-pitched merge chime, spawn, best-tile, "Path cleared" → board
  cleared, terminal → out-of-moves, and a button click on every
  `hapticSelect()` call site (Settings toggles, accessible controls).
  Music starts once the save restores and pauses/resumes across
  `AppLifecycleState` background/foreground transitions.
- A new **Music** toggle next to the existing **Sound** toggle in Settings
  (`merge_relay_overlays.dart`), both persisted
  (`merge_relay_save_state.dart`, `merge_relay_game_restore_parsing.dart`).
- `test/audio/merge_relay_audio_test.dart` — 20 tests against a fake
  player: per-event asset cue, rising merge pitch per tier (capped at
  1.3x), the Sound/Music toggles gating the right channel independently,
  lifecycle pause/resume, and a failing player never throwing.
- `test/support/fake_audioplayers_platform.dart` +
  `test/flutter_test_config.dart` — installs a no-op `audioplayers`
  federated-plugin platform (`AudioplayersPlatformInterface.instance` /
  `GlobalAudioplayersPlatformInterface.instance`) for every test, so the
  real, un-injected audio player wired into every `MergeRelayGame` never
  touches a real platform channel under `flutter test` — see that file's
  doc comment for why a try/catch around the direct `audioplayers` calls
  alone wasn't enough (the per-player `EventChannel` subscription an
  `AudioPlayer()` sets up on construction throws outside the awaited
  `Future` chain).

## Cue table

| Event | Asset | Trigger |
|---|---|---|
| Slide | `sfx_slide.ogg` | Every legal move (`MergeRelayGameActions.move`) |
| Merge | `sfx_merge.ogg` (pitch rises with tier, 0.9x–1.3x) | `movePresentation.hasMerge` |
| Spawn | `sfx_spawn.ogg` | `movePresentation.spawnedCell != null` |
| Best tile | `sfx_best_tile.ogg` | `isNewBestTile` |
| Board cleared | `sfx_board_cleared.ogg` | `MergeRelayOutcome.completed` ("Path cleared.") |
| Out of moves | `sfx_out_of_moves.ogg` | `MergeRelayOutcome.terminal` |
| Button | `sfx_button.ogg` | Every `game.hapticSelect()` call |
| Music loop | `music_loop.ogg` (24s, faded loop point) | Starts once hydrated; pauses/resumes with app lifecycle; stoppable via the Music toggle |

## Licence provenance (copied from `assets/audio/LICENSES.md`)

| File | Source pack / file | Author | Source URL | License |
|---|---|---|---|---|
| `sfx_slide.ogg` | Interface Sounds — `drop_001.ogg` | Kenney | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| `sfx_merge.ogg` | Interface Sounds — `pluck_001.ogg` | Kenney | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| `sfx_spawn.ogg` | Interface Sounds — `open_001.ogg` | Kenney | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| `sfx_best_tile.ogg` | Music Jingles — `Pizzicato jingles/jingles_PIZZI00.ogg` | Kenney | https://kenney.nl/assets/music-jingles | CC0 1.0 |
| `sfx_board_cleared.ogg` | Music Jingles — `Steel jingles/jingles_STEEL00.ogg` | Kenney | https://kenney.nl/assets/music-jingles | CC0 1.0 |
| `sfx_out_of_moves.ogg` | Interface Sounds — `error_003.ogg` | Kenney | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| `sfx_button.ogg` | Interface Sounds — `click_001.ogg` | Kenney | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| `music_loop.ogg` | "Menu Music" (`awesomeness.wav`), trimmed to 24s | mrpoly | https://opengameart.org/content/menu-music | CC0 1.0 |

Both `kenney.nl/assets/interface-sounds` and `kenney.nl/assets/music-jingles`
display "License: Creative Commons CC0" text directly on the page next to
the download button, and each pack's bundled `License.txt` repeats the CC0
grant verbatim. `opengameart.org/content/menu-music` lists its license as
**CC0**, linking to the CC0 1.0 deed. A verifier can open all three URLs
directly to confirm.

## Verification

- `du -ch apps-native/games/merge_relay/assets/audio/*.ogg | tail -1` → **276K total** (budget 1.5 MB).
- `bun run games:format:check` → pass.
- `bun run games:analyze -- --app merge_relay` → pass, no issues.
- `bun run games:test -- --app merge_relay` → pass, **215 tests** (task 09's
  baseline was 195; +20 for `merge_relay_audio_test.dart`).
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug` → pass, `app-debug.apk` built.
- Device listening check: **NOT RUN** (human task 25 — no physical device
  on this server).

## Screen evidence

`settings-golden.png` in this folder is a copy of
`apps-native/games/merge_relay/test/goldens/screens/settings.png`
(regenerated by `test/goldens/screens_test.dart`'s existing "settings sheet
renders with the design system" golden test), showing the new **Music**
toggle rendered directly under **Sound** with the same design-system
switch styling, real bundled fonts, no overflow/clipping/tofu.
