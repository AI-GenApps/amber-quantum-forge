# City Drive — assets and evidence index

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
| Kenney City Kit and Car Kit licence records (URL, date, SHA-256) | `.agents/resources/2026-10-15/city-drive-qa/04/` | planned (task 04) |
| Name candidates and uniqueness evidence | `.agents/resources/2026-10-15/city-drive-qa/18/` | planned (task 18) |
| Icon dry run and art masters | `.agents/resources/2026-10-15/city-drive-art/<set>/` | planned (tasks 18, 20) |

## Code and shipped assets (planned)

| What | Path | Task |
|---|---|---|
| App (Vite, Babylon, Preact, Capacitor) | `apps-games/city-drive` | 01 |
| Pure-TS simulation | `apps-games/city-drive-core` | 01, 03 |
| CC0 GLB models | `apps-games/city-drive/public/` (with licence records) | 04 |
| CC0 audio | `apps-games/city-drive/public/` (with licence records) | 14 |

## Fonts (planned, task 13)

Russo One (display) and Saira (body), both OFL, bundled. Each family's
`OFL.txt` is committed beside the font files.
