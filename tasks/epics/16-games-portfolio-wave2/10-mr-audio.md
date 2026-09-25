---
epic: 16-games-portfolio-wave2
task: 10-mr-audio
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/09-mr-motion-and-haptics]
estimate: M
owner: agent
---

# Merge Relay: CC0 sound effects and a music loop

## Goal

Give Merge Relay a real soundscape (Threes! is famous for its sound):
slide, merge (pitch rising with tier), spawn, best tile, board cleared,
out of moves, button, and one calm music loop. Sound and music toggles
must actually work.

## Context / Decisions

- Licence rule (skill reference `08-art-audio-pipeline.md`): **CC0 only,
  downloaded from the source.** Never synthesize audio and label it CC0.
  Preferred source: Kenney packs (`https://kenney.nl/assets`, e.g.
  "Interface Sounds", "Digital Audio", "Music Jingles"). For the music loop,
  a CC0 track from Kenney or OpenGameArt that is **explicitly marked CC0 on
  its page**. If no CC0 file can be downloaded, the task is **blocked**.
- Pattern to copy (read only; Ludo is frozen):
  `apps-native/games/ludo/assets/audio/LICENSES.md` and Ludo's use of
  `audioplayers` (see `apps-native/games/ludo/pubspec.yaml`,
  `lib/src/audio/`).
- The merge pitch rises with tier: either several source files or
  playback-rate variation (0.9–1.3), capped so nothing sounds shrill.
- The existing Sound toggle (`merge_relay_overlays.dart`,
  `merge_relay_game_preferences.dart`) currently controls nothing. Wire it
  to SFX, and add a separate Music toggle. Both persist.
- Audio must never block or crash gameplay: missing file, audio focus lost,
  and background→foreground are all handled. Pause music on app pause and
  resume it after.
- Size budget: all audio under 1.5 MB total (OGG, mono for SFX).

## Implementation Checklist

- [ ] Download and trim SFX and the music loop. Convert them to OGG using
      `ffmpeg` if it's available, otherwise install it under `/data/tools`.
- [ ] Add `assets/audio/*.ogg` and `assets/audio/LICENSES.md`
      (file → pack/page URL → licence → date).
- [ ] Add `lib/src/audio/merge_relay_audio.dart` (an interface plus the
      `audioplayers` implementation and a fake for tests), wired to the
      move-trace events from task 09.
- [ ] Add Sound and Music toggles and persistence, plus a lifecycle
      pause/resume.
- [ ] Add tests using the fake audio: correct cue per event, rising merge
      pitch per tier, toggles mute the right channel, lifecycle
      pause/resume, and a failing player doesn't throw.
- [ ] Put `LICENSES.md` and a cue table in `.agents/resources/2026-09-25/games-wave2-qa/10/README.md`.

## Files Touched

- `apps-native/games/merge_relay/{pubspec.yaml,assets/audio/**,lib/src/audio/**,lib/src/merge_relay_overlays.dart,lib/src/merge_relay_game_preferences.dart,test/**}`

## Acceptance Criteria

- Every audio file has a CC0 source URL in `LICENSES.md`; the verifier opens
  ≥2 of the URLs and confirms the CC0 text.
- The audio tests pass, the total audio size is ≤ 1.5 MB, and the test count
  is ≥ task 09's.
- The Settings golden shows both toggles.

## Verification Commands

- `du -ch apps-native/games/merge_relay/assets/audio/*.ogg | tail -1`
- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`
- Device listening check: NOT RUN (human task 25).

## Out of Scope

- Voice-over and dynamic music layers.

## Commit message

`feat(merge-relay): add CC0 sound effects, music loop, and working audio toggles [16-games-portfolio-wave2/10]`
