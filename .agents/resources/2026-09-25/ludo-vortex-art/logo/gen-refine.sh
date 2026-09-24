#!/bin/bash
set -e
cd "$(dirname "$0")"

MODEL="gpt_image_2_5"
REF_WORD="dice-portal-wordmark.png"
REF_ICON="token-orbit-icon.png"

BASE="Premium casual mobile game logo wordmark art, like top-grossing Ludo and board game apps. Glossy, saturated, 3D-rendered chunky rounded bold display lettering, arched upward. The word LUDO in candy-bright red, green, yellow, and blue letters (one color per letter, classic Ludo colors), the word VORTEX in white letters with a gold metallic outline, except the letter X in VORTEX is blue. A small glossy ivory die with gold-rimmed pips dots one of the letters, matching the reference wordmark's lettering style exactly. ORIGINAL design, do not imitate Ludo King or any existing game logo, no crown, never the word King, no Chrome-browser-like four-color pinwheel/swirl logo shape. The text must read exactly LUDO VORTEX, spelled correctly, no other text, no watermark."

V1_PROMPT="${BASE} Composition: the four glossy map-pin shaped game tokens (red, green, yellow, blue), matching the reference icon's tokens exactly, orbit around the LUDO VORTEX text on a swirling golden energy ring, with a small golden star sparkle near the ring. Deep royal-blue background with a subtle vortex swirl glow. 16:9 landscape."

V2_PROMPT="${BASE} Composition: a centered emblem badge sits ABOVE the arched LUDO VORTEX text, like a game title lockup. The emblem is a gold ring containing a glowing golden star with the four glossy map-pin tokens (red, green, yellow, blue) orbiting it, matching the reference icon exactly. Deep royal-blue background with a subtle vortex swirl glow. Compact 4:3 composition."

gen() {
  local name="$1" aspect="$2" bg="$3" prompt="$4"
  echo "=== Generating $name (aspect=$aspect bg=$bg) ==="
  higgsfield generate create "$MODEL" \
    --prompt "$prompt" \
    --aspect-ratio "$aspect" \
    --quality high \
    --resolution 2k \
    --background "$bg" \
    --image-references "$REF_WORD" \
    --image-references "$REF_ICON" \
    --wait --wait-timeout 10m --json > "${name}.json"
  url=$(python3 -c "
import json,sys
d=json.load(open('${name}.json'))
def find(o):
    if isinstance(o, dict):
        for k,v in o.items():
            if k in ('url','result_url','output_url') and isinstance(v,str) and v.startswith('http'):
                return v
            r=find(v)
            if r: return r
    elif isinstance(o, list):
        for v in o:
            r=find(v)
            if r: return r
    return None
print(find(d) or '')
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

gen "wordmark-final-v1" "16:9" "opaque" "$V1_PROMPT"
gen "wordmark-final-v2" "4:3" "opaque" "$V2_PROMPT"
gen "wordmark-final-v1-transparent" "16:9" "transparent" "$V1_PROMPT"
gen "wordmark-final-v2-transparent" "4:3" "transparent" "$V2_PROMPT"
