# Glow Rescue — logo + icon dry run (task 19)

Three original icon + wordmark directions for **Glow Rescue** (the name
chosen at task 17, `tasks/epics/16-games-portfolio-wave2/decisions.md`),
shown as a contact sheet and composited into three real screens (launcher
grid, splash, home header) so the user can pick a direction at task 21.
Dry-run quality only — finals + in-app integration are task 22.

This is a **parallel-lane, evidence-only** folder. Nothing under
`apps-native/` or `tasks/` was touched by this task; see "Stray-file
incident" below for one thing worth flagging to the orchestrator.

## Tool, model, and smoke test

- Tool: `~/.local/bin/image-gen` (wraps `codex exec`), model `gpt-6-luna`
  (default — never overridden to `gpt-6-astra` in this run; every image
  came back on-brief on the first try).
- Smoke test (`smoke-test/smoke.png`, `smoke-test/out.log`): a single
  1254×1254 RGB image, ~90 s, on-brief (a glowing golden-orange tile
  character, cream background, no text). It read well enough to also serve
  as Direction A's icon master, so it was reused there instead of
  regenerating a duplicate.

## Brief basis (all prompts)

Premium casual mobile game, warm Threes!-grade charm, original character
tiles (not Threes!'s monster faces), the design-system palette (warm
cream `#FFF7EA` paper / ink navy `#1E2A44` / the 12-step tile-tier
oranges from `apps-native/games/merge_relay/lib/src/ui/mr_tokens.dart`,
referenced by pointing the prompt at
`.agents/resources/2026-09-25/games-wave2-qa/08/tier_sheet.png`), crisp
edges, no photorealism, no watermark. Icons: 1:1, no text, reads at 48px.
Wordmarks: exact text "Glow Rescue" (spell-checked against
`decisions.md` on every render — all came back correct first try, no
regeneration needed).

## Directions, prompts, and files

### Direction A — Hero glow tile
Single hero tile character, face-forward — the calmest, most "app icon"
direction.

| File | Prompt | Notes |
|---|---|---|
| `A-hero-glow/icon.png` (= `smoke-test/smoke.png`) | "App icon, 1:1 square, for a premium casual mobile puzzle game called Glow Rescue. A single friendly rounded square tile character, face-forward, warm golden-orange gradient body, soft glow aura around it, simple minimal cute face (closed happy eyes, small smile), thick rounded outline, flat vector illustration with soft shading, warm cream background, no text, no watermark, crisp clean edges, reads clearly at small sizes like 48px, original character design, not a copy of any existing game icon" | Smoke-test image, RGB, 1254×1254. Reused as-is — no regeneration needed. |
| `A-hero-glow/wordmark-raw.png` → `wordmark.png` | "Wordmark logotype graphic reading exactly 'Glow Rescue' (two words, capital G and R, rest lowercase), in a bold rounded friendly display typeface similar in spirit to the Fredoka font, ink-navy colored text (#1e2a44), on a transparent or warm cream background, a small warm golden glow/spark accent above or beside the wordmark, flat vector illustration, clean crisp edges, premium casual mobile game branding, no other text, no watermark, no photorealism" | Came back RGB with an opaque cream backdrop (1555×364 after crop) — **chroma-keyed to alpha** (sampled the 4 corners, thresholded, eroded 1px, de-fringed) rather than a flat-fill approximation. |

### Direction B — Merge spark
Two tiles mid-merge with a spark — the most "gameplay verb" direction
(mirrors the merge mechanic itself).

| File | Prompt | Notes |
|---|---|---|
| `B-merge-spark/icon.png` | "App icon, 1:1 square, for a premium casual mobile puzzle game called Glow Rescue. Two friendly rounded-square tile characters colliding and merging into one, with a bright warm spark/flare burst of light where they meet, golden-orange and amber gradient bodies matching the reference character style at [tier_sheet.png], simple cute minimal faces (closed happy eyes, small smile), thick rounded dark-navy outline, soft glossy shading, warm cream background, no text, no watermark, crisp clean edges, reads clearly at 48px, original character design, not a copy of any existing game icon (not Threes!, not 2048)" | RGB, 1254×1254, on-brief first try. |
| `B-merge-spark/wordmark.png` | "Wordmark logotype graphic reading exactly 'Glow Rescue' (two words, capital G and R, rest lowercase), bold rounded friendly display typeface similar in spirit to the Fredoka font, the text filled with a warm golden-orange to amber gradient like the tile colors at [tier_sheet.png], thin dark-navy outline around the letters, small bright spark/flash icon placed between the two words, on a transparent or warm cream background, flat vector illustration, clean crisp edges, premium casual mobile game branding, no other text, no watermark" | Came back **already RGBA** (real alpha, 2022×326) — only eroded 1px + de-fringed, no chroma-keying needed. |

### Direction C — Tower beacon
Stacked tile tower with a beacon glow on top — the most "brand mascot"
direction; its wordmark generation came back as a combined icon+text
lockup rather than text-only.

| File | Prompt | Notes |
|---|---|---|
| `C-tower-beacon/icon.png` | "App icon, 1:1 square, for a premium casual mobile puzzle game called Glow Rescue. A short tower of three stacked friendly rounded-square tile characters, small at bottom to small at top, warm golden-orange to amber gradient bodies matching the reference character style at [tier_sheet.png], the top tile glowing brighter like a lit beacon/lantern with a soft warm light halo, simple cute minimal face only on the top tile (closed happy eyes, small smile), thick rounded dark-navy outline, soft glossy shading, warm cream background, no text, no watermark, crisp clean edges, reads clearly at 48px, original character design, not a copy of any existing game icon (not Threes!, not 2048)" | RGB, 1254×1254, on-brief first try. |
| `C-tower-beacon/wordmark.png` | "Wordmark logotype graphic reading exactly 'Glow Rescue' stacked on two lines (GLOW on top, RESCUE below), bold rounded friendly display typeface similar in spirit to the Fredoka font, ink-navy colored text (#1e2a44), a small glowing tile character (rounded square with a tiny warm smiling face, golden-orange gradient) placed to the left of the wordmark like a mascot badge, on a transparent or warm cream background, flat vector illustration, clean crisp edges, premium casual mobile game branding, no other text, no watermark" | Came back **already RGBA** (1774×887) with the requested mascot badge baked in as a combined lockup — this is a bonus asset, but it means the header/splash composites for Direction C intentionally skip pasting the *separate* standalone icon next to it (that would show two mascots); they scale this one combined mark instead. The standalone `icon.png` (tower) is still used alone for the launcher tile, where a plain square icon is required regardless of direction. |

## Post-processing (documented per the epic's transparent-asset rule)

1. **Icons**: kept as full-bleed opaque squares (matching how real premium
   app icons like Threes!'s own ship — colored background, not
   transparent) — no chroma-keying needed for these.
2. **Wordmarks**: cropped to their opaque bounding box + 12px margin, then
   `erode_and_defringe()` (1px alpha erosion + a blur-based color pull-in
   under semi-transparent edges) to remove any lingering fringe. Verified
   with Pillow: alpha min/max per file is 0/255 (real binary-ish alpha,
   not fully opaque), and each `*/wordmark_check.png` composites the
   cleaned wordmark over a checkerboard so the alpha is visible by eye —
   no fringing seen on any of the three.
3. **Direction A's wordmark specifically** had no alpha channel from the
   generator (flat cream backdrop) — chroma-keyed via corner-color
   sampling + distance threshold, then run through the same erode/de-fringe
   step, per "if the output has no alpha, request/derive a flat chroma
   background and key it out with Pillow, documenting that step."

## Mockups

All three screens are 1080×2400 (the app's real golden resolution), built
with `/data/tools/pyenv/bin/python` + Pillow:

- **`mockup-splash.png`**: base is the real
  `apps-native/games/merge_relay/test/goldens/screens/welcome.png` golden.
  The old code-drawn "GLOW RESCUE" title band is replaced by re-using a
  text-free strip of the golden's own background (tiled, not stretched, so
  the dot pattern stays circular) and pasting the icon + wordmark (or the
  combined lockup, for C) centered in that band with a soft drop shadow
  matching `MrTokens.cardShadow()`'s language. Everything else in the
  golden (the tile-merge illustration, tagline, "Let's play" button) is
  untouched.
- **`mockup-header.png`**: base is the real `.../screens/home.png` golden.
  Same text-free-strip trick erases just the "GLOW RESCUE" title, then an
  inline icon+wordmark lockup is pasted in its place, left-aligned like
  the original title, without touching the settings-icon button at top
  right or anything below the header.
- **`mockup-launcher.png`**: a fresh, code-drawn Android/iOS-style home
  screen (neutral slate wallpaper, a 4×3 icon grid + a 4-icon dock, a
  status-bar clock) with our squircle-masked icon in one slot (highlighted
  with a subtle ring + the "Glow Rescue" label in Fredoka) among 11
  generic placeholder icons (simple flat shapes — circle, square,
  triangle, star, etc. — each a distinct hue, labeled with plausible
  generic app names). The 11 placeholders and the wallpaper/dock chrome
  are code-drawn on purpose (they represent *other, unrelated apps*, not
  Glow Rescue's own art, so they were never sent through image-gen).

## Lookalike check

Checked all three icons + wordmarks against the rule in
`.claude/skills/audit-game-and-prepare-for-release/references/07-brand-name-logo.md`
("four-color swirls read as Chrome; avoid competitor motifs"):

- **Threes!** (the epic's own visual target): Threes!'s tiles are flat
  pastel cards with a very specific closed-eye/fang "monster" face style
  and a cream *board* (not app icon) palette. All three of our directions
  use a distinct rounder, glossier, single-family warm-orange gradient
  face style (simple closed-eye smile, no fangs/monster styling) — closer
  to a generic "kawaii blob" than Threes!'s specific character design, and
  none of the three reproduce Threes!'s exact palette steps or card
  proportions.
- **2048 (Cirulli)**: 2048's icon is a flat, single-hue, character-less
  orange square with a plain numeral. All three directions have a face,
  a glow/spark effect, and (B/C) more than one tile — clearly distinct
  from the flat-square anti-reference.
- **Chrome / four-color pinwheel**: none of the three icons use a
  radial multi-color swirl; B's spark is a single warm-hue burst, not a
  pinwheel.
- **Crowns / "King" imagery, other genre clichés**: none present.
- Web/store spot-check: no existing "Glow Rescue" game icon found in a
  quick search of the App Store/Play Store listing pages (consistent with
  the strict name-uniqueness check already done at task 14/17); none of
  the three generated motifs (single glow tile, merge spark, tower beacon)
  resemble a specific existing game icon we could identify.

Verdict: **no lookalike conflicts** on any of the three directions.

## Recommendation

All three are usable; ranked for task 21:

1. **Direction A (hero glow tile)** — recommended default. Reads cleanest
   at 48px (a single subject, most "app icon"-shaped), pairs well with
   *either* a lockup or a text-only wordmark, and the "glow" in the name is
   most literally represented by the tile's own light halo.
2. **Direction C (tower beacon)** — strongest mascot/brand personality
   (the combined icon+wordmark lockup is genuinely nice as a header/splash
   asset) but the tower shape reads less cleanly as a tiny launcher icon
   than a single tile.
3. **Direction B (merge spark)** — best represents the *merge* mechanic
   itself and is a strong wordmark (the spark-between-words treatment is
   distinctive), but the icon is busier at 48px than A or C.

A mix-and-match refinement (e.g. A's icon + B's wordmark treatment) is a
reasonable ask for task 21/22 if the user wants to combine elements.

## Stray-file incident (flagging for the orchestrator / task 22 agent)

`image-gen`'s underlying `codex exec` agent has real shell/file-write
access, not just an image-return call. Twice during this run — both times
because the Bash tool's cwd defaulted to the repo root instead of a
scratch dir — it wrote its own copy of the generated PNG directly into
the repo instead of only printing the path:

- `artifacts/imagegen/glow-rescue-app-icon.png` (a new, untracked
  `artifacts/` dir at repo root)
- `apps-native/games/merge_relay/assets/branding/glow-rescue-app-icon.png`
  (inside the frozen app-code tree this task must not touch)
- `apps-native/games/merge_relay/assets/branding/wordmark-wide.png`
  (same tree)

All three were caught via `git status --porcelain` immediately after each
generation, the actual image content was copied into this task's folder
(they're the same renders documented above), and the stray files/dirs
were deleted before anything else ran. `git status` is clean of anything
outside `.agents/resources/2026-09-25/merge-relay-art/` as of this
README. Recommend later image-gen tasks (20, 22, 23) always `cd` to a
non-repo scratch directory before invoking `image-gen`, and re-check
`git status` after every call, not just at the end.

## Open question for `.agents/games/merge-relay/open-questions.md` (task 21)

> **Logo/icon direction (task 19).** Three original directions are ready
> for pick at
> `.agents/resources/2026-09-25/merge-relay-art/logo/contact-sheet.png`
> (each direction's full icon/wordmark/mockups are in its own
> `A-hero-glow/` / `B-merge-spark/` / `C-tower-beacon/` subfolder):
> **A** — single hero glow tile (recommended default, cleanest at 48px);
> **B** — two tiles merging with a spark (best represents the merge verb);
> **C** — stacked tile tower with a beacon face (strongest mascot
> personality; its wordmark is a combined icon+text lockup, a bonus
> asset). No lookalike conflicts found against Threes!, 2048, Chrome, or
> genre clichés (crowns/"King"); wordmark spelling verified as exactly
> "Glow Rescue" on every render. Mix-and-match between directions (e.g.
> A's icon + B's wordmark) is also an option for task 22's finals.
