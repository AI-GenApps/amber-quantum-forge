# Phase 2 — Competitor study

Design against evidence, not memory. The user judges quality by comparing with the
competitor on the same phone ("exactly or better than Ludo King"), so capture it there.

## Where things live

- Existing studies: `.agents/resources/<date>/<game>-reference/` (e.g.
  `.agents/resources/2026-09-19/ludo-reference/`: 91 screenshots, `study.md`, `manifest.json`).
  Always check for one before capturing again.
- New captures: `.agents/resources/<YYYY-MM-DD>/<competitor>-<topic>/`.

## Device capture protocol (adb only)

```bash
S=<serial>
adb -s $S exec-out screencap -p > NN-name.png           # capture
adb -s $S shell uiautomator dump /sdcard/ui.xml && adb -s $S pull /sdcard/ui.xml   # find bounds
adb -s $S shell input tap X Y                            # tap (coords in device pixels)
adb -s $S shell input keyevent KEYCODE_BACK              # back / KEYCODE_HOME
adb -s $S shell monkey -p <package> -c android.intent.category.LAUNCHER 1          # launch
```
- View every capture with the Read tool before moving on; the device screen is 1080x2400
  on the Ludo phone — images display scaled, multiply coordinates accordingly.
- Save EVERY capture (including navigation/intermediate ones), numbered: `01-home.png`, …
- Competitor apps are ad- and offer-heavy: expect interstitials; record them (they are
  evidence of what NOT to copy) and dismiss via the close button bounds from uiautomator.
- If the competitor runs in a separate Claude session, that session must ask you before
  using the phone and message "phone free" after. You arbitrate device access.

## Capture list (minimum)

First run/onboarding · home/lobby · every mode selector · setup (players, colors,
difficulty) · board at start · after a roll · movement · capture · reaching home ·
turn indicator/timer · in-game menu/pause/quit · results/win screen · settings ·
how-to-play/rules/tutorial · store/offers (for reference only) · profile/levels/rewards.

## Rules & scoring research

1. Evidence first (screens): what's shown (scores? timers? capture counters?).
2. Official sources second: developer blog/FAQ/help center, tutorial videos (transcripts),
   store release notes. Then community sources.
3. Classify every rule: **CONFIRMED** (official or multiple independent sources),
   **REPORTED** (single/unofficial), **UNKNOWN**. Flag contradictions (e.g. a blog claiming
   "race to 100 points" vs the official "one token home + one capture" Quick rule).
4. Never ship an invented rule for a named mode — if unknown, ask the user or define it
   explicitly as your own variant with a different name.

Ludo King findings for reuse: Classic has no points; Quick = 2 of 4 tokens pre-released,
win = one token home AND ≥1 capture (official Gametion blog); Mask = virus tiles, 14-turn
quarantine. Full write-up: `.agents/resources/2026-09-25/ludo-king-points/README.md`.

## Docs format

`README.md`: purpose, device/app version/date, file table (file · what it shows · how
reached · finding supported), findings split CONFIRMED / REPORTED / UNKNOWN with source
URLs, gaps and suggested next captures. `manifest.json`: array of
`{file, screen, steps, notes}`. Commit the folder.

## Style anchors

Pick 2–3 captures that define the visual target (e.g. board screen + lobby) and name them
in `.agents/resources/<date>/<game>-visual-reference/README.md` with a short description of
the target look. Every visual task and verifier points at that README.
