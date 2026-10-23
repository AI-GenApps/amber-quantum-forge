# Floodplain Dispatch - assets index

Status after task 06: the three fonts, all 27 CC0 audio files and 19 of the 20 designer art slots are
bundled or archived (below). 17 slots ship as runtime WebP in `public/art/`; `icon` and `feature-graphic`
are accepted store assets kept as masters only (task 07 turns `icon` into the app icon; the store listing uses both); `key-art` was
rejected in the designer loop's final round and keeps its code-drawn placeholder (the title screen
shows the gradient and river drawing). Every one of the 20 slots has a code-drawn fallback
(`src/art/fallbacks.ts`), so the game renders completely with zero, some or all slots present.

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
path, bytes) is the generated table below; `bun run build:art` (in the app) rewrites it, the masters,
the runtime files and `src/art/manifest.ts` from the designer inbox, and fails loudly with the slot id on
any violation.

### Provenance (task 06)

The designer inbox manifest records batch and round per image but no thread message id, so the
"Source" column is batch plus round and the verdict is the heading or bullet quoted from the review
note (copies in `.agents/resources/2026-10-23/web-games/floodplain-dispatch/art/review/`, art bible
beside them). Verdict list: `.../06/verdicts.json`; machine-readable rows: `.../06/provenance.json`.
Masters are WebP q90 at the delivered resolution: sprites and the icon 1024 x 1024, backdrops
1024 x 1536, feature graphic 1536 x 1024 (the plan named 768 sprites and 1600 x 2400 backdrops). Runtime
files are downscaled from the masters' source to 192 x 192 and 800 x 1200.

<!-- provenance:begin generated by scripts/build-art.ts -->
| Slot | Status | Source (batch, round) | Review verdict | Runtime file | Runtime bytes | Master | Master bytes | Master SHA-256 |
|---|---|---|---|---|---|---|---|---|
| `icon` | accepted | b1 round 4 | `## icon - ACCEPTED` in `art/review/b1-round-4.md` | store asset, none | - | `art/masters/icon.webp` | 73,996 | `702c374eb017f3b811a22014d63f466ae77121389b8885991c3b2d0526c6d35e` |
| `key-art` | rejected | - | rejected in retry/round-3/review/review.md; the code-drawn placeholder stays | code-drawn placeholder | - | - | - | - |
| `house-cottage` | accepted | b1 round 1 | `## house-cottage: ACCEPTED` in `art/review/b1-round-1.md` | `/art/house-cottage.webp` | 5,826 | `art/masters/house-cottage.webp` | 87,116 | `fe3e319008909feb0ad63f8ef30eb739e7d9b52a694224882cf04e4fa27d1dac` |
| `pump` | accepted | b1 round 2 | `## pump: ACCEPTED` in `art/review/b1-round-2.md` | `/art/pump.webp` | 6,640 | `art/masters/pump.webp` | 72,404 | `c83aa5359795fe0900e139fc0d170d5322a3fba5d5c0afde7485979fe03c3f7c` |
| `house-townhouse` | accepted | b2 round 1 | `- house-townhouse: ACCEPT` in `art/review/b2-round-1.md` | `/art/house-townhouse.webp` | 5,832 | `art/masters/house-townhouse.webp` | 68,768 | `b7a1fe4c859dd7f44bff9e977e9bf4915375d7243e430a9f742b50d9a16deac9` |
| `house-mill` | accepted | b2 round 1 | `- house-mill: ACCEPT` in `art/review/b2-round-1.md` | `/art/house-mill.webp` | 6,676 | `art/masters/house-mill.webp` | 79,080 | `f68e94c8ddac09ac2ef4ceeccc79c7b2d3b9beb66fe52ef76cb38af52ce9fce5` |
| `house-barn` | accepted | b2 round 1 | `- house-barn: ACCEPT` in `art/review/b2-round-1.md` | `/art/house-barn.webp` | 5,730 | `art/masters/house-barn.webp` | 72,830 | `5eaba2786326322a0d7e8efdb60ec4540acf03dec1288cc4b6fac7d784074726` |
| `house-school` | accepted | b2 round 1 | `- house-school: ACCEPT` in `art/review/b2-round-1.md` | `/art/house-school.webp` | 5,868 | `art/masters/house-school.webp` | 71,674 | `48216ad5309eeb0ffa00548ed9f6f0fe22138ae0fa61f10614170140852b5472` |
| `reservoir` | accepted | b2 round 1 | `- reservoir: ACCEPT` in `art/review/b2-round-1.md` | `/art/reservoir.webp` | 5,948 | `art/masters/reservoir.webp` | 62,904 | `887717676d7262fc551ab95e1f5cc08cdb0b1d4f244b386aab2e56be5ba9da70` |
| `sluice-gate` | accepted | b2 round 1 | `- sluice-gate: ACCEPT` in `art/review/b2-round-1.md` | `/art/sluice-gate.webp` | 7,086 | `art/masters/sluice-gate.webp` | 80,340 | `e225ab4ad667329ef9938d4c547d701de4ff72a284b8a265af52145e8dfaf60a` |
| `sandbag-barrier` | accepted | b2 round 1 | `- sandbag-barrier: ACCEPT` in `art/review/b2-round-1.md` | `/art/sandbag-barrier.webp` | 5,700 | `art/masters/sandbag-barrier.webp` | 65,828 | `54ffc20f85d923d4e6bb16af88891280bb5b5e9abdb513dfbe3054bbc9decacd` |
| `windmill` | accepted | b2 round 1 | `- windmill: ACCEPT` in `art/review/b2-round-1.md` | `/art/windmill.webp` | 10,682 | `art/masters/windmill.webp` | 106,178 | `674479f709e9228cf4353960e000894f8a4004adf6c92b760df61c020a911537` |
| `tree-oak` | accepted | b2 round 1 | `- tree-oak: ACCEPT` in `art/review/b2-round-1.md` | `/art/tree-oak.webp` | 7,780 | `art/masters/tree-oak.webp` | 77,910 | `7155b855ab18fe4b6b8f88da70d8983fbe6f7fba962554cfb3d549aa959ffeb7` |
| `tree-poplar` | accepted | b2 round 1 | `- tree-poplar: ACCEPT` in `art/review/b2-round-1.md` | `/art/tree-poplar.webp` | 4,354 | `art/masters/tree-poplar.webp` | 38,594 | `ede3cae769be5b0689887be4af2c3b8b379bb0b4d57febbd1b78ecf174d749d1` |
| `tree-willow` | accepted | b2 round 1 | `- tree-willow: ACCEPT` in `art/review/b2-round-1.md` | `/art/tree-willow.webp` | 8,810 | `art/masters/tree-willow.webp` | 89,780 | `41441f04b5d6986da6eb4e3c28955f84ccf62d7ade85a5a8bf5ac27daa2a2b60` |
| `backdrop-valley` | accepted | b3 round 2 | `## backdrop-valley - ACCEPTED` in `art/review/b3-round-2.md` | `/art/backdrop-valley.webp` | 13,586 | `art/masters/backdrop-valley.webp` | 44,600 | `4d4b01b44afe3ae2b10b675a19458f72c492e33714bdbd695a88438358a6a27d` |
| `backdrop-delta` | accepted | b3 round 3 | `## backdrop-delta: ACCEPTED` in `art/review/b3-round-3.md` | `/art/backdrop-delta.webp` | 14,118 | `art/masters/backdrop-delta.webp` | 38,548 | `6b7ec3a421898a650223041a19ed6cb191e65f6f495c30df7c7b09b592e1f516` |
| `backdrop-highland` | accepted | b3 round 2 | `## backdrop-highland - ACCEPTED` in `art/review/b3-round-2.md` | `/art/backdrop-highland.webp` | 24,536 | `art/masters/backdrop-highland.webp` | 66,748 | `0aae5115ded97c3b3c24cb4d1435c4e9e45ef4372cbb702d1faa6bfd75d28eb3` |
| `backdrop-estuary` | accepted | b3 round 3 | `## backdrop-estuary: ACCEPTED` in `art/review/b3-round-3.md` | `/art/backdrop-estuary.webp` | 14,414 | `art/masters/backdrop-estuary.webp` | 41,848 | `acf659b00fd0e52f53351080fcddd7892efa8d188c0aa321d53c1689d86fa676` |
| `feature-graphic` | accepted | b3 round 2 | `## feature-graphic - ACCEPTED` in `art/review/b3-round-2.md` | store asset, none | - | `art/masters/feature-graphic.webp` | 147,146 | `52989f0c96f9af246899e4cc87f3996492884bdb1310c50dd0c09b1c54307c5c` |
<!-- provenance:end -->

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

## Audio (CC0 only, delivered in task 05)

Sources, in the order tried: Kenney audio packs (Interface Sounds, Impact Sounds, Digital Audio,
RPG Audio, Music Jingles) at `kenney.nl/assets`; otherwise a page that explicitly states CC0 for the
file (OpenGameArt entries that show `License(s): CC0`). Nothing is synthesised. The 25 sound slots
and 2 music loops all have a CC0 file, so no slot ships silent. Every file has a row in
`public/audio/LICENSES.md` (author, source URL, licence, download date, SHA-256 of the shipped file);
pack licence texts are in `public/audio/licenses/`. Candidates and choices:
`.agents/resources/2026-10-23/web-games/floodplain-dispatch/05/README.md`.

| Slot id | Trigger | File | Author | Source | Bytes |
|---|---|---|---|---|---|
| `ui-tap` | any button tap (not Run) | `ui-tap.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds | 4,876 |
| `ui-back` | Back button | `ui-back.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds | 6,997 |
| `ui-toggle` | a settings toggle | `ui-toggle.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds | 7,369 |
| `ui-open-sheet` | inspector, pause, hint or exit sheet opens | `ui-open-sheet.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds | 9,834 |
| `place-canal` | canal placed | `place-canal.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/impact-sounds | 8,361 |
| `place-barrier` | sandbags placed | `place-barrier.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/impact-sounds | 4,790 |
| `place-pump` | pump placed | `place-pump.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/impact-sounds | 5,488 |
| `place-gate` | sluice gate placed | `place-gate.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/impact-sounds | 5,172 |
| `place-reservoir` | reservoir placed | `place-reservoir.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/impact-sounds | 7,288 |
| `remove-piece` | piece erased | `remove-piece.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds | 11,739 |
| `rotate-pump` | pump rotated | `rotate-pump.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/rpg-audio | 6,481 |
| `invalid` | illegal placement | `invalid.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds | 5,013 |
| `run-start` | Run season pressed | `run-start.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds | 11,618 |
| `water-loop` | ambient water while playback runs (volume follows how much of the board is wet) | `water-loop.ogg` | Snabisch (user snabisch on OpenGameArt) | opengameart.org/content/sea-and-river-wave-sounds | 54,591 |
| `surge-warning` | a surge or storm-tide week begins during playback | `surge-warning.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/impact-sounds | 9,270 |
| `house-supplied` | a house becomes supplied | `house-supplied.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds | 14,169 |
| `field-irrigated` | a field becomes irrigated | `field-irrigated.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/interface-sounds | 4,759 |
| `house-flooded` | a house floods | `house-flooded.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/digital-audio | 5,956 |
| `star-1` | result sheet, 1 star | `star-1.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles | 11,051 |
| `star-2` | result sheet, 2 stars | `star-2.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles | 12,270 |
| `star-3` | result sheet, 3 stars | `star-3.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles | 14,977 |
| `result-fail` | result sheet, 0 stars | `result-fail.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/digital-audio | 7,035 |
| `region-unlock` | a region opens | `region-unlock.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles | 15,086 |
| `theme-unlock` | a theme unlocks | `theme-unlock.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles | 12,229 |
| `streak-up` | daily streak extended | `streak-up.ogg` | Kenney (Kenney Vleugels) | kenney.nl/assets/music-jingles | 11,651 |
| `music-menu` | menus (loop) | `music-menu.ogg` | The Cynic Project (cynicmusic) | opengameart.org/content/calm-ambient-3-lifewave-2k | 309,909 |
| `music-play` | on a map (loop) | `music-play.ogg` | The Cynic Project (cynicmusic) | opengameart.org/content/another-august | 384,222 |

Total audio: 962,201 bytes (budget 2 MB; each sound at most 60 KB, each music loop at most 600 KB).
Sound effects are mono Ogg Vorbis: files that were already mono are shipped unchanged, stereo ones
were downmixed to mono with ffmpeg. The water loop and both music loops are excerpts of CC0 recordings
with a short crossfade of the tail into the head so they loop; the music loops are 45 seconds each.

Haptics (no files): light impact on placing or rotating a piece, `warning` on an illegal placement,
medium impact on Run, `error` when a house floods, `success` on each earned star, region unlock and
theme unlock. Nothing on plain button taps.

## Capacitor icon and splash (task 07)

Sources live in `apps-games/floodplain-dispatch/assets/` and are written by
`scripts/build-icons.ts` (`bun scripts/build-icons.ts`, deterministic); `@capacitor/assets` turns them
into the Android and iOS resources. Nothing outside the accepted designer folder is used.

| File | Content | Path used |
|---|---|---|
| `assets/icon-only.png` | 1024 x 1024 opaque, the accepted `icon` master | accepted art |
| `assets/icon-foreground.png` | Android adaptive foreground, the same icon (the tool insets it 16.7 percent, so the cottage stays inside the mask safe zone) | accepted art |
| `assets/icon-background.png` | flat `meadow` `#8aa468`, matches the icon ground | palette token |
| `assets/splash.png`, `assets/splash-dark.png` | 2732 x 2732, code-drawn roof-and-wave badge (`scripts/draw-fallback-icon.ts`, palette tokens only) centred in 1200 px on `night` `#18231d`; the two files are identical (one dark look) | code-drawn, because `key-art` is rejected |

`bun scripts/build-icons.ts --fallback` draws the icon in code as well. The `feature-graphic` is not
used by Capacitor.
