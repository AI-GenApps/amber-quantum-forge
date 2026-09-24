---
epic: 15-ludo-launch
task: 05-dice-and-effects
status: pending
commit_scope: ludo
depends_on: [15-ludo-launch/04-board-and-tokens]
estimate: L
---

# Add the animated dice, capture particles, home-arrival burst, and win confetti

## Goal

Add the animated, 3D-looking code-drawn dice, capture-particle burst,
home-arrival burst, and win confetti to `ludo_game.dart` (task 04), each with
a reduced-motion variant, completing the manifest slots from task 03.

## Context/Decisions

- All visuals in this task are code-drawn (Flame particle system, `Paint`/
  `Canvas` drawing) — no bitmap/image assets, following task 04's
  established convention of reading from the manifest slot rather than
  hardcoding a drawing choice.
- Dice: an "animated 3D-looking" die drawn with layered faces / a rotation
  tween + face-swap sequence (not a real 3D mesh — a 2D illusion via
  perspective-skewed quads or a simple cross-fade cube unfold), landing on
  the server-authoritative (or bot-local, for offline modes) rolled value
  from `ludo_rules`/task 18. Concrete animation spec (checked by test, not
  opinion): the tumble animation runs for **at least 600ms**, during which
  the displayed face **flickers through at least 3 distinct face values**
  before settling, and ends with a small settle-bounce (a brief overshoot-
  and-correct scale or position tween, not an instant stop) on the final
  face. An instant face-swap with no tumble/flicker/bounce fails this
  task's acceptance.
- Particles/confetti: Flame's particle system (`ParticleSystemComponent`)
  for capture (a burst at the captured token's cell, **and** the knocked
  token itself animates flying back to its yard rather than teleporting —
  both the particle burst and the flight-back tween are required) and win
  (confetti across the board on match end) — bounded lifetime, no
  persistent performance cost after the effect ends. Home-arrival gets its
  own distinct burst (visually different from capture — e.g. a warmer color
  palette and an upward/outward shape) so the two effects are
  distinguishable in a golden/screenshot.
- Reduced-motion: every animated component in this task (dice roll
  animation, particles, confetti) must check the `ReducedMotionSetting`
  from task 04 and substitute an instant, non-animated transition (dice:
  reveal the final face immediately with no tumble; particles/confetti:
  either skip entirely or render a single static flash frame) when it is
  true.
- Golden tests: `matchesGoldenFile` goldens for the dice component at each
  of its six landed faces, and for a representative capture-particle and
  win-confetti frame, committed under `apps-native/games/ludo/test/
  goldens/`.

## Implementation Checklist

- [x] Create `lib/src/game/ludo_dice_component.dart`: the animated
  code-drawn die with a face-swap/skew rotation illusion (≥600ms, ≥3 face
  flickers, settle bounce), landing on a given face value, plus a
  reduced-motion instant-reveal fallback.
- [x] Create `lib/src/game/ludo_capture_particles.dart`: particle burst at
  the captured cell plus a flight-back tween for the knocked token, gated by
  reduced motion (skip entirely, or render a static flash, when enabled).
- [x] Create `lib/src/game/ludo_home_arrival_burst.dart`: a visually
  distinct burst from capture (different color palette/shape), gated the
  same way.
- [x] Create `lib/src/game/ludo_confetti.dart` using Flame's particle
  system for match-end celebration, gated the same way.
- [x] Wire all four components into `lib/src/game/ludo_game.dart` (task
  04), triggered from the corresponding `ludo_rules` events (`diceRolled`,
  `tokenCaptured`, `tokenFinished` reaching home, `matchFinished`).
- [x] Update `lib/src/assets/ludo_art_manifest.dart` (task 03) to resolve
  the dice/particle/confetti visual slots to the real components built here.
- [x] Add `test/game/ludo_dice_component_test.dart` covering: dice
  animation lands on the requested face, runs for the minimum duration with
  at least 3 face changes before settling, and reduced-motion mode skips
  the tumble entirely.
- [x] Add `test/game/ludo_capture_particles_test.dart`,
  `ludo_home_arrival_burst_test.dart`, `ludo_confetti_test.dart` covering
  bounded particle lifetime and reduced-motion gating.
- [x] Add golden tests under `test/goldens/` (dice at each of 6 faces,
  capture-particle frame, win-confetti frame) using `matchesGoldenFile`,
  golden `.png` files committed under `apps-native/games/ludo/test/
  goldens/`.

## Files Touched

- `apps-native/games/ludo/lib/src/game/ludo_dice_component.dart`
- `apps-native/games/ludo/lib/src/game/ludo_capture_particles.dart`
- `apps-native/games/ludo/lib/src/game/ludo_home_arrival_burst.dart`
- `apps-native/games/ludo/lib/src/game/ludo_confetti.dart`
- `apps-native/games/ludo/lib/src/game/ludo_game.dart` (wired)
- `apps-native/games/ludo/lib/src/assets/ludo_art_manifest.dart`
- `apps-native/games/ludo/test/game/*.dart`
- `apps-native/games/ludo/test/goldens/*.png`

## Acceptance Criteria

- The dice component always lands on the value it was asked to show, with a
  tumble of at least 600ms and at least 3 face changes observed by a test
  before settling.
- Capture triggers both a particle burst and a flight-back tween for the
  knocked token, distinguishable from the home-arrival burst by a golden
  comparison.
- With reduced motion enabled, no component test in this task observes more
  than one animation frame/tween step before reaching the final state.
- No image/bitmap asset file is added by this task.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Board/track/token rendering (task 04).
- Audio/haptics (task 06).
- Screen chrome (panels, timers, menus — tasks 07-11).
- Wiring to real/online match state (task 12, tasks 24-26).

## Commit message

`feat(ludo): add animated dice, capture/home effects, and win confetti [15-ludo-launch/05]`
