# Floodplain Dispatch - art bible (v1)

Audience: the designer (image-generation agent). Read this whole file before any brief. Every asset in every batch must obey it. The bar is a featured, award-calibre mobile game, not "good for AI". When in doubt, simplify: fewer, better-placed brush marks.

Sources of truth: the game spec (artStyle, artAssets), `product.md` (palette tokens, accessibility), `content-plan.md` (house kinds, trees, regions, themes).

## 1. What the game is (so the art can serve it)

A calm, clever puzzle about water. The player looks straight down at a small riverside town laid out on a grid (8x12 up to 12x16 cells), places canals, pumps, sandbag barriers, sluice gates and a reservoir, then watches a flood season play out. Houses must get a drink and must not get wet. Terrain, water, canals, fields, sea, inlets and rock outcrops are drawn by code on Canvas 2D in the palette below. Generated art is ONLY: standalone objects (sprites), full-bleed backdrops, an app icon, a title key-art and a store feature graphic. Your objects sit on top of code-drawn terrain, so they must look like they were painted by the same hand as that terrain would be.

## 2. Mood

Quiet, tactile, handmade. A painted wooden-toy diorama on a table in morning light: a town you want to protect. Warm, patient, slightly wry. Toy-like charm without cuteness overload: simplified, slightly chunky forms, but grown-up colour and restraint. No faces, no eyes, no mascots, no anthropomorphism, no people, no animals in any asset.

Emotional range per region (backdrops only): Valley = calm morning; Delta = hazy, braided, silty; Highland = dry, airy, stony; Estuary = salt, wide, tidal. Same hand, different weather.

## 3. Palette (hex, binding)

The game's UI and code-drawn terrain use these 14 tokens. Generated art lives in the same family; sample them, do not invent a neighbouring "almost" palette.

| Token | Hex | Role in art |
|---|---|---|
| ink | #1f2b22 | deepest dark, shadow tint, thin contour colour (never pure black) |
| paper | #f4ecd8 | lightest light, highlight tint, plaster highlights |
| paper-2 | #e8dcc0 | warm light neutral, plaster mid, sky haze |
| night | #18231d | app background; never used as a fill inside art except the deepest crevice |
| meadow | #8aa468 | land, grass |
| meadow-deep | #4f6b3c | foliage shade, hedges, tree crowns |
| ochre | #c8923a | fields, straw, hay, warm accents |
| ochre-deep | #7d5516 | timber warm shade, field rows |
| clay | #a7432c | FLOOD ALERT colour in the UI. Do not use it as a roof or wall fill. |
| water | #3b8dc4 | water, the only saturated blue allowed |
| water-deep | #1f5f8f | deep water |
| water-light | #a5d3ee | shallow water, highlights on water |
| rock | #7d776b | stone, rock, masonry |
| sea | #2a6c9c | sea |

Extended object colours (allowed in sprites; derived from the family, muted, gouache-like):

| Name | Hex | Used for |
|---|---|---|
| plaster-cream | #efe3c4 | house walls (lit) |
| plaster-shade | #cdbd98 | house walls (shadow side) |
| roof-terracotta | #c0663f | cottage roof (orange-terracotta, clearly lighter and more orange than clay) |
| roof-slate | #4d5560 | townhouse roof (charcoal slate, slightly warm) |
| roof-timber | #6b5238 | barn and mill roofs (weathered brown) |
| roof-sage | #6f8f8a | school roof (grey-green slate; the only cool-green roof) |
| brick-red | #a65a45 | barn walls, chimneys (muted, desaturated, not clay) |
| timber | #8a6a44 | beams, doors, gates, wheel |
| timber-shade | #5b4330 | timber shadow side |
| stone-light | #a8a290 | stone lit side |
| burlap | #cdb98a | sandbags (lit) |
| burlap-shade | #9d8a5e | sandbags (shadow) |
| brass | #b08a3c | pump cap and bands |
| iron-green | #2f4a3a | pump body, iron work |
| leaf-light | #9cb673 | tree crown lit side |
| willow-silver | #8fa383 | willow fronds |

Hard colour rules:
- Saturated blue (water, water-deep, water-light, sea families) appears ONLY where there is water or sea, which is: the code (not your sprites), the icon river, the key-art river, the feature-graphic river and the Estuary backdrop edge (muted). No blue roofs, no blue doors, no blue pump.
- clay (#a7432c) and bright red never appear as a large fill (they mean "flood" in the UI).
- Maximum 6 distinct hue families per sprite. Saturation stays in the low-to-mid range; whites are warm (paper), blacks are green-black (ink).
- Value structure: every sprite must survive conversion to greyscale with a clear light-to-dark read (lit roof plane, mid walls, dark shadow side).

## 4. Rendering technique: gouache

Matte, opaque, hand-painted gouache on slightly toothy paper.
- Colour is laid in confident flat-ish shapes with 2 to 3 value steps (light, mid, shade), plus one small accent highlight at most.
- Visible but quiet brush character: soft dry-brush edges, slight stroke direction in large fields (roofs follow the roof pitch, grass follows no single direction), subtle paper tooth at low contrast. The texture is the same on every asset and is NOT an overlay of noise; it must read as pigment, not as grain filter.
- No gloss. No specular hot spots. No glassy gradients, no airbrush smoothness, no 3D-render plastic, no vector-flat clipart, no photographic detail, no pencil sketch lines.
- Detail budget: each object has at most one level of secondary detail (shingle rows hinted, not drawn tile by tile; windows as simple shapes). No meaningless micro-detail. If a detail would not read at 96 px it is either a single confident mark or absent.

## 5. Line and edge treatment

- No heavy black outline. Objects are separated from the ground by a thin, slightly broken painterly contour in a darkened version of the local colour (roof edge = darker terracotta, wall edge = darker timber, foliage edge = deep meadow-deep), never outside the silhouette, never pure black.
- Contour weight: about 1.0 to 1.4 percent of the canvas width on 1024 sprites (roughly 10 to 14 px), uniform across ALL sprites of the game, slightly varied in pressure by hand. At 32 px display this resolves to a hairline; that is intended.
- Inner edges (roof ridge, wall corners) are shape changes (value steps), not drawn lines, except for 2 to 4 deliberate accent strokes per object.
- Water, wherever the generated art contains it (icon, key-art, feature graphic): flat clean water blue with a lighter water-light streak or two, bounded by a 2-ink-px style shoreline (thin dark ink line at the water/land boundary, about 0.4 percent of the canvas width). This mirrors the code-drawn shoreline in the game, so the art and the board agree.
- Cut-out edges on transparent sprites are crisp, clean and fully anti-aliased: no halo, no light or dark fringe, no stray semi-transparent pixels inside the silhouette except the deliberate shadow (section 8).

## 6. Lighting

Single, consistent, soft key light from the TOP-LEFT of the image (azimuth about 315 degrees, elevation about 45 degrees). Applies to every sprite, backdrop and key-art, regardless of region or theme.
- Lit planes (top-left facing roof slopes, left faces) get the brightest values, warmed toward paper.
- Shadow planes (right-facing, bottom-facing) are about 25 to 35 percent darker and cooled slightly toward ink-green, never black, never purple.
- Cast shadow falls DOWN-RIGHT, short: length about 0.25 times the object's height, soft-edged but with a readable shape (not a smear).
- No rim light, no second light source, no glow, no god rays, no bloom. No lights inside windows (the "Night Lantern" theme is applied in code, not painted).
- Ambient occlusion is a single quiet darker value where object meets ground, not a muddy gradient.

## 7. Camera and view rules per asset class

| Class | View |
|---|---|
| Sprites (houses, pump, reservoir, gate, barrier, windmill, trees) | Strict top-down 3/4 view: camera pitched about 60 degrees down from horizontal, looking straight "north" onto a grid of square cells. Roofs and tops dominate; the SOUTH (bottom) face of a building is visible as a short band, the east and west faces are NOT visible (no perspective convergence, no dutch angle, no fisheye). Orthographic: parallel lines stay parallel; every sprite uses the same pitch. Ridge lines of rectangular buildings run horizontally (west-east) unless stated. |
| Icon | Front-facing graphic composition, but the cottage and river inside it use the same top-down 3/4 view and light. |
| Key-art | Elevated diorama view, same pitch (about 60 degrees), as if the camera hovers over a table-top model of the town. |
| Backdrops | Pure top-down map-like view (pitch 75 to 90 degrees), flatter than sprites, because the board is flat. Objects in backdrops are tiny, seen from above, and low contrast. |
| Feature graphic | Same elevated diorama view as key-art, wider framing. |

All generated art shares ONE world: same pitch, same light, same paint, same palette, same brush size. A sprite lifted from b2 must look correct standing on the b1 key-art diorama.

## 8. Transparent sprite construction rules

- Canvas 1024 x 1024 PNG, 8-bit RGBA, straight (non-premultiplied) alpha. Background alpha exactly 0, including all four corners and the outer 3 percent border on every side.
- The object (including its cast shadow) is centred, with a total bounding box of about 80 percent of the canvas in its larger dimension (never above 88 percent, never below 70 percent). Equal-ish margins left and right.
- Ground footprint: all buildings and structures stand on a notional square footprint that is about 60 to 70 percent of the canvas width, centred at about 56 percent of the canvas height. Height rises above the footprint into the upper part of the canvas. The visible south face and the base sit at about 78 to 82 percent of the canvas height. This makes every sprite sit consistently inside a square board cell.
- Baked cast shadow: one soft, semi-transparent shadow, ink (#1f2b22) at no more than 30 percent alpha, falling down-right, kept fully inside the canvas with at least 4 percent margin. No other transparency inside the object. Because terrain themes change colour, the shadow must be semi-transparent ink only, never a coloured or opaque patch.
- No ground plane baked in. No grass tuft carpets, no dirt patches, no stone slabs under the object. (The code draws the terrain cell under every sprite.) A few loose blades or pebbles touching the base are fine only if they stay inside the 80 percent box and read as part of the object.
- Verify every sprite composited over four backgrounds: #8aa468 (meadow), #f4ecd8 (paper), #18231d (night), #7d776b (rock). No fringe on any of them.
- Do not bake in UI: no badges, arrows, rings, numbers, meters.

## 9. Scale rules (relative sizes inside one cell)

Reference unit: the cottage footprint = 62 percent of the canvas width. Others relative to that:

| Sprite | Footprint (W x D of canvas width) | Relative height (to cottage = 1.0) |
|---|---|---|
| house-cottage | 62 x 54 | 1.0 |
| house-townhouse | 54 x 54 | 1.5 (tallest house, narrow) |
| house-mill | 66 x 58 | 1.2 |
| house-barn | 72 x 56 | 1.1 |
| house-school | 70 x 54 | 1.1 |
| pump | 50 x 50 | 0.7 |
| reservoir | 66 x 60 | 0.5 (low, wide) |
| sluice-gate | 64 x 60 | 0.55 |
| sandbag-barrier | 64 x 50 | 0.35 (lowest) |
| windmill | 50 x 50 base, sails to 86 percent of canvas | 2.2 |
| tree-oak | crown 70 x 64 | 1.6 |
| tree-poplar | crown 34 x 60 | 2.2 (tallest tree) |
| tree-willow | crown 72 x 66 | 1.5 |

Tall things (poplar, windmill, townhouse) stay narrow so that they fit one cell; they grow upward into the top of the canvas, not outward.

## 10. How each asset is used in the UI (display size and overlays)

Cells are 26 to 30 CSS px at fit zoom, 40 to 60 px at the 1.5x and 2x zoom steps. Runtime art is a 192 px WebP (2x of 96 px). Sprites are drawn roughly one cell large (allowed to overhang upward by up to one third of a cell for tall objects) on top of code-drawn terrain, and larger in the tray (about 48 px icons in 44 px hit targets) and the piece inspector sheet (about 96 px). THE SPRITES MUST BE JUDGED AT 32, 48 AND 96 PX. At 32 px a house must still read as "a house with a coloured roof" and be distinguishable from its four siblings by silhouette and roof colour alone.

| Asset | Where | Size on screen | What overlays it |
|---|---|---|---|
| icon | App icon, splash (via capacitor assets) | 48 to 1024 px, adaptive-icon mask (circle, squircle, rounded square) | nothing; no text |
| key-art | Title screen background | full-screen portrait, about 360 to 430 CSS px wide | Game title (code text, top band), Play / Daily / Themes buttons (bottom band) |
| backdrop-valley / delta / highland / estuary | Behind and around the planning board and playback | full-screen portrait cover-fit | The board (centre, about 70 to 90 percent of the width, between 14 and 74 percent of the height), header HUD (top about 14 percent), piece tray and Run button (bottom about 24 percent) |
| feature-graphic | Store listing only | 1024 x 500 centre crop | nothing; no text |
| house-* (5 kinds) | One building per `house` cell | 26 to 60 px (board), 96 px (inspector) | Status badge (supplied / dry / flooded / irrigated: icon + text pill) over the top-right corner; selection ring; wet-level tint from code. Keep the top-right 20 percent of the canvas free of tiny fragile detail; no smoke plumes. |
| pump | Placed piece; tray tool | 26 to 60 px; 48 px tray; 96 px inspector | Direction chevron drawn by code on top, selection ring. The sprite is NEVER rotated by code (rotation would break the top-left light), so it must be direction-neutral. |
| reservoir | Placed piece; tray tool | same | Water level fill drawn by code inside the basin (0 to 10 units), selection ring. The basin interior must therefore be an EMPTY dry floor. |
| sluice-gate | Placed piece; tray tool | same | Open / closed glyph by code, week-range label chip. Designed with water flowing top to bottom (north to south). Code may rotate it 90 degrees for east-west canals; the symmetric design must tolerate this. |
| sandbag-barrier | Placed piece; tray tool | same | Selection ring only. |
| windmill | Scenery on a `scenery` cell (Delta, Estuary, at most one per map) | 26 to 60 px; may overhang upward | nothing |
| tree-oak / poplar / willow | Scenery on `scenery` cells | 26 to 60 px; may overhang upward | nothing |

## 11. Distinctness map (siblings must be readable apart at 32 px)

- Houses: by roof colour AND silhouette. cottage = small terracotta gable; townhouse = tall narrow dark slate with chimneys; mill = brown roof with a visible waterwheel on its left side; barn = long low wide brown roof with big double door and red-brick walls; school = sage-green hipped roof with a small bell cupola on the ridge.
- Pieces: pump = dark iron-green drum with brass dome and four pipe stubs; reservoir = round stone ring with empty floor; sluice-gate = two stone piers with a timber slide-board between; sandbag-barrier = lumpy burlap stack. Silhouettes: drum (pump), ring (reservoir), H/gate (sluice), mound (barrier).
- Trees: oak = broad rounded crown, dark green; poplar = very tall narrow flame, yellow-green; willow = wide drooping crown with hanging fronds, silver-green. A tree must never be mistaken for a house at 32 px (no flat rectangular masses; crowns are organic and lobed).
- Windmill is the only object with four diagonal sails.

## 12. What to avoid (hard fail list; this is the review rubric)

1. Any text, letters, numbers, signs, signatures, logos, watermarks, clock faces with digits, painted words on sails, doors or banners.
2. Anatomy and construction errors: warped or melting objects, doors that do not meet walls, windows floating off facades, roofs that do not close, impossible structures, wrong perspective, asymmetry where symmetry is required (pump, reservoir, sluice, barrier base), objects that merge into the shadow or into each other, trees that read as blobs of noise.
3. Style drift: a different line weight, texture, light direction, pitch or palette from the other assets. A single asset that looks "from another set" is rejected.
4. Unreadable at display size: mush, low-contrast silhouettes, too many tiny elements.
5. Technical faults: wrong aspect or size, baked checkerboard, halo or fringe, non-zero corner alpha on sprites, borders or vignettes on opaque assets, JPEG artefacts.
6. Composition faults: subject in the title band, busy backdrop centre, key objects outside the safe areas.
7. Generic AI tells: plastic gloss, airbrushed sameness, random sparkles or bokeh, lens flare, depth-of-field blur, god rays, over-saturation, muddy gradients, symmetrical-clone vegetation, "fantasy storybook" glow, inconsistent shadows, meaningless filigree.
8. Purpose failures: a sprite that cannot be told from a sibling; a pump that looks like a reservoir; a barrier that looks like a hay bale or a rock; a gate that looks like a bridge.
9. Copyright: no recognisable characters, brands, logos, famous artworks, or a close imitation of a specific game's art. Generic gouache diorama only.
10. Also forbidden: people, animals, birds, boats, vehicles, smoke, fire, rain streaks, lightning, lit windows, UI of any kind inside the art, water inside sprites, a baked ground plane under sprites.

## 13. Regional palettes for backdrops (all light from top-left, all gouache)

| Region | Dominant | Accents | Texture hints (edges only) |
|---|---|---|---|
| Valley | meadow #8aa468, meadow-deep #4f6b3c, paper-2 haze | soft ochre strips (distant fields) | hedgerow lines, far poplars as tiny dark dots, low gentle undulation |
| Delta | olive-green #7c9a5e, silt ochre #b9a062, reed gold #c8b070 | muted green-grey channels (NOT game blue) | braided pale silt ribbons, reed clumps, tiny pale islands |
| Highland | sage #8fa07a, dry ochre #b8a06a, rock #7d776b | slate #5f6a68 | stepped terraces with dry-stone walls, scattered boulders, thin goat tracks |
| Estuary | pale sand #d8cba6, mud #9a9070, salt-grass #9bab7c | muted grey-blue sea #8aa3ad at one edge only (desaturated, never the game's water blue) | tidal creek curls in the margins, driftwood-sized specks, ripples hinted |

The board's own water blue must always be the most saturated blue on screen. Backdrops are quiet supporting players.

## 14. Self-review checklist before delivering (the reviewer will run it too)

1. Build a contact sheet per batch at 1x: sprites at 32, 48, 96 px on meadow #8aa468 and on night #18231d; icon at 48 and 96 px; backdrops at about 360 px wide with the board zone overlaid as a rectangle.
2. Check the rubric in section 12 point by point; reject your own failures and regenerate.
3. Compare each new asset side by side with the batch's anchor and every accepted asset: line weight, texture, light, pitch.
4. Check the alpha channel with a script (corners, border band, no checkerboard).
5. Only then write `manifest.json` and deliver.

When unsure, regenerate. A rejected asset costs a round; a weak accepted asset costs the game.
