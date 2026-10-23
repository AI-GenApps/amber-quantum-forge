# Lantern Loops - art bible (v1)

Audience: the designer (image-generation agent). Read this whole file before any brief. Every asset in every batch must obey it. The bar is a featured, award-calibre mobile game, not "good for AI". When in doubt, simplify: fewer, better-placed cut-paper shapes.

Sources of truth: the game spec (artStyle, artAssets), `product.md` (modes, accessibility, screens), `content-plan.md` (chapters, lantern colours and glyphs, medallions), `assets-index.md` (slot list and display sizes) in `.agents/games/lantern-loops/`.

## 1. What the game is (so the art can serve it)

A calm, clever daily logic puzzle. The player draws closed loops of paper ribbon on an N x N grid (5x5 to 9x9) so that every lantern is lit, numbered stones are satisfied, mirrors turn the light and colour gates are crossed by the right colour. There is no fail state, no timer pressure, no countdown. Four chapters: Harbor, Garden, Bridge, Sky. Five lantern colours (amber, rose, jade, azure, violet) plus an unlit state.

The BOARD (tiles, ribbons, stones, mirrors, gates, loop glow, glyphs) is ALWAYS drawn by code in SVG with the same palette. Generated art is ONLY: the app icon, the title key-art, six lantern sprites, four chapter backdrops, the streak medallion, the empty-archive spot illustration and the store feature graphic. Your art surrounds and supports the board; it never contains a board, grid, tiles, numbers or UI.

## 2. Mood

A paper-cut lantern festival at dusk: a handmade shadow-box theatre lit from inside by lanterns. Calm, patient, premium, quietly wondrous. Warm glow against cool deep indigo and teal. Uncluttered: big simple layered shapes, generous negative space, one clear focal point per image. Think of a handcrafted paper shadow-box on a shelf, not a fantasy illustration and not a glossy 3D render.

Emotional range per chapter (backdrops): Harbor = still, amber-lit, nautical; Garden = hushed, intimate, rose-warm; Bridge = reflective, silvery, spacious; Sky = open, airy, ascending. Same hand, same paper, different evening.

No faces, no eyes, no people, no animals, no birds, no mascots, no anthropomorphism in any asset. (Boats, bridges, walls, blossoms, clouds and lanterns are allowed where a brief names them.)

## 3. Palette (hex, binding)

The game UI and board use these tokens. Generated art lives in the same family: sample them, do not invent a neighbouring "almost" palette.

Base tokens (from the content plan):

| Token | Hex | Role in art |
|---|---|---|
| night | #12132E | deepest background, deepest shadow side of big shapes |
| indigo | #1E2050 | main dusk field, water, sky mid |
| teal | #0E5A5F | cool secondary field (Garden dominant), shadow tint |
| paper | #F6EAD3 | lightest light, ribbons, rim light, glyph-window core |
| ink | #241B2F | shadow tint, deepest accents (never pure black) |

Lantern colours (the lantern body mid-tone; also used for glow accents in backdrops):

| Colour | Hex | Glyph | Light (inner glow / lit side) | Deep (shade side) |
|---|---|---|---|---|
| amber | #F2A33A | circle | #FFD68A | #B9661A |
| rose | #E9657F | diamond | #FFB0BF | #A33556 |
| jade | #3FBF98 | triangle | #A5EBD0 | #1B7A62 |
| azure | #4EA6EA | square | #B0DAFA | #2468A8 |
| violet | #9A7DE3 | star | #CFC0F7 | #5F47B0 |
| unlit | #5C6385 | none | #8A92B5 | #363B5E |

Extended supporting tones (allowed, muted, derived from the family):

| Name | Hex | Used for |
|---|---|---|
| indigo-light | #2B2F78 | lit planes of big indigo shapes, water highlights layers |
| indigo-mist | #3B3F8F | farthest sky / water haze layer |
| plum | #3A2A5E | dusk transition between indigo and warm glow |
| teal-deep | #08393D | Garden shadow layers |
| teal-light | #1E7F82 | Garden lit layers |
| paper-2 | #E4D2B0 | paper mid-tone, shaded ribbon, lantern caps highlight |
| paper-shade | #BFA98A | shade side of cream paper |
| blossom | #F3B6C3 | Garden petals (light), never saturated pink |
| silver-teal | #9ED6D0 | Bridge glints and mirror edges |
| stone-dusk | #4A4F86 | bridge and wall stone, violet-grey |
| lacquer | #2B1F3A | lantern caps, tassel cord, posts, hulls (dark warm aubergine, not black) |

Hard colour rules:
- Never pure black (#000) or pure white (#fff). Darkest = night/ink/lacquer, lightest = paper.
- Max 6 hue families per asset. Saturation is highest ONLY in lantern bodies and their glow; backdrops, ground and structures are muted and darker so the lanterns and the board are always the brightest, most saturated things on screen.
- Warm = light sources only (lanterns, lamps, windows of lanterns). Cool = everything else. No warm fill in a backdrop except small lantern/lamp glows.
- Each lantern colour is used for that lantern's own colour family only; do not tint a jade lantern amber at the edges.
- Value structure: every asset must survive greyscale with a clear light-to-dark read (glowing core lightest, body mid, caps and shade side darkest).
- No gradients that span more than one layer: tone changes happen between paper layers (stepped), with at most a subtle within-layer tonal drift of about 8 percent value.

## 4. Rendering technique: layered cut paper

Real cut paper photographed in a shadow-box, rendered as clean illustration.
- Every shape is a flat sheet of coloured paper, cut with scissors or a craft knife: crisp, confident outlines, smooth curves, small deliberate corners. Shapes are simple and large; no intricate lace unless a brief asks for a paper-cut pattern (windows, scallops), and then only one pattern family per asset.
- Subtle paper fibre texture on every sheet: faint, fine, irregular fibre flecks and a slight tooth, at low contrast (about 3 to 5 percent value variation). The same texture at the same scale on every asset. It must read as paper pulp, not as a noise overlay, not as canvas weave, not as film grain.
- Each sheet has a real but thin edge: a lighter edge on top-left facing cuts (rim light) and a slightly darker edge on bottom-right cuts, about 0.5 to 0.8 percent of the canvas width. This thickness is what separates layers, not an outline.
- Depth comes from stacked layers, 3 to 6 per scene, each casting a soft shadow onto the layer below (section 6). More layers = more depth, but never more than 6 distinct layers in any asset.
- Translucent paper (lantern bodies, glyph windows, glow) is the only place where light passes through: value is lighter and warmer in the middle, richer at the edges, like tissue/rice paper lit from inside.
- No gloss, no plastic, no glassy highlights, no chrome, no 3D-render subsurface look, no airbrush smoothing, no photographic bokeh, no pencil/ink sketch lines, no watercolour bleed, no vector-flat clipart without texture.
- Detail budget: at most one level of secondary detail per object (e.g. lantern ribs and glyph window; a boat's mast and sail). If a detail would not read at 96 px it is either a single confident cut shape or absent. No meaningless micro-detail (no tiny rivets, no filigree, no scribbles).

## 5. Line and edge treatment

- NO outlines. Cut paper has no drawn contour. Objects separate through the paper edge (section 4) and the layer shadow (section 6), never through a black or dark stroke around the silhouette.
- Edge consistency: the paper edge thickness is the same on all assets of the game (about 0.5 to 0.8 percent of canvas width, so 5 to 8 px at 1024).
- Corners: cut shapes have either crisp corners or generously rounded curves (radius at least 3 percent of the shape), never a wobbly hand-drawn edge. Curves must be smooth, symmetric where the object is symmetric.
- Transparent sprite edges are crisp, clean and fully anti-aliased: no halo, no light or dark fringe, no matte colour bleed, no semi-transparent pixels inside the silhouette.
- Opaque assets have no frame, border, inner stroke, rounded-corner mask or vignette baked in.

## 6. Lighting

Two light logics, never more.
1. Ambient dusk key light from the TOP-LEFT (azimuth about 315 degrees, elevation about 45 degrees), cool and soft. It lights the top-left edges (rim) of paper sheets and throws the layer shadows DOWN-RIGHT.
2. Emission from lanterns and lamps: inside a lantern the paper glows from within. This is not a second shadow-casting light; it only (a) brightens the translucent paper, (b) lets a tight warm tint spill onto the immediate neighbouring paper edges within about one lantern radius.

Layer shadow: ink (#241B2F) at 35 to 45 percent opacity (backdrops) or 25 to 35 percent (small sprites), offset DOWN-RIGHT by about 1.0 to 1.5 percent of canvas width per layer step, soft-edged but with a readable shape. The same offset direction on every asset.

Rules:
- Lantern glow is built from the paper itself: bright warm-light core, richer deep colour toward the edges and the shade (right and bottom) side. Do NOT paint a baked outer halo, bloom, lens flare, god rays, light shafts, sparkle, star-burst or bokeh around any transparent sprite (the UI adds its outer glow in code). In opaque scenes a lantern may have at most 2 stepped halo discs of cut paper (flat translucent discs, visible edges), not an airbrushed glow.
- Reflections (water) are broken horizontal cut-paper bars in the lantern colour, not mirrored photographic copies.
- No rim light on the right/bottom, no second shadow direction, no coloured shadows (shadows are ink-tinted, never purple-black or pure black).

## 7. Camera and view rules per asset class

| Class | View |
|---|---|
| Lantern sprites, medallion, empty-archive spot, icon motif | Straight-on front elevation, orthographic, like a paper-theatre prop facing the viewer. No perspective, no tilt, no 3/4 turn. Perfectly vertical axis of symmetry for lanterns and medallion. |
| Backdrops and key-art | Frontal shadow-box / paper-theatre view: the scene is stacked flat layers (far sky or water, mid shapes, near silhouettes), seen straight on with a horizon-like composition; depth only by layering and shadow, not by converging perspective. Horizon or water line sits in the top band or the bottom band, never across the centre. |
| Feature graphic | Same paper-theatre frontal view, wide framing. |

All generated art shares ONE world: same paper, same light, same edge, same texture scale, same palette. A lantern lifted from b2 must look correct hanging in the b1 key-art, and the b1 icon lantern must be the same object as `lantern-amber`.

## 8. The lantern (the hero object): one fixed construction

All six lantern sprites, the lantern in the icon, and every lantern inside key-art, backdrops and the feature graphic follow this one design (only colour, glyph and lit state change).

- Shape: a classic festival lantern in front elevation, vertically symmetric: a rounded barrel body (width about 58 percent of the canvas, height about 50 percent), slightly wider at the middle, formed from five visible vertical paper panels separated by thin darker ribs; a flat dark top cap and a flat dark bottom cap (lacquer #2B1F3A, with a paper-2 top-left rim line), a short hanging cord ending in a small round loop above the top cap, and a short tassel (a small bead and 5 to 7 cord strands, simple stepped paper strips) under the bottom cap.
- Glyph window: in the centre panel area a single cut-out window, about 24 percent of the body width, shaped as the colour's glyph: circle (amber), diamond (rose), triangle (jade, point up), square (azure), five-point star (violet). The window is the brightest part of the lantern (light core, near paper), crisp-edged, geometrically exact, centred, same size for all colours. Unlit has NO window (solid dull panel) so it reads as "off". The glyph is a pure shape, never a letter or number.
- Lit state: translucent coloured paper with the light core in the centre fading (stepped, within the paper) to the deep tone at the left/right edges and shade side. Ribs show as thin darker lines against the glow.
- Unlit state (`lantern-unlit`): same silhouette, same construction, but body in #5C6385 family (light #8A92B5, deep #363B5E), no glow, no window, flat matte paper, caps unchanged. It must clearly read as "off" and never as grey-amber.
- Proportions (fixed across all lanterns): top of cord loop at 6 percent of canvas height, top cap at 18 to 22 percent, body 22 to 72 percent, bottom cap 72 to 77 percent, tassel to 91 percent. Horizontal axis at exactly 50 percent.
- Distinctness: the five colours must be told apart at 48 px by hue AND by glyph window shape. Rose and amber are both warm: keep rose clearly pink-red (#E9657F family) and amber clearly orange-yellow (#F2A33A family). Azure and violet are both cool: keep azure clearly sky blue and violet clearly purple.

## 9. Transparent sprite construction rules

- Canvas 1024 x 1024 PNG, 8-bit RGBA, straight (non-premultiplied) alpha. Background alpha exactly 0, including all four corners and the outer 4 percent border on every side.
- The object is centred, bounding box about 80 to 88 percent of the canvas in its larger dimension, never above 90 percent, never below 70 percent. Equal margins left and right.
- No cast shadow outside the silhouette, no ground plane, no glow halo, no sparkle particles. Internal layer shadows only.
- No semi-transparent pixels inside the object. The silhouette is fully opaque.
- Verify every sprite composited over four backgrounds: #12132E (night), #1E2050 (indigo), #F6EAD3 (paper) and #0E5A5F (teal). No fringe on any of them.
- Do not bake in UI: no badges, numbers, rings, check marks, locks, stars.

## 10. Scale rules

- Lantern sprites: identical silhouette size across all six (section 8 proportions); never scale one larger than another.
- Medallion: scalloped disc diameter about 86 percent of the canvas; central plate about 44 percent of the canvas width.
- Empty-archive: the whole illustration fits inside an 78 percent box; the lantern in it uses the lantern construction at about 45 percent of the canvas height.
- Lanterns inside scenes: relative to the scene they are small, simple, and only the hero lantern (icon, key-art) is large. In backdrops, lantern/lamp shapes stay under 7 percent of the canvas width and never sit inside the board zone.

## 11. How each asset is used in the UI (display size and overlays)

Phone portrait viewports are typically 360 to 430 css px wide and 640 to 930 css px tall (aspect 1:1.8 to 1:2.2). A 2:3 image displayed with cover-fit therefore shows only about 70 percent of its width: THE OUTER 15 PERCENT ON EACH SIDE IS CROPPED on tall phones. Keep all important content within the central 70 percent of the width.

| Asset | Where | Size on screen | What overlays it |
|---|---|---|---|
| icon | Launcher icon, splash source (via @capacitor/assets) | 48 to 1024 px, adaptive masks (circle, squircle, rounded square) | nothing; no text |
| key-art | Boot screen, Home background, splash source | full-screen portrait, cover-fit | Title "Lantern Loops" (Fraunces, cream, top band), Play / Daily / menu buttons (bottom band), daily card |
| lantern-amber and the other five lanterns | Lists, chapter cards, win sheet, Sky legend, how-to-play, share preview | 56 css px (shipped 112 px); also 28 to 96 px | Star counts, number chips and lock badges are drawn by code NEXT TO or over the bottom edge; keep the lower 10 percent (tassel) free of fragile detail |
| lantern-unlit | Locked puzzles, unlit lanterns in lists | 56 css px | Lock icon or number by code |
| backdrop-harbor / garden / bridge / sky | Behind the puzzle board, the chapter's puzzle list and chapter card header | full-screen portrait cover-fit, usually with a code scrim of 20 to 35 percent indigo over it | The board (centre, 90 percent of the width, between 17 and 77 percent of the height, placed on a translucent code panel), header HUD (top 0 to 16 percent), brush/undo/hint controls (bottom 78 to 100 percent) |
| daily-medallion | Daily screen, streak milestones | 120 css px (shipped 240 px) | Tier number (Fraunces) drawn by code in the CENTRE PLATE, tier name below the image by code |
| empty-archive | Archive "Completed" tab empty state | 160 css px (shipped 320 px) | A caption under the image by code |
| feature-graphic | Store listing only | 1024 x 500 centre crop of the 3:2 master | nothing; no text |

JUDGE EVERYTHING AT REAL SIZE: lanterns at 48 and 112 px, icon at 48 and 96, medallion at 120 and 240, empty-archive at 160, backdrops at 390 px wide with the board zone overlaid.

## 12. What to avoid (hard fail list; this is the review rubric)

1. Any text, letters, numbers, signs, signatures, logos, watermarks, lantern inscriptions, calligraphy, fake glyph characters, clock faces. (The only allowed glyphs are the five pure geometric window shapes.)
2. Anatomy and construction errors: lanterns whose ribs, caps or cords do not connect, asymmetric bodies, melting or merging shapes, bridges with impossible arches, boats with broken hulls, walls that do not close, floating objects without a hanging cord, wrong perspective.
3. Style drift: a different edge thickness, paper texture, light direction, palette or rendering technique from the accepted assets. One asset that looks "from another set" is rejected.
4. Unreadable at display size: mush, low-contrast silhouettes, too many small elements, lantern colours that cannot be told apart at 48 px.
5. Technical faults: wrong aspect or size, baked checkerboard, halo or fringe, non-zero corner alpha on sprites, borders/vignettes/rounded corners on opaque assets, JPEG artefacts.
6. Composition faults: subject in the title band, busy backdrop centre, key objects outside the safe areas or inside the cropped side margins.
7. Generic AI tells: plastic gloss, airbrushed sameness, random sparkles or bokeh, lens flare, god rays, over-saturation, muddy gradients, symmetrical-clone repetition (copy-pasted lanterns/blossoms at identical size), "fantasy storybook" glow, inconsistent shadows, meaningless filigree, glowing neon edges.
8. Purpose failures: a lantern colour that is not unmistakably its colour; unlit that reads as lit; a backdrop whose chapter theme cannot be told from its siblings; a medallion whose centre is not empty.
9. Copyright: no recognisable characters, brands, logos, famous artworks, or a close imitation of a specific game's art (do not imitate any existing paper-craft game; generic cut-paper only).
10. Also forbidden: people, animals, birds, fire, smoke, rain, lightning, UI of any kind inside the art, a board/grid/tiles/stones/numbers inside the art, a baked drop shadow under transparent sprites.

## 13. Chapter palettes for backdrops (all light from top-left, all cut paper)

| Chapter | Dominant | Accents | Layer motifs (edges and bands only) |
|---|---|---|---|
| Harbor | night #12132E, indigo #1E2050, indigo-light #2B2F78 | amber #F2A33A lamps and reflections (small), lacquer #2B1F3A hulls and posts, paper-2 sails | still water as horizontal wave-layers, distant dock roofs and masts, moored boats at edges, mooring posts, coiled rope |
| Garden | teal-deep #08393D, teal #0E5A5F, teal-light #1E7F82 | rose #E9657F lantern glows (small), blossom #F3B6C3 petals, plum #3A2A5E | tiled garden wall tops, blossom branches entering from upper corners, raked-gravel waves, stepping stones, a few hanging lanterns |
| Bridge | slate-indigo #2A2F6B, stone-dusk #4A4F86, indigo #1E2050 | silver-teal #9ED6D0 glints, small amber lamps on the bridge, mist paper #3B3F8F | multi-arch bridge in the far distance (top band), long still-river bars, reed silhouettes and embankment (bottom band) |
| Sky | violet #3A2F7E (top) through indigo-mist #3B3F8F to azure-ish #3E6FB8 (mid), faint dusty rose #C97C98 band near the bottom | five-colour small lanterns drifting (amber, rose, jade, azure, violet), paper-2 cloud edges | stacked cloud banks (flat cut paper), a few tiny distant lanterns in the top and bottom bands |

Backdrops are quiet supporting players. The board and the lanterns must always be the most luminous, most saturated things on screen.

Backdrop safe-zone map (percent of the 2:3 canvas; identical for all four):
- Top band y 0 to 16: scene detail allowed (skyline, wall tops, bridge, upper clouds). Value mid-dark so cream HUD text has contrast.
- Board zone y 17 to 77, x 5 to 95: CALM. Large, soft, low-contrast layers only. No lantern/lamp/boat/blossom/arch/cloud-edge sharper or brighter than 8 percent value difference from its surroundings. No focal point, no bright glints larger than 1.5 percent of the canvas width. Mean value dark (about 12 to 28 percent luminance) so the cream ribbon tiles and amber glow of the code-drawn board pop.
- Bottom band y 78 to 100: darker foreground layers, low detail, mid-dark value for buttons and controls.
- Side margins x 0 to 15 and 85 to 100 may carry decorative detail at full richness (visible on wide viewports and desktop), but nothing essential.

## 14. Self-review checklist before delivering (the reviewer will run it too)

1. Build a contact sheet per batch at 1x: lanterns and icon at 48 px and 96 px (over night #12132E and paper #F6EAD3); medallion at 120; empty-archive at 160; backdrops at 390 px wide with the board zone rectangle and the HUD/control bands overlaid; key-art at 390 px wide with title and button bands overlaid.
2. Check the rubric in section 12 point by point; reject your own failures and regenerate.
3. Compare each new asset side by side with the batch anchor and every accepted asset: edge thickness, texture, light, lantern construction, palette.
4. Check the alpha channel with a script (corners, 4 percent border band, no checkerboard, no semi-transparent interior, no fringe on the four test backgrounds).
5. For the five lit lantern colours: place all five next to each other at 48 px; each must be unmistakable by hue and by glyph window; unlit must read as off.
6. Only then write `manifest.json` and deliver.

When unsure, regenerate. A rejected asset costs a round; a weak accepted asset costs the game.
