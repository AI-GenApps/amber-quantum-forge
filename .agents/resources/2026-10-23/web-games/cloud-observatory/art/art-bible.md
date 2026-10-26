# Cloud Observatory - art bible (v1)

Audience: the designer (image-generation agent). Read this whole file before any brief. Every asset in every batch must obey it. The bar is a featured, award-calibre mobile game, not "good for AI". When in doubt, simplify: fewer, better-placed brush marks and one confident focal point per image.

Sources of truth: the game spec (artStyle, artAssets), `product.md` and `assets-index.md` (palette tokens, screens), `content-plan.md` (constellations, instruments, lore chapters).

## 1. What the game is (so the art can serve it)

A quiet incremental game. The player inherits a rooftop observatory from their Aunt Verity. Each night they tap the sky for starlight, buy brass instruments, ink 12 constellations into an atlas and read her logbook (6 story chapters) to learn why the sky grew quiet. Prestige is an "Eclipse".

Important division of labour:
- CODE draws all star maps: stars, tap targets, numbered stars, constellation lines, the Comet, glows, twinkles, the Eclipse ring, the UI chrome (cards, buttons, tab bar), all text. Gold constellation lines on navy are SVG, never baked into an image.
- YOU paint: an app icon, a title key-art, the observatory building sprite, 12 constellation emblems, three sky backdrop layers, 8 instrument sprites, 6 story vignettes and a store feature graphic. None of them may contain a star-chart, a constellation diagram, tap-target-like star markers, text or UI.

## 2. Mood

Hushed, luminous, handmade. An antique celestial atlas that someone loved: ink on deep blue paper, hand-laid gold leaf, soft watercolour nebulae pooling like breath on cold glass. Elegant and restrained, warm company inside a vast cold dark. Wonder without spectacle; nostalgia without sepia cliche. A single small warm lamp-glow is the human note. No faces on mascots, no cuteness, no horror, no sci-fi glare, no fantasy-glitter.

Emotional arc across the lore vignettes (same hand, different hour): dusk -> lamplit interior -> library warmth -> dimming sky returning -> eclipse hush -> dawn.

## 3. Palette (hex, binding)

The UI uses these tokens (they are in `assets-index.md`). Sample them; never invent a neighbouring "almost" palette.

| Token | Hex | Role in art |
|---|---|---|
| ink-950 | #0B1226 | deepest dark: sky zenith, deepest silhouette, deepest crevice (never pure black) |
| ink-900 | #101A33 | the page background of the app; main sky body, key-art title band |
| ink-800 | #172445 | card surface; mid sky, emblem disc rim, shadow side of dark masses |
| ink-700 | #22335C | raised surface; emblem disc centre, lit side of navy masses, far ridges |
| parchment | #F3E9D2 | lightest light: highlights, vellum, dust sheet, tiny star cores. Warm, never pure white |
| parchment-dim | #C9BFA4 | parchment mid, paper shade |
| muted | #A39E8F | stone-grey, secondary neutral |
| gold-leaf | #D8A94B | the signature accent: gold leaf, brass mid-tone, the main lamp colour |
| gold-light | #EBCB85 | gold highlights, lit brass edges, brightest star |
| wash-teal | #6FB3BD | watercolour nebula wash, glass, aurora, verdigris |
| wash-rose | #D98BA0 | watercolour nebula wash, dawn, aurora edge |
| danger | #F08A78 | UI wrong-tap colour: do NOT use in art except as a faint dawn-horizon warm tint in lore-6 |
| success | #8FCB9B | UI charted colour: only as a faint aurora green in lore-4 and aurora-coil |

Extended art colours (allowed, derived from the family, muted, gouache-and-watercolour like):

| Name | Hex | Used for |
|---|---|---|
| gold-shade | #A47C30 | shade side of gold/brass, engraved grooves in gold |
| gold-deep | #6E5020 | deepest brass shadow, line colour inside gold areas |
| ink-line | #121830 | pen line colour (deep blue-black, never pure black) |
| slate | #3A4660 | slate roofs, dark stone planes |
| slate-light | #55648A | lit slate, lit stone edge |
| stone | #7F86A0 | cool masonry, lit side |
| stone-shade | #4A5272 | masonry shadow side |
| copper | #B8693F | copper winding (aurora-coil only) |
| copper-shade | #7E4126 | copper shadow |
| lamp-glow | #F2C879 | the single warm lamp / lit-window accent; small areas only |
| dust-sheet | #D9D0B8 | canvas dust sheet (lore-1, telescope tripod cloth) |
| umber | #6B4A33 | wood only (telescope tripod, archive cabinet, desk, ladders); shade #43301F |

Hard colour rules:
- Blue-dominant scenes: the overall value structure is dark navy with a LIGHT, warm, gold focal point. Gold/lamp-glow is the most luminous warm mass; parchment is the most luminous overall (tiny areas only).
- Maximum 5 distinct hue families per asset (navy, gold/brass, plus at most teal, rose, and one of stone/copper/green). Saturation low to mid. No neon, no cyan, no purple-magenta gradients, no "galaxy wallpaper" rainbow.
- Teal and rose appear ONLY as watercolour washes (soft, low opacity, pigment-pooled) or as glass/aurora; never as solid flat object colour except the prism/lens glass and aurora ribbon.
- No pure black (#000), no pure white (#FFF), no pure red.
- Greyscale test: every sprite must keep a clear light-to-dark read in greyscale (lit gold edge, mid brass, dark shade).

## 4. Rendering technique: ink, watercolour and gold leaf on blue paper

One technique across the whole game. Think a hand-bound atlas: deep navy-toned cold-press paper (visible fine paper grain at low contrast), ink drawing, transparent watercolour washes, and matte gold leaf.

- Ink: fine dip-pen line with slight weight variation, used for contour on sprites and for hatching in shadow. Line colour ink-line #121830 on light objects; gold-deep #6E5020 inside gold areas.
- Watercolour: wet-in-wet washes with pigment granulation, soft bloom edges (a "cauliflower" back-run at the margin of a wash), and hard-edged dried pools. Used for sky, nebulae, hills, shadows on stone. Layered glazes, translucent. Not airbrushed, not smooth digital gradients.
- Gold leaf: matte-satin hand-laid foil: flat gold-leaf #D8A94B base, 2 value steps (gold-light highlight, gold-shade shade), faint crackle and tiny flake edges at the margins. NOT mirror chrome, not specular gloss, not a metallic gradient bar, not glitter.
- Value steps: 3 per material (light, mid, shade) plus at most one small accent highlight. Confident shapes first, texture second.
- Paper grain: very subtle, uniform in scale across all assets (the grain feature size is about 3 px at 1024 and must be the same everywhere). It must never create visible tiling.
- Stars (when part of a backdrop or vignette) are tiny pigment dots / gouache dabs, not glowing lens-flare sprites. No four-point diffraction spikes, no bokeh, no lens flare.

## 5. Line and edge treatment

- Sprites (building, instruments): an ink contour of about 3 to 5 px at 1024 (about 0.4 percent of canvas width), thicker on the shadow side and under overhangs, thinner on lit edges; broken slightly like a pen, not vector-uniform. Interior detail lines 2 to 3 px. Plus a thin gold-light or parchment rim on the lit (top-left) edges so the silhouette reads on a navy card.
- Emblems: no ink contour. Gold-leaf shapes with engraved interior lines (gold-deep / gold-shade, 3 to 4 px) like a bookplate engraving.
- Backdrops and vignettes: no outlines on large masses; shapes are defined by value and wash edges. Small figures and objects may have a loose ink edge.
- Transparent assets: crisp, clean painted edge (feathering no wider than 2 px). No outer glow, no soft halo, no drop shadow, no white or dark fringe.
- Opaque assets: paint to every edge. No borders, no frame, no vignette darkening, no paper-edge deckle, no stamp.

## 6. Lighting

- Sprites and emblems: key light from the TOP-LEFT, a soft cool fill from the lower right (wash-teal at low strength in shadows). Shadows fall down-right. Gold gets gold-light on the top-left planes and gold-shade on the bottom-right planes.
- Scenes (key-art, feature-graphic, vignettes): there is no sun or moon. Light sources are only (a) starlight/nebula ambient cool light from above, (b) the single warm lamp-glow where the story needs it, (c) the dawn tint in lore-6, (d) the corona in lore-5. Warm lamp light falls from its source with believable direction; cold ambient light comes from above-left.
- Never mix a second, unexplained light direction. No god rays, no lens flare, no volumetric spotlights.

## 7. Camera and view rules per asset class

| Class | View |
|---|---|
| observatory-building | Eye-level frontal 3/4 (about 10 degrees from frontal, right side slightly visible), looking very slightly up so the dome feels tall. Base on a flat implied baseline, no ground plane painted |
| instruments | Product-plate view: eye-level, very slightly from above (about 15 degrees), object centred, base flat on an implied baseline at 88 percent of the height. No ground, no table |
| emblems | Flat, frontal, heraldic: the figure is drawn in elevation like a bookplate (profile or frontal, never perspective) |
| backdrops (sky-far, nebula-mid, horizon-hills) | Flat landscape elevation, horizon at about 70 percent of the height; no perspective grid |
| key-art, feature-graphic | Eye-level frontal wide view of the observatory on its ridge, sky taking 65+ percent of the frame |
| lore vignettes | Each defined in its brief: cinematic but calm, eye-level or slightly low, one focal point at the optical third |

## 8. Fixed constructions (so the set matches)

### 8.1 The Observatory (hero building, one fixed design)
Used in building, key-art, icon, feature-graphic and echoed (distantly) in lore-1, lore-4, lore-5 and lore-6. A compact three-storey stone keeper's house, slightly narrower at the top, with a steep SLATE pitched roof (slate #3A4660 with slate-light edge), ONE brick-free stone chimney at the top-left, and on the ridge side a flat roof terrace carrying a round BRASS-CLAD DOME (gold-leaf with gold-shade ribs) whose vertical slit is open and from which the tip of a brass telescope tube points up and slightly left. Cool stone walls (stone / stone-shade), a tall arched timber door with a brass handle, two narrow arched windows, ONE of them softly lamp-lit (lamp-glow). A small iron weathervane is forbidden (reads as text/clutter). Build the door and windows symmetrical where symmetry is expected; the dome must be a clean sphere cap; the slit must align with the dome axis.

### 8.2 The emblem frame (identical for all 12 emblems)
Canvas 1024 x 1024, transparent corners. All measurements are from the canvas centre (512, 512):
- Outer ring: matte gold-leaf band, radius 450 to 480 px (30 px thick), with a faint inner shadow line on its bottom-right and a gold-light line on its top-left.
- Disc: filled to radius 450 px with a watercolour navy wash: ink-700 #22335C at the centre easing to ink-800 #172445 at the rim; at most one soft teal bloom (upper left) and one soft rose bloom (lower right) at under 25 percent opacity. No stars, no dots.
- Hairline ring: gold-shade, 6 px thick, at radius 428 to 434 px.
- Figure: gold-leaf with engraved detail, centred on the optical centre, its bounding box between 440 and 560 px on the long side and never closer than 70 px to the hairline ring. One figure, one light direction (top-left).
- Outside radius 480 px: fully transparent (the 4 corners and the 32 px border).
Because the 12 emblems sit side by side on atlas cards, the frame must be pixel-for-pixel the same construction in all 12 (same radii, same ring weight, same wash colours); only the figure differs. Re-use the accepted emblem-lyre as the reference image for every other emblem.

### 8.3 Brass
All brass and gold objects use the same three-step gold ramp (gold-light #EBCB85, gold-leaf #D8A94B, gold-shade #A47C30, deepest gold-deep #6E5020), the same restrained satin finish, the same level of engraved detail (a few knurled bands, riveted collars, never ornate filigree).

## 9. Transparent sprite construction rules

- Object plus all of its parts must be fully inside the canvas with a transparent margin of at least 3 percent (31 px) on every side.
- Alpha must be real (RGBA PNG). The four corners and the whole outer 3 percent border are alpha 0.
- No baked checkerboard, no coloured matte, no halo, no fringe, no semi-transparent stray pixels floating off the object, no baked ground shadow.
- Interior translucency (glass in lens, prism, aurora ribbon) is allowed ONLY inside the object silhouette.
- Soft watercolour layers (nebula-mid) are the one exception: they have deliberately soft alpha, but the outer 4 percent border must still be fully transparent and there must be no banding.
- Verify by compositing every transparent asset on ink-900 #101A33 AND on parchment #F3E9D2 and on bright magenta; edges must stay clean on all three.

## 10. Scale rules

| Asset | Footprint on its canvas | Notes |
|---|---|---|
| observatory-building | building 66 to 74 percent of canvas width, height (base to dome top) 82 to 88 percent of canvas height, base line at 92 percent of the height | sits on hills in the Observe screen; keep the telescope tip at least 5 percent below the top edge |
| instruments | object 74 to 82 percent of the canvas on its larger dimension, optically centred, base line at 88 percent | all 8 must look equally "big"; sibling visual weight within 15 percent of each other |
| emblems | figure bounding box 440 to 560 px (see 8.2) | |
| horizon-hills | content only in y 66 to 100 percent of the height | above 64 percent the alpha is 0 |
| lore figures | people never taller than 18 percent of the canvas height, always seen from behind or as a silhouette | |

## 11. How each asset is used in the UI (display size and what overlays it)

Bundled art is WebP at 2x the display size. All displays are CSS px in a portrait layout (typical 360 wide). Judge readability at 1x CSS size.

| Asset | Display | What overlays or sits next to it |
|---|---|---|
| icon | launcher 48 to 192 px, store icon; masked circle/squircle/rounded square | nothing. Content must live in the central circle of diameter 62 percent (635 px) |
| key-art | 360 x 540 (cover) Title screen | Logo/title text in parchment/gold in the TOP BAND (y 0 to 30 percent), buttons (Continue, New Journey, How to Play, Settings) in the BOTTOM BAND (y 78 to 100 percent) |
| observatory-building | 320 x 320 on the Observe tab | sits on horizon-hills at the bottom centre; the header (starlight total) is above, tab bar below; tap sparkles (code) rise over the sky |
| emblem-* | 144 x 144 on Atlas cards (also journal, 48 and 96 px in lists) | a code-drawn card (ink-800), the constellation name below in parchment, a small status chip at the top-right corner of the card, NOT on the emblem. Locked state: the emblem is drawn at 35 percent opacity with a grey filter |
| sky-far | full-bleed cover, behind everything on Observe and Chart Table | header band (top 12 percent) holds text; tab bar (bottom 9 percent); the Chart Table puts gold SVG stars and lines in the middle 80 percent |
| nebula-mid | full-bleed parallax layer over sky-far | tap-star sparkles and gold lines over it; it must never reduce text/star contrast |
| horizon-hills | bottom-anchored, full width | observatory-building stands on its centre, tab bar over its bottom 9 percent |
| instrument-* | 112 x 112 in the Build row | row card (ink-800); name and cost text to the right; owned-count badge at the object's top-right corner (keep it calm) |
| lore-1..6 | 300 x 450 chapter card, journal header | chapter number and title in parchment over the BOTTOM 24 percent of the image (keep that band calm and darker); a close button top-right |
| feature-graphic | store feature graphic, no text in the art | store may crop to the central 90 percent; the right part holds the observatory |

## 12. What to avoid (hard fail list; this is the review rubric)

1. Any text, letters, numbers, runes, zodiac or astronomical symbol glyphs, signatures, logos, watermarks, clock-face digits, written lines on a chart or book, labels on drawers, scale markings with numerals. Books, scrolls, maps and vellum must show only blank or abstract pigment marks, never script-like squiggles.
2. Anatomy and construction errors: warped, melting or merging objects, impossible geometry, wrong perspective, brass parts that do not connect, lenses that float, gears that do not mesh, asymmetry where symmetry is expected (lyre arms, crown, lantern cage, owl, tower, orrery rings), extra or missing limbs, hands with wrong finger counts, uncanny faces, animals with wrong anatomy, ships that cannot float.
3. Style drift: line weight, texture, light direction, gold treatment or paper grain differing from the batch anchor and from every accepted asset. A single asset that looks "from another set" is rejected.
4. Unreadable at display size (check 1x CSS): mush, thin hairline details carrying the meaning, low-contrast silhouettes, too many tiny elements.
5. Technical faults: wrong aspect or size, baked checkerboard, halo or fringe, non-zero corner alpha on sprites, borders/frames/vignettes on opaque assets, JPEG artefacts, banding in gradients, tiling grain.
6. Composition faults: subject inside a title band or button band, a busy backdrop centre where the star map/board sits, key objects outside the safe area, not enough calm at the overlay zones.
7. Generic AI tells: plastic or mirror gloss on brass, airbrushed sameness, random sparkles, bokeh, lens flare, depth-of-field blur, god rays, galaxy-wallpaper rainbow swirls, over-saturation, muddy gradients, symmetrical-clone stars, "fantasy storybook" glow, inconsistent shadows, meaningless filigree, every edge lit by the same rim glow.
8. Purpose failures: an instrument that cannot be told from a sibling at 48 px (silhouettes in section 14); an emblem whose figure is not instantly the named constellation figure; a backdrop whose stars look like tappable chart stars; a sprite that reads as a toy.
9. Originality and copyright: no recognisable characters, brands, famous artworks, real constellation-chart plates copied (the figures are original drawings), no copy of an existing game's art. Generic antique-atlas aesthetic only.
10. Also forbidden everywhere: constellation lines or dot-and-line star maps, UI of any kind inside the art, moon discs (the sky is moonless, to keep the Eclipse special), planets with rings in sky backdrops (the orrery may show small planets), spaceships, UFOs, astronauts, smoke, fire, sci-fi glow, lightning.

## 13. Backdrop and sky rules (sky-far, nebula-mid, horizon-hills, scenes)

| Layer | Content | Rules |
|---|---|---|
| sky-far (opaque) | ink-950 at the top easing through ink-900 to ink-800/ink-700 near the horizon at 70 to 85 percent height; a faint warm-teal haze just above the horizon; 60 to 120 tiny dim stars as pigment dots (1 to 4 px at 1024, parchment at 25 to 60 percent), irregular spacing, NO patterns or clusters that resemble the 12 constellations, no star brighter than 6 px | brightest, most detailed area at the very bottom; the middle 80 percent stays calm because the Chart Table puts gold stars there |
| nebula-mid (transparent) | 2 to 4 soft watercolour wash masses in wash-teal and wash-rose, wet-in-wet, with pigment pooling; overall coverage under 45 percent of the pixels above alpha 10 percent; peak alpha 55 percent | no hard edges, no stars, no centre blob; leave the bottom 30 percent nearly clear |
| horizon-hills (transparent) | 3 receding ridges, far = ink-700, mid = ink-800, near = ink-950; thin cool rim light on the top edges of the far ridges (wash-teal at 40 percent); tiny pine silhouettes allowed, no buildings, no lights | alpha 0 above y = 64 percent; a gently flatter shelf at x 30 to 70 percent and y 78 to 84 percent where the building stands |

Backdrops are quiet supporting players; the gold SVG stars must always be the brightest, crispest thing on the Chart Table.

## 14. Distinctness map (siblings must be readable apart at 48 px)

- Instruments, by silhouette: telescope = long diagonal tube on tripod (a single slash); lens = wide flat rack of three round lenses (a row of circles); prism = triangle plus a fan of colour (a wedge); orrery = concentric rings with a central ball (a target); star-map = squat press with a screw handle and a vellum sheet (a block with a T); beacon = tall post with a cone lantern and a beam wedge (a tall T); archive = tall cabinet with rows of small drawers and a scroll (a tall rectangle grid); aurora-coil = a vertical copper coil with a ribbon rising (a spring plus ribbon).
- Emblems, by figure: lyre (U + strings), crown (zig-zag circlet), key (ring + shaft + one tooth), lantern (hexagon cage with ring), whale (profile mass + spout + flukes), harp (right-angle frame + strings), fox (profile with huge brush), archer (bow + arrow, no person), serpent (S-curve), ship (hull + sail), tower (stepped tiers + spire + flag), owl (frontal, ear tufts).
- Lore vignettes differ by dominant colour and place: 1 slate roof dusk (navy + dust sheet), 2 interior brass (gold-dominant), 3 library (warm amber-parchment dominant), 4 dimming sky (teal and green aurora), 5 eclipse (near-black with a thin gold-white ring), 6 dawn (rose and gold, lightest of the set).

## 15. Production notes for the designer

- Generate each image at the stated size in one pass where possible. For transparent assets, use native transparent output if the model supports it; otherwise generate on a flat key colour that does not occur in the object (flat #FF00FF magenta suits most of these gold/navy/teal objects; avoid magenta for objects with rose washes and use flat #00B140 green there; never key out an object with teal glass or aurora green on green), remove the key cleanly, decontaminate edges, and record the method in `notes`.
- Re-use accepted assets as reference images: observatory-building for key-art, icon, feature-graphic; emblem-lyre for the other 11 emblems; the first accepted instrument for the other 7.
- A reusable style preamble to put at the start of EVERY prompt (then add the asset-specific part): "Hand-painted antique celestial atlas page: deep navy cold-press paper grain, fine dip-pen ink line, transparent watercolour washes with pigment granulation and soft blooms, matte hand-laid gold leaf with faint crackle. Palette strictly: #0B1226 #101A33 #172445 #22335C navy, #F3E9D2 parchment, #D8A94B and #EBCB85 gold, #A47C30 gold shade, #6FB3BD teal and #D98BA0 rose washes. Restrained, elegant, luminous, quiet. Key light from the top-left. No text, no letters, no numbers, no constellation lines, no logos, no watermark, no glow effects, no sparkles, no lens flare, no plastic gloss."
- Write the full final prompt (including that preamble) into `manifest.json`.

## 16. Self-review checklist before delivering (the reviewer will run it too)

1. Build a contact sheet per batch at 1x CSS: emblems at 48, 96 and 144 px on ink-800; instruments at 56 and 112 px on ink-800; building at 320 px on a navy backdrop with the hills; backdrops at 360 px wide with the header band (top 12 percent) and tab bar (bottom 9 percent) overlaid as rectangles; key-art at 360 x 540 with the title band and button band overlaid; vignettes at 300 x 450 with the bottom 24 percent caption band overlaid; icon at 48 and 96 px and masked to a circle.
2. Run the rubric in section 12 point by point; reject your own failures and regenerate.
3. Compare each new asset side by side with the batch anchor and every previously accepted asset: line weight, paper grain, gold treatment, light direction, saturation.
4. Check alpha with a script (corner and border alpha 0, no checkerboard, no semi-transparent specks); composite on ink-900, parchment and magenta.
5. Confirm exact pixel size and aspect class.
6. Only then write `manifest.json` and deliver.

When unsure, regenerate. A rejected asset costs a round; a weak accepted asset costs the game.
