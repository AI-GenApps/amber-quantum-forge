---
epic: 15-ludo-launch
task: 08-home-lobby
status: completed
commit_scope: ludo
depends_on: [15-ludo-launch/07-onboarding]
estimate: M
---

# Build the home lobby screen

## Goal

Build the home lobby (`HomeLobbyScreen`) with four entry cards — Computer,
Pass N Play, Play with Friends, Online — matching Ludo King's structure per
`.agents/resources/2026-09-19/ludo-reference/study.md`, with the two online
tiles (Play with Friends, Online) shown in an explicit "coming soon"/
disabled state until task 26 wires real online flows.

## Context/Decisions

- `HomeLobbyScreen` with four entry cards: Computer, Pass N Play, Play with
  Friends, Online. Computer and Pass N Play are enabled immediately (they
  route to task 09's mode/setup sheet for fully local play). Play with
  Friends and Online render as visibly disabled tiles with a "coming soon"
  label/badge and no tap action until task 26 replaces them with real
  navigation — this task must not fake a working online tile that silently
  does nothing; the disabled state must be visually and semantically
  explicit (`Semantics` announces "coming soon, unavailable" or similar, not
  just a dimmed color).
- Explicitly excluded (per product decision, matching task 07): any King
  Pass/subscription offer, coin/diamond purchase prompts, rewarded-ad
  gates, or interstitial ads.
- Resume-in-progress: if a local match (Computer or Pass N Play) was left
  in progress, the home lobby shows a "Resume" affordance instead of (or
  alongside) the four entry cards — the actual save/restore mechanism is
  task 11's responsibility; this task only needs to leave a clear
  integration point (a nullable "resumable match summary" passed into the
  lobby widget) rather than hardcoding four cards with no resume state.
- Accessibility: every entry card (enabled or disabled) carries a
  `Semantics` label describing its state and a minimum 48dp tap target.

## Implementation Checklist

- [x] Create `lib/src/screens/home_lobby_screen.dart` with the four entry
  cards (Computer, Pass N Play enabled; Play with Friends, Online disabled
  with a "coming soon" badge and `Semantics` state) and a resume-affordance
  slot.
- [x] Wire `lib/src/app.dart`'s post-onboarding route (task 07's
  placeholder) to `home_lobby_screen.dart`.
- [x] Add `test/screens/home_lobby_screen_test.dart` covering: all four
  entry cards render, Computer/Pass N Play are tappable, Play with
  Friends/Online are visibly disabled and not tappable (no navigation
  triggered on tap), the resume affordance renders only when a non-null
  resumable-match summary is supplied, and every card exposes a
  `Semantics` label with the correct enabled/disabled state.
- [x] Add a golden test under `test/goldens/` for the lobby screen showing
  all four cards including the disabled-state styling of the online tiles.

## Files Touched

- `apps-native/games/ludo/lib/src/screens/home_lobby_screen.dart`
- `apps-native/games/ludo/lib/src/app.dart`
- `apps-native/games/ludo/test/screens/home_lobby_screen_test.dart`
- `apps-native/games/ludo/test/goldens/home_lobby_screen.png`

## Acceptance Criteria

- Computer and Pass N Play cards are tappable and route toward task 09's
  setup sheet; Play with Friends and Online are visibly and semantically
  disabled with no tap action, verified by test.
- The resume affordance renders only when supplied a non-null resumable
  match summary.
- No screen in this task references billing, ads, or a coin/diamond
  currency.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Mode/setup sheet and the game board screen itself (task 09).
- Real resume-from-save logic (task 11).
- Enabling the online tiles and wiring their real destinations (task 26).

## Commit message

`feat(ludo): add home lobby screen with disabled online tiles [15-ludo-launch/08]`
