---
epic: 17-city-drive
task: 08-human-first-drive-checkpoint
status: completed
commit_scope: city-drive
depends_on: [17-city-drive/07-player-car-controls-camera]
estimate: S
owner: human
---

# HUMAN: first-drive checkpoint (browser, desktop + phone)

## Goal

A human judges the look and feel before traffic, missions, and UI are built
on top. This is the cheapest point to change the art direction, handling, or
camera.

## Checklist

- [x] `bun install && bun run city-drive:dev`, then open `http://localhost:4010` on desktop.
- [x] Open the same URL on an Android phone on the LAN (`http://<server-ip>:4010`;
      Vite must listen on `0.0.0.0`), ideally a **low-end** device. Note the FPS
      with `?fps` (add the flag first if missing; otherwise use the browser's
      performance overlay).
- [x] Drive for 5 minutes. Judge:
  - [x] Handling: too twitchy or too floaty? Does it drift?
  - [x] Camera comfort.
  - [x] Touch-control placement and size.
  - [x] City readability and scale.
  - [x] Fog distance.
  - [x] Does it flip or get stuck?
- [x] Decide: keep the Kenney look as-is, or ask for a palette/material pass
      (flat colours, outline, time of day).
- [x] Record the decisions and a fix list in `.agents/games/city-drive/decisions-log.md`.
      If fixes are needed, add `07a-*.md` task files (or ask Claude to write
      them) and add them to STATUS.md and the workflow args before resuming.
- [x] Mark this task `[x]` in STATUS.md, commit
      (`docs(city-drive): record first-drive checkpoint [17-city-drive/08]`),
      then resume the workflow with `startAt: "09"` (or the first fix task).

## Acceptance Criteria

- The decisions log has a dated entry with the device(s), FPS observed, and
  the verdict for each judged item above.

## Owner sign-off (2026-10-16)

Signed off by the owner after browser playtests over Tailscale (`http://<tailscale-ip>:4010`).
Owner feedback, verbatim: "The game looks good but the roads are not continuous" (fixed in task
16a, commit 57f7396), then "roads look continuous now, mark 08 and 16 done". The owner gave no
per-item notes (handling, traffic, audio, FPS numbers), so none are recorded here; the Kenney look
is kept as-is. Device FPS and performance numbers are collected at task 22.
