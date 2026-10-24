# The Last Window - art bible (v1)

Audience: the designer (image-generation agent). Read this whole file before any brief. Every asset in every batch must obey it. The bar is a featured, award-calibre mobile game, not "good for AI". When in doubt, simplify: fewer, better-placed painted shapes, one clear focal point per image.

Sources of truth: the game spec (artStyle, artAssets), `product.md` (screens, palette tokens, accessibility), `content-plan.md` (the eight regulars, drinks, pastries, books, decor, weather), `assets-index.md` (slot list, runtime sizes) in `.agents/games/the-last-window/` of the game's worktree.

## 1. What the game is (so the art can serve it)

A cosy cafe-bookshop sim in portrait. You keep The Last Window, the last building on Quay Lane in the harbour town of Port Merrow, inherited from your great-aunt Marit, who lit a lamp in the big arched window every evening so late boats could find the harbour. Each day is a 3 to 4 minute shift: up to three customers sit at the counter with an order (a drink, often a pastry, sometimes a book recommended by mood). The player taps recipe steps, picks a book, serves. Between shifts: stock choices, decor purchases, and story scenes with eight recurring regulars across 14 days, ending on Lantern Night, when the harbour floats paper lanterns.

Tone: warm, quiet, small stakes, kind humour. No villains, no violence, no romance beyond friendship.

Generated art is ONLY: the app icon, the title key-art, three interior backdrops (evening, morning, rain), eight regulars x three expressions (24 busts), 6 drinks, 5 pastries, 5 books, 8 decor items, and the store feature graphic (54 slots). Everything else (seats, tickets, buttons, step chips, hearts, stars, patience bars, rain streak animation, walk-in customers, all text) is drawn by code. Art never contains UI, text, grids, buttons or HUD.

## 2. Mood

Picture-book cosy: a warm lamp-lit room on a rainy harbour evening, painted by hand. Warm gouache, soft but confident shapes, generous calm areas, one lamp glowing in a blue world. The feeling of being handed a hot cup and a good book. Quiet, kind, a little nostalgic, never twee, never glossy, never "fantasy".

Per weather: evening = lamp-lit, deep blue dusk outside (the style anchor); morning = low gold sun, pale blue harbour, steam on the glass; rain = grey-blue window with streaks, lamps warm, a wet umbrella by the door.

People are semi-realistic illustrated characters (picture-book realism, not cartoon, not anime, not 3D-render): believable faces with real age, expressive but subtle. Animals appear only where a brief names them (the gull on `book-5`, tiny sparrows on `book-2`).

## 3. Palette (hex, binding)

The UI uses these tokens (from `product.md`). Generated art lives in the same family: sample them, do not invent a neighbouring "almost" palette.

Base tokens:

| Token | Hex | Role in art |
|---|---|---|
| paper | #FBF1DC | lightest light: highlights on porcelain and cream, lamp core edge, never pure white |
| paperDark | #EAD9B8 | window frames, plates, shaded cream |
| ink | #3A2A1E | deepest dark: darkest accents, hair darks, deepest shadow (never pure black) |
| inkSoft | #5E4A3A | secondary dark, soft painted edges, brown shadows |
| night | #1F2F45 | deep blue shadow side, evening window sky, counter front |
| nightMid | #2D4560 | mid blue: dusk sky, exterior walls, denim |
| lamp | #E8A33D | the lamp colour: the warm accent, glow, brass-gold highlights |
| lampDeep | #9A5F0E | shade side of lamp-lit objects |
| brick | #A03F30 | warm red accents (cocoa mug, umbrella, cap); small areas only |
| teal | #1F6F6C | cool green-blue accent |
| sage | #4F6B47 | calm green accent |
| rain | #8FA9BC | rain light, wet glass, foggy cool light |

Extended gouache tones (allowed, derived from the family):

| Name | Hex | Used for |
|---|---|---|
| plaster-lit | #D8B48A | lamp-lit plaster wall |
| plaster | #B98E64 | mid plaster |
| plaster-shade | #7A5640 | shaded plaster, evening wall far from the lamp |
| wood-lit | #B8794A | lit timber |
| wood | #8A5A36 | counter top, shelves, frames |
| wood-deep | #4F3322 | counter front, deep timber shade |
| brass-lit | #E3B65A | brass highlight |
| brass | #B88A32 | brass mid |
| brass-deep | #7A5718 | brass shade |
| cream | #F3E4C4 | porcelain, linen, page edges |
| cream-shade | #D9C49C | porcelain shade |
| dusk | #3F6283 | lighter dusk sky band near the horizon, denim light |
| harbour-grey | #5D7487 | rain-day sea and sky mid |
| sky-morning | #BBD3E0 | pale morning sky and harbour |
| sun-morning | #F2D9A0 | low morning sun and its wash |
| teal-light | #4F9A94 | lit teal |
| sage-light | #86A27A | lit sage, plant leaves |
| brick-light | #C9694F | lit brick |

Skin and hair are the only places outside this list: skin tones sit in the range of #F0CFB4 (fair) to #5B3A29 (deep brown) with warm undertones and one cool-blue shadow step; hair darks use `ink` and `inkSoft`, silvers use #C9CFD3 and #9AA3AB.

Hard colour rules:
- Never pure black (#000000) or pure white (#FFFFFF). Darkest = ink / night / wood-deep. Lightest = paper.
- Maximum 6 hue families per object sprite; interiors and key-art up to 8. Saturation is moderate: the highest saturation lives in the lamp glow, the window light and small accents (a red mug, a yellow scarf). Walls, wood and water stay muted.
- Warm vs cool: warm = light sources and what they touch (lamp, lit faces, brass, wood in light). Cool = shadows and distance (dusk sky, rain, shade side). Every image has a warm/cool split.
- Value structure: every asset must survive greyscale with a clear light-to-dark read (lit plane lightest, mid body, shade darkest). Interiors are mid-dark overall (average luminance about 25 to 40 percent) so that cream UI panels and amber buttons read on top; the lit window and lamp are the brightest areas.
- No gradient that spans more than a soft painted wash: tone changes are painted shapes with soft dry-brush transitions, not digital airbrush ramps.

## 4. Rendering technique: warm gouache, picture book

Matte, opaque, hand-painted gouache on slightly toothy paper, as in a well-printed contemporary picture book.
- Colour is laid in confident shapes with 2 to 3 value steps (light, mid, shade) plus at most one small accent highlight. Edges are soft-dry-brushed, never razor vector edges and never mushy.
- Visible but quiet brush character: faint stroke direction in large fields (walls: slight vertical or diagonal strokes; wood follows the grain; fabric follows the folds), subtle paper tooth at low contrast (about 3 to 5 percent value variation). The SAME texture at the SAME scale on every asset. It must read as pigment on paper, not as a noise overlay, not as canvas weave, not as film grain, not as pencil hatching.
- Faces: painted with the same gouache logic (simple planes, soft blended cheeks, a few confident marks for eyes and brows), not airbrushed skin, no pores, no plastic sheen, no hyper-detailed eyelashes.
- Detail budget: at most one level of secondary detail per object (a mug: handle and rim; a book: cover emblem and spine band; a cardigan: buttons and collar). If a detail would not read at 96 px it is either one confident shape or absent. No meaningless micro-detail (no tiny rivets, no filigree, no scribbles, no fake text-like marks).
- No gloss: no glassy highlights, no chrome, no 3D-render subsurface look, no airbrush smoothing, no photographic bokeh or depth-of-field blur, no vector-flat clipart without texture, no pencil sketch lines, no watercolour bleed blooms.
- Glass and liquid (windows, domes, drinks) are painted as opaque gouache shapes with a lighter highlight shape. Sprites never contain real transparency inside the object.

## 5. Line and edge treatment

- NO black outlines. Shapes separate by value and by a slightly darker, same-hue painted edge on the shade side (the natural edge-darkening of wet gouache), about 0.3 to 0.5 percent of canvas width, not a continuous drawn contour.
- Characters: facial features use a soft dark brown (`inkSoft` or `ink`) painted mark, never black, same weight on all eight characters and all expressions.
- Edge weight and softness are identical on every asset of the game.
- Transparent sprite edges are crisp, clean and fully anti-aliased (soft dry-brush texture only INSIDE the silhouette): no halo, no light or dark fringe, no matte colour bleed, no semi-transparent pixels inside the silhouette except the one allowed contact shadow (section 11).
- Opaque assets have no frame, border, inner stroke, rounded-corner mask, vignette or paper-edge baked in.

## 6. Lighting

One lighting logic for everything:
- KEY LIGHT: warm (colour of `lamp` #E8A33D lightened toward #FBD68A), from the WINDOW SIDE = the upper left (azimuth about 315 degrees, elevation about 40 degrees). It lights top and left planes and throws shadows DOWN-RIGHT. This holds for every character bust, every object and every decor item, regardless of the weather their interior appears in, so one sprite works in all three interiors.
- FILL: a very soft cool bounce from the lower right (colour about `rain` #8FA9BC, 10 to 15 percent strength). It lifts the shade side a little; it never creates a second hard shadow or a second highlight.
- Shade side colour is cool ink-blue (`night` #1F2F45 mixed into the local colour), never grey or black.
- Contact shadow under objects: `night` #1F2F45 at 20 to 30 percent opacity, soft, down-right (section 11).
- No rim lights on the right or bottom, no coloured gels, no god rays or light shafts, no lens flare, no sparkle, no star-burst, no bloom.
- Interiors: the window lamp and hanging lamps are the warm sources; warm light pools on the wall and counter nearest the window, the room falls off to warm-dark brown and blue shade at the edges. Painted glow is made of 2 or 3 stepped soft shapes, not an airbrushed halo. Shadows of props in the room still fall down-right so sprites placed on top match.
- Evening: strongest warm/cool contrast (amber lamp, deep blue outside). Morning: sun-morning gold low in the window, softer, lamp unlit. Rain: window is `harbour-grey` and `rain` blue, lamps warm inside, overall slightly cooler and lower in key.

## 7. Camera and view rules per asset class

| Class | View |
|---|---|
| Interiors (`interior-evening/morning/rain`) | Frontal, eye-level, one-point view into the shop, camera centred on the vertical axis, nearly orthographic: the back wall is a flat plane facing the viewer, the counter is seen from slightly above (top surface a thin band). Strong vertical symmetry in the architecture (arched window dead centre). All three weather variants use the IDENTICAL camera and layout (section 8). |
| Key-art | Frontal, slightly low eye-level view of the shop front from Quay Lane at dusk, building centred, same arched window as the interiors. |
| Icon | Front-facing graphic composition: the arched window, flat on to the viewer. |
| Customer busts | Eye-level, head and torso turned about 12 degrees toward viewer's LEFT (toward the key light), eyes looking at the player. Shoulders-up picture-book bust (section 9). Identical camera, head size and eye line on all eight characters. |
| Drinks, pastries, books | Three-quarter view from slightly above (camera elevation about 30 degrees), object upright, one fixed pitch for every object in the game. |
| Decor on the floor or counter (cushions, rosemary, cake stand, ladder, lamp, gramophone) | The same 30 degree three-quarter view. |
| Decor on the wall or ceiling (chart frame, rain chime) | Straight-on frontal elevation (they hang flat on the wall). |
| Feature graphic | Same frontal paper-picture view as key-art, wide framing. |

All generated art shares ONE world: same gouache, same light, same edge, same texture scale, same palette. A cup from b5 must look correct on the counter of the b1 interior; a bust must look correct standing in front of it.

## 8. The shop: fixed architecture (interiors, key-art, icon, feature graphic all follow this)

Exterior (key-art, icon, feature graphic): a narrow two-storey harbour-front building, the last on Quay Lane before the sea wall. Walls of weathered painted clapboard in `nightMid` / `dusk` (shade `night`); cream (`paperDark`) window frames, door frame and corner boards; a steep slate roof in `night`/`harbour-grey`; one small chimney. Ground floor: a timber door (wood tones) with a round porthole pane at the right, and ONE BIG ROUND-ARCHED WINDOW to the left or centre (see each brief) in a cream frame with a single thin horizontal transom bar at the springing line (separating the semicircular fanlight above from the tall pane below) and NO vertical bars. A small scalloped awning in `sage` over the door. NO signage and no lettering of any kind anywhere. In the window: the WINDOW LAMP, a brass ship's-lantern style lamp with a glass chimney and a warm flame core, sitting on the sill at the centre of the pane, lit in the evening and rain, unlit in the morning. On the sill beside it: two stacked books on the left and a cup on the right. The sill is cream stone/wood.

Interior frame (all three weather variants, 1024 x 1536, positions in percent of the canvas; x from left, y from top):

| Element | Position | Notes |
|---|---|---|
| Arched window (seen from inside) | x 29 to 71, apex y 9, springing line (transom) y 21, sill y 40 | Same single transom, no vertical bar. View outside: harbour water, far sea wall, distant boat lights per weather. Window lamp on the sill, centre, y 33 to 40. |
| Ceiling beam / top | y 0 to 5 | Dark timber beam, calm. |
| Left wall zone | x 0 to 34, y 4 to 66 | RESERVED CALM ZONE: plain plaster with faint wainscot panelling lower down. Decor sprites (cushions, ladder, rain chime) are placed over it by code. No furniture, no picture frames, no strong shapes. Faint low-contrast wall texture only. |
| Upper right wall | x 70 to 100, y 4 to 28 | RESERVED CALM ZONE for the chart frame sprite: plain plaster. |
| Right wall | x 76 to 100, y 30 to 62 | A bookcase unit, muted and low-contrast (simple coloured spines, no text, no strong highlights), partially cropped by the canvas edge. |
| Umbrella stand corner | x 2 to 14, y 64 to 80 | A plain ceramic umbrella stand (cream/teal) stands here in all three variants; in the rain variant it holds a wet dark-red umbrella (`brick` family) with a dark puddle sheen at its base. Keep it simple and small. |
| Centre wall | x 24 to 76, y 42 to 78 | THE UI ZONE: uncluttered mid-dark plaster wall with only a soft lamp-glow wash. No objects, no pictures, no shelves. Customers' busts and ticket cards sit here. |
| Back bar | y 66 to 78 | Plain dark panelled wall behind the counter, no objects. |
| Counter top surface | y 78 to 86 (far edge 78, near edge 86), full width | Empty wooden top, warm lit near the window; decor sprites (lamp, rosemary, cake stand, gramophone) stand with their bases on it at about y 83. NOTHING on the counter. |
| Counter front | y 86 to 100 | Dark `wood-deep` panelled front, calm, with a simple moulding line. |

The architecture is geometrically identical in all three interiors (same positions to within 1 percent of the canvas); only light, sky, window view, colour temperature, the rain streaks and the umbrella change.

On tall phones a 2:3 image shown with cover-fit loses about 15 percent of its width on each side: keep every essential element within x 15 to 85, the window within x 29 to 71, and treat x 0 to 15 and 85 to 100 as expendable.

## 9. Customers (the eight regulars)

Slot ids `customer-N-neutral|happy|sad`, N = 1 to 8. Delivered as 3:4 transparent PNG (1020 x 1360), generated at 1024 x 1536 and centre-cropped (x offset 2, y offset 88). All composition numbers below are percent of the DELIVERED 3:4 frame.

Framing (identical on all 24 busts):
- Shoulders-up picture-book bust, stylised proportions: large head, narrow sloped shoulders. Head = crown (hair, cap or scarf included) to chin about 55 percent of the height: crown at y 11 to 13, chin at y 64 to 68. Eye line at 38 percent from the top (tolerance +-1.5). Head width about 50 percent of the frame width, centred on x 50 (+-2 for the 12 degree turn).
- Neck and shoulders from y 68 down; the torso continues past the bottom edge (cropped by the frame, not painted off). Shoulders at the bottom edge span at most 88 percent of the width (x 6 to 94). The bottom corners and the outer 3 percent border at top, left and right are fully transparent (alpha 0).
- No hands, no arms visible. No props that need hands. Props that rest on the body are fine (glasses, scarf, headphones, stethoscope, bow tie, satchel strap, a sketchbook corner under the arm).
- No cast shadow outside the silhouette, no ground, no seat, no counter, no background elements.
- Light: section 6. Face lit from the upper left; cool shade on the right side of the face and under the chin.
- Faces: age-true, individual, believable. Calm, kind, a little tired where the character brief says so. Symmetrical features where expected: both eyes the same size and aligned on the eye line, pupils looking at the player, ears (when visible) similar, glasses geometrically correct (round, both lenses equal, arms reaching the ears), no melting hair/cloth merges. Teeth: if shown at all, one soft light shape without individual tooth outlines; prefer closed or barely parted mouths.
- Expressions (B3): face-only changes. Neutral = relaxed, attentive, a hint of the character's resting mood. Happy = a genuine warm smile, eyes crinkling, cheeks lifted, brows relaxed-high. Sad = the disappointed face of a customer who did not get what they wanted: mouth gently down, inner brows raised, eyes lowered or slightly glassy, NO tears, NO crying, NO anger. Subtle but readable at 120 x 160 px. Hair, outfit, props, head position, shoulder line and framing stay IDENTICAL to the accepted neutral (head position may differ by at most 1 percent of the frame, and only a tiny tilt for the sad face is allowed). Identity check: overlay the neutral and the new expression at 50 percent; everything outside the eyes, brows, mouth and cheeks must coincide.
- Walk-ins are drawn by code; do not draw them.

Distinctness (the eight must be told apart in one glance at 120 x 160 px): by silhouette first, colour second. Odile = soft round head with a low bun, glasses, navy; Tobias = rust knit cap, long freckled face, denim straps; Priya = olive hood collar, braid over shoulder, tortoiseshell glasses, satchel strap; Juno = yellow scarf-tied curls, big headphones, apron bib; Henrik = flat tweed cap, great moustache, yellow vest, broad; Leona = sleek black bob with silver, forest-green coat, stethoscope; Abel = wispy white hair, bow tie, spectacles on chain, stooped; Sunniva = messy auburn bun with pencil, mustard slouchy cardigan, blue paint-flecked scarf.

Skin and age (diversity, binding): Odile fair, weathered, silver; Tobias fair, freckled; Priya warm brown; Juno deep brown; Henrik fair and ruddy; Leona light olive; Abel pale with age spots; Sunniva fair with light freckles.

## 10. Objects (drinks, pastries, books, decor)

Slot ids: `drink-1..6`, `pastry-1..5`, `book-1..5`, `decor-1..8`. Square 1024 x 1024 transparent PNG. Display: 192 px (drinks, pastries, books; shown at about 96 css px and as small as 32 to 48 px on tickets) and 256 px (decor; shown at 128 css px in the shop and about 50 to 95 px when placed in the interior).
- View: section 7 (30 degree three-quarter, wall items frontal). Light: section 6. One object per file, centred.
- Fill: object plus its contact shadow occupy 78 to 84 percent of the canvas in the larger dimension (never above 88, never below 70). Tall decor (ladder, chime, lamp) fills the height; wide decor (cushions) fills the width.
- Scale consistency inside a class: all six drinks have the same visual weight and cup height class (a mug about 50 to 58 percent of the canvas width), all five pastries sit on the same plain plate, all five books share a cover height of about 70 percent of the canvas (the picture book is squarer and larger by width only).
- The common plate for pastries: round, ivory `paperDark` #EAD9B8 with a thin `teal` rim band, diameter about 82 percent of the canvas width, seen at the 30 degree pitch.
- No text, letters or numbers on anything (covers, charts, labels, packaging, gramophone record): emblems and pictograms only.
- No steam, smoke, sparkles, droplets in the air, no baked glow around lit objects.

## 11. Transparent sprite construction rules (busts and objects)

- 8-bit RGBA PNG, straight (non-premultiplied) alpha. Background alpha exactly 0 including all four corners and the outer 3 percent border (busts: all except the bottom edge as in section 9).
- No ground plane, no floor patch, no grass or table baked in.
- ONE allowed baked contact shadow per object (not on busts): `night` #1F2F45 at no more than 30 percent alpha, soft, hugging the base, falling down-right, kept inside the canvas with at least 4 percent margin. It must be semi-transparent ink only (never an opaque or coloured patch) so it works over wood, plaster and UI cards.
- No semi-transparent pixels inside the object body; the silhouette interior is fully opaque (glass is painted opaque).
- No halo, no fringe, no matte colour bleed. Verify every sprite composited over FOUR backgrounds: #1F2F45 (night), #2D4560 (nightMid), #FBF1DC (paper), #8A5A36 (wood). Edges clean on all four. Prefer native transparent generation or a clean matte; if a chroma-key is used it must not be a colour present in the object, and the edge must be decontaminated.
- Do not bake in UI: no badges, rings, numbers, price tags, check marks, locks, hearts, stars.

## 12. Scale rules

- All busts: identical head size and eye line (section 9). A tall/old/young character is told by posture and features, not by changing the head size.
- All drinks: same pitch, similar rim width; Tide Latte glass is taller but not wider than the biggest mug.
- All pastries: same plate; the pastry itself fills about 55 to 62 percent of the plate width.
- All books: same pitch, same upright pose, cover height about 70 percent of the canvas; thickness varies (almanac thick, poems slim).
- Decor relative sizes (art and interior placement must agree): cushion pile and gramophone are the largest; rosemary pot, lamp and chime are small; the cake stand is medium; the ladder is tall and narrow; the chart frame is a flat landscape rectangle.
- Interior vs sprites: sprites are drawn as if standing in the same room: a mug on the counter is about 5 to 6 percent of the interior width. Do not paint objects in the interiors that duplicate the sprites (no cake stand, gramophone, ladder, rosemary, reading lamp, chart frame, cushions, rain chime in the backdrop).

## 13. How each asset is used in the UI (display size and overlays)

Phone portrait viewports are typically 360 to 430 css px wide and 640 to 930 css px tall (aspect 1:1.8 to 1:2.2).

| Asset | Where | Size on screen | What overlays it |
|---|---|---|---|
| icon | Launcher icon, splash source | 48 to 1024 px, adaptive masks (circle, squircle, rounded square) | nothing; no text |
| key-art | Title screen, splash source | full-screen portrait cover-fit | Title "The Last Window" in Young Serif (paper colour, top band y 0 to 26 percent), "Tap to begin" and home buttons (amber `lamp` fills, bottom band y 76 to 100 percent) |
| interior-evening / morning / rain | Shift background (weather by day), day intro, shop preview, stock plan | full-screen portrait cover-fit, usually with a code dim of 0 to 30 percent | HUD (top about 12 percent, panel-backed), three seat cards with the regular's bust (centre zone), station panels and book shelf (lower half, panel-backed), decor sprites at fixed spots (section 8), rain streak animation by code in the rain variant |
| customer-N-neutral / happy / sad | Seat card (about 120 x 160 css px), story scenes (about 240 x 320 css px), Journal, finale card, Day intro "due" list (about 56 px thumbnail) | 56 to 320 css px tall | Name chip, patience bar, order icons, speech panel drawn by code NEXT TO the bust; the lower 12 percent of the bust may be covered by a card edge |
| drink-N | Station buttons, ticket order, tray, Recipes screen | 32 to 96 css px | Step ring/progress by code on top, price chip below |
| pastry-N | Pastry station plates, ticket, tray, stock plan | 32 to 96 css px | Portion count chip by code, oven progress ring |
| book-N | Book shelf, ticket, tray, recipes (mood tags) | 32 to 96 css px | Two mood-tag chips (icon + word) drawn by code next to it |
| decor-N | Shop screen cards (about 128 css px), placed over the interior at fixed spots (14 to 22 percent of interior width) | 50 to 128 css px | Price/Owned chip by code; keep the top-right 15 percent free of fragile detail |
| feature-graphic | Store listing only | centre crop 1024 x 500 | nothing; no text |

JUDGE SPRITES AT 32, 48 AND 96 PX (objects) and at 120 x 160 px (busts) on `night` #1F2F45 and on `paper` #FBF1DC.

## 14. Distinctness map (siblings must be readable apart at 48 px)

- Drinks: vessel silhouette first, colour second. `drink-1` short wide cream enamel mug with navy rim, black coffee; `drink-2` tall glass tumbler on a small saucer with two visible layers (brown below, cream above); `drink-3` handleless grey-blue glazed tea bowl, smoky amber tea; `drink-4` butter-yellow teacup and saucer with a honey dipper and 2 or 3 chamomile flowers on the saucer; `drink-5` round-bellied brick-red mug with cocoa and a cream dollop; `drink-6` tall straight-sided night-blue mug with a gold rim band, dark mocha under pale foam dusted with cocoa.
- Pastries (all on the same plate): `pastry-1` plain glossy-less golden round roll with flaky salt flecks; `pastry-2` twisted cinnamon knot, darker brown with sugar dust; `pastry-3` round tart topped with a fan of pear slices and a glaze; `pastry-4` split pale bun with lemon cream and sugar dust, a small yellow lemon wedge; `pastry-5` a thick slice of dark ginger loaf with white glaze drizzle and dust.
- Books: cover colour AND emblem. `book-1` thick forest-green cloth with a gold lamp-and-rays emblem; `book-2` slim dusty blue-grey with two small sparrows over waves; `book-3` terracotta leather with a compass rose (no letters) and a dotted route; `book-4` bright yellow paperback with an inside-out broken umbrella; `book-5` large squarish pale sky-blue picture book with a white gull in a small red hat.
- Decor: silhouettes: low wide pile (cushions), small lamp with green dome shade, small pot with sprigs, dome on a stand, tall narrow ladder, flat rectangle frame, hanging tube cluster, horn on a stool.

## 15. What to avoid (hard fail list; this is the review rubric)

1. Any text, letters, numbers, signs with lettering, signatures, logos, watermarks, clock faces with digits, chart numerals, book titles, record labels.
2. Anatomy and construction errors: wrong hands (hands are avoided), eyes that do not match or look different ways, ears, teeth, melting hair-to-cloth, warped glasses, headphones that do not connect, collars that merge into skin, mugs with two handles or a handle that does not attach, tilted rims, books with impossible spines, ladders with missing rungs, windows that float, stairs or arches that do not close, wrong perspective.
3. Style drift: different line weight, texture, light direction, pitch or palette from the other assets. A single asset that looks "from another set" is rejected. Identity drift between expressions of one character.
4. Unreadable at display size: mush, low-contrast silhouettes, too many tiny elements, faces that do not read at 120 x 160 px.
5. Technical faults: wrong aspect or size, baked checkerboard, halo or fringe, non-zero corner alpha on sprites, borders or vignettes on opaque assets, JPEG artefacts, upscaling blur.
6. Composition faults: subject in the title band, busy centre in interiors, objects on the counter, anything in the reserved decor zones, key content outside the central 70 percent width.
7. Generic AI tells: plastic gloss, airbrushed sameness, random sparkles or bokeh, lens flare, depth-of-field blur, god rays, over-saturation, muddy gradients, uncanny or waxy faces, symmetrical-clone faces across the eight characters, over-smooth skin, "fantasy storybook glow", inconsistent shadows, meaningless filigree, steam wisps, floating dust motes.
8. Purpose failures: two drinks, pastries, books or decor items that cannot be told apart at 48 px; a happy face that reads neutral; a sad face that reads angry or tragic; a lamp that looks unlit when it is the lit source.
9. Copyright: no recognisable characters, brands, logos, famous artworks or close imitation of a specific game or illustrator. Generic warm gouache picture-book only.
10. Also forbidden: UI of any kind inside the art, speech bubbles, water droplets or steam baked into sprites, baked glow halos around sprites, ground planes under sprites, crowds, people in the key-art/icon/interiors/feature graphic (the customers are added by code), cats or dogs (not in the game).

## 16. Style preamble (paste into every generation prompt, then add the asset-specific text)

"Warm hand-painted gouache illustration for a cosy picture-book style mobile game, matte opaque paint on lightly toothy paper, soft dry-brush edges, two to three value steps, no outlines, no black, no pure white, restrained palette of deep dusk blue, warm lamp amber, plaster and timber browns with small accents of brick red, teal and sage. One warm key light from the upper left with cool blue shade and soft shadows falling down-right. Calm composition, one clear focal point, generous quiet areas. No text, no letters, no numbers, no logos, no watermark, no UI, no gloss, no sparkles, no bokeh, no lens flare, no airbrushed sheen."

Keep a short written "style card" of the accepted b1 assets (palette swatches sampled from them, texture crop, edge crop) and attach those crops as reference images for all later batches.

## 17. Self-review checklist before delivering (the reviewer will run it too)

1. Build a contact sheet per batch at 1x: objects at 32, 48 and 96 px on #1F2F45 and on #FBF1DC; busts at 120 x 160 px on #2D4560; icon at 48 and 96 px; interiors at about 390 px wide with the HUD band, the three seat cards and the decor zones overlaid as rectangles; key-art with the title band and button band overlaid.
2. Run the rubric in section 15 point by point; reject your own failures and regenerate.
3. Compare each new asset side by side with the batch's anchor and every accepted asset: edge, texture, light, pitch, palette. Compare each expression overlaid on its neutral.
4. Check the alpha channel with a script (corners, border band, interior opacity, no checkerboard) and the exact pixel sizes.
5. Only then write `manifest.json` and deliver.

When unsure, regenerate. A rejected asset costs a round; a weak accepted asset costs the game.
