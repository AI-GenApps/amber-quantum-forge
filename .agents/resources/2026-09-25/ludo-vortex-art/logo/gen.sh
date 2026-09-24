#!/bin/bash
set -e
cd "$(dirname "$0")"

STYLE_ICON="Premium casual mobile game app icon art, like top-grossing Ludo and board game apps. Glossy, saturated, 3D-rendered. Candy-bright red, green, yellow, and blue (the four classic Ludo colors). Gold metallic accents and rims. Deep royal-blue full-bleed background with soft glow and rim lighting. Crisp clean edges, no photorealism, no grain. ORIGINAL design, do not imitate Ludo King or any existing game logo, no crown as the main symbol, never the word King. Single bold readable symbol, 1:1 square, absolutely no text or letters anywhere, centered composition with safe margin so it reads clearly at 48px."

STYLE_WORD="Premium casual mobile game logo wordmark art, like top-grossing Ludo and board game apps. Glossy, saturated, 3D-rendered chunky rounded bold display lettering. White and gold letters with dark outline and 3D bevel. Candy-bright red, green, yellow, blue accent colors (the four classic Ludo colors), gold accents. Deep royal-blue background with a subtle vortex swirl and soft glow. Crisp clean edges, no photorealism. ORIGINAL design, do not imitate Ludo King or any existing game logo, no crown, never the word King. The text must read exactly LUDO VORTEX, spelled correctly, no other text."

A_ICON="${STYLE_ICON} Subject: four glossy color bands (red, green, yellow, blue) spiraling inward into a glowing golden vortex center like a whirlpool, with a glossy ivory 3D die tumbling out of the glowing center, gold pips on the die."

A_WORD="${STYLE_WORD} Layout: LUDO on top line, VORTEX on bottom line, stacked. The letter O in VORTEX is replaced by a small four-color (red, green, yellow, blue) spiral swirl icon matching the icon's vortex."

B_ICON="${STYLE_ICON} Subject: a glossy 3D ivory die with gold-rimmed black pips at the heart of a swirling four-color (red, green, yellow, blue) portal ring, sparkles and motion trails swirling around the ring."

B_WORD="${STYLE_WORD} Layout: single line LUDO VORTEX, letters slightly arched upward, a small glossy ivory die dotting the letter I-like gap or sitting atop one letter, soft energy swirl glow behind the whole wordmark."

C_ICON="${STYLE_ICON} Subject: four glossy map-pin shaped game tokens (red, green, yellow, blue) orbiting in a circular swirl around a glowing golden star, arranged like a badge or emblem with a gold ring border."

C_WORD="${STYLE_WORD} Layout: small emblem badge (four-color orbiting tokens around a gold star) on the left, LUDO VORTEX text stacked on two lines to the right of the emblem."

MODEL="gpt_image_2_5"

gen() {
  local name="$1" aspect="$2" prompt="$3"
  echo "=== Generating $name ==="
  higgsfield generate create "$MODEL" \
    --prompt "$prompt" \
    --aspect-ratio "$aspect" \
    --quality high \
    --resolution 2k \
    --background opaque \
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
  fi
}

gen "vortex-swirl-icon" "1:1" "$A_ICON"
gen "vortex-swirl-wordmark" "16:9" "$A_WORD"
gen "dice-portal-icon" "1:1" "$B_ICON"
gen "dice-portal-wordmark" "16:9" "$B_WORD"
gen "token-orbit-icon" "1:1" "$C_ICON"
gen "token-orbit-wordmark" "16:9" "$C_WORD"
