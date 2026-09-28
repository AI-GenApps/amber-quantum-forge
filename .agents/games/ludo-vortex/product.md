# Ludo Vortex — product

## One-liner

A premium, ad-light Ludo game: roll, race, and capture against smart bots, friends on one
phone, or players online — with Classic and Quick modes, levels, and collectible dice,
token, and board themes.

## Modes (v1)

| Mode | Players | Status |
|---|---|---|
| vs Computer (Easy / Medium / Hard bots) | 2 or 4 | built (local) |
| Pass N Play (one phone) | 2–4 | built (local) |
| Play with Friends (private room code / invite link) | 2–4 | built (tasks 21, 26, 26x); real backend pending task 29 provisioning |
| Online (random matchmaking, bot-fill if no players) | 2 or 4 | built (tasks 20, 25, 26, 26x); real backend pending task 29 provisioning |
| Online coin tables (coin stakes) | 2 or 4 | planned (task 26c) |

Each mode offers **Classic** or **Quick** rules.

## Rules — Classic (matches Ludo King Classic)

- Board: 52-square shared track, 6-square colored home stretch per color, 4 tokens each.
- A **6** is needed to bring a token out of the yard.
- Rolling a 6 gives an extra roll; **three 6s in a row forfeit** the turn.
- Landing on an opponent (not on a safe square) **captures** it back to its yard and gives a
  **bonus roll**; getting a token home also gives a bonus roll.
- Safe squares: start squares + star squares (no captures there).
- **No blockades** (two tokens don't block).
- Exact roll needed to reach home. No legal move → turn passes automatically.
- Win: first player with all 4 tokens home.

## Rules — Quick (matches Ludo King's official Quick Mode)

- Each player starts with **2 of 4 tokens already out** on their start square; the other 2
  are in the yard (a 6 still releases them). Full-length route.
- **Win = get ONE token home AND have captured at least one opponent** during the match.
  If a token is home before the first capture, the win triggers at the moment of the capture.
- Match ends at the first winner; others ranked by tokens home, then captures, then progress.
- All other Classic rules apply. No points system (Ludo King has none in Classic/Quick).
- Source: Gametion official blog — `.agents/resources/2026-09-25/ludo-king-points/README.md`.
- Implementation: task 12g (in progress 2026-09-25).

## Bots

Easy (random legal), Medium, Hard (priority: finish > capture > leave yard > avoid danger >
farthest). In Quick, medium/hard prioritize getting a capture. Seeded full-match tests
(≥50 games per mode/player count) guarantee every game reaches results.

## Online (built client-side; real backend pending task 29)

Server-authoritative: moves validated and dice rolled on our server (Hono + Postgres);
live updates via Firestore with a polling fallback; turn timer ~30 s, auto-move on
timeout, forfeit after 3 misses; reconnect; bots fill empty/disconnected seats.
Identity: guest (Firebase anonymous) with optional Google account linking. The client
side of all of this (rooms, matchmaking, reconnect handling, deep links) is built and
device-verified (tasks 24–26, 26x); it only needs a real Firebase project + API
deployment (task 29) to go live — until then the "Online"/"Play with Friends" lobby
tiles stay disabled on a real build, exactly as task 08 specified.

### Debug-only online preview mode (task 26x)

Since task 29's real backend isn't provisioned yet, `LudoOnlinePreviewMode`
(`lib/src/net/ludo_online_preview_mode.dart`) lets a `kDebugMode` build exercise the
entire online flow — room create/join/share, matchmaking (human-match or bot-fill,
alternating), room-fill, and the resulting match — against a fake in-process
transport (`createLudoPreviewOnlineClient`, `lib/src/net/ludo_preview_online.dart`)
that scripts every transition on real `Timer`s so it's genuinely walkable live on a
device — including a one-time scripted disconnect/reconnect blip mid-match, shown via
the themed `LudoReconnectingBanner`
(`lib/src/widgets/ludo_reconnecting_banner.dart`), backed by a new
`LudoMatchStateSource.connected` stream every match-state source implements. It is
compiled out of release builds (same `kDebugMode`-guard pattern as task 12a's "Debug:
All Bots Demo"). Two entry points arm it for the current app session:
- A toggle in Settings ("Debug: Online preview mode", debug builds only).
- A long-press on the home lobby's logo.
Evidence: `.agents/resources/2026-09-28/ludo-visual-qa/26x/`.

## Screens

Splash · onboarding (welcome, name + avatar, interactive tutorial, skip) · home lobby ·
mode setup (Classic/Quick, players, colors, bot difficulty) · game board (corner player
cards, dice box, pause) · pause/quit (sound/music/vibration toggles) · results + rematch ·
settings (sound, music, vibration, reduced motion, tutorial replay, debug online-preview
toggle) · how to play · resume after app restart · Play with Friends (create/join room,
legible room code with copy/share) · matchmaking search (themed dice/ring searching
indicator, bot-filled seat labeling) · join errors (invalid/expired code, themed dialog).
Planned: store, inventory, profile/level, daily rewards.

## Audio & feel

CC0 SFX (roll, step, capture, home, win, button, turn alert) + music loop; haptic
patterns; dice tumble, token hop animation, capture/home/win particles; reduced-motion option.

## Tech

Flutter 3.47 / Dart 3.13, Flame; pure Dart rules package with replay fixtures (the
server engine must match them); telemetry via `platform_core`; tests: unit, widget,
golden, full-match simulations; device QA on Samsung A52.

## Accessibility

Semantics labels on all controls, 48dp tap targets, reduced motion, color + label for
the active player (not color alone).
