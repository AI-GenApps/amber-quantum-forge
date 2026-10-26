# Lost Parcel Desk - art bible (v1)

Audience: the designer (image-generation agent). Read this whole file before any brief. Every asset in every batch must obey it. The bar is a featured, award-calibre mobile game, not "good for AI". When in doubt, simplify: fewer, bolder, better-placed shapes and a confident two-to-four-ink print.

Sources of truth (read-only, in the game worktree `.agents/games/lost-parcel-desk/`): `product.md` (loop, screens, palette tokens), `content-plan.md` (the 12 cases, 49 evidence objects, 12 townsfolk), `assets-index.md` (slot list and display sizes). The game spec line for the look: "1970s post-office cosy-noir in a risograph-print look: limited palette (mustard, teal, brick red, cream, ink), visible grain and slight misregistration, clean object illustrations on transparent backgrounds, portraits in the same riso style. No legible text on objects (code overlays any text)."

## 1. What the game is (so the art can serve it)

A calm detective game set in Ketterly, a small river town, in 1974. After a flood the new post-office clerk (the player) opens lost parcels. Each case: open a parcel, inspect 4 or 5 evidence objects (pick up, flip to read the back, use a magnifier to find small details), pin clues to a deduction board, link clues to three townsfolk profile cards, and accuse one as the owner. No timers, no failure state, no violence, no blood, no weapons. Cosy-noir means lamp-lit, rainy-night, warm and curious, never grim.

Everything that is TEXT is drawn by code in Courier Prime / IBM Plex Sans: clue text, labels, torn-label addresses, stamps, postmarks, notes, handwriting, the back faces of objects, captions, the title. Generated art is ONLY: the app icon, the title key-art, the desk backdrop, 49 evidence-object front sprites, 12 townsfolk busts, the closed and open parcel, and the store feature graphic. Your art never contains UI, buttons, counters, frames, or readable text.

## 2. Mood

A night-shift sorting room in a small-town post office: a mustard desk lamp, a teal-green blotter, brick-red rubber stamps, cream paper everywhere, a river outside the window. Warm, wry, human, slightly nostalgic; the objects have been handled, repaired and kept. Think of mid-century British public-information posters and paperback covers printed on a two- or three-drum risograph, not a fantasy illustration, not glossy 3D, not pixel art, not photoreal, not vector clipart.

Humour is gentle (a cat-chewed corner, a biscuit-tin dent). Characters are neutral, dignified and kind: no caricature, no sneer, no mockery of age, body, accent or ethnicity.

## 3. Palette (hex, binding)

These are the game's design tokens (`product.md`). Sample them; do not invent a neighbouring "almost" palette.

| Token | Hex | Role in art |
|---|---|---|
| ink | #1C2330 | all keylines, deepest accents, rubber-stamp ink, hair darks. Never pure black. |
| night | #141A22 | deepest backgrounds (key-art window, desk backdrop). Not used inside object sprites. |
| cream | #F3E9D2 | paper, lightest light, highlights |
| cream-2 | #E4D6B4 | paper mid-tone, secondary paper, label stock |
| mustard | #D9A21B | brass, desk blotter, lamp, accents |
| mustard-deep | #7A5200 | brass shade side, deep wood, shade tone |
| mustard-light | #F0CF7A | lamp light, brass highlights, pins |
| teal | #1F7A7A | fills only (tins, cloth, blotter) |
| teal-deep | #135A5C | shade side of teal, dark cloth, window dusk |
| teal-light | #8FD0C8 | highlights on teal, glass, steel |
| brick | #A8382A | rubber stamps, ribbons, red fills |
| brick-deep | #7D2519 | shade side of brick, rubber, velvet |
| line | #8A7A52 | hairlines only (rules on paper, faint creases) |

Derived overprint tones (allowed; this is how a real riso printer mixes two inks; each may cover at most 8 percent of an asset, always as a halftone or overlap zone, never as a new flat base colour except where noted):

| Name | Approx. hex | Made from | Used for |
|---|---|---|---|
| kraft | #C48A2C | mustard + 20 percent brick halftone | brown wrapping paper, cardboard (flat base allowed for parcels and card stock) |
| copper | #B5521E | brick over mustard | red hair (flat base allowed on hair only) |
| olive-shade | #4F6E3E | teal over mustard | shadow overlap only |
| plum-shade | #5B2A2A | teal-deep over brick | shadow overlap only |
| skin 1 light | #F0D9B9 | cream-2 + faint mustard-light | portraits only |
| skin 2 light-medium | #E2B98A | mustard-light + cream-2 | portraits only |
| skin 3 medium | #C98F5B | mustard-light + brick halftone | portraits only |
| skin 4 brown | #A8683A | mustard + brick | portraits only |
| skin 5 deep | #7A4326 | brick-deep + ink halftone, highlights mustard-light | portraits only |

Hard colour rules:
- Never pure black (#000), pure white (#FFF), or any neon. The darkest value is ink or night, the lightest is cream.
- Max 4 ink families per asset in addition to cream paper and ink keylines (for example teal + mustard + brick + ink + cream). Most evidence sprites should use 2 or 3.
- Teal never carries text-like detail (contrast); it is a fill colour.
- Skin is NEVER teal, green, blue or grey. Skin tones come from the skin rows above, with brick halftone blush on cheeks.
- Value structure: every asset must survive greyscale with a clear light-to-dark read: lightest = cream highlights, mid = fills, darkest = ink keyline and deep shades.
- Saturation is moderate and printed-looking (slightly chalky, ink-on-paper), never glowing. No gradients that look airbrushed: tone changes are stepped (flat fills, halftone dots, hatch), at most 6 percent value drift inside a flat fill from print unevenness.
- The ONE warm light in scenes is the mustard lamp. Everything else is cool or neutral paper.

## 4. Rendering technique: riso print

Treat every asset as if it were printed on a 3-drum risograph (plus an ink keyline drum) on cream stock, then cut out.
- Flat spot-colour shapes, overprinted: where two inks overlap they multiply (darker), producing the derived tones above. 2 to 4 colour layers per asset.
- Halftone shading only, never smooth shading: coarse round-dot halftone at a pitch of about 22 to 26 px at 1024 canvas width (about 2.3 percent of the canvas), dots clearly visible at 220 px display size, used on the shade side (down-right) of forms and on at most 25 percent of the object's surface. The dot pitch is IDENTICAL on every asset (scale it with canvas width for the 1536 and 1600 wide assets). Do not use fine halftone (it turns to moire and mush at 84 px).
- Grain: a fine ink-speckle and paper-tooth texture, speckle size about 2 to 4 px at 1024, 4 to 7 percent of the pixels in solid fills dropping to the lighter ink or paper tone, at the same scale on every asset. It must read as uneven ink coverage on paper, not as digital noise, not as a film-grain overlay, not as canvas weave.
- Misregistration: the colour-fill layers are offset from the ink keyline layer by 5 px up-left at 1024 (about 0.5 percent), the SAME direction on every asset. Result: a thin sliver of fill colour pokes outside the keyline on the top-left, and a thin cream gap shows between fill and keyline on the bottom-right. Never more than 8 px, never random per object, never blurry.
- Interior gaps and dropouts show CREAM-2 paper colour, never transparency. In transparent sprites every pixel inside the silhouette is fully opaque.
- No gloss, no plastic, no glassy highlights, no chrome, no 3D-render subsurface look, no airbrush, no photographic bokeh, no pencil/ink sketch hatching beyond the single halftone system, no watercolour bleed, no lens flare, no drop-shadow soft blur.
- Detail budget: at most one level of secondary detail per object (a dented tin: the dent; a key: the bow and the bit). If a detail would not read at 84 px it is either one confident shape or absent. No meaningless micro-detail: no filigree, no scribbles, no rivets, no stitches drawn one by one.

## 5. Line and edge treatment

- A single ink keyline (#1C2330) around every object silhouette: weight 1.5 percent of the canvas width (about 15 px at 1024), constant, slightly rounded caps, no tapering, no pressure variation. Interior structural lines (folds, rims, seams, cuts) are 0.8 percent (about 8 px). Nothing thinner than 0.6 percent except the faint `line` hairline rules printed on paper, which may be 0.4 percent.
- Outer silhouettes are crisp and fully anti-aliased: no soft edges, no glow, no halo, no light or dark fringe, no matte colour bleed.
- Corners: paper corners are crisp with a tiny (0.5 percent) wear radius; metal and ceramic are smooth. Curves must be smooth and symmetrical where the object is symmetrical (a compass, a teacup, a tin lid, a tuning fork).
- Opaque scene assets (icon, key-art, desk-backdrop, feature-graphic) have no frame, border, inner stroke, rounded-corner mask or vignette baked in. They use the same keyline rule on their objects, but large background masses (walls, desk) may be keyline-free flat shapes.

## 6. Lighting

One logic only. A key light from the TOP-LEFT (azimuth about 315 degrees, elevation about 45 degrees): highlights sit on top-left edges as cream or light-tone flat shapes; shade is a halftone on the bottom-right sides of forms; cast shadows fall DOWN-RIGHT.

Cast shadow on every transparent evidence sprite and the parcels: a short flat shadow, offset exactly 2.5 percent of the canvas (about 26 px at 1024) right and down from the silhouette, drawn as an ink (#1C2330) coarse halftone dot field (same dot pitch as shading, about 60 percent dot coverage), fully opaque dots on transparent ground, crisp-edged, only the exposed crescent along the right and bottom edges is visible. It is part of the artwork and counts inside the bounding box. No soft shadow, no blur, no semi-transparent shadow pixels.

Portraits have NO cast shadow (they are die-cut busts); shading is the halftone on the right/lower side of face, neck and clothing.

In scenes (key-art, backdrop, feature graphic) the mustard lamp is the only emissive light: it brightens nearby paper in stepped flat tones (mustard-light, then cream) with at most 2 stepped lamp-pool discs of flat overprint, no glow, bloom, rays, haze or sparkle. Window light is cool teal-deep with no rim.

## 7. Camera and view rules per asset class

| Class | View |
|---|---|
| F: flat things (papers, cards, tickets, cloth, folded fabric, keys, pencil, compass, notebook) | Exactly top-down, orthographic, as if laid on a desk and photographed from above. No perspective, no keystone. Papers show a thin edge thickness (about 1 percent) on the bottom-right only, and may be rotated within plus or minus 8 degrees, one soft fold or curl at most. |
| V: volumes (tins, boxes, bags, cup, lamp, ferrule, chess piece) | Gentle high three-quarter view, about 35 to 40 degrees above the desk, orthographic (no wide-angle distortion), object standing on its base. Lids and rims are ellipses of ratio about 0.55. Light and halftone as section 6. |
| E: straight-on elevation | Only the brass barometer (instrument face straight to camera). |
| Portraits | Front view, head turned at most 10 degrees, eyes level, cropped at the chest. |
| Parcels | About 60 degrees above the desk (near top-down) so the label plane is a clean, almost undistorted rectangle. |
| Scenes | Frontal, orthographic stage-set composition (flat layered planes, like a screen-print poster), no converging perspective. |

All sprites share ONE world: same ink, same keyline, same halftone pitch, same grain, same light, same misregistration. A tin from b2 must look correct next to a cup from b5 on the same desk.

## 8. Scale rules

- Every evidence sprite (square 1024 canvas) fills 75 to 80 percent of the canvas in its larger dimension, INCLUDING the offset shadow crescent; never above 84 percent, never below 70 percent. Centred by visual mass. The outer 6 percent border on every side is fully transparent. Objects are NOT drawn to physical scale against each other (a ferrule and a trouser leg both fill the frame); instead line weights, dot pitch and grain stay fixed in canvas terms, so small objects get big, simple shapes and large objects are simplified and folded or cropped by a natural fold.
- Elongated objects (pencil stub, tuning fork, key, trousers, bookmark) are placed on the long diagonal or vertical so that the larger dimension reaches the 75 to 80 percent target.
- Portraits: head (crown to chin) is 38 to 42 percent of the bust height; eyes at 30 percent of the height from the top; shoulders at 60 to 64 percent; the bust ends in a flat clean horizontal cut at 94 percent of the height; shoulders no wider than 88 percent of the width. All 12 busts share these numbers exactly so the cast lines up in a row.
- In scenes, props are small relative to the frame; one clear hero per image.

## 9. Characters (townsfolk busts)

Style: mid-century editorial portrait in riso, like a screen-printed paperback illustration. Flat skin fill with a brick-halftone blush on the cheek and ear, a darker skin overprint for the nose side and the shade side. Features: eyes are two small ink almond shapes with a single upper lid line and a tiny cream highlight, brows one bold ink stroke each, nose a simple L-shaped line or darker-skin shape, mouth a single gently curved closed line (neutral, a hair warm, never a smile with teeth). Ears are always visible and correctly placed (top level with brows, bottom level with the nose tip). Necks are present and connect to shoulders. No hands, no arms visible below the cropped chest, no teeth, no tongue, no tears, no heavy lashes, no glossy eye highlights, no pupils that look in different directions.

Anatomy discipline: two eyes of equal size on one horizontal line (glasses rims included), nose centred on the face axis, symmetric ears, believable jaw. Eyes through spectacle lenses must be visible and unwarped. Hair has a readable silhouette and 2 or 3 flat shapes, never strands. Dark hair is ink with a teal-light highlight band on the top-left so the silhouette does not vanish against night. Grey hair is cream-2 with halftone.

The 12 look different at 54 px wide: distinct hair silhouette, headwear, collar and accessory shapes, different skin tones, ages, genders and heights. Facets (see `content-plan.md`) are shown visibly where they are a look: red hair, spectacles, hearing aid (a small beige behind-the-ear unit and tube, clearly visible), walking stick (visible handle leaning on the shoulder, no hand), tall (long neck and head high in the frame). Street, pastime, pet and left-handedness are NOT shown. Exactly two of the cast wear spectacles (townsfolk-2 and -5), two have red hair (-1 and -10), two have hearing aids (-4 and -9), two use walking sticks (-8 and -11), two are tall (-7 and -12). Nobody else has any of these features.

Originality: invented people, period-plausible 1974 British small-town dress, no resemblance to real or fictional persons or celebrities.

## 10. Greeking: how paper items show "writing" without writing

Printed or handwritten text is code. Paper objects imply text ONLY with:
- solid horizontal bars (ink at 100 percent or a halftone), at least 2.5 percent of the canvas tall, with squared or rounded ends, never letter-like;
- at most 5 bars per object, at most one heading bar thicker than the others;
- empty ruled lines (`line` hairlines) for ruled paper; empty boxes, circles and perforations;
- decorative borders, emblems without lettering (a tiny ferry silhouette, a tiny lamp), and music staves for the hymn sheet.
Never: letters, numerals (EXCEPT the single numeral 8 on the brass house number 11-1), fake letters, fake handwriting or scribble, signatures, barcodes, clock faces with numbers, dial numbers, logos, brand marks.

## 11. Zoom-hotspot rule

Some objects hide a clue under the magnifier (a copper hair in the scarf, a thumbprint on a lens cloth, coal cinders in a box fold, a stamped tag). The hotspot disc and clue text are code. Keep the area where the hotspot will sit CALM: a plain, unbroken patch of the object's surface about 20 percent of the object's width, no competing detail. Each brief names it. Do not draw the hidden clue itself (no hair strand, no thumbprint, no cinders, no engraved or stamped marks).

## 12. How each asset is used in the UI (display size and overlays)

CSS px sizes; the runtime art is shipped at 2x. Phone portrait viewports are 360 to 430 px wide and 640 to 930 px tall (aspect 1:1.8 to 1:2.2); a 2:3 image shown cover-fit loses about 15 percent of its width on each side on tall phones, so keep everything essential inside the CENTRAL 70 PERCENT OF THE WIDTH.

| Asset class | Where | Size on screen | What overlays it |
|---|---|---|---|
| icon | Launcher icon, Home and Boot (84 and 96 px), splash source | 48 to 1024 px, adaptive masks (circle, squircle, rounded square) | nothing; no text |
| key-art | Title screen background, splash source | full-screen portrait cover-fit | Game title in Courier Prime (top band), Start/Continue buttons (bottom band) |
| desk-backdrop | Behind the evidence table and the deduction board | full-screen portrait cover-fit, usually under a 15 to 30 percent night scrim | Header (top 12 percent), evidence objects as 84 px sprites with captions, parcel-open 72 px, clue tray, three profile cards, link menus, controls (bottom 16 percent) |
| evidence sprite | Evidence table (84 px, slight random tilt of up to 3 degrees by code), Object viewer (220 px, flips to a code-drawn back face), Almanac and board chips (about 54 px) | 54 to 220 px | clue hotspot discs (48 px hit area), caption and state labels below; nothing is drawn on top of the art except hotspots |
| townsfolk bust | Profile cards on the board (54 x 72 px beside name and trade), Reveal screen (72 x 96 px), Townsfolk Book | 54 to 96 px wide | name, trade, link ticks and stamps are beside or over the lower corner by code; a "Return to sender" brick stamp is rotated over the card |
| parcel-closed | Case intro | 180 px | torn-label text drawn by code OVER the blank label area; string and tag stay below it |
| parcel-open | Evidence table, top-left corner | 72 px | nothing |
| feature-graphic | Store listing only | 1024 x 500 centre crop of the 3:2 master | nothing; no text |

JUDGE EVERYTHING AT REAL SIZE: evidence sprites at 54, 84 and 220 px; busts at 54 x 72 and 72 x 96; icon at 48 and 96; parcel-closed at 180 and parcel-open at 72; backdrop and key-art at 390 px wide with the overlay bands drawn on top. If a thing cannot be named at 84 px (evidence) or the person cannot be told apart from siblings at 54 px (portraits), it fails.

## 13. What to avoid (hard fail list; this is the review rubric)

1. Any text, letters, numbers, signs, signatures, logos, watermarks, brand names, fake script, handwriting, barcodes (the only allowed glyph is the single numeral 8 on `evidence-11-1`, and only a pure brass numeral).
2. Anatomy and construction errors: hands, eyes, teeth, limbs, ears, glasses that do not sit on the nose, a glove with the wrong number of fingers (exactly four fingers and a thumb), keys without a coherent bit, a tuning fork with unequal tines, a horse's head with two eyes on one side or extra ears, teacup handles that do not connect, objects that merge or melt, impossible perspective, a trouser with other than two legs, a compass with letters.
3. Style drift: a different keyline weight, halftone pitch, grain scale, light direction, palette, or rendering technique from the accepted assets. One asset that looks "from another set" is rejected. Soft airbrush shading is a style break.
4. Unreadable at display size: mush, low-contrast silhouettes, micro-detail, objects that look alike at 84 px (many papers!), portraits that cannot be told apart at 54 px.
5. Technical faults: wrong aspect or size, baked checkerboard, halo or fringe, non-transparent corners on sprites, semi-transparent interior pixels, borders or vignettes or rounded corners on opaque assets, JPEG artefacts, an alpha channel on opaque assets with values below 255.
6. Composition faults: subject in the title band or button band, busy backdrop centre, hero outside the central 70 percent, bounding box outside 70 to 84 percent for sprites.
7. Generic AI tells: plastic gloss, airbrushed sameness, sparkles, bokeh, lens flare, god rays, glow, over-saturation, muddy gradients, symmetrical-clone repetition, meaningless filigree, inconsistent light sources, uncanny faces, waxy skin, glassy eyes, fantasy-storybook polish, a "vintage filter" look.
8. Purpose failures: an object that does not read as what its name says; two siblings in a batch that look alike; a portrait that shows a look (spectacles, red hair, hearing aid, stick, tallness) it should not have, or lacks the one it must have; a parcel label area that is cluttered.
9. Originality: no recognisable characters, brands, logos, famous artworks, real stamps or postmarks, real shops, Red Cross or other emblems, or a close imitation of a specific game or illustrator.
10. Also forbidden: baked UI of any kind, soft shadows, outer glows, floating sparkles, people inside scenes (key-art, backdrop, feature graphic have no people), pets or animals in any asset (the cat/dog/canary/tortoise/goldfish facts are text only), weapons, blood.

## 14. Technical delivery rules (all batches)

- Transparent sprites: 8-bit RGBA PNG, straight (non-premultiplied) alpha, background alpha exactly 0 including the four corners and the outer 6 percent border; silhouette interior alpha exactly 255. Recommended removal method: generate on a flat #FF00FF (magenta, absent from the palette) background, key it out with an edge-safe method, despill the magenta from edge pixels, then verify. Any method is acceptable if the checks pass.
- Verify every transparent asset composited over four backgrounds: night #141A22, cream #F3E9D2, teal-deep #135A5C, mustard #D9A21B. No halo, fringe or magenta/white edge on any.
- Opaque assets: PNG, no alpha or alpha 255 everywhere, no border.
- Exact sizes as stated per asset. Portrait 3:4 busts: generate on a 1024 x 1536 canvas with all content inside the central 3:4 window (rows 85 to 1451), then crop that window and resize to exactly 960 x 1280; deliver that file.
- Compare every new asset against `b1` accepted anchors before delivering.

## 15. Self-review checklist before delivering (the reviewer will run it too)

1. Build a contact sheet per batch at 1x: evidence at 54, 84 and 220 px over night #141A22 and cream #F3E9D2; busts at 54 x 72 and 72 x 96; icon at 48 and 96; parcel-closed at 180, parcel-open at 72; backdrops at 390 px wide with the overlay bands drawn on top.
2. Run the rubric in section 13 point by point; reject your own failures and regenerate.
3. Put the new asset beside the batch anchor and every accepted asset: keyline weight, dot pitch, grain, misregistration direction, light, palette.
4. Check the alpha channel with a script (corners, 6 percent border, interior alpha 255, no checkerboard, no fringe on the four test backgrounds).
5. Check siblings are distinct at 84 px (all papers side by side; all tins and boxes side by side; all keys; the 12 busts in a row at 54 px).
6. Only then write `manifest.json` and deliver.

When unsure, regenerate. A rejected asset costs a round; a weak accepted asset costs the game.
