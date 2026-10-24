# Cloud Observatory - batch b5, round 2 (revision)

Round 1 result: lore-2, lore-3, lore-4 and lore-5 were ACCEPTED (now in `accepted/`; compare against them and against `accepted/key-art.png`, do not regenerate them). Only the three assets below are rejected and must be redelivered. Read `../../art-bible.md` first.

Match these accepted assets for technique, palette and finish: `accepted/key-art.png` (smooth watercolour sky and nebula, the texture reference), `accepted/observatory-building.png`, `accepted/instrument-telescope.png`, and `accepted/lore-4.png` / `accepted/lore-5.png` (calm dark caption bands and clean small silhouettes).

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

## Revision notes

### All three assets
- TEXTURE (the main defect, applies to every sky, cloud, nebula, ground and stone surface): the accepted key-art (`accepted/key-art.png`) is the reference. Its sky is smooth transparent watercolour: wet-in-wet glazes, soft blooms, pigment pooling, a barely visible uniform 3 px cold-press grain. Your round-1 output instead carries a faceted oil-paint / Kuwahara / mosaic filter texture (small scalloped, polygonal and pixel-like patches of 6 to 12 px across the whole sky and nebula). Remove it entirely: prompt explicitly for 'smooth transparent watercolour glazes, no oil paint, no impasto, no mosaic, no Kuwahara, no polygon facets, no hammered or dimpled texture, paper tooth microscopic', and if a pass still shows facets, run a targeted native edit to repaint the sky/nebula as smooth washes. Do not fix by blurring or adding an overlay filter; the wash edges must stay hand-painted with soft blooms and hard dried-pool edges.
- Keep what worked: the composition, focal points, palette, caption bands and the clean small-object ink line are all acceptable. Change the surface treatment, not the layout, unless a note below says so.

### lore-1 notes
- REJECTED for: (1) faceted oil-filter texture across the whole sky and the rooftop slates, clearly noisier than accepted key-art; (2) the surface reads as a flat flagstone terrace with a parapet, not the brief's sloped slate roof in perspective; (3) the key lies beside the lifted tile rather than half under it.
- Change: repaint the sky as smooth watercolour glazes (dusk rose and gold band at the horizon easing into ink-950, the teal cloud band much softer and with soft blooms, not a streaky filter smear). Make the foreground a slate ROOF pitch (rows of overlapping slate shingles, the roof ridge visible at the upper edge, slight slope towards the viewer) with slate #3A4660 and a slate-light edge, and the pale dust-sheeted telescope on tripod at the left third (keep the current dust sheet and tripod, they read well). Slide the brass key so it is genuinely half tucked under a lifted slate tile at the lower left, with the blank folded note beside it, no flap lines that could read as writing. Keep the single tiny warm window in the distant house, the 8 to 14 pigment-dot stars, no people, no moon. Bottom 24 percent stays calm and no lighter than ink-800.
- Match: accepted/key-art.png (sky treatment), accepted/instrument-telescope.png (brass tripod fittings).

### lore-6 notes
- REJECTED for: faceted mosaic/oil-filter texture throughout the sky, clouds, mountains, water and paving, the strongest of the batch and plainly from another hand than accepted key-art; at 300 x 450 the clouds read as pixel noise.
- Change: repaint the dawn sky as smooth wet-in-wet watercolour (ink-800 at the top through wash-rose and gold-light to a parchment-cream horizon), soft cloud blooms with a few hard dried edges, no scalloped patches. Keep it the lightest plate of the set. Keep the composition: observatory silhouette at the left, two simple silhouettes (kneeling adult offering the small brass key to a standing child), key glint at x 60 percent, y 72 percent, the single eight-ray gold-leaf star at the upper right (same size, round matte gold-leaf, no diffraction). Simplify the distant village and ridge detail so the sky and the figures stay the focus; paving as large quiet stone slabs with soft wash values rather than texture noise. The adult's hood should be a plain silhouette (no visible cheek or nose line); both figures stay under 18 percent of the canvas height, no faces, mitten-simple hands. Caption band stays calm and dark.
- Match: accepted/key-art.png (watercolour handling), accepted/lore-5.png (small silhouette and lamp-glow treatment), accepted/lore-4.png (dark calm lower band).

### feature-graphic notes
- REJECTED for: faceted mosaic texture over the whole nebula and sky (the nebula reads as pixelated tessellation, not watercolour), nebula rose too strong and saturated directly behind the building, observatory spills slightly past the right-third span (x 60 to 87 percent, should be 66 to 86), and the single brighter gold star is a tiny flat dot that does not read as the focal star.
- Change: repaint the nebula as two or three soft wash-teal and wash-rose glazes in the manner of accepted key-art and nebula-mid, lower rose saturation, with the rose passage kept off the dome silhouette so the gold dome stays the brightest warm shape. Keep the left 55 percent calm. Place the observatory (accepted observatory-building design, unchanged, with chimney top-left, dome slit open, telescope aimed up-left, one lit window) within x 66 to 86 percent with its base at y 84 percent. Make the ONE brighter gold star above the dome slightly larger (about 10 to 14 px, round matte gold-leaf dab with a soft wash halo no wider than 2x, no spikes), toward the centre. Keep 80 to 140 dim irregular pigment-dot stars, two ridge layers (ink-800, ink-950) and a few pines. Stone walls and ground: smooth wash with accepted-building stone treatment, no dimpled texture.
- Match: accepted/key-art.png and accepted/observatory-building.png exactly for building design and watercolour sky.

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

- Save every image as PNG to `<batch>/round-<n>/out/<assetId>.png` (this round: `b5/round-2/out/<assetId>.png`) with the EXACT asset ids listed above, at the exact generation size stated per asset. One file per asset; no extra files in `out/` other than `manifest.json`.
- Transparent assets: 8-bit RGBA PNG, straight alpha, corners and the outer 3 percent border fully transparent. Opaque assets: PNG with no alpha channel (or alpha 255 everywhere).
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is the file name (for example `lore-1.png`), `model` is the generator used, `prompt` is the full final prompt (and the reference images used), `size` is `"WIDTHxHEIGHT"`, `transparent` is a boolean, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.

