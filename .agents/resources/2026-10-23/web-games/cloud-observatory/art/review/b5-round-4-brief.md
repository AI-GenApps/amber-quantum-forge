# Cloud Observatory - batch b5, round 4 (revision, FINAL round: deliver clean or the slot gets a placeholder)

Round 3 result: lore-1, lore-6 and feature-graphic were all REJECTED again (lore-2 to lore-5 remain accepted in `accepted/`). Redeliver exactly these three. Read `../../art-bible.md` first. Compare against `accepted/key-art.png` (sky and texture reference), `accepted/observatory-building.png`, `accepted/instrument-telescope.png`, `accepted/lore-4.png`, `accepted/lore-5.png`.

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


## Revision notes (round 4)

### All three assets: sky texture is STILL not the accepted key-art texture (third rejection)
- Round 3 improved the sky-pass idea, but at 2x crop every sky still shows (a) scalloped, polygon-lobed cloud/nebula edges, hard "cut-paper" cells 20 to 60 px across with serrated outlines (feature-graphic centre nebula, lore-1 upper-left teal band), and (b) in lore-6 a crumpled, mottled, grainy "stucco" texture over the whole sky gradient, far coarser than a 3 px paper grain. Accepted key-art has none of this: broad smooth transparent glazes, soft diffuse bloom edges, a few hard dried-pool edges that are smooth curves (not serrated), and a barely visible fine uniform grain.
- Do NOT regenerate the sky from a text prompt again. Instead use the actual pixels of accepted/key-art.png as the sky: crop/extend its sky region (e.g. its y 380 to 900 band for the nebula, y 0 to 380 for the calm zenith; mirror or re-edit natively if a different aspect is needed) and paint ONLY the new foreground/objects on top by native edit with a mask that leaves sky pixels untouched. If the sky is edited, request "smooth, soft-edged glaze, no serrated edges, no cells, no mottling, no stucco".
- Self-check: view a 400x400 crop at 2x next to the same-size crop of accepted/key-art.png. If the lobes/cells/mottling are visible, it fails; regenerate instead of delivering. No blur, filter or overlay to hide it.
- Keep what worked: composition, caption band darkness in lore-1, no text, clean small-object ink line, no moon, no lens flare.

### lore-1 notes
- Wrong: (1) sky/nebula texture as above; (2) the brass key is not "half under a lifted slate": it lies loose beside the note, with a stray ring and the slates have deckle-like dotted edges. Paint ONE lifted slate with a visible dark gap under it and the key bow peeking out of the gap, shaft hidden; (3) the telescope reads as a fully uncovered brass telescope with a small cloth draped on it, not "under a dust sheet": drape the dust sheet (#D9D0B8) over the MIDDLE and rear half of the tube, leaving only the brass objective ring and the eyepiece tip visible, tube silhouette still clear; (4) the telescope is glossy and bright with teal glass bleeding saturated cyan; match accepted/instrument-telescope.png (matte satin gold-leaf, lens in muted wash-teal), and its tripod feet must sit on the roof plane with a small contact shadow, not hover; (5) slate shingle edges: use a clean thin ink-line lower edge and slate-light top rim, no dotted/frayed pale edge; (6) keep the bottom 24 percent (y 1167 to 1536) calm, no lighter than ink-800 (this was OK in round 3).
- Match: accepted/key-art.png (sky), accepted/instrument-telescope.png (brass), accepted/lore-4.png (calm lower band).

### lore-6 notes
- Wrong: (1) mottled stucco sky texture as above; (2) it is NOT the lightest plate of the set: the whole upper two thirds is mid-to-dark navy with a thin pink band. Make the horizon area genuinely luminous: wash-rose, gold-light and parchment-cream rising to about y 45 percent, with ink-800 only in the top 20 percent; (3) the observatory is oversized and floating on a roof-terrace plane with an unexplained wall: shrink it to match the distant silhouette scale used in lore-4/lore-5 (about 18 to 22 percent of canvas width, as seen from the terrace) or keep it large but with correct ground contact and perspective (door, windows, dome slit aligned as in accepted/observatory-building.png); stone value must be dawn-lit, not flat grey; (4) the two figures are hooded, near-black cloaks with an uncanny shapeless hood: keep them as simple silhouettes but lighter (ink-700 to slate) so they read against the wall, with mitten-simple hands and the gold key glint as the brightest small point; (5) one eight-ray gold-leaf star at upper right is fine (x 78 percent, y 18 percent) but make it a touch larger (about 24 px across); (6) keep paving as quiet large slabs, but lighter rose-navy so the plate stays light; caption band y 1167 to 1536 stays calm and a mid rose-navy.
- Match: accepted/key-art.png (smooth glazes), accepted/lore-5.png (silhouette scale), accepted/observatory-building.png (building).

### feature-graphic notes
- Wrong: (1) serrated polygon nebula as above (most visible failure, clear even at 50 percent size); (2) the stone is pale and flat, with a bluish-white cast, not the shaded stone of accepted/observatory-building.png: restore its value structure (cool stone lit side, stone-shade on the right planes); (3) the gold star is tiny and lost inside the rose nebula, reading as a speck: place it on clear dark sky, directly above the dome toward the centre (x 55 to 62 percent, y 22 to 30 percent), eight-ray, about 16 to 20 px across; (4) ridge layers: the near hill is a flat black mass with no pines of consequence and the far ridge is a pale ramp; paint two clear ridges (ink-700 far with a thin wash-teal rim, ink-950 near) and 6 to 10 pines clustered at the left and right; (5) building must sit ON the ridge with a base line at y 84 percent and a small contact grass/stone edge, as in key-art (low stone wall pieces allowed at its sides).
- Keep: building at right third, dome and slit, lamp-lit window, left 55 percent calm, star count (80 to 140 dim varied dots).
- Match: accepted/key-art.png (sky and ridge), accepted/observatory-building.png (building).


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

- Save every image as PNG to `<batch>/round-<n>/out/<assetId>.png` (this round: `b5/round-4/out/<assetId>.png`) with the EXACT asset ids listed above, at the exact generation size stated per asset. One file per asset; no extra files in `out/` other than `manifest.json`.
- Transparent assets: 8-bit RGBA PNG, straight alpha, corners and the outer 3 percent border fully transparent. Opaque assets: PNG with no alpha channel (or alpha 255 everywhere).
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is the file name (for example `lore-1.png`), `model` is the generator used, `prompt` is the full final prompt (and the reference images used), `size` is `"WIDTHxHEIGHT"`, `transparent` is a boolean, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.
