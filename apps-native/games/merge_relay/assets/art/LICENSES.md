# Merge Relay art provenance

Every file in this directory is **original AI-generated art**, produced for
this game with `~/.local/bin/image-gen` (wraps `codex exec`, model
`gpt-6-luna`) per task
`tasks/epics/16-games-portfolio-wave2/22-mr-logo-final-and-integrate.md`.
No stock, downloaded, or code-drawn asset is presented as generated art
anywhere in this table. Masters, prompts, and full generation logs live at
`.agents/resources/2026-09-25/merge-relay-art/logo/final/`.

| File | Master path | Tool / model | Date | Notes |
|---|---|---|---|---|
| `logoWide.png` | `.agents/resources/2026-09-25/merge-relay-art/logo/final/logo_wide.png` | `image-gen` (`gpt-6-luna`) | 2026-09-27 | The cleaned `wordmark.png` (below), resized (Pillow, no further AI generation). Wordmark-only lockup for the home header (`MergeRelayArtManifest.logoWide`) — the review at orchestrator fix round 1 asked to drop the small tile icon here so the wordmark itself can read as the clear ~55-65%-width brand element without looking cramped next to the settings button. |
| `logoStacked.png` | `.agents/resources/2026-09-25/merge-relay-art/logo/final/logo_stacked.png` | `image-gen` (`gpt-6-luna`) | 2026-09-27 | Composite (Pillow) of `icon_transparent.png` (a key-out of `icon.png`, see below) + `wordmark.png`, stacked. Vertical icon-over-wordmark lockup for the welcome screen (`MergeRelayArtManifest.logoStacked`), sized as the hero element there (~60-70% of screen width). Fix round 2 (orchestrator review): the icon master is opaque RGB, and the first cut of this file composited it straight in at full alpha, which painted a visible pale square behind the glowing tile on `welcome.png`. Now composited from a keyed-out transparent variant instead — see "Post-processing" below. |

## Source renders (not shipped in-app directly; composited into the two files above)

| File | Prompt | Notes |
|---|---|---|
| `icon.png` (1024x1024, opaque) | "Final production-quality app icon, 1:1 square, for a premium casual mobile puzzle game called Glow Rescue. Match the exact style, palette, and composition of the reference image at `.../logo/A-hero-glow/icon.png` as closely as possible (this is the approved direction, being re-rendered at final polish): a single friendly rounded-square tile character, face-forward, warm golden-orange to yellow gradient glossy body, soft warm glow aura around it, simple minimal cute face (closed happy eyes, small smile, rosy cheeks), thick rounded darker-orange outline, warm cream background, no text, no watermark, crisp clean edges, reads clearly at small sizes like 48px, original character design" | Re-render of task 21's picked icon direction A (`mr_icon: A` in `decisions.md`), referencing that dry-run master by absolute path to carry the style over exactly. Also embedded (base64) into `assets/branding/icon.svg` for the launcher icons. |
| `wordmark.png` (transparent, cropped + cleaned) | "Final production-quality wordmark logotype graphic reading exactly 'Glow Rescue' (two words, capital G and R, rest lowercase). Match the exact style, palette, letterforms, and spark accent of the reference image at `.../logo/B-merge-spark/wordmark.png` as closely as possible (this is the approved direction, being re-rendered at final polish): bold rounded friendly display typeface, warm golden-yellow to orange gradient fill, thin dark-navy outline around the letters, a small bright four-point spark/flash icon placed between the two words, on a fully transparent background (PNG with alpha), flat vector illustration, clean crisp edges, premium casual mobile game branding, no other text, no watermark" | Re-render of task 21's picked wordmark direction B (`mr_wordmark: B`). Came back RGBA with real alpha; cropped to its opaque bounding box + margin, then eroded 1px and de-fringed with Pillow (see `.agents/resources/2026-09-25/merge-relay-art/logo/final/README.md`). Spelling verified as exactly "Glow Rescue". |

## Post-processing

- `icon.png`: resized to exactly 1024x1024 (LANCZOS) from the raw
  1254x1254 render; no alpha needed (full-bleed opaque square, matching
  how real premium app icons ship — see task 19's own note on this).
- `wordmark.png`: cropped to its alpha bounding box + 14px margin, then
  eroded 1px and de-fringed (blur-based edge color pull-in) to remove any
  generator fringe. Verified with Pillow: alpha ranges 0–254 (real
  binary-ish alpha), and `wordmark_check.png` (masters folder) shows it
  composited over a checkerboard with no visible fringe.
- `logoWide.png`: the cleaned `wordmark.png` resized so its longest side is
  1024px (no compositing — icon dropped per the fix-round-1 review below).
- `icon_transparent.png` (masters folder only, not shipped in-app): a
  fix-round-2 key-out of the opaque `icon.png`, used only to build
  `logoStacked.png`. Background color sampled from the four corners of
  `icon.png` (avg. `(252.5, 248.5, 232.0)`); a soft, distance-based
  threshold (fully transparent within 10 units of that color, fully
  opaque past 55 units, linearly interpolated between) keys out the flat
  cream field while keeping the tile's own soft glow — a gradient from
  cream into the tile's orange — as smooth partial alpha rather than a
  hard-edged cutout ring, then eroded 1px and de-fringed the same way
  `wordmark.png` was.
- `logoStacked.png`: a pure Pillow composition (no further AI generation)
  of `icon_transparent.png` + `wordmark.png` onto a fully transparent
  canvas, downscaled so it doesn't exceed 1024px on its longest side.
  Verified with Pillow (also asserted by
  `test/merge_relay_art_manifest_test.dart`'s "logoStacked.png background
  alpha" group, which decodes this exact shipped file): all four corners
  and a strip left of the icon are alpha `0`, while the tile's own
  interior still reaches alpha `255` — a real soft key-out, not an
  accidentally all-transparent image. Full script output in
  `.agents/resources/2026-09-25/merge-relay-art/logo/final/README.md`.
- Both in-app files are well under the 600 KB budget (140 KB / 224 KB).
