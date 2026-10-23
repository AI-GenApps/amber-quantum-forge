# Cloud Observatory - batch b1 (STYLE ANCHOR), round 4 of 4 (FINAL)

Read `../../art-bible.md` first. Accepted so far (in `../../accepted/`, do NOT redeliver): `observatory-building`, `key-art`. This round contains ONLY the two still-rejected assets: `icon` and `emblem-lyre`. Full critique: `../round-3/review/review.md` (see also `../round-3/review/e_zoom_lyre_left.png` and `f_zoom_icon.png`). Match the accepted `../../accepted/observatory-building.png` for dome, brass, ink contour and stone treatment. Hard shared fixes: smooth transparent watercolour only (no polygonal/pixel-stepped blooms, no swirl-polygon texture), matte two-step foil (base #D8A94B, lit #EBCB85, shade #A47C30), fine ~3 px paper grain, clean anti-aliased edges. Final round: deliver clean work.

## Assets

| assetId (file) | Aspect class | Generation size | Background | Used for |
|---|---|---|---|---|
| `icon` (`icon.png`) | square 1:1 | 1024x1024 | opaque | App icon, favicon, splash |
| `emblem-lyre` (`emblem-lyre.png`) | square 1:1 | 1024x1024 | transparent | Atlas card, journal; style anchor for all 12 emblems |

## icon


- Purpose: the app icon. Must say "observatory + a bright star in a deep blue night" instantly at 48 px. Shown through adaptive masks (circle, squircle, rounded square) next to polished store icons.
- Subject: one hero composition. The accepted observatory's brass dome with its open slit and telescope tip, seen close and cropped (dome cap and the top of the slate roof only, no full house), at the lower centre; the telescope points up-left toward ONE large luminous gold star (a soft eight-ray hand-painted gold-leaf star, rays of two lengths, with gold-light core) at the upper right of the dome, about 16 percent of the canvas width. Behind: a deep navy wash (ink-950 at the top to ink-700 at the base) with a single soft teal-and-rose watercolour bloom around the star and 3 to 5 tiny dim star dots. Three major shapes only: dome, star, wash.
- Composition: full-bleed square, painted to every edge. ALL essential content (dome, telescope tip, star) inside the central circle of 62 percent of the canvas width (about 635 px diameter), centred; the focal gold star at about (62%, 36%), the dome at about (44%, 68%). Corner areas carry quiet wash and paper grain only (masks will crop them).
- Values: the star and the gold dome are the brightest mass, the sky dark, so the pair reads at 48 px. Keep a 40 percent value gap between the dome's lit side and the sky.
- Must-nots: no text or letters, no pre-rounded corners, no border, no inner frame, no glossy app-icon gradient or bevel, no glow halo bigger than the star, no lens flare, no sparkle clusters, no constellation lines, no moon, no people.

### Round 4 revision notes for icon (round 3 verdict: REJECTED)

What is right and must be KEPT from round 3: dome scale (about 42 percent of canvas width), matte crackled foil gold on the dome, star size (about 17 percent), composition position, quiet corners, tiny dim dots.

What is wrong and what to change:
- Remove the grey wedge fragment sticking out at the left of the parapet. Replace it with the accepted building's construction: a short run of stone terrace parapet with the accepted coping line, and if a roof is shown at all, the accepted slate roof edge attached to the wall (small, dark, slate #3A4660 with slate-light edge). The stone block below the dome must read as the top of the accepted terrace wall (same stone colours, stone-shade right side, thin ink contour 3 to 4 px, thin parchment/gold-light rim on the lit top-left edges), cropped by the bottom of the canvas.
- Telescope: copy the accepted telescope exactly: a longer brass tube that rises OUT of the open vertical slit (base inside the slit, tube emerging from it) and points up-left, its axis passing through the centre of the star. Currently it is a short stubby tube stuck on the dome face left of the slit with a block collar; fix both position and proportions (tube length about 1.6x the current, with a slim collar ring).
- Dome: add the dip-pen ink contour (3 to 5 px, thicker on the lower-right) and the shaded right side with gold-shade ribs, a gold-light rim on the top-left, exactly like the accepted dome, so icon and building look like one artist.
- Star: not a clean vector star. Hand-cut gold foil: eight rays of two lengths with slightly irregular cut edges, a gold-light core fading to gold-leaf, gold-shade on lower-right facets, same crackle as the dome; no perfectly straight symmetric vector edges.
- Sky: repaint the teal and rose blooms as smooth wet-in-wet watercolour with soft cauliflower back-run edges; no blocky, polygonal or pixel-stepped edges anywhere. Keep them small and low opacity.
- Keep all essential content inside the central 635 px circle, no border, no text.

## emblem-lyre


- Purpose: the anchor of the 12 constellation emblems (Atlas card, 144 x 144 CSS px, also 48 and 96 px in lists). Defines the frame of art bible 8.2 for all the others.
- Subject: the Lyre. A classical U-shaped lyre in frontal elevation: two curving arms rising from a rounded sound-box base, joined by a crossbar near the top, FIVE straight strings running from the crossbar to the base, small scroll-curl ends at the top of each arm. Gold-leaf with engraved lines (gold-deep), a single parchment accent highlight on the top-left arm. Perfectly symmetrical left-right in construction; only the painted light differs.
- Composition: the frame exactly as art bible 8.2: transparent 1024x1024; outer ring r 450 to 480 px; navy watercolour disc; hairline ring r 428 to 434; the lyre centred with a bounding box about 500 px tall by 400 px wide; transparent outside r 480 px (corners and the 32 px border fully alpha 0).
- Must-nots: no text, no zodiac or musical-note glyphs, no stars, no constellation dots or lines, no extra ornaments, no ring tick marks, no inner glow, no drop shadow, no mirror gloss, no more than 5 strings, no asymmetry between the two arms, no hands or figures.

### Round 4 revision notes for emblem-lyre (round 3 verdict: REJECTED; this is the anchor of 12 emblems)

What is right and must be KEPT from round 3 (do not change): frame radii (ring 450-480, hairline 428-434, transparent outside r480), clean circular outer edge, smooth navy disc with fine grain and faint teal upper-left / rose lower-right blooms, five strings, identical scrolls with holes, perfect mirror construction, figure bbox about 500 x 415 px centred, engraved arcs 3 to 4 px, no gloss.

What is wrong and what to change:
- Remove the opaque pinkish-white blob on the left arm at about (372, 383). Replace with a soft, small matte parchment (#F3E9D2) glaze on the top-left of the left arm (feathered 3 to 6 px, under 40 percent opacity, no hard edge, no white dot).
- Edges: the lyre silhouette, scrolls, crossbar and strings have aliased, stair-stepped, ragged edges (visible at 3x zoom). Redo the cut-out cleanly: smooth anti-aliased edges with feathering no wider than 2 px, straight clean strings of equal width (about 6 px) and equal brightness, no ragged left string.
- Sound box: it still reads as a boat hull or gondola because it is a crescent with upswept pointed ends. Redraw as a deep, rounded, U-shaped resonator bowl: the two arms descend as continuous smooth curves and merge into a round bottom with a full, deep belly (bowl width about 80 percent of the figure width at its widest, bowl height at least a third of the figure height), no pointed horns, no flat flange, no keel. Three engraved arcs following the bowl curve.
- Foil tonal steps: make them clearly visible. Gold-light #EBCB85 broad planes on the top-left of both arms, scrolls, crossbar and the top-left arc of the outer ring (a clear gold-light line on the ring's top-left edge); gold-shade #A47C30 planes on the bottom-right of the arms, bowl and a clear shade line on the ring's bottom-right; base #D8A94B between. Matte, faint crackle only, no bevel, no emboss.
- Match the foil of the accepted observatory-building dome.

## Delivery contract


- Save every image as PNG to `<batch>/round-<n>/out/<assetId>.png` (this round: `b1/round-4/out/<assetId>.png`) with the EXACT asset ids listed above, at the exact generation size stated per asset. One file per asset; no extra files in `out/` other than `manifest.json`.
- Transparent assets: 8-bit RGBA PNG, straight alpha, corners and the outer 3 percent border fully transparent. Opaque assets: PNG with no alpha channel (or alpha 255 everywhere).
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is the file name (for example `emblem-lyre.png`), `model` is the generator used, `prompt` is the full final prompt (and the reference images used), `size` is `"WIDTHxHEIGHT"`, `transparent` is a boolean, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.

