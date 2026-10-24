# Cloud Observatory - batch b4, round 2

Read `../../art-bible.md` first. Style anchor: the accepted b1 (observatory-building especially), the accepted b2 backdrops and the accepted b3 emblems in `../../accepted/`. These eight instruments appear together in a vertical Build list at 112 x 112 CSS px, so they must look like one set: same viewing angle, same brass treatment, same size on the canvas, same line weight. Recommended generation order: `instrument-telescope` first (it sets the set; use the accepted `observatory-building.png` as the reference), then the others using your telescope as a reference; finish by comparing all eight on one contact sheet at 56 and 112 px on ink-800.

## Round-1 outcome (read this)

Round 1 was reviewed: `b4/round-1/out/` was EMPTY. No PNG and no `manifest.json` were delivered, so all eight assets are rejected as "missing". There is no visual feedback to give because there was nothing to view. All eight are therefore re-briefed below in full, with their original spec unchanged. Revision notes that apply to every asset:

- Actually write the files to `b4/round-2/out/<assetId>.png` (exact ids, exact 1024x1024, 8-bit RGBA) and write `b4/round-2/out/manifest.json` BEFORE reporting done. Verify with `ls -la b4/round-2/out` that all eight PNGs plus manifest.json exist and are non-empty.
- Do not put review/scratch files in `out/` (only the eight PNGs and manifest.json). Keep scratch work outside `b4/round-1/` and outside `out/`.
- Self-check each file against art bible section 16 (alpha corners and outer 3 percent border = 0, composite on ink-900, parchment, magenta; 48/96/112 px readability; greyscale light-to-dark read) before delivering.
- Match the accepted `observatory-building.png` for ink contour weight (3 to 5 px at 1024), paper grain, satin brass (no mirror gloss), top-left key light, thin teal fill in shadows. No cast shadow, no ground, no table.
- The eight must have similar visual weight (within 15 percent) and silhouettes distinct at 48 px per art bible section 14.

## Assets

| assetId (file) | Aspect class | Generation size | Background | Used for |
|---|---|---|---|---|
| `instrument-telescope` (`instrument-telescope.png`) | square 1:1 | 1024x1024 | transparent | Build row, Brass Telescope |
| `instrument-lens` (`instrument-lens.png`) | square 1:1 | 1024x1024 | transparent | Build row, Lens Array |
| `instrument-prism` (`instrument-prism.png`) | square 1:1 | 1024x1024 | transparent | Build row, Prism Spectrograph |
| `instrument-orrery` (`instrument-orrery.png`) | square 1:1 | 1024x1024 | transparent | Build row, Clockwork Orrery |
| `instrument-star-map` (`instrument-star-map.png`) | square 1:1 | 1024x1024 | transparent | Build row, Star-Map Press |
| `instrument-beacon` (`instrument-beacon.png`) | square 1:1 | 1024x1024 | transparent | Build row, Signal Beacon |
| `instrument-archive` (`instrument-archive.png`) | square 1:1 | 1024x1024 | transparent | Build row, Star Archive |
| `instrument-aurora-coil` (`instrument-aurora-coil.png`) | square 1:1 | 1024x1024 | transparent | Build row, Aurora Coil |

## Set rules

- Common to all instruments: transparent 1024x1024; product-plate view (eye-level, about 15 degrees from above), object centred, 74 to 82 percent of the canvas on its larger dimension, base line at 88 percent of the height, at least 3 percent transparent margin; ink contour 3 to 5 px, gold ramp per art bible 8.3, parchment/gold-light rim on the top-left edges, soft teal fill in shadows; NO ground, NO table, NO cast shadow; same satin brass finish, same line weight and same paper grain as the accepted observatory-building.
- Distinct silhouettes at 48 px (art bible section 14). Visual weight of the eight must be similar; none may look half the size of the others.
- Wood (where used) is muted umber #6B4A33 with umber shade #43301F, only on the telescope tripod and the archive cabinet.

## instrument-telescope

- Purpose: Build-row icon for the Brass Telescope: Aunt Verity's own, found under a dust sheet. The humble first instrument. It must read as "a single bold diagonal slash on tripod legs" at 48 px.
- Subject: A long brass refracting telescope on a wooden tripod, tube running as one clean diagonal from lower-left to upper-right (about 35 degrees), a small finder scope on top, a brass dew-cap at the front end, a short eyepiece at the lower end, three splayed wooden legs (warm mid-brown can be added to the family as muted umber #6B4A33 for wood only), brass collar bands. A folded dust-sheet corner (dust-sheet #D9D0B8) hangs on one leg.
- Composition: per the set rules above; silhouette a single bold diagonal slash on tripod legs; light from the top-left.
- Must-nots: No eye at the eyepiece, no person, no stars at the lens, no text on the tube, no more than three legs visible, no cracked lens. No text, no numbers, no stars baked in, no frame or card, no drop shadow, no mirror gloss, no plastic look.

- Round-2 revision: MISSING in round 1 (nothing delivered). Deliver the asset exactly to this spec.

## instrument-lens

- Purpose: Build-row icon for the Lens Array: ground glass in a brass rack for faint stars. It must read as "a row of three circles on a bar" at 48 px.
- Subject: A wide flat brass rack on two short feet holding THREE round glass lenses in a row, graded large-medium-small left to right, each lens in a thick brass ring with a small tightening screw, the glass clear with wash-teal translucency and one crisp parchment highlight arc on its top-left, thin brass rails connecting the rings.
- Composition: per the set rules above; silhouette a row of three circles on a bar; light from the top-left.
- Must-nots: No text, no engraved scale numerals, no rainbow flare, no reflections of rooms, no cracks, rings must be true circles in elevation (or true ellipses at the same viewing angle), no more than three lenses. No text, no numbers, no stars baked in, no frame or card, no drop shadow, no mirror gloss, no plastic look.

- Round-2 revision: MISSING in round 1 (nothing delivered). Deliver the asset exactly to this spec.

## instrument-prism

- Purpose: Build-row icon for the Prism Spectrograph: splits starlight into its colours. It must read as "a triangle with a fan wedge" at 48 px.
- Subject: A clear triangular glass prism (equilateral triangle section, slight 3D length) standing in a small brass cradle on a round brass foot; a single narrow beam of parchment-white light enters from the left at a slight angle and a fan of muted colour (soft banded glaze: rose, gold, pale green, teal, with no neon) leaves it to the right. The colour fan is inside the object silhouette area and soft-edged only at its far end.
- Composition: per the set rules above; silhouette a triangle with a fan wedge; light from the top-left.
- Must-nots: No rainbow arc in the sky, no saturated neon bands, no lens flare, no sparkle, no text, no more than five bands, no second prism, beam must enter and leave consistently with the prism geometry. No text, no numbers, no stars baked in, no frame or card, no drop shadow, no mirror gloss, no plastic look.

- Round-2 revision: MISSING in round 1 (nothing delivered). Deliver the asset exactly to this spec.

## instrument-orrery

- Purpose: Build-row icon for the Clockwork Orrery: turns the planets by hand and gear. It must read as "nested rings around a ball, like a target on a base" at 48 px.
- Subject: A tabletop orrery in elevation: a small round brass base with a hand-crank handle on the right, a central short column with a glowing gold ball (the sun, gold-light and lamp-glow, no rays), and three concentric thin brass ring orbits tilted slightly, carrying THREE small round planets on slim arms (one teal, one rose, one parchment, each 2 to 3 value steps), a few visible brass gear teeth on the base.
- Composition: per the set rules above; silhouette nested rings around a ball, like a target on a base; light from the top-left.
- Must-nots: No ringed Saturn clichés, no moon discs, no numbers on the rings, no tick marks that read as digits, gears must be round and mesh sensibly, no floating planets without an arm, no glow beyond the central ball. No text, no numbers, no stars baked in, no frame or card, no drop shadow, no mirror gloss, no plastic look.

- Round-2 revision: MISSING in round 1 (nothing delivered). Deliver the asset exactly to this spec.

## instrument-star-map

- Purpose: Build-row icon for the Star-Map Press: prints the sky onto vellum. It must read as "a heavy block with a T-handle and a pale sheet" at 48 px.
- Subject: A squat cast-iron-and-brass hand printing press: a heavy base block, two upright posts, a flat platen, a long screw with a T-bar handle (two knobs at the ends), and a sheet of cream vellum (parchment #F3E9D2) emerging under the platen at the front, its face showing only a few tiny gold dots and NO lines or writing; a small ink roller at the side.
- Composition: per the set rules above; silhouette a heavy block with a T-handle and a pale sheet; light from the top-left.
- Must-nots: No text, no printed letters, no map lines, no constellation diagram on the vellum, no numerals on the screw, no flying paper, no ink splashes, no person. No text, no numbers, no stars baked in, no frame or card, no drop shadow, no mirror gloss, no plastic look.

- Round-2 revision: MISSING in round 1 (nothing delivered). Deliver the asset exactly to this spec.

## instrument-beacon

- Purpose: Build-row icon for the Signal Beacon: answers other watchers across the ridges. It must read as "a tall T shape with a beam wedge" at 48 px.
- Subject: A tall slim iron post on a three-footed base carrying a large brass lantern with a conical reflector dish and a bright lamp (lamp-glow core inside a clear lens), the lens aimed to the right with a short soft beam wedge of lamp-glow (opacity falling from 60 to 0 percent over 22 percent of the canvas width, ending well inside the canvas), and a small iron cross-arm with a hanging shutter plate beneath.
- Composition: per the set rules above; silhouette a tall T shape with a beam wedge; light from the top-left.
- Must-nots: No beam reaching the canvas edge, no light rays fanning, no lens flare, no halo, no flag, no text, no lightning, no fire, no second lamp, no person. No text, no numbers, no stars baked in, no frame or card, no drop shadow, no mirror gloss, no plastic look.

- Round-2 revision: MISSING in round 1 (nothing delivered). Deliver the asset exactly to this spec.

## instrument-archive

- Purpose: Build-row icon for the Star Archive: every night anyone ever watched, shelved. It must read as "a tall rectangular drawer grid with a scroll on top" at 48 px.
- Subject: A tall narrow oak-and-brass card-catalogue cabinet in elevation: a grid of 3 columns by 5 rows of small drawers each with a tiny brass pull and a blank brass label-holder (EMPTY, no writing), crowned by a rolled vellum scroll laid across the top and a short brass book-ladder rail at the side. Warm muted umber #6B4A33 wood for the cabinet, brass for pulls, cool shade.
- Composition: per the set rules above; silhouette a tall rectangular drawer grid with a scroll on top; light from the top-left.
- Must-nots: No text on any label or scroll end, no numerals, no open drawers with spilling paper, no clutter, drawers must align in a clean grid, no perspective mismatch, no person. No text, no numbers, no stars baked in, no frame or card, no drop shadow, no mirror gloss, no plastic look.

- Round-2 revision: MISSING in round 1 (nothing delivered). Deliver the asset exactly to this spec.

## instrument-aurora-coil

- Purpose: Build-row icon for the Aurora Coil: copper and quiet current that makes the sky glow back. It must read as "a copper spring with a wavy ribbon" at 48 px.
- Subject: A vertical copper induction coil: a round brass base, a tall glass cylinder core, a tightly wound copper wire spiral (copper #B8693F, copper-shade #7E4126, 14 to 18 even turns) around it, a brass cap on top, and from the cap a single soft ribbon of aurora (muted wash-teal, a trace of success green #8FCB9B and wash-rose edge, translucent, wavy) rising and curling to the upper right, entirely inside the canvas margin.
- Composition: per the set rules above; silhouette a copper spring with a wavy ribbon; light from the top-left.
- Must-nots: No lightning bolts, no sparks, no electric arc, no neon glow, no smoke, no wires hanging out of frame, no turns that overlap or break, ribbon must not touch the canvas edge, no text. No text, no numbers, no stars baked in, no frame or card, no drop shadow, no mirror gloss, no plastic look.

- Round-2 revision: MISSING in round 1 (nothing delivered). Deliver the asset exactly to this spec.

## Delivery contract

- Save every image as PNG to `<batch>/round-<n>/out/<assetId>.png` (this round: `b4/round-2/out/<assetId>.png`) with the EXACT asset ids listed above, at the exact generation size stated per asset. One file per asset; no extra files in `out/` other than `manifest.json`.
- Transparent assets: 8-bit RGBA PNG, straight alpha, corners and the outer 3 percent border fully transparent.
- Write `out/manifest.json` as a JSON array with one object per delivered asset: `{assetId, file, model, prompt, size, transparent, notes}` where `file` is the file name (for example `instrument-telescope.png`), `model` is the generator used, `prompt` is the full final prompt (and the reference images used), `size` is `"WIDTHxHEIGHT"`, `transparent` is a boolean, and `notes` records the background-removal method, seeds, rejected attempts and anything the reviewer should know.
- Read `../../art-bible.md` first. Anything in this brief that is more specific than the bible wins.
