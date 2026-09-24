---
epic: 15-ludo-launch
task: 07-onboarding
status: completed
commit_scope: ludo
depends_on: [15-ludo-launch/06-audio-haptics]
estimate: M
---

# Build splash, welcome, profile picker, and interactive tutorial

## Goal

Build the app's first-run experience: splash screen, welcome screen, a
name + code-drawn-avatar picker, and an interactive tutorial playable on a
mini board with a Skip option at every step — matching Ludo King's
structure per `.agents/resources/2026-09-19/ludo-reference/study.md` but
with this app's own code-drawn visual style and **no ad/monetization
gating** anywhere in this flow.

## Context/Decisions

- Screen list for this task: `SplashScreen`, `OnboardingWelcomeScreen`,
  `OnboardingProfileScreen` (name + avatar picker), and
  `OnboardingTutorialScreen` (a mini board, 1-2 tokens, walks the player
  through rolling, moving, and capturing using the real
  `ludo_rules`/`ludo_game.dart` components from tasks 01/04/05 at a reduced
  scale — not a separate fake board).
- Avatar picker: a code-drawn avatar set of **at least 8 distinct avatars**
  (reuse the token-color glossy circle style from task 04, varied by color
  and a simple distinguishing motif — e.g. a face pattern, a simple
  accessory shape — drawn with `CustomPainter`, not photo upload). Fewer
  than 8 distinct, visually-differentiated avatars fails this task's
  acceptance.
- Explicitly excluded from this screen set (per product decision): any King
  Pass/subscription offer, coin/diamond purchase prompts, rewarded-ad
  gates, or interstitial ads — `study.md` documents these as present in the
  real Ludo King app; do not port them.
- Onboarding must be skippable at every step (`Skip` visible on welcome,
  profile, and tutorial screens) and must not block reaching the home lobby
  (task 08) — a player who skips everything still gets a generated default
  name and one of the 8+ avatars assigned automatically.
- Persist "onboarding complete" + chosen name/avatar locally, using the same
  local-persistence mechanism task 06 established for sound settings (do
  not introduce a second mechanism).
- Golden tests: `matchesGoldenFile` goldens for the avatar picker grid
  (showing all 8+ avatars distinctly) committed under
  `apps-native/games/ludo/test/goldens/`.
- Accessibility: every tappable control in this task's screens (Skip
  buttons, avatar tiles, name field, tutorial's roll/move targets) carries a
  `Semantics` label and a minimum 48dp tap target — verified by widget
  tests, not left to visual inspection.

## Implementation Checklist

- [x] Create `lib/src/screens/splash_screen.dart`.
- [x] Create `lib/src/screens/onboarding_welcome_screen.dart`,
  `onboarding_profile_screen.dart` (name field + ≥8-avatar picker grid),
  `onboarding_tutorial_screen.dart`, each with a visible, `Semantics`-labeled
  Skip action and 48dp+ tap targets throughout.
- [x] Create `lib/src/widgets/ludo_avatar.dart`: the code-drawn avatar
  `CustomPainter` set (≥8 distinct avatars).
- [x] Create `lib/src/state/ludo_profile_settings.dart` (name, avatar id,
  onboarding-complete flag) with local persistence, reusing task 06's
  persistence mechanism.
- [x] Wire `lib/src/app.dart`'s routing: splash -> (onboarding if
  incomplete, else home lobby placeholder — task 08 fills in the real
  destination).
- [x] Add `test/screens/onboarding_flow_test.dart` covering: skip at each
  step reaches the post-onboarding destination, completing all steps
  persists the chosen name/avatar, and re-launching after completion skips
  onboarding entirely.
- [x] Add `test/widgets/ludo_avatar_test.dart` covering: at least 8 avatars
  render distinctly (different colors/motifs, asserted via widget
  tree/paint comparison, not just count).
- [x] Add golden tests under `test/goldens/` for the avatar picker grid.
- [x] Add accessibility assertions (`tester.getSemantics`, min tap-target
  size) to the screen tests above for every interactive control.

## Files Touched

- `apps-native/games/ludo/lib/src/screens/splash_screen.dart`
- `apps-native/games/ludo/lib/src/screens/onboarding_welcome_screen.dart`
- `apps-native/games/ludo/lib/src/screens/onboarding_profile_screen.dart`
- `apps-native/games/ludo/lib/src/screens/onboarding_tutorial_screen.dart`
- `apps-native/games/ludo/lib/src/widgets/ludo_avatar.dart`
- `apps-native/games/ludo/lib/src/state/ludo_profile_settings.dart`
- `apps-native/games/ludo/lib/src/app.dart`
- `apps-native/games/ludo/test/screens/onboarding_flow_test.dart`
- `apps-native/games/ludo/test/widgets/ludo_avatar_test.dart`
- `apps-native/games/ludo/test/goldens/*.png`

## Acceptance Criteria

- Onboarding can be fully skipped and fully completed; both paths persist a
  name and one of at least 8 distinct code-drawn avatars.
- No screen in this task references billing, ads, or a coin/diamond
  currency.
- The tutorial screen uses the real board/token/dice components from tasks
  04/05, not a separate mock implementation.
- Every interactive control has a `Semantics` label and a 48dp+ tap target,
  verified by test.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`

## Out of Scope

- Home lobby entry cards and resume affordance (task 08).
- Mode/setup sheet and the game board screen itself (task 09).
- Real resume-from-save logic (task 11).
- Online/private-room screens (tasks 24-26).

## Commit message

`feat(ludo): add splash, onboarding, and avatar picker screens [15-ludo-launch/07]`
