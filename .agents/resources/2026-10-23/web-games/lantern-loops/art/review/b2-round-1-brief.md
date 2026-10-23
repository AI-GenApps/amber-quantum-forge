# Lantern Loops - batch b2, round 1

Read `../../art-bible.md` first. Batch b1 is the style anchor: use the ACCEPTED b1 files (in `../../accepted/` once the orchestrator copies them there, otherwise `../../b1/round-<n>/out/`) as reference images. Everything here must look like the same artist made it: same paper texture, same edge thickness, same lantern construction, same light, same palette.

Recommended generation order: the five lantern sprites first, generated from the accepted `lantern-amber` as the reference (change only colour, glyph window and, for unlit, the lit state), then the four-asset set `backdrop-garden`, `backdrop-bridge`, `backdrop-sky` (reference the accepted `backdrop-harbor`), then `daily-medallion`, `empty-archive`, and last `feature-graphic` (it re-uses lantern colours and the harbor language).

## Assets

| assetId (file) | Aspect class | Generation size | Background | Used for |
|---|---|---|---|---|
| `lantern-rose` (`lantern-rose.png`) | square 1:1 | 1024x1024 | transparent | Sky legend, how-to-play, share preview |
| `lantern-jade` (`lantern-jade.png`) | square 1:1 | 1024x1024 | transparent | same |
| `lantern-azure` (`lantern-azure.png`) | square 1:1 | 1024x1024 | transparent | same |
| `lantern-violet` (`lantern-violet.png`) | square 1:1 | 1024x1024 | transparent | same |
| `lantern-unlit` (`lantern-unlit.png`) | square 1:1 | 1024x1024 | transparent | Locked puzzles, unlit lanterns in lists |
| `backdrop-garden` (`backdrop-garden.png`) | portrait 2:3 | 1024x1536 | opaque | Garden puzzle screens and list |
| `backdrop-bridge` (`backdrop-bridge.png`) | portrait 2:3 | 1024x1536 | opaque | Bridge puzzle screens and list |
| `backdrop-sky` (`backdrop-sky.png`) | portrait 2:3 | 1024x1536 | opaque | Sky puzzle screens and list |
| `daily-medallion` (`daily-medallion.png`) | square 1:1 | 1024x1024 | transparent | Daily screen, streak milestones |
| `empty-archive` (`empty-archive.png`) | square 1:1 | 1024x1024 | transparent | Archive "Completed" empty state |
| `feature-graphic` (`feature-graphic.png`) | landscape 3:2 | 1536x1024 | opaque | Store feature graphic after crop (1024x500) |

## The four coloured lanterns (rose, jade, azure, violet) and lantern-unlit

Shared rules for all five: IDENTICAL silhouette, size, position, proportions, cord, caps, tassel, rib layout, paper texture and edge as the accepted `lantern-amber` (bible section 8). Only the body colour family and the window glyph change. Same lighting (core brightest, deep tone toward left/right edges and the shade side). Judge them side by side with amber: if you can overlay the outlines and they differ, regenerate.

- `lantern-rose`: body #E9657F, light core #FFB0BF, deep #A33556. Window glyph: a diamond (a square rotated 45 degrees, equal sides), same size as amber's circle window. Must read clearly pink-red, not orange, not magenta.
- `lantern-jade`: body #3FBF98, light core #A5EBD0, deep #1B7A62. Window glyph: an equilateral triangle pointing UP. Must read clearly green-teal, not blue.
- `lantern-azure`: body #4EA6EA, light core #B0DAFA, deep #2468A8. Window glyph: a square (axis-aligned, equal sides). Must read clearly sky blue, not violet, not teal.
- `lantern-violet`: body #9A7DE3, light core #CFC0F7, deep #5F47B0. Window glyph: a five-point star (regular, point up, simple, no inner lines). Must read clearly purple, not blue.
- `lantern-unlit`: body #5C6385 (light #8A92B5, deep #363B5E), flat matte paper, no glow, NO window and no glyph, caps/cord/tassel unchanged. It must read as "switched off" next to the lit lanterns: lower saturation, no bright core, but the panels and ribs still visible.
- Composition: transparent, 1024x1024, outer 4 percent border fully transparent, axis at x = 50 percent, proportions exactly as amber.
- Must-nots (all five): no text/letters/numbers on the paper; glyph must be a clean geometric shape (not a letter, not a face); no outer glow, halo, bloom, sparkle or rays; no cast shadow or ground; no outline; no gloss; colours must not drift toward amber at the edges; no change of lantern shape between colours.
- Self-check: line up amber, rose, jade, azure, violet at 48 px over #12132E, then over #F6EAD3: five unmistakable hues and five distinct window shapes; unlit clearly off.

## backdrop-garden

- Purpose: background of the Garden chapter (numbered stones). The board sits on top in the centre.
- Subject: a walled night garden as a layered paper-theatre scene, same world and paper as `backdrop-harbor`. Dominant teal (teal-deep #08393D, teal #0E5A5F, teal-light #1E7F82) with plum (#3A2A5E) shadows and rose (#E9657F) lantern glows. Top band: the top of a garden wall with simple tiled coping (a row of scalloped cut-paper tiles) in teal-deep, and 2 flowering branches entering from the upper left and upper right corners with paper blossoms (five-petal flat cut-paper flowers in blossom #F3B6C3 and paper #F6EAD3, varied sizes, not clones), 2 or 3 small hanging rose lanterns (rose design, small, under 7 percent of the width) high in the margins. Board zone: calm raked-gravel as large gentle teal wave bands (the wave pattern of raked sand, 4 to 6 wide bands, very low contrast), no flowers, no lanterns, no stones larger than 3 percent of the width inside the zone. Bottom band: dark foreground layers: a low hedge silhouette and a few flat stepping-stone ovals at the margins, plus drifting fallen petals only at the margins.
- Composition: frontal paper-theatre, light top-left, shadows down-right. Safe-zone map per bible section 13: top band y 0 to 16 percent, board zone y 17 to 77 percent and x 5 to 95 percent calm (mean luminance 12 to 28 percent, no detail with more than 8 percent value difference), bottom band y 78 to 100 percent darker and low detail; outer 15 percent each side may carry the richest detail (blossom branches, hanging lanterns).
- Mood: hushed, intimate, rose-warm.
- Must-nots: no text, no signs, no people, no animals, birds or butterflies, no petals scattered across the board zone, no bright rose glow in the zone, no sparkle or bokeh, no vignette, no frame, no baked board/grid, no more than 6 paper layers, no copy-pasted identical blossoms.

## backdrop-bridge

- Purpose: background of the Bridge chapter (mirrors). The board sits on top.
- Subject: a still river crossed by old arched bridges, dusk, as a layered paper-theatre scene in the same world. Palette: slate-indigo (#2A2F6B), stone-dusk (#4A4F86), indigo (#1E2050), mist (#3B3F8F), silver-teal glints (#9ED6D0), a few small amber lamps (#F2A33A). Top band: a long multi-arch stone bridge in the far distance, spanning the full width at about y 6 to 14 percent, built from 5 to 7 simple semicircular arches of unequal width but consistent geometry, with 3 or 4 tiny amber lamps on its deck. Board zone: the still river as large horizontal cut-paper bars of slate-indigo and indigo-light, with a few thin silver-teal glint lines (each under 1.5 percent of the height and at most 8 percent value difference, spread low-contrast), no structures in the zone. Bottom band: dark foreground embankment: reed silhouettes and a stone parapet corner at the left and right margins, two layers with layer shadows.
- Composition: frontal paper-theatre, light top-left, shadows down-right. Safe-zone map per bible section 13 (top 0 to 16 detail, board zone 17 to 77 and x 5 to 95 calm, bottom 78 to 100 darker). Outer 15 percent each side may carry a second small bridge or reeds.
- Mood: reflective, silvery, spacious; mirrors of light on water.
- Must-nots: no text, no people, no boats in the zone, no vehicles, no impossible arches (each arch must close to a clean semicircle and rest on a pier), no mirrored photographic reflection, no bright glints in the zone, no sparkle or bokeh, no vignette, no frame, no baked board/grid, no handrails that look like text or a grid.

## backdrop-sky

- Purpose: background of the Sky chapter (colour gates and five colours). The board sits on top. The last, most open chapter.
- Subject: lanterns released into an evening sky as a layered paper-theatre scene. Sky colour as stepped paper bands from violet (#3A2F7E) at the top through indigo-mist (#3B3F8F) to a muted azure (#3E6FB8) in the middle zone, with a faint dusty rose band (#C97C98 at low presence) only near the lower third. Stacked flat cut-paper cloud banks (paper-2 and indigo-light edges, darker undersides), larger and darker toward the bottom. Lanterns: 9 to 12 small distant lanterns of the five game colours (amber, rose, jade, azure, violet; the lantern design at tiny size, with their glyph windows reduced to a bright dot), each under 6 percent of the width and varied in size and height, placed ONLY in the top band, the bottom band and the outer side margins, none in the board zone. Board zone: nothing but calm sky bands and 1 or 2 very low-contrast cloud edges.
- Composition: frontal paper-theatre, light top-left, shadows down-right. Safe-zone map per bible section 13. The lanterns drift upward, loosely clustered to the left in the top band and to the right in the bottom band (asymmetric, balanced), never in a regular grid.
- Mood: open, airy, ascending; the lanterns are being sent skyward.
- Must-nots: no text, no people, no birds, no kites, no moon, no stars or sparkle, no bokeh, no god rays, no bright lantern or cloud edge in the board zone, no airbrushed gradient (bands must be stepped paper layers), no vignette, no frame, no baked board/grid, no more than 12 lanterns, no identical lantern clones.

## daily-medallion

- Purpose: the streak medallion on the Daily screen and for milestones (3, 7, 14, 30, 60, 100 days). One image for all six tiers; the tier number is drawn by code in the centre plate and the tier name below the image.
- Subject: a round paper-cut medal in straight-on front view: an outer scalloped rim of 16 rounded petals in amber (#F2A33A, light #FFD68A, deep #B9661A), an inner raised ring in paper (#F6EAD3 with paper-2 shade), and a deep indigo centre plate (#1E2050 with night #12132E rim shadow) that is COMPLETELY EMPTY (plain, with only paper texture), because a numeral will be drawn on it. On the ring a repeating cut-out pattern of 16 tiny exact-circle windows (same circle as the amber lantern window) evenly spaced, each with a bright core, no other motif. Layered construction: petals sheet, ring sheet, centre plate sheet, each with a thin paper edge and a soft internal layer shadow down-right. A small flat cord loop at the top is NOT included.
- Composition: transparent, 1024x1024, perfectly circular and centred; scalloped disc diameter about 86 percent of the canvas width; centre plate diameter about 46 percent of the canvas width; outer 4 percent border fully transparent. The centre plate must have no mark that could collide with a numeral (no emblem, no star, no lantern).
- Must-nots: no text, numbers, letters, no ribbon or banner, no tier-specific design, no lantern or star in the centre, no outer glow, halo or sparkle, no drop shadow outside the silhouette, no gloss or metal chrome, no coin-embossing realism, no asymmetry (petals equal, spacing exact).
- Self-check: at 120 px it reads as an amber-and-cream medal with a dark empty centre; at 240 px the 16 windows are crisp and evenly spaced.

## empty-archive

- Purpose: the empty state of the Archive "Completed" tab: "nothing solved yet, light your first one". A calm, friendly, wordless spot illustration at 160 css px.
- Subject: an open, empty, shallow paper tray or box (wide, low, with a folded-paper rim in paper #F6EAD3 and paper-2 with a darker indigo-light interior #2B2F78 showing it is empty), and sitting in it ONE small unlit lantern (the `lantern-unlit` design, same construction, perfectly upright, not tilted) waiting to be lit. Beside the lantern, one thin cut-paper ribbon (cream, as on the game's board) rests curled in a gentle OPEN loop, hinting at a loop still to be drawn. Three layers at most: tray, lantern, ribbon.
- Composition: transparent, 1024x1024, front view, whole illustration inside a 78 percent box centred, lantern about 45 percent of the canvas height, tray width about 70 percent of the canvas, balanced slightly low. Outer 4 percent border fully transparent. Calm and sparse; nothing in the top 15 percent.
- Must-nots: no text, no sad face or any face, no tears, no cobwebs, no dust clouds, no sparkles, no glow (the lantern is unlit), no outer halo or drop shadow, no ground plane, no UI, no lock icon, no checkmark, no closed ribbon loop (it stays open, an unfinished loop).

## feature-graphic

- Purpose: Play Store feature graphic (centre-cropped to 1024x500) and store art. No text.
- Subject: a luminous cream paper ribbon forming ONE closed, smooth rounded loop (a soft horizontal oval with generous 90-degree-style rounded corners like the game's board tiles, no self-crossing) floating in the centre of a layered dusk paper-theatre scene. Five lanterns hang from the loop at varied positions and heights: amber, rose, jade, azure, violet (the exact designs and glyph windows from b1/b2, in that order left to right, slightly varied in size, 12 to 16 percent of the canvas height, not identical clones), their light spilling softly onto the cream ribbon. Behind: a paper-theatre dusk in three horizontal zones echoing the four chapters: left a harbor shoreline with a tiny boat and amber lamp, centre a stone arch bridge over still water, right a violet-azure sky with cloud banks; transitions between zones are overlapping cut-paper layers (4 to 6 layers total), muted and darker than the lanterns so the ribbon and lanterns glow.
- Composition (percent of 1536x1024): the focal ribbon loop and lanterns inside x 12 to 88 percent and y 20 to 80 percent (the 1024x500 centre crop is the central 100 percent width by about the central 73 percent height, y 13.5 to 86.5 percent: everything essential must survive it). Outer 8 percent left/right and top/bottom 14 percent: decoration only. Light top-left, shadows down-right. Left-to-right balance: heaviest detail in the centre.
- Mood: calm festival wonder; light finding its loop.
- Must-nots: no text, no title, no logo, no UI, no board/grid/stones/numbers, no people, animals or birds, no crossing ribbon knots, no more than five lanterns, no outer glow bloom, no sparkle or bokeh, no god rays, no vignette, no frame or border, no airbrushed gradient, no recognisable existing artwork.

## Delivery contract

- Save every image as PNG to `<batch>/round-<n>/out/<assetId>.png` (this round: `b2/round-1/out/<assetId>.png`) with the EXACT asset ids listed above (`lantern-rose`, `lantern-jade`, `lantern-azure`, `lantern-violet`, `lantern-unlit`, `backdrop-garden`, `backdrop-bridge`, `backdrop-sky`, `daily-medallion`, `empty-archive`, `feature-graphic`), at the exact generation size stated per asset. One file per asset; no extra files in `out/` other than `manifest.json`.
- Transparent assets: 8-bit RGBA PNG, straight alpha, corners and the outer 4 percent border fully transparent. Opaque assets: PNG with no alpha channel (or alpha 255 everywhere).
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is the file name (for example `lantern-rose.png`), `model` is the generator used, `prompt` is the full final prompt (and the reference images used), `size` is `"WIDTHxHEIGHT"`, `transparent` is a boolean, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.
