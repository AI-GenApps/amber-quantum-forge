# Ludo visual reference (2026-09-24)

`ludo-king-reference.png` is a single reference screenshot of Ludo King's
in-game board screen, supplied by the user to define the *target look and
polish level* for epic `15-ludo-launch` tasks 12a-12f. It complements the
broader flow study already captured at
`.agents/resources/2026-09-19/ludo-reference/` (89 indexed screenshots +
`study.md`), which documents *flow and interaction* rather than final
visual polish.

## What this reference is for

Tasks 12a-12f use this image only as a **look-and-feel target** — polish
level, color saturation, layout density, material/lighting language. No
Ludo King asset (art, icon, font, texture) is ever copied, traced, cropped,
or redistributed from this file or any Ludo King capture. All new Ludo
visuals built for this app are original, code-drawn (Flame/`CustomPainter`)
or original bitmap art authored in a later human art session; see each
task's "Context/Decisions" for the explicit no-copy constraint.

## Target look, described

- **Background**: deep royal-blue, with a faint repeating dice/board motif
  pattern and a vignette darkening toward the edges — never a flat white or
  Material default surface.
- **Board**: framed on the dark background, perfectly square (not
  letterboxed or stretched), with saturated red/green/blue/yellow
  quadrants, white inner yards holding solid colored token circles, white
  track cells, colored home-stretch lanes with entry arrows, and star
  icons on safe cells.
- **Tokens**: glossy 3D pin/map-marker-style tokens (gradient + shadow +
  highlight), not flat circles.
- **Player cards**: four corner cards around the board (two above, two
  below) — glossy blue rounded-rect cards with a gold border, a framed
  square avatar, a dice slot where the active player's die appears inside
  their own card, a name label, and a circular timer ring.
- **Typography**: a chunky rounded display font (e.g. Lilita One) for
  titles/headings in white with a dark outline/shadow, and a friendly
  rounded body font (e.g. Nunito or Baloo 2) for body text — never the
  system default font.
- **Accents**: gold trim, ribbon banners for results/callouts, and chunky
  3D buttons (gradient fill, a darker bottom edge suggesting depth, and a
  press-down animation on tap).
- **Never**: stock Material 3 indigo-seed theming, system sans-serif text,
  plain white backgrounds, or large empty unstyled areas anywhere in the
  app.

## Provenance

- `ludo-king-reference.png`: single reference screenshot supplied directly
  by the user during epic 15 task-authoring, 2026-09-24.
- Baseline screenshots of *this app's* current (pre-12a-12f) state, showing
  the stock-Material-3 look and the black-canvas/stuck-turn bugs these
  tasks fix, were captured the same day from a physical Samsung A52
  (1080x2400) and are referenced by task 12f for before/after comparison
  (not committed to this reference directory — see
  `docs-internal/gaming/evidence/visual/ludo/` for the committed
  after-state evidence tasks 12a-12f produce).
