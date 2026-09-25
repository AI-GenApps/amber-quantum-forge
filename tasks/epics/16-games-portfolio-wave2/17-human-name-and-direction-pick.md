---
epic: 16-games-portfolio-wave2
task: 17-human-name-and-direction-pick
status: pending
commit_scope: games
owner: human
depends_on: [16-games-portfolio-wave2/16-heist-name-candidates]
estimate: S
---

# HUMAN: pick the Merge Relay name and the Pocket Biome art direction

**The workflow stops here.** No agent can make these choices.

## Goal

Record the user's choices so that the workflow can resume at task 18.

## Inputs to review

- The Merge Relay name shortlist:
  `.agents/resources/2026-09-25/merge-relay-brand/name-check.md`.
- The Pocket Biome dry run:
  `.agents/resources/2026-09-25/pocket-biome-art/dry-run/` (`contact-sheet.png`,
  `mockup-A/B/C.png`, and the cost sheet in `README.md`).
- The Heist rename shortlist (optional to decide now):
  `.agents/resources/2026-09-25/heist-brand/name-check.md`.
- Current Merge Relay screens: the goldens under
  `apps-native/games/merge_relay/test/goldens/screens/`, plus the evidence
  from tasks 07–13 in `.agents/resources/2026-09-25/games-wave2-qa/`.

## Checklist (human; an orchestrator session may record the answers)

- [ ] Choose the Merge Relay name (or ask for another round of candidates).
- [ ] Choose the Pocket Biome direction A/B/C (or "none yet"). Final Pocket
      Biome art is **not** part of this epic.
- [ ] Optionally choose the Heist name.
- [ ] Give any visual feedback on the goldens. If there is any, the
      orchestrator turns it into a new spec task (e.g. `17a-…`) before
      resuming.
- [ ] Record the choices, dated, in
      `.agents/games/{merge-relay,pocket-biome,sixty-second-heist}/decisions-log.md`
      and `tasks/epics/16-games-portfolio-wave2/decisions.md` (new
      file: `merge_relay_name: <name>`, `pocket_biome_direction: <A|B|C|none>`,
      `heist_name: <name|deferred>`).
- [ ] Mark task 17 `[x]` in STATUS.md, then commit and resume the workflow at 18.

## Acceptance Criteria

- `decisions.md` exists and contains a non-empty `merge_relay_name` that
  appears in the shortlist marked NOT FOUND.

## Commit message

`docs(games): record wave-2 name and art-direction decisions [16-games-portfolio-wave2/17]`
