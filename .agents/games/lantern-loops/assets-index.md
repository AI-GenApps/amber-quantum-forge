# Lantern Loops — assets and evidence index

## Code and planning

| What | Path | Task |
|---|---|---|
| Epic plan, decisions, scope fence | `tasks/epics/19-web-lantern-loops/STATUS.md` | 00 |
| Task files 01 to 08 | `tasks/epics/19-web-lantern-loops/` | 00 |
| App (Preact, Vite, Capacitor) | `apps-games/lantern-loops` (`@web-games/lantern-loops`) | skeleton, 03 to 07 |
| Headless rules, solver, generator, content data | `apps-games/lantern-loops-core` (`@web-games/lantern-loops-core`) | 01, 02 |
| Shared kit | `apps-games/web-kit` (`@web-games/kit`), docs `.agents/games/web-games-kit/` | epic 18 |
| Evidence root | `.agents/resources/2026-10-23/web-games/lantern-loops/` | all |
| Owner browser QA checklist | `.agents/resources/2026-10-23/web-games/lantern-loops/qa-checklist.md` | 08 (planned) |

## Fonts (OFL, bundled woff2 with `OFL.txt`, task 04)

| Role | Family | Source | Target path | Licence |
|---|---|---|---|---|
| Display (title, numerals, headings) | Fraunces (variable) | github.com/google/fonts, `ofl/fraunces` | `apps-games/lantern-loops/public/fonts/` | SIL OFL 1.1 |
| Body (UI, labels) | Nunito (variable) | github.com/google/fonts, `ofl/nunito` | `apps-games/lantern-loops/public/fonts/` | SIL OFL 1.1 |

Each woff2 is a Latin subset (Basic Latin, Latin-1, general punctuation, the star glyph the UI
uses). Provenance (source URL, commit, file hash, subset command) is recorded here when task 04
runs. Status: planned.

## Art slots (15) requested from the MobileGamesDesigner thread

Image format: WebP at 2x the css display size. Masters: WebP q90 under
`.agents/resources/2026-10-23/web-games/lantern-loops/art/masters/`. Every slot has a code-drawn
fallback so the game is complete without it. Budget: all shipped art <= 8 MB (test in task 06).

| Batch | Slot id | Shape | Display size (css) | Shipped size (px) | Use | Fallback | Status |
|---|---|---|---|---|---|---|---|
| B1 | `icon` | square, opaque, single lantern motif, legible at 48 px | launcher | 1024x1024 master | App icon via @capacitor/assets (task 07) | code-drawn lantern on indigo | planned |
| B1 | `key-art` | portrait 2:3, title-safe empty band in the upper third | full screen | 800x1200 | Home, Boot, splash source | layered paper-cut SVG dusk scene | planned |
| B1 | `lantern-amber` | square, transparent | 56 | 112x112 | Lists, chapter cards, win sheet | SVG lantern | planned |
| B1 | `backdrop-harbor` | portrait 2:3, calm low-detail centre for the board | full screen | 800x1200 | Harbor puzzles and list | indigo gradient + SVG water and boat silhouettes | planned |
| B2 | `lantern-rose` | square, transparent, same silhouette as amber | 56 | 112x112 | Sky legend, how-to, share | SVG lantern | planned |
| B2 | `lantern-jade` | same | 56 | 112x112 | same | SVG lantern | planned |
| B2 | `lantern-azure` | same | 56 | 112x112 | same | SVG lantern | planned |
| B2 | `lantern-violet` | same | 56 | 112x112 | same | SVG lantern | planned |
| B2 | `lantern-unlit` | same | 56 | 112x112 | Locked puzzles, unlit lantern in lists | SVG lantern, grey | planned |
| B2 | `backdrop-garden` | portrait 2:3, same rules as harbor | full screen | 800x1200 | Garden | gradient + SVG blossoms and walls | planned |
| B2 | `backdrop-bridge` | portrait 2:3 | full screen | 800x1200 | Bridge | gradient + SVG arches and reflections | planned |
| B2 | `backdrop-sky` | portrait 2:3 | full screen | 800x1200 | Sky | gradient + SVG clouds and drifting lanterns | planned |
| B2 | `daily-medallion` | square, transparent | 120 | 240x240 | Daily screen, streak milestones | SVG medallion ring | planned |
| B2 | `empty-archive` | square, transparent spot illustration | 160 | 320x320 | Archive "Completed" empty state | SVG lantern outline | planned |
| B2 | `feature-graphic` | landscape 3:2, no text | store only (not bundled) | 1500x1000 master | Store feature graphic after crop | none (store asset) | planned |

Art rules: layered cut-paper shapes with subtle paper-fibre texture, warm amber/rose glow on deep
indigo and teal, soft rim light, depth through layered paper shadows. No text, no logos, no faces,
no AI artefacts (warped lines, garbled glyphs) in anything shipped. The board itself (tiles, loops,
glow) is always drawn by code in the same palette.

### Art provenance (filled by task 06)

| Slot | Inbox file | Reviewed | Accepted | SHA-256 (master) | Notes |
|---|---|---|---|---|---|
| (none yet) | | | | | |

## Audio (CC0 only, task 05)

Candidate sources, to be confirmed and downloaded in task 05 with URL, pack, licence text and
SHA-256 recorded per file: Kenney "Interface Sounds", "UI Audio", "Impact Sounds" and "Music
Jingles" (kenney.nl/assets, Creative Commons CC0). The optional `calm-loop` music must come from a
CC0 source that states its licence on the page; if none fits, v1 ships without music, the Music
toggle stays but plays nothing, and the decision is logged. Event ids: `content-plan.md` section 10.

| Event id | File | Pack / source URL | Licence | Status |
|---|---|---|---|---|
| (filled by task 05) | | | | planned |

## Evidence planned

| What | Path | Task |
|---|---|---|
| Uniqueness proof report for all 120 puzzles | `.agents/resources/2026-10-23/web-games/lantern-loops/02/campaign-report.json` | 02 |
| Daily 365-date generation report | `.agents/resources/2026-10-23/web-games/lantern-loops/03/daily-report.json` | 03 |
| Font and audio provenance | `.agents/resources/2026-10-23/web-games/lantern-loops/04/`, `05/` | 04, 05 |
| Art review log and masters | `.agents/resources/2026-10-23/web-games/lantern-loops/art/` | 06 |
| Capacitor sync log | `.agents/resources/2026-10-23/web-games/lantern-loops/07/` | 07 |
| Bundle and art budget report, no-data audit, QA checklist | `.agents/resources/2026-10-23/web-games/lantern-loops/08/`, `qa-checklist.md` | 08 |
