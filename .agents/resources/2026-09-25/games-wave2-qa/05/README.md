# Task 05 evidence — Merge Relay solo v1 scope gate

No new screenshots, goldens, or generated art: this task is a code-scope
change (Out of Scope explicitly excludes visual changes), so there is
nothing to render. This README records the verification results and the one
open decision the task asked to have recorded here.

## What changed

A single compile-time feature gate,
`apps-native/games/merge_relay/lib/src/merge_relay_features.dart`:

```dart
const mergeRelaySocialEnabled = bool.fromEnvironment('MERGE_RELAY_SOCIAL');

final class MergeRelayFeatures {
  const MergeRelayFeatures({this.socialEnabled = mergeRelaySocialEnabled});
  final bool socialEnabled;
}
```

(`bool.fromEnvironment`'s own `defaultValue` parameter already defaults to
`false`, so it is left implicit — this also keeps the declaration on one
line for the acceptance-criteria grep.)

`MergeRelayFeatures` is threaded through `MergeRelayApp` → `MergeRelayGame`
and checked at every relay/PGS entry point found by grepping the app for
every relay, share, PGS, challenge-link, and gateway-construction path:

- `lib/src/merge_relay_client.dart` — `createMergeRelayClient` returns
  `null` before parsing config or building anything when the gate is off.
  Its HTTP gateway construction is now behind an injectable
  `MergeRelayGatewayFactory` seam so a test can prove the factory is never
  called.
- `lib/main.dart` — builds one `MergeRelayFeatures()` and passes it to both
  `createMergeRelayClient` and `MergeRelayApp`.
- `lib/src/merge_relay_app.dart` — only wires up the challenge-link
  listener/method channel when `relayController != null &&
  features.socialEnabled`; lifecycle-driven relay retry/pause-replay calls
  are gated the same way.
- `lib/src/merge_relay_game.dart` — only auto-builds the
  `MergeRelayPgsAccountController` "PGS bridge" when a relay controller
  exists **and** the gate is on.
- `lib/src/merge_relay_game_actions.dart` (`openRelay`) and
  `lib/src/merge_relay_game_relay_actions.dart`
  (`createRelayFromCurrentBoard`) — both check `features.socialEnabled`
  before touching `relayController`, not just null-ness, so an
  injected-but-unused controller can never be reached through these paths.
- `lib/src/merge_relay_platform_actions.dart` — `initializePlayGames`,
  `refreshPgsAccount`, `linkPlayGames`, `canShowPlayGamesActions`, and the
  achievements/leaderboards actions all no-op while the gate is off, so no
  native Play Games Services channel call fires at all in v1.
- UI: `lib/src/merge_relay_home.dart` ("Join a relay"),
  `lib/src/merge_relay_pause_panel.dart` and
  `lib/src/merge_relay_result_screen.dart` ("Share this board"), and
  `lib/src/merge_relay_overlays.dart` (the Play Games settings section) all
  additionally require `game.features.socialEnabled`, not just a non-null
  controller — this is what makes the positive control in
  `solo_v1_scope_test.dart` meaningful (see below).

Settings (`showMergeRelaySettings`) now only ever exposes the local
controls when gated: board controls, reduce motion, sound, haptics, theme
picker, and "Replay handoff guide" — no relay/PGS controls can appear.

## Test evidence

`test/solo_v1_scope_test.dart` (new, 6 tests) constructs a **real**
`MergeRelayRelayController` (backed by the existing `FakeRelayGateway` test
double) and a **real** `MergeRelayPgsAccountController` and passes both into
`MergeRelayApp` in every scenario — so an absent widget is caused by the
feature flag, not by a missing collaborator:

1. `the gate defaults to off` — sanity-checks the constant and the default
   `MergeRelayFeatures()`.
2. `createMergeRelayClient (gated off)` (2 tests) — passes a spy
   `gatewayFactory`; asserts `createMergeRelayClient` returns `null` and the
   factory is called zero times, both with the default gate and with an
   explicit `socialEnabled: false`.
3. `an incoming challenge link opens Home instead of the relay while gated`
   — pumps `MergeRelayApp` with a real relay controller and a stub
   `MergeRelayChallengeLinkSource` that has a pending cold-start link;
   asserts the link source's `initialize()` is never called, the relay
   controller's phase never leaves `idle`, and the app renders Home
   ("Rescue paths" visible, "Join a relay" absent) both before and after a
   live link is emitted.
4. `Home, Pause, Result, and Settings hide every relay/PGS control` — walks
   Home → tutorial skip → Pause → Resume → three legal board swipes →
   Result → Home → Settings, and asserts `find.text('Join a relay')`,
   `find.text('Share this board')` (twice), and `find.text('Play Games')`
   all find nothing, with the gate at its default (off).
5. `positive control: forcing the gate on surfaces the same relay/PGS
   controls` — the **exact same walk and exact same finders** as (4), on an
   identical harness, with only `features: const
   MergeRelayFeatures(socialEnabled: true)` changed. All four finders now
   find their widget. This proves (4)'s absence assertions aren't
   trivially true (they're not testing against `null` objects).

The existing relay/PGS tests that pump `MergeRelayApp`/`MergeRelayGame`
with a real relay controller or Play Games probe were adapted to force the
gate on through the `features` seam, keeping every existing assertion:
`test/merge_relay_app_reliability_test.dart` (3 of its 4 `MergeRelayApp(...)`
calls — the 4th is a content-error case unrelated to relay/PGS),
`test/merge_relay_pgs_ui_test.dart`, and the
`'Play Games initialization stays guest-first without a relay client'` case
in `test/merge_relay_client_resilience_test.dart` (native Play Games
init/sign-in is itself part of the gated PGS surface).

Total test count: **126** (120 baseline from task 02 + 6 new in
`solo_v1_scope_test.dart`; 0 deleted, 0 skipped). Verified with
`flutter test test/ --reporter json` piped through a script that tallies
`testDone` events by suite: 25 suites, 126 passed, 0 failed, 0 errors.

```
grep -rn "fromEnvironment('MERGE_RELAY_SOCIAL'" lib
  → apps-native/games/merge_relay/lib/src/merge_relay_features.dart:13
    (exactly one match)
```

## Android deep-link intent-filter decision: KEPT

`apps-native/games/merge_relay/android/app/src/main/AndroidManifest.xml`
still declares both the `mergerelay://challenge` scheme intent filter and
the `https://<host>/games/merge-relay/challenges` App Links intent filter,
unchanged.

Reasoning:

- The task's default instruction is to keep them "so v1.1 needs no manifest
  migration," unless `games:validate:strict` or Play policy requires
  otherwise.
- `games:validate:strict` (`scripts/games/cli-commands.ts` → `validate()`)
  only runs `validateGameRegistry`, `validateGameConfigs`, and
  `validateContent`, plus (in strict mode) a check that every registered
  game has a scaffolded app and rules package. It does not read
  `AndroidManifest.xml` at all, so it neither requires nor forbids the
  intent filters. Confirmed by reading the script and by a passing
  `bun run games:validate:strict` run (see Verification below) with the
  filters left in place.
- Nothing in this task's scope touches Play Store policy review (that is
  task 24, release readiness, and task 25, the human device/provisioning
  checkpoint) — there is no policy signal available at this point in the
  epic that would argue for removal.
- The gate already makes the filters harmless in v1: `MergeRelayApp` only
  listens for challenge links (`MethodChannelMergeRelayChallengeLinkSource`)
  when `relayController != null && features.socialEnabled`; with the
  default gate, `main.dart` never constructs a relay controller, so no
  listener is ever registered. If Android launches the app from either
  intent filter, the link is simply never read — the user lands on the
  ordinary Home screen, with no error dialog and no dead code path
  exercised. This is exercised directly by
  `solo_v1_scope_test.dart`'s "an incoming challenge link opens Home
  instead of the relay while gated" test (using the Dart-level link source,
  since there is no device/emulator on this server to exercise the actual
  Android intent filters — that remains a device-only check, task 25).
- Keeping the filters avoids a manifest diff now that would just be
  reverted in v1.1 when relays return, and avoids a churny
  add/remove/re-add history for a file `apps-native/AGENTS.md`-style
  provenance tooling elsewhere in the repo may reference.

## Verification commands run

| Command | Result |
|---|---|
| `bun run games:format:check` | pass |
| `bun run games:analyze -- --app merge_relay` | pass, no issues |
| `bun run games:test -- --app merge_relay` (`flutter test`) | pass, 126/126 |
| `bun run games:validate:strict` | pass |
| `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug` | pass, built `app-debug.apk` |
| Device check | NOT RUN (no device on this server) |
