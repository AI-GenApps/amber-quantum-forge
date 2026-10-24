# Cloud Observatory - batch b5, round 3 (revision)

Round 2 result: lore-1, lore-6 and feature-graphic were all REJECTED (lore-2 to lore-5 remain accepted in `accepted/`). Redeliver exactly these three. Read `../../art-bible.md` first. Compare against `accepted/key-art.png` (the texture and sky reference), `accepted/observatory-building.png`, `accepted/instrument-telescope.png`, `accepted/lore-4.png`, `accepted/lore-5.png`.

## Assets

| assetId (file) | Aspect class | Generation size | Background | Used for |
|---|---|---|---|---|
| `lore-1` (`lore-1.png`) | portrait 2:3 | 1024x1536 | opaque | Chapter 1: The Roof at Dusk card and journal |
| `lore-6` (`lore-6.png`) | portrait 2:3 | 1024x1536 | opaque | Chapter 6: Morning Star card and journal |
| `feature-graphic` (`feature-graphic.png`) | landscape 3:2 | 1536x1024 | opaque | Store feature graphic (not bundled) |


## Vignette rules (unchanged, apply to lore-1 and lore-6)

- Full-bleed, painted to every edge, no frame, no vignette darkening, no border, no stamp.
- BOTTOM 24 percent of the image (y 76 to 100 percent, 1167 to 1536 px) is a calmer, darker band: low detail, no focal subject, value not lighter than ink-800 in its lower half (lore-6 may be a mid-value rose-navy instead). Caption text in parchment is drawn here.
- TOP 8 percent: a close button overlays the top-right; keep it free of bright detail.
- One focal point near an optical third; secondary points subordinate. People are tiny, from behind or silhouette, never taller than 18 percent of the canvas height, no faces, no visible hands (art bible section 10).
- Same hand: ink pen line only on small objects and figures, large masses by wash value.


## Revision notes (round 3)

### All three assets - the texture defect is still NOT fixed (second rejection for the same reason)
- In 2x crops every sky, cloud, nebula and the dust sheet still shows a scalloped, polygon-cell oil-paint / Kuwahara pattern: uniform lobed "cauliflower" cloud edges and outlined pigment cells 6 to 12 px across. Accepted key-art has none: smooth transparent glazes, soft blooms, a few hard dried-pool edges, and a fine uniform 3 px paper grain. At display size the round-2 plates read as another artist's work.
- Round-2 strategy (regenerating from accepted references, then 'focused native wash repaint') did not work, so change the approach. Generate the SKY AS ITS OWN PASS first (sky only, no objects), using accepted/key-art.png's sky as the sole texture reference and a prompt such as 'large smooth transparent watercolour glazes on cold-press paper, wet-in-wet, soft diffuse blooms, a few hard dried-pool edges, pigment granulation microscopic, no oil paint, no impasto, no mosaic, no Kuwahara, no polygon cells, no scalloped or cauliflower cloud edges, no outlined cells, no hammered texture'. Then compose the scene around that sky with native edits that leave the sky pixels untouched (edit only the foreground and objects). Or start from accepted/key-art.png as the edit base and paint the new scene elements on top, keeping its sky.
- Clouds and nebula must be broad soft masses whose edges are irregular and varied in scale (large soft blooms, not repeating rounded lobes).
- Self-check before delivering: zoom a 400x400 sky crop to 2x. If you can see cells or lobes, it fails. Run no blur, filter or overlay to hide it. Do not deliver a plate you yourself flag as having residual facets: regenerate instead.
- Keep what worked: composition, focal points, caption bands, clean small-object ink line, no text.

### lore-1 notes
- Keep: sloped slate roof with ridge, the dust-sheeted telescope on brass-capped tripod at the left third, key half under a lifted tile with a blank folded note, single tiny warm window, round dim stars.
- Change: (1) the sky texture as above, and tone the teal and rose band down to a soft low-opacity wash like key-art's nebula so the telescope is the focal point; (2) slates: add the ink-line edge on each shingle's lower edge and a slight slate-light top rim, with value variation tile to tile and a soft wash, and keep the BOTTOM 24 percent (y 1167 to 1536) no lighter than ink-800 (round 2 peaked at about luminance 50 vs 36); (3) let the tube of the telescope read under the dust sheet (a clear tube silhouette pointing up-left with the brass eyepiece end visible) so it is plainly a telescope, not a ghost shape; (4) keep the key and note above y 1167.
- Match: accepted/key-art.png (sky), accepted/instrument-telescope.png (brass fittings), accepted/lore-4.png (dark calm lower band).

### lore-6 notes
- Keep: composition, the lightest plate of the set, kneeling adult offering the key to the standing child (tiny, no faces, mitten-simple hands), one eight-ray gold-leaf star at upper right, observatory silhouette at left.
- Change: (1) texture as above; (2) de-saturate: wash-rose, gold-light and parchment-cream horizon with only a soft hint of wash-teal in the upper left, no hot coral, no orange, no violet; at most 4 hue families, matching the restraint of accepted/key-art.png and lore-5; (3) paint the dome as the fixed brass dome (gold-leaf with gold-shade ribs, slit open, telescope tip up-left), in dawn shadow but still clearly warm brass, matching accepted/observatory-building.png; (4) simplify the distance: remove the lit lake strip and the village, leave two calm hill ridges in soft wash values so no glow competes with the key; (5) paving as large quiet slabs. Caption band stays calm and dark (a mid rose-navy is allowed).
- Match: accepted/key-art.png, accepted/lore-5.png (silhouettes), accepted/lore-4.png (calm band).

### feature-graphic notes
- Keep: building at x 66 to 86 percent with base at y 84 percent, calm left 55 percent, two ridge layers and pines, one lamp-lit window, dim stars.
- Change: (1) texture as above, the nebula as two or three broad soft wash-teal and wash-rose glazes with low saturation, kept off the dome silhouette; (2) the focal gold star must NOT read as a moon or planet: paint it as the same eight-ray round matte gold-leaf star as the accepted icon / lore-6 (small, about 14 to 18 px across, with short soft rays, no disc, no big halo), directly above the dome towards the centre (x 55 to 62 percent, y 22 to 30 percent); (3) building height about 46 percent of the canvas height (base y 84 percent, top about y 38 percent) while staying within x 66 to 86 percent: keep accepted observatory-building proportions (taller, dome visible, stone shaded to the same value as accepted/observatory-building.png, not pale and flat-lit); (4) reduce the left-half star count to dim, irregular dots of varied size (some 1 px, a few 3 px), no uniform white pinpoints; total 80 to 140.
- Match: accepted/key-art.png and accepted/observatory-building.png.


## Original specs (repeated from round 1)

## lore-1

- Purpose: the chapter card art for Chapter 1: The Roof at Dusk. Reads as "dusk gold-rose horizon, navy sky, pale dust sheet focal" at 300 x 450 px.
- Subject: Dusk on a slate rooftop. Foreground: a sloped slate roof surface in perspective across the lower half; on it, a brass telescope on a tripod under a draped dust sheet (dust-sheet #D9D0B8, the tube shape visible beneath the fabric folds), a small brass key half under a lifted slate tile at the lower left with a blank folded note beside it. Background: the last dusk glow as a thin band of wash-rose and gold at the horizon over distant rooftops and chimneys in silhouette (ink-800 and ink-700), the sky deepening to ink-950 at the top, 8 to 14 first stars just appearing as dim dots.
- Composition: portrait 1024x1536, opaque. Focal point: the dust-sheeted telescope at the left third, x 38 percent, y 56 percent. The bottom 24 percent is the calm caption band. Light direction as described in the subject; ambient cool light from the upper left.
- Must-nots: No people, no text on the note, no moon, no lit windows beyond one tiny warm one far away, no bats or birds. No text or numbers of any kind, no frame or border, no vignette, no lens flare, no sparkle clusters, no bokeh, no plastic gloss, no galaxy-wallpaper swirl, no constellation lines.

## lore-6

- Purpose: the chapter card art for Chapter 6: Morning Star. Reads as "dawn rose-gold, lightest of the set, two small figures and a key" at 300 x 450 px.
- Subject: Dawn on the rooftop, one bright star left. A soft pale sky going from ink-800 at the top through wash-rose and gold-light to a warm parchment-cream horizon (the lightest vignette of the set); ONE bright gold star (a small hand-painted gold-leaf star of the same eight-ray design as in the accepted icon, gold-light core, not a flare or diffraction spike) high at the upper right; the observatory silhouette on the left with the dome. On the roof terrace at the right, two simplified silhouettes from the side: an adult kneeling and holding out a small brass key (a bright gold glint) toward a child standing opposite; seen from behind/side, mitten-simple hands in shadow, no finger detail, no faces.
- Composition: portrait 1024x1536, opaque. Focal point: the key between the two figures at x 60 percent, y 72 percent; the star at x 78 percent, y 18 percent. The bottom 24 percent is the calm caption band. Light direction as described in the subject; ambient cool light from the upper left.
- Must-nots: No faces, no hands with visible finger counts (hands stay hidden or mitten-simple), no text, no sun disc, no birds, no confetti, no sparkles around the key beyond one soft glint, figures never taller than 18 percent of the canvas height. No text or numbers of any kind, no frame or border, no vignette, no lens flare, no sparkle clusters, no bokeh, no plastic gloss, no galaxy-wallpaper swirl, no constellation lines.

## feature-graphic

- Purpose: the store feature graphic. Store feature graphic, no text in the art. The store may crop the outer 5 percent of each side.
- Subject: A wide night panorama of the Observatory on its ridge. The accepted observatory (same design as observatory-building, use it as a reference) stands at the right third (x 66 to 86 percent), base at y 84 percent, building height about 46 percent of the canvas height, dome slit open, telescope aimed up-left, one lamp-lit window. Across the sky from the right to the left: soft watercolour nebula washes (wash-teal and wash-rose, restrained) and about 80 to 140 dim pigment-dot stars, plus ONE slightly brighter gold star above the dome toward the centre. Foreground: two layers of dark ridge silhouettes (ink-800, ink-950) and a few pines. The left 55 percent of the frame is calm sky and ridges (open space for a store overlay).
- Composition and safe areas (1536x1024): all important content (observatory, the bright star, the nebula) inside the central 90 percent; the observatory in the right third; the left 55 percent calm (no focal detail, no bright star clusters). No band overlays inside the art because the store adds nothing here.
- Must-nots: no text or title, no logo, no UI, no constellation lines, no moon, no people, no aurora, no vignette or border, no lens flare, no bokeh, no hard galaxy swirl, no plastic gloss.

## Delivery contract

- Save every image as PNG to `<batch>/round-<n>/out/<assetId>.png` (this round: `b5/round-3/out/<assetId>.png`) with the EXACT asset ids listed above, at the exact generation size stated per asset. One file per asset; no extra files in `out/` other than `manifest.json`.
- Transparent assets: 8-bit RGBA PNG, straight alpha, corners and the outer 3 percent border fully transparent. Opaque assets: PNG with no alpha channel (or alpha 255 everywhere).
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is the file name (for example `lore-1.png`), `model` is the generator used, `prompt` is the full final prompt (and the reference images used), `size` is `"WIDTHxHEIGHT"`, `transparent` is a boolean, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.
