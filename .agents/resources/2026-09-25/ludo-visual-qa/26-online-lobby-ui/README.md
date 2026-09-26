# Task 26 device visual-QA notes

Device: `RZ8R32EAB7T` (Samsung A52, 1080x2400), debug build installed via
`adb install -r`.

## What is captured here

- `home-lobby-online-tiles-disabled-no-firebase-config.png`: the home
  lobby on-device, confirming that with no `google-services.json`
  present (this repo has no real Firebase project provisioned — that is
  task 29's job) the Play-with-Friends/Online tiles render their
  "Coming soon"/disabled state exactly as task 08/24 established, the app
  boots with no crash, and Computer/Pass N Play (plus a resumable-match
  card from earlier local play) render correctly — i.e. the app stays
  fully usable offline per this run's orchestrator note.

## What is intentionally NOT captured here

The enabled Play-with-Friends/Online tiles, the room create/join sheets,
the matchmaking-search screen, and a live two-device match cannot be
shown on this physical device in this task: `createLudoOnlineClient`
(`lib/src/net/ludo_online_client.dart`) requires
`ensureLudoFirebaseInitialized()` to succeed, which needs a real
`google-services.json` from a provisioned Firebase project — explicitly
out of this task's scope ("Real Firebase project provisioning and live
two-device verification (task 29)"). Faking a Firebase config file to
force the tiles open on-device would violate the "no real secrets in the
repo, use fakes/in-memory adapters when credentials are absent" rule
without actually proving anything more than what the automated tests
already prove.

Every online flow this task adds (room create/join, room-fill waiting,
matchmaking search + cancel, bot-fill detection, telemetry, the deep-link
parser) is instead verified by `flutter test` against a fake HTTP
transport and fake Firebase/Google Sign-In gateways — see
`apps-native/games/ludo/test/net/ludo_online_controller_test.dart` and
`apps-native/games/ludo/test/screens/online_flow_test.dart`, all passing.
