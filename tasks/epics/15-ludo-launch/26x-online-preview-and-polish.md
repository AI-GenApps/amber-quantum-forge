---
epic: 15-ludo-launch
task: 26x-online-preview-and-polish
status: completed
commit_scope: ludo
depends_on: [15-ludo-launch/26-online-lobby-ui]
estimate: L
---

# Online preview mode, online screen polish, and warm invite links

## Goal

Close the device-verification gap task 26 left behind: every online screen
and state (room create/join/share, matchmaking search, connecting, waiting
for players, opponent's-turn-with-timer, reconnecting, disconnected/offline,
match found, bot-filled seat) was only ever exercised in widget tests with
fakes, because on a real device the Friends/Online tiles stay disabled
until Firebase and `LUDO_API_BASE_URL` are provisioned (task 29). Add a
DEBUG-ONLY "Online preview" mode that simulates the full online flow
end-to-end without a real backend, polish every online screen/state to the
Ludo Vortex visual bar using the design-system chrome, wire warm-start deep
links (routing an invite link while the app is already running, which task
26 explicitly deferred), and prove all of it on the physical device with
captured evidence judged against the reference screenshots.

## Context/Decisions

- **Why this task exists.** Task 24's Implementation Note records that no
  device build was required for gateway/auth wiring. Task 25 built the
  Firestore/polling match-state source and reconnect handling, verified
  only via widget tests. Task 26 enabled the lobby tiles and built
  room/matchmaking flows, verified only via
  `test/screens/online_flow_test.dart` — and explicitly left the
  still-running-app deep-link case unwired (see
  `apps-native/games/ludo/lib/src/net/ludo_deep_link.dart`'s doc comment:
  `app_links`'s `uriLinkStream` reports a no-plugin-registered failure via
  `FlutterError.reportError`, which broke every existing test constructing
  `HomeLobbyScreen`). None of the online screens have been visually
  compared against the Ludo Vortex bar or Ludo King references, and none
  have been walked on a physical device, because there is no way to reach
  a matched/connected state without a real Firebase project and API
  deployment (task 29, still pending). Read task 24, 25, and 26's task
  files in full (Context/Decisions and Implementation Notes) before
  starting, and read `git show 4636b11`, `git show 552ea42`, `git show
  983a8d6` for the actual gateway/match-source/lobby-UI diffs those tasks
  landed — this task extends that code, it does not redo it.
- **(a) Debug-only online preview mode.** Precedent: task 12a's "Debug: All
  Bots Demo" entry on the mode-setup sheet, which is compiled out of
  release builds. Follow the same shape: a fake gateway
  (`LudoGateway`/`LudoOnlineClient` implementation, per
  `lib/src/net/ludo_gateway.dart`/`ludo_online_client.dart`'s existing
  interfaces — do not add a second, parallel interface) and a fake
  `LudoMatchStateSource` (per `lib/src/net/ludo_match_state_source.dart`'s
  interface from task 25) that deterministically script, on real `Timer`s
  (not manual/fake-clock ticks — this mode exists specifically to be
  walked live on a device), the following sequences:
  - Create room → code shown with copy/share affordance → simulated friend
    joins after N seconds → match starts.
  - Join by code: valid code reaches the board; invalid code and expired
    code each surface their documented error states.
  - Matchmaking search → either "found" (simulated human opponents) or
    bot-fill after a timeout, matching task 20's real bot-fill semantics.
  - An in-progress online match: opponent turns arriving over time, a
    simulated disconnect transitioning to "reconnecting", then resumed;
    the server turn timer ring counting down and auto-moving on expiry
    (task 19's semantics, task 09's timer-ring rendering).
  - A bot-filled seat's badge showing in the player list.
  Entry point: add a debug toggle (e.g. in `settings_screen.dart`, gated
  the same way task 12a's all-bots demo is gated to debug builds) **and** a
  long-press on the lobby's logo (`home_lobby_screen.dart`) that arms this
  mode for the current session — document both entry points in this task's
  Implementation Notes and in a short doc comment on the preview
  gateway/source files, the same way `ludo_deep_link.dart` documents its
  own constraints. This mode must be unreachable (no compiled entry point,
  not merely hidden behind a flag) in a release build — verify by grepping
  the release build output/checking the same debug gate task 12a's demo
  uses.
- **(b) Visual polish.** Compare every online screen/state above against
  the Ludo Vortex bar and Ludo King references:
  `.agents/resources/2026-09-24/ludo-visual-reference/README.md` and
  `.agents/resources/2026-09-19/ludo-reference/` (91 device screenshots +
  `study.md` — check whether it captured a room/code/matchmaking screen
  before assuming it did). Use the existing design-system chrome
  (`LudoPanel`, `Ludo3dButton`, `RibbonBanner`, the bundled display font —
  from task 12b's theme tokens) for every online surface; no
  `Material`-default `AlertDialog`/`TextField`/progress-indicator styling
  anywhere in the online flow. Specific polish targets: a rotating-avatar
  or dice "searching" animation for matchmaking (not a bare spinner); a
  clearly legible room code with copy and native-share affordances; player
  slots that visually fill in as seats are taken; a "bot joined" badge
  matching the stacked-token/HUD badge visual language already established
  elsewhere in this app.
- **(c) Warm-start deep links.** Route `w3dev-ludo://room/<code>` while the
  app is already running, without reintroducing the test flakiness task 26
  hit. Inject the live-link stream behind an interface (extend
  `ludo_deep_link.dart`'s existing `LudoDeepLinkGateway` abstraction — it
  already narrows `app_links`'s `initialLink`; add the `onLink` stream to
  that same interface) with a no-op/empty-stream default implementation
  used by every existing test construction path, and subscribe to the real
  stream lazily only from `main.dart` (mirroring how
  `ensureLudoFirebaseInitialized()` is called `unawaited` and never gates
  `runApp`), never from `HomeLobbyScreen`'s own constructor/build path.
  Confirm the entire existing suite (`bun run games:test -- --app ludo`)
  still passes unmodified before adding new tests, then add unit tests for
  the stream-routing logic and a widget test constructing
  `HomeLobbyScreen` with a fake non-empty link stream asserting it
  navigates into the join-by-code flow with the code pre-filled.
- **(d) Goldens and device evidence.** Add goldens for each online
  screen/state listed in (a)/(b). On the physical device (serial
  `RZ8R32EAB7T`): build, install, arm the debug preview mode via one of its
  two entry points, and walk every online state end to end, saving
  screenshots to
  `.agents/resources/2026-09-28/ludo-visual-qa/26x/` with a `README.md`
  indexing each capture. View every screenshot with the Read tool and
  judge it against the reference material named above; record pass/fail
  per screen/state and fix-and-recapture anything that misses the bar
  before considering this task done. Separately, verify the OS-level
  invite link still cold-launches into join (task 26's existing behavior)
  and that an `adb`-triggered link routes into the join flow **while the
  app is already running** (this task's new warm-start behavior) — capture
  both as part of the same evidence set.
- **(e) Knowledge-base updates.** Update
  `.agents/games/ludo-vortex/product.md`'s "Online (planned)" section and
  its Modes/Screens tables to note the online screens are now built and
  visually polished, plus the debug-only preview mode and its two entry
  points (so a future device-QA pass knows how to reach these screens
  without live Firebase). Update
  `.agents/games/ludo-vortex/assets-index.md`'s device-evidence table with
  this task's `.agents/resources/2026-09-28/ludo-visual-qa/26x/` path,
  matching the existing row format (see the 12f/12h rows already there).
- This task does not touch server-side matchmaking/room/timeout logic
  (tasks 18-22), real Firebase/API provisioning (task 29), or the economy
  work (26a onward) — it is a client-side preview-mode, polish, and
  deep-link pass over what tasks 24-26 already built.

## Implementation Checklist

- [x] Read tasks 24, 25, 26's task files (Context/Decisions and
  Implementation Notes) and `git show 4636b11`/`552ea42`/`983a8d6` in full
  before writing code.
- [x] Add a debug-only fake `LudoGateway`/`LudoOnlineClient` implementation
  and a fake `LudoMatchStateSource` that deterministically script, on real
  timers, every online state listed in (a).
- [x] Wire a debug toggle (settings screen, gated to debug builds like task
  12a's demo) and a long-press on the lobby logo as the two entry points
  into preview mode; document both.
- [x] Verify the preview mode has no compiled entry point in a release
  build. (Confirmed both by grepping the release build's `libapp.so` for
  the debug-only strings — absent — and by the same `kDebugMode` gate
  pattern task 12a's demo already uses.)
- [x] Restyle every online screen/state (room create/join/share,
  matchmaking search, connecting, waiting-for-players, opponent's-turn
  timer, reconnecting, disconnected/offline, match found, bot-filled seat)
  to use `LudoPanel`/`Ludo3dButton`/`RibbonBanner`/bundled fonts — no
  Material-default styling. (Also added a themed `LudoSearchingIndicator`
  replacing the Material `CircularProgressIndicator`, and a room-code chip
  with copy/share affordances on the room-fill wait screen.)
- [x] Extend `ludo_deep_link.dart`'s `LudoDeepLinkGateway` interface with
  the live `onLink` stream, add a no-op default, and subscribe lazily only
  from `main.dart`.
- [x] Confirm the full existing test suite passes unmodified before adding
  new deep-link tests.
- [x] Add unit tests for warm-start link routing logic and a widget test
  driving `HomeLobbyScreen` with a fake non-empty link stream into the
  join-by-code flow with the code pre-filled.
- [x] Add goldens for every online screen/state listed above; diff old vs.
  new before committing.
- [x] Build, install, and walk every online preview state on serial
  `RZ8R32EAB7T`; save screenshots + README to
  `.agents/resources/2026-09-28/ludo-visual-qa/26x/`.
- [x] View and judge every device screenshot against
  `.agents/resources/2026-09-24/ludo-visual-reference/` and
  `.agents/resources/2026-09-19/ludo-reference/`; fix and recapture any
  screen that misses the bar. (The room-code visibility gap found during
  the first walk was fixed — room-code chip with copy/share buttons added
  — and recaptured.)
- [x] Verify an `adb`-triggered invite link routes into join while the app
  is already running; capture evidence.
- [x] Update `.agents/games/ludo-vortex/product.md`'s Online
  section/Modes/Screens tables.
- [x] Update `.agents/games/ludo-vortex/assets-index.md`'s device-evidence
  table with this task's evidence path.

## Files Touched

- `apps-native/games/ludo/lib/src/net/ludo_deep_link.dart` (extended:
  `onLink` stream added to `LudoDeepLinkGateway`, no-op default)
- `apps-native/games/ludo/lib/src/net/ludo_gateway.dart` /
  `ludo_online_client.dart` (or a new `lib/src/net/ludo_preview_*.dart`
  fake implementation, per investigation)
- `apps-native/games/ludo/lib/src/net/ludo_match_state_source.dart`
  (extended, or a new fake implementation file)
- `apps-native/games/ludo/lib/src/screens/home_lobby_screen.dart` (wired:
  long-press entry point, warm-start link subscription moved to
  `main.dart`)
- `apps-native/games/ludo/lib/src/screens/settings_screen.dart` (debug
  toggle entry point)
- `apps-native/games/ludo/lib/src/screens/matchmaking_search_screen.dart`
  (restyled)
- `apps-native/games/ludo/lib/src/screens/mode_setup_sheet.dart`
  (restyled: room create/join/share)
- `apps-native/games/ludo/lib/main.dart` (lazy warm-start link
  subscription)
- `apps-native/games/ludo/test/**` (new preview-mode, deep-link, and
  golden tests)
- `.agents/resources/2026-09-28/ludo-visual-qa/26x/` (new device evidence
  + README)
- `.agents/games/ludo-vortex/product.md`
- `.agents/games/ludo-vortex/assets-index.md`

## Acceptance Criteria

- A debug-only preview mode, reachable via a settings toggle and a
  long-press on the lobby logo, deterministically walks a user through
  every online screen/state (room create/join/share, matchmaking search,
  connecting, waiting for players, opponent's-turn timer, reconnecting,
  disconnected/offline, match found, bot-filled seat) with no real
  Firebase/API dependency, and is absent from release builds.
- Every online screen/state uses the design-system chrome (no
  Material-default styling), covered by a golden.
- Warm-start deep links route an invite into the join flow while the app
  is running, implemented behind an interface with a no-op test default,
  subscribed to lazily only from `main.dart`; the full pre-existing test
  suite still passes unmodified, and new unit/widget tests cover the
  routing logic.
- On device (serial `RZ8R32EAB7T`): every online state above is walked and
  screenshotted under
  `.agents/resources/2026-09-28/ludo-visual-qa/26x/`, each judged
  (Read tool, pass/fail recorded) against the Ludo Vortex bar and Ludo King
  references, with any miss fixed and recaptured before this task is
  marked complete.
- An `adb`-triggered invite link is verified to route into the join flow
  while the app is already running (not just cold-launch), with evidence
  captured alongside the other device screenshots.
- `.agents/games/ludo-vortex/product.md` and `assets-index.md` reflect the
  built online screens, the preview mode and its two entry points, and
  this task's evidence path.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- `bun run typecheck` (repo root)
- Device verification (physical device, serial `RZ8R32EAB7T`):
  1. `bun run games:build -- --app ludo --platform android --mode debug --environment debug`
  2. `adb -s RZ8R32EAB7T install -r apps-native/games/ludo/build/app/outputs/flutter-apk/app-debug.apk`
  3. `adb -s RZ8R32EAB7T logcat -c`
  4. `adb -s RZ8R32EAB7T shell monkey -p app.w3dev.ludo.debug -c android.intent.category.LAUNCHER 1`
  5. Arm preview mode (settings toggle or long-press the lobby logo) and
     walk each online state, capturing
     `adb -s RZ8R32EAB7T exec-out screencap -p > .agents/resources/2026-09-28/ludo-visual-qa/26x/<state>.png`
     for each one.
  6. With the app running and in the foreground, trigger the warm-start
     deep link:
     `adb -s RZ8R32EAB7T shell am start -a android.intent.action.VIEW -d "w3dev-ludo://room/<code>"`
     and capture the resulting join-flow screen with a pre-filled code.
  7. Force-stop the app and repeat step 6 to confirm the existing
     cold-launch path still works, capturing that result too.
  8. Compare captures against `.agents/resources/2026-09-24/
     ludo-visual-reference/` and `.agents/resources/2026-09-19/
     ludo-reference/`, recording pass/fail per screen/state in the
     commit/PR notes.
  - If the device is not attached, report NOT RUN for all device steps
    (do not skip the step — mark it NOT RUN explicitly).

## Out of Scope

- Server-side matchmaking, room, timeout, or fanout logic (tasks 18-22) —
  this task only adds a client-side fake for preview purposes.
- Real Firebase project provisioning and live two-device verification
  (task 29) — preview mode exists precisely because that is not yet done.
- Economy/wallet/store work (tasks 26a onward).
- Any change to local (vs Computer / Pass N Play) screens or telemetry.
- Push notifications for turn alerts (not in v1 scope, per task 26).

## Implementation Note (fix-up pass, filled in during execution)

- An independent verifier caught that the first pass's own evidence
  `README.md` admitted the opponent's-turn timer ring and the
  reconnecting/disconnected state were "not separately captured on-device
  ... given time budget" — a direct miss against this task's own
  Acceptance Criteria ("every online state above is walked and
  screenshotted ... with any miss fixed and recaptured before this task is
  marked complete").
- Walking those two states surfaced a real, previously-undetected bug, not
  just a missing screenshot: `PreviewLudoTransport._getMatchView` (the
  fake `GET .../matches/:id/state` handler) returned its view fields at
  the JSON body's top level instead of nested under a `match_view` key,
  which `LudoGateway.getMatchView` requires. Every preview `/state` poll
  was therefore throwing `LudoProtocolException: Missing field in match
  view response` — silently, since `PollingMatchStateSource._tick`
  swallows fetch failures by design — so a preview online match's board
  never actually received a single live state update after its initial
  snapshot in *any* prior pass (no opponent-turn hand-off, no
  server-driven timer deadline ever reached the screen through this
  route). Fixed by wrapping the response under `match_view`.
- Added `LudoMatchStateSource.connected` (a `Stream<bool>`, implemented in
  both `PollingMatchStateSource` and `FirestoreMatchStateSource`) so
  `game_board_screen.dart` can show a new themed
  `LudoReconnectingBanner` (`lib/src/widgets/ludo_reconnecting_banner.dart`,
  reusing `LudoSearchingIndicator` at small scale — no Material banner)
  while disconnected. The preview transport scripts one deliberate,
  two-poll disconnect blip per match on a real `Timer`-driven poll cycle
  (`_PreviewMatch.disconnectSimulated`/`disconnectFailuresRemaining`) so
  this state is reliably reachable for a device walk.
- New/updated tests: `test/net/ludo_match_state_source_test.dart`
  (`connected` transitions on `PollingMatchStateSource`),
  `test/net/ludo_preview_online_test.dart` (a regression test driving the
  real `createLudoMatchStateSource` factory against the preview transport
  — this is what would have caught the `match_view` bug originally),
  `test/screens/game_board_screen_test.dart` (banner show/hide), and a new
  golden `test/goldens/reconnecting_banner.png`.
- Both new states (`16-opponent-turn-timer.png`,
  `17-reconnecting-banner.png`, `18-reconnected-cleared.png`) were walked
  and judged on serial `RZ8R32EAB7T` and added to
  `.agents/resources/2026-09-28/ludo-visual-qa/26x/README.md`; the
  previously-passing warm-start/cold-start deep-link states were
  re-verified on the rebuilt app and remain PASS, unaffected by this fix.

## Commit message

`feat(ludo): online preview mode, online screen polish, and warm invite links [15-ludo-launch/26x]`
