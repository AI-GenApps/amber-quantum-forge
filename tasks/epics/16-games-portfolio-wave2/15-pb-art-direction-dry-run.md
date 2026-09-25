---
epic: 16-games-portfolio-wave2
task: 15-pb-art-direction-dry-run
status: pending
commit_scope: pocket-biome
depends_on: [16-games-portfolio-wave2/14-mr-name-candidates]
estimate: M
owner: agent
---

# Pocket Biome: art-direction dry run (preview images and full-screen mockups)

## Goal

Give the user a concrete way to decide on Pocket Biome's look and to
price its art: **3 art directions**, each with preview species sprites
across growth stages and a habitat mockup at phone resolution, plus an
asset-count and cost estimate for the full 30-species target.

## Context / Decisions

- Audit: in this genre, the art *is* the product; the current pots are a
  dot and an ellipse. References: Terrarium: Garden Idle (look), Pocket
  Frogs (breeding), Viridi (growth). Their store screenshots are in
  `.agents/resources/2026-09-25/*-store-reference/` (task 01). Take the
  quality bar only; all art is original.
- **Image tool:** use the image-generation tool configured for this session
  (the user is adding one; the skill's default is the Higgsfield CLI
  `gpt_image_2_5`, see `references/08-art-audio-pipeline.md`). Step 1 is
  a one-image smoke test. If no image tool works, return **blocked**, and
  never substitute code-drawn or downloaded images.
- This is a dry run: use cheap/fast settings (a low-quality model or low
  resolution). The finals come after the user's pick, in a later epic.
- Directions (a starting point; refine them): **A "Glass terrarium"**
  (soft 3D, glossy glass, warm light); **B "Storybook watercolor"** (paper
  texture, hand-painted); **C "Chunky toy"** (vinyl-toy plants with faces,
  saturated).
- Per direction, generate: 3 species × 3 growth stages (seed, sprout,
  bloom) on a transparent background (check the alpha with Pillow), 1
  habitat background, and 1 UI chip sample. Then composite a **1080×2400
  habitat mockup** with Pillow (the background, 6 pots with sprites, the
  current UI's album/compost/pots stats restyled, and the task 03 fonts), so
  the user judges a screen, not loose images.
- Cost sheet: count the assets for 30 species × 3–4 stages plus behaviours,
  UI and backgrounds, with the estimated generations and rework rate per
  direction.

## Implementation Checklist

- [ ] Run the image-tool smoke test and log the tool, model and parameters.
- [ ] Generate the preview sets and VIEW every image; regenerate once if an
      image is off-brief.
- [ ] Create the mockups (`mockup-A.png`, `-B`, `-C`) and a `contact-sheet.png`.
- [ ] Write the `README.md` (prompts per file, the tool and settings, a
      direction summary, pros and cons, the cost sheet, and a recommendation).
- [ ] Add an open question for the user's pick to
      `.agents/games/pocket-biome/open-questions.md`.

## Files Touched

- `.agents/resources/2026-09-25/pocket-biome-art/dry-run/**`
- `.agents/games/pocket-biome/{open-questions,assets-index}.md`

## Acceptance Criteria

- The 3 directions are each complete (9 sprites + background + chip + mockup),
  and every sprite has verified transparency.
- The mockups are 1080×2400 and use the Quicksand and Fraunces font files
  from `apps-native/games/pocket_biome/assets/fonts/`.
- The README logs the prompt and parameters for every generated file.
- No file is added under `apps-native/`.

## Verification Commands

- `/data/tools/pyenv/bin/python -c "from PIL import Image;import glob;[print(p, Image.open(p).size, Image.open(p).mode) for p in sorted(glob.glob('.agents/resources/2026-09-25/pocket-biome-art/dry-run/**/*.png', recursive=True))]"`
- `git diff --stat`

## Out of Scope

- Final art, app integration, and gameplay.

## Commit message

`docs(pocket-biome): add three-direction art dry run with mockups and cost sheet [16-games-portfolio-wave2/15]`
