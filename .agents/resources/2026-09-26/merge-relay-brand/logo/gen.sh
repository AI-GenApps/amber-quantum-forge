#!/bin/bash
set -e
cd "$(dirname "$0")"

MODEL="gpt_image_2_5"

D1_ICON="Minimalist flat app icon, original design, no text. A tight diagonal row of 3 rounded-square tiles of increasing size, deep navy background (#10243E), tiles in a mid-blue-to-coral gradient-free flat fill (#3E75B6 to #E5534B) each showing a subtle embossed corner highlight, the largest (rightmost) tile overlapping the frame edge to suggest forward motion/hand-off. Bold geometric, rounded corners matching Material 3 radius, high contrast, crisp at small sizes, centered composition, square 1:1 canvas, full-bleed background, no gradients besides the tile fills, no shadows outside the tiles, no photorealism, not an existing brand mark."

D1_WORD="Original flat wordmark logo reading exactly 'Merge Relay', bold rounded geometric sans-serif (similar weight/style to a modern Material 3 display face, not any specific licensed font), two words in deep navy (#10243E) on a powder-blue background (#EDF5FB), with a small inline diagonal 3-tile motif matching the icon positioned before or above the wordmark, generous letter spacing, no drop shadows, no gradients, legible at small sizes, spell 'Merge Relay' exactly, no other text."

D2_ICON="Minimalist flat app icon, original design, no text. A centered 2x2 grid of four rounded-square tiles on a deep navy background (#10243E), three tiles in muted slot-navy (#203754), one tile (top-right) in bright sky-blue (#4E93D3) emitting a single small quarter-arc signal ping in the same sky-blue extending past the tile's corner, flat design, full-bleed background, no gradients, no drop shadow, high contrast, bold and simple enough to read at 48px, square 1:1 canvas, not resembling any existing wifi/broadcast or messaging-app logo."

D2_WORD="Original flat wordmark logo reading exactly 'Merge Relay', clean rounded geometric sans-serif, deep navy (#10243E) text on powder-blue background (#EDF5FB), the dot above the 'i' in 'Relay' replaced by a tiny sky-blue (#4E93D3) signal ping arc matching the icon, otherwise plain letterforms, no gradients, no shadows, legible at small sizes, spell 'Merge Relay' exactly, no other text."

D3_ICON="Minimalist flat app icon, original design, no text. Two rounded-square tiles overlapping at a shared corner on a deep plum background (#2B1C36): one tile in muted mauve (#8D4D85), one tile in warm amber (#D48742), the overlap area rendered as a blended solid warm-rust color (#B34D3F) to show a clean merge without gradients, both tiles equal size, symmetric composition, bold flat shapes, full-bleed background, no shadows, no gradients beyond the three flat fills, crisp and legible at 48px, square 1:1 canvas, not resembling any existing puzzle-game or dating-app logo."

D3_WORD="Original flat wordmark logo reading exactly 'Merge Relay', bold rounded geometric sans-serif, warm cream background (#FBF2EA), text in deep plum (#2B1C36), with the small two-tile overlap motif from the icon placed as a compact mark to the left of the wordmark, no gradients, no drop shadows, legible at small sizes, spell 'Merge Relay' exactly, no other text."

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

gen "baton-chain-icon" "1:1" "$D1_ICON"
gen "baton-chain-wordmark" "3:2" "$D1_WORD"
gen "signal-grid-icon" "1:1" "$D2_ICON"
gen "signal-grid-wordmark" "3:2" "$D2_WORD"
gen "ember-handoff-icon" "1:1" "$D3_ICON"
gen "ember-handoff-wordmark" "3:2" "$D3_WORD"
