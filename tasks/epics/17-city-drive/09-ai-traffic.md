---
epic: 17-city-drive
task: 09-ai-traffic
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/07-player-car-controls-camera]
estimate: L
owner: agent
---

# AI traffic on the road graph

## Goal

Make the city feel alive with cheap, believable AI traffic that follows lanes,
handles intersections, keeps distance, and reacts to the player. The
simulation lives in core and stays deterministic.

## Context / Decisions

- **Model:** traffic cars are **kinematic** Rapier bodies (kinematic position
  based), **not** vehicle controllers. Each agent tracks
  `{ edgeId, s (distance along edge), speed }` and is moved along the lane
  polyline from task 05. This is cheap, deterministic, and never flips.
- **Behaviour per step:**
  - Target cruise speed per agent: 30–45 km/h, from a seeded RNG.
  - **Car-following:** look ahead along the agent's planned path (the current
    plus next edges) for the nearest car (AI or player) within 25 m, and
    brake with an IDM-like rule. Implement the Intelligent Driver Model in a
    simplified form and test it as pure maths.
  - **Intersections:** a reservation table per intersection node. An agent
    must reserve its turn edge before entering, and conflicting turn edges
    cannot be reserved together. Right turns have priority over left turns.
    This gives deadlock-free behaviour without traffic lights. Optional
    visual traffic lights are out of scope for v1.
  - **Route choice:** at each intersection, pick a random allowed turn from
    the seeded RNG. Agents never leave the graph.
- **Player interaction:**
  - Agents brake for the player using the same look-ahead.
  - If the player hits an agent, the agent stops for 3 s and then resumes.
    There is no ragdoll.
  - Missions (task 10) may penalize collisions.
  - Collision events come from Rapier contact events: the player's dynamic
    chassis against the kinematic agent.
- **Density and performance:**
  - At most 16 agents for v1, configurable per district.
  - Agents spawn and despawn **out of the camera view** at distance 60–150 m
    from the player, to keep traffic near the player.
  - Rendering uses one `InstancedMesh` per car model (not thin instances,
    because each car moves every frame).
  - The budget test from task 06 must include 16 agents in view in the worst
    case.
- **Determinism:** seeded RNG (a mulberry32-like algorithm, implemented in
  core). The same seed and the same player inputs give the same traffic.

## Implementation Checklist

- [ ] Seeded RNG, IDM car-following maths, and intersection reservation table,
      each with unit tests.
- [ ] Traffic manager in core: spawn/despawn, per-step update, and kinematic
      body sync.
- [ ] Player-collision handling via contact events, with tests.
- [ ] Renderer: instanced traffic cars with interpolation, and wheel spin if
      cheap.
- [ ] **Soak test** (headless core, no rendering): 16 agents for 10 simulated
      minutes on `district-1` with the player parked. Assert:
  - [ ] zero AI–AI collisions
  - [ ] no agent stuck (speed 0) for more than 20 s outside a reserved wait
  - [ ] no deadlock (all agents keep progressing)
  - [ ] every agent stays within 0.5 m of its lane polyline

  Log the agent-minutes and the run time; it must run in at most 20 s in CI.
- [ ] Determinism test over the same seed and input script.
- [ ] Update the budget test to include traffic, and keep it passing.

## Files Touched

- `apps-games/city-drive-core/src/traffic/**`, `test/traffic/**`
- `apps-games/city-drive/src/render/traffic*.ts`, `test/render/**`

## Acceptance Criteria

- The soak test, determinism test, and budget test all pass.
- No traffic code in core imports Babylon or the DOM.

## Out of Scope

- Pedestrians, police, traffic lights, lane changing, overtaking.

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:typecheck`
- `bun run city-drive:build`

## Commit message

`feat(city-drive): add deterministic lane-following ai traffic [17-city-drive/09]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **"AI–AI collision" definition:** kinematic bodies produce no contacts with each other, so the soak test defines a collision as **OBB overlap** of two agents (or centre distance < 2.0 m), checked every step.
- **Timing:** log the soak time, but assert a generous bound (at most 60 s). Record the actual numbers in `.agents/resources/2026-10-15/city-drive-qa/09/README.md` (add it to Files Touched).
- **Files Touched:** also includes `apps-games/city-drive-core/src/physics/**` (contact events against kinematic bodies).
