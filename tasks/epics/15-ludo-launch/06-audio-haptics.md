---
epic: 15-ludo-launch
task: 06-audio-haptics
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/05-dice-and-effects]
estimate: M
---

# Add audio, haptics, and sound settings

## Goal

Add an audio service with SFX and a looping music track, CC0-licensed
source audio with a `LICENSES` manifest, `HapticFeedback` patterns for key
moments, and in-memory sound/music/vibration toggles that the pause dialog
and settings screen (tasks 09-10) will bind to.

## Context/Decisions

- Package choice: `audioplayers` or `flame_audio` — pick one, document the
  choice and why in a doc comment on the audio service, and add it to
  `pubspec.yaml` (this is the first task allowed to add an audio
  dependency, per task 03's note that it deferred this).
- Source CC0 audio from Kenney.nl (or another explicitly CC0-licensed pack)
  for: dice roll, token step, capture, home-arrival, win, button tap, turn
  alert, and one music loop. Do not use any asset whose license is unclear
  or non-CC0. Store audio files under `apps-native/games/ludo/assets/audio/`
  and add `apps-native/games/ludo/assets/audio/LICENSES.md` listing each
  file's source URL, author, and license (CC0) — matching the provenance
  discipline already used for the other five games' `assets/branding`
  material (check how they record asset provenance and follow the same
  format if one exists, e.g. `ludo_visual_provenance.json`-style records
  referenced in the Unity plan; if no such convention exists for Flutter
  games yet, a plain Markdown table is acceptable).
- Sourcing CC0 audio requires actually downloading files over the network
  (e.g. from Kenney.nl's CC0 packs). Every file placed under `assets/audio/`
  must have a corresponding `assets/audio/LICENSES.md` row citing its real
  source URL, author, and license. If network access to fetch real CC0 audio
  is unavailable in the execution environment, **do not synthesize
  placeholder audio files and label them CC0** and do not fabricate
  `LICENSES.md` entries for files that were not actually sourced from a real
  CC0 release — stop and report this task as blocked instead.
- Audio service (`lib/src/audio/ludo_audio_service.dart`): `playSfx(LudoSfx
  event)`, `startMusicLoop()`, `stopMusicLoop()`, each checking in-memory
  `soundEnabled`/`musicEnabled` toggles before playing anything, and safe to
  call repeatedly without leaking players/overlapping indefinitely (cap
  concurrent SFX instances).
- Haptics: `lib/src/audio/ludo_haptics.dart` wrapping Flutter's
  `HapticFeedback` (`lightImpact`/`mediumImpact`/`heavyImpact`/
  `selectionClick`) for dice roll, capture, home-arrival, win, and button
  tap, gated by a `vibrationEnabled` toggle, mirroring the SFX event set so
  the two stay in sync (one `LudoFeedbackEvent` enum driving both
  `playSfx` and haptics from a single call site is preferable to two
  parallel enums — implementer decides but must not let them drift).
- Settings state: `lib/src/state/ludo_sound_settings.dart` — a
  `ChangeNotifier`/state holder with `soundEnabled`, `musicEnabled`,
  `vibrationEnabled` booleans, defaulting to all `true`, with in-memory
  persistence only in this task (task 10's settings screen persists it to
  local storage — do not add `shared_preferences` here unless task 10
  explicitly needs this task to do so first; if adding it here is simpler,
  document the choice, but keep the scope of this task to the service and
  toggles' existence, not the settings UI).
- Wire the manifest slots from task 03 (`sfx_*`, `music_loop`) to this
  service's real implementations, replacing the silent no-op stubs.

## Implementation Checklist

- [ ] Add the chosen audio package to `pubspec.yaml`.
- [ ] Source and add CC0 audio files under `assets/audio/`, with
  `assets/audio/LICENSES.md` documenting provenance for every file.
- [ ] Register `assets/audio/` in `pubspec.yaml`'s `flutter.assets`.
- [ ] Create `lib/src/audio/ludo_audio_service.dart` implementing
  `playSfx`/`startMusicLoop`/`stopMusicLoop` gated by settings.
- [ ] Create `lib/src/audio/ludo_haptics.dart` and (if chosen) a unified
  `LudoFeedbackEvent` enum shared by both audio and haptics call sites.
- [ ] Create `lib/src/state/ludo_sound_settings.dart` with the three
  toggles.
- [ ] Wire `ludo_dice_component.dart`, `ludo_token_component.dart`,
  `ludo_capture_particles.dart`, `ludo_confetti.dart` (task 05) to call the
  audio/haptics service at the appropriate moments (dice roll start/land,
  token step, capture, home arrival, win).
- [ ] Update `lib/src/assets/ludo_art_manifest.dart` audio slots to resolve
  to the real service calls.
- [ ] Add `test/audio/ludo_audio_service_test.dart` and
  `ludo_sound_settings_test.dart` using a fake/mock player to assert:
  toggling `soundEnabled` off suppresses `playSfx` calls, toggling
  `musicEnabled` off stops/prevents the loop, concurrent SFX calls don't
  leak unbounded players.

## Files Touched

- `apps-native/games/ludo/pubspec.yaml`
- `apps-native/games/ludo/assets/audio/*` (new CC0 audio files)
- `apps-native/games/ludo/assets/audio/LICENSES.md`
- `apps-native/games/ludo/lib/src/audio/ludo_audio_service.dart`
- `apps-native/games/ludo/lib/src/audio/ludo_haptics.dart`
- `apps-native/games/ludo/lib/src/state/ludo_sound_settings.dart`
- `apps-native/games/ludo/lib/src/game/*.dart` (call sites, extended)
- `apps-native/games/ludo/lib/src/assets/ludo_art_manifest.dart`
- `apps-native/games/ludo/test/audio/*.dart`

## Acceptance Criteria

- Every audio file under `assets/audio/` has a corresponding entry in
  `LICENSES.md` naming its CC0 source.
- Disabling `soundEnabled`/`musicEnabled`/`vibrationEnabled` measurably
  suppresses the corresponding effect in tests (no real audio playback is
  required in CI — assert against the service's internal call log/mock).
- No SFX call leaks an unbounded number of concurrent player instances
  (bounded by a documented cap, tested).

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- The settings screen UI toggling these values (task 10).
- Persisting settings to disk across app restarts beyond what this task
  chooses to add for its own testability (full persistence is task 10's
  responsibility if not already covered here).
- Any paid/licensed audio asset.

## Commit message

`feat(ludo): add cc0 audio service, haptics, and sound toggles [15-ludo-launch/06]`
