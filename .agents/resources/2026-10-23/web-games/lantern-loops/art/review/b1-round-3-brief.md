# Lantern Loops - batch b1 (STYLE ANCHOR), round 3 (revision of rejected assets)

Read `../../art-bible.md` first. Round 2 rejected ALL four assets (see `../round-2/review/review.md`, with zoom crops `z-*.png` in that folder). This brief repeats each asset's original spec plus precise revision notes. Generate `lantern-amber` FIRST: once accepted it is the construction anchor that `icon` and `key-art` must reuse. If you cannot produce an asset to standard, deliver the best subset; a missing slot is better than slop. No accepted assets exist yet.

Everything not listed under "Revision notes" stays as specified originally.

Recommended order: `lantern-amber`, then `icon` and `key-art` (reuse the lantern), then `backdrop-harbor`.

## Assets

| assetId (file) | Aspect class | Generation size | Background | Used for |
|---|---|---|---|---|
| `icon` (`icon.png`) | square 1:1 | 1024x1024 | opaque | App icon and splash source |
| `key-art` (`key-art.png`) | portrait 2:3 | 1024x1536 | opaque | Boot and Home background, splash source |
| `lantern-amber` (`lantern-amber.png`) | square 1:1 | 1024x1024 | transparent | Lists, chapter cards, win sheet; the lantern anchor |
| `backdrop-harbor` (`backdrop-harbor.png`) | portrait 2:3 | 1024x1536 | opaque | Harbor puzzle screens and puzzle list |


## lantern-amber

- Purpose: the anchor lantern. It is the clue object of every Harbor puzzle and the most-used image in the game (lists, chapter cards, win sheet). All other lanterns copy its construction exactly.
- Subject: one festival paper lantern in straight-on front elevation, built exactly as bible section 8: rounded barrel body of five vertical translucent paper panels with thin darker ribs, amber body (#F2A33A mid, #FFD68A light core, #B9661A deep edge and shade side), lacquer top and bottom caps (#2B1F3A with a thin paper-2 rim on the top-left), short hanging cord with a small loop above, short tassel below (bead plus 5 to 7 stepped strands). In the centre of the body a single crisp circular cut-out window (about 24 percent of the body width), the brightest spot (light core near #FFF1CF), geometrically exact. Lit from within: warm bright centre, richer toward the edges and the right/bottom shade side. Paper fibre texture on every sheet, thin paper edge (rim light top-left, darker bottom-right).
- Composition: transparent, 1024x1024. Vertical axis of symmetry at x = 50 percent. Proportions per bible section 8: cord loop top at 6 percent of the height, top cap 18 to 22 percent, body 22 to 72 percent, bottom cap 72 to 77 percent, tassel end at 91 percent. Body width about 58 percent of the canvas. Whole object inside the central 88 percent; outer 4 percent border fully transparent. Lower 10 percent (tassel) holds only simple strands, no fragile detail.
- Must-nots: no text, letters, numbers or markings on the paper; no outer glow, halo, bloom, sparkle or light rays; no cast shadow or ground; no outline stroke; no gloss or glassy highlight; no second glyph; the window must be a perfect circle (not an ellipse, not a sun face); no face; asymmetric ribs; cord that does not touch the cap; unequal tassel strands that look like hair.
- Self-check: at 48 px it must read as "amber lantern with a bright dot"; the caps give it a strong silhouette; over night #12132E the body is the brightest thing.

### Revision notes (round 2 verdict: REJECTED)

Round 2 was REJECTED. KEEP: the circular window, five panels and four ribs, colours and stepped-tone intent, tassel (bead + 6 stepped strips), layout proportions (cord loop top about 6 percent, tassel end about 91 percent), clean alpha. FIX, all binding:
1. CORD AND LOOP: the current hanger is a rigid pin with a ring (metal hook look). Draw a short, thin, FLAT lacquer (#2B1F3A) paper cord strip with a very slight natural curve (not a ruler-straight rod), tied into a small closed loop made of the same strip (a loop that is a folded paper strip, not a perfect round metal ring), joined to the exact centre of the top cap with a small flat paper knot or tab. No metallic sheen.
2. CAPS ARE 3D DISCS: top and bottom caps currently show an elliptical top face (tilted perspective) and a tan metallic rim. Make each cap a FLAT front-elevation lacquer rectangle with slightly rounded ends (orthographic: no visible top face, no ellipse), thin paper-2 (#E4D2B0) rim only on the top-left cut: a short crisp line along the top edge's left half plus the left end, not a bright sweep along the whole top edge. Same cap height as now.
3. BODY RENDERING: replace the airbrushed smooth gradient with STEPPED flat translucent planes: in the centre panel a light core (#FFD68A) step, then mid (#F2A33A), then deep (#B9661A) on the outer panels, each plane with a visible thin paper edge; no soft airbrush blending between planes (subtle within-sheet drift of about 8 percent is fine). Keep the paper fibre texture.
4. BODY SHAPE: make the barrel read as a barrel, not a ball: body about 58 percent wide and about 50 percent tall, straighter sides near the caps (the silhouette slightly wider at the middle but with the cap-to-body joins as wide as the caps, about 38 percent of the canvas), outer panels narrower than in round 2 so five panels are clearly legible.
5. Keep outer 4 percent and corners alpha 0, no semi-transparent interior, no halo, no cast shadow.
Match: nothing accepted yet; this lantern becomes the anchor for the other five lanterns, so prioritise a clean flat cut-paper construction.

## icon

- Purpose: the app icon. Must say "a glowing lantern" instantly at 48 px. Shown through adaptive masks (circle, squircle, rounded square) beside polished store icons.
- Subject: one hero amber lantern (the accepted `lantern-amber`, same construction, same glyph window) hanging in the centre of a deep dusk field. Behind it, a calm paper-cut dusk: a field of night/indigo (#12132E to #1E2050) with 2 large concentric cut-paper discs behind the lantern (like a rising moon made of layers) in indigo-light (#2B2F78) and plum (#3A2A5E), and one thin teal (#0E5A5F) paper wave band across the bottom third (two layers at most) with a soft layer shadow. The lantern casts a warm tint on the nearest disc edge only (spill within one lantern radius). Three major shapes: dark field with discs, amber lantern, teal wave.
- Composition: front view, light top-left, layer shadows down-right. Full-bleed square: the field is painted to every edge (no pre-rounded corners). All essential content (lantern and the discs' focal area) inside the central circle of 62 percent of the canvas width (about 635 px diameter), centred. Lantern height about 52 percent of the canvas, centred at about 49 percent height; its cord can start at about 18 percent. The lantern is the brightest and most saturated mass; the background corners carry quiet texture only.
- Values: lantern body light, discs and field dark, wave band mid-dark. Strong silhouette: dark caps against the lighter discs.
- Must-nots: no text or letters of any kind, no border, no inner frame, no rounded-corner mask baked in, no drop shadow, no gloss, no outer glow bloom, no sparkles or stars scattered around, no extra lanterns, no boats, no rope loop, no gradient "app-icon" sheen, no glowing neon rim. It is a paper-cut scene, not a badge.

### Revision notes (round 2 verdict: REJECTED)

Round 2 was REJECTED mainly because its lantern inherited the rejected anchor. KEEP: the composition (discs 64 and 51 percent, wave band, lantern about 52 percent tall inside the central 62 percent circle), the tassel clearance of at least 3 percent of the height above the wave, wave with visible paper edge, full-bleed square with no border, no text. FIX:
1. Re-render the lantern from the ACCEPTED round-3 `lantern-amber` (flat caps without elliptical tops, flat paper cord with small loop, stepped planes, barrel body). If `lantern-amber` is not accepted, do NOT deliver the icon (a missing slot is better than a lantern that differs from the anchor).
2. COLOURS: the outer disc is too bright and saturated (about #283688); use indigo-light #2B2F78 exactly (a muted dark-indigo step, clearly less luminous than the lantern), and the inner disc a true plum #3A2A5E (currently brownish #402D3C at the top). The lantern must be the single brightest and most saturated mass at 48 px.
3. Keep field night #12132E to #1E2050 with quiet paper texture only in the corners.
Match: the accepted `lantern-amber` (round 3).

## key-art

- Purpose: the cover of the game: boot screen, Home background, splash source. The title and the buttons are added by code; the image must feel like the cover of a premium paper-craft game.
- Subject: a harbor at dusk as a layered paper-theatre scene. Centre: a dark lacquer mooring post at the end of a short pier rising in the lower-middle, with the hero amber lantern (same design as `lantern-amber`) hanging from a bracket on the post. From the post a gently sagging garland rope runs left and another runs right to two lower posts at the edges, carrying 3 smaller amber lanterns on each side (same construction, smaller, varied heights, not identical copies). Behind: 3 layers of still indigo water as cut-paper wave bands (indigo #1E2050, indigo-light #2B2F78, teal #0E5A5F accents), broken amber reflection bars under the lanterns (horizontal cut-paper strips), 2 or 3 small moored boats (simple hulls and one paper-2 sail each, lacquer silhouettes) far back, and a far shore of low dock roofs and masts in dark indigo-mist with 2 or 3 tiny amber lamp dots. Sky: night/indigo with a few flat cut-paper cloud strips; no stars.
- Composition and safe areas (percent of 1024x1536): TITLE BAND y 0 to 28 percent (0 to 430 px): calm, low-detail dark indigo sky with at most one faint cloud strip; mean value dark so cream title text will contrast; no subject, no lantern, no strong shape. SUBJECT ZONE y 28 to 78 percent (430 to 1198 px): the hero lantern with its focal point near x 50 percent, y 50 percent; the garland spans x 12 to 88 percent. BUTTON BAND y 78 to 100 percent (1198 to 1536 px): calm dark foreground water layers and pier planks, low detail, mid-dark value; the lantern reflection may start fading at about y 76 percent. Keep everything essential inside the central 70 percent of the width (x 15 to 85 percent); the outer 15 percent each side is cropped on tall phones and may carry boats, posts and roofs as decoration.
- Mood: the quiet moment just before the evening lanterns are lit one by one; warm, hopeful, calm.
- Must-nots: no text, no title, no signboard or banner, no logo, no UI, no board/grid/tiles/stones, no people, no animals or birds, no smoke, no rain, no fire, no stars or sparkles, no bokeh or lens flare, no glow bloom or god rays, no vignette, no frame/border, no oversized copy-pasted lanterns of identical size, no coloured lanterns other than amber, no recognisable existing game or artwork. Water is cut-paper bars, not a photographic reflection.

### Revision notes (round 2 verdict: REJECTED)

Round 2 was REJECTED. KEEP: empty calm title band (no mountains), calm dark button band, flat lacquer posts with paper-2 top-left edges, thin catenary cords, amber broken reflection bars, flat cut-paper water sheets with visible edges, low roofs/masts with 3 tiny lamps, small boats with one sail. FIX, all binding:
1. LANTERN CONSTRUCTION: hero and six small lanterns must be re-rendered from the ACCEPTED round-3 `lantern-amber` (flat cap rectangles without elliptical top faces, flat paper cord + small loop, stepped planes, barrel body). The hook on the hero must be that cord, not a ring or pin. If `lantern-amber` is not accepted, do NOT deliver the key-art.
2. COMPOSITION: put the main post and bracket so the hero lantern's axis sits at x = 50 percent and the post is clearly in front of or beside it with intent: e.g. the post at x about 50 percent, hero hanging from a short bracket on its left or the post centred directly behind the hero with the lantern in front. Left and right garlands must be balanced (a smooth catenary of similar sag to the two outer posts at x about 8 and 92 percent). No small lantern may touch, overlap or sit tangent to the main post; keep at least 4 percent of the width of air between any small lantern and the post.
3. PIER: give the centre post a base: a short flat lacquer pier (two or three flat, wide cut-paper sheets forming a short jetty, no planks and no wood grain) rising from the foreground layers up to the post, so the post stands on something. Keep all essential content within x 15 to 85 percent.
4. SCALE AND IMPACT: enlarge the hero lantern to about 30 percent of the canvas width (still clearly the biggest object, small ones about 12 to 14 percent, varied heights and sizes, not copies); add a clear step of difference between the three water bands, and give the roofline a few more low roofs and masts in the centre gap (still all above y 590, nothing above y 430).
5. Keep: top 430 px empty, bottom 338 px calm and dark, no stars, no glow bloom.
Match: the accepted `lantern-amber` (round 3) and the same paper edge/texture.

## backdrop-harbor

- Purpose: background of the Harbor chapter puzzle screens and its puzzle list. The code-drawn puzzle board sits on top, in the centre, on a translucent panel; this image must stay calm there. First chapter, the most-seen backdrop.
- Subject: a harbor at dusk as a layered paper-theatre scene, same world as `key-art` (same water layers, same boat/post language, same amber lamp style). Top band: a far shore skyline of low dock roofs, warehouse gables and thin masts in indigo-mist (#3B3F8F) over a night-indigo sky, with 2 or 3 tiny amber lamp points (under 1.5 percent of the width each). Board zone: nothing but large calm still-water paper bands (indigo #1E2050, indigo-light #2B2F78, night #12132E) with a few very low-contrast broken reflection bars; no boats, no lamps, no posts in the zone. Bottom band: dark foreground pier planks and a lacquer mooring post and a rope coil at the left and right margins only, two layers of near-black indigo paper with soft layer shadows.
- Composition: frontal paper-theatre view, light top-left, shadows down-right. Safe-zone map per bible section 13: top band y 0 to 16 percent (detail allowed, mid-dark), board zone y 17 to 77 percent and x 5 to 95 percent (calm, low contrast, mean luminance 12 to 28 percent, no detail brighter or sharper than 8 percent value difference), bottom band y 78 to 100 percent (darker, low detail). Side margins (outer 15 percent) may carry boats and posts at full richness but nothing essential. Horizon line (shore) in the top band at about y 12 percent.
- Mood: still, amber-lit, nautical; lamp-lit docks at dusk.
- Must-nots: no text, no boat names, no signs, no people, no animals or birds, no lanterns larger than 7 percent of the width, no bright glints in the board zone, no moon, no stars, no sparkle, no bokeh, no vignette, no frame/border, no baked board or grid, no strong centre focal point, no warm fill across large areas.

### Revision notes (round 2 verdict: REJECTED)

Round 2 was REJECTED on one point. KEEP exactly: the shore (flat roofs, thin masts, exactly 3 tiny lamps, all above y 246), the board zone (three calm still-water sheets, mean luminance about 12 percent, faint cool reflection strips, edge contrast below 8 percent), paper texture and edges. FIX:
1. MOORING POSTS AND ROPE COILS: the corner "coils" are single bevelled elliptical rings that look like metal washers and make the posts read as keyholes. Replace each with a flat paper coil built as 3 stacked flat, stepped, low-contrast lacquer paper strips (like a short stack of 3 horizontal rounded bars of decreasing width) lying against the post foot, no ellipse, no ring, no bevel, no inner hole, no shading ramps; or, if that cannot be done cleanly, deliver the posts with NO coil. Posts stay flat lacquer #2B1F3A rounded-rectangle paper cuts with a thin top-left paper-2 edge, at the extreme left and right margins (inside x 0 to 14 percent and 86 to 100 percent), tops below y 1210.
2. Make the two bottom sheets cooler and darker: near-black indigo (about #181A3C to #14153A), not brownish plum (current about #231A30), with the same visible thin paper edge.
3. Do not add anything to the board zone, and do not change the shore.
Match: the accepted `lantern-amber` (round 3) for edge and texture; keep the key-art round 3 style language for posts.

## Delivery contract

- Save every image as PNG to `b1/round-3/out/<assetId>.png` with the EXACT asset ids listed above (`icon`, `key-art`, `lantern-amber`, `backdrop-harbor`), at the exact generation size stated per asset. One file per asset; no extra files in `out/` other than `manifest.json`.
- Transparent assets: 8-bit RGBA PNG, straight alpha, corners and the outer 4 percent border fully transparent. Opaque assets: PNG with no alpha channel (or alpha 255 everywhere).
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is the file name, `model` is the generator used, `prompt` is the full final prompt (and reference images used), `size` is `"WIDTHxHEIGHT"`, `transparent` is a boolean, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know. Keep `notes` concise (the round 1 notes were unwieldy). Do not post-process colours globally; fix problems in the generation.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.
