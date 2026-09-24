# Ludo (Flutter) — baseline before visual overhaul

Captured 2026-09-24 on a physical Samsung SM-A525F (1080x2400) from the debug build
after epic 15 tasks 00–12. These are the "before" screens that prompted tasks 12a–12f.

Findings:
- Stock Material 3 look (indigo seed theme, system font, white backgrounds, large empty areas).
- Black unfilled region below the board on every game screen; dice drawn inside the green yard.
- Stuck turn: a bot turn froze in a 4-player game, and a 2-player Quick game stopped
  responding after the human rolled a 2, so the results screen was unreachable.

Visual targets: `../ludo-visual-reference/` and `../../2026-09-19/ludo-reference/`
(Ludo King study; see `06-home-clear.png` and `16-roll-settled.png`).
After-overhaul evidence lives in `../ludo-visual-qa/<task-id>/`.
