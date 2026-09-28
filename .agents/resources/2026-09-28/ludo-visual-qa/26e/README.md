# Task 26e device evidence — wallet/level HUD, XP, level-up celebration

Consolidated evidence for
`tasks/epics/15-ludo-launch/26e-client-wallet-hud-progression.md`, merged
from three earlier sessions
(`.agents/resources/2026-09-25/ludo-vortex-economy/device-evidence/`,
`.agents/resources/2026-09-25/ludo-visual-qa/26e/device-evidence/`, and
this folder's own prior contents) into one place per this session's
instructions. Those source folders have been deleted; everything they
contained is here, renumbered in capture order across all sessions.

Captured on the physical device (`adb` serial `RZ8R32EAB7T`), via
`bun run games:build -- --app ludo --platform android --mode debug --environment debug`
+ `adb install` + `adb shell am start` + `adb screencap`, against a debug
build with no real Firebase/backend credentials configured (none exist in
this environment).

## What real credentials would change

No `google-services.json`/API base URL is configured, so
`createLudoOnlineClient` resolves `null` in production and the wallet HUD
stays hidden (correct "coming soon"-style degradation, matching every other
online affordance). To still exercise the wallet/XP/level-up flow on a real
device, these sessions armed task 26x's existing **debug-only online
preview mode** (long-press the lobby logo) — the same mechanism already
used to device-test the online room/matchmaking flow with no live backend.
`PreviewLudoTransport` (`ludo_preview_online.dart`) fakes the
`wallet`/`profile`/`xp/claim`/`starter-grant` routes so the preview client
exercises the *real* `LudoGateway`/`LudoWalletState`/`LudoOfflineXpQueue`
code paths end-to-end, never a hand-built fixture screenshot.

## This session: the verifier-reported gap, fixed

The independent verifier failed this task because `settings_screen.dart`'s
`wallet` parameter and its "Wallet & Level" panel were never supplied by
any real call site — `pause_quit_dialog.dart` constructed `SettingsScreen`
without `wallet:`, so the profile/settings HUD chips were unreachable in
the running app (only a direct, test-only `SettingsScreen(wallet: ...)`
construction ever showed it).

Fixed by threading a `wallet` parameter through
`showPauseQuitDialog`/`PauseQuitDialog` (`pause_quit_dialog.dart`) into the
`SettingsScreen` it pushes, and by passing `widget.walletState` from
`GameBoardScreen._openPauseDialog` — the only real place `PauseQuitDialog`
is constructed in the running app
(`game_board_screen.dart:_openPauseDialog`). Two new widget tests close
the gap for good: `test/screens/settings_screen_test.dart` now asserts the
wallet panel is reachable via `showPauseQuitDialog` → tap "Settings", not
just via a direct `SettingsScreen(wallet: ...)` construction.

- `24-settings-wallet-panel-via-pause-dialog-FIXED.png` — **the new
  evidence for this fix**: captured live on-device by arming preview mode,
  starting a match, opening the pause dialog, and tapping "Settings" —
  the exact real navigation path a player uses. The "Wallet & Level" panel
  (coin/diamond chips + level badge) now renders inside Settings, reached
  the same way a real player would reach it, not just in a widget test.
- `23-lobby-wallet-hud-fresh.png` — the lobby HUD chips, re-captured fresh
  this session for completeness alongside the fix above.

## Screenshots (all sessions, in capture order)

1. `01-lobby-before-hud.png` — lobby before preview mode is armed: no HUD
   (wallet is `null`, matching the "hidden until an online client
   resolves" contract).
2. `02-hud-layout-bug-name-truncated.png` — **a real bug found on-device**:
   the first HUD layout (chips sharing the name's row) squeezed
   "Player1000" down to an unreadable "Playe…" ellipsis. Fixed by moving
   the chip row onto its own line in `_ProfileHeader`
   (`home_lobby_screen.dart`) before any other evidence was captured.
3. `03-hud-lobby-fixed.png` — the fixed HUD: full "Player1000" name, coin
   chip (640), diamond chip (12), and the level badge (level 1, partial
   XP-progress sliver) all legible with no overlap.
4. `04-mode-setup-sheet.png` — Play-vs-Computer setup sheet (Quick
   ruleset selected) used to start the match this evidence's gameplay
   screenshots come from.
5. `05-board-gameplay-in-progress.png` / `06-board-mid-match.png` — the
   board mid-match (via the setup sheet's "Debug: All Bots Demo"),
   confirming the wallet/gateway wiring threaded into `GameBoardScreen`
   doesn't break normal play.
6. `07-pause-dialog.png` — the pause dialog reachable mid-match.
7. `08-lobby-after-quit-wallet-unchanged.png` — back at the lobby after
   quitting an unfinished match: the wallet snapshot (640/12/level 1) is
   unchanged, confirming XP is only submitted on an actual match finish
   (`_maybeNavigateToResults`), never on quit.
8. `09-wallet-hud-golden-normal.png` / `10-wallet-hud-golden-reduced-motion.png`
   — the two golden tests for the HUD chips
   (`test/goldens/wallet_hud_golden_test.dart`), included here because they
   render the same widget this device evidence shows, seeded/reproducible.
9. `11-level-up-celebration-golden-reduced-motion.png` — the level-up
   celebration's static reduced-motion frame
   (`test/goldens/ludo_level_up_celebration_golden_test.dart`).
10. `12-lobby-fresh-launch.png` — lobby before preview mode is armed
    (follow-up session).
11. `13-after-longpress-logo.png` — preview mode armed; wallet HUD chips
    appear (640 coins / 12 diamonds / level 1, ~80% to level 2).
12. `14`–`16` — starting a Quick, 2-player "Debug: All Bots Demo" match.
13. **`17-level-up-celebration-live-match.png`** — the level-up
    celebration scenario, captured live after a real match reached a
    natural terminal state. Shows **`LEVEL UP! / Level 2 / +50 coins`**
    with confetti — a real, non-zero, server-computed reward, derived by
    `game_board_screen.dart`'s `_submitMatchXp` from a `GET wallet`
    balance diff taken before vs. after the claim (the `xp/claim` route
    itself never returns coin/diamond amounts — extending it was out of
    scope for this client-only task).
14. `18-lobby-wallet-updated-after-levelup.png` — back at the lobby, level
    badge updated to "2".
15. `19-network-disabled-status-bar.png` through
    `22-offline-lobby-after-match-claim-still-succeeded.png` — the
    offline-queue scenario, attempted live with the device's network
    genuinely and verifiably cut (`adb shell dumpsys connectivity`
    confirming "Active default network: none"). The claim still succeeded
    instantly, which proves — rather than assumes — that
    `PreviewLudoTransport` (a fully in-memory fake transport, since no
    real economy backend is deployed anywhere reachable from this device;
    that's task 26i) resolves every route in-process and never performs a
    real HTTP call, so cutting the device's real network has no effect on
    it. This is a structural property of the *only device-evidence path
    available in this environment*, not a bug in the offline-queue code.
    The offline-queue logic itself (persist, coalesce, retry-and-clear
    only on a genuinely failing-then-succeeding gateway call) is verified
    by `test/state/ludo_offline_xp_queue_test.dart`, per this task's own
    Acceptance Criteria wording ("verified by a test with a mocked gateway
    that fails once then succeeds").
16. `23-lobby-wallet-hud-fresh.png`, `24-settings-wallet-panel-via-pause-dialog-FIXED.png`
    — this session's evidence, see above.

## Net effect on the checklist

- HUD chips on lobby: done, on-device (screenshots 03/13/23).
- HUD chips on the profile/settings surface, reached via the *real*
  pause-dialog → Settings navigation (not just a direct widget
  construction): **done this session** — this was the verifier's
  reported gap; see screenshot 24 and the new
  `test/screens/settings_screen_test.dart` coverage.
- Level-up celebration on-device, with a real non-zero reward: done
  (screenshot 17).
- Offline-queue-retry on-device: not achievable live in this environment
  for a proven structural reason (in-memory preview transport); verified
  by test instead, per the task's own Acceptance Criteria wording.
