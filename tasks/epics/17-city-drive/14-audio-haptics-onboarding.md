---
epic: 17-city-drive
task: 14-audio-haptics-onboarding
status: completed
commit_scope: city-drive
depends_on: [17-city-drive/13-ui-screens-and-hud]
estimate: M
owner: agent
---

# Audio, haptics, first-drive onboarding

## Goal

Add game feel and a first-time-user experience: an engine sound that follows
RPM, collision and UI sounds, music, haptics on key events, and a guided first
mission that teaches the controls.

## Context / Decisions

- **Audio:** **CC0 only.** Download from source pages that state CC0:
  - Kenney audio packs (kenney.nl: "Impact Sounds", "Interface Sounds", and
    any engine or vehicle pack if present)
  - OpenGameArt or freesound, filtered to CC0, with the per-file licence shown

  Record a licence file per source in
  `apps-games/city-drive/assets-src/LICENSES/audio-*.txt` (URL, author,
  licence, date, SHA-256). **Never synthesize audio and label it CC0.** If no
  CC0 engine loop is found, procedurally generating the engine with
  WebAudio oscillators is allowed. Label it "procedural (no licence needed)".
- **Sound set:**
  - engine loop (pitch and gain mapped from speed and throttle; crossfade
    idle and rev if 2 loops exist)
  - tyre skid (gain from lateral slip; core exposes the slip value)
  - collision thud (gain from impulse)
  - horn (a button on the HUD)
  - checkpoint and pickup
  - mission success and fail stings
  - UI tap
  - one music loop for menus and one for driving (CC0), ducked during missions
- **Engine:** use Babylon's audio engine (v2 `CreateAudioEngineAsync`, deep
  import) or plain WebAudio. Pick the smaller bundle and record why.
  - Encode audio as `.ogg` plus `.m4a` (iOS) or `.mp3` only. Keep the total
    audio at most 3 MB.
  - Unlock audio on the first user gesture.
  - Respect the settings toggles: SFX, music, and master.
- **Haptics:** `@capacitor/haptics` (exact pin), behind an interface with a
  web no-op (or `navigator.vibrate` where supported). Events:
  - collision: medium impact
  - checkpoint and pickup: light
  - mission success: notification success
  - fail: notification error

  Respect the haptics setting.
- **Onboarding** (first launch only, from the save flag in task 12):
  1. A 3-step overlay on free roam: "Hold gas", "Steer", "Brake/handbrake".
     Each step completes when the core sees that input sustained (pure
     detector, tested).
  2. It then auto-starts mission `d1-m01` with a briefing tooltip explaining
     markers, the route ribbon, and stars.
  3. Results explain coins and the garage.

  Skippable. A "How to play" entry in settings replays it.

## Implementation Checklist

- [x] Source and licence the audio, then convert and encode with a script.
- [x] Audio manager (mixer, ducking, settings) plus tests with a mocked
      AudioContext.
- [x] Engine and skid parameter mapping as pure functions, tested.
- [x] Haptics service plus tests (mocked plugin; the web fallback).
- [x] Onboarding flow, input detectors, persistence flags, and skip and
      replay, with tests.
- [x] Update `.agents/games/city-drive/assets-index.md` with the audio table.

## Files Touched

- `apps-games/city-drive/{src/audio/**,src/haptics/**,src/ui/onboarding/**,public/assets/audio/**,assets-src/LICENSES/audio-*,scripts/build-audio.ts,package.json,test/**}`, `bun.lock`
- `.agents/games/city-drive/assets-index.md`

## Acceptance Criteria

- Every audio file has a licence record or is marked procedural.
- Total audio is at most 3 MB.
- The tests pass, including the onboarding completes → mission starts →
  flags persist flow.

## Out of Scope

- Voice-over, dynamic music layers.

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:typecheck`
- `bun run city-drive:build`

## Commit message

`feat(city-drive): add audio, haptics and first-drive onboarding [17-city-drive/14]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **Encoding:** use `ffmpeg` (`/home/linuxbrew/.linuxbrew/bin/ffmpeg`) and encode **MP3 only** (simplest cross-platform format).
- **Missing sounds:** if no CC0 music loop, horn, or skid sample is found, ship without it, record it in `open-questions.md`, and **do not block**. The procedural WebAudio exception covers the engine and may cover the horn; label these "procedural", never "generated" or "CC0".
- **Files Touched:** add `.agents/resources/2026-10-15/city-drive-qa/14/README.md`.
