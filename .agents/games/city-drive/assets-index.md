# Street Royale — assets and evidence index

## Research and planning

| What | Path |
|---|---|
| Epic plan, decisions, environment and disk policy | `tasks/epics/17-city-drive/STATUS.md` |
| Task files (00 to 22) | `tasks/epics/17-city-drive/` |
| Task 00 research (competitor table, sources) | `.agents/resources/2026-10-15/city-drive-qa/00/README.md` |
| Dated decisions with source URLs | `.agents/games/city-drive/decisions-log.md` |

## Per-task evidence (created as tasks run)

| What | Path | Status |
|---|---|---|
| QA reports, budget JSON, licence tables, research notes per task | `.agents/resources/2026-10-15/city-drive-qa/<task-id>/` (each with a `README.md`) | planned |
| Kenney City Kit and Car Kit licence table, budget report, model list | `.agents/resources/2026-10-15/city-drive-qa/04/` (`README.md`, `budget-report.json`) | done (task 04) |
| Per-pack licence records (URL, date, SHA-256, verbatim `License.txt`) | `apps-games/city-drive/assets-src/LICENSES/<pack>.txt` | done (task 04) |
| Name candidates and uniqueness evidence | `.agents/resources/2026-10-15/city-drive-qa/18/` | planned (task 18) |
| Icon dry run (six drafts, prompts) | `.agents/resources/2026-10-15/city-drive-qa/18/icons/` | done (task 18) |
| Final icon masters, adaptive pair, splash, source art and prompt log | `.agents/resources/2026-10-15/city-drive-art/icon/` | done (task 20) |
| Brand art builder and generated platform assets | `apps-games/city-drive/{scripts/build-brand-art.ts,scripts/brand-assets.ts,resources/,public/icons/,android/**/res/,ios/**/Assets.xcassets/}` | done (task 20) |
| Task 20 verification logs | `.agents/resources/2026-10-15/city-drive-qa/20/` | done (task 20) |

## Code and shipped assets

| What | Path | Task |
|---|---|---|
| App (Vite, Babylon, Preact, Capacitor) | `apps-games/city-drive` | 01 |
| Pure-TS simulation | `apps-games/city-drive-core` | 01, 03 |
| CC0 GLB models (42, uncompressed, 2.36 MB) | `apps-games/city-drive/public/assets/models/` | 04 |
| Model manifest (id, file, kind, triangles, bytes, bbox, pack, licence) | `apps-games/city-drive/public/assets/manifest.json` | 04 |
| Manifest types, id scheme and budgets | `apps-games/city-drive/src/assets/manifest.ts` | 04 |
| Asset build script (idempotent, `bun run --filter @city-drive/app build-assets`) | `apps-games/city-drive/scripts/build-assets.ts` | 04 |
| CC0 audio (13 MP3 files, 1.17 MB of the 3 MB budget) and its manifest | `apps-games/city-drive/public/assets/audio/` | 14 |
| Audio build script (ffmpeg, MP3 only, idempotent; `bun run --filter @city-drive/app build-audio`) and source catalogue | `apps-games/city-drive/scripts/build-audio.ts`, `scripts/audio/` | 14 |
| Audio licence records (URL, author, CC0, date, SHA-256 per download) | `apps-games/city-drive/assets-src/LICENSES/audio-*.txt` | 14 |
| Audio mixer, mapping, director; haptics; onboarding | `apps-games/city-drive/src/{audio,haptics}/`, `src/ui/onboarding/` | 14 |
| Task 14 evidence (licence table, budgets, decisions, verification) | `.agents/resources/2026-10-15/city-drive-qa/14/README.md` | 14 |

## Audio (task 14)

All files are MP3, mono unless noted, encoded by `scripts/build-audio.ts`. Every shipped file has a
licence record; none is procedural. The tyre skid is not shipped (no CC0 sample found).

| Sound id | File | Role | Source (licence record) |
|---|---|---|---|
| `engine_idle`, `engine_rev` | `engine_idle.mp3`, `engine_rev.mp3` | engine loop pair, crossfaded by revs and pitched together | OpenGameArt "racing car engine sound loops" by domasx2 (`audio-oga-racing-car-engine-loops`) |
| `collision_light`, `collision_medium`, `collision_heavy` | `collision_*.mp3` | thud, chosen and scaled by impact impulse | Kenney Impact Sounds (`audio-kenney-impact-sounds`) |
| `horn` | `horn.mp3` | HUD horn button | OpenGameArt "Car Sound Effects Pack (Low Quality)" by GGBotNet (`audio-oga-car-sound-effects-pack`) |
| `checkpoint`, `pickup`, `ui_tap` | `checkpoint.mp3`, `pickup.mp3`, `ui_tap.mp3` | mission checkpoint, pickup, button tap | Kenney Interface Sounds (`audio-kenney-interface-sounds`) |
| `success`, `fail` | `success.mp3`, `fail.mp3` | mission stings | Kenney Music Jingles (`audio-kenney-music-jingles`) |
| `music_menu` | `music_menu.mp3` | menu music loop (97 s) | OpenGameArt "Chill lofi inspired [loop edit]" by qubodup (`audio-oga-chill-lofi-loop`) |
| `music_drive` | `music_drive.mp3` | driving music loop (128 s), ducked during missions | OpenGameArt "Lofi Hip Hop Loop" by omfgdude (`audio-oga-lofi-hip-hop-loop`) |
| `skid` | not shipped | tyre noise from lateral slip | none found; see `open-questions.md` |

## Fonts (planned, task 13)

Russo One (display) and Saira (body), both OFL, bundled. Each family's
`OFL.txt` is committed beside the font files.
