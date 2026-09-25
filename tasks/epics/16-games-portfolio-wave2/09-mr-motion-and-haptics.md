---
epic: 16-games-portfolio-wave2
task: 09-mr-motion-and-haptics
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/08-mr-tiles-and-board]
estimate: M
owner: agent
---

# Merge Relay: motion, juice, and haptics

## Goal

Make every move feel physical: slide easing, a merge squash-and-pop, a
spawn grow-in, a score pop, a "new best tile" celebration, and a shake when
a move is blocked. Each has a matching haptic, and reduced motion is
respected.

## Context / Decisions

- Timings are a starting point to tune: slide 110 ms (ease-out), merge pop
  140 ms (scale 1.0→1.18→1.0 with a squash), spawn 120 ms (0.6→1.0),
  blocked move 180 ms (a ±6 px horizontal shake).
- Game logic stays authoritative. Animations play the domain trace from
  `merge_rules`, input queues during animation, and the audit's UX-01 rule
  holds: pausing mid-animation and restoring must yield the correct board
  (`docs-internal/gaming/merge-relay-release-audit.md`).
- Haptics use `HapticFeedback` (light on slide, medium on merge, heavy on
  a new best tile, selection click on buttons) behind the vibration toggle
  (add the toggle to Settings if it's missing).
- Reduced motion (the Settings toggle and the platform
  `MediaQuery.disableAnimations`) makes every animation instant or fade-only.
- Tests: animations use explicit durations, so tests pump fixed times; the
  live Flame loop must never be `pumpAndSettle`d.

## Implementation Checklist

- [ ] Add an animation layer that consumes the move trace (slides, merges,
      and spawns).
- [ ] Add the merge pop, score pop, best-tile celebration (a short burst of
      code-drawn confetti), and blocked-move shake.
- [ ] Add haptics per event and a vibration toggle.
- [ ] Add the reduced-motion path.
- [ ] Add tests: the trace-to-animation mapping, input queued during an
      animation, pause mid-animation then restore, reduced motion makes
      durations zero, and the haptics channel is called once per event (with
      a mocked `SystemChannels.platform`).
- [ ] Add a frame-sequence golden strip
      (`test/goldens/motion/merge_strip.png`: 5 frames of one merge), copy it
      to `.agents/resources/2026-09-25/games-wave2-qa/09/`, and VIEW it.

## Files Touched

- `apps-native/games/merge_relay/lib/src/**` (board widget, the new animation files, preferences, and settings overlay)
- `apps-native/games/merge_relay/test/**`

## Acceptance Criteria

- All the tests above pass, and the full suite has no hang (under 3 min).
- The merge strip golden visibly shows squash and pop across frames.
- The reduced-motion test proves zero-duration animations.
- The test count is ≥ task 08's.

## Verification Commands

- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`
- Device check: NOT RUN (the feel is judged in human task 25).

## Out of Scope

- Sound (task 10).

## Commit message

`feat(merge-relay): add slide, merge, spawn motion with haptics and reduced motion [16-games-portfolio-wave2/09]`
