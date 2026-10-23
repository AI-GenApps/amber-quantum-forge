# Floodplain Dispatch - assets index

Status after task 04: the three fonts are bundled (below). No designer art and no audio are delivered
yet. Task 06 fills the art provenance columns and flips entries in `src/art/manifest.ts`; task 05 adds
audio. Every one of the 20 art slots already has a code-drawn fallback (`src/art/fallbacks.ts`), so
the game is complete without art.

## Where things live

| What | Where |
|---|---|
| App code | `apps-games/floodplain-dispatch/` |
| Rules and content | `apps-games/floodplain-dispatch-core/` |
| Runtime art (WebP, 2x display size) | `apps-games/floodplain-dispatch/public/art/` |
| Art masters (WebP q90) | `.agents/resources/2026-10-23/web-games/floodplain-dispatch/art/masters/` |
| Fonts (woff2 + `OFL.txt`) | `apps-games/floodplain-dispatch/public/fonts/` |
| Audio (ogg + licence records) | `apps-games/floodplain-dispatch/public/audio/` and `.../public/audio/LICENSES.md` |
| Designer inbox (read-only input) | `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/` |
| Evidence and QA checklist | `.agents/resources/2026-10-23/web-games/floodplain-dispatch/` |

## Art style (summary of the brief)

Hand-painted top-down diorama in gouache texture: muted greens and ochres, clean readable blue
water, soft consistent top-left light, short shadows, toy-like charm without cuteness overload.
Terrain, water flow and canals are drawn by code (Canvas 2D) in the same palette; generated art is
standalone objects and backdrops only. Objects: strict top-down 3/4 view (camera about 60 degrees),
top-left light, contact shadow falling down-right, object filling about 80 percent of the square,
transparent background for sprites. No text in any image. Palette tokens: `product.md`.

## Art slots (20)

| Batch | Slot | Format | Master | Runtime size (2x display) | Used for | Fallback |
|---|---|---|---|---|---|---|
| B1 | `icon` | square, opaque | 1024 x 1024 | not in bundle (icons via @capacitor/assets) | App icon, splash | code-drawn roof-and-wave badge |
| B1 | `key-art` | portrait 2:3, title-safe band | 1600 x 2400 | 800 x 1200 | Title screen | gradient backdrop with code-drawn river |
| B1 | `house-cottage` | square, transparent | 768 x 768 | 192 x 192 | House kind | code-drawn cottage |
| B1 | `pump` | square, transparent | 768 x 768 | 192 x 192 | Pump piece | code-drawn pump |
| B2 | `house-townhouse` | square, transparent | 768 x 768 | 192 x 192 | House kind | code-drawn |
| B2 | `house-mill` | square, transparent | 768 x 768 | 192 x 192 | House kind | code-drawn |
| B2 | `house-barn` | square, transparent | 768 x 768 | 192 x 192 | House kind | code-drawn |
| B2 | `house-school` | square, transparent | 768 x 768 | 192 x 192 | House kind | code-drawn |
| B2 | `reservoir` | square, transparent | 768 x 768 | 192 x 192 | Reservoir piece | code-drawn tank |
| B2 | `sluice-gate` | square, transparent | 768 x 768 | 192 x 192 | Gate piece | code-drawn gate |
| B2 | `sandbag-barrier` | square, transparent | 768 x 768 | 192 x 192 | Barrier piece | code-drawn sandbags |
| B2 | `windmill` | square, transparent | 768 x 768 | 192 x 192 | Scenery (Delta, Estuary) | code-drawn |
| B2 | `tree-oak` | square, transparent | 768 x 768 | 192 x 192 | Scenery | code-drawn |
| B2 | `tree-poplar` | square, transparent | 768 x 768 | 192 x 192 | Scenery | code-drawn |
| B2 | `tree-willow` | square, transparent | 768 x 768 | 192 x 192 | Scenery | code-drawn |
| B3 | `backdrop-valley` | portrait 2:3, low-detail centre | 1600 x 2400 | 800 x 1200 | Behind the board | flat palette gradient |
| B3 | `backdrop-delta` | portrait 2:3 | 1600 x 2400 | 800 x 1200 | Behind the board | flat palette gradient |
| B3 | `backdrop-highland` | portrait 2:3 | 1600 x 2400 | 800 x 1200 | Behind the board | flat palette gradient |
| B3 | `backdrop-estuary` | portrait 2:3 | 1600 x 2400 | 800 x 1200 | Behind the board | flat palette gradient |
| B3 | `feature-graphic` | landscape 3:2, no text | 1536 x 1024 | not in bundle | Store listing | none (store only) |

Rules: B1 sets the style anchor and is reviewed first; B2 and B3 must match its view and light.
Rejected slots keep their code-drawn fallback. Runtime art budget: 8 MB total including backdrops
(expected below 1.5 MB). Provenance table (slot, designer thread message, review verdict, masters
path, bytes) is added by task 06 below.

### Provenance (filled by task 06)

| Slot | Status | Source message | Review | Runtime file | Bytes |
|---|---|---|---|---|---|
| (all 20) | not delivered | | | | |

## Fonts

| Role | Family | Licence | Source in `github.com/google/fonts` | Bundled as |
|---|---|---|---|---|
| Display | Bricolage Grotesque | OFL 1.1 | `ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf` | `public/fonts/bricolage-grotesque/BricolageGrotesque-Variable.woff2` (42,316 bytes) plus `OFL.txt`; `opsz` pinned at 36, `wdth` pinned at 100, `wght` variable 400 to 800 |
| Body | Atkinson Hyperlegible | OFL 1.1 | `ofl/atkinsonhyperlegible/AtkinsonHyperlegible-Regular.ttf` and `-Bold.ttf` | `public/fonts/atkinson-hyperlegible/AtkinsonHyperlegible-Regular.woff2` (15,368 bytes) and `-Bold.woff2` (15,680 bytes) plus `OFL.txt` |

Folder names and filenames were confirmed through the GitHub API on 2026-10-23. All three files
are subset to Basic Latin, Latin-1, U+2013, U+2014, U+2018 to U+201D, U+2022 and U+2026. Total
73,364 bytes (budget: each woff2 <= 120 KB, total <= 300 KB). Tool, commands and SHA-256 hashes:
`.agents/resources/2026-10-23/web-games/floodplain-dispatch/04/README.md`. No rendered text may fall
back to a platform font (kit `assertNoPlatformFontFallback` runs on every screen and sheet in
tests, and a test keeps every source character inside the subset).

## Audio plan (CC0 only)

Sources in order: Kenney audio packs (Interface Sounds, UI Audio, Impact Sounds, Digital Audio, Music
Jingles) at `kenney.nl/assets`; otherwise a page that explicitly states CC0 for the file (for
example a CC0-tagged entry on OpenGameArt or Freesound). Never synthesised audio. Each file gets
a row in `public/audio/LICENSES.md` with source URL, licence, author and SHA-256. A slot with no CC0
source ships silent and is recorded in `open-questions.md`.

| Slot id | Trigger |
|---|---|
| `ui-tap`, `ui-back`, `ui-toggle`, `ui-open-sheet` | buttons, toggles, sheets |
| `place-canal`, `place-barrier`, `place-pump`, `place-gate`, `place-reservoir` | placing a piece |
| `remove-piece`, `rotate-pump`, `invalid` | removal, rotation, illegal placement |
| `run-start`, `water-loop` | Run pressed; ambient water while playback runs |
| `surge-warning` | a surge week begins |
| `house-supplied`, `field-irrigated`, `house-flooded` | per-badge events during playback |
| `star-1`, `star-2`, `star-3`, `result-fail` | result sheet |
| `region-unlock`, `theme-unlock`, `streak-up` | progression events |
| `music-menu`, `music-play` | two looping tracks (CC0 music only) |

25 sound slots plus 2 music loops. Audio budget: total <= 2 MB (ogg, mono sfx, 96 kbps music).
Haptics (no files): light impact on placement, warning on invalid, medium on Run, error on flood,
success on star earned and unlocks.
