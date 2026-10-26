# Cloud Observatory - retry batch, round 2

Read `../../art-bible.md` first. This batch contains ONLY the three assets still rejected after retry round 1 (instrument-aurora-coil, lore-1, feature-graphic). icon and lore-6 were ACCEPTED in round 1 and now sit in accepted/. Everything else in the game is accepted and is the style standard you are judged against. Original specs: `../../b1/round-1/brief.md` (icon), `../../b4/round-1/brief.md` (instrument-aurora-coil), `../../b5/round-1/brief.md` (lore-1, lore-6, feature-graphic). Past verdicts: `../../b1/round-{1..4}/review/review.md`, `../../b4/round-{3,4}/review/review.md`, `../../b5/round-{1..4}/review/review.md`. Where this brief is more specific than the originals, this brief wins. Compositions below are deliberately simplified to remove the causes of the recurring failures; do not add elements back.

## Assets (round 2)

| assetId (file) | Size | Transparency | Gameplay purpose (unchanged) |
|---|---|---|---|
| `instrument-aurora-coil` (`instrument-aurora-coil.png`) | 1024x1024 | transparent RGBA | Build-row icon (112 px), Aurora Coil: "a copper spring with a wavy ribbon" at 48 px |
| `lore-1` (`lore-1.png`) | 1024x1536 | opaque | Chapter 1 "The Roof at Dusk" card (300x450), caption over bottom 24 percent |
| `feature-graphic` (`feature-graphic.png`) | 1536x1024 | opaque | Store feature graphic, no text; store may crop the outer 5 percent per side; observatory in the right third, left 55 percent calm |

Newly accepted anchors you must also match (in addition to the list below): `../../accepted/icon.png` and `../../accepted/lore-6.png` (the gouache gold star, the dawn palette, the flat ink-800 silhouette treatment).

## Review verdicts from round 1 and REQUIRED revisions

### instrument-aurora-coil: REJECTED
What is good and must be KEPT unchanged: the brass base, brass cap and nozzle, the dark matte core, the continuous muted copper helix (about 10 turns, visible pitch, 3 to 4 px ink contour), overall palette. Do not repaint these; use the previous `retry/round-1/out/instrument-aurora-coil.png` as the reference image and change only the ribbon and the proportions noted below.
What is wrong:
1. The ribbon reads as SMOKE or a steam wisp (a thin pastel comma with a smooth teal-to-rose gradient-bar blend). The brief forbids smoke and gradient-bar blends. It is also under 60 px wide at its widest and nearly vanishes at 48 px, so the one-line read "spring + wavy ribbon" fails: at 48 px it reads as a candle with smoke.
2. Colour fringe: stray green, cyan and rose specks and a coloured rim along the ribbon outline on the transparent border (visible when composited on black or ink-900). The ribbon edge must be clean.
3. The whole object is a slim column (about 300 px wide against the 600 to 800 px footprints of the accepted orrery, telescope, beacon); its visual weight is well under 85 percent of the siblings. At 112 px it looks like a small candle.
Revise:
- Make the ribbon a bold, readable aurora ribbon: 90 to 130 px wide at its widest (about 3x the current width), starting at about 10 px at the nozzle, ONE clear S-curve with a visible half-twist (a front face and a turned-over back face in a slightly different wash density, like a silk ribbon, not a vapour trail), tapering again to a soft but defined tip at the upper right. Total ribbon height 24 to 30 percent of the canvas.
- Paint it as 3 distinct layered watercolour washes with visible overlapping bled edges and a crisp ink-free silhouette edge: wash-teal base, a faint #8FCB9B green in the middle third (30 percent), wash-rose along the far edge and tip (30 percent). No smooth gradient from end to end, no airbrush, no sparkles, no smoke wisps or trailing fade-outs: the outline must be a definite shape.
- Widen the coil: make the core and helix about 40 to 50 percent wider (core diameter about 190 to 230 px, helix outer width about 300 to 360 px) and the brass base proportionally (about 560 to 640 px), keeping 10 turns so each turn is thicker. Overall bounding box: long side 74 to 82 percent of the canvas, the object including ribbon horizontally at least 45 percent of the canvas width, so its weight is within 15 percent of the orrery or telescope. Keep base line y 901 and margins.
- Re-composite check: after delivery, composite on ink-900, parchment AND black and magenta and confirm no coloured fringe pixels; remove them natively (re-render), not with a blur.

### lore-1: REJECTED
What is good and must be KEPT: the overall composition (clean dusk sky, distant roofline with the single lit window, sloped slate roof, dust-sheeted telescope on a brass-capped umber tripod at left third, dark lower third for the caption), the dark caption band, the tiny dim first stars.
What is wrong:
1. The horizon band is a vivid peach-orange to coral stripe about 9 percent tall with an airbrushed digital gradient: orange and coral are explicitly forbidden, and the smooth gradient has none of the wet-edged glaze look of key-art, lore-5 and lore-6. It is also the loudest thing in the picture and competes with the brass focal point.
2. The telescope lens is a saturated cyan-teal glass (the brief says muted teal, no cyan) and the lit brass of the whole telescope is brighter and more saturated than `accepted/instrument-telescope.png`.
3. The key: the "lifted slate wedge gap" is not readable: the key just lies on the slate surface next to a dark line, ring about 45 px. At 300x450 it is a speck. The story beat (key hidden under a slate) is lost.
4. Surface texture: at 2x zoom the slates, the cloth and the brass carry a tight lobed, crumpled, mosaic grain (the stucco failure listed above) that the sky does not have; slate edge lines look like dashed stitching. The roof reads as quilted leather, not slate.
5. The rear end of the telescope tube disappears behind the roof ridge cap at the left so the tube looks skewered by the ridge; the tube must clearly sit on its mount with a clear gap to the ridge or end in front of it with a visible eyepiece.
Revise:
- Re-paint the horizon as 2 to 3 soft wet-edged watercolour glazes: from ink-800/teal-grey through a dusty wash-rose (#D98BA0 at about 60 percent) to a narrow, muted gold-light (#EBCB85 at about 70 percent) strip, 5 to 7 percent of the canvas height. Peak colour must be no more saturated than the dawn rose of `accepted/lore-6.png`, no orange, no coral, no peach. Match the glaze softness and grain of lore-6 and key-art.
- Lens: muted wash-teal (#6FB3BD at about 60 percent, darker rim); brass no more saturated than `accepted/instrument-telescope.png`.
- Key and slate: enlarge the key ring to about 60 to 70 px across and make the lifted slate unmistakable: the slate's lower edge raised by a visible dark wedge of 20 to 28 px with a thin lit edge showing slate thickness and a soft shadow under it, the key's ring and about a third of the shaft clearly emerging from that wedge, with a thin parchment/gold-light rim on the ring. Place it near x 22 to 28 percent, y 62 to 68 percent, clear of the tripod leg and above the caption band. Add a subtle gold-light gleam on the ring so it pulls the eye as the second focal point.
- Slates: smooth painted slates with 2 to 3 px soft ink-line edges (continuous, not dashed), a gentle slate-light top-left edge, and the same uniform fine grain as the sky (about 3 px). No mosaic or lobed micro-texture; if the texture will not come out smooth, simplify the slate surface rather than keep it.
- Telescope mount: show the tube resting on the tripod head with its rear end finishing clearly in front of the ridge cap (visible eyepiece) or move the whole telescope about 60 px right so no part of it is hidden by the ridge. Keep the dust sheet.
- Preserve every unchanged part pixel-for-pixel where you can (use the round-1 file as reference); change only what is listed.

### feature-graphic: REJECTED
What is good and must be KEPT: the building, ridge, door, window and pines on the right exactly as in key-art, the gold focal star above the dome, the calm left, the right-hand nebula.
What is wrong:
1. A visible vertical wall in the sky: the nebula starts abruptly along a near-vertical line at about x 700 to 760 from the top to the horizon, with a smooth, grainless navy panel to its left. At store size it reads as two images pasted side by side. The left panel is a smooth digital gradient with no paper grain and no wet-edged glaze, while the right is the mottled accepted nebula.
2. The left ground/hills/pines have a different surface (coarser grain, flatter near hill, saturated green pines, a haze band that does not exist in key-art), and the near foreground is a flat dark slab about 15 percent of the height with no grass texture.
3. The nebula edge and the sky mottle on the right are visibly lobed/cellular at store size (it is the accepted key-art texture, but the seam makes it obvious): do not extend or repeat it, but it must blend away softly.
Revise:
- Make ONE native wide sky for the whole 1536x1024 canvas (fresh single pass, then Lanczos if needed) with the same paper grain and wet-edged glaze character as key-art; let the accepted diagonal nebula fade out over at least 450 px by a long, soft, irregular back-run (no straight vertical edge anywhere; the fade line must follow the diagonal of the nebula, thinning towards the lower left, not a vertical cut). The left 45 percent of the sky must still carry the same grain and a gentle large-scale colour drift (ink-950 to ink-800 with a barely perceptible teal bias near the horizon), 80 to 140 dim pigment dots, nothing else.
- Left terrain: far ridge ink-700 with a thin muted teal rim, mid ridge ink-800, near ridge ink-950 with grass tufts and 2 to 3 pines in the SAME dark teal-black pine colour as the key-art pines (not brighter green), with the same grain. Near ground: grass edge, a few stones, subtle value variation; no flat black slab, no extra haze band.
- Reuse the building crop from `accepted/key-art.png` mechanically as before; blend its surroundings (sky, nebula, ground) into the new native sky with feathers of at least 60 px so no seam is visible when viewing the 750x500 version.
- Check at 750x500: there must be no visible vertical line or colour step anywhere across the sky.

## Accepted assets to match (open each before painting; compare 2x crops side by side)

- `../../accepted/key-art.png` : THE sky standard. Smooth transparent wet-in-wet glazes, soft wash edges, fine uniform ~3 px paper grain, one diagonal teal-to-rose nebula, tiny pigment-dot stars, a small gouache cross-star. The building in it is the exact accepted design. Sky in every retry asset must be indistinguishable in hand from this.
- `../../accepted/observatory-building.png` : the building, brass dome (matte two-step foil with crackle, ink contour about 4 px, parchment rim top-left), stone, slate roof edge, telescope that rises OUT of the open dome slit.
- `../../accepted/lore-4.png`, `../../accepted/lore-5.png` : dark, low-detail plates with a quiet horizon, tiny distant observatory silhouette, parapet, one lamp-lit window, tiny coat-and-hat figure. Match their restraint and their calm lower band.
- `../../accepted/instrument-orrery.png`, `instrument-telescope.png`, `instrument-beacon.png`, `instrument-lens.png` : brass ramp, ink contour weight, satin finish, base style, muted saturation for the coil.

## Recurring failures: these are MUST-NOTS for every asset here

1. Serrated / polygon-lobed / scalloped / mosaic cells in sky, nebula, cloud or wash edges (Kuwahara or oil-filter look, crumpled stucco grain). Rejected in 4 rounds for lore-1, lore-6, feature-graphic. Wash edges must be soft wet edges, with at most gentle back-run blooms larger than 60 px; no outlined cells, no repeating lobes of similar size. If a nebula or cloud will not come out smooth, leave it out: a plain dark navy wash with paper grain beats a lobed nebula every time.
2. Mirror-symmetric or reflected or tiled composition anywhere (the nebula was mirrored left-right into a butterfly in lore-1 and feature-graphic). No flip, no reflect, no clone-stamp. Check by flipping your result horizontally and differencing against the original: it must not match.
3. Blocky, pixel-stepped or hard-threshold blooms (icon, 3 rounds). Any bloom, glow or wash that was composited from a mask must have a feather of at least 12 px and come from a smooth native wash; never a thresholded or low-resolution alpha. Prefer no bloom to a blocky bloom.
4. "Pasted on" objects: an object whose texture, grain, edge sharpness or colour temperature differs from the surrounding sky (telescope pasted on the dome, building pasted onto the sky, flat slate pasted on a roof, star pasted on the sky). Every object must share the same paper grain and the same ink-contour weight as accepted assets and must have contact (feet, base, shadow gap) with what it sits on.
5. Clip-art stars: faceted two-tone eight-point vector stars with ruler-straight edges. Stars here are hand-painted gouache dabs (see the star spec in the icon section), never faceted foil halves, never discs with halos (a disc reads as a moon, which is forbidden).
6. Off-palette loudness: hot orange copper (#F97A34, #FF7F1F), saturated cyan glass, lime-yellow, coral, violet, glossy white specular streaks, candy gradients. Maximum 5 hue families, low-to-mid saturation, matte (art bible sections 3, 4, 12.7).
7. Objects that fail their one-line read at display size (a key that is a tiny ring, a ribbon 18 px wide at 48 px, a telescope lost under cloth, a star hidden by the tube).
8. Edit-pass contamination: relighting, recolouring or restyling a whole accepted image by edit prompts produced the stucco and lobed textures twice (lore-6). Mechanical crop, resize, placement and feathered compositing of accepted pixels are allowed; full-image restyle edits are not. Generate each sky in a single fresh native pass (at 1.5x to 2x size, then Lanczos downscale is fine). No blur, noise or filter overlay to disguise texture.

## Original specs (unchanged where not overridden above)

### instrument-aurora-coil

- Final-round slot. Keep from the last attempt: tiered brass base and brass cap matching the accepted orrery/beacon, sits on baseline y 901, long side 74 to 82 percent of the canvas, transparent margin of at least 31 px, clean alpha. Everything else is rebuilt.
- Simplified construction: a brass round base, a short matte DARK core cylinder (slate #3A4660 to ink-700, matte, optionally one soft vertical teal wash on its lit side at under 30 percent; NO glass, NO cyan, NO white streaks), a continuous COPPER HELIX of 10 to 12 turns wound around the core, a brass cap, and one aurora ribbon rising from a small brass nozzle at the centre of the cap. (The turn count drops from 14 to 18 to 10 to 12 so each turn is thick enough to read at 48 px.)
- The helix must be ONE continuous wire with visible pitch: the front strands slant consistently (down-left to up-right, about 10 to 15 degrees), the back strands are mostly hidden behind the core, the wire enters at the bottom from a brass terminal and leaves at the top into a brass terminal. Not stacked identical hoops. Wire about 24 to 30 px thick.
- Copper colour is strictly muted: lit edge no brighter than about #C98558, body #B8693F, shade #7E4126, ink contour 3 to 4 px, copper maximum saturation about 55 percent. Compare with the orrery's brass: the coil must not be louder than any accepted instrument.
- Ribbon: starts THIN (about 6 to 10 px) at the nozzle and widens smoothly to about 80 to 100 px at its widest, with a single S-curve and a gentle twist, then tapers softly toward the upper right. Total ribbon height about 22 to 28 percent of the canvas, fully inside the margin, never touching the canvas edge. Paint it as 3 translucent watercolour washes layered with visible overlap and bled edges: wash-teal #6FB3BD base across the whole ribbon, a faint success-green #8FCB9B wash in the middle third at about 30 percent, a wash-rose #D98BA0 wash only along the far edge/tip at about 30 percent. No yellow, no lime, no white streaks, no gradient-bar blend, not a flat sticker, not smoke or steam. It must have two crisp-but-soft edges (feather no wider than 2 px on the outer silhouette).
- Must-nots (in addition to the shared list): no lightning, sparks, arcs, neon glow, smoke, cup that the ribbon is cut off in, overlapping or broken turns, glass cylinder, text.

### lore-1 (The Roof at Dusk)

- Simplified composition: a clean dusk sky with NO nebula and NO cloud masses, a sloped slate roof, a dust-sheeted telescope, a half-hidden key. Remove the note/envelope.
- Sky (upper half): a calm graded dusk made of 3 to 4 broad horizontal glazes with soft wet edges and paper grain, from ink-950 at the top through ink-900 and ink-800, then a dusky teal-rose transition, to a clearly visible thin gold-rose dusk band just above the distant rooftops (wash-rose and gold-light #EBCB85, about 6 to 8 percent of the canvas height, restrained, no orange, no coral, no hot gradient). The horizon sits around y 44 to 50 percent. At most one long thin flat cloud streak. Treat it like the horizon glow of `accepted/lore-5.png` but warmer and clearly gold-rose. 8 to 14 tiny dim first stars in the upper sky only, no clusters.
- Distant: a simple silhouette of rooftops and chimneys in ink-800 / ink-700 along the horizon, as in `accepted/lore-4.png`.
- Roof (lower half): an eye-level view of a sloped slate roof surface in perspective with the ridge near y 50 to 54 percent; slates slate #3A4660 with slate-light #55648A edges, each tile with a 2 to 3 px ink edge and visible overlap, so the lower roof is not a flat blue-grey slab. Lower half stays darker than ink-800 toward the bottom (caption band calm, dark).
- Focal point 1 (left third, x 38 percent, y 56 percent): the dust-sheeted telescope on its brass-capped umber tripod, as in the best part of the last attempt (sheet #D9D0B8 with believable folds, tube shape clearly visible under it, matte brass, muted teal lens, tripod feet with small contact shadows). Same brass and umber as `accepted/instrument-telescope.png`: not glossier, no cyan glass.
- Focal point 2 (lower left of the roof, x about 20 to 26 percent, y about 64 to 68 percent, above the caption band): ONE roof slate in the same row, same colour, same perspective, lifted at its lower edge by a visible wedge gap (a dark gap with a thin lit edge showing the tile thickness and a small dark shadow under it). A brass key lies half in that gap: the ring bow (about 40 to 50 px across, clearly a ring with a hole) and the start of the shaft stick out of the gap. The key reads at 300x450. No pasted floating parallelogram.
- Light: cool ambient from the upper left; the only warm accents are the gold-rose horizon band, the tiny brass highlights and ONE tiny warm lit window far away.
- Must-nots (in addition to the shared list): no people, no text or note, no moon, no birds or bats, no nebula, no mirrored shapes, no lit windows beyond the one far-away window, no glossy brass.

### feature-graphic

- Simplified composition: reuse the accepted key-art scene so building, ridge, pines and sky are identical by construction, and keep everything left of the building almost calm.
- Preferred method (A): build the canvas from the accepted `key-art.png` by mechanical crop and placement only. Crop the key-art region that contains the building, its stone wall, the two pines, the far hills and the ridge (about x 0 to 884, y 230 to 1254 of the 1024x1536 original, scale about 1.0 to 1.05), place it at the right of the 1536x1024 canvas so the building centre is near x 76 percent (about 1167 px) and its base sits at y 84 percent (860 px): building 66 to 86 percent of the width, about 44 to 47 percent of the canvas height, dome slit open, telescope aimed up-left, lamp-lit window, grass and stone-wall ground contact as in key-art. Then natively extend the calm area to the left (about the left 650 px) so the seam is invisible: far ridge in ink-700 with a thin muted teal rim, near ridge in ink-950, two or three pines at the far left, and open dark sky. Left 55 percent: no nebula at all or only the faintest continuation of the key-art glaze fading to nothing by x 40 percent; 80 to 140 dim pigment dots over the whole sky, tiny (1 to 3 px) and irregularly spaced, no star brighter than the gold star, no clusters. The accepted nebula in the crop stays exactly as in key-art (diagonal, smooth, right of centre, behind and above the dome); do not repaint it, do not mirror it.
- Fallback method (B): one fresh native single pass at 1536x1024 that includes the building, using `accepted/key-art.png` and `accepted/observatory-building.png` as references, same composition as above. Never composite a building with a different texture onto a different sky.
- Same texture everywhere: after compositing, apply the same uniform paper grain over the whole canvas (about 3 px at 1024) so building, sky and ridges share one surface. The building stone keeps the key-art tone (cool stone with shade side), not paler, not flatter.
- Focal star: the single brighter gold star above the dome toward the centre, on the telescope axis (near x 75 percent, y 33 to 37 percent), on clear dark sky and NOT inside the rose or teal nebula, painted as the same gouache star as in the icon (soft gold-light core, four main tapering points, short minor points, wet edges), 36 to 44 px wide, clearly readable at store size, no halo, no disc.
- Safe areas: all important content inside the central 90 percent; no text, no logo.
- Must-nots (in addition to the shared list): no nebula in the left calm area, no mirrored nebula, no pasted building, no pale flat stone, no flat black near hill without a grass edge (keep grass tufts, stones and a few pines for contact and depth), no moon-like disc, no aurora, no people.

## Self-review before delivering (the reviewer will run the same checks)

1. Sky crops at 2x next to `accepted/key-art.png`: no cells, lobes, crumpled grain, symmetry or vertical seams.
2. View at display size: coil at 48 and 112 on ink-800 beside the accepted orrery, beacon and telescope (ribbon must be clearly visible at 48 px); lore-1 at 300x450 with the bottom 24 percent caption band (the key must be visible at this size); feature graphic at 750x500.
3. Technical: exact sizes; coil RGBA with corners and outer 3 percent border alpha 0 and no coloured fringe on ink-900, parchment, black and magenta; opaque assets with no alpha, border, frame or vignette.
4. No text, numbers, constellation lines, moon, UI, lens flare or sparkle clusters.

## Delivery contract

- Save every image as PNG to `/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/cloud-observatory/retry/round-2/out/<assetId>.png` with the EXACT asset ids `instrument-aurora-coil`, `lore-1`, `feature-graphic` at the exact sizes stated above. One file per asset; no extra files in `out/` other than `manifest.json`. Do not redeliver `icon` or `lore-6` (accepted).
- Transparent asset (`instrument-aurora-coil`): 8-bit RGBA PNG, straight alpha, corners and the outer 3 percent border fully transparent. Opaque assets: PNG with no alpha channel (or alpha 255 everywhere).
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` (full final prompt including the art bible section 15 preamble and the reference images used; notes record method, seeds, rejected attempts, caveats).
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.
