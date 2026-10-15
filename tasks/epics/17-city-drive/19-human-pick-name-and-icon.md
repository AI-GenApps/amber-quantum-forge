---
epic: 17-city-drive
task: 19-human-pick-name-and-icon
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/18-name-candidates-and-icon-dry-run]
estimate: S
owner: human
---

# HUMAN: pick the name + icon direction

## Checklist

- [ ] Review `.agents/resources/2026-10-15/city-drive-qa/18/README.md` (the
      names and the icon contact sheet).
- [ ] Pick one name, one icon direction, and one variant. Note any changes
      (colour, angle).
- [ ] Record the choice in `tasks/epics/17-city-drive/decisions.md` (create
      it) and `.agents/games/city-drive/decisions-log.md`.
- [ ] Mark this task `[x]` in STATUS.md, commit
      (`docs(city-drive): record name and icon pick [17-city-drive/19]`),
      and resume with `startAt: "20"`.

## Acceptance Criteria

- `decisions.md` names the chosen title and icon draft file, with any
  requested changes.
