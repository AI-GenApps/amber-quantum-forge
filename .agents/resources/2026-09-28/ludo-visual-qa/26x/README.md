# Task 26x device evidence — online preview mode, polish, warm-start deep links

Device: physical Samsung A52, serial `RZ8R32EAB7T`, 1080x2400.
Build: `bun run games:build -- --app ludo --platform android --mode debug --environment debug`,
installed via `adb install -r`.

All captures below are from the DEBUG-only online preview mode
(`LudoOnlinePreviewMode`, armed via a long-press on the lobby logo), which
simulates the full online flow with no real Firebase/API backend (task 29
is still pending). Judged against `.agents/resources/2026-09-24/
ludo-visual-reference/` and `.agents/resources/2026-09-19/ludo-reference/`.

## Captures

| File | State | Verdict |
|---|---|---|
| `00-launch.png` | Fresh launch, online tiles disabled (preview not yet armed) | PASS — matches task 08/24 baseline; no Firebase config, tiles correctly greyed with "Not available yet" |
| `01-preview-armed-snackbar.png` | Long-press on lobby logo arms preview mode; tiles enable live | PASS — "Play with Friends"/"Online" tiles flip to enabled subtitles immediately; snackbar confirms arm (Material-default snackbar background is a minor, ephemeral, acceptable exception — not part of the persistent screen chrome) |
| `02-friends-sheet-create.png` | Play with Friends sheet, Create tab | PASS — matches golden `friends_setup_sheet_create.png`; gold/navy chrome, no Material defaults |
| `03-room-waiting.png` | (First pass) game board reached after create+auto-fill — captured after backing out of the OS native share sheet the old (pre-fix) flow auto-triggered | INFO — this run is what surfaced the "no visible room code" gap; see 05/06 for the fixed flow. The native contact-picker screenshot this pass produced was deleted immediately (real contact PII), never written to disk permanently. |
| `04-friends-sheet.png` | (Second pass, fresh install with the room-code-chip fix) Create tab | PASS |
| `05-room-code-waiting.png` | Room created, "Waiting for a friend..." with the new legible room-code chip + copy/share icon buttons | PASS — closes the "clearly legible room code with copy and native-share affordances" polish target; icons render crisply on-device (test-environment goldens show tofu boxes only because the Material icon font isn't loaded by `flutter_test_config.dart`, a test-only artifact, not a device issue) |
| `06-room-filled-board.png` | Simulated friend joins after ~6s, match auto-starts, board loads with 4 seats | PASS |
| `07-matchmaking-searching.png` | Online tile → setup sheet, ruleset/player picker | PASS |
| `08-matchmaking-finding.png` | "Finding players..." with the new `LudoSearchingIndicator` (tumbling die in a gold ring) replacing the old Material `CircularProgressIndicator` | PASS — matches golden `matchmaking_search_screen.png` |
| `09-matchmaking-resolved.png` | Matchmaking resolves to a human-opponent-styled match (`ludoPreviewBotFill` was `false` this cycle) | PASS |
| `10-matchmaking-bot-fill.png` | Second matchmaking search (mode alternates `ludoPreviewBotFill`), resolves bot-filled — seat labeled "Bot 4" | PASS — reuses the app's existing bot-naming convention (task 08's `ludoSubjectIsBot`), consistent visual language rather than a new ad hoc badge |
| `11-join-tab.png` | Join Room tab, empty code field | PASS — matches golden `friends_setup_sheet_join_prefilled.png` shape (code pre-fill tested separately in goldens/widget tests) |
| `12-join-invalid-error.png` | Join with `BADCODE1` (scripted not-found code) | PASS — themed `LudoDialogFrame` "Join failed" dialog, not a raw exception or default `AlertDialog` |
| `13-join-expired-error.png` | Join with `EXPIRED1` (scripted expired code) | PASS — distinct, correct copy ("This invite has expired...") |
| `14-warmstart-deeplink.png` | `adb shell am start -a android.intent.action.VIEW -d "w3dev-ludo://room/WARM123"` while app is foregrounded and mid-dialog | PASS — logcat confirmed "delivered to currently running top-most instance"; a fresh `FriendsSetupSheet` opens on the Join tab with `WARM123` pre-filled, layered correctly over the prior dialog |
| `15-coldstart-deeplink.png` | App force-stopped, then the same `am start` VIEW intent cold-launches it | PASS — boots straight to the lobby with tiles disabled (preview mode is session-scoped, not persisted, so a fresh process has no online client yet) and the invite is silently dropped with no crash — matches `home_lobby_deep_link_test.dart`'s "silently dropped when no online client has resolved yet" case exactly |
| `16-opponent-turn-timer.png` | Live in-match state: turn hand-off from a live `/state` poll (not just the initial snapshot) — the active seat's corner card shows the gold countdown ring around its avatar | PASS — confirms the server-driven timer ring (task 09/12d's existing widget, reused unmodified) actually receives live deadlines in preview mode, not just the initial snapshot |
| `17-reconnecting-banner.png` | The scripted one-time disconnect blip mid-match: `LudoReconnectingBanner` (new, task 26x) showing over the board | PASS — gold/navy pill, bundled display font, reuses the themed `LudoSearchingIndicator` at small scale — no Material `Banner`/`SnackBar` |
| `18-reconnected-cleared.png` | A few seconds later: the banner has cleared and the turn has advanced again | PASS — confirms the reconnect is genuinely transient (never a permanent "stuck reconnecting" state) and normal turn polling resumes |

## Follow-up pass (this fix-up): closing the device-walk gap

The first pass above shipped without walking the opponent's-turn timer ring
or the reconnecting/disconnected state on-device, and its README admitted
this "given time budget" — a real gap against the Acceptance Criteria's
"every online state above is walked and screenshotted". Walking them
surfaced a genuine, previously-undetected bug (not just a missing
screenshot):

- **Root cause found and fixed**: `PreviewLudoTransport._getMatchView` (the
  fake `GET .../matches/:id/state` handler) returned its view fields at the
  JSON response body's top level, but `LudoGateway.getMatchView` requires
  them nested under a `match_view` key (matching the real route's
  envelope). Every single preview `/state` poll was therefore throwing
  `LudoProtocolException: Missing field in match view response` —
  silently, since `PollingMatchStateSource._tick` swallows fetch failures
  by design — meaning a preview online match's board never actually
  received one single live state update after its initial snapshot: no
  opponent-turn hand-off, no server-driven timer deadline, ever reached the
  screen through this path in any prior device walkthrough or test. Fixed
  by wrapping the response under `match_view` in
  `lib/src/net/ludo_preview_online.dart`.
- **New coverage added**: `LudoMatchStateSource.connected` (a new
  `Stream<bool>` on the existing interface, implemented in both
  `PollingMatchStateSource` and `FirestoreMatchStateSource`) surfaces a
  fetch failure/recovery to `game_board_screen.dart`, which shows the new
  `LudoReconnectingBanner` while disconnected. The preview transport now
  scripts one deliberate two-poll disconnect blip per match
  (`_PreviewMatch.disconnectSimulated`/`disconnectFailuresRemaining`) on a
  real `Timer`-driven poll cycle, so this state is reliably reachable for
  a device walk. New tests:
  `test/net/ludo_match_state_source_test.dart` (`connected` transitions on
  `PollingMatchStateSource`), `test/net/ludo_preview_online_test.dart`
  (regression test driving the real `createLudoMatchStateSource` factory
  against the preview transport — this is what would have caught the
  `match_view` bug originally), and
  `test/screens/game_board_screen_test.dart` (banner show/hide), plus a
  new golden `test/goldens/reconnecting_banner.png`.
- **Device timing note**: the scripted blip fires at the 5th `/state` poll
  (~12–18s into a match at the real 3s production poll interval) and
  clears two polls later; on this physical device it took several
  screenshot passes at 1s intervals to land inside that window (real HTTP
  round-trip + JSON/engine-conversion overhead per poll made on-device
  timing looser than the equivalent desktop `flutter test` run, which
  resolves the same blip in a tight, repeatable window — see
  `test/net/ludo_preview_online_test.dart`).

## PII note

One capture during this walkthrough accidentally showed the OS native
share sheet with real contact names/photos (the old flow auto-fired
`Share.share` immediately on room create). That screenshot was deleted
before being committed anywhere, and the flow itself was changed (see
task commit) to show an in-app room-code chip with copy/share buttons
instead of auto-firing the native share sheet — the person now decides
whether/when to share.
