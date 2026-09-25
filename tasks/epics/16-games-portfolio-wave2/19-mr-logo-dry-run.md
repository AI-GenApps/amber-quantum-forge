---
epic: 16-games-portfolio-wave2
task: 19-mr-logo-dry-run
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/18-mr-apply-name]
estimate: M
owner: agent
---

# Merge Relay: logo and icon dry run (3 directions)

## Goal

Three original icon + wordmark directions for the new name, shown as a
contact sheet and composited into real screens (the launcher grid, the
splash, and the home header) so the user can pick one in task 21.

## Context / Decisions

- Rules: skill reference `references/07-brand-name-logo.md` (dry run →
  rounds → lookalike check) and `references/08-art-audio-pipeline.md`
  (image tool, brief template).
- **Image tool:** the `image-gen` command (usage in STATUS.md, "Image generation"). Step 1 is a
  smoke test; if the tool is missing, the task is **blocked**. Never
  hand-draw an image and present it as generated.
- Brief basis: a premium casual mobile game with a warm, friendly
  Threes!-grade charm, **original** character tiles (matching task 08's
  faces), the design-system palette (task 07 tokens), crisp edges, no
  photorealism, and no watermark. Icons are 1:1 with **no text** and must
  read at 48 px. Wordmarks use the exact name text (spell-check it; regenerate
  once if it's wrong).
- Suggested directions: **A** a single hero tile character (face-forward);
  **B** two tiles mid-merge with a spark; **C** a stacked tile tower with a
  face on top. Refine them if the name suggests a better motif.
- Lookalike check: avoid anything that resembles well-known app icons
  (e.g. Threes!'s characters, 2048's orange tile, Chrome-like swirls). Note
  the check in the README.
- Mockups (Pillow, `/data/tools/pyenv/bin/python`): a 1080×2400 splash, the
  home header composited onto the current Home golden, and a launcher grid
  (the icon among 11 generic placeholder icons).

## Implementation Checklist

- [ ] Run the smoke test, then generate 3 icons and 3 wordmarks (dry-run quality).
- [ ] VIEW every output and regenerate off-brief images once.
- [ ] Create the mockups and `contact-sheet.png`.
- [ ] Write the README (the prompt and parameters per file, the lookalike
      check, and a recommendation).

## Files Touched

- `.agents/resources/2026-09-25/merge-relay-art/logo/**`

## Acceptance Criteria

- 3 complete directions (icon, wordmark, 3 mockups each) plus a contact
  sheet exist, and the wordmark spelling exactly matches `decisions.md`.
- No file is added under `apps-native/`.

## Verification Commands

- `/data/tools/pyenv/bin/python -c "from PIL import Image;import glob;[print(p, Image.open(p).size) for p in sorted(glob.glob('.agents/resources/2026-09-25/merge-relay-art/logo/*.png'))]"`
- `git diff --stat`

## Out of Scope

- Finals and integration (task 22).

## Commit message

`docs(merge-relay): add logo and icon dry run with screen mockups [16-games-portfolio-wave2/19]`
