# Dress Rehearsal - art bible (v1)

Audience: the designer (image-generation agent). Read this whole file before any brief. Every asset in every batch must obey it. The bar is a featured, award-calibre mobile game, not "good for AI". When in doubt, simplify: fewer, bolder, better-placed brush shapes. A set must look as if one illustrator painted all 63 images in one week with the same gouache set and the same marker.

Sources of truth: the game spec (artStyle, artAssets), `product.md` (screens, board, palette tokens), `content-plan.md` (pieces with colour tags, clients, chapters) and `assets-index.md` (slot list, scale rules, display sizes), all in `.agents/games/dress-rehearsal/` of the game worktree. Where this bible is more specific than those, this bible wins; where the briefs are more specific than this bible, the brief wins.

## 1. What the game is (so the art can serve it)

A calm, witty fashion-styling puzzle. A client hands the player a creative brief ("warm colours only, nothing newer than the 70s, spend at most $330"). The player drags garments and accessories from a closet tray into 6 to 8 slots on a flat-lay lookbook board (no body, no mannequin, no hanger). A transparent rule engine scores the look 1 to 3 stars, and the finished board is exported as an image and shared. Six chapters (themes), each with one recurring client and one accent colour:

| # | Chapter / theme id | Client (bust slot) | Accent | Mood |
|---|---|---|---|---|
| 1 | Riviera Summer / `riviera` | Mireille Vasseur, travel writer (`client-1`) | sky `#2b6a9a` | salt air, linen, long lunches |
| 2 | Rainy City / `rainy-city` | Tobias Okafor, storm photographer (`client-2`) | ochre `#7f5f00` | grey day, sharp edges, wet leaves |
| 3 | Gala Night / `gala` | Dame Ottoline Frost, opera patron (`client-3`) | red `#a1281f` | black tie, gold light, raised eyebrow |
| 4 | Mountain Weekend / `mountain` | Priya Raman, mountain guide (`client-4`) | green `#2c6a48` | cold clear air, packed exactly right |
| 5 | Studio Avant-garde / `studio` | Jun Aoki, gallery curator (`client-5`) | violet `#6a3fa0` | pressed cloth, sculptural, precise |
| 6 | Vintage 70s / `vintage` | Edie Lindqvist, vintage shop owner (`client-6`) | rust `#a4491a` | second-hand sunshine, corduroy, suede |

Everything that is UI is drawn by code: slots, rule chips, harmony meter, stars, buttons, name plates, text, the board grid, frames of the export image. Your art never contains UI, a grid, a board outline, slot outlines, text or numbers. Generated art is ONLY: the app icon, the title key-art, 48 flat-lay closet pieces, 6 client busts, 6 board backdrops and the store feature graphic. Every slot has a code-drawn fallback, so quality matters more than quantity: a missing image is better than a poor one.

## 2. Mood

Editorial fashion illustration, the kind in a good magazine's styling pages or a designer's lookbook: confident, witty, grown-up, warm. Gouache and marker on warm paper. Calm, premium, a little playful. Sophisticated MUTED colour (never neon, never candy), one accent colour per chapter, plenty of breathing space around objects. Think "hand-painted spread in a printed lookbook", not "glossy 3D product render", not "kawaii", not "fantasy concept art", not "stock vector clip-art".

Emotional range: Riviera = sunny and easy; Rainy City = cosy, dry-witted; Gala = grand and a little stern; Mountain = crisp, practical; Studio = precise, sculptural; Vintage = nostalgic and warm. Same hand, same paper, different wardrobe.

## 3. Palette (hex, binding)

Sample these values; do not invent a neighbouring "almost" palette. Lightness steps are painted as flat gouache layers, not airbrushed gradients.

### 3.1 Game tokens (from `product.md`)

| Token | Hex | Role in art |
|---|---|---|
| ink | `#231d1a` | contour and detail marker line, deepest shadow tint (never pure black) |
| ink-soft | `#5a4e46` | secondary lines, folds in dark garments |
| paper | `#f6efe4` | lightest light, highlight dabs, card colour |
| paper-2 | `#ebe0cc` | secondary light, bright linen |
| linen | `#e2d5be` | the flat-lay board surface: the mean colour of every backdrop |
| hairline | `#78674f` | UI slot outlines (the UI draws it over your backdrops; do not paint anything that competes with it) |
| night | `#1c1816` | app background; icon ground |
| blush | `#e9c9bf` | soft warm highlight panels |
| mist | `#d3dde0` | soft cool highlight panels |

### 3.2 Chapter accents (one per chapter, one per backdrop)

sky `#2b6a9a`, ochre `#7f5f00`, red `#a1281f`, green `#2c6a48`, violet `#6a3fa0`, rust `#a4491a`. (Note: `assets-index.md` names the accents loosely as sky, yellow, red, green, violet, orange; the hex values above, taken from `product.md` and `content-plan.md`, are what counts.) Use an accent as a quiet wash in a backdrop ring and in one or two small props; never as a large saturated field.

### 3.3 Garment colour tags (the colour a piece is painted in MUST match its tag)

The rule engine reads the `colour` tag from the content plan, so a "sky" shirt must read as sky blue, a "cream" blouse as cream, "navy" as navy and not black, "grey" as grey and not silver-blue. Paint the mid-tone as the body colour; use the light tone for lit planes (top-left facing) and the deep tone for shade planes (bottom-right facing and under folds).

| Tag | Mid (body) | Light | Deep | Notes |
|---|---|---|---|---|
| white | `#f8f4ea` | `#fffdf7` | `#d8d0c0` | warm white, never pure `#ffffff`; must separate from linen by contour and shadow |
| cream | `#f0e4c8` | `#f8efdb` | `#cdbd96` | clearly warmer and yellower than white |
| black | `#2b2624` | `#5b514c` | `#161210` | lifted black; shapes are described with lighter planes, never a flat black blob |
| grey | `#8f8c88` | `#b4b1ac` | `#5f5c58` | neutral warm grey |
| navy | `#27345a` | `#43548a` | `#161e38` | clearly blue-dark, not black |
| tan | `#c39a68` | `#dcb98b` | `#8f6a3f` | camel, straw, suede |
| red | `#b5322a` | `#d6574a` | `#7e1f1c` | true red, not orange, not pink |
| orange | `#d97a2c` | `#ef9d55` | `#9c4d17` | rust-orange variant `#c4601f` allowed for corduroy |
| yellow | `#e3b030` | `#f4d378` | `#a97d14` | mustard `#d6a52b`; gold `#d6a634` (light `#f1d27a`) |
| lime | `#8b9040` | `#adb35f` | `#5a5e22` | olive-lime |
| green | `#2f6b4a` | `#4f8f6a` | `#1d4430` | forest green |
| mint | `#93cdb4` | `#bde5d2` | `#5a9c82` | pale cool green |
| teal | `#2b7d7e` | `#52a3a2` | `#1a5254` | blue-green |
| sky | `#7db4d9` | `#a9d0e8` | `#4a82ad` | pale blue |
| blue | `#2d5bb5` | `#5780d0` | `#1b3c82` | cobalt |
| violet | `#6d4aa6` | `#9374c6` | `#47297a` | purple |
| magenta | `#b52a82` | `#d4579f` | `#7c1b58` | strong pink-purple |
| pink | `#ebb7b0` | `#f5d3cd` | `#c58880` | blush |

Secondary colours inside a piece (stripes, soles, straps, buckles, ribbons) come from the same table or from: brass `#c9a24a`, leather brown `#9a6b3e`, wood `#b0834f`, rope/jute `#c39a68`, chrome `#b4b1ac` with `#e8e6e1` highlight. A piece has one main colour (its tag) plus at most two secondary colours.

## 4. Rendering technique and materials

- Medium: opaque gouache for flat colour fields, applied in confident single strokes with visible but controlled brush direction; marker (felt-tip / brush pen) for contour and details. Think a skilled illustrator's finished spread, scanned.
- Shading is stepped: base mid-tone, one lighter plane (light), one darker plane (deep). Two or three flat layers per shape. Occasional dry-brush drag at an edge to show texture. NO smooth airbrushed gradients, NO soft digital blends across a whole shape, NO glossy specular blobs.
- Fabric hints, not fabric simulation: a few hand-drawn marks tell the material (knit: short V stitches near neck and cuffs only; corduroy: 10 to 14 wide wales; denim-like twill: none; suede: matte dabs; satin: two long vertical highlight ribbons; velvet: dry-brush matte with lifted edges; linen: a handful of short slub dashes; felt: soft fuzzy edge; wax canvas: mottled lighter streaks; rubber: two flat pale highlight shapes). Never a full tiled texture, never meaningless micro-detail. Detail must survive at 96 px.
- Paper: opaque assets (icon, key-art, backdrops, feature graphic) show warm paper grain and a light linen weave under the paint. Transparent assets carry a trace of paper grain inside the gouache fills only (no paper background).
- Colour is muted and sophisticated: saturation of every area at or below the swatch values above. No neon, no pure `#ff0000`/`#00ff00`/`#0000ff`, no pure black or pure white.

## 5. Line and edge treatment

- Contour: warm ink `#231d1a` marker line around every garment and prop, slightly irregular hand-drawn weight. At the 1024 px master: contour 7 to 10 px, interior detail lines (seams, plackets, folds, stitches) 3 to 5 px, never thinner than 3 px. Lines may be gently broken, may overshoot by a hair at corners, and vary in pressure. They are NOT uniform vector strokes.
- On dark garments (black, navy) the contour is `#161210` or a lifted edge line in the light tone; shapes are separated by lighter planes. On very pale garments (white, cream) the contour stays ink so they separate from linen and from transparent surroundings.
- Stitching and seams: dashed marker line, 3 to 4 px, evenly spaced.
- Edges of gouache shapes are crisp with slight natural wobble. No outer glow, no soft feathered outline, no white halo, no colour fringe on transparent assets.
- Backdrops and key-art: props are painted softly with little or no ink contour (they must recede); garments in key-art follow the full contour rules.
- Face drawing for clients: a few confident marker strokes (brows, eye line, nose shadow, lips); skin is flat gouache planes with a light and a deep plane; no pores, no airbrushed skin.

## 6. Lighting and shadow

- One light source for every asset: soft, from the TOP, very slightly from the top-left (about 11 o'clock). Lit planes face top-left; shade planes face bottom-right.
- Garment highlights: light-tone planes along top-left folds and shoulders; deep-tone planes under folds and along bottom-right edges. Same contrast for every piece so a set of pieces looks lit by one studio lamp.
- Contact shadow (transparent pieces): one very soft, low-contrast shadow directly under and slightly to the bottom-right of the piece, as a flat wash of ink `#231d1a` at 10 to 18 percent opacity, offset no more than 1.5 percent of the frame, with a soft edge. It must fade to fully transparent at least 2 percent of the frame (about 20 px) before the frame edge. No cast shadows with long length, no second shadow, no reflection. The shadow must not read as a grey rectangle or an oval plate. The UI builds locked-silhouette views from alpha, so the shadow must stay well below 20 percent alpha.
- Backdrops: even, soft top lighting; no vignette, no spotlight, no dramatic gradient. Brightness across the calm centre varies by at most a few percent.

## 7. Camera and view rules per asset class

- Garments (top, bottom, dress, outer): flat-lay shot straight from above, orthographic, no perspective, the garment lying flat and symmetrical about the vertical centre axis (exact symmetry unless the design is deliberately asymmetric: origami top, drape dress, wrap skirt, tied bows). Sleeves relaxed and slightly out. No hanger, no mannequin, no body, no hands, no model, no wrinkles beyond 3 to 5 deliberate soft folds.
- Rigid objects (shoes and boots, bags, hats, sunglasses): still arranged on the table and shot from above; they may show the same fixed lean of up to 20 degrees towards the viewer so their form reads (a hat's crown dome, a boot's collar, a bag's front face). The lean is IDENTICAL for every rigid piece. Shoes and boots are always a pair, side by side, parallel, toes up, left and right correct mirror images.
- Long accessories (umbrella, scarf, necklaces, cuff): laid flat from directly above; umbrella and scarf on a gentle diagonal from lower-left to upper-right (handle or start at lower-left).
- Client busts: head-and-shoulders, front-on with at most a 10 degree turn of the head, eyes looking to the viewer, neutral studio pose, hands out of frame, shoulders ending in a hand-brushed fade (not a straight crop edge).
- Backdrops and key-art top surfaces: straight-down flat-lay of linen on a table. Key-art composition uses the same overhead camera.
- Never a three-quarter product shot, never a 3D render, never isometric.

## 8. Scale rules and construction (identical for every piece, every theme)

The garment's bounding box (excluding its soft contact shadow) is a MAXIMUM on a 1024 x 1024 frame, centred, with a transparent margin on all sides. Keep the garment's natural proportions; never stretch it to fill the box; but it must touch the box limit on at least one axis (within 5 percent), so a pair of shorts and a gown follow one scale logic.

| Category | Orientation | Max width | Max height |
|---|---|---|---|
| top | sleeves out, neck up | 80% | 70% |
| bottom | legs straight, waist up | 55% | 88% |
| dress | full length, straight | 62% | 92% |
| outer | sleeves relaxed, collar up | 84% | 80% |
| shoes | one pair, side by side, toes up | 78% | 62% |
| bag | upright, strap tucked | 60% | 62% |
| hat | crown up | 78% | 62% |
| accessory | laid flat | 52% | 52% |

Notes: (a) The bottom (88 percent) and dress (92 percent) heights exceed an 85 percent safe area; the table wins, and the margin on those two classes is 4 to 6 percent top and bottom, which is why the contact shadow is kept tight there. Everything else stays inside the 85 percent safe area. (b) The fixed values make pieces comparable on the board: a hat is never as big as a coat. (c) The frame centre is the bounding box centre. (d) Short bottoms (skirt, culottes) hit the width limit and are shorter than 88 percent.

Construction checks that apply to every piece: both sleeves/legs/shoes/lenses/straps/earrings are the same size and shape (mirror symmetry unless asymmetric by design); buttons evenly spaced, same size, round; zips, plackets and seams run straight and join logically; collars attach to the neckline; no extra or missing limbs of the garment; no objects fusing into each other; pairs do not overlap.

## 9. Transparent sprite construction rules

- PNG, 8-bit RGBA, straight (not premultiplied) alpha. Corners and the outer 4 percent border fully transparent (alpha 0).
- The silhouette edge is clean: no checkerboard pattern baked in, no white or grey halo, no fringe of the former background colour, no semi-transparent haze around the shape.
- Cut-out method: generate on a flat, uniformly coloured background that does not occur in the object, remove it with a clean matting step, and verify at 400 percent against both linen `#e2d5be` and night `#1c1816`. A light object (white, cream, pearls) must not pick up a fringe on linen; a dark object must not show light fringes on night.
- Interior holes (between legs, handles, between pearls on a necklace, inside a strap loop) are truly transparent, not filled with background colour.
- The only partial alpha allowed is the soft contact shadow (max 18 percent) and the anti-aliased edge.

## 10. How each asset is used in the UI (display size and overlays)

| Asset class | Master / runtime | Where and how big | What overlays it |
|---|---|---|---|
| `item-*` (48) | 1024 sq / 256 px WebP | closet tray cards (about 96 to 128 CSS px), board slots (min 88 px cell, image about 64 to 80 px), Closet grid, export image (up to about 300 px) | slot outline, name label under it, tag icons, an "On board" badge in a corner, a selection ring and a hint glow; locked state is a grey silhouette built from the alpha channel |
| `client-*` (6) | 1536 x 2048 / 360 x 480 px | brief sheet, result sheet and Clients screen at about 180 x 240 CSS px | name plate across the bottom 15 percent; speech line beside/below; a chapter-accent frame drawn by the UI |
| `backdrop-*` (5) + `backdrop-studio` | 1600 x 2400 / 800 x 1200 px | behind the board grid (cover-fitted into a roughly square board container, so mainly the central vertical band y 20 to 80 percent shows, all of the width), as the export image surface (cropped to 4:5, y 8 to 92 percent visible), and as 48 px chapter-card thumbnails | 3-column grid of slots with 60 percent paper-coloured fills and a dashed `#78674f` outline, pieces on top |
| `key-art` | 1600 x 2400 / 800 x 1200 px | Home hero (small, as low as about 120 to 360 px wide), boot screen, splash source (cover-cropped to tall phones, so the central 66 percent of the width is always visible) | game title in Playfair Display (drawn by the app) across the top third; menu buttons below |
| `icon` | 1024 sq | app icon via @capacitor/assets (circle, squircle and rounded masks), splash badge | nothing; the platform masks the corners |
| `feature-graphic` | 1536 x 1024 | store feature graphic, cropped to about 2.05:1 (1024 x 500) | nothing; no text in the art |

Check every asset at its real size: pieces at 64, 96 and 128 px; clients at 180 x 240; backdrops at 48 px thumbnail and in a 360 x 330 board crop; icon at 48 and 96 px; key-art at 120 px wide and full.

## 11. What to avoid (hard fail list; this is the review rubric)

1. Text, letters, numbers, signatures, logos, brand marks, watermarks, tags with writing, ticket or postcard writing, price labels, book spines. None unless a brief asks (no brief asks).
2. Anatomy or construction errors: wrong hands, fused or extra fingers (hands should not appear at all), uneven eyes or ears, teeth, odd necks, asymmetric pairs of shoes, sleeves that do not join the body, melting seams, impossible folds, objects that merge, perspective that disagrees with the camera rule.
3. Style drift: a different line weight, a different rendering technique (3D, vector, watercolour wash, photoreal), a different lighting direction, a different camera, a different scale rule. Judge every asset side by side with the accepted anchors.
4. Mush at display size: tiny pattern noise, hairline strokes under 3 px at master, low-contrast silhouette, detail that disappears at 96 px.
5. Technical faults: wrong aspect or size; a transparent asset with a baked checkerboard, halo, fringe, opaque corners or a solid background; an opaque asset with a border, frame or letterbox bar.
6. Composition faults: content in the title band, backdrop props in the calm centre, key content inside the platform-mask margin of the icon.
7. Generic AI tells: plastic gloss, airbrushed sameness, random sparkles, stars, glints or bokeh, glitter, meaningless micro-detail, inconsistent light sources, muddy gradients, over-saturation, uncanny or waxy faces, "AI-pretty" symmetrical blandness, trendy neon gradients.
8. Purpose faults: a piece that does not read instantly as its category and colour (a top that looks like a dress, a "blue" bag that reads navy, a "grey" clutch that reads silver-blue), or that is not distinct from its siblings (the black trail boots vs the black rubber boots; the cream cable-knit vs the grey jumper).
9. Originality: no recognisable copyrighted characters, brands (no Burberry check, no swoosh, no three stripes, no red-sole shoes), famous artworks or real celebrities. Garments are generic archetypes; clients are original people.
10. Props or elements that break the rules of the board: no body, mannequin, hanger (except the icon's hanger), hands or feet anywhere.
11. Overly dramatic or crowded scenes. This game is calm; negative space is a feature.

## 12. Client identity sheet (the busts)

Six original people, one visual family: same gouache and marker technique, same bust framing, same light, same 3/4-length simplification of the face. Each is drawn once as a NEUTRAL bust; that accepted neutral is the identity master for any later expressions (face, hair, outfit and framing must then match exactly).

Common framing (on the 1024 x 1536 canvas; the 3:4 content frame is the centre region y 85 to 1450, everything outside it is transparent): crown of the head at about y 230, chin at about y 760 (head about 34 percent of the canvas height), eye line at about y 440, shoulders widest at about y 1100 spanning about 80 percent of the width, the bust ending in a hand-brushed fade near y 1400. Face and neck are centred; the lowest 15 percent of the frame (y 1250 to 1450) holds only clothing, because the UI puts a name plate there.

| # | Client | Look (fixed identity) |
|---|---|---|
| 1 | Mireille Vasseur, travel writer, 40s | sun-warmed light olive skin, wavy shoulder-length chestnut hair with a few silver strands, relaxed knowing closed-lip smile with fine laugh lines, open-collar sky-blue linen shirt (`#7db4d9`), thin gold chain, one small gold hoop earring visible on each ear |
| 2 | Tobias Okafor, storm photographer, early 40s | deep brown skin, close-cropped hair, short neat beard with a few grey flecks, dry amused half-smile (lips closed), dark olive waxed field jacket (`#4b5636`) with the collar up, plain dark woven camera strap across the chest with one ochre stripe (`#7f5f00`), five or six small raindrops on the shoulders |
| 3 | Dame Ottoline Frost, opera patron, 70s | pale skin, silver hair in a smooth chignon, long neck, high cheekbones, one eyebrow very slightly raised, deep red lips (`#a1281f`), black velvet jacket with a high stand collar, small pearl drop earrings, composed severe expression |
| 4 | Priya Raman, mountain guide, early 30s | warm brown skin, wind-reddened cheeks, long dark braid over one shoulder, dark wool headband (`#1d4430`), forest-green fleece (`#2f6b4a`) zipped to a high collar, alert half-smile (lips closed) |
| 5 | Jun Aoki, gallery curator, 40s | fair skin, sleek jaw-length black asymmetric bob with a blunt fringe, poised neutral expression, charcoal sculptural coat (`#3a3633`) with one oversized lapel, white high-neck shirt, one small violet enamel pin (`#6d4aa6`, plain shape, no lettering) |
| 6 | Edie Lindqvist, vintage shop owner, 60s | rosy fair skin, silver-blond curly hair pinned in a loose bun under a rust-and-cream dotted headscarf (`#a4491a`, `#f0e4c8`), warm closed-lip smile with soft laugh lines, mustard cardigan (`#d6a52b`) with a wide collar, chunky round wooden beads (`#b0834f`) at the neck |

Face rules: simple stylised editorial faces, two eyes of equal size looking at the viewer with a clear highlight, ears symmetrical where visible, closed mouths (no teeth), no heavy makeup glamour, no airbrushed skin, no uncanny symmetry. Hair reads as a clear mass with 3 to 5 brush strokes; hair must not merge into the background or the collar. No glasses on any client (avoids lens construction errors). No visible text on clothes. Hands out of frame.

## 13. Backdrops per chapter

All backdrops are the SAME object: a sheet of warm linen-coloured gouache paper with a fine hand-painted linen weave and paper grain, seen from straight above, soft top light. They differ only by a quiet accent wash in the outer ring and 2 to 4 low-contrast props in the outer ring.

Zones (percent of the 1024 x 1536 image):
- Calm core: x 14 to 86, y 12 to 88. Only linen weave and paper grain. Tonal range stays within `#d9ccb3` to `#ebe0cc` so the `#78674f` slot outlines keep at least 3:1 contrast. No prop, no pattern, no shadow, no vignette.
- Prop ring: x 0 to 14 and 86 to 100 (left and right edges), plus the 6 percent top and bottom strips. Props cover at most 15 percent of the image area in total, each prop under 16 percent of the width, softly painted, no ink contour, darkest value no darker than `#8a7a64`, local contrast against the linen at most about 30 percent. Cropping is unpredictable (see section 10), so keep props distributed on both sides, never one prop in a corner alone.
- Accent wash: the chapter accent glazed into the four corners and along the left and right edges at 12 to 18 percent strength so the chapter colour reads even at 48 px, fading to plain linen before the calm core.
- No garments, no body, no hanger, no hands, no text, no frame, no border, no board outline, no grid, no slot shapes, no stars, no sparkle.

| Backdrop | Accent | Props (pick 2 to 4, same family) |
|---|---|---|
| `backdrop-studio` (style anchor) | violet `#6a3fa0` | pattern-paper offcuts with dotted seam lines (no numbers), a stick of tailor's chalk, 3 steel pins, a small swatch of violet silk |
| `backdrop-riviera` | sky `#2b6a9a` | two seashells, a half lemon slice, a sprig of olive leaves, a short sky-blue ribbon |
| `backdrop-rainy-city` | ochre `#7f5f00` | two fallen plane-tree leaves in ochre, a brass key, a coil of waxed thread, a few painted rain-bead spots on the linen |
| `backdrop-gala` | red `#a1281f` | a length of red velvet ribbon, three or four scattered rose petals, a spool of gold thread, two gold buttons |
| `backdrop-mountain` | green `#2c6a48` | a pine sprig with a cone, a coil of rope, a skein of forest-green wool, a metal carabiner |
| `backdrop-vintage` | rust `#a4491a` | a length of rust ric-rac trim, three assorted buttons, a daisy patch, the corner of a vinyl record with a blank rust label |

## 14. Self-review checklist before delivering (the reviewer runs it too)

1. Exact filename equals the asset id; PNG; exact generation size; exact aspect class.
2. No text, numbers, logos, signature, watermark anywhere. Zoom into labels, tags, clasps, lenses, pins.
3. Colour tag check: the dominant hue of the piece is the tag colour from section 3.3.
4. Construction check: pairs matched, symmetric parts equal, buttons even, seams logical, hands absent.
5. Same light (top, slightly left), same contour weight, same shading steps, same camera and lean as the accepted anchors. Put the new image next to `item-riviera-1` and a previously accepted sibling.
6. Scale check: bounding box within the category maximum and touching it on one axis; centred; margins; shadow faded 2 percent before the edge.
7. Transparency check (transparent assets): real alpha, transparent corners, no checkerboard, no halo against linen and night, interior holes transparent.
8. Readability: contact sheet at 64, 96 and 128 px (pieces), 180 x 240 (clients), 48 and 96 px (icon): strong silhouette, one clear focal point, no mush.
9. Backdrop and key-art zoning: calm core and title band are calm; props only in the ring.
10. Generic AI tells: no gloss, no sparkles, no bokeh, no muddy gradients, no over-saturation, no uncanny faces.
11. When unsure, simplify and regenerate; do not deliver a doubtful asset.

## 15. Delivery and referencing

- Each batch folder `bN/round-R/` holds `brief.md` and receives `out/<assetId>.png` plus `out/manifest.json`.
- Anchors: the ACCEPTED files from batch b1 live in `../accepted/` once the orchestrator copies them there; before that, use `../b1/round-<n>/out/`. Use accepted files as reference images for every later asset: `item-riviera-1` for every piece, `backdrop-studio` for every backdrop, `key-art` for the feature graphic, accepted `client-N` neutrals for any later expressions.
- Generation sizes only: 1024x1024 (square), 1024x1536 (portrait), 1536x1024 (landscape). The runtime masters (1600 x 2400, 1536 x 2048) are produced from your files by the integrator; compose for the generation size.
