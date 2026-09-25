---
epic: 16-games-portfolio-wave2
task: 21-human-logo-and-art-pick
status: pending
commit_scope: merge-relay
owner: human
depends_on: [16-games-portfolio-wave2/20-mr-art-set-dry-run]
estimate: S
---

# HUMAN: pick the Merge Relay logo and art direction

**The workflow stops here.**

## Inputs to review

- `.agents/resources/2026-09-25/merge-relay-art/logo/` (contact sheet and
  mockups).
- `.agents/resources/2026-09-25/merge-relay-art/set-1/` (contact sheet and
  mockups).

## Checklist

- [ ] Pick an icon direction and a wordmark direction. Mixing is allowed
      (e.g. icon A + wordmark B).
- [ ] Pick art direction A or B, with any refinement notes.
- [ ] Record the picks in `tasks/epics/16-games-portfolio-wave2/decisions.md`
      (`mr_icon`, `mr_wordmark`, `mr_art_direction`, `mr_art_notes`) and in
      `.agents/games/merge-relay/decisions-log.md`.
- [ ] Mark task 21 `[x]` in STATUS.md, then commit and resume at task 22.

## Acceptance Criteria

- `decisions.md` contains non-empty `mr_icon`, `mr_wordmark`, and `mr_art_direction`.

## Commit message

`docs(merge-relay): record logo and art direction picks [16-games-portfolio-wave2/21]`
