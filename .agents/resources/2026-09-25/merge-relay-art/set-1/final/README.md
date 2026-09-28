# Glow Rescue — final tile/scene/board/chapter art (task 23)

Final-quality renders of art direction B ("glossy painted/3D-toy",
`mr_art_direction: B` in `decisions.md`), for every slot task 23 calls for:
12 tile-tier cards, `homeScene`, `boardFrame`, and 6 chapter cards. Full
prompts, per-file provenance, and post-processing are in
`apps-native/games/merge_relay/assets/art/LICENSES.md` (this file is a
shorter index; that one is the source of truth for exact prompt text).

## Tool, model, and smoke test

- Tool: `~/.local/bin/image-gen` (wraps `codex exec`), model `gpt-6-luna`
  throughout — no image needed the `gpt-6-astra` fallback.
- Smoke test: `raw/tileFace_2.png` (the first generation of this task) —
  a 1254x1254 RGBA glossy-toy tile card, on-brief on the first try. It was
  then passed back in as the style-continuity reference for the other 11
  tile tiers, so all 12 share one light direction, outline weight, and
  card proportions.
- Every generation was followed by `git status --porcelain apps-native/`
  to confirm `codex exec` left no stray files in the repo (per the
  2026-09-27 image-gen safety note in `STATUS.md`) — clean throughout this
  run.

## Contents

- `raw/tileFace_<2,4,8,16,32,64,128,256,512,1024,2048,4096>.png` — the 12
  tile-tier cards, unmodified exactly as generated (RGBA, 1254x1254,
  transparent border + opaque interior, verified with Pillow).
- `raw/homeScene.png` — the home hero banner (RGB, 1374x1145).
- `raw/boardFrame.png` — the board tray texture, filling its frame edge to
  edge this time (RGB, 1254x1254; the task 20 dry run's navy-background
  version needed a crop, this prompt asked for none).
- `raw/chapterCard_<1-6>.png` — one themed vignette per Rescue chapter
  (Harbor, Foundry, Orchard, Bazaar, Glacier, Observatory), each RGB,
  1254x1254.

## Regenerations

**None.** All 20 generations were on-brief on the first VIEW — no image
needed a second pass.

## Post-processing

Every in-app copy (`apps-native/games/merge_relay/assets/art/*.png`) is a
Pillow LANCZOS resize + re-encode of its master here, with no further AI
generation:

- Tile cards → 768x768 (`<=256dp at 3x`), RGBA kept.
- `homeScene.png` → resized so its width is 1080px, flattened to RGB.
- `boardFrame.png` → 1080x1080, flattened to RGB.
- `chapterCard_<n>.png` → 300x300, flattened to RGB (shown at 28x28 in the
  chapter map).

See `apps-native/games/merge_relay/assets/art/LICENSES.md` for the exact
prompt text (shared templates + the per-tier/per-chapter variation table)
and `.agents/resources/2026-09-25/games-wave2-qa/23/README.md` for the
integration summary and evidence index.
