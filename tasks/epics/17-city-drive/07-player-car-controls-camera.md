---
epic: 17-city-drive
task: 07-player-car-controls-camera
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/06-scene-renderer-and-budgets]
estimate: L
owner: agent
---

# Player car, touch and keyboard controls, chase camera

## Goal

Make the city drivable: a physics car from task 03 rendered with a Kenney car
model, controlled by touch (phone) or keyboard (desktop), followed by a
smooth chase camera, with a respawn when flipped or stuck.

## Context / Decisions

- **Game loop** (`src/game/loop.ts`):
  - On each `requestAnimationFrame`, accumulate time, step the core
    simulation at a fixed 1/60 s (at most 5 steps per frame, so a hitch does
    not spiral), then render with interpolation between the last two states.
  - The loop is a pure class that tests drive with a fake clock.
- **Input abstraction** (`src/input/`): `InputSource` returns
  `{ throttle, steer, handbrake, reset }`. Three implementations:
  - **Keyboard:** WASD/arrows, Space = handbrake, R = reset.
  - **Touch:**
    - Left side: left and right steer buttons (with a ramped steer, not
      instant).
    - Right side: gas and brake/reverse pedals plus a handbrake button.
    - Multi-touch must work (steer and gas at the same time).
    - Pointer events only, `touch-action: none`.
  - **Gamepad:** optional. Add it only if it fits within this task's file
    budget; otherwise list it in open-questions.

  Merge rule: keyboard and touch both work; the larger absolute value wins.
- **Touch layout:** HTML buttons in a DOM overlay (Preact components in
  `src/ui/controls/`). Hit areas at least 56 px, positioned from safe-area
  insets (`env(safe-area-inset-*)`). Landscape only; in portrait, show a
  "rotate your device" overlay.
- **Car visuals:**
  - Sync the chassis mesh from the interpolated physics pose.
  - Wheels rotate by speed and steer by angle (split the wheel nodes from the
    Kenney model, or, if the model's wheels are not separate nodes, record that
    and rotate the whole model only).
  - A blob shadow decal or plane under the car.
- **Chase camera:**
  - A custom smoothed follow: position lerp plus look-at with
    speed-dependent distance and FOV.
  - Collision-aware: pull in when a building is between the car and the
    camera, using a ray against the building colliders via core.
  - No `FollowCamera` jitter. Test the smoothing maths as pure functions.
- **Respawn:**
  - Auto-respawn if roll > 70° for 2 s, or speed < 1 km/h with full throttle
    for 4 s.
  - Respawn to the nearest lane point (task 05), facing the lane direction.
- `main.ts` now starts free drive on `district-1`. The orbit camera stays
  behind `?debugcam`.
- Add a `?fps` URL flag that shows a small FPS, draw-call, and triangle
  overlay. Set the Vite dev server's `host: true` so a phone on the LAN can
  open it for task 08.

## Implementation Checklist

- [ ] Fixed-step game loop with interpolation and tests (fake clock: 7 ms and
      40 ms frame sequences give the correct step counts).
- [ ] Input sources, merge rule, and tests (simulated keyboard and pointer
      events in happy-dom, including multi-touch).
- [ ] Touch-control overlay, portrait guard, and safe areas.
- [ ] Car visual sync, wheels, and blob shadow.
- [ ] Chase camera with occlusion pull-in and tests for the pure maths.
- [ ] Auto and manual respawn, with tests via core.
- [ ] A headless integration test: game loop + core + `NullEngine` scene, with
      scripted throttle for 5 s, asserting the car mesh moved by the
      simulated distance (±0.1 m interpolation tolerance).
- [ ] Re-run the task 06 budget test with the car added; it must stay in budget.

## Files Touched

- `apps-games/city-drive/src/{game/**,input/**,ui/controls/**,render/car*.ts,render/camera*.ts,main.ts}`, `test/**`

## Acceptance Criteria

- All the new tests pass, and the budget test still passes.
- The keyboard and touch paths are both exercised by tests.
- No browser QA performed. Task 08 is the human visual and feel check.

## Out of Scope

- Traffic, missions, menus, audio.

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:typecheck`
- `bun run city-drive:build`

## Commit message

`feat(city-drive): add drivable player car, controls and chase camera [17-city-drive/07]`
