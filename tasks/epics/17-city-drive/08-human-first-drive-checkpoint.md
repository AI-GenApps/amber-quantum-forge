---
epic: 17-city-drive
task: 08-human-first-drive-checkpoint
status: pending
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

- [ ] `bun install && bun run city-drive:dev`, then open `http://localhost:4010` on desktop.
- [ ] Open the same URL on an Android phone on the LAN (`http://<server-ip>:4010`;
      Vite must listen on `0.0.0.0`), ideally a **low-end** device. Note the FPS
      with `?fps` (add the flag first if missing; otherwise use the browser's
      performance overlay).
- [ ] Drive for 5 minutes. Judge:
  - [ ] Handling: too twitchy or too floaty? Does it drift?
  - [ ] Camera comfort.
  - [ ] Touch-control placement and size.
  - [ ] City readability and scale.
  - [ ] Fog distance.
  - [ ] Does it flip or get stuck?
- [ ] Decide: keep the Kenney look as-is, or ask for a palette/material pass
      (flat colours, outline, time of day).
- [ ] Record the decisions and a fix list in `.agents/games/city-drive/decisions-log.md`.
      If fixes are needed, add `07a-*.md` task files (or ask Claude to write
      them) and add them to STATUS.md and the workflow args before resuming.
- [ ] Mark this task `[x]` in STATUS.md, commit
      (`docs(city-drive): record first-drive checkpoint [17-city-drive/08]`),
      then resume the workflow with `startAt: "09"` (or the first fix task).

## Acceptance Criteria

- The decisions log has a dated entry with the device(s), FPS observed, and
  the verdict for each judged item above.
