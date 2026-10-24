# Cloud Observatory - batch b2, round 2

Read `../../art-bible.md` first. Style anchors: accepted b1 (`observatory-building`, `emblem-lyre`) and accepted b2 round 1 (`sky-far`, `nebula-mid`, `emblem-whale`, `emblem-archer`, `emblem-crown`, `emblem-serpent`, `emblem-lantern`), all in `../../accepted/`. Use them as reference images. Only the two rejected assets are re-requested; do NOT touch the accepted ones.

## Assets

| assetId (file) | Aspect class | Generation size | Background | Used for |
|---|---|---|---|---|
| `horizon-hills` (`horizon-hills.png`) | portrait 2:3 | 1024x1536 | transparent | Bottom-anchored foreground ridges, bottom third only |
| `emblem-ship` (`emblem-ship.png`) | square 1:1 | 1024x1024 | transparent | Atlas card |

## horizon-hills

ORIGINAL SPEC (unchanged):

- Purpose: bottom-anchored foreground ridges; the observatory-building (320 px) stands at the bottom centre; the tab bar covers the bottom 9 percent.
- Subject: three receding ridges painted in flat watercolour with dry-brush edges: far ridge ink-700 #22335C with a thin cool rim light (wash-teal at 40 percent) on its crest, mid ridge ink-800, near ridge ink-950. A few tiny pine silhouettes (6 to 12 trees, varied heights, not in a row) on the mid and near ridges, no buildings, no lights, no path. A gently flatter shelf on the near ridge at x 30 to 70 percent and y about 78 to 84 percent, where the building stands.
- Composition (percent of 1024x1536): content only in y 66 to 100 percent (1014 to 1536 px); alpha 0 above y = 64 percent; far ridge crest at about 68 to 72 percent, mid ridge crest 74 to 79 percent, near ridge crest 80 to 86 percent with the flat shelf in the middle. The bottom 9 percent is the darkest and calmest (tab bar on top). Crisp painted ridge edge, no feathering wider than 2 px.
- Must-nots: no sky, no stars, no haze beyond the thin rim light, no buildings, no windows, no fences, no snow, no water, no lens flare, no halo along the crest, no baked ground shadow outside the hills, no text.

REVISION NOTES (round 1 rejection reasons and required fixes):
- WRONG: the ridges stop 32 px short of the left and right canvas edges (alpha 0 in x 0-31 and x 992-1023) and 47 px short of the bottom, so the layer is a floating slab with hard vertical edges; on any screen wider than 2:3 a strip of bare sky shows down both sides. FIX: the three ridges must run edge to edge. Ridge fill must be fully opaque from x = 0 to x = 1023 and down to the very bottom row (y = 1535). The only transparent area is above the far ridge crest. Left/right/bottom transparent margins must NOT exist for this asset (the usual 3 percent transparent border rule is waived for horizon-hills only; the top must still be alpha 0 above y = 64 percent).
- WRONG: the far-ridge crest rim light is a crisp 2 px line of near-opaque bright teal (about #5F8FAE at alpha 95 percent) that reads as a vector outline stroke, i.e. the "halo along the crest" the brief forbids. FIX: make it a soft watercolour rim: wash-teal #6FB3BD at about 40 percent opacity, 3 to 6 px wide, slightly irregular and broken by paper grain, fading into the ridge colour, visible only on the far ridge (and only faintly on the mid ridge). No bright cyan.
- Keep what worked: three clear value steps (ink-700 far, ink-800 mid, ink-950 near), the dry-brush paper grain, 6 to 12 tiny pines not in a row, the dark calm bottom for the tab bar. Make the near-ridge shelf at x 30 to 70 percent a gently flatter plateau (currently a plain dome) at y 78 to 84 percent. Give the ridge edges a slightly more hand-painted wobble so they do not look like a smooth vector curve; match the soft wash character of the accepted nebula-mid and sky-far paper grain.
- Verify before delivery: alpha at (0, 1400), (1023, 1400), (512, 1535) and (0, 1535) is 255; alpha at y < 1014 is 0; no pure black pixels.

## emblem-ship

ORIGINAL SPEC (unchanged):

- Purpose: Atlas card emblem for The Ship (8 stars). Instantly "hull, mast, triangular sail, pennant" at 48 px.
- Subject: A small sailing ship in profile facing right, heraldic engraving: a curved hull with a plank line, one mast, one large triangular sail billowing gently to the right, a small pennant flag at the mast top streaming right, and a small bowsprit. The ship sits on three short engraved wave strokes. Gold-leaf with gold-deep engraving.
- Composition: the exact emblem frame of art bible 8.2 and of the accepted `emblem-lyre` (use it as the reference image; same ring radii, same disc wash, same hairline ring, same paper grain), transparent 1024x1024; figure centred, bounding box about 520 px wide by 480 px tall; light from the top-left; transparent outside r 480 px.
- Must-nots: no text, no zodiac or astronomical glyphs, no stars, constellation dots or lines, no ring tick marks, no extra ornaments, no inner glow, no drop shadow, no mirror gloss, no frame variation (the frame must be identical to the accepted emblem-lyre). No crew, no cannons, no pirate or skull flag, no rigging web (at most 2 simple stay lines), no ocean surface beyond the three wave strokes, no second ship, no text on the sail.

REVISION NOTES (round 1 rejection reasons and required fixes):
- WRONG: the hull silhouette is a lumpy bean/peanut: the keel line dips into an unmotivated dent under the middle and the bottom has two bulges, so it looks like a clam or a boat that cannot float. FIX: draw one clean, smooth, heraldic hull: a single continuous crescent (flat or gently curved deck line on top, one smooth curve for the keel with no dent), tapering to a raised bow at the right and a raised stern at the left. Mirror the elegance of the accepted `emblem-serpent` and `emblem-whale` outlines (smooth, confident, bookplate-like).
- WRONG: direction logic is ambiguous. Currently the raised block end is on the left and the stay line runs to it, while the spar sticks out to the right with the sail corner tied to it, so it is unclear which end is bow and the sail billows the wrong way for the heading. FIX: ship faces RIGHT. Bow (pointed, rising, with the short bowsprit) at the right; stern (slightly raised, with a small stern block) at the left. The mast stands slightly left of centre; ONE triangular sail billows gently toward the RIGHT/bow side with its foot along a boom that is clearly attached to the mast; the pennant at the mast top streams right. At most one simple stay line from the mast top to the bowsprit tip. The bowsprit must visibly grow out of the hull's bow, not out of a sail corner.
- Everything attached: mast base seated in the hull, boom attached to the mast, bowsprit attached to the hull. No floating parts.
- Keep what worked: exact frame, gold-leaf treatment, three short separate wave strokes under the hull (keep them thin and clearly separate from the hull), one plank line, bounding box about 520 x 480 px centred, 70 px clear of the hairline ring, light from top-left. Match the accepted emblem-lyre frame exactly (it will be compared pixel-for-pixel; reuse the identical frame/disc layer).

## Delivery contract

- Save every image as PNG to `b2/round-2/out/<assetId>.png` with the EXACT asset ids listed above (`horizon-hills`, `emblem-ship`) at the exact generation size stated per asset. One file per asset; no extra files in `out/` other than `manifest.json`.
- Transparent assets: 8-bit RGBA PNG, straight alpha. For emblem-ship corners and the outer 3 percent border fully transparent. For horizon-hills see the explicit edge-to-edge exception above.
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is the file name (for example `emblem-ship.png`), `model` is the generator used, `prompt` is the full final prompt (and the reference images used), `size` is `"WIDTHxHEIGHT"`, `transparent` is a boolean, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.
