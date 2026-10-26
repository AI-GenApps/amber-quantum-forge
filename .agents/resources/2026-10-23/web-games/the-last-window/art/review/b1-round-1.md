# Review b1 round 1 (strict)

Technical: icon 1024x1024 RGB opaque; key-art 1024x1536 RGB opaque; interior-evening 1024x1536 RGB opaque; customer-1-neutral 1020x1360 RGBA, corners/top/side 3% border alpha 0, bottom row 87% opaque, edges clean on night/nightMid/paper/wood/white/black (review/d_*.png). No pure black/white pixels in the opaque assets. Interior mean luminance 27%. No text anywhere.
Contact sheets: a_full_on_grey.png, b_display.png, c_consistency_all_four.png (no previously accepted assets existed; sheet compares the four candidates), d_transparent_bgs.png, d_edge_head_*.png, zoom_*.png.

## interior-evening: ACCEPTED
- Geometry follows the bible table: window x29-71, apex ~9%, single transom ~21%, sill ~40%; bookcase x76-100 y30-62; empty counter top 78-88%; panelled back bar; empty calm left/upper-right zones; UI zone clean. Reads at 390 px with HUD/seat/decor overlays without collisions.
- Warm lamp key vs deep blue dusk is the brightest focus; stepped glow, no halo; light falloff warm-to-brown toward edges. Lamp, books, cup are well constructed. No people, text, rain, steam.
- Minor, accepted: wall paint is a bit mottled/faceted at 100% (reads as plaster at display size). Later weather variants must keep this exact texture scale.

## icon: ACCEPTED (with a note for later)
- Three masses (dark wall, amber arch, bright lamp) read clearly at 48 and 96 px under circle, squircle and square masks; all essential content inside the 635 px circle. Same lamp/books/cup identity as the interior and key-art. No text, no border.
- Note: 92 px strips at left and right are exact mirrors of the adjacent wall (visible as faint symmetric chevron texture in the clapboards at full size). Invisible at display size; acceptable now, do not repeat for other assets.

## key-art: REJECTED
- Construction: left neighbour buildings are flat hard-edged blocks and the sea wall is a plain grey box that floats against the sea; they read as the layout guide polygons the brief said not to retain. Cobbles read as a repeated fish-scale pattern rather than damp cobbles.
- Proportion: the shop reads as a toy/doll house, not a narrow two-storey harbour building; the arched window is half the facade width and the attic is a token window. Needs a visibly narrower two-storey body with clear ground-floor and upper storey.
- Style/palette: sky is a saturated royal blue (HSV sat ~0.73, title band mean #152a4d, darker than the required #1F2F45 to #36506B range) with long Van Gogh-like diagonal strokes that do not match the interior's mottled warm-plaster paint scale or the muted nightMid/dusk palette.
- Good and to keep: title and button bands are calm, window is the focal glow, lamp/books/cup match the icon, sage awning, porthole door, small wall lamp.

## customer-1-neutral: REJECTED
- Construction: the glasses cord does not attach to the glasses arms. On the viewer's left it starts under the jaw and hangs free; on the right it hangs from the ear lobe region in front of the bun. At 120x160 it reads as dangling earrings or wires. The brief requires it to connect to both arms and disappear behind the neck.
- Style consistency: face and skin are smooth, airbrushed, rosy and semi-3D (animation-render look), while the accepted interior is visibly brushy matte paint. Placed on the interior she would look like another set. Bible: no airbrushed skin, no plastic sheen, simple planes with soft dry-brush edges.
- Pose: head is nearly frontal; the 12 degree turn toward the viewer's left is barely present.
- Good and to keep: framing (crown ~12%, eye line ~38%, chin ~64%), round matched glasses, kind age-true expression, cable-knit cardigan with two buttons visible, alpha edges clean, transparent corners.
