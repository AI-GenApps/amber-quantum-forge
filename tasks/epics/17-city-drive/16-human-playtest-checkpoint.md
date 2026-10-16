---
epic: 17-city-drive
task: 16-human-playtest-checkpoint
status: completed
commit_scope: city-drive
depends_on: [17-city-drive/15-performance-pass]
estimate: S
owner: human
---

# HUMAN: full browser playtest checkpoint

## Goal

Play the complete v1 loop in browsers (desktop, plus a phone on the LAN)
before native packaging and branding.

## Checklist

- [x] `bun run city-drive:dev`. Open it on desktop and on a phone (preferably
      a low-end Android) via `http://<server-ip>:4010`. Use `?fps` for the
      overlay.
- [x] Fresh start: onboarding, the first mission, results, coins, and the garage.
- [x] Play at least 8 missions across all 4 types; unlock district 2. Use the
      `?debug` coin/star grant if one exists; otherwise ask Claude to add a
      dev-only cheat.
- [x] Judge and note:
  - [x] fun and difficulty of each mission type
  - [x] traffic believability
  - [x] UI clarity and fonts
  - [x] audio mix
  - [x] FPS on the phone
  - [x] any crashes, stuck states, or save issues (reload mid-mission)
- [x] Record a dated verdict and a fix list in `.agents/games/city-drive/decisions-log.md`.
      Add fix tasks `15a-*.md` and so on if needed, and add them to STATUS.md
      and the workflow args.
- [x] Mark this task `[x]` in STATUS.md, commit
      (`docs(city-drive): record playtest checkpoint [17-city-drive/16]`),
      and resume with `startAt: "17"` (or the first fix task).

## Acceptance Criteria

- The decisions log has the devices, FPS, a verdict per item, and the fix list
  (or "none").

## Owner sign-off (2026-10-16)

Signed off by the owner after browser playtests over Tailscale (`http://<tailscale-ip>:4010`).
Owner feedback, verbatim: "The game looks good but the roads are not continuous" (fixed in task
16a, commit 57f7396), then "roads look continuous now, mark 08 and 16 done". The owner gave no
per-item notes (handling, traffic, audio, FPS numbers), so none are recorded here; the Kenney look
is kept as-is. Device FPS and performance numbers are collected at task 22.
