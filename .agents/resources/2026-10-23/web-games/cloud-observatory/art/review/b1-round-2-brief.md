# Cloud Observatory - batch b1 (STYLE ANCHOR), round 2 of 4

Read `../../art-bible.md` first. Round 1 had 0 of 4 accepted; this round contains ALL four assets again. Read `../round-1/review/review.md` for the full critique. Shared fixes for every asset: (1) remove the tessellated oil-paint/filter texture and use fine uniform ~3 px paper grain plus smooth transparent watercolour; (2) gold must be the matte two-step foil ramp (#EBCB85 / #D8A94B / #A47C30), never lemon-yellow, beveled or glossy; (3) keep the round-1 compositions, which were sound. Recommended order: observatory-building, emblem-lyre, then key-art and icon using the new building as the reference image.

## Assets

| assetId (file) | Aspect class | Generation size | Background | Used for |
|---|---|---|---|---|
| `icon` (`icon.png`) | square 1:1 | 1024x1024 | opaque | App icon, favicon, splash |
| `key-art` (`key-art.png`) | portrait 2:3 | 1024x1536 | opaque | Title screen background |
| `observatory-building` (`observatory-building.png`) | square 1:1 | 1024x1024 | transparent | Observe tab foreground sprite |
| `emblem-lyre` (`emblem-lyre.png`) | square 1:1 | 1024x1024 | transparent | Atlas card, journal; style anchor for all 12 emblems |

## icon


- Purpose: the app icon. Must say "observatory + a bright star in a deep blue night" instantly at 48 px. Shown through adaptive masks (circle, squircle, rounded square) next to polished store icons.
- Subject: one hero composition. The accepted observatory's brass dome with its open slit and telescope tip, seen close and cropped (dome cap and the top of the slate roof only, no full house), at the lower centre; the telescope points up-left toward ONE large luminous gold star (a soft eight-ray hand-painted gold-leaf star, rays of two lengths, with gold-light core) at the upper right of the dome, about 16 percent of the canvas width. Behind: a deep navy wash (ink-950 at the top to ink-700 at the base) with a single soft teal-and-rose watercolour bloom around the star and 3 to 5 tiny dim star dots. Three major shapes only: dome, star, wash.
- Composition: full-bleed square, painted to every edge. ALL essential content (dome, telescope tip, star) inside the central circle of 62 percent of the canvas width (about 635 px diameter), centred; the focal gold star at about (62%, 36%), the dome at about (44%, 68%). Corner areas carry quiet wash and paper grain only (masks will crop them).
- Values: the star and the gold dome are the brightest mass, the sky dark, so the pair reads at 48 px. Keep a 40 percent value gap between the dome's lit side and the sky.
- Must-nots: no text or letters, no pre-rounded corners, no border, no inner frame, no glossy app-icon gradient or bevel, no glow halo bigger than the star, no lens flare, no sparkle clusters, no constellation lines, no moon, no people.

### Round 2 revision notes for icon

- Fix the aim: the telescope tube must visibly point at the gold star (place the star on the telescope axis, up-left of the dome at about (36%, 40%), OR keep the star upper right and make the telescope point up-right; the tube must aim at the star). The brief's older 'up-left toward star at upper right' was contradictory; this note overrides it. Keep the dome and star inside the central 62 percent circle.
- Roof: the slate roof must be a small, calm, dark wedge under the dome only (eye-level, matching the building's roof, not a big pyramid seen from above); corners stay quiet wash.
- Star: hand-laid gold-leaf star with matte two-step foil (gold-light core blending into gold-leaf rays, gold-shade on lower-right edges), faint crackle; no flat pale disc core, no vector clip-art look. Rays of two lengths, soft uneven edges like cut foil.
- Sky: keep the current watercolour sky quality (it is the best part) but remove the tessellated oil-filter texture; smooth pigment pooling and fine paper grain only.
- Dome: match the accepted building dome once accepted; until then match the round-1 dome construction (ribs, slit aligned with axis, collar).

## key-art


- Purpose: title-screen background. The game title ("Cloud Observatory") and the four buttons are added by code; the image must feel like the cover of an antique atlas.
- Subject: the accepted Observatory (art bible 8.1, use the accepted `observatory-building` as a reference so it is the same design) standing small on a dark ridge at the lower middle, under a vast navy night sky painted with soft watercolour nebula washes (teal and rose, restrained, wet-in-wet) drifting diagonally from the upper left toward the middle right; about 40 to 70 tiny dim pigment-dot stars; ONE slightly brighter gold star above the dome (not a spiked sparkle). The dome slit is open, the telescope tip aims toward that star, one window lamp-lit in lamp-glow. Two or three simple pine silhouettes and a low stone wall on the ridge. The rest is calm.
- Composition and safe areas (percent of 1024x1536): TITLE BAND y 0 to 30 percent (0 to 460 px): deep, calm ink-950 to ink-900 sky with only the faintest wash and 6 to 10 very dim dots; NO subject; the mean value must be dark because parchment/gold title text is drawn here. SUBJECT ZONE y 30 to 78 percent (460 to 1198 px): nebula washes upper part, the star, the observatory with its base at about y 72 percent, focal point (dome and lamp-lit window) near x 50 percent, y 58 percent, building height about 30 percent of the canvas height. BUTTON BAND y 78 to 100 percent (1198 to 1536 px): calm ridge and ground in ink-950/ink-900 with low detail and no light, so buttons can sit on it. Left and right 6 percent margins calm.
- Mood: the first quiet clear night; hushed anticipation, the sky is faint but not dead.
- Must-nots: no text or title, no UI, no constellation lines or star-map diagram, no moon, no sun, no people or animals, no birds, no smoke, no lightning, no aurora in this image, no vignette, no frame or border, no lens flare, no bokeh, no hard-edged galaxy swirl, no wallpaper-style rainbow nebula.

### Round 2 revision notes for key-art

- Remove the tessellated oil-paint texture everywhere (sky, nebula, ridge). Nebula must be smooth transparent wet-in-wet watercolour with soft blooms and fine paper grain; the ridge a calm dark wash with few simple tufts, no scribble.
- Stone walls: tone down to cool stone/stone-shade (#7F86A0 / #4A5272), much less lavender saturation, no pink/teal blotches; the gold dome and the lamp-lit window must be the brightest warm mass, the building must not outshine them.
- The gold star above the dome must be readable at 360 px wide (about 12 to 16 px at 1024 wide, soft gouache gold-light dab with a tiny cross of paint, still NOT a spiked lens flare); the telescope must visibly aim at it.
- Remove any trio or cluster of stars that reads as a constellation (the three dots near (520,148)); vary spacing.
- Use the re-delivered observatory-building as the reference for the house. Keep: composition, title band and button band calm and dark, three pines, low wall, building scale (about 30 percent of height, base at 72 percent).

## observatory-building


- Purpose: the hero sprite on the Observe tab (320 x 320 CSS px), standing on the horizon-hills layer at the bottom centre, under the live sky (tap target for Gather); it is also the reference for the building in key-art, icon and feature-graphic.
- Subject: the fixed building of art bible 8.1: compact three-storey cool stone keeper's house, steep slate roof, one stone chimney at the top-left, a flat roof terrace carrying a round brass-clad dome with an open vertical slit and a brass telescope tip pointing up and slightly left, a tall arched timber door with a brass handle, two narrow arched windows with one softly lamp-lit (lamp-glow), a broad low stone step. Brass in the three-step gold ramp, slate and stone cool with teal fill-light in shadows, ink contour, parchment/gold-light rim on the top-left edges so it reads on navy.
- Composition: transparent 1024x1024. Frontal 3/4 view (about 10 degrees), light from the top-left. Building 66 to 74 percent of the canvas width, 82 to 88 percent of the canvas height, base line at 92 percent of the height, at least 5 percent clear above the telescope tip. The right side wall visible slightly. The top-left quarter of the building (chimney, roof edge) is solid; no fragile detail within 8 percent of the right edge (a tap-ripple overlays it).
- Must-nots: no text, no number on the door, no sign, no weathervane, no flag, no smoke from the chimney, no ground, grass or path, no cast shadow, no glow around the lit window beyond a soft 20 px warm wash on the glazing, no people, no stars baked into the dome slit, no lightning rod mess, no ivy, no stained-glass pattern, no mirror gloss on the dome, no halo.

### Round 2 revision notes for observatory-building

- Stone: replace the lavender/rose/teal mottling with cool stone (#7F86A0 lit, #4A5272 shadow) in a few clear value steps; teal only as a low-strength fill in the lower-right shadows; at most 2 or 3 subtle warm-grey stains, no opal blotches. Lower saturation overall.
- Line: ink contour #121830 of 3 to 5 px at 1024, thicker on the shadow side and under overhangs, thinner and slightly broken on lit edges; interior lines 2 to 3 px; keep a thin parchment/gold-light rim on top-left edges.
- Technique: remove the tessellated filter texture; use smooth watercolour glazes with fine ~3 px paper grain; gold dome as matte two-step foil with faint crackle, not hammered/dimpled.
- View: reduce the right wall to a slim sliver (about 10 degrees from frontal, front face clearly dominant) and keep the base line perfectly horizontal at 92 percent (no sloping or flaring right corner); resolve the roof/tower junction with a clear flashing or parapet so the gable roof visibly abuts the tower.
- Keep: silhouette, chimney top-left, lit window and door, dome and telescope construction, scale (66-74 percent wide, 82-88 percent tall, tip at least 5 percent below top), clean alpha edge, transparent margins.

## emblem-lyre


- Purpose: the anchor of the 12 constellation emblems (Atlas card, 144 x 144 CSS px, also 48 and 96 px in lists). Defines the frame of art bible 8.2 for all the others.
- Subject: the Lyre. A classical U-shaped lyre in frontal elevation: two curving arms rising from a rounded sound-box base, joined by a crossbar near the top, FIVE straight strings running from the crossbar to the base, small scroll-curl ends at the top of each arm. Gold-leaf with engraved lines (gold-deep), a single parchment accent highlight on the top-left arm. Perfectly symmetrical left-right in construction; only the painted light differs.
- Composition: the frame exactly as art bible 8.2: transparent 1024x1024; outer ring r 450 to 480 px; navy watercolour disc; hairline ring r 428 to 434; the lyre centred with a bounding box about 500 px tall by 400 px wide; transparent outside r 480 px (corners and the 32 px border fully alpha 0).
- Must-nots: no text, no zodiac or musical-note glyphs, no stars, no constellation dots or lines, no extra ornaments, no ring tick marks, no inner glow, no drop shadow, no mirror gloss, no more than 5 strings, no asymmetry between the two arms, no hands or figures.

### Round 2 revision notes for emblem-lyre

- Gold: use the bible ramp, matte hand-laid foil: base #D8A94B, lit planes #EBCB85 only on the top-left, shade #A47C30 on bottom-right, faint crackle and flake edges; NO bevel/emboss, no specular highlights, no lemon-yellow; the outer ring must use the same foil.
- Symmetry: construct the lyre as an exact mirror (same scroll, same hole size, same junction knob, no seam or crack on the left arm); only the painted light may differ left to right.
- Engraving: add gold-deep/gold-shade engraved lines (3 to 4 px) along the arms (one centre groove per arm), around the scroll spirals, on the crossbar ends and three bands on the sound box; keep it bookplate-simple, no filigree. One small parchment accent highlight on the top-left arm.
- Disc: remove the tessellated texture from the navy wash; smooth watercolour with fine paper grain, soft teal bloom upper left and rose bloom lower right under 25 percent opacity.
- Keep exactly: frame radii (ring 450-480 with inner shadow line bottom-right and gold-light line top-left, hairline 428-434 in gold-shade), five strings, figure bbox about 500 x 400 px centred, transparent outside r480.

## Delivery contract


- Save every image as PNG to `<batch>/round-<n>/out/<assetId>.png` (this round: `b1/round-2/out/<assetId>.png`) with the EXACT asset ids listed above, at the exact generation size stated per asset. One file per asset; no extra files in `out/` other than `manifest.json`.
- Transparent assets: 8-bit RGBA PNG, straight alpha, corners and the outer 3 percent border fully transparent. Opaque assets: PNG with no alpha channel (or alpha 255 everywhere).
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is the file name (for example `emblem-lyre.png`), `model` is the generator used, `prompt` is the full final prompt (and the reference images used), `size` is `"WIDTHxHEIGHT"`, `transparent` is a boolean, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.
