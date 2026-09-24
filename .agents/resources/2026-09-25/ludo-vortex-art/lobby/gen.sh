#!/bin/bash
set -e
cd "$(dirname "$0")"

MODEL="gpt_image_2_5"
ICON_REF="../logo/token-orbit-icon.png"

STYLE_BG="Premium casual mobile game lobby background art, like top-grossing Ludo and board game apps. Glossy, saturated, 3D-lit atmosphere. Deep royal-blue to navy color palette with warm gold light accents, matching the reference icon's gold-rimmed token style. Crisp clean edges, no photorealism, no grain, no banding. ORIGINAL design, do not imitate Ludo King or any existing game's background, no crowns, never the word King, no Chrome-browser-like four-color pinwheel/swirl shapes. Portrait 9:16 orientation. Absolutely no text, no letters, no logos, no UI elements, no watermark. Keep the center third of the frame visually calm and low-detail (no strong focal shapes) so UI cards can be placed over it."

STYLE_TILE="Premium casual mobile game UI tile illustration, like top-grossing Ludo and board game apps. Glossy, saturated, 3D-rendered casual-game render, chunky rounded friendly shapes, soft studio lighting with a rim light, subtle drop shadow only (no background shape, no ground plane). Candy-bright red, green, yellow, blue accents (classic Ludo colors) plus gold metallic accents, matching the reference icon's gold-rimmed glossy token style. Crisp clean edges, no photorealism, no grain. ORIGINAL design, do not imitate Ludo King or any existing game's icon, no crowns, never the word King, no Chrome-browser-like four-color pinwheel/swirl shapes. Single clear hero object, centered, readable at small size (300px), absolutely no text, no letters, no watermark, square 1:1 composition, transparent background, nothing but the object and its soft shadow."

BG_A="${STYLE_BG} Concept: night carnival. A deep royal-blue to navy gradient background, darker at the bottom, with a soft golden spotlight glow radiating down from the top edge. A faint, tilted dice-and-board-grid pattern is embossed subtly into the navy in the background, barely visible. Floating soft-focus golden bokeh sparkles drift through the scene at varying sizes. A subtle dark vignette frames the edges."

BG_B="${STYLE_BG} Concept: vortex galaxy. A deep navy background with a slow, luminous blue vortex swirl glowing softly and centered behind the upper third of the frame, like a gentle whirlpool of light. Tiny floating dice and map-pin-shaped game tokens are scattered far in the background, small and softly blurred for depth. Fine gold dust particles drift through the scene. A subtle dark vignette frames the edges."

TILE_A_COMPUTER="${STYLE_TILE} Hero object: a friendly glossy 3D robot head, rounded and cute, with two dice serving as its eyes (each die showing pips), a small antenna on top, blue and silver glossy plating with gold accent trim."
TILE_A_PASS="${STYLE_TILE} Hero object: two glossy stylized 3D hands passing a glossy smartphone between them, the phone screen displaying a small glowing mini ludo board icon, warm gold highlight on the phone edge."
TILE_A_FRIENDS="${STYLE_TILE} Hero object: three glossy 3D map-pin shaped game tokens (one red, one green, one yellow) huddled close together in a friendly group, with a small glossy red heart and a small speech bubble floating just above them."
TILE_A_ONLINE="${STYLE_TILE} Hero object: a glossy 3D globe with soft blue continents, wrapped by a thin glowing orbit ring carrying four small colored map-pin tokens (red, green, yellow, blue) evenly spaced around the orbit."

TILE_B_COMPUTER="${STYLE_TILE} Hero object: a chunky round gold-rimmed medallion badge emblem, matching the reference icon's ring style exactly, with a blue-to-navy gradient face and a bold 3D glossy robot-head-with-dice-eyes symbol embossed at its center."
TILE_B_PASS="${STYLE_TILE} Hero object: a chunky round gold-rimmed medallion badge emblem, matching the reference icon's ring style exactly, with a green-to-teal gradient face and a bold 3D glossy two-hands-passing-a-phone symbol embossed at its center."
TILE_B_FRIENDS="${STYLE_TILE} Hero object: a chunky round gold-rimmed medallion badge emblem, matching the reference icon's ring style exactly, with a red-to-pink gradient face and a bold 3D glossy huddle-of-three-tokens-with-a-heart symbol embossed at its center."
TILE_B_ONLINE="${STYLE_TILE} Hero object: a chunky round gold-rimmed medallion badge emblem, matching the reference icon's ring style exactly, with a purple-to-blue gradient face and a bold 3D glossy globe-with-orbiting-tokens symbol embossed at its center."

gen() {
  local name="$1" aspect="$2" bg="$3" extra_flags="$4" prompt="$5"
  echo "=== Generating $name (aspect=$aspect bg=$bg) ==="
  higgsfield generate create "$MODEL" \
    --prompt "$prompt" \
    --aspect-ratio "$aspect" \
    --quality high \
    --resolution 2k \
    --background "$bg" \
    --image-references "$ICON_REF" \
    $extra_flags \
    --wait --wait-timeout 10m --json > "${name}.json"
  url=$(python3 -c "
import json,sys
d=json.load(open('${name}.json'))
obj = d[0] if isinstance(d, list) else d
print(obj.get('result_url') or '')
")
  echo "URL: $url"
  if [ -n "$url" ]; then
    curl -sL "$url" -o "${name}.png"
    echo "Saved ${name}.png"
  else
    echo "NO URL FOUND for $name"
    exit 1
  fi
}

gen "bg-a" "9:16" "opaque" "" "$BG_A"
gen "bg-b" "9:16" "opaque" "" "$BG_B"

gen "tile-a-computer" "1:1" "transparent" "" "$TILE_A_COMPUTER"
gen "tile-a-pass" "1:1" "transparent" "" "$TILE_A_PASS"
gen "tile-a-friends" "1:1" "transparent" "" "$TILE_A_FRIENDS"
gen "tile-a-online" "1:1" "transparent" "" "$TILE_A_ONLINE"

gen "tile-b-computer" "1:1" "transparent" "" "$TILE_B_COMPUTER"
gen "tile-b-pass" "1:1" "transparent" "" "$TILE_B_PASS"
gen "tile-b-friends" "1:1" "transparent" "" "$TILE_B_FRIENDS"
gen "tile-b-online" "1:1" "transparent" "" "$TILE_B_ONLINE"
