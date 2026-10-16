# Task 14 evidence: audio, haptics and first-drive onboarding

No browser, screenshot, device or emulator was used, and nothing was listened to. Everything below is
logic and structure checked with Vitest (a recording fake `AudioContext`, a mocked Capacitor plugin,
happy-dom for the components, the real Rapier session for the step report). How the sounds *sound*, how
the tutorial *feels* and where its panels sit on a phone are owner judgements for task 16.

## Verification results (2026-10-16)

| Command | Result |
|---|---|
| `bun run city-drive:test` | pass: core 52 files / 479 tests, app 53 files / 497 tests |
| `bun run city-drive:typecheck` | pass (core and app) |
| `bun run city-drive:build` | pass (Vite build; the 500 kB chunk warning is the existing Babylon bundle) |
| `bun run check:ci` (Biome) | pass, 716 files |
| `bun run check:max-lines` | pass |
| `bun run --filter @city-drive/app build-audio` (no `--raw`) | pass: verifies 13 sounds, 1,174,351 bytes, licence records |
| Vite dev server probe (curl, then stopped) | `/assets/audio/manifest.json` 200 `application/json`; `music_drive.mp3` 200 `audio/mpeg` 639,941 bytes; `engine_idle.mp3` 200 |
| `bun run knip:ci` | exit 1 from existing findings only (Ludo, Merge Relay, workflow files, core `WheelCommand`); none from task 14 after removing six unused exports of mine |

Device haptics, real audio output and the iOS/Android WebView audio unlock are NOT RUN (no device).

## Audio sources and licences

Every source page was read on 2026-10-16. Licence records (URL, author, CC0, date, SHA-256 of every
download) are `apps-games/city-drive/assets-src/LICENSES/audio-*.txt`. Kenney records embed the pack's
`License.txt` verbatim (it states CC0). OpenGameArt downloads carry no licence file, so the record names
the page whose "License(s)" field reads CC0. Downloads were extracted into `/data/tools/tmp/14` (outside
the repo, treated as untrusted data, only decoded by ffmpeg) and the scratch folder was deleted afterwards.

| Licence record | Source page | Author | Download SHA-256 |
|---|---|---|---|
| `audio-kenney-impact-sounds` | https://kenney.nl/assets/impact-sounds | Kenney | `029d734a...5de77f8` (zip) |
| `audio-kenney-interface-sounds` | https://kenney.nl/assets/interface-sounds | Kenney | `f2193d07...c81232` (zip) |
| `audio-kenney-music-jingles` | https://kenney.nl/assets/music-jingles | Kenney | `b729ba57...c77197b8` (zip) |
| `audio-oga-racing-car-engine-loops` | https://opengameart.org/content/racing-car-engine-sound-loops | domasx2 | 2 files, see record |
| `audio-oga-car-sound-effects-pack` | https://opengameart.org/content/car-sound-effects-pack-low-quality | GGBotNet | `8c9b3e37...d887` (zip) |
| `audio-oga-lofi-hip-hop-loop` | https://opengameart.org/content/lofi-hip-hop-loop | omfgdude | see record |
| `audio-oga-chill-lofi-loop` | https://opengameart.org/content/chill-lofi-inspired-loop-edit | qubodup (loop edit) | see record |

Full hashes are in the records. No Quaternius, no CC-BY, nothing synthesized or generated, nothing
procedural.

## Shipped files (13 MP3, 1,174,351 bytes of the 3,000,000 byte budget)

| Sound | File | Kind | Bytes | Seconds | Source file |
|---|---|---|---:|---:|---|
| engine_idle | `engine_idle.mp3` | loop | 7,542 | 0.864 | loop_0.wav |
| engine_rev | `engine_rev.mp3` | loop | 5,661 | 0.631 | loop_4_0.wav |
| collision_light | `collision_light.mp3` | sfx | 3,571 | 0.373 | impactMetal_light_000 |
| collision_medium | `collision_medium.mp3` | sfx | 2,735 | 0.269 | impactMetal_medium_000 |
| collision_heavy | `collision_heavy.mp3` | sfx | 1,899 | 0.165 | impactMetal_heavy_000 |
| horn | `horn.mp3` | sfx | 4,407 | 0.481 | Car_Horn.ogg |
| checkpoint | `checkpoint.mp3` | sfx | 4,825 | 0.539 | confirmation_002 |
| pickup | `pickup.mp3` | sfx | 1,272 | 0.100 | pluck_001 |
| ui_tap | `ui_tap.mp3` | sfx | 1,272 | 0.097 | click_001 |
| success | `success.mp3` | sting | 7,124 | 0.825 | jingles_STEEL11 |
| fail | `fail.mp3` | sting | 7,542 | 0.881 | jingles_PIZZI13 |
| music_menu | `music_menu.mp3` | music | 486,560 | 97.216 | chilllofir-loop.ogg |
| music_drive | `music_drive.mp3` | music | 639,941 | 127.887 | LofiLoop_2.ogg |

Encoding (dry-run amendment: MP3 only, ffmpeg libmp3lame): effects 64 kbps mono 44.1 kHz, music 40 kbps
mono (menu 32 kHz, drive 22.05 kHz, the drive loop's native rate). `build-audio.ts` uses bit-exact flags
and no metadata: a second run over the same inputs rewrote identical files (checked by SHA-256).
`audio-manifest` and budget checks are tests (`test/audio/assets.test.ts`), not only a script.

## Not shipped (recorded, does not block)

- **Tyre skid**: no CC0 sample found (searched kenney.nl audio and OpenGameArt for skid, screech, squeal,
  tire, brake, drift). The slip mapping and a skid voice are implemented and tested with a fake sample.
  Open question 9.
- Nothing is procedural: the engine and horn have CC0 samples, so the procedural exception is unused.

## Decisions

- **Plain Web Audio, not Babylon `AudioV2`.** Measured with `bun build --minify`: the app's audio code
  is 6.68 KB (2.7 KB gzip); importing only `CreateAudioEngineAsync` and `CreateSoundAsync` from
  `@babylonjs/core/AudioV2` is 170.5 KB (41.9 KB gzip). The game needs buses, one-shots, four loops and
  gain ramps, which Web Audio does directly.
- **Settings.** The save has one `settings.audio` flag, shown as "Sound". It drives the master bus. The
  mixer also has independent effects and music toggles (tested) for when the save grows them; changing the
  save schema is outside this task (open question 11). `settings.haptics` ("Vibration") gates haptics.
- **Slip.** The core `CarState` has velocity and rotation but no slip field. `lateralSlipMps` in
  `src/game/stepReport.ts` derives it (velocity along the car's right axis) from the existing state, so
  `city-drive-core` is untouched and determinism tests are unaffected. A real-physics test shows a
  handbrake turn at speed reaches about 5 m/s of slip against the 2.5 m/s skid threshold.
- **Step report.** `GameSession.lastReport` (input, speed, slip, hardest hit on the player's collider)
  is written once per fixed step, read-only, and handed out by `GameHost.onStep`. It feeds both the sound
  director and the tutorial's input detectors, so detection runs at the fixed step and never from frame
  timing.
- **MP3 loops.** MP3 can leave a faint gap at a loop seam; the engine loops are 0.6 to 0.9 s, so this is
  the first thing to listen for (open question 10).
- **Tutorial rules.** Runs only for a save with no mission records and no `first_drive_done` flag; a
  returning player is marked done silently. The briefing tip appears only once the first mission's briefing
  is open; declining the briefing or abandoning the mission ends the tutorial quietly (no results flag).
  Resetting progress stops it and clears the flags, so a reset player gets it again.

## Checklist mapping

| Item | Where |
|---|---|
| Source, licence, convert, encode with a script | `scripts/build-audio.ts`, `scripts/audio/*`, `LICENSES/audio-*.txt`, `public/assets/audio/` |
| Audio manager (mixer, ducking, settings) + mocked AudioContext tests | `src/audio/{manager,mixer,voices,webaudio,unlock,uiTaps,director,events}.ts`, `test/audio/*` |
| Engine and skid mapping as pure functions, tested | `src/audio/mapping.ts`, `src/game/stepReport.ts`, `test/audio/mapping.test.ts`, `test/game/stepReport.test.ts` |
| Haptics service + tests (mocked plugin, web fallback) | `src/haptics/*`, `test/haptics/haptics.test.ts` |
| Onboarding flow, detectors, flags, skip and replay + tests | `src/ui/onboarding/*`, controller hooks, Settings "How to play", `test/ui/onboarding*.test.ts*` |
| `assets-index.md` audio table | `.agents/games/city-drive/assets-index.md` |

The acceptance flow "onboarding completes, mission starts, flags persist" is
`test/ui/onboarding.test.ts` "onboarding completes, the mission starts, and the flags persist across a
reload": it feeds sustained input through the controller, checks that `mission.open("d1-m01", false)` is
called, walks briefing, active and success, dismisses, then reloads the save from the same store and
finds all four flags true.

## Files touched beyond the task's list (small, necessary)

- `apps-games/city-drive/src/{main.ts,game/session.ts,game/gameHost.ts,game/stepReport.ts,save/profile.ts}`:
  wiring and the step report.
- `src/ui/{controller.ts,App.tsx,mount.tsx,hud.css,screens/Hud.tsx,screens/Settings.tsx,components/Icons.tsx,controls/TouchControls.tsx}`:
  overlay, horn button, "Replay tutorial", `data-no-tap` on the held controls.
- `test/ui/fakes.ts` (`makeApp` can build the tutorial), `test/game/host.test.ts` (one test).
- `apps-games/city-drive/{README.md,assets-src/README.md}`, `.agents/games/city-drive/{product.md,open-questions.md}`.
- `@capacitor/haptics` pinned exactly at 8.0.2 (latest 8.x, released 2026-03-27); `bun.lock` updated.
