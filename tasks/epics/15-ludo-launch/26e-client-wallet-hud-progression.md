---
epic: 15-ludo-launch
task: 26e-client-wallet-hud-progression
status: completed
commit_scope: ludo
depends_on: [15-ludo-launch/26d-revenuecat-iap-backend]
estimate: L
---

# Client wallet/level state, HUD chips, XP gain, and level-up celebration

## Goal

Consume task 26b's wallet/profile/progression routes from the Flutter
client via task 24's gateway, show coin/diamond/level HUD chips on lobby
and profile, animate XP gain and level-up, and queue offline-earned XP for
sync when the client comes online.

## Context/Decisions

- Extend `lib/src/net/ludo_gateway.dart` (task 24) with typed methods for
  `GET wallet`, `GET profile`, `GET inventory`, `POST xp/claim`,
  `POST starter-grant`, `POST daily-reward/claim`, mirroring task 26b's
  routes field-for-field, with DTOs matching the server wire shape exactly
  (per task 24's established discipline — decode a fixture captured from
  the real route response, don't hand-roll parallel JSON parsing).
- Add `lib/src/state/ludo_wallet_state.dart`: holds cached
  `coins`/`diamonds`/`level`/`xp`/`xpRequiredForNextLevel`, refreshed from
  the gateway on app foreground/lobby entry, read-only when offline (no
  network → last-synced cached snapshot, per research.md section 4's
  "what must work offline" guidance already reflected in task 24's
  guarded-Firebase pattern).
- HUD chips: coin count, diamond count, and a level badge, added to
  `home_lobby_screen.dart` (task 08) and a profile surface (extend
  `settings_screen.dart` from task 10/24, or add a lightweight profile
  screen if none exists yet — check first) — code-drawn per the design
  system tokens from task 12b, not raw Material defaults.
- XP gain + level-up celebration: after a match ends (any mode — vs
  Computer, Pass N Play, or online, per task 26a's "XP everywhere"
  decision), the client accumulates a local pending-XP delta from
  `ludo_rules`' match result and a plausibility payload (elapsed time,
  match count) exactly as task 26b's claim endpoint expects, submits it via
  `xp/claim` when online, and plays an XP-bar-fill animation; if the claim
  crosses a level boundary (server response says so), play a level-up
  celebration (confetti/burst — reuse patterns from task 05's win-confetti
  celebration rather than inventing new particle code) showing the coin/
  diamond/theme bonus granted. Respect reduced-motion settings (task 05's
  precedent) by showing a static equivalent instead.
- Offline XP queue: when a claim can't reach the server (no network), the
  pending XP delta is persisted locally (same local-persistence mechanism
  task 11 uses for match resume) and retried on next successful gateway
  call, coalescing multiple queued deltas into one claim rather than
  replaying them individually (avoids spamming the daily cap check with
  many tiny requests).

## Implementation Checklist

- [x] Extend `lib/src/net/ludo_gateway.dart` with the wallet/profile/
  inventory/xp-claim/starter-grant/daily-reward-claim methods and DTOs.
- [x] Create `lib/src/state/ludo_wallet_state.dart`: cached wallet/
  progression state, refresh-on-foreground, offline read-only fallback.
- [x] Add HUD chips (coins, diamonds, level badge) to
  `home_lobby_screen.dart` and the profile/settings surface.
- [x] Add the XP-gain + level-up celebration flow, wired to fire after
  every match end (vs Computer, Pass N Play, online), respecting reduced
  motion.
- [x] Add `lib/src/state/ludo_offline_xp_queue.dart`: persists pending XP
  deltas locally, coalesces and retries on reconnect.
- [x] Add golden tests for the HUD chips (normal and reduced-motion states)
  and the level-up celebration's static (reduced-motion) frame.
- [x] Add a widget test (`test/screens/game_board_screen_xp_test.dart`)
  that drives `GameBoardScreen` itself — a real `walletState`/`gateway`/
  `authController` wired to a fixture HTTP transport, never the network —
  to a finished, level-crossing match and asserts
  `LudoLevelUpCelebration` actually shows exactly once. Added in a
  verification-fix pass: the golden/unit tests above only covered the
  celebration widget in isolation and `LudoWalletState.
  applyXpClaimResult`'s state mutation, never `_submitMatchXp` (the code
  that decides whether to show it) itself.
- [x] Fixed in the same pass: `home_lobby_screen.dart`'s
  `_launchOnlineMatch` (used by both Play-with-Friends and random
  matchmaking) and `results_screen.dart`'s `_defaultRematch` were
  constructing `GameBoardScreen` without `walletState`/`gateway`/
  `authController`, so XP submission (and the level-up celebration) was a
  silent no-op for every online match and every rematch — only
  `startLudoLocalMatch` (vs Computer / Pass N Play's first match) forwarded
  them. Now threaded through both paths.
- [x] Capture device evidence (screenshots on the connected physical
  device, serial `RZ8R32EAB7T`) of: HUD chips on the lobby (done — see
  `.agents/resources/2026-09-28/ludo-visual-qa/26e/README.md`, including a
  real layout bug found and fixed), a level-up celebration triggered after
  a local match (captured live after a real match reached a terminal
  state, showing the real, non-zero `+50 coins` reward, derived by
  `game_board_screen.dart`'s `_submitMatchXp` from a `GET wallet` balance
  diff taken before vs. after the claim rather than a backend-only field —
  see screenshot 17), and the offline-queue behavior with network
  disabled then re-enabled (attempted live with the device's network
  genuinely and verifiably cut — `adb shell dumpsys connectivity`
  confirming "Active default network: none" — which proved, rather than
  assumed, that `PreviewLudoTransport`, the only device-evidence path
  available in this environment since no real economy backend is deployed
  anywhere reachable from this device (task 26i), is a fully in-memory
  fake transport that cannot exercise a genuine network failure; that
  behavior remains verified by `test/state/ludo_offline_xp_queue_test.dart`
  per this task's own Acceptance Criteria wording). All evidence from
  every session is consolidated into one folder,
  `.agents/resources/2026-09-28/ludo-visual-qa/26e/`, with a single
  README; the prior duplicate folders under `.agents/resources/2026-09-25/`
  have been deleted.
- [x] **Verification-fix pass (this session):** the independent verifier
  found that `settings_screen.dart`'s `wallet` parameter and its
  "Wallet & Level" panel were never supplied by any real call site —
  `pause_quit_dialog.dart` constructed `SettingsScreen` without `wallet:`,
  so the profile/settings HUD chips were unreachable in the running app
  (only a test-only direct `SettingsScreen(wallet: ...)` construction ever
  showed it). Fixed by threading a `wallet` parameter through
  `showPauseQuitDialog`/`PauseQuitDialog` (`pause_quit_dialog.dart`) into
  the `SettingsScreen` it pushes, and passing `widget.walletState` from
  `GameBoardScreen._openPauseDialog` — the only real place
  `PauseQuitDialog` is constructed. Two new widget tests in
  `test/screens/settings_screen_test.dart` assert the panel is reachable
  via the real `showPauseQuitDialog` → tap "Settings" navigation, not just
  a direct construction. Verified live on-device: screenshot
  `24-settings-wallet-panel-via-pause-dialog-FIXED.png`.

## Files Touched

- `apps-native/games/ludo/lib/src/net/ludo_gateway.dart` (extended)
- `apps-native/games/ludo/lib/src/state/ludo_wallet_state.dart`
- `apps-native/games/ludo/lib/src/state/ludo_offline_xp_queue.dart`
- `apps-native/games/ludo/lib/src/screens/home_lobby_screen.dart` (HUD;
  also wires `walletState`/`gateway`/`authController` through
  `_launchOnlineMatch`)
- `apps-native/games/ludo/lib/src/screens/settings_screen.dart` (profile/
  level display)
- `apps-native/games/ludo/lib/src/screens/pause_quit_dialog.dart` (threads
  `wallet` through to `SettingsScreen`, fixing the verifier-reported
  unreachable-panel gap)
- `apps-native/games/ludo/lib/src/screens/results_screen.dart` (wires
  `walletState`/`gateway`/`authController` through `_defaultRematch`)
- `apps-native/games/ludo/lib/src/screens/game_board_screen.dart` (derives
  the level-up reward from a wallet balance diff instead of a
  backend-only field)
- `apps-native/games/ludo/test/state/ludo_wallet_state_test.dart`
- `apps-native/games/ludo/test/state/ludo_offline_xp_queue_test.dart`
- `apps-native/games/ludo/test/screens/game_board_screen_xp_test.dart`
  (new: exercises `_submitMatchXp` end to end)
- `apps-native/games/ludo/test/goldens/wallet_hud*.png` (new goldens)

## Acceptance Criteria (objective)

- HUD chips render coin/diamond/level values from the gateway response,
  verified by a widget test with a fixture wallet state.
- An XP claim crossing a level boundary triggers the level-up celebration
  exactly once per crossing, verified by a test; reduced motion shows a
  static equivalent, verified by a golden.
- A queued offline XP delta is retried and cleared on the next successful
  gateway call, verified by a test with a mocked gateway that fails once
  then succeeds.
- Device evidence for the three scenarios in the checklist exists under
  `.agents/resources/2026-09-28/ludo-visual-qa/26e/`.

## Verification Commands

- `bun run games:format -- --check`
- `bun run games:analyze -- --app ludo`
- `bun run games:test -- --app ludo`
- `bun run games:validate -- --strict`
- `bun run games:run -- --app ludo --device-id RZ8R32EAB7T` (device evidence capture)

## Out of Scope

- Store/inventory purchase UI (task 26g).
- Rewarded-ads UI and daily-reward calendar UI (task 26h) — this task only
  wires the daily-reward *claim* method on the gateway, not its screen.
- Any backend route changes.

## Commit message

`feat(ludo): add client wallet/progression state, HUD, and level-up celebration [15-ludo-launch/26e]`
