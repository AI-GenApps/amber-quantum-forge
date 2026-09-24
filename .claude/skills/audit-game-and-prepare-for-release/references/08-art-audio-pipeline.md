# Phase 8 — Art and audio pipeline

## Principle

Code builds structure (theme, layout, animation, slots); **bitmap art** delivers the
"looks like a real game" quality. Code-drawn art plateaus: flat cards, line icons, thin
backgrounds. Plan the art session early and run it right after the visual overhaul.

## Asset manifest

`lib/src/assets/<game>_art_manifest.dart`: named slots (board background, tokens, dice
faces, logos, lobby background, mode tiles, avatars, trophy, particles…). Each slot draws
the bitmap `assets/art/<slot>.png` if present, else the code-drawn fallback. Gameplay code
never references file paths. Tests cover both paths. In widget tests, real PNG decode
must run inside `tester.runAsync` or `pumpAndSettle` never settles.

## Dry run (default in preparation phases)

Before spending credits on finals for anything that needs a human decision:
1. Write a prompt plan per set (subject, style, aspect, transparency, references).
2. Produce cheap previews (fast/low-quality model or low resolution) OR reuse existing
   assets, and composite **full-screen mockups** at device resolution (1080x2400) with PIL
   (background + logo + cards + labels) — users judge screens, not isolated images.
3. Show a contact sheet + mockups; ask with AskUserQuestion; render finals only for the
   approved direction.

## Generation (Higgsfield CLI)

- Auth: `higgsfield account status`; if expired ask the user to run `! higgsfield auth
  login`; if "No workspace selected": `higgsfield workspace list` → `workspace set <id>`.
- Model: `gpt_image_2_5` (text/graphic design, `--quality high --resolution 2k`,
  `--image-references a.png b.png` for style carry-over, `--background transparent` for
  sprites/tiles/logos). Verify alpha with PIL.
- Brief template: premium casual mobile game art, glossy, saturated, 3D-rendered, the
  game's palette, gold accents, deep brand background, crisp edges, no photorealism,
  ORIGINAL (no competitor elements/motifs), readable at target size, no text unless
  specified, no watermark.
- The generating agent views every output and regenerates once if off-brief; logs model,
  params, prompt per file in the set's README; commits the folder.

## Art sets (order)

1. Logo + icon (Phase 7). 2. Lobby background + illustrated mode tiles + bigger header
logo. 3. Pieces (tokens) + dice faces (all six) + board skin. 4. Game-screen background,
player card frames, dice box. 5. Avatar set + results trophy/ribbons + store feature
graphic. Each set: dry run → approval → finals → integration task (optimized sizes, APK
budget ≤ 40 MB) → device captures → user review.

## Audio

CC0 only (e.g. Kenney.nl packs), downloaded — never synthesized and labelled CC0.
`assets/audio/LICENSES.md` with file → source URL → licence. SFX: roll, step, capture,
home, win, button, turn alert; one music loop; settings toggles for sound/music/vibration;
haptic patterns per event. If network download is impossible, the task is blocked.

## Provenance

`assets/art/LICENSES.md` in the app: each file → master path in `.agents/`, model, date,
"original AI-generated art". Masters and prompts stay under
`.agents/resources/<date>/<game>-art/<set>/`.
