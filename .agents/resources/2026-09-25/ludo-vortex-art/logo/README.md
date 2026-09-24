# Ludo Vortex — Logo Concepts

Model: `gpt_image_2_5` (Higgsfield CLI), quality=high, resolution=2k, background=opaque.
Icons generated at aspect_ratio=1:1, wordmarks at aspect_ratio=16:9.
All prompts were prefixed with a shared style block (premium casual mobile game art, glossy 3D, candy-bright red/green/yellow/blue, gold accents, deep royal-blue background, original design, no Ludo King imitation, no crown, no "King").

## Direction A — vortex-swirl

- **vortex-swirl-icon.png** — Four glossy color bands spiraling into a glowing golden center with an ivory die tumbling out.
  Prompt: "...Subject: four glossy color bands (red, green, yellow, blue) spiraling inward into a glowing golden vortex center like a whirlpool, with a glossy ivory 3D die tumbling out of the glowing center, gold pips on the die."
- **vortex-swirl-wordmark.png** — "LUDO" over "VORTEX", the O in VORTEX replaced by a mini four-color swirl.
  Prompt: "...Layout: LUDO on top line, VORTEX on bottom line, stacked. The letter O in VORTEX is replaced by a small four-color (red, green, yellow, blue) spiral swirl icon matching the icon's vortex."

## Direction B — dice-portal

- **dice-portal-icon.png** — Glossy ivory die with gold-rimmed pips at the heart of a swirling four-color portal ring, sparkles and motion trails.
  Prompt: "...Subject: a glossy 3D ivory die with gold-rimmed black pips at the heart of a swirling four-color (red, green, yellow, blue) portal ring, sparkles and motion trails swirling around the ring."
- **dice-portal-wordmark.png** — Slightly arched lettering with a small die dotting a letter gap, energy swirl glow behind.
  Prompt: "...Layout: single line LUDO VORTEX, letters slightly arched upward, a small glossy ivory die dotting the letter I-like gap or sitting atop one letter, soft energy swirl glow behind the whole wordmark."

## Direction C — token-orbit

- **token-orbit-icon.png** — Four glossy map-pin tokens (red, green, yellow, blue) orbiting a golden star, badge/emblem with gold ring border.
  Prompt: "...Subject: four glossy map-pin shaped game tokens (red, green, yellow, blue) orbiting in a circular swirl around a glowing golden star, arranged like a badge or emblem with a gold ring border."
- **token-orbit-wordmark.png** — Emblem badge at left, "LUDO VORTEX" stacked to the right.
  Prompt: "...Layout: small emblem badge (four-color orbiting tokens around a gold star) on the left, LUDO VORTEX text stacked on two lines to the right of the emblem."

## Shared style block (prepended to every prompt)

Icons: "Premium casual mobile game app icon art, like top-grossing Ludo and board game apps. Glossy, saturated, 3D-rendered. Candy-bright red, green, yellow, and blue (the four classic Ludo colors). Gold metallic accents and rims. Deep royal-blue full-bleed background with soft glow and rim lighting. Crisp clean edges, no photorealism, no grain. ORIGINAL design, do not imitate Ludo King or any existing game logo, no crown as the main symbol, never the word King. Single bold readable symbol, 1:1 square, absolutely no text or letters anywhere, centered composition with safe margin so it reads clearly at 48px."

Wordmarks: "Premium casual mobile game logo wordmark art, like top-grossing Ludo and board game apps. Glossy, saturated, 3D-rendered chunky rounded bold display lettering. White and gold letters with dark outline and 3D bevel. Candy-bright red, green, yellow, blue accent colors (the four classic Ludo colors), gold accents. Deep royal-blue background with a subtle vortex swirl and soft glow. Crisp clean edges, no photorealism. ORIGINAL design, do not imitate Ludo King or any existing game logo, no crown, never the word King. The text must read exactly LUDO VORTEX, spelled correctly, no other text."

## QA notes

All 6 images were viewed and reviewed against the brief. All passed on first generation — no misspellings, no watermarks, no extra text, no King/crown imitation. No regenerations were needed.

## Refinement round

Chosen combo: ICON = `token-orbit-icon.png` (four glossy map-pin tokens red/green/yellow/blue orbiting a golden star inside a gold ring). WORDMARK direction = `dice-portal-wordmark.png` style (arched chunky 3D "LUDO VORTEX" lettering), refined to visually match the icon's tokens and colors.

Model: `gpt_image_2_5` (Higgsfield CLI), quality=high, resolution=2k, `--image-references` set to both `dice-portal-wordmark.png` and `token-orbit-icon.png` so the CLI auto-uploaded them as style/subject references. Opaque generations used `--background opaque`; transparent generations used `--background transparent` (native alpha output from the model — verified non-trivial alpha channel with PIL, no chroma-key fallback needed).

Shared prompt base: "Premium casual mobile game logo wordmark art... chunky rounded bold display lettering, arched upward. The word LUDO in candy-bright red, green, yellow, and blue letters (one color per letter), the word VORTEX in white letters with a gold metallic outline, except the letter X in VORTEX is blue. A small glossy ivory die with gold-rimmed pips dots one of the letters, matching the reference wordmark's lettering style exactly. ORIGINAL design, do not imitate Ludo King or any existing game logo, no crown, never the word King, no Chrome-browser-like four-color pinwheel/swirl logo shape. The text must read exactly LUDO VORTEX, spelled correctly, no other text, no watermark."

- **wordmark-final-v1.png / wordmark-final-v1-transparent.png** (16:9) — Composition addendum: "the four glossy map-pin shaped game tokens (red, green, yellow, blue), matching the reference icon's tokens exactly, orbit around the LUDO VORTEX text on a swirling golden energy ring, with a small golden star sparkle near the ring. Deep royal-blue background with a subtle vortex swirl glow."
- **wordmark-final-v2.png / wordmark-final-v2-transparent.png** (4:3) — Composition addendum: "a centered emblem badge sits ABOVE the arched LUDO VORTEX text, like a game title lockup. The emblem is a gold ring containing a glowing golden star with the four glossy map-pin tokens (red, green, yellow, blue) orbiting it, matching the reference icon exactly. Deep royal-blue background with a subtle vortex swirl glow. Compact 4:3 composition."

QA: all 4 images viewed and matched the brief on first generation (exact "LUDO VORTEX" spelling, letter colors and arch preserved, die dotting a letter kept, tokens match the icon, no crown/King/Chrome-swirl, no watermark). No regenerations needed. Transparent variants confirmed via PIL alpha histogram (partial/zero alpha present, no fully-opaque-only image) — see `refinement-sheet.png` for a visual proof composited over `#0B1D4F`.
