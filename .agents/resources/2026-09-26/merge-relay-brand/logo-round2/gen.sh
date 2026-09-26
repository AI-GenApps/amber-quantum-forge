#!/bin/bash
set -e
cd "$(dirname "$0")"

MODEL="gpt_image_2_5"
REF1="$(cd "$(dirname "$0")" && pwd)/../../../2026-09-25/ludo-vortex-art/logo/token-orbit-icon.png"
REF2="$(cd "$(dirname "$0")" && pwd)/../../../2026-09-25/ludo-vortex-art/logo/refinement-sheet.png"

STYLE_ICON="Premium glossy casual mobile game app icon art, matching the quality bar of a top-grossing casual puzzle game icon: chunky glossy 3D rendered, deep bevels, bright specular highlights, soft rim lighting, gold metallic accents. Deep navy background (#10243E to #0B1D4F) with a soft vignette. Crisp clean edges, no photorealism, no grain, no flat/corporate minimalism. ORIGINAL design, do not imitate any existing brand or app icon, no Wi-Fi symbol, no Venn-diagram overlap shape, not resembling 2048, Threes, Candy Crush, Chrome, or Signal messenger logos. Single bold readable silhouette, full-bleed square 1:1 canvas, nothing clipped or cropped at the edges, centered composition with safe margin so it reads clearly at 48px, absolutely no text or letters anywhere."

STYLE_WORD="Premium glossy casual mobile game logo wordmark art, matching the quality bar of a top-grossing casual puzzle game logo: chunky rounded bold 3D display lettering with deep bevels, dark outline, and bright glossy specular highlights. White and sky-blue letters with coral and gold metallic accents. Deep navy background (#10243E to #0B1D4F) with a soft vignette and warm glow. Crisp clean edges, no photorealism. ORIGINAL design, not resembling any existing brand logo. Every letter must be a normal, complete, standard letterform of the Latin alphabet - absolutely no letter may be replaced, altered, or merged with a symbol, icon, arc, or swoosh; any energy/sparkle/signal accents must be placed clearly AROUND or BEHIND the lettering, never touching, replacing, or dotting any letter. The text must read exactly correctly, spelled precisely as instructed, no other text, no watermark."

ICON_SUBJECT="Subject: a 2x2 grid of four chunky glossy rounded-square 3D tiles tightly and symmetrically arranged with even gaps, filling the frame with safe margin. Three tiles are in a deep muted slot-navy glossy finish (#203754) with soft top highlight. One tile (top-right) is glowing bright and lit from within in vivid sky-blue (#4E93D3) with a warm gold rim of light around its edge, showing a bold original numeral '2' embossed in white glossy 3D on its face. From the glowing tile, a radiating burst of concentric glow rings and small gold sparkle particles arcs outward toward the top-right corner, like a comet trail or energy ping heading to the next tile - this burst is made of soft round glowing rings and star-shaped sparkles only, absolutely not a Wi-Fi/broadcast arc shape, not a signal-bar shape. Deep navy background with vignette."

WORD1_SUBJECT="Layout: the words 'MERGE RELAY' on a single horizontal line, both words the same bold chunky 3D lettering style, glossy white letters with sky-blue glossy shading, coral (#E5534B) accents on select letters, thin gold outline trim, dark navy bevel shadow beneath each letter. A few small gold sparkle and soft glow ring accents float around the outside edges of the text (above, below, left, right) - never overlapping or touching any letter. The word must read exactly M-E-R-G-E space R-E-L-A-Y, ten letters total, all standard, no letter replaced by any symbol."

WORD2_SUBJECT="Layout: a small circular emblem badge centered at the top (a glossy 3D gold-rimmed navy medallion containing a simplified version of the 2x2 signal-grid icon: three deep slot-navy tiles and one glowing sky-blue tile with a soft radiating glow burst, no wifi arcs), and below it two stacked lines of bold chunky glossy 3D lettering: 'MERGE' on the first line, 'RELAY' on the second line, centered, same lettering style as the icon (white/sky-blue glossy with coral and gold accents, dark outline and bevel). Small gold sparkle accents float around the emblem and text only, never touching or replacing any letter. The text must read exactly M-E-R-G-E on line one and R-E-L-A-Y on line two, all standard letters, no letter replaced by any symbol."

gen() {
  local name="$1" aspect="$2" bg="$3" refs="$4" prompt="$5"
  echo "=== Generating $name (aspect=$aspect bg=$bg) ==="
  local ref_flag=()
  if [ -n "$refs" ]; then
    IFS=',' read -ra REF_ARR <<< "$refs"
    for r in "${REF_ARR[@]}"; do
      ref_flag+=(--image-references "$r")
    done
  fi
  higgsfield generate create "$MODEL" \
    --prompt "$prompt" \
    --aspect-ratio "$aspect" \
    --quality high \
    --resolution 2k \
    --background "$bg" \
    "${ref_flag[@]}" \
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

gen "icon-v1" "1:1" "opaque" "$REF1,$REF2" "${STYLE_ICON} ${ICON_SUBJECT}"
gen "icon-v2" "1:1" "opaque" "$REF1,$REF2" "${STYLE_ICON} ${ICON_SUBJECT} Variation: slightly different sparkle placement and glow intensity, alternate framing of the burst toward the corner."

gen "wordmark-v1" "16:9" "opaque" "$REF1,$REF2" "${STYLE_WORD} ${WORD1_SUBJECT}"
gen "wordmark-v2" "4:3" "opaque" "$REF1,$REF2" "${STYLE_WORD} ${WORD2_SUBJECT}"

gen "wordmark-v1-transparent" "16:9" "transparent" "$REF1,$REF2" "${STYLE_WORD} ${WORD1_SUBJECT}"
gen "wordmark-v2-transparent" "4:3" "transparent" "$REF1,$REF2" "${STYLE_WORD} ${WORD2_SUBJECT}"
