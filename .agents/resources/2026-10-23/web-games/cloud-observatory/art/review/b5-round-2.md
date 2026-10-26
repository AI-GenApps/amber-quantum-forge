# Review: Cloud Observatory b5 round 2

Verdict: lore-1 REJECTED, lore-6 REJECTED, feature-graphic REJECTED. Nothing was accepted this round, so `accepted/` and `accepted/manifest.json` are unchanged.

Technical checks (all pass): lore-1 1024x1536 RGB, lore-6 1024x1536 RGB, feature-graphic 1536x1024 RGB; no alpha channel; files open cleanly; no text, borders or frames found.
Contact sheets: `review/a_full_grey.png`, `b_display.png` (300x450 with caption and close-button guides, feature at 750x500), `c_vs_accepted.png` (vs key-art, lore-3/4/5), texture crops `z_*.png` (2x nearest-neighbour vs the key-art reference crop).

## Blocking defect shared by all three: the faceted texture is NOT fixed
The designer's own manifest notes say "cellular/faceted texture still visible ... not self-approved". The 2x crops confirm it: the sky and nebula are covered by a scalloped, overlapping polygon-cell pattern with outlined cells (Kuwahara/oil filter look), and cloud and nebula edges are lobed "cauliflower" blobs of uniform size. Accepted key-art (`z_key_ref.png`) is smooth transparent glazes with fine uniform paper grain. Side by side in `c_vs_accepted.png` the new plates are visibly from a different hand than key-art, lore-3, lore-4 and lore-5. The rubric requires style consistency with every accepted asset, so this is an automatic reject. The feature-graphic and lore-6 crops show it worst, and it reads as noise in the 300x450 and 750x500 displays.

## lore-1 (The Roof at Dusk) - REJECTED
Good: sloped slate roof with ridge and overlapping shingle rows now reads as a roof; dust-sheeted telescope on a brass-capped tripod is a clear focal point at the left third; the key is now half under a lifted tile with a blank folded note; one tiny warm window; sparse round stars; no people, no moon, no text.
Reasons:
1. Faceted oil-filter texture across the whole sky, the cloud band and the dust sheet (see `z_lore1_sky.png`).
2. The lower roof slates are large flat blobs with no ink edge or grain; the bottom of the image reads as a smooth blue-grey slab. Lower-half luminance peaks at about 50 against ink-800 at about 36, so the caption band is not as calm or as dark as required (slate highlights run into it).
3. The teal and rose cloud band is saturated and streaky, much stronger than key-art's restrained nebula; it competes with the telescope.
4. Telescope tube is lost under the sheet so the tripod has no visible optical tube except a stub at the left; the sheet silhouette reads like a ghost/tent more than a covered telescope.

## lore-6 (Morning Star) - REJECTED
Good: composition, lightest plate of the set, tiny silhouettes, one eight-ray gold star, key glint at the right place, no faces, no text.
Reasons:
1. The strongest faceted texture of the batch: clouds are scalloped cauliflower lobes of identical size with outlined cells (`z_lore6_sky.png`).
2. Over-saturated sky: teal, hot coral, orange and violet at full strength in one sky. This reads as a generic "sunset wallpaper" and breaks the restrained palette and 5-hue rule against key-art and lore-5.
3. The dome is dull slate with no brass, off the fixed observatory design (brass-clad dome with gold-shade ribs). The lit water strip behind the figures glows like a hidden sun.
4. The village and lake add distant detail the notes asked to simplify; they compete with the key and figures.
Caption band: acceptable (mid navy; a rose-navy band is allowed for lore-6).

## feature-graphic - REJECTED
Good: building at x 66 to 86 percent with base near y 84 percent, calm left 55 percent, two ridge layers and pines, one lit window, no text.
Reasons:
1. Faceted mosaic texture across the whole nebula and sky (`z_fg_neb.png`), the most visible element of the art, and plainly unlike key-art. The nebula reads as pixelated tessellation at store size.
2. The "brighter gold star" is now a flat round disc with a halo; it reads as a moon or planet, which is forbidden (moonless sky), and it sits off the dome axis at the right of centre.
3. The building is about 34 percent of canvas height (brief: about 46 percent) so the hero is small and the dome gold is the only focal mass; the stone is pale, flat-lit grey that looks pasted on versus the watercolour sky.
4. The sky is crowded with uniform white pinpoint stars of nearly equal size on the left side, hurting the calm space for the store overlay, and nebula rose is still prominent to the left of the dome.

## Accepted this round
None.
