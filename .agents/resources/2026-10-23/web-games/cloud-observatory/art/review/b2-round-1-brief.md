# Cloud Observatory - batch b2, round 1

Read `../../art-bible.md` first. Style anchor: the accepted b1 (especially `observatory-building` and `emblem-lyre`); use them as reference images and compare every asset against them. Recommended generation order: `sky-far`, `horizon-hills`, `nebula-mid` (judge the three stacked together with the accepted building), then the six emblems (re-use `emblem-lyre` as the reference for the identical frame).

## Assets

| assetId (file) | Aspect class | Generation size | Background | Used for |
|---|---|---|---|---|
| `sky-far` (`sky-far.png`) | portrait 2:3 | 1024x1536 | opaque | Observe and Chart Table background, full-bleed cover |
| `nebula-mid` (`nebula-mid.png`) | portrait 2:3 | 1024x1536 | transparent | Parallax wash layer over sky-far |
| `horizon-hills` (`horizon-hills.png`) | portrait 2:3 | 1024x1536 | transparent | Bottom-anchored foreground ridges, bottom third only |
| `emblem-whale` (`emblem-whale.png`) | square 1:1 | 1024x1024 | transparent | Atlas card |
| `emblem-archer` (`emblem-archer.png`) | square 1:1 | 1024x1024 | transparent | Atlas card |
| `emblem-crown` (`emblem-crown.png`) | square 1:1 | 1024x1024 | transparent | Atlas card |
| `emblem-serpent` (`emblem-serpent.png`) | square 1:1 | 1024x1024 | transparent | Atlas card |
| `emblem-lantern` (`emblem-lantern.png`) | square 1:1 | 1024x1024 | transparent | Atlas card |
| `emblem-ship` (`emblem-ship.png`) | square 1:1 | 1024x1024 | transparent | Atlas card |

## sky-far

- Purpose: the furthest layer behind the Observe tab and the Chart Table, full-bleed (cover) on a 360 x 780 phone. Gold SVG stars, lines and tap sparkles are drawn over it by code, so it must never compete with them.
- Subject: a deep, quiet night sky as painted blue paper: ink-950 at the top, easing through ink-900 into ink-800 and ink-700 toward the horizon at 70 to 85 percent of the height, with a faint warm-teal haze (wash-teal at 15 to 25 percent) hugging just above the horizon; a very subtle large-scale watercolour mottling (low contrast, pigment granulation). 60 to 120 tiny dim stars as pigment dots (1 to 4 px at 1024, parchment at 25 to 60 percent opacity), irregularly spaced, with a few clustered faintly toward the upper left.
- Composition and safe areas (percent of 1024x1536): header band y 0 to 12 percent and tab-bar band y 91 to 100 percent: calm. Middle 80 percent width and y 12 to 70 percent: very calm, no star brighter than 6 px, no cluster shaped like a figure or a line, because gold chart stars must pop here. The most detail (haze, a few more stars, a slightly lighter band) sits at y 62 to 90 percent. The bottom third is overpainted by horizon-hills, so keep it a simple lighter gradient.
- Must-nots: no constellation lines, no star bigger than 6 px, no four-point spikes or glow stars, no moon, no planets, no shooting stars, no nebula blobs (nebula-mid owns those), no Milky Way band, no vignette or border, no banding in the gradient, no visible tiling, no text, no clouds.

## nebula-mid

- Purpose: a parallax layer between sky-far and the foreground; adds colour depth with soft watercolour washes. Moves slowly; static if the player prefers reduced motion.
- Subject: 2 to 4 soft translucent watercolour wash masses in wash-teal #6FB3BD and wash-rose #D98BA0 (plus tiny areas where they mingle), wet-in-wet with pigment granulation and back-run blooms at the margins, drifting from the upper left towards the middle right in a loose diagonal. Peak opacity 55 percent, most areas under 30 percent. Think spilled diluted ink, not a galaxy photograph.
- Composition (percent of 1024x1536): washes live in y 5 to 62 percent; the bottom 30 percent nearly clear; the overall coverage (pixels above alpha 10 percent) under 45 percent; the middle band (x 25 to 75 percent, y 25 to 55 percent) stays under 25 percent opacity because gold stars sit there. The outer 4 percent border is fully transparent; edges of the washes dissolve softly to alpha 0 with no hard cut at the canvas edge.
- Must-nots: no stars, no hard-edged shapes, no swirl or spiral galaxy, no neon, no purple, no banding, no visible tiling, no dark smudge, no baked sky colour (the layer carries colour only where there is wash), no text.

## horizon-hills

- Purpose: bottom-anchored foreground ridges; the observatory-building (320 px) stands at the bottom centre; the tab bar covers the bottom 9 percent.
- Subject: three receding ridges painted in flat watercolour with dry-brush edges: far ridge ink-700 #22335C with a thin cool rim light (wash-teal at 40 percent) on its crest, mid ridge ink-800, near ridge ink-950. A few tiny pine silhouettes (6 to 12 trees, varied heights, not in a row) on the mid and near ridges, no buildings, no lights, no path. A gently flatter shelf on the near ridge at x 30 to 70 percent and y about 78 to 84 percent, where the building stands.
- Composition (percent of 1024x1536): content only in y 66 to 100 percent (1014 to 1536 px); alpha 0 above y = 64 percent; far ridge crest at about 68 to 72 percent, mid ridge crest 74 to 79 percent, near ridge crest 80 to 86 percent with the flat shelf in the middle. The bottom 9 percent is the darkest and calmest (tab bar on top). Crisp painted ridge edge, no feathering wider than 2 px.
- Must-nots: no sky, no stars, no haze beyond the thin rim light, no buildings, no windows, no fences, no snow, no water, no lens flare, no halo along the crest, no baked ground shadow outside the hills, no text.

## emblem-whale

- Purpose: Atlas card emblem for The Whale (7 stars). Instantly "long body, spout, forked flukes" at 48 px.
- Subject: A whale in profile facing left, simple heraldic engraving: smooth long body arching slightly, a small round eye dot, a gently curved mouth line, a belly with 5 to 6 engraved throat grooves, a raised tail with two clearly separated flukes at the right, and a short fountain-shaped spout above the head. Gold-leaf with gold-deep engraving; a few engraved wave-lines under the belly are allowed but kept to 3 short curved strokes.
- Composition: the exact emblem frame of art bible 8.2 and of the accepted `emblem-lyre` (use it as the reference image; same ring radii, same disc wash, same hairline ring, same paper grain), transparent 1024x1024; figure centred, bounding box about 540 px wide by 420 px tall; light from the top-left; transparent outside r 480 px.
- Must-nots: no text, no zodiac or astronomical glyphs, no stars, constellation dots or lines, no ring tick marks, no extra ornaments, no inner glow, no drop shadow, no mirror gloss, no frame variation (the frame must be identical to the accepted emblem-lyre). No second whale, no ship, no water surface, no teeth detail, no extra fins beyond the one pectoral fin.

## emblem-archer

- Purpose: Atlas card emblem for The Archer (7 stars). Instantly "bow arc, string, diagonal arrow" at 48 px.
- Subject: NO human figure. A drawn longbow in frontal-profile elevation facing right: a smooth curved gold bow with a leather-wrapped grip (three engraved bands) at the centre, a taut bowstring pulled back at the left, and a long arrow nocked on it pointing up and to the right (diagonal about 25 degrees) with a clear leaf-shaped arrowhead and three fletching vanes at the nock. Gold-leaf with gold-deep engraving.
- Composition: the exact emblem frame of art bible 8.2 and of the accepted `emblem-lyre` (use it as the reference image; same ring radii, same disc wash, same hairline ring, same paper grain), transparent 1024x1024; figure centred, bounding box about 520 px by 480 px; light from the top-left; transparent outside r 480 px.
- Must-nots: no text, no zodiac or astronomical glyphs, no stars, constellation dots or lines, no ring tick marks, no extra ornaments, no inner glow, no drop shadow, no mirror gloss, no frame variation (the frame must be identical to the accepted emblem-lyre). No hand, no arm, no quiver, no target, no hunter, no second arrow, no bowstring that crosses the arrow incorrectly (the string meets the arrow at the nock only).

## emblem-crown

- Purpose: Atlas card emblem for The Crown (6 stars). Instantly "zig-zag points with beads, a band" at 48 px.
- Subject: A circlet crown seen from the front in elevation: a band with a rope-twist engraving and six points of alternating height (three tall, three short, evenly spaced, symmetrical left to right), each tall point topped by a small round bead. Gold-leaf with gold-deep engraving and one parchment accent on the top-left bead.
- Composition: the exact emblem frame of art bible 8.2 and of the accepted `emblem-lyre` (use it as the reference image; same ring radii, same disc wash, same hairline ring, same paper grain), transparent 1024x1024; figure centred, bounding box about 520 px wide by 360 px tall, optically centred; light from the top-left; transparent outside r 480 px.
- Must-nots: no text, no zodiac or astronomical glyphs, no stars, constellation dots or lines, no ring tick marks, no extra ornaments, no inner glow, no drop shadow, no mirror gloss, no frame variation (the frame must be identical to the accepted emblem-lyre). No jewels in colour, no velvet cap, no cross, no fleur-de-lis text-like shapes, no asymmetry between left and right halves, no crown that reads as a royal cartoon.

## emblem-serpent

- Purpose: Atlas card emblem for The Serpent (8 stars). Instantly "single S-curve with head" at 48 px.
- Subject: A slender serpent in a flowing S-curve across the disc from upper left (head, a smooth rounded head seen in profile facing right-down with a small eye dot and a thin forked tongue) to lower right (a tapering tail ending in a fine point). Body of even thickness with a fine engraved scale pattern kept as a simple lozenge band, and a plain belly stripe. Gold-leaf with gold-deep engraving.
- Composition: the exact emblem frame of art bible 8.2 and of the accepted `emblem-lyre` (use it as the reference image; same ring radii, same disc wash, same hairline ring, same paper grain), transparent 1024x1024; figure centred, bounding box about 500 px by 520 px; light from the top-left; transparent outside r 480 px.
- Must-nots: no text, no zodiac or astronomical glyphs, no stars, constellation dots or lines, no ring tick marks, no extra ornaments, no inner glow, no drop shadow, no mirror gloss, no frame variation (the frame must be identical to the accepted emblem-lyre). No coiling into a ring (it must read as an S, not a circle, not a snake-eating-tail), no wings, no horns, no fangs, no second snake, no apple, no staff.

## emblem-lantern

- Purpose: Atlas card emblem for The Lantern (6 stars). Instantly "tall cage with ring and flame" at 48 px.
- Subject: A tall hexagon-section cage lantern in frontal elevation: a ring at the top, a domed cap, four vertical gold corner ribs forming the cage, glass panes implied between them by faint wash-teal translucency, a small flame inside (a single teardrop of gold-light and lamp-glow), and a flat base with a short foot. Perfectly symmetrical left to right.
- Composition: the exact emblem frame of art bible 8.2 and of the accepted `emblem-lyre` (use it as the reference image; same ring radii, same disc wash, same hairline ring, same paper grain), transparent 1024x1024; figure centred, bounding box about 380 px wide by 540 px tall; light from the top-left; transparent outside r 480 px.
- Must-nots: no text, no zodiac or astronomical glyphs, no stars, constellation dots or lines, no ring tick marks, no extra ornaments, no inner glow, no drop shadow, no mirror gloss, no frame variation (the frame must be identical to the accepted emblem-lyre). No chain, no hand, no hook, no rays of light spreading out, no smoke, no ornate filigree, no candle wax, no extra lanterns.

## emblem-ship

- Purpose: Atlas card emblem for The Ship (8 stars). Instantly "hull, mast, triangular sail, pennant" at 48 px.
- Subject: A small sailing ship in profile facing right, heraldic engraving: a curved hull with a plank line, one mast, one large triangular sail billowing gently to the right, a small pennant flag at the mast top streaming right, and a small bowsprit. The ship sits on three short engraved wave strokes. Gold-leaf with gold-deep engraving.
- Composition: the exact emblem frame of art bible 8.2 and of the accepted `emblem-lyre` (use it as the reference image; same ring radii, same disc wash, same hairline ring, same paper grain), transparent 1024x1024; figure centred, bounding box about 520 px wide by 480 px tall; light from the top-left; transparent outside r 480 px.
- Must-nots: no text, no zodiac or astronomical glyphs, no stars, constellation dots or lines, no ring tick marks, no extra ornaments, no inner glow, no drop shadow, no mirror gloss, no frame variation (the frame must be identical to the accepted emblem-lyre). No crew, no cannons, no pirate or skull flag, no rigging web (at most 2 simple stay lines), no ocean surface beyond the three wave strokes, no second ship, no text on the sail.

## Delivery contract

- Save every image as PNG to `<batch>/round-<n>/out/<assetId>.png` (this round: `b2/round-1/out/<assetId>.png`) with the EXACT asset ids listed above, at the exact generation size stated per asset. One file per asset; no extra files in `out/` other than `manifest.json`.
- Transparent assets: 8-bit RGBA PNG, straight alpha, corners and the outer 3 percent border fully transparent. Opaque assets: PNG with no alpha channel (or alpha 255 everywhere).
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is the file name (for example `emblem-whale.png`), `model` is the generator used, `prompt` is the full final prompt (and the reference images used), `size` is `"WIDTHxHEIGHT"`, `transparent` is a boolean, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.
