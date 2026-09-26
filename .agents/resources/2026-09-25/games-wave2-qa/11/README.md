# Task 11 — Merge Relay: home, chapter map, results, pause, settings restyle

Evidence for `tasks/epics/16-games-portfolio-wave2/11-mr-screens-restyle.md`.

## What changed

- **Home**: wordmark header (`logoWide` slot), a hero scene (`homeScene` slot,
  code-drawn stacked-character-tile fallback), a primary Continue/Play
  button, a Rescue-progress row that opens the new chapter map, a
  Daily/Endless card pair (Daily shows today's state, Endless shows the
  best-ever score), a campaign-progress bar, and a 6-chapter preview strip.
- **Chapter map** (`lib/src/screens/merge_relay_chapter_map.dart` +
  `merge_relay_chapter_card.dart` + `merge_relay_chapter_node.dart`, new):
  a full screen replacing the old "Rescue paths" bottom sheet — 6 chapter
  cards, each with its 10 board nodes (cleared/current/locked), an
  unlock-rule hint, opens centred on the player's current chapter.
- **Result**: a hero panel with the run's best tile painted as a real
  character tile, `Score`/`Best tile`/`Moves` stat pills, the contextual
  primary action (`Next path` / `Try again` / `New run` / `Play again`), a
  `Replay` action on a Rescue win, an `isNewEndlessBest` "New best!" pill,
  and the same campaign-progress + chapter-strip footer as Home.
- **Pause**: every action is now an `MrButton` (was `FilledButton`/
  `TextButton`) — Resume, Restart run (`MrDialog` confirmation, was
  `AlertDialog`), Finish here, **Settings** (added per the task's spec),
  and Home. The pause overlay was reworked to cover the full board+lower-
  tray region instead of just the board's own square: at the board's size
  alone, the panel had no room for all 5 actions and was silently clipping
  "Settings"/"Home" off the bottom with no visible scroll affordance — a
  bug this task's own review caught and fixed by re-measuring the panel
  against `tester.getRect` and finding real buttons laid out below the
  visible frame.
- **Settings**: `SwitchListTile`/`ChoiceChip`/`OutlinedButton` replaced with
  design-system rows/pills/`MrButton`s; renamed "Haptics" → "Vibration" per
  the task's checklist; added a content-version line.
- **Play screen recomposition**: the board is now sized by the actual space
  left after a compact HUD (goal + score/best/moves) rather than centred in
  a big `Expanded` (which produced the ~20% empty bands the task's review
  found) — the board shrinks first under a tight viewport, and a capped,
  populated lower "control tray" (accessible move controls, or the swipe
  hint + moves-remaining note) gets the rest, with any further leftover
  distributed as small top/bottom margins instead of one large blank band.

## Verification

- `bun run games:format:check` — pass
- `bun run games:analyze -- --app merge_relay` — pass, no issues
- `bun run games:test -- --app merge_relay` — pass, **227** tests (≥ task
  10's 215), ~19s
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug` — pass, `app-debug.apk` built
- Device check: **NOT RUN** (no physical device on this server)

## Blank-band measurements

Measured with Pillow: for each row, sample every 5th pixel across the row
and compare to that row's own left-edge (x=6) reference colour (not a
single global sample — `MrBackground`'s radial vignette makes the true
background colour vary slowly by row) — this treats a row as "flat
background" only when every sampled pixel matches its own row's edge
colour, so it correctly ignores the dot texture and the vignette while
still catching real UI content. Bands ≤5px are ignored (antialiasing).

| Golden | Largest flat-background band |
|---|---|
| `home.png` | 3.7% (limit 25%) |
| `home_small.png` (360×640) | none (content fills the viewport) |
| `play_rescue.png` | 3.7% (limit 20%) |
| `play_endless.png` | 3.7% (limit 20%) |
| `result_win.png` | 3.7% |
| `result_loss.png` | 3.7% |
| `chapter_map.png` | 3.7% |
| `pause.png` | 3.7% |
| `settings.png` | 4.7% |

All comfortably under both stated thresholds.

## Files

- `goldens/` — every screen golden from
  `apps-native/games/merge_relay/test/goldens/screens/` as of this task
  (home, home_small, chapter_map, tutorial [unchanged, task 12 scope],
  play_rescue, play_endless, result_win, result_loss, pause, settings).
- `before-after/home_play_result_before_after.png` — a contact sheet
  comparing the 2026-09-25 portfolio-audit renders
  (`.agents/resources/2026-09-25/games-portfolio-audit/renders/`, the
  pre-epic baseline) against this task's Home/Play/Result goldens.

## Known follow-ups (out of scope here)

- Bitmap art for `homeScene`/`logoWide`/tile faces ships in tasks 20/23; all
  slots currently render their code-drawn fallbacks.
- Tutorial/how-to-play screen restyle is task 12.
- The app's final name (task 18) — "MERGE RELAY" is kept as placeholder
  title text per the task's Out of Scope note.
