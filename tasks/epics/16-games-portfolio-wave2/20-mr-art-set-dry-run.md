---
epic: 16-games-portfolio-wave2
task: 20-mr-art-set-dry-run
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/19-mr-logo-dry-run]
estimate: M
owner: agent
---

# Merge Relay: art-set dry run (tile characters, home scene, chapter art)

## Goal

Preview bitmap art for the manifest slots from task 07 in 2 directions,
composited into full screens, so the user can approve one direction in task
21 before any final renders are made.

## Context / Decisions

- Slots: `tileFace_<tier>` (show 4 sample tiers: 2, 16, 128, 2048),
  `homeScene`, `boardFrame`, and one chapter-card illustration (chapter 1
  theme).
- **Image tool:** the session's configured image generator. Run a smoke
  test first; if the tool is missing, the task is **blocked**.
- Directions: **A** matches the code-drawn faces from task 08 (for
  continuity); **B** is a bolder painted/3D-toy take. Both are original;
  Threes! sets the quality bar only.
- Tiles need a transparent background, a consistent light direction, and
  a numeral-safe zone (the numeral is drawn by code on top). Check the alpha
  with Pillow.
- Mockups at 1080×2400: Home, Play (mid-game), and Chapter map for each
  direction, composited over the current goldens with Pillow.

## Implementation Checklist

- [ ] Run the smoke test, then generate the samples for A and B at dry-run quality.
- [ ] VIEW everything, and regenerate off-brief images once.
- [ ] Create the mockups and `contact-sheet.png`, then write the README
      (the prompt and parameters per file, plus the asset count and
      estimated generations for the final set).

## Files Touched

- `.agents/resources/2026-09-25/merge-relay-art/set-1/**`

## Acceptance Criteria

- Both directions include 4 tile samples, the home scene, the board frame,
  a chapter card, and 3 screen mockups, and the tile alpha is verified.
- No file is added under `apps-native/`.

## Verification Commands

- `/data/tools/pyenv/bin/python -c "from PIL import Image;import glob;[print(p, Image.open(p).size, Image.open(p).mode) for p in sorted(glob.glob('.agents/resources/2026-09-25/merge-relay-art/set-1/**/*.png', recursive=True))]"`
- `git diff --stat`

## Out of Scope

- Finals and integration (task 23).

## Commit message

`docs(merge-relay): add art-set dry run with screen mockups [16-games-portfolio-wave2/20]`
