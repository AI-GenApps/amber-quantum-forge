---
epic: 15-ludo-launch
task: 04-board-and-tokens
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/03-client-scaffold]
estimate: L
---

# Render the board, track, safe stars, and glossy tokens

## Goal

Build the Flame component tree for the Ludo board — track, home stretches,
yards, safe-cell stars, and glossy code-drawn tokens with hop-by-hop
movement, legal-move highlighting, and turn highlighting — entirely via
code-drawn Flame/`CustomPainter` primitives (gradients, shadows, glossy
highlights), filling in the board/token manifest slots from task 03 with
real implementations behind the same named-slot contract. Dice, particles,
and confetti are task 05.

## Context/Decisions

- All visuals in this task are drawn in code (Flame `PositionComponent`s
  with `Paint`/`Canvas` drawing, gradients via `ui.Gradient.linear`/
  `radial`, drop shadows via `Paint()..maskFilter`, glossy token highlights
  via layered radial gradients) — no bitmap/image assets are added or
  fetched. A later, separate human-reviewed art session swaps bitmaps into
  the same manifest slots; this task must not make that swap harder (e.g.
  don't hardcode "always draw a gradient" inside widget code — read from the
  manifest slot so a slot can later resolve to an `Image` component
  instead).
- Board geometry must read from `ludo_rules`' frozen constants (task 01):
  track length 52, home length 6, tokens per player 4, safe/star indices —
  render every safe cell with a distinct visual treatment (star icon or
  distinct fill) so players can see safety at a glance, matching Ludo King's
  established visual language described in
  `.agents/resources/2026-09-19/ludo-reference/study.md` (four colored
  quadrants, central track, distinct home stretches) but with this app's own
  code-drawn style, not a copy of any captured screenshot.
- Tokens: four colors matching the registry's player seat order (from task
  01's `ludo_config.dart` seat constants — reuse the same names/order, do
  not invent a different palette here). Concrete art requirements (checked
  by golden test, not opinion): each token is a filled circle with (1) a
  radial gradient from a lighter highlight at the top-left to the base
  color, (2) a drop shadow (`Paint()..maskFilter = MaskFilter.blur(...)`)
  offset down-right, and (3) a small glossy ellipse highlight near the top —
  a flat single-color circle with no gradient/shadow/highlight fails the
  golden.
- Token hop movement: a multi-cell move animates as a sequence of discrete
  per-cell hops, not one sliding tween across the whole distance. Each hop
  is ~120ms with an `Curves.easeOut` timing curve and a small vertical arc
  (the token's y-position bulges upward mid-hop before landing), matching
  how Ludo King and most Ludo implementations visually communicate "moved N
  squares." A reduced-motion instant-move fallback substitutes a single
  zero-duration jump to the final cell (consumes the `ReducedMotionSetting`
  described below).
- Legal-move highlight and turn highlight: when it is the local player's
  move phase, every token with a legal move (from `ludo_rules`'
  `legalMoves(state)`) renders a visible highlight ring/glow distinct from
  its normal glossy rendering; the active seat's yard/home-stretch region
  renders a distinct turn-highlight treatment (e.g. a border glow in that
  seat's color) so the current turn is legible without reading the player
  panel (task 09 adds the panel itself; this task only needs the
  board-level highlight to exist and be independently testable).
- Reduced-motion: every animated component in this task (token hop) must
  check a `ReducedMotionSetting` (a simple `bool` provided via the app's
  settings state — the actual settings screen/toggle is task 10, this task
  only needs to consume the flag and substitute an instant, non-animated
  transition when it is true) rather than hardcoding animation as
  mandatory.
- Golden tests: Flutter's `matchesGoldenFile` goldens for the board (empty
  board showing all safe-cell stars), for a populated board (tokens in
  yard/track/home), and for the legal-move/turn highlight states, committed
  under `apps-native/games/ludo/test/goldens/`. A flat placeholder-colored
  board or single-color token circle must fail these goldens once real art
  requirements (gradient/shadow/highlight) are enforced by the checklist
  above.

## Implementation Checklist

- [ ] Create `lib/src/game/ludo_board_component.dart`: draws the track,
  home stretches, yards, and safe-cell markers from `ludo_rules`' geometry
  constants.
- [ ] Create `lib/src/game/ludo_token_component.dart`: glossy code-drawn
  token per color (gradient + drop shadow + glossy highlight, per the
  concrete requirements above), with a hop-by-hop movement animation
  (~120ms/cell, `Curves.easeOut`, small arc) and a reduced-motion instant-
  move fallback.
- [ ] Create `lib/src/game/ludo_legal_move_highlight.dart` and
  `lib/src/game/ludo_turn_highlight.dart` implementing the highlight
  treatments described above, driven by `legalMoves(state)` and the active
  seat.
- [ ] Create `lib/src/state/reduced_motion_setting.dart`: a minimal
  provider/notifier the components above read (real persistence lands in
  task 10; this task can use an in-memory default of `false`).
- [ ] Create `lib/src/game/ludo_game.dart`: the `FlameGame` subclass
  composing board + tokens + highlight layers, driven by a
  `LudoMatchState`-shaped input (from `ludo_rules`, local for now — task 12
  wires a real match state source, task 05 adds dice/particles/confetti on
  top of this same class).
- [ ] Update `lib/src/assets/ludo_art_manifest.dart` (task 03) to resolve
  the board/token visual slots to the real components built here instead of
  the placeholder stubs.
- [ ] Add `test/game/ludo_board_component_test.dart`,
  `ludo_token_component_test.dart` covering: correct cell count rendered,
  correct safe-cell markers, token hop animation completes and lands on the
  expected cell, and reduced-motion mode skips multi-frame animation.
- [ ] Add golden tests under `test/goldens/` (empty board, populated board,
  legal-move highlight, turn highlight) using `matchesGoldenFile`, with the
  golden `.png` files committed under `apps-native/games/ludo/test/
  goldens/`.

## Files Touched

- `apps-native/games/ludo/lib/src/game/ludo_board_component.dart`
- `apps-native/games/ludo/lib/src/game/ludo_token_component.dart`
- `apps-native/games/ludo/lib/src/game/ludo_legal_move_highlight.dart`
- `apps-native/games/ludo/lib/src/game/ludo_turn_highlight.dart`
- `apps-native/games/ludo/lib/src/game/ludo_game.dart`
- `apps-native/games/ludo/lib/src/state/reduced_motion_setting.dart`
- `apps-native/games/ludo/lib/src/assets/ludo_art_manifest.dart`
- `apps-native/games/ludo/test/game/*.dart`
- `apps-native/games/ludo/test/goldens/*.png`

## Acceptance Criteria

- The board renders all 52 track cells + 24 home-stretch cells (6 per
  color) + 4 yards with safe cells visually distinct, verified by component
  tests asserting child counts/tags and by the empty-board golden.
- A token's multi-cell move renders as discrete hops (~120ms/cell,
  `easeOut`, small arc) ending on the correct final cell.
- Every token golden shows a visible gradient, drop shadow, and glossy
  highlight — a flat single-color circle fails the golden comparison.
- With reduced motion enabled, no component test observes more than one
  animation frame/tween step before reaching the final state.
- No image/bitmap asset file is added by this task (`git diff --stat`
  contains only `.dart` files and golden `.png` files under
  `test/goldens/`).

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Dice component, capture particles, home-arrival burst, and win confetti
  (task 05).
- Audio/haptics (task 06).
- Screen chrome (panels, timers, menus — tasks 07-11).
- Wiring to real/online match state (task 12, tasks 24-26).
- Any bitmap asset import.

## Commit message

`feat(ludo): render code-drawn board, safe stars, and glossy tokens [15-ludo-launch/04]`
